const db = require('../db');


// =========================
// START CHAT SESSION
// =========================

exports.startSession = (req, res) => {

    const { user_id } = req.body;

    db.run(
        `
        INSERT INTO chat_sessions (user_id)
        VALUES (?)
        `,
        [user_id || null],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                sessionId: this.lastID
            });
        }
    );
};


// =========================
// SEND MESSAGE
// =========================

exports.sendMessage = (req, res) => {

    const {
        sessionId,
        message
    } = req.body;

    const session_id = sessionId;

    if (!message) {

        return res.status(400).json({
            error: 'Message is required'
        });
    }

    const userMessage = message.toLowerCase().trim();

    // Pull recent conversation context for this session before deciding
    // how to interpret the new message (handles follow-ups / references
    // to things said earlier in the same chat).
    getSessionContext(session_id, (err, context) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        routeMessage(
            session_id,
            userMessage,
            message,
            context,
            res
        );
    });
};


// =========================
// SESSION CONTEXT
// =========================

// Looks back over the last few messages in a session and extracts:
//  - lastCategory: the most recently discussed product category
//  - lastBudget:   the most recently mentioned "under £X" budget
//  - shownProducts: product names already shown to the user, so
//                    follow-ups like "show more" don't repeat them
function getSessionContext(session_id, callback) {

    db.all(
        `
        SELECT role, message
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT 10
        `,
        [session_id],
        (err, rows) => {

            if (err) {
                return callback(err);
            }

            const context = {
                lastCategory: null,
                lastBudget: null,
                shownProducts: new Set()
            };

            // rows come back newest-first
            for (const row of rows) {

                if (row.role === 'user') {

                    const text = row.message.toLowerCase();

                    if (!context.lastCategory) {
                        if (text.includes('whey')) context.lastCategory = 'whey';
                        else if (text.includes('creatine')) context.lastCategory = 'creatine';
                        else if (text.includes('protein')) context.lastCategory = 'protein';
                        else if (text.includes('mass gainer') || text.includes('weight gain')) context.lastCategory = 'mass gainer';
                    }

                    if (!context.lastBudget) {
                        const match = text.match(/under\s+(\d+)/);
                        if (match) context.lastBudget = parseInt(match[1]);
                    }
                }

                if (row.role === 'assistant') {

                    // Assistant replies are formatted as "Name - £Price" per line
                    row.message
                        .split('\n')
                        .forEach(line => {
                            const match = line.match(/^(.*?)\s-\s£\d+(\.\d+)?$/);
                            if (match) {
                                context.shownProducts.add(match[1].trim());
                            }
                        });
                }
            }

            callback(null, context);
        }
    );
}


// =========================
// MESSAGE ROUTING (context-aware)
// =========================

const FOLLOWUP_MORE = /(show more|more options|other options|anything else|more results|see more|any others)/;
const FOLLOWUP_CHEAPER = /(cheaper|less expensive|lower price|more affordable|any cheaper)/;
const GREETING_REGEX = /^(hi+|he+y+|hello+|hiya|yo|good morning|good afternoon|good evening)\b/;

// Product/category words the bot understands. Typos within a small edit
// distance of these get auto-corrected before intent matching runs, so
// "protien", "creatien", "whay" etc. still work.
const KNOWN_KEYWORDS = ['protein', 'creatine', 'whey', 'gainer'];

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// Replaces near-miss spellings of known keywords with their correct form,
// e.g. "show protien" -> "show protein"
function correctTypos(message) {

    return message
        .split(/\s+/)
        .map(word => {
            const clean = word.replace(/[^a-z]/g, '');
            if (clean.length < 4) return word;

            for (const keyword of KNOWN_KEYWORDS) {
                const distance = levenshtein(clean, keyword);
                const threshold = keyword.length <= 5 ? 1 : 2;
                if (distance > 0 && distance <= threshold) {
                    return keyword;
                }
            }
            return word;
        })
        .join(' ');
}

