const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinaryClient");

// The extension and browser-supplied Content-Type (checked in
// uploadMiddleware.js's fileFilter) are both just metadata the client
// attaches to the request — trivially changed by anyone using devtools or
// curl. A file named "product.jpg" can contain anything. This checks the
// first few bytes of the actual uploaded data (held in memory, not yet
// sent to Cloudinary) against the real magic numbers for the image formats
// we claim to support, and rejects anything that doesn't match before it's
// ever uploaded or referenced from the DB.
const MAGIC_BYTES = [
    { format: "jpg", bytes: [0xFF, 0xD8, 0xFF] },
    { format: "png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
];

function isValidImageBuffer(buffer) {

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

function uploadBufferToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

async function handleUpload(req, res, folder, label) {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image uploaded."
        });
    }

    if (!isValidImageBuffer(req.file.buffer)) {
        return res.status(400).json({
            success: false,
            message: "File content doesn't match a valid JPG, PNG, or WEBP image."
        });
    }

    try {

        const result = await uploadBufferToCloudinary(
            req.file.buffer,
            `celticore/${folder}`
        );

        res.status(200).json({
            success: true,
            message: `${label} image uploaded successfully.`,
            image: result.secure_url,
            filename: result.public_id
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: "Image upload failed: " + err.message
        });

    }
}

// ==========================
// Upload Product Image
// ==========================
exports.uploadProductImage = (req, res) =>
    handleUpload(req, res, "products", "Product");

// ==========================
// Upload Category Image
// ==========================
exports.uploadCategoryImage = (req, res) =>
    handleUpload(req, res, "categories", "Category");
