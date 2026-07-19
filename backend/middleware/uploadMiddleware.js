const multer = require("multer");

// Keep the file in memory buffer so we can parse magic bytes before upload
const storage = multer.memoryStorage();

// Handle basic extensions / MIME types filtering swiftly at the entry point
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isMimeValid = allowedTypes.test(file.mimetype);
    
    if (isMimeValid) {
        return cb(null, true);
    }
    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."), false);
};

const uploadProduct = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit remains intact
    fileFilter,
});

const uploadCategory = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

module.exports = {
    uploadProduct,
    uploadCategory,
};