function routeMessage(session_id, rawUserMessage, originalMessage, context, res) {

    // GREETING / SMALL TALK

    if (GREETING_REGEX.test(rawUserMessage)) {
        return saveChat(
            session_id,
            originalMessage,
            "Hey there! I'm your Celti Core assistant \u2014 ask me about protein, creatine, whey, or mass gainer, or try something like \"show whey under 30\".",
            res
        );
    }

    const userMessage = correctTypos(rawUserMessage);

    const budgetMatch = userMessage.match(/under\s+(\d+)/);
    const bareNumberMatch = userMessage.match(/^\s*£?(\d+)\s*$/);


    // FOLLOW-UP: "show more" / "other options" -> repeat the last category
    // search, excluding anything already shown in this session

    if (FOLLOWUP_MORE.test(userMessage)) {

        if (context.lastCategory) {
            return searchProducts(
                session_id,
                context.lastCategory,
                originalMessage,
                res,
                { excludeNames: context.shownProducts }
            );
        }

        return saveChat(
            session_id,
            originalMessage,
            "I don't have a previous search to build on yet — try asking about protein, creatine, or whey!",
            res
        );
    }


    // FOLLOW-UP: "cheaper" / "more affordable" -> reuse last category,
    // and tighten the last known budget (or just sort cheapest-first)

    if (FOLLOWUP_CHEAPER.test(userMessage)) {

        if (context.lastCategory) {

            if (context.lastBudget) {
                const tighterBudget = Math.max(1, Math.round(context.lastBudget * 0.8));
                return budgetProducts(
                    session_id,
                    tighterBudget,
                    originalMessage,
                    res,
                    context.lastCategory,
                    context.shownProducts
                );
            }

            return searchProducts(
                session_id,
                context.lastCategory,
                originalMessage,
                res,
                { sortByPrice: true, excludeNames: context.shownProducts }
            );
        }

        return saveChat(
            session_id,
            originalMessage,
            "I don't have a previous search to compare against yet — try asking about protein, creatine, or whey!",
            res
        );
    }


    // PRODUCT SEARCH (explicit keyword in this message)

    if (
        userMessage.includes('show')
        ||
        userMessage.includes('protein')
        ||
        userMessage.includes('creatine')
        ||
        userMessage.includes('whey')
    ) {

        return searchProducts(
            session_id,
            userMessage,
            originalMessage,
            res
        );
    }


    // BUDGET SEARCH ("under £X") - carry forward last category if this
    // message doesn't repeat it, so "whey protein" then "under 30" stays
    // scoped to whey protein rather than resetting to all products

    if (budgetMatch) {

        return budgetProducts(
            session_id,
            parseInt(budgetMatch[1]),
            originalMessage,
            res,
            context.lastCategory
        );
    }


    // FOLLOW-UP: a bare number ("30") after a category was already
    // established earlier in the session is almost always a budget

    if (bareNumberMatch && context.lastCategory) {

        return budgetProducts(
            session_id,
            parseInt(bareNumberMatch[1]),
            originalMessage,
            res,
            context.lastCategory
        );
    }


    let botResponse =
        "Sorry, I couldn't understand that.";


    // MUSCLE GAIN

    if (
        userMessage.includes('muscle')
    ) {

        botResponse =
            'Recommended supplements: Whey Protein, Creatine, Mass Gainer.';
    }


    // WEIGHT GAIN

    else if (
        userMessage.includes('weight gain')
    ) {

        botResponse =
            'Recommended supplements: Mass Gainer, Whey Protein, Creatine.';
    }


    // FAT LOSS

    else if (
        userMessage.includes('fat')
        ||
        userMessage.includes('weight loss')
    ) {

        botResponse =
            'Recommended supplements: Whey Isolate, L-Carnitine, Green Tea Extract.';
    }


    // DELIVERY

    else if (
        userMessage.includes('delivery')
    ) {

        botResponse =
            'Delivery usually takes 2-5 business days.';
    }


    // PAYMENT

    else if (
        userMessage.includes('payment')
    ) {

        botResponse =
            'We accept Card, Bank Transfer and Cash on Delivery.';
    }


    // SHIPPING

    else if (
        userMessage.includes('shipping')
    ) {

        botResponse =
            'Shipping charges are calculated during checkout.';
    }


    // CONTACT

    else if (
        userMessage.includes('contact')
    ) {

        botResponse =
            'You can contact Nutrova support through our Contact page.';
    }


    saveChat(
        session_id,
        originalMessage,
        botResponse,
        res
    );
}


// =========================
// GET CHAT HISTORY
// =========================

exports.getChatHistory = (req, res) => {

    db.all(
        `
        SELECT *
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
        `,
        [req.params.sessionId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                messages: rows
            });
        }
    );
};


// =========================
// PRODUCT SEARCH
// =========================

