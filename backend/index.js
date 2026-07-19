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
// CORS (FULLY UPDATED & FIXES THE BLOCKER)
// =====================================

const isProdEnv = (process.env.NODE_ENV || "development") === "production";

// Exact-match localhost/127.0.0.1 origins (any port) — used only in
// development. This used to be a substring check (origin.includes(...))
// with no environment gate, which meant an attacker-controlled origin like
// "http://localhost.attacker.com" would also pass, in production too —
// a real CORS bypass when combined with credentials:true.
const LOCAL_DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
    origin: function (origin, callback) {
        // 1. Allow Postman, server-to-server, or mobile requests with no origin header
        if (!origin) {
            return callback(null, true);
        }

        // 2. In development only, allow local dev traffic on any port —
        //    exact host match, not a substring check.
        if (!isProdEnv && LOCAL_DEV_ORIGIN_RE.test(origin)) {
            return callback(null, true);
        }

        // 3. Normalize production configuration URLs to ensure safe matching
        if (process.env.CLIENT_URL) {
            const normalizedOrigin = origin.replace(/\/$/, "");
            const normalizedClientUrl = process.env.CLIENT_URL.replace(/\/$/, "");
            
            if (normalizedOrigin === normalizedClientUrl) {
                return callback(null, true);
            }
        }

        // Drop request if it fails all allowed checks
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
// =====================================

const db = require("./db");

setTimeout(async () => {
    try {
        const database = await db;
        const [rows] = await database.execute(
            `SELECT \`key\`, value FROM settings WHERE \`key\` IN ('admin_email', 'admin_password')`
        );

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
    } catch (err) {
        console.error("⚠️ Startup security check database error:", err.message);
    }
}, 1000);
// =====================================
// RATE LIMITING
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

// New product/category uploads now go straight to Cloudinary (see
// uploadController.js) and never touch this server's disk. This static
// route is kept only to keep serving any images that were uploaded to
// local disk before that migration — re-upload those through the admin
// panel to move them to Cloudinary too.
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


// =====================================
// SWAGGER
// =====================================

if ((process.env.NODE_ENV || "development") !== "production") {

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CeltiCore API",
            version: "1.0.0",
            description: "Backend API Documentation for CeltiCore"
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

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(
    "/api-docs",
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocs)
);

app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
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
        environment: process.env.NODE_ENV || "development"
    });
});

// =====================================
// SERVE FRONTEND STATIC FILES (VITE DIST)
// =====================================

// Serve the compiled frontend (Vite build mapped locally inside git workspace root)
app.use(express.static(path.join(__dirname, "dist")));
// // Express 5 compatible SPA fallback
// app.use((req, res, next) => {
//   // Only handle GET requests
//   if (req.method !== "GET") {
//       return next();
//   }

//   // Don't intercept API or uploads
//   if (
//       req.path.startsWith("/api") ||
//       req.path.startsWith("/uploads")
//   ) {
//       return next();
//   }

//   // Serve React app for all other frontend routes
//   res.sendFile(path.join(__dirname, "dist/index.html"));
// });
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
        error: isDev ? (err.message || "Internal Server Error") : "Internal Server Error"
    });
});


// =====================================
// START SERVER
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CeltiCore Backend running on port ${PORT}`);
    console.log(`📄 Swagger: http://localhost:${PORT}/api-docs`);
});