// backend/middleware/validateNutrition.js
//
// POST /api/nutrition (nutritionController.createNutritionRequest) previously
// accepted any request body and inserted it straight into the database with
// no checks at all — no required-field check, no type/range checks on
// numeric fields like age/weight/height, no length limits on free-text
// fields. Unlike the contact form (backend/middleware/validateContact.js),
// there was no validation middleware here at all, even though this form
// collects more sensitive data (medical_conditions) and more fields overall.
//
// This mirrors validateContact.js's approach: validate and trim every field
// the form actually collects (backend/controllers/nutritionController.js /
// frontend/src/components/nutrition/NutritionModal.tsx) before the request
// ever reaches the controller/database. All of these fields are marked
// `required` on the frontend form except medical_conditions and notes,
// which are optional free text.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT_LIMITS = {
    name: 100,
    email: 254, // RFC 5321 max mailbox length
    phone: 30,
    gender: 30,
    goal: 100,
    activity_level: 50,
    diet_preference: 50,
    medical_conditions: 1000,
    notes: 1000
};

// Generous but sane real-world bounds — enough to reject garbage/typo'd
// values (e.g. age 0 or 999) without rejecting legitimate edge cases.
const NUMBER_LIMITS = {
    age: { min: 10, max: 120 },
    weight: { min: 20, max: 400 }, // kg
    height: { min: 100, max: 250 } // cm
};

function validateNutrition(req, res, next) {
    const errors = [];
    const body = req.body || {};

    const str = (key) => typeof body[key] === "string" ? body[key].trim() : "";

    const name = str("name");
    const phone = str("phone");
    const email = str("email");
    const gender = str("gender");
    const goal = str("goal");
    const activityLevel = str("activity_level");
    const dietPreference = str("diet_preference");
    const medicalConditions = str("medical_conditions");
    const notes = str("notes");

    if (!name) errors.push("Name is required.");
    else if (name.length > TEXT_LIMITS.name) errors.push(`Name must be ${TEXT_LIMITS.name} characters or fewer.`);

    if (!email) errors.push("Email is required.");
    else if (email.length > TEXT_LIMITS.email) errors.push("Email address is too long.");
    else if (!EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");

    if (!phone) errors.push("Phone number is required.");
    else if (phone.length > TEXT_LIMITS.phone) errors.push(`Phone number must be ${TEXT_LIMITS.phone} characters or fewer.`);

    if (!gender) errors.push("Gender is required.");
    else if (gender.length > TEXT_LIMITS.gender) errors.push(`Gender must be ${TEXT_LIMITS.gender} characters or fewer.`);

    if (!goal) errors.push("Goal is required.");
    else if (goal.length > TEXT_LIMITS.goal) errors.push(`Goal must be ${TEXT_LIMITS.goal} characters or fewer.`);

    if (!activityLevel) errors.push("Activity level is required.");
    else if (activityLevel.length > TEXT_LIMITS.activity_level) errors.push(`Activity level must be ${TEXT_LIMITS.activity_level} characters or fewer.`);

    if (!dietPreference) errors.push("Diet preference is required.");
    else if (dietPreference.length > TEXT_LIMITS.diet_preference) errors.push(`Diet preference must be ${TEXT_LIMITS.diet_preference} characters or fewer.`);

    if (medicalConditions.length > TEXT_LIMITS.medical_conditions) {
        errors.push(`Medical conditions must be ${TEXT_LIMITS.medical_conditions} characters or fewer.`);
    }

    if (notes.length > TEXT_LIMITS.notes) {
        errors.push(`Notes must be ${TEXT_LIMITS.notes} characters or fewer.`);
    }

    const numbers = {};
    for (const [key, { min, max }] of Object.entries(NUMBER_LIMITS)) {
        const raw = body[key];
        const value = Number(raw);

        if (raw === undefined || raw === null || raw === "" || !Number.isFinite(value)) {
            errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} is required and must be a number.`);
            continue;
        }

        if (value < min || value > max) {
            errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} must be between ${min} and ${max}.`);
            continue;
        }

        numbers[key] = value;
    }

    if (errors.length) {
        return res.status(400).json({
            success: false,
            error: errors[0],
            errors
        });
    }

    // Pass the trimmed/coerced values through so the controller stores
    // clean data.
    req.body.name = name;
    req.body.phone = phone;
    req.body.email = email;
    req.body.gender = gender;
    req.body.goal = goal;
    req.body.activity_level = activityLevel;
    req.body.diet_preference = dietPreference;
    req.body.medical_conditions = medicalConditions;
    req.body.notes = notes;
    req.body.age = numbers.age;
    req.body.weight = numbers.weight;
    req.body.height = numbers.height;

    next();
}

module.exports = validateNutrition;