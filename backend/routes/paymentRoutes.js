const express = require("express");

const router = express.Router();

const {

    createCheckoutSession,
    createPaymentIntent

} = require("../controllers/paymentController");

router.post(
    "/create-checkout-session",
    createCheckoutSession
);

// Public — no auth — customer checkout must work for guests.
router.post(
    "/create-intent",
    createPaymentIntent
);

module.exports = router;