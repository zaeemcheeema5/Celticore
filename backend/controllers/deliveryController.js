const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("../db");
const {
    round2,
    loadDeliveryMethods,
    loadFreeDeliveryRule,
    loadDeliveryNotice,
    loadCheckoutMethodCode,
    ONLY_CHECKOUT_METHOD,
    quoteCheckoutDelivery
} = require("../utils/delivery");
const { COURIER_OPTIONS } = require("../services/courierService");

const dbGet = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
        });
    });

/*
=====================================
POST /api/delivery/quote   (public — guests can check out)
=====================================
Body: { items: [{ id, quantity }], couponCode? }

Returns the server-calculated product subtotal, coupon discount and the
delivery charge that applies to the order (fixed nationwide fee, or FREE when
the order reaches the free-delivery minimum). The checkout page shows exactly these numbers — nothing is
calculated from browser-supplied prices.
*/
exports.getQuote = async (req, res) => {

    const { items, couponCode } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Your cart is empty." });
    }

    try {

        // Imported lazily so this file never creates a circular require with
        // orderController at load time.
        const { recomputeOrderPricing } = require("./orderController");

        const pricing = await recomputeOrderPricing(
            items.map((i) => ({
                product_id: i && i.id,
                quantity: i && i.quantity
            })),
            couponCode
        );

        const goodsTotal = round2(Math.max(0, pricing.subtotal - pricing.discount));
        const quote = await quoteCheckoutDelivery(goodsTotal);

        res.json({
            success: true,
            currency: "EUR",
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            goodsTotal,
            // The one delivery option applied to every order (customers do
            // not choose a method).
            delivery: quote.delivery,
            total: round2(goodsTotal + quote.delivery.fee),
            notice: quote.notice,
            freeDelivery: quote.freeDelivery
        });

    } catch (err) {

        if (err && err.status) {
            return res.status(err.status).json({ error: err.message });
        }

        console.error("Delivery quote error:", err);
        res.status(500).json({ error: "Could not calculate delivery." });
    }
};

/*
=====================================
GET /api/delivery/admin/config   (admin only)
=====================================
*/
exports.getAdminConfig = async (req, res) => {

    try {

        const [methods, freeDelivery, checkoutMethod, deliveryNotice] = await Promise.all([
            loadDeliveryMethods({ includeDisabled: true }),
            loadFreeDeliveryRule(),
            loadCheckoutMethodCode(),
            loadDeliveryNotice()
        ]);

        res.json({
            success: true,
            currency: "EUR",
            methods,
            freeDelivery,
            checkoutMethod,
            deliveryNotice,
            couriers: COURIER_OPTIONS
        });

    } catch (err) {
        console.error("Delivery config load error:", err);
        res.status(500).json({ error: "Could not load delivery settings." });
    }
};

