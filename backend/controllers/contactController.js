const db = require('../db');


// SEND MESSAGE
//
// Note: by the time this runs, backend/middleware/validateContact.js has
// already rejected missing/invalid/oversized fields and trimmed whitespace,
// so req.body.name/email/subject/message are safe to insert as-is.

exports.sendMessage = (req, res) => {

    const {
        name,
        email,
        subject,
        message
    } = req.body;

    db.run(
        `
        INSERT INTO contact_messages
        (
            name,
            email,
            subject,
            message
        )
        VALUES (?,?,?,?)
        `,
        [
            name,
            email,
            subject,
            message
        ],
        function(err){

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                id: this.lastID,
                message: 'Message submitted successfully'
            });
        }
    );
};


// GET ALL MESSAGES

exports.getMessages = (req,res) => {

    db.all(
        `
        SELECT *
        FROM contact_messages
        ORDER BY created_at DESC
        `,
        [],
        (err,rows)=>{

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};


// MARK AS READ

exports.markRead = (req,res)=>{

    db.run(
        `
        UPDATE contact_messages
        SET status='read'
        WHERE id=?
        `,
        [req.params.id],
        function(err){

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message:'Message marked as read'
            });
        }
    );
};


// DELETE MESSAGE

exports.deleteMessage = (req,res)=>{

    db.run(
        `
        DELETE FROM contact_messages
        WHERE id=?
        `,
        [req.params.id],
        function(err){

            if(err){

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message:'Message deleted'
            });
        }
    );
};