const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier"); // Built-in alternative or lightweight stream utility

// Link Cloudinary credentials from your environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Magic bytes definitions matching your original security design
const MAGIC_BYTES = [
    { format: "jpg", bytes: [0xFF, 0xD8, 0xFF] },
    { format: "png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
];

// Validates the magic byte array signature directly from the memory buffer
function isValidImageBuffer(buffer) {
    if (!buffer || buffer.length < 12) return false;

    // Check JPG & PNG
    if (MAGIC_BYTES.some(sig => sig.bytes.every((b, i) => buffer[i] === b))) {
        return true;
    }

    // Check WEBP layout
    if (
        buffer.slice(0, 4).toString("ascii") === "RIFF" &&
        buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
        return true;
    }

    return false;
}

// Helper function to stream memory buffer straight into Cloudinary
const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
            {
                folder: `ecommerce/${folderName}`,
                transformation: [{ width: 1000, height: 1000, crop: "limit" }]
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        // Pipe the file buffer safely into the Cloudinary stream
        streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
    });
};

// ==========================
// Upload Product Image
// ==========================
exports.uploadProductImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded." });
    }

    // Security Check: Validate image signatures directly inside memory buffer
    if (!isValidImageBuffer(req.file.buffer)) {
        return res.status(400).json({
            success: false,
            message: "File content doesn't match a valid JPG, PNG, or WEBP image."
        });
    }

    try {
        // Stream out to Cloudinary target folder
        const cloudResult = await uploadToCloudinary(req.file.buffer, "products");

        res.status(200).json({
            success: true,
            message: "Product image uploaded successfully to cloud.",
            image: cloudResult.secure_url,     // Perfect standalone absolute HTTPS url for your MySQL database
            filename: cloudResult.public_id   // Used later if you ever need to delete the cloud image
        });
    } catch (error) {
        console.error("Cloudinary Error:", error);
        res.status(500).json({ success: false, message: "Failed uploading to cloud storage." });
    }
};

// ==========================
// Upload Category Image
// ==========================
exports.uploadCategoryImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded." });
    }

    if (!isValidImageBuffer(req.file.buffer)) {
        return res.status(400).json({
            success: false,
            message: "File content doesn't match a valid JPG, PNG, or WEBP image."
        });
    }

    try {
        const cloudResult = await uploadToCloudinary(req.file.buffer, "categories");

        res.status(200).json({
            success: true,
            message: "Category image uploaded successfully to cloud.",
            image: cloudResult.secure_url,
            filename: cloudResult.public_id
        });
    } catch (error) {
        console.error("Cloudinary Error:", error);
        res.status(500).json({ success: false, message: "Failed uploading to cloud storage." });
    }
};