const db = require('../db');


// ADD TO WISHLIST

exports.addToWishlist = (req, res) => {

    const {
        user_id,
        product_id
    } = req.body;

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
};



// CLEAR USER WISHLIST

exports.clearWishlist = (req,res)=>{

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