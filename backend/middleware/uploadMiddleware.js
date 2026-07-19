const multer = require("multer");
const path = require("path");

// Allowed file types
const allowedTypes = /jpeg|jpg|png|webp/;

const fileFilter = (req, file, cb) => {
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }

    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
};

// Files are kept in memory (never written to this server's local disk) and
// streamed straight to Cloudinary from uploadController.js after the
// magic-bytes content check. This also means uploaded images survive
// redeploys/restarts even on hosts with an ephemeral filesystem, since
// they never touch this server's disk at all — the old disk-storage
// version would lose every uploaded image on a host that resets its
// filesystem on each deploy.
const memoryStorage = multer.memoryStorage();

// Product Upload
const uploadProduct = multer({
    storage: memoryStorage,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },

    fileFilter,
});

// Category Upload
const uploadCategory = multer({
    storage: memoryStorage,

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter,
});

module.exports = {
    uploadProduct,
    uploadCategory,
};
