/*
=====================================
DELIVERY HELPERS (Republic of Ireland)
=====================================
Single place for:
  - Irish address + Eircode validation
  - loading the admin-configurable delivery methods / free-delivery rule
  - pricing a delivery method for a given goods total

Everything money-related happens here on the SERVER. The browser only ever
sends a delivery method *code* ("standard" / "express"); the fee, free-delivery
eligibility and final amount are always recalculated from the database.
*/

const db = require("../db");

const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Converts a money amount to integer cents (what Stripe wants).
const toCents = (n) => Math.round(Number(n) * 100);

/*
-------------------------------------
ADDRESS VALIDATION
-------------------------------------
*/

// The 26 counties of the Republic of Ireland.
const IRISH_COUNTIES = [
    "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry",
    "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth",
    "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary",
    "Waterford", "Westmeath", "Wexford", "Wicklow"
];

// Counties of Northern Ireland — rejected with a clear message.
const NI_COUNTIES = ["antrim", "armagh", "down", "fermanagh", "londonderry", "derry", "tyrone"];

/*
Eircode structure (published by Autoaddress / An Post):
  - 3-character ROUTING KEY: one letter + two digits (e.g. A65, D02, T12),
    plus the single special case D6W.
  - 4-character UNIQUE IDENTIFIER: letters/digits.
  - Only 14 letters are ever used: A C D E F H K N P R T V W X Y
    (so B, G, I, J, L, M, O, Q, S, U, Z never appear).
This checks that structure. It deliberately does NOT try to prove the code
exists (that needs a paid address database) — it only rejects values that
cannot possibly be an Eircode.
*/
const EIRCODE_REGEX = /^(?:[AC-FHKNPRTV-Y]\d{2}|D6W)[0-9AC-FHKNPRTV-Y]{4}$/;

