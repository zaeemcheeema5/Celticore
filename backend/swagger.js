const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Nutrova API",
            version: "1.0.0",
            description: "Nutrova Gym Supplement Store Backend API"
        },
        servers: [
            {
                url: "http://localhost:5000"
            }
        ]
    },

    apis: [
        "./routes/*.js"
    ]
};

module.exports = swaggerJsdoc(options);