/*
=====================================
PUT /api/delivery/admin/config   (admin only)
=====================================
Body: {
  methods: [{ code, name, description, fee, estMinDays, estMaxDays,
              freeEligible, isEnabled }],
  freeDelivery: { enabled, threshold }
}
Only the existing methods (standard / express = Next-Day) can be edited —
codes are fixed so old orders always still map to a known method.
`checkoutMethod` = which method is applied to every order (customers don't choose).
*/
exports.updateAdminConfig = async (req, res) => {

    const { methods, freeDelivery, checkoutMethod, deliveryNotice } = req.body || {};

    try {

        const existing = await loadDeliveryMethods({ includeDisabled: true });
        const existingCodes = new Set(existing.map((m) => m.code));

        const updates = [];

        if (methods !== undefined) {

            if (!Array.isArray(methods) || methods.length === 0) {
                return res.status(400).json({ error: "'methods' must be a non-empty array." });
            }

            for (const m of methods) {

                const code = String((m && m.code) || "").toLowerCase();
                if (!existingCodes.has(code)) {
                    return res.status(400).json({ error: `Unknown delivery method: ${code || "(missing)"}` });
                }

                const name = String(m.name || "").trim().slice(0, 100);
                const description = String(m.description || "").trim().slice(0, 255);
                const estimateText = String(m.estimateText || "").trim().slice(0, 255);
                const fee = Number(m.fee);
                const minDays = Number(m.estMinDays);
                const maxDays = Number(m.estMaxDays);

                if (!name) {
                    return res.status(400).json({ error: `${code}: name is required.` });
                }
                if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
                    return res.status(400).json({ error: `${name}: fee must be between 0 and 1000 EUR.` });
                }
                if (!Number.isInteger(minDays) || !Number.isInteger(maxDays) ||
                    minDays < 0 || maxDays > 60 || minDays > maxDays) {
                    return res.status(400).json({
                        error: `${name}: estimated days must be whole numbers (min ≤ max, max ≤ 60).`
                    });
                }

                // BUSINESS RULE: Next-Day (express) is the ONLY method. It is always
                // enabled; every other method (Standard) is always disabled and
                // cannot be re-enabled from here.
                const forcedEnabled = code === ONLY_CHECKOUT_METHOD ? 1 : 0;

                updates.push({
                    code,
                    name,
                    description,
                    estimateText,
                    fee: round2(fee),
                    minDays,
                    maxDays,
                    freeEligible: m.freeEligible ? 1 : 0,
                    isEnabled: forcedEnabled
                });
            }

        }

        // The method applied to every order must exist and stay enabled,
        // otherwise nobody could check out.
        const finalState = existing.map((e) => {
            const u = updates.find((x) => x.code === e.code);
            return { code: e.code, isEnabled: u ? u.isEnabled === 1 : e.isEnabled };
        });
        const currentCheckout = await loadCheckoutMethodCode();
        const newCheckout = checkoutMethod !== undefined
            ? String(checkoutMethod || "").toLowerCase()
            : currentCheckout;

        if (newCheckout !== ONLY_CHECKOUT_METHOD) {
            return res.status(400).json({
                error: "Next-Day Delivery is the only delivery method and cannot be changed."
            });
        }
        const chosen = finalState.find((m) => m.code === newCheckout);

        if (!chosen) {
            return res.status(400).json({ error: "The checkout delivery method does not exist." });
        }
        if (!chosen.isEnabled) {
            return res.status(400).json({
                error: "The delivery method used at checkout must be enabled, otherwise customers cannot check out."
            });
        }

        let noticeToSave;
        if (deliveryNotice !== undefined) {
            noticeToSave = String(deliveryNotice || "").trim().slice(0, 300);
        }

        let freeEnabled;
        let freeThreshold;

        if (freeDelivery !== undefined) {
            freeEnabled = freeDelivery && freeDelivery.enabled ? "1" : "0";
            const threshold = Number(freeDelivery && freeDelivery.threshold);
            if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100000) {
                return res.status(400).json({ error: "Free delivery minimum order must be a number of 0 or more." });
            }
            freeThreshold = String(round2(threshold));
        }

        for (const u of updates) {
            await run(
                `UPDATE delivery_methods
                 SET name = ?, description = ?, estimate_text = ?, fee = ?, est_min_days = ?, est_max_days = ?,
                     free_eligible = ?, is_enabled = ?
                 WHERE code = ?`,
                [u.name, u.description, u.estimateText || null, u.fee, u.minDays, u.maxDays, u.freeEligible, u.isEnabled, u.code]
            );
        }

        if (freeEnabled !== undefined) {
            await run("REPLACE INTO settings (`key`, value) VALUES ('free_delivery_enabled', ?)", [freeEnabled]);
            await run("REPLACE INTO settings (`key`, value) VALUES ('free_delivery_threshold', ?)", [freeThreshold]);
        }

        if (checkoutMethod !== undefined) {
            await run("REPLACE INTO settings (`key`, value) VALUES ('checkout_delivery_method', ?)", [newCheckout]);
        }
        if (noticeToSave !== undefined) {
            await run("REPLACE INTO settings (`key`, value) VALUES ('delivery_notice', ?)", [noticeToSave]);
        }

        const [freshMethods, freshFree, freshCheckout, freshNotice] = await Promise.all([
            loadDeliveryMethods({ includeDisabled: true }),
            loadFreeDeliveryRule(),
            loadCheckoutMethodCode(),
            loadDeliveryNotice()
        ]);

        res.json({
            success: true,
            message: "Delivery settings saved.",
            methods: freshMethods,
            freeDelivery: freshFree,
            checkoutMethod: freshCheckout,
            deliveryNotice: freshNotice
        });

    } catch (err) {
        console.error("Delivery config save error:", err);
        res.status(500).json({ error: "Could not save delivery settings." });
    }
};

