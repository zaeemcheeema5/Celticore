require('dotenv').config();

const stripe = require('./utils/stripeClient');

async function test() {

    try {

        const account = await stripe.accounts.retrieve();

        console.log("✅ Connected to Stripe");

        console.log(account.id);

    } catch (err) {

        console.log(err.message);

    }

}

test();