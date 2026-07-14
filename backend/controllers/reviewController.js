const db = require('../db');


// SUBMIT REVIEW

exports.addReview = (req, res) => {

    const {
        product_id,
        user_id,
        rating,
        comment
    } = req.body;

    if (!product_id) {
        return res.status(400).json({ error: 'product_id is required' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    if (!trimmedComment) {
        return res.status(400).json({ error: 'comment is required' });
    }
    if (trimmedComment.length > 2000) {
        return res.status(400).json({ error: 'comment must be 2000 characters or fewer' });
    }

    // Confirm the product actually exists before attaching a review to it —
    // previously any product_id (including ones that don't exist) was
    // accepted silently.
    db.get(
        `SELECT id FROM products WHERE id = ?`,
        [product_id],
        (lookupErr, product) => {

            if (lookupErr) {
                return res.status(500).json({ error: lookupErr.message });
            }

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            db.run(
                `
                INSERT INTO reviews
                (
                    product_id,
                    user_id,
                    rating,
                    comment
                )
                VALUES (?,?,?,?)
                `,
                [
                    product_id,
                    user_id || null,
                    ratingNum,
                    trimmedComment
                ],
                function(err){

                    if(err){

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        id:this.lastID,
                        message:'Review submitted'
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