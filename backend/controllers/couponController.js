const db = require('../db');

console.log("Coupon Controller Loaded");

// GET ALL COUPONS
exports.getCoupons = (req, res) => {

    db.all(
        `
        SELECT *
        FROM coupons
        ORDER BY id DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};


// CREATE COUPON
exports.createCoupon = (req, res) => {

    const {
        code,
        discount_type,
        discount_value,
        expiry_date
    } = req.body;

    db.run(
        `
        INSERT INTO coupons
        (
            code,
            discount_type,
            discount_value,
            expiry_date
        )
        VALUES (?,?,?,?)
        `,
        [
            code,
            discount_type,
            discount_value,
            expiry_date
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                id: this.lastID,
                message: 'Coupon created successfully'
            });
        }
    );
};


// DELETE COUPON
exports.deleteCoupon = (req, res) => {

    db.run(
        `
        DELETE FROM coupons
        WHERE id = ?
        `,
        [req.params.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: 'Coupon deleted successfully'
            });
        }
    );
};


// APPLY COUPON
exports.applyCoupon = (req, res) => {

    const {
        code,
        subtotal
    } = req.body;

    db.get(
        `
        SELECT *
        FROM coupons
        WHERE code = ?
        AND is_active = 1
        `,
        [code],
        (err, coupon) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!coupon) {
                return res.status(404).json({
                    error: 'Coupon not found'
                });
            }

            if (
                coupon.expiry_date &&
                new Date(coupon.expiry_date) < new Date()
            ) {
                return res.status(400).json({
                    error: 'Coupon expired'
                });
            }

            let discount = 0;

            if (coupon.discount_type === 'percentage') {
                discount =
                    (subtotal * coupon.discount_value) / 100;
            }

            if (coupon.discount_type === 'fixed') {
                discount =
                    coupon.discount_value;
            }

            const total =
                Math.max(
                    subtotal - discount,
                    0
                );

            res.json({
                coupon: coupon.code,
                discount,
                total
            });
        }
    );
};