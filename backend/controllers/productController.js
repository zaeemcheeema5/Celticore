const db = require('../db');

/*
=====================================
GET ALL PRODUCTS
=====================================
*/
exports.getProducts = (req, res) => {

    db.all(
        `
        SELECT *
        FROM products
        ORDER BY created_at DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            const products = rows.map(product => ({
                ...product,
                flavours: product.flavours
                    ? JSON.parse(product.flavours)
                    : []
            }));

            res.json(products);
        }
    );
};

/*
=====================================
GET SINGLE PRODUCT
=====================================
*/
exports.getProduct = (req, res) => {

    db.get(
        `
        SELECT *
        FROM products
        WHERE id = ?
        `,
        [req.params.id],
        (err, row) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!row) {
                return res.status(404).json({
                    error: 'Product not found'
                });
            }

            row.flavours = row.flavours
                ? JSON.parse(row.flavours)
                : [];

            res.json(row);
        }
    );
};

/*
=====================================
ADD PRODUCT
=====================================
*/
exports.addProduct = (req, res) => {

const {
    id,
    name,
    subtitle,
    brand,
    category,
    price,
    original_price,
    image,
    description,
    badge,
    flavours,
    rating,
    reviews,
    stock_quantity,
    low_stock_threshold,
    is_active
} = req.body;

    db.run(
        `
INSERT INTO products
(
    id,
    name,
    subtitle,
    brand,
    category,
    price,
    original_price,
    image,
    description,
    badge,
    flavours,
    rating,
    reviews,
    stock_quantity,
    low_stock_threshold,
    is_active
)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,
[
    id,
    name,
    subtitle ?? null,
    brand ?? null,
    category,
    price,
    original_price ?? null,
    image,
    description,
    badge ?? null,
    JSON.stringify(flavours || []),
    rating || 0,
    reviews || 0,
    stock_quantity || 0,
    low_stock_threshold || 5,
    is_active ?? 1
],
        function(err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Product added successfully',
                productId: id
            });
        }
    );
};

/*
=====================================
UPDATE PRODUCT
=====================================
*/
exports.updateProduct = (req, res) => {

const {
    name,
    subtitle,
    brand,
    category,
    price,
    original_price,
    image,
    description,
    badge,
    flavours,
    rating,
    reviews,
    stock_quantity,
    low_stock_threshold,
    is_active
} = req.body;

    db.run(
        `
        UPDATE products
        SET
    name = ?,
    subtitle = ?,
    brand = ?,
    category = ?,
    price = ?,
    original_price = ?,
    image = ?,
    description = ?,
    badge = ?,
    flavours = ?,
    rating = ?,
    reviews = ?,
    stock_quantity = ?,
    low_stock_threshold = ?,
    is_active = ?
        WHERE id = ?
        `,
[
    name,
    subtitle ?? null,
    brand ?? null,
    category,
    price,
    original_price ?? null,
    image,
    description,
    badge ?? null,
    JSON.stringify(flavours || []),
    rating ?? 0,
    reviews ?? 0,
    stock_quantity ?? 0,
    low_stock_threshold ?? 5,
    is_active ?? 1,
    req.params.id
],
        function(err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully'
            });
        }
    );
};

/*
=====================================
UPDATE STOCK ONLY
=====================================
*/
exports.updateStock = (req, res) => {

    const { stock_quantity } = req.body;

    db.run(
        `
        UPDATE products
        SET stock_quantity = ?
        WHERE id = ?
        `,
        [
            stock_quantity,
            req.params.id
        ],
        function(err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Stock updated successfully'
            });
        }
    );
};

/*
=====================================
LOW STOCK PRODUCTS
=====================================
*/
exports.getLowStockProducts = (req, res) => {

    db.all(
        `
        SELECT *
        FROM products
        WHERE stock_quantity <= low_stock_threshold
        ORDER BY stock_quantity ASC
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            const products = rows.map(product => ({
                ...product,
                flavours: product.flavours
                    ? JSON.parse(product.flavours)
                    : []
            }));

            res.json(products);
        }
    );
};

/*
=====================================
ACTIVE PRODUCTS
=====================================
*/
exports.getActiveProducts = (req, res) => {

    db.all(
        `
        SELECT *
        FROM products
        WHERE is_active = 1
        ORDER BY created_at DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            const products = rows.map(product => ({
                ...product,
                flavours: product.flavours
                    ? JSON.parse(product.flavours)
                    : []
            }));

            res.json(products);
        }
    );
};

/*
=====================================
DELETE PRODUCT
=====================================
*/
exports.deleteProduct = (req, res) => {

    db.run(
        `
        DELETE FROM products
        WHERE id = ?
        `,
        [req.params.id],
        function(err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        }
    );
};