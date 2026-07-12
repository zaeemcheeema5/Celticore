const db = require('../db');


// SUBMIT REVIEW

exports.addReview = (req, res) => {

    const {
        product_id,
        user_id,
        user_name,
        rating,
        comment,
        review
    } = req.body;

    if (!product_id) {
        return res.status(400).json({
            error: "product_id is required"
        });
    }

    const ratingNum = Number(rating);

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
            error: "rating must be an integer between 1 and 5"
        });
    }

    // Accept both "comment" and "review"
    const reviewText = comment || review || "";

    const trimmedComment =
        typeof reviewText === "string"
            ? reviewText.trim()
            : "";

    if (!trimmedComment) {
        return res.status(400).json({
            error: "Review is required"
        });
    }

    if (trimmedComment.length > 2000) {
        return res.status(400).json({
            error: "Review must be less than 2000 characters"
        });
    }

    db.get(
        "SELECT id FROM products WHERE id=?",
        [product_id],
        (lookupErr, product) => {

            if (lookupErr) {
                return res.status(500).json({
                    error: lookupErr.message
                });
            }

            if (!product) {
                return res.status(404).json({
                    error: "Product not found"
                });
            }

            db.run(
                `INSERT INTO reviews
                (product_id,user_id,rating,comment)
                VALUES (?,?,?,?)`,
                [
                    product_id,
                    user_id || null,
                    ratingNum,
                    trimmedComment
                ],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        id: this.lastID,
                        message: "Review submitted successfully"
                    });
                }
            );
        }
    );
};


// GET APPROVED REVIEWS FOR PRODUCT

exports.getProductReviews = (req,res)=>{

    db.all(
        `
        SELECT *
        FROM reviews
        WHERE product_id=?
        AND status='approved'
        ORDER BY created_at DESC
        `,
        [req.params.productId],
        (err,rows)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(rows);
        }
    );
};



// ADMIN GET ALL REVIEWS

exports.getAllReviews = (req,res)=>{

    db.all(
        `
        SELECT *
        FROM reviews
        ORDER BY created_at DESC
        `,
        [],
        (err,rows)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(rows);
        }
    );
};



// APPROVE REVIEW

exports.approveReview = (req,res)=>{

    db.run(
        `
        UPDATE reviews
        SET status='approved'
        WHERE id=?
        `,
        [req.params.id],
        function(err){

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:'Review approved'
            });
        }
    );
};



// REJECT REVIEW

exports.rejectReview = (req,res)=>{

    db.run(
        `
        UPDATE reviews
        SET status='rejected'
        WHERE id=?
        `,
        [req.params.id],
        function(err){

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:'Review rejected'
            });
        }
    );
};



// DELETE REVIEW

exports.deleteReview = (req,res)=>{

    db.run(
        `
        DELETE FROM reviews
        WHERE id=?
        `,
        [req.params.id],
        function(err){

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:'Review deleted'
            });
        }
    );
};