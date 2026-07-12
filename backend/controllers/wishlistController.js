const db = require('../db');

// All four endpoints below now sit behind authMiddleware (routes/wishlistRoutes.js),
// but being logged in isn't sufficient on its own — without the ownership
// checks added here, any authenticated customer could pass a *different*
// user's id and read, add to, or clear that person's wishlist. req.user.userId
// comes from the JWT authController.js issues at login.

// ADD TO WISHLIST

exports.addToWishlist = (req, res) => {

    const {
        user_id,
        product_id
    } = req.body;

    if (!user_id || String(user_id) !== String(req.user.userId)) {
        return res.status(403).json({
            error: "You can only modify your own wishlist."
        });
    }

   db.get(
    `
    SELECT *
    FROM wishlist
    WHERE user_id = ?
    AND product_id = ?
    `,
    [user_id, product_id],
    (err,row)=>{

        if(row){

            return res.json({
                message:'Already in wishlist'
            });
        }

        db.run(
            `
            INSERT INTO wishlist
            (
                user_id,
                product_id
            )
            VALUES (?,?)
            `,
            [user_id,product_id],
            function(err){

                if(err){
                    return res.status(500).json({
                        error:err.message
                    });
                }

                res.json({
                    message:'Added to wishlist'
                });
            }
        );
    }
);
};



// GET USER WISHLIST

exports.getWishlist = (req, res) => {

    if (String(req.params.userId) !== String(req.user.userId)) {
        return res.status(403).json({
            error: "You can only view your own wishlist."
        });
    }

    db.all(
        `
        SELECT
            wishlist.id AS wishlist_id,
            products.*
        FROM wishlist
        INNER JOIN products
        ON wishlist.product_id = products.id
        WHERE wishlist.user_id = ?
        `,
        [req.params.userId],
        (err, rows) => {

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};



// REMOVE FROM WISHLIST

exports.removeWishlistItem = (req, res) => {

    // The wishlist row id alone doesn't tell us whose row it is, so look
    // it up first and confirm it belongs to the requesting user before
    // deleting anything.
    db.get(
        `SELECT user_id FROM wishlist WHERE id = ?`,
        [req.params.id],
        (lookupErr, row) => {

            if (lookupErr) {
                return res.status(500).json({ error: lookupErr.message });
            }

            if (!row) {
                return res.status(404).json({ error: "Wishlist item not found." });
            }

            if (String(row.user_id) !== String(req.user.userId)) {
                return res.status(403).json({
                    error: "You can only modify your own wishlist."
                });
            }

            db.run(
                `
                DELETE FROM wishlist
                WHERE id = ?
                `,
                [req.params.id],
                function(err){

                    if(err){

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        message:'Removed from wishlist'
                    });
                }
            );

        }
    );

};



// CLEAR USER WISHLIST

exports.clearWishlist = (req,res)=>{

    if (String(req.params.userId) !== String(req.user.userId)) {
        return res.status(403).json({
            error: "You can only modify your own wishlist."
        });
    }

    db.run(
        `
        DELETE FROM wishlist
        WHERE user_id = ?
        `,
        [req.params.userId],
        function(err){

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message:'Wishlist cleared'
            });
        }
    );
};
