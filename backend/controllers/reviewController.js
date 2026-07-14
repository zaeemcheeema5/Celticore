const db = require('../db');


// SUBMIT REVIEW

exports.addReview = (req, res) => {

    const {
        product_id,
        user_id,
        rating,
        comment
    } = req.body;

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
            user_id,
            rating,
            comment
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