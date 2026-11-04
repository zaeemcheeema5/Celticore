const express = require("express");

const router = express.Router();

const multer = require("multer");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const {
    getQuote,
    getAdminConfig,
    updateAdminConfig,
    uploadLabel,
    downloadLabel,
    deleteLabel,
    LABEL_MAX_BYTES
} = require("../controllers/deliveryController");

// Label files are held in memory just long enough to check their type, then
// written to the private label folder by the controller.
const labelUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LABEL_MAX_BYTES, files: 1 }
}).single("label");

const handleLabelUpload = (req, res, next) => {
    labelUpload(req, res, (err) => {
        if (!err) return next();
        const tooBig = err.code === "LIMIT_FILE_SIZE";
        res.status(400).json({
            error: tooBig ? "Label file is too large (max 5 MB)." : "Could not read the uploaded file."
        });
    });
};

/**
 * @swagger
 * /api/delivery/quote:
 *   post:
 *     summary: Server-calculated delivery options and totals for a cart (public)
 *     tags: [Delivery]
 */
router.post("/quote", getQuote);

/**
 * @swagger
 * /api/delivery/admin/config:
 *   get:
 *     summary: Read delivery methods + free delivery rule (admin)
 *     tags: [Delivery]
 *   put:
 *     summary: Update delivery methods + free delivery rule (admin)
 *     tags: [Delivery]
 */
router.get("/admin/config", adminAuthMiddleware, getAdminConfig);
router.put("/admin/config", adminAuthMiddleware, updateAdminConfig);

/**
 * @swagger
 * /api/delivery/orders/{id}/label:
 *   post:
 *     summary: Upload a DPD label (PDF/PNG/JPG) created manually in the DPD portal (admin)
 *     tags: [Delivery]
 *   get:
 *     summary: View/print the uploaded label (admin)
 *     tags: [Delivery]
 *   delete:
 *     summary: Remove the uploaded label (admin)
 *     tags: [Delivery]
 */
router.post("/orders/:id/label", adminAuthMiddleware, handleLabelUpload, uploadLabel);
router.get("/orders/:id/label", adminAuthMiddleware, downloadLabel);
router.delete("/orders/:id/label", adminAuthMiddleware, deleteLabel);

module.exports = router;
