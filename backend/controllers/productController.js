const db = require('../db');

/*
=====================================
SLUGIFY
=====================================
Product IDs double as the /product/:id URL segment, so they need to be
safe there: lowercase, ASCII, hyphen-separated, nothing that needs URL
encoding. Previously the frontend derived an id from the product name with
just `.toLowerCase().replace(/\s+/g, '-')`, which strips whitespace but
leaves everything else (+, &, ', etc.) untouched — e.g. "Testosterone
Booster+" became "testosterone-booster+", a literal `+` in a URL path,
which some layers along the way interpret as an encoded space. Admins
could also type a custom Product ID with zero validation, so nothing
stopped the same problem happening via three different naming schemes.
This is now the single source of truth for turning either a name or a
manually-typed id into a safe slug, enforced server-side so it can't be
bypassed by calling the API directly.
*/
function slugify(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')   // strip accents (é -> e)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')       // anything not a-z0-9 becomes a hyphen
        .replace(/^-+|-+$/g, '')           // trim leading/trailing hyphens
        .replace(/-{2,}/g, '-');           // collapse repeats
}

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

    if (!name || !String(name).trim()) {
        return res.status(400).json({
            error: 'Product name is required.'
        });
    }

    // See the matching comment in updateProduct — never persist negative
    // stock through this endpoint either.
    const safeStock = Math.max(0, Number(stock_quantity) || 0);

    // Slugify whatever id came in (admin-typed or auto-derived from the
    // name on the frontend) — this is the actual enforcement point, since
    // trusting whatever the client sends is what let inconsistent/unsafe
    // ids through in the first place. Falls back to the name if the
    // supplied id slugifies down to nothing (e.g. it was only symbols).
    const safeId = slugify(id) || slugify(name);

    if (!safeId) {
        return res.status(400).json({
            error: 'Could not derive a valid Product ID from the name or id provided.'
        });
    }

    db.get(
        `SELECT id FROM products WHERE id = ?`,
        [safeId],
        (lookupErr, existing) => {

            if (lookupErr) {
                return res.status(500).json({
                    error: lookupErr.message
                });
            }

            if (existing) {
                return res.status(409).json({
                    error: `Product ID "${safeId}" is already in use. Choose a different name or a unique Product ID.`
                });
            }

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
                    safeId,
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
                    safeStock,
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
                        productId: safeId
                    });
                }
            );
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

    // Never let stock go negative through this endpoint, regardless of
    // what the client sends. The frontend now also clamps and adds
    // min="0" to the Stock Quantity field, but that only stops the admin
    // UI — this is the actual enforcement point, since anything hitting
    // this API directly (or a future integration) would otherwise bypass
    // it entirely. This is how a product previously ended up with
    // "Stock: -12" and the storefront still showing it as in stock.
    const safeStock = Math.max(0, Number(stock_quantity) || 0);

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
    safeStock,
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

    // Same clamp as addProduct/updateProduct — nothing currently calls
    // this endpoint from the frontend, but it's a real write path and
    // should never be the one place that's still allowed to go negative.
    const safeStock = Math.max(0, Number(req.body.stock_quantity) || 0);

    db.run(
        `
        UPDATE products
        SET stock_quantity = ?
        WHERE id = ?
        `,
        [
            safeStock,
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