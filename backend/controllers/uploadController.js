const path = require("path");

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

    res.status(200).json({
        success: true,
        message: "Category image uploaded successfully.",
        image: `/uploads/categories/${req.file.filename}`,
        filename: req.file.filename
    });

};