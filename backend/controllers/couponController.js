const db = require("../db");

console.log("Coupon Controller Loaded");

// ==============================
// GET ALL COUPONS
// ==============================
exports.getCoupons = (req, res) => {
    db.all(
        `SELECT * FROM coupons ORDER BY id DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message,
                });
            }

            res.json(rows);
        }
    );
};

// ==============================
// CREATE COUPON
// ==============================
exports.createCoupon = (req, res) => {
    let {
        code,
        discount_type,
        discount_value,
        discountPercent,
        expiry_date,
    } = req.body;

    // Support old frontend format
    if (!discount_type && discountPercent !== undefined) {
        discount_type = "percentage";
        discount_value = discountPercent;
    }

    if (!code || !discount_type || discount_value == null) {
        return res.status(400).json({
            error: "Code, discount type and discount value are required.",
        });
    }

    db.run(
        `
        INSERT INTO coupons
        (code, discount_type, discount_value, expiry_date)
        VALUES (?, ?, ?, ?)
        `,
        [
            code.trim().toUpperCase(),
            discount_type,
            Number(discount_value),
            expiry_date || null,
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message,
                });
            }

            res.json({
                success: true,
                id: this.lastID,
                message: "Coupon created successfully",
            });
        }
    );
};

// ==============================
// DELETE COUPON
// ==============================
exports.deleteCoupon = (req, res) => {
    db.run(
        `DELETE FROM coupons WHERE id = ?`,
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message,
                });
            }

            res.json({
                success: true,
                message: "Coupon deleted successfully",
            });
        }
    );
};

// ==============================
// APPLY COUPON
// ==============================
exports.applyCoupon = (req, res) => {
    const { code } = req.body;
    const subtotal = Number(req.body.subtotal || 0);

    if (!code) {
        return res.status(400).json({
            error: "Coupon code is required.",
        });
    }

    db.get(
        `
        SELECT *
        FROM coupons
        WHERE UPPER(code) = UPPER(?)
        AND is_active = 1
        `,
        [code.trim()],
        (err, coupon) => {
            if (err) {
                return res.status(500).json({
                    error: err.message,
                });
            }

            if (!coupon) {
                return res.status(404).json({
                    error: "Coupon not found.",
                });
            }

            if (
                coupon.expiry_date &&
                new Date(coupon.expiry_date) < new Date()
            ) {
                return res.status(400).json({
                    error: "Coupon expired.",
                });
            }

            let discount = 0;

            if (subtotal > 0) {
                if (coupon.discount_type === "percentage") {
                    discount =
                        (subtotal * Number(coupon.discount_value)) / 100;
                } else if (coupon.discount_type === "fixed") {
                    discount = Number(coupon.discount_value);
                }
            }

            const total = Math.max(subtotal - discount, 0);

            res.json({
                success: true,

                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    discount_type: coupon.discount_type,
                    discount_value: Number(coupon.discount_value),
                    expiry_date: coupon.expiry_date,
                },

                discount,
                subtotal,
                total,

                message: "Coupon applied successfully.",
            });
        }
    );
};