function normaliseEircode(value) {
    return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function formatEircode(value) {
    const compact = normaliseEircode(value);
    return compact.length === 7 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact;
}

function isValidEircode(value) {
    return EIRCODE_REGEX.test(normaliseEircode(value));
}

const REPUBLIC_NAMES = new Set([
    "ireland", "republic of ireland", "ie", "eire", "éire", "roi"
]);

function normaliseCounty(value) {
    return String(value || "")
        .trim()
        .replace(/^(co\.?|county)\s+/i, "")
        .trim();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(value) {
    const v = String(value || "").trim();
    if (!/^\+?[0-9][0-9 ()\-]{5,24}$/.test(v)) return false;
    const digits = v.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
}

const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

/**
 * Validates + normalises a delivery address. Returns
 *   { ok: boolean, errors: { field: message }, value: {...cleaned} }
 * `value` always uses the existing orders-table naming
 * (postal_code holds the Eircode).
 */
function validateIrishAddress(input = {}) {
    const errors = {};

    const customerName = clean(input.customerName, 120);
    const customerEmail = clean(input.customerEmail, 160);
    const phone = clean(input.phone, 30);
    const address = clean(input.address, 160);
    const address2 = clean(input.address2, 160);
    const city = clean(input.city, 80);
    const countyRaw = normaliseCounty(clean(input.county, 60));
    const eircodeRaw = clean(input.postalCode, 20);
    const countryRaw = clean(input.country, 60);

    if (!customerName) errors.name = "Full name is required.";
    if (!customerEmail) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(customerEmail)) errors.email = "Enter a valid email address.";

    if (!phone) errors.phone = "Phone number is required.";
    else if (!isValidPhone(phone)) errors.phone = "Enter a valid phone number.";

    if (!address) errors.address = "Address line 1 is required.";
    if (!city) errors.city = "Town / city is required.";

    // Country: only the Republic of Ireland (default when left blank).
    const countryKey = countryRaw.toLowerCase();
    if (countryRaw && !REPUBLIC_NAMES.has(countryKey)) {
        errors.country = /northern ireland|united kingdom|^uk$|^gb$/.test(countryKey)
            ? "We currently deliver to the Republic of Ireland only (Northern Ireland is not supported yet)."
            : "We currently deliver to the Republic of Ireland only.";
    }

    // County
    const county = IRISH_COUNTIES.find((c) => c.toLowerCase() === countyRaw.toLowerCase());
    if (!countyRaw) {
        errors.county = "County is required.";
    } else if (!county) {
        errors.county = NI_COUNTIES.includes(countyRaw.toLowerCase())
            ? "Northern Ireland addresses are not supported yet — Republic of Ireland only."
            : "Select a county in the Republic of Ireland.";
    }

    // Eircode
    if (!eircodeRaw) {
        errors.postalCode = "Eircode is required.";
    } else if (/^BT\s?\d/i.test(eircodeRaw)) {
        errors.postalCode = "Northern Ireland (BT) postcodes are not supported yet — Republic of Ireland only.";
    } else if (!isValidEircode(eircodeRaw)) {
        errors.postalCode = "Enter a valid Eircode (e.g. D02 X285).";
    }

    return {
        ok: Object.keys(errors).length === 0,
        errors,
        value: {
            customerName,
            customerEmail,
            phone,
            address,
            address2,
            city,
            county: county || countyRaw,
            postalCode: formatEircode(eircodeRaw),
            country: "Ireland"
        }
    };
}

/*
-------------------------------------
DELIVERY CONFIGURATION (admin-editable, stored in MySQL)
-------------------------------------
*/

async function loadFreeDeliveryRule() {
    const rows = await query(
        "SELECT `key`, value FROM settings WHERE `key` IN ('free_delivery_enabled','free_delivery_threshold')"
    );
    const map = {};
    rows.forEach((r) => { map[r.key] = r.value; });

    const threshold = Number(map.free_delivery_threshold);
    return {
        enabled: String(map.free_delivery_enabled) === "1",
        threshold: Number.isFinite(threshold) && threshold >= 0 ? threshold : 0
    };
}

async function loadDeliveryMethods({ includeDisabled = false } = {}) {
    const rows = await query(
        `SELECT id, code, name, description, fee, est_min_days, est_max_days, estimate_text,
                free_eligible, is_enabled, sort_order
         FROM delivery_methods
         ${includeDisabled ? "" : "WHERE is_enabled = 1"}
         ORDER BY sort_order ASC, id ASC`
    );
    return rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description || "",
        fee: Number(r.fee) || 0,
        estMinDays: Number(r.est_min_days) || 0,
        estMaxDays: Number(r.est_max_days) || 0,
        estimateText: r.estimate_text || "",
        freeEligible: Number(r.free_eligible) === 1,
        isEnabled: Number(r.is_enabled) === 1
    }));
}

// Price one method against the goods total (subtotal - discount).
function priceMethod(method, goodsTotal, freeRule) {
    const baseFee = round2(method.fee);
    const freeApplied = !!(
        freeRule.enabled &&
        method.freeEligible &&
        goodsTotal >= freeRule.threshold
    );
    const fee = freeApplied ? 0 : baseFee;
    return {
        code: method.code,
        name: method.name,
        description: method.description,
        baseFee,
        fee,
        freeApplied,
        freeEligible: method.freeEligible,
        estMinDays: method.estMinDays,
        estMaxDays: method.estMaxDays,
        estimateText: method.estimateText
    };
}

// Settings keys (stored in the existing `settings` table, editable in
// Admin > Delivery Settings).
async function loadSetting(key, fallback) {
    const rows = await query("SELECT value FROM settings WHERE `key` = ?", [key]);
    return rows.length && rows[0].value !== null && rows[0].value !== "" ? rows[0].value : fallback;
}

const DEFAULT_DELIVERY_NOTICE =
    "Weekend and public holiday delivery depends on courier availability.";

async function loadDeliveryNotice() {
    return loadSetting("delivery_notice", DEFAULT_DELIVERY_NOTICE);
}

