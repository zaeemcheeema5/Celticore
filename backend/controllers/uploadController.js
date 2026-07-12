const path = require("path");
const fs = require("fs");

// Extension and the browser-supplied Content-Type (checked in
// uploadMiddleware.js's fileFilter) are both just metadata the client
// attaches to the request — trivially changed by anyone using devtools or
// curl. A file named "product.jpg" can contain anything. This checks the
// first few bytes actually written to disk against the real magic numbers
// for the image formats we claim to support, and rejects/deletes anything
// that doesn't match before it's ever referenced from the DB.
const MAGIC_BYTES = [
    { format: "jpg", bytes: [0xFF, 0xD8, 0xFF] },
    { format: "png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
];

function isValidImage(filePath) {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (MAGIC_BYTES.some(sig => sig.bytes.every((b, i) => buffer[i] === b))) {
        return true;
    }

    // WEBP: "RIFF" .... "WEBP"
    if (
        buffer.slice(0, 4).toString("ascii") === "RIFF" &&
        buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
        return true;
    }

    return false;
}

function rejectIfNotRealImage(req, res) {
    if (!isValidImage(req.file.path)) {
        fs.unlink(req.file.path, () => {});
        res.status(400).json({
            success: false,
            message: "File content doesn't match a valid JPG, PNG, or WEBP image."
        });
        return true;
    }
    return false;
}

// ==========================
// Upload Product Image
// ==========================
exports.uploadProductImage = (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image uploaded."
        });
    }

    if (rejectIfNotRealImage(req, res)) return;

    res.status(200).json({
        success: true,
        message: "Product image uploaded successfully.",
        image: `/uploads/products/${req.file.filename}`,
        filename: req.file.filename
    });

};


// ==========================
// Upload Category Image
// ==========================
exports.uploadCategoryImage = (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image uploaded."
        });
    }

    if (rejectIfNotRealImage(req, res)) return;

    res.status(200).json({
        success: true,
        message: "Category image uploaded successfully.",
        image: `/uploads/categories/${req.file.filename}`,
        filename: req.file.filename
    });

};