/*
=====================================
MANUAL DPD SHIPPING LABELS (admin only)
=====================================
DPD API access has not been confirmed for this client, so labels are NOT
generated here. The admin creates the label in the DPD portal, then uploads
the PDF/PNG/JPG to the order and prints it from the admin panel.

Files are kept in a PRIVATE folder (never served statically) and can only be
read through the admin-authenticated endpoint below. Labels contain the
customer's name and address.
*/
const LABEL_DIR = process.env.LABEL_STORAGE_DIR
    ? path.resolve(process.env.LABEL_STORAGE_DIR)
    : path.join(__dirname, "..", "private_labels");

const LABEL_MAX_BYTES = 5 * 1024 * 1024;

// Identify the real file type from its first bytes (not from the file name
// or the browser-supplied type, which can be faked).
function detectLabelType(buf) {
    if (!buf || buf.length < 8) return null;
    if (buf.slice(0, 5).toString("latin1") === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
    if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
    return null;
}

function removeLabelFile(fileName) {
    if (!fileName || !/^[a-f0-9]{32}\.(pdf|png|jpg)$/.test(fileName)) return;
    fs.unlink(path.join(LABEL_DIR, fileName), () => { /* already gone is fine */ });
}
exports.removeLabelFile = removeLabelFile;
exports.LABEL_MAX_BYTES = LABEL_MAX_BYTES;

exports.uploadLabel = async (req, res) => {

    try {

        const order = await dbGet("SELECT id, label_file FROM orders WHERE id = ?", [req.params.id]);
        if (!order) return res.status(404).json({ error: "Order not found." });

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "Choose a label file (PDF, PNG or JPG) to upload." });
        }

        const type = detectLabelType(req.file.buffer);
        if (!type) {
            return res.status(400).json({ error: "Only PDF, PNG or JPG label files are accepted." });
        }

        await fs.promises.mkdir(LABEL_DIR, { recursive: true });

        const fileName = `${crypto.randomBytes(16).toString("hex")}.${type.ext}`;
        await fs.promises.writeFile(path.join(LABEL_DIR, fileName), req.file.buffer, { flag: "wx" });

        try {
            await run(
                "UPDATE orders SET label_file = ?, label_mime = ?, label_uploaded_at = CURRENT_TIMESTAMP WHERE id = ?",
                [fileName, type.mime, order.id]
            );
        } catch (dbErr) {
            removeLabelFile(fileName);
            throw dbErr;
        }

        // Replace: the previous label file is no longer needed.
        if (order.label_file) removeLabelFile(order.label_file);

        const fresh = await dbGet("SELECT label_uploaded_at FROM orders WHERE id = ?", [order.id]);

        res.json({ success: true, message: "Label uploaded.", label_uploaded_at: fresh.label_uploaded_at });

    } catch (err) {
        console.error("Label upload error:", err);
        res.status(500).json({ error: "Could not save the label." });
    }
};

exports.downloadLabel = async (req, res) => {

    try {

        const order = await dbGet("SELECT id, label_file, label_mime FROM orders WHERE id = ?", [req.params.id]);

        if (!order || !order.label_file || !/^[a-f0-9]{32}\.(pdf|png|jpg)$/.test(order.label_file)) {
            return res.status(404).json({ error: "No label has been uploaded for this order." });
        }

        const filePath = path.join(LABEL_DIR, order.label_file);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "The label file is missing on the server. Please upload it again." });
        }

        res.setHeader("Content-Type", order.label_mime || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="dpd-label-order-${order.id}.${order.label_file.split(".")[1]}"`);
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        fs.createReadStream(filePath).pipe(res);

    } catch (err) {
        console.error("Label download error:", err);
        res.status(500).json({ error: "Could not read the label." });
    }
};

exports.deleteLabel = async (req, res) => {

    try {

        const order = await dbGet("SELECT id, label_file FROM orders WHERE id = ?", [req.params.id]);
        if (!order) return res.status(404).json({ error: "Order not found." });

        await run(
            "UPDATE orders SET label_file = NULL, label_mime = NULL, label_uploaded_at = NULL WHERE id = ?",
            [order.id]
        );
        if (order.label_file) removeLabelFile(order.label_file);

        res.json({ success: true, message: "Label removed." });

    } catch (err) {
        console.error("Label delete error:", err);
        res.status(500).json({ error: "Could not remove the label." });
    }
};