// Customers do NOT choose a delivery method. The business decides which one
// is applied to every order; this is its code.
// FINAL BUSINESS RULE: Next-Day Delivery (code "express") is the only method,
// so the code is fixed here and no setting/request can change it.
const ONLY_CHECKOUT_METHOD = "express";

async function loadCheckoutMethodCode() {
    return ONLY_CHECKOUT_METHOD;
}

/**
 * The delivery option applied to every order, priced for this goods total
 * (subtotal - discount). Fixed nationwide fee; free when the free-delivery
 * rule is met. Throws {status, message} if the configured method is missing
 * or disabled — never silently falls back to a different price.
 */
async function resolveCheckoutDelivery(goodsTotal) {
    const [methods, freeRule, code] = await Promise.all([
        loadDeliveryMethods(),
        loadFreeDeliveryRule(),
        loadCheckoutMethodCode()
    ]);

    const method = methods.find((m) => m.code === code);
    if (!method) {
        throw {
            status: 503,
            message: "Delivery is temporarily unavailable. Please contact support."
        };
    }

    return priceMethod(method, goodsTotal, freeRule);
}

/**
 * Checkout quote: the single delivery option + free-delivery progress.
 */
async function quoteCheckoutDelivery(goodsTotal) {
    const [delivery, freeRule, notice] = await Promise.all([
        resolveCheckoutDelivery(goodsTotal),
        loadFreeDeliveryRule(),
        loadDeliveryNotice()
    ]);

    return {
        delivery,
        notice,
        freeDelivery: {
            enabled: freeRule.enabled,
            threshold: freeRule.threshold,
            amountToFree: freeRule.enabled && goodsTotal < freeRule.threshold
                ? round2(freeRule.threshold - goodsTotal)
                : 0,
            available: freeRule.enabled && delivery.freeEligible
        }
    };
}

/*
-------------------------------------
DISPLAY HELPERS (used by emails + order responses)
-------------------------------------
*/

// "2-4 working days" / "1 working day" / "" when nothing is configured.
function formatEstimate(minDays, maxDays) {
    const min = Number(minDays);
    const max = Number(maxDays);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return "";
    if (min === max) return `${max} working day${max === 1 ? "" : "s"}`;
    return `${min}\u2013${max} working days`;
}

function addBusinessDays(from, days) {
    const d = new Date(from);
    let left = Math.max(0, Number(days) || 0);
    while (left > 0) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) left -= 1;
    }
    return d;
}

// "Thu 5 Nov - Mon 9 Nov" counted in working days (Mon-Fri) from `from`.
// Public holidays are not accounted for, so emails word it as an estimate.
function estimatedDeliveryRange(from, minDays, maxDays) {
    const max = Number(maxDays);
    if (!Number.isFinite(max) || max <= 0) return "";
    const fmt = (d) => d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" });
    const a = addBusinessDays(from, Number(minDays) || 0);
    const b = addBusinessDays(from, max);
    return fmt(a) === fmt(b) ? fmt(a) : `${fmt(a)} - ${fmt(b)}`;
}

function formatOrderAddress(order) {
    return [order.address, order.address2, order.city, order.county, order.postal_code, order.country]
        .map((p) => String(p || "").trim())
        .filter(Boolean)
        .join(", ");
}

module.exports = {
    ONLY_CHECKOUT_METHOD,
    formatEstimate,
    addBusinessDays,
    estimatedDeliveryRange,
    formatOrderAddress,
    IRISH_COUNTIES,
    round2,
    toCents,
    isValidEircode,
    formatEircode,
    validateIrishAddress,
    loadDeliveryMethods,
    ONLY_CHECKOUT_METHOD,
    loadFreeDeliveryRule,
    loadDeliveryNotice,
    loadCheckoutMethodCode,
    DEFAULT_DELIVERY_NOTICE,
    quoteCheckoutDelivery,
    resolveCheckoutDelivery
};