// options:
//   sortByPrice  - order results cheapest first (used for "cheaper" follow-ups)
//   excludeNames - Set of product names to skip (used for "show more" follow-ups)
function searchProducts(
    session_id,
    keyword,
    originalMessage,
    res,
    options = {}
) {

    const { sortByPrice = false, excludeNames = null } = options;

    db.all(
        `
        SELECT *
        FROM products
        WHERE
            is_active = 1
            AND (
                LOWER(name) LIKE ?
                OR LOWER(category) LIKE ?
                OR LOWER(description) LIKE ?
                OR LOWER(brand) LIKE ?
            )
        `,
        [
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`
        ],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            let candidates = rows;

            if (excludeNames && excludeNames.size > 0) {
                candidates = candidates.filter(p => !excludeNames.has(p.name));
            }

            if (sortByPrice) {
                candidates = [...candidates].sort((a, b) => a.price - b.price);
            }

            if (candidates.length === 0) {

                const message = (excludeNames && excludeNames.size > 0)
                    ? "That's all the matching products I have for now."
                    : 'No matching products found.';

                return saveChat(
                    session_id,
                    originalMessage,
                    message,
                    res
                );
            }

            const products = candidates.slice(0, 5);

            const formattedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                subtitle: product.subtitle,
                image: product.image,
                price: product.price,
                original_price: product.original_price,
                badge: product.badge,
                rating: product.rating,
                category: product.category
            }));

            const reply =
                products
                    .map(
                        p => `${p.name} - £${p.price}`
                    )
                    .join("\n");

            db.serialize(() => {

                db.run(
                    `
                    INSERT INTO chat_messages
                    (session_id, role, message)
                    VALUES (?,?,?)
                    `,
                    [session_id, "user", originalMessage]
                );

                db.run(
                    `
                    INSERT INTO chat_messages
                    (session_id, role, message)
                    VALUES (?,?,?)
                    `,
                    [session_id, "assistant", reply],
                    function(err){

                        if(err){
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            response: reply,
                            products: formattedProducts
                        });

                    }
                );

            });
        }
    );
}


// =========================
// BUDGET SEARCH
// =========================

function budgetProducts(
    session_id,
    budget,
    originalMessage,
    res,
    category = null,
    excludeNames = null
) {

    let sql = `
        SELECT *
        FROM products
        WHERE is_active = 1
          AND price <= ?
    `;
    const params = [budget];

    if (category) {
        sql += `
            AND (
                LOWER(name) LIKE ?
                OR LOWER(category) LIKE ?
                OR LOWER(description) LIKE ?
            )
        `;
        params.push(`%${category}%`, `%${category}%`, `%${category}%`);
    }

    sql += ` ORDER BY price ASC `;

    db.all(
        sql,
        params,
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });
            }

            let candidates = rows;

            if (excludeNames && excludeNames.size > 0) {
                candidates = candidates.filter(p => !excludeNames.has(p.name));
            }

            candidates = candidates.slice(0, 5);

            if (candidates.length === 0) {

                const message = (excludeNames && excludeNames.size > 0)
                    ? "That's all I have within that budget for now."
                    : `No products found under £${budget}${category ? ` in ${category}` : ''}`;

                return saveChat(
                    session_id,
                    originalMessage,
                    message,
                    res
                );
            }

            const products = candidates;

            const formattedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                subtitle: product.subtitle,
                image: product.image,
                price: product.price,
                original_price: product.original_price,
                badge: product.badge,
                rating: product.rating,
                category: product.category
            }));

            const reply =
                products
                    .map(
                        p => `${p.name} - £${p.price}`
                    )
                    .join("\n");

            db.serialize(() => {

                db.run(
                    `
                    INSERT INTO chat_messages
                    (session_id, role, message)
                    VALUES (?,?,?)
                    `,
                    [session_id, "user", originalMessage]
                );

                db.run(
                    `
                    INSERT INTO chat_messages
                    (session_id, role, message)
                    VALUES (?,?,?)
                    `,
                    [session_id, "assistant", reply],
                    function(err){

                        if(err){
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            response: reply,
                            products: formattedProducts
                        });

                    }
                );

            });
        }
    );
}


// =========================
// SAVE CHAT
// =========================

function saveChat(
    session_id,
    userMessage,
    botMessage,
    res
) {

    db.serialize(() => {

        db.run(
            `
            INSERT INTO chat_messages
            (
                session_id,
                role,
                message
            )
            VALUES (?,?,?)
            `,
            [
                session_id,
                'user',
                userMessage
            ]
        );

        db.run(
            `
            INSERT INTO chat_messages
            (
                session_id,
                role,
                message
            )
            VALUES (?,?,?)
            `,
            [
                session_id,
                'assistant',
                botMessage
            ],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    response: botMessage
                });
            }
        );

    });
}