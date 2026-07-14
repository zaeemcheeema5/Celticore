const db = require('../db');

// =====================================
// GET ALL CATEGORIES
// =====================================

exports.getCategories = (req, res) => {

    db.all(
        `
        SELECT
            id,
            name,
            slug,
            image,
            card_image,
            tagline,
            description,
            accent_color,
            effect,
            created_at
        FROM categories
        ORDER BY created_at DESC
        `,
        [],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    error: err.message
                });

            }

            res.json({
                success: true,
                categories: rows
            });

        }
    );

};

// =====================================
// ADD CATEGORY
// =====================================

exports.addCategory = (req, res) => {

    const {

        name,
        slug,
        image,
        card_image,
        tagline,
        description,
        accent_color,
        effect

    } = req.body;

    db.run(
        `
        INSERT INTO categories
        (
            name,
            slug,
            image,
            card_image,
            tagline,
            description,
            accent_color,
            effect
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?
        )
        `,
        [

            name,

            slug,

            image || '',

            card_image || image || '',

            tagline || '',

            description || '',

            accent_color || '#10b981',

            effect || 'energy'

        ],

        function (err) {

            if (err) {

                return res.status(500).json({

                    success: false,
                    error: err.message

                });

            }

            res.json({

                success: true,

                id: this.lastID,

                message: 'Category created successfully'

            });

        }

    );

};

// =====================================
// UPDATE CATEGORY
// =====================================

exports.updateCategory = (req, res) => {

    const {

        name,
        slug,
        image,
        card_image,
        tagline,
        description,
        accent_color,
        effect

    } = req.body;

    db.run(

        `
        UPDATE categories
        SET

            name=?,

            slug=?,

            image=?,

            card_image=?,

            tagline=?,

            description=?,

            accent_color=?,

            effect=?

        WHERE id=?

        `,

        [

            name,

            slug,

            image,

            card_image,

            tagline,

            description,

            accent_color,

            effect,

            req.params.id

        ],

        function (err) {

            if (err) {

                return res.status(500).json({

                    success: false,
                    error: err.message

                });

            }

            res.json({

                success: true,

                message: 'Category updated successfully'

            });

        }

    );

};

// =====================================
// DELETE CATEGORY
// =====================================

exports.deleteCategory = (req, res) => {

    db.run(

        `
        DELETE FROM categories
        WHERE id=?
        `,

        [req.params.id],

        function (err) {

            if (err) {

                return res.status(500).json({

                    success: false,
                    error: err.message

                });

            }

            res.json({

                success: true,

                message: 'Category deleted successfully'

            });

        }

    );

};