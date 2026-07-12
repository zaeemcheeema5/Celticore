const db = require('../db');


// CREATE REQUEST

exports.createNutritionRequest = (req,res)=>{

    const {
        name,
        phone,
        email,
        age,
        gender,
        weight,
        height,
        goal,
        activity_level,
        diet_preference,
        medical_conditions,
        notes
    } = req.body;

    const sql = `
    INSERT INTO nutrition_requests
    (
        name,
        phone,
        email,
        age,
        gender,
        weight,
        height,
        goal,
        activity_level,
        diet_preference,
        medical_conditions,
        notes
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    db.run(
        sql,
        [
            name,
            phone,
            email,
            age,
            gender,
            weight,
            height,
            goal,
            activity_level,
            diet_preference,
            medical_conditions,
            notes
        ],
        function(err){

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success:true,
                requestId:this.lastID
            });
        }
    );
};


// GET ALL REQUESTS

exports.getNutritionRequests = (req,res)=>{

    db.all(
        `
        SELECT *
        FROM nutrition_requests
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


// GET SINGLE REQUEST

exports.getNutritionRequest = (req,res)=>{

    db.get(
        `
        SELECT *
        FROM nutrition_requests
        WHERE id = ?
        `,
        [req.params.id],
        (err,row)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(row);
        }
    );
};


// UPDATE STATUS

exports.updateNutritionStatus = (req,res)=>{

    const { status } = req.body;

    db.run(
        `
        UPDATE nutrition_requests
        SET status = ?
        WHERE id = ?
        `,
        [
            status,
            req.params.id
        ],
        function(err){

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:'Status updated'
            });
        }
    );
};


// ADD ADMIN NOTES

exports.addAdminNotes = (req,res)=>{

    const { admin_notes } = req.body;

    db.run(
        `
        UPDATE nutrition_requests
        SET admin_notes = ?
        WHERE id = ?
        `,
        [
            admin_notes,
            req.params.id
        ],
        function(err){

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:'Notes saved'
            });
        }
    );
};
console.log('Nutrition Controller Exports');
console.log(module.exports);