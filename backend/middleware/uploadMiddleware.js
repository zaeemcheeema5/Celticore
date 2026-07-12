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

// Storage factory
const storage = (folder) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `uploads/${folder}`);
        },

        filename: (req, file, cb) => {
            const uniqueName =
                Date.now() +
                "-" +
                Math.round(Math.random() * 1e9) +
                path.extname(file.originalname);

            cb(null, uniqueName);
        },
    });

// Product Upload
const uploadProduct = multer({
    storage: storage("products"),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },

    fileFilter,
});

// Category Upload
const uploadCategory = multer({
    storage: storage("categories"),

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter,
});

module.exports = {
    uploadProduct,
    uploadCategory,
};