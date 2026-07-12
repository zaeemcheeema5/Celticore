require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const swaggerSpec = require("./swagger");

const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();
const helmet = require("helmet");

app.use(helmet({
    // Helmet's default Cross-Origin-Resource-Policy is "same-origin", which
    // blocks <img> tags on the frontend (localhost:5173) from loading files
    // served by this API (localhost:5000) — e.g. everything under /uploads.
    // Since this backend intentionally serves images to a separate frontend
    // origin, relax it to allow cross-origin embedding.
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// =====================================
// CORS
// =====================================

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({

    origin: function (origin, callback) {

        // Allow Postman / server-to-server requests
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));

    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]

}));


// =====================================
// STARTUP SECURITY CHECK
// This project ships with a well-known default admin login
// (admin@celticore.com / password123) so a fresh checkout is usable
// immediately. That's fine for local development, but it's a real
// takeover risk if it ever reaches a real deployment unchanged — anyone
// who has read this source code (or just guesses it) gets full admin
// access. Warn loudly on every boot until it's changed.
// =====================================

const db = require("./db");

setTimeout(() => {

    db.all(
        `SELECT key, value FROM settings WHERE key IN ('admin_email', 'admin_password')`,
        [],
        (err, rows) => {

            if (err) return;

            const settings = {};
            rows.forEach(r => { settings[r.key] = r.value; });

            const isDefaultEmail = settings.admin_email === "admin@celticore.com";
            const isPlaintext = settings.admin_password && !settings.admin_password.startsWith("$2");

            if (isDefaultEmail || isPlaintext) {
                console.warn("\n" + "!".repeat(70));
                console.warn("! SECURITY WARNING: default/unhashed admin credentials in use.");
                if (isDefaultEmail) console.warn("!  - admin email is still the default: admin@celticore.com");
                if (isPlaintext) console.warn("!  - admin password is stored in PLAINTEXT, not hashed");
                console.warn("!  Change these now under Settings > Admin Credentials.");
                console.warn("!".repeat(70) + "\n");
            }
        }
    );

}, 500);


// =====================================
// RATE LIMITING
// Baseline abuse protection across the whole API; tighter, endpoint-specific
// limits are applied directly on the auth routes (login/signup/OTP).
// =====================================

const { apiLimiter } = require("./middleware/rateLimit");
app.use("/api", apiLimiter);


// =====================================
// WEBHOOK
// Must come BEFORE express.json()
// =====================================

app.use("/api", webhookRoutes);


// =====================================
// BODY PARSER
// =====================================

app.use(express.json());
app.use(require("cookie-parser")());


// =====================================
// STATIC FILES
// =====================================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


// =====================================
// SWAGGER
// Full API surface documentation — genuinely useful in development, but
// not something a production deployment should serve publicly with no
// auth in front of it. Gated behind NODE_ENV.
// =====================================

if ((process.env.NODE_ENV || "development") !== "production") {

const swaggerOptions = {

    definition: {

        openapi: "3.0.0",

        info: {

            title: "CeltiCore API",

            version: "1.0.0",

            description:
                "Backend API Documentation for CeltiCore"

        },

        servers: [

            {

                url: "http://localhost:5000",

                description: "Development Server"

            }

        ]

    },

    apis: ["./routes/*.js"]

};

const swaggerDocs =
    swaggerJsDoc(swaggerOptions);

app.use(
    "/api-docs",
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocs)
);

app.get("/swagger.json", (req, res) => {

    res.setHeader(
        "Content-Type",
        "application/json"
    );

    res.send(swaggerSpec);

});

} // end swagger dev-only guard


// =====================================
// API ROUTES
// =====================================

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/products", require("./routes/productRoutes"));

app.use("/api/upload", require("./routes/uploadRoutes"));

app.use("/api/categories", require("./routes/categoryRoutes"));

app.use("/api/orders", require("./routes/orderRoutes"));

app.use("/api/payment", paymentRoutes);

app.use("/api/settings", require("./routes/settingsRoutes"));

app.use("/api/contact", require("./routes/contactRoutes"));

app.use("/api/reviews", require("./routes/reviewRoutes"));

app.use("/api/wishlist", require("./routes/wishlistRoutes"));

app.use("/api/coupons", require("./routes/couponRoutes"));

app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use("/api/nutrition", require("./routes/nutritionRoutes"));

app.use("/api/chat", require("./routes/chatRoutes"));


// =====================================
// HEALTH CHECK
// =====================================

app.get("/health", (req, res) => {

    res.json({

        success: true,

        message: "CeltiCore Backend Running",

        environment:
            process.env.NODE_ENV || "development"

    });

});


// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "API endpoint not found"

    });

});


// =====================================
// GLOBAL ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {

    console.error(err.stack);

    const isDev = (process.env.NODE_ENV || "development") !== "production";

    res.status(500).json({

        success: false,

        // Raw err.message can contain internal details (SQL text, file
        // paths, stack info) that shouldn't reach an untrusted client in
        // production. Full detail still goes to the server console above.
        error: isDev ? (err.message || "Internal Server Error") : "Internal Server Error"

    });

});



// =====================================
// START SERVER
// =====================================

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `🚀 CeltiCore Backend running on port ${PORT}`
    );

    console.log(
        `📄 Swagger: http://localhost:${PORT}/api-docs`
    );

});