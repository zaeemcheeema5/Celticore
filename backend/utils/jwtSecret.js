// Every JWT in this app (customer, admin, and main-admin tokens) is signed
// and verified with this one secret. Several files used to independently
// fall back to the hardcoded literal "your_jwt_secret_key_123" whenever
// process.env.JWT_SECRET was missing — meaning if the env var was ever
// unset (or set to something equally weak, like the literal string
// "celticore", which shipped in this project's .env), anyone could forge
// a valid admin token themselves with that publicly-known value and get
// full admin access without ever logging in.
//
// This module is the single source of truth: it validates the secret once
// at startup and crashes immediately with a clear message if it's missing
// or obviously weak, rather than quietly running with an insecure default.

const KNOWN_WEAK_SECRETS = [
    "your_jwt_secret_key_123",
    "celticore",
    "secret",
    "changeme",
    "password",
    "jwt_secret"
];

const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error(
        "JWT_SECRET is not set. Set a long, random value in backend/.env " +
        "before starting the server (e.g. `openssl rand -hex 32`)."
    );
}

if (secret.length < 32 || KNOWN_WEAK_SECRETS.includes(secret.toLowerCase())) {
    throw new Error(
        "JWT_SECRET is too weak (either a known placeholder or under 32 " +
        "characters). Anyone who guesses it can forge admin login tokens. " +
        "Generate a strong one, e.g. `openssl rand -hex 32`, and set it in " +
        "backend/.env."
    );
}

module.exports = secret;
