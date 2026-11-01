const db = require('../db');
const crypto = require('crypto');


// =========================
// STORE CONTACT INFORMATION
// Real channels for handing a conversation off to the actual Celti Core
// team — used by the FAQ answers below and the "talk to a human" intent.
// =========================

const CONTACT_INFO = {
    phone: '083 483 2200',
    address: 'Main Street, Mooncoin, Co. Waterford, X91 NX53, Ireland',
    emails: {
        general: 'info@thecelticore.com',
        support: 'support@thecelticore.com',
        sales: 'sales@thecelticore.com',
        hello: 'hello@thecelticore.com'
    }
};


// =========================
// START CHAT SESSION
// =========================

exports.startSession = (req, res) => {

    const { user_id } = req.body;
    const sessionToken = crypto.randomBytes(24).toString('hex');

    db.run(
        `
        INSERT INTO chat_sessions (user_id, session_token)
        VALUES (?, ?)
        `,
        [user_id || null, sessionToken],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                success: true,
                sessionId: this.lastID,
                sessionToken
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
//  - lastBudget:   the most recently mentioned "under €X" budget
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

                    // Assistant replies are formatted as "Name - €Price" per line
                    row.message
                        .split('\n')
                        .forEach(line => {
                            const match = line.match(/^(.*?)\s-\s€\d+(\.\d+)?$/);
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

// Conversational intents that make the assistant feel like it's actually
// listening rather than just pattern-matching product keywords. Checked
// early in routeMessage, before typo correction / category search, since
// they're short, common phrases that shouldn't get swallowed by anything
// else below.
const HUMAN_HANDOFF_REGEX = /(talk to (a |someone|a person|a human)|speak (to|with) (someone|a person|a human|a representative)|real person|human agent|customer service|speak to your team|call (you|someone)|phone number|contact (support|you|someone))/;
const IDENTITY_REGEX = /(are you (a )?(real|human|bot|robot|ai)\b|is this a bot|am i talking to a (bot|human|real person)|are you a person)/;
const THANKS_REGEX = /^(thanks|thank you|thankyou|cheers|appreciate it|ty)\b/;
const FAREWELL_REGEX = /^(bye|goodbye|see ya|see you|later|that'?s all|no that'?s (it|all)|nothing else)\b/;
const WHOLESALE_REGEX = /(wholesale|bulk order|bulk pricing|reseller|stockist|business inquiry|business enquiry|partnership|trade account)/;

// Product/category words the bot understands. Typos within a small edit
// distance of these get auto-corrected before intent matching runs, so
// "protien", "creatien", "whay" etc. still work.
const KNOWN_KEYWORDS = [
    'protein', 'creatine', 'whey', 'gainer', 'preworkout', 'bcaa',
    'vitamin', 'vitamins', 'mineral', 'minerals', 'hydration',
    'electrolyte', 'electrolytes', 'wellbeing', 'isolate', 'multivitamin'
];

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

// =========================
// SUPPLEMENT EDUCATION KNOWLEDGE BASE
// Generic "what is X / benefits of X / X vs Y" questions that aren't
// about a specific product in the catalog, just the ingredient/category
// itself. Comparison entries are checked before single-topic entries so
// "whey vs creatine" doesn't get short-circuited by the "whey" entry.
// =========================

const SUPPLEMENT_KB = [

    {
        keywords: ['whey vs creatine', 'creatine vs whey', 'whey or creatine'],
        answer: "They do different jobs, so most people use both rather than choosing one. Whey protein is a fast-digesting protein that helps you hit your daily protein target and repair muscle after training. Creatine is stored in your muscles and helps you produce short bursts of energy, which lets you lift a bit heavier or squeeze out an extra rep or two. Neither replaces the other."
    },
    {
        keywords: ['whey vs mass gainer', 'mass gainer vs whey', 'protein vs mass gainer', 'gainer vs protein'],
        answer: "Whey protein is mostly protein with very little else, so it's for topping up your daily protein without a lot of extra calories. A mass gainer is protein PLUS a large amount of carbs/calories, built for people who are struggling to eat enough to gain weight or muscle. If you're already eating enough food, whey is usually the better everyday choice — save mass gainer for when you genuinely can't get enough calories from meals."
    },
    {
        keywords: ['bcaa vs whey', 'whey vs bcaa'],
        answer: "Whey protein already contains all the BCAAs (and every other amino acid you need), so if you're already taking whey, a separate BCAA product is mostly unnecessary. BCAAs on their own are more useful for training in a fasted state or for people who find a full protein shake too heavy around a workout."
    },

    {
        keywords: ['what is whey', 'what is whey protein', 'whey protein is', 'benefits of whey'],
        answer: "Whey protein is a fast-absorbing protein made from milk, packed with all the essential amino acids your muscles need to repair and grow after training. It's the most popular way to hit your daily protein target without eating a huge amount of extra food — typically 20-25g of protein per scoop. Best taken post-workout or any time you're short on protein for the day."
    },
    {
        keywords: ['what is creatine', 'creatine is', 'benefits of creatine', 'does creatine work'],
        answer: "Creatine is one of the most researched supplements out there. It helps your muscles produce energy quickly during short, intense efforts — think heavy lifts and sprints — which over time lets you train harder and build more strength and muscle. The standard approach is 3-5g every day, taken consistently (timing around your workout doesn't matter much, consistency does). It's not a stimulant and won't give you an immediate 'kick' — the benefit builds up over 2-4 weeks."
    },
    {
        keywords: ['is creatine safe', 'creatine safe', 'creatine side effects'],
        answer: "Creatine monohydrate is one of the most studied sports supplements and is considered safe for healthy adults at the standard 3-5g/day dose. The most common effect is mild water retention in the muscles (not bloating). As always, check with a doctor first if you have any pre-existing kidney condition, and follow the dosage on the product label."
    },
    {
        keywords: ['when should i take creatine', 'creatine timing', 'best time to take creatine'],
        answer: "Timing matters far less than consistency with creatine — taking 3-5g at roughly the same time every day (workout day or not) is what builds up the muscle stores that actually give you the benefit. Many people just take it with their post-workout shake for convenience."
    },
    {
        keywords: ['what is mass gainer', 'mass gainer is', 'do i need a mass gainer', 'when to use mass gainer'],
        answer: "A mass gainer is a high-calorie protein shake — extra carbs and often extra fats on top of a solid protein dose — designed for people who struggle to eat enough food to gain weight or muscle ('hardgainers'). If you can already hit your calorie target through meals, you don't need one; whey protein alone is usually the better everyday option."
    },
    {
        keywords: ['what is bcaa', 'bcaa is', 'benefits of bcaa', 'what are bcaas'],
        answer: "BCAAs (Branched-Chain Amino Acids — leucine, isoleucine, valine) are three of the amino acids most directly involved in muscle repair. They're most useful if you train fasted or in long sessions where you want something in your system without a full protein shake. If you already get enough total protein daily (including from whey), BCAAs add relatively little on top."
    },
    {
        keywords: ['what is pre workout', 'pre-workout is', 'benefits of pre workout', 'what does pre workout do'],
        answer: "Pre-workout is a blend — usually caffeine plus ingredients like beta-alanine and citrulline — taken 20-30 minutes before training to boost energy, focus, and endurance during your session. Start with a half scoop to check your tolerance, and avoid taking it too close to bedtime since the caffeine can affect sleep."
    },
    {
        keywords: ['what is multivitamin', 'benefits of multivitamin', 'do i need a multivitamin', 'multivitamin is'],
        answer: "A multivitamin covers the everyday micronutrient gaps that are easy to miss, especially if your diet is restrictive or you're training hard (which raises some nutrient demands). It's not a substitute for real food, but it's a sensible, low-risk daily baseline for most people."
    },
    {
        keywords: ['what is bcaa', 'electrolyte', 'hydration supplement', 'what are electrolytes'],
        answer: "Electrolytes (sodium, potassium, magnesium, etc.) are minerals you lose through sweat. For most people, food and water are enough — but if you train for over an hour, sweat heavily, or train in the heat, an electrolyte/hydration product helps you replace what you've lost faster than water alone and can reduce cramping and fatigue."
    },

    {
        keywords: ['how much protein', 'protein per day', 'daily protein', 'protein intake'],
        answer: "A common, well-supported range for people training regularly is about 1.6-2.2g of protein per kg of bodyweight per day. So someone at 80kg would aim for roughly 130-175g/day, spread across meals. Whey protein is just an easy way to top up whatever you're short of from food — you don't need to hit it from supplements alone."
    },
    {
        keywords: ['is protein powder safe', 'protein powder side effects', 'too much protein'],
        answer: "Protein powder is safe for the vast majority of healthy people used as directed — it's just food in powdered form. The main thing to watch is total daily protein if you have a pre-existing kidney condition, in which case check with a doctor first."
    },
    {
        keywords: ['vegan protein', 'plant protein', 'dairy free protein'],
        answer: "If you're avoiding dairy, look for a pea, rice, soy or blended plant-protein product rather than whey (which is milk-derived). Plant proteins can be slightly lower in one or two amino acids individually, but a blended plant protein or varied diet covers that easily."
    },
    {
        keywords: ['do i need supplements', 'are supplements necessary', 'supplements vs food'],
        answer: "Supplements are exactly that — supplementary. Nothing replaces a solid diet and consistent training; protein powder, creatine, and pre-workout just make it more convenient to hit targets that are hard to reach through food alone (like protein) or give a well-researched extra edge (like creatine). None of them work without the training and nutrition behind them."
    }

];


// =========================
// WORKOUT KNOWLEDGE BASE
// =========================

const WORKOUT_KB = [

    {
        keywords: ['beginner workout', 'beginner routine', 'new to the gym', 'just started gym', 'workout for beginners', 'starting gym'],
        answer: "For your first few months, a full-body routine 3 days a week (e.g. Mon/Wed/Fri) beats splitting body parts up — it lets you practice each key movement more often while you're still learning form. Structure each session around one push (bench/press), one pull (row/pulldown), one squat/hinge (squat/deadlift pattern), and some core work, for 3 sets of 8-12 reps each. Focus on technique and consistency over weight on the bar for the first 4-6 weeks.",
        nudge: "Whey protein and creatine are the two supplements worth starting with — both are well-researched and cheap to try."
    },
    {
        keywords: ['build muscle', 'gain muscle', 'muscle gain', 'how to bulk', 'get bigger', 'hypertrophy'],
        answer: "Muscle growth comes down to three things: training each muscle with enough volume (roughly 10-20 hard sets per muscle group per week works for most people), progressively adding weight or reps over time, and eating in a slight calorie surplus with enough protein (1.6-2.2g/kg bodyweight/day). A 4-5 day split (e.g. upper/lower or push/pull/legs) with 8-15 reps per set for most exercises is a solid default.",
        nudge: "A whey protein shake post-workout and daily creatine (3-5g) are the two supplements with the strongest evidence for this goal."
    },
    {
        keywords: ['lose fat', 'fat loss', 'lose weight', 'weight loss', 'cutting', 'get lean', 'burn fat'],
        answer: "Fat loss is driven primarily by being in a calorie deficit — training doesn't burn enough calories on its own to outrun a bad diet. Keep lifting weights while you cut (2-4x/week is plenty) to protect your muscle, add 2-3 cardio sessions if you enjoy it, and keep protein high (it's the most filling macro and protects muscle during a deficit).",
        nudge: "A whey isolate is a good low-calorie way to hit your protein target while eating fewer overall calories."
    },
    {
        keywords: ['build strength', 'get stronger', 'increase strength', 'strength training', 'powerlifting'],
        answer: "Strength is best built with lower reps and heavier weight: 3-6 reps per set on your main lifts (squat, bench, deadlift, overhead press), with 2-4 minutes rest between sets so you can lift near your max each time. Progressive overload — adding a small amount of weight or a rep whenever you can — is the main driver here.",
        nudge: "Creatine (3-5g daily) has the strongest research backing of any supplement for strength performance."
    },

    {
        keywords: ['push pull legs', 'ppl split', 'push pull leg split'],
        answer: "Push/Pull/Legs (PPL) splits training into pushing muscles (chest, shoulders, triceps), pulling muscles (back, biceps), and legs, run over 3 or 6 days a week. It's a great split once you're past beginner stage because it gives each muscle group a full dedicated session, with enough frequency if run twice through the week (e.g. Push/Pull/Legs/Push/Pull/Legs/Rest)."
    },
    {
        keywords: ['upper lower split', 'upper/lower split'],
        answer: "An upper/lower split alternates upper-body days (chest, back, shoulders, arms) with lower-body days (quads, hamstrings, glutes, calves), usually 4 days a week (e.g. Mon/Tue upper/lower, rest Wed, Thu/Fri upper/lower). It hits each muscle group twice a week, which is a good frequency for muscle growth."
    },
    {
        keywords: ['full body workout', 'full body split', 'full body routine'],
        answer: "A full-body routine trains most major muscle groups every session, run 3 days a week with a rest day between each. It's ideal for beginners or anyone with limited gym days, since it gives you high frequency per muscle group without needing 5-6 gym days."
    },
    {
        keywords: ['how many days should i workout', 'how often should i train', 'training frequency', 'how many times a week'],
        answer: "3-4 days a week is the sweet spot for most people balancing progress with recovery and life outside the gym. Beginners do well on 3 full-body days; more experienced lifters often move to 4-5 days with a split (upper/lower or push/pull/legs) to add more volume per muscle group."
    },

    {
        keywords: ['how many reps', 'how many sets', 'reps and sets', 'sets and reps'],
        answer: "As a general guide: 1-5 reps builds mostly strength, 6-12 reps is the classic muscle-growth range, and 15+ reps builds more muscular endurance (though all three ranges build some muscle if taken close to failure). Aim for roughly 3-4 sets per exercise, and enough total sets per muscle group across the week to add up to about 10-20 for continued growth."
    },
    {
        keywords: ['rest between sets', 'how long to rest'],
        answer: "For heavy strength work (1-5 reps), rest 2-4 minutes so you can lift near your max again. For typical muscle-building work (6-12 reps), 60-90 seconds is usually enough. For lighter, higher-rep sets, 30-60 seconds is fine."
    },
    {
        keywords: ['rest day', 'rest days', 'how often should i rest', 'recovery days', 'do i need rest days'],
        answer: "Yes — muscle actually grows during recovery, not during the workout itself. Most people do well with 1-3 rest (or active recovery/light cardio) days a week, and each specific muscle group generally wants 48 hours before you train it hard again."
    },
    {
        keywords: ['warm up', 'warmup routine', 'how to warm up'],
        answer: "A quick 5-10 minute warm-up — light cardio to raise your heart rate, plus a couple of lighter warm-up sets of your first exercise before your working weight — is enough for most gym sessions. It reduces injury risk and usually improves performance on your first working sets."
    },
    {
        keywords: ['progressive overload'],
        answer: "Progressive overload just means gradually doing more over time — a bit more weight, an extra rep, or an extra set than last time you did that exercise. It's the main driver of long-term strength and muscle growth; without it, your body has no reason to keep adapting."
    },
    {
        keywords: ['home workout', 'no gym', 'no equipment workout', 'bodyweight workout'],
        answer: "Bodyweight training works well for general fitness and can build real muscle, especially for beginners: push-ups, pull-ups (or rows under a table), squats, lunges, and planks cover most major muscle groups. Adding resistance bands or a couple of dumbbells makes progressive overload much easier once bodyweight gets too easy."
    },

    {
        keywords: ['chest exercise', 'chest workout', 'exercises for chest'],
        answer: "Core chest builders: bench press (flat and incline), dumbbell press, and dips for overall size, plus cable/dumbbell flyes to really isolate the chest. Aim for 3-4 exercises, 3-4 sets each, in the 6-12 rep range for most sessions."
    },
    {
        keywords: ['back exercise', 'back workout', 'exercises for back'],
        answer: "Key back movements: pull-ups/lat pulldowns and rows (barbell, dumbbell, or cable) cover most of what you need — pulldowns/pull-ups build width, rows build thickness. Deadlifts are excellent too if your form is solid."
    },
    {
        keywords: ['leg exercise', 'leg workout', 'exercises for legs', 'exercises for quads', 'exercises for hamstrings'],
        answer: "Squats and deadlifts (or leg press if you're easing in) are the foundation for legs, plus lunges for balance and single-leg strength, and leg curls/extensions to isolate hamstrings and quads directly. 3-4 exercises, moderate-to-heavy weight, is a solid leg day."
    },
    {
        keywords: ['shoulder exercise', 'shoulder workout', 'exercises for shoulders'],
        answer: "Overhead press (barbell or dumbbell) is the main shoulder builder, plus lateral raises for width and rear-delt flyes/face pulls for the often-neglected back of the shoulder — that last one also helps posture."
    },
    {
        keywords: ['arm exercise', 'arm workout', 'exercises for biceps', 'exercises for triceps', 'bigger arms'],
        answer: "Biceps: barbell/dumbbell curls and hammer curls. Triceps: dips, close-grip bench press, and cable pushdowns (triceps are actually the bigger muscle in your arm, so don't neglect them). 3-4 sets of 8-12 reps per exercise works well."
    },
    {
        keywords: ['abs exercise', 'ab workout', 'core exercise', 'six pack', 'exercises for abs'],
        answer: "Planks, hanging leg raises, and cable crunches build real core strength — but visible abs come mostly from being lean enough (low body fat), which is a nutrition/calorie thing more than an ab-exercise thing. Train abs 2-3x/week alongside a solid diet."
    },
    {
        keywords: ['cardio', 'best cardio for fat loss', 'how much cardio'],
        answer: "Any cardio you'll actually stick to works — walking, running, cycling, rowing. 2-3 sessions of 20-30 minutes a week is a reasonable starting point for general health and supporting fat loss, on top of your weight training rather than instead of it."
    },
    {
        keywords: ['avoid injury', 'workout injury', 'how to prevent injury'],
        answer: "The biggest injury-prevention levers are: warm up properly, use full but controlled range of motion, don't ego-lift with worse form just to move more weight, and progress gradually rather than jumping weight too fast. If something feels sharp or joint-related (not normal muscle fatigue), stop and rest it."
    }

];

function matchKnowledgeBase(kb, userMessage) {
    for (const entry of kb) {
        if (entry.keywords.some(k => userMessage.includes(k))) {
            return entry;
        }
    }
    return null;
}


// =========================
// SINGLE PRODUCT LOOKUP
// "tell me about X" / "what is X" / "details on X" — tries to match a
// real catalog item by name/brand before falling back to the generic
// supplement-education knowledge base above.
// =========================

const PRODUCT_QUESTION_PREFIXES = [
    'tell me about ', 'what is ', "what's ", 'details on ', 'details about ',
    'info on ', 'information on ', 'more about ', 'tell me more about ',
    'specialty of ', 'speciality of ', 'describe '
];

function extractProductQuery(userMessage) {
    for (const prefix of PRODUCT_QUESTION_PREFIXES) {
        if (userMessage.startsWith(prefix)) {
            return userMessage.slice(prefix.length).trim();
        }
    }
    return null;
}

function findProductDetail(session_id, query, originalMessage, res, onNoMatch) {

    const normalizedQuery = query.replace(/[\s-]/g, '');

    db.all(
        `
        SELECT *
        FROM products
        WHERE is_active = 1
          AND (
                LOWER(name) LIKE ?
                OR LOWER(brand) LIKE ?
                OR REPLACE(REPLACE(LOWER(name), '-', ''), ' ', '') LIKE ?
                OR REPLACE(REPLACE(LOWER(brand), '-', ''), ' ', '') LIKE ?
              )
        LIMIT 5
        `,
        [`%${query}%`, `%${query}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`],
        (err, rows) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!rows || rows.length === 0) {
                return onNoMatch();
            }

            // Best match: prefer the one whose name most closely contains
            // the query (shortest name = closest match for short queries).
            const product = rows.sort((a, b) => a.name.length - b.name.length)[0];

            const parts = [
                `${product.name}${product.brand ? ` by ${product.brand}` : ''} — €${product.price}.`,
            ];

            if (product.description) {
                parts.push(product.description);
            }

            if (product.rating) {
                parts.push(`Rated ${product.rating}/5${product.reviews ? ` from ${product.reviews} reviews` : ''}.`);
            }

            const reply = `Here's what I found for you:\n\n${parts.join(' ')}`;

            db.serialize(() => {
                db.run(
                    `INSERT INTO chat_messages (session_id, role, message) VALUES (?,?,?)`,
                    [session_id, "user", originalMessage]
                );
                db.run(
                    `INSERT INTO chat_messages (session_id, role, message) VALUES (?,?,?)`,
                    [session_id, "assistant", reply],
                    function (insertErr) {
                        if (insertErr) {
                            return res.status(500).json({ error: insertErr.message });
                        }
                        res.json({
                            success: true,
                            response: reply,
                            products: [{
                                id: product.id,
                                name: product.name,
                                subtitle: product.subtitle,
                                image: product.image,
                                price: product.price,
                                original_price: product.original_price,
                                badge: product.badge,
                                rating: product.rating,
                                category: product.category
                            }]
                        });
                    }
                );
            });
        }
    );
}


// Warm, direct hand-off message pointing to the real Celti Core team.
// Routes to Sales & Wholesale for business-shaped enquiries, and Customer
// Support otherwise, so people land on the right inbox the first time.
function buildHumanHandoffReply(userMessage) {

    const isWholesale = WHOLESALE_REGEX.test(userMessage);
    const deptLabel = isWholesale ? 'Sales & Wholesale' : 'Customer Support';
    const email = isWholesale ? CONTACT_INFO.emails.sales : CONTACT_INFO.emails.support;

    return (
        `Of course — happy to point you to our team directly.\n\n` +
        `Call us: ${CONTACT_INFO.phone}\n` +
        `${deptLabel}: ${email}\n` +
        `Visit us: ${CONTACT_INFO.address}\n\n` +
        `They'll be able to sort out anything I can't help with here. Is there anything I can try to help with in the meantime?`
    );
}


function routeMessage(session_id, rawUserMessage, originalMessage, context, res) {

    // GREETING / SMALL TALK

    if (GREETING_REGEX.test(rawUserMessage)) {
        return saveChat(
            session_id,
            originalMessage,
            "Hi, welcome to Celti Core! I'm here to help you find the right supplement, answer training questions, or sort out anything order-related. " +
            "Try something like \"what's the best protein for building muscle\" or \"show me pre-workout under €30\" — " +
            "and if you'd rather speak with our team directly, just say \"talk to a human\" any time. What can I help you with today?",
            res
        );
    }

    // HONEST IDENTITY CHECK — sounding professional and personable is not
    // the same as claiming to be a human, so if someone asks directly,
    // they get a straight answer (with an easy path to an actual person).
    if (IDENTITY_REGEX.test(rawUserMessage)) {
        return saveChat(
            session_id,
            originalMessage,
            "I'm Celti Core's virtual shopping assistant, not a human — but I'm here around the clock and can connect you with our real team any time, " +
            `just say \"talk to a human\" or call us directly on ${CONTACT_INFO.phone}. How can I help in the meantime?`,
            res
        );
    }

    // HAND-OFF TO A REAL PERSON

    if (HUMAN_HANDOFF_REGEX.test(rawUserMessage)) {
        return saveChat(
            session_id,
            originalMessage,
            buildHumanHandoffReply(rawUserMessage),
            res
        );
    }

    // THANKS / FAREWELL — small conversational courtesies that make the
    // chat feel like an actual exchange instead of a lookup box.

    if (THANKS_REGEX.test(rawUserMessage)) {
        return saveChat(
            session_id,
            originalMessage,
            "You're very welcome! Let me know if there's anything else I can help with — product recommendations, workout advice, or your order.",
            res
        );
    }

    if (FAREWELL_REGEX.test(rawUserMessage)) {
        return saveChat(
            session_id,
            originalMessage,
            `Thanks for stopping by Celti Core! If anything comes up later, we're at ${CONTACT_INFO.phone} or ${CONTACT_INFO.emails.support}. Take care!`,
            res
        );
    }

    const userMessage = correctTypos(rawUserMessage);

    const budgetMatch = userMessage.match(/under\s+(\d+)/);
    const bareNumberMatch = userMessage.match(/^\s*€?(\d+)\s*$/);

    const CATEGORY_TRIGGERS_NO_SHOW = [
        'protein', 'creatine', 'whey', 'gainer', 'isolate',
        'pre workout', 'preworkout', 'pre-workout', 'bcaa',
        'vitamin', 'mineral', 'hydration', 'electrolyte', 'wellbeing'
    ];
    const CATEGORY_TRIGGERS = ['show', ...CATEGORY_TRIGGERS_NO_SHOW];


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
            "I don't have a previous search to build on yet — try asking about protein, creatine, or whey, and I'll take it from there!",
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
            "I don't have a previous search to compare against yet — try asking about protein, creatine, or whey, and I'll take it from there!",
            res
        );
    }


    // SPECIFIC PRODUCT LOOKUP ("tell me about X" / "what is X" / "details on X")
    // Tries to match a real catalog item first (specialty/description/price/
    // rating), and only falls through to generic supplement education if
    // nothing in the catalog matches that name.

    const productQuery = extractProductQuery(userMessage);

    if (productQuery && productQuery.length >= 2) {

        return findProductDetail(session_id, productQuery, originalMessage, res, () => {

            const kbMatch = matchKnowledgeBase(SUPPLEMENT_KB, userMessage);

            if (kbMatch) {
                return saveChat(session_id, originalMessage, kbMatch.answer, res);
            }

            return saveChat(
                session_id,
                originalMessage,
                `I couldn't find a product or topic matching "${productQuery}" in our range right now. Try asking about a specific supplement ` +
                `(protein, creatine, pre-workout...), or reach out to our team at ${CONTACT_INFO.emails.support} and they'll help you track it down.`,
                res
            );
        });
    }


    // WORKOUT ADVICE & SUPPLEMENT EDUCATION
    // Checked BEFORE the category-trigger product search below, because
    // otherwise a question like "whey vs creatine" gets swallowed by the
    // product search purely for containing the word "whey" — the comparison
    // knowledge base entry never gets a chance to match.

    const workoutMatch = matchKnowledgeBase(WORKOUT_KB, userMessage);

    if (workoutMatch) {
        const reply = workoutMatch.nudge
            ? `${workoutMatch.answer}\n\n${workoutMatch.nudge}`
            : workoutMatch.answer;
        return saveChat(session_id, originalMessage, reply, res);
    }

    const supplementMatch = matchKnowledgeBase(SUPPLEMENT_KB, userMessage);

    if (supplementMatch) {
        return saveChat(session_id, originalMessage, supplementMatch.answer, res);
    }


    // BUDGET SEARCH ("under €X"), checked before the generic category
    // search below. Previously "show whey under 30" fell into the generic
    // keyword search first, which searched for the literal phrase
    // "show whey under 30" as if it were a product name — matching
    // nothing. Now it correctly detects the "under 30" budget and the
    // "whey" category from the same message.

    if (budgetMatch) {

        const inlineCategory = CATEGORY_TRIGGERS_NO_SHOW.find(kw => userMessage.includes(kw))
            || context.lastCategory;

        return budgetProducts(
            session_id,
            parseInt(budgetMatch[1]),
            originalMessage,
            res,
            inlineCategory
        );
    }


    // CATEGORY / PRODUCT SEARCH (explicit keyword in this message)
    // Covers the full supplement range, not just protein/creatine/whey —
    // pre-workout, BCAA, vitamins, minerals, hydration, wellbeing all
    // route to a real catalog search now instead of falling through to
    // "sorry, I couldn't understand that."

    if (CATEGORY_TRIGGERS.some(kw => userMessage.includes(kw))) {

        // Search on the specific matched category term ("protein",
        // "creatine"...), not the raw message — "show protein" used to be
        // searched as the literal phrase "show protein", which couldn't
        // match a product simply named "... Protein" or categorized
        // "Protein". A bare "show me what you have" with no specific
        // category falls back to an empty keyword, which lists everything.
        const matchedCategory = CATEGORY_TRIGGERS_NO_SHOW.find(kw => userMessage.includes(kw)) || '';

        return searchProducts(
            session_id,
            matchedCategory,
            originalMessage,
            res
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


    // STORE FAQ — now backed by real contact channels rather than a
    // generic "check our Contact page" deflection, and covers a broader
    // set of everyday questions (wholesale, opening hours, "where are
    // you", phone/email lookups) rather than just the original five.

    let botResponse = null;

    if (userMessage.includes('delivery')) {
        botResponse = `Delivery typically takes 2-5 business days once your order ships. If it's taking longer than expected, drop us a line at ${CONTACT_INFO.emails.support} with your order number and we'll chase it up for you.`;
    } else if (userMessage.includes('payment')) {
        botResponse = "We accept Card and Bank Transfer at checkout — both are secure and straightforward. Let me know if you run into any issues and I can point you to the right person.";
    } else if (WHOLESALE_REGEX.test(userMessage)) {
        botResponse = `For wholesale, bulk orders, or partnership enquiries, our Sales & Wholesale team would love to hear from you — ${CONTACT_INFO.emails.sales} or call ${CONTACT_INFO.phone}.`;
    } else if (userMessage.includes('shipping')) {
        botResponse = "Shipping costs are calculated at checkout based on your location and order size, so you'll always see the exact cost before paying. Any questions about a specific order, just ask!";
    } else if (userMessage.includes('return') || userMessage.includes('refund')) {
        botResponse = `No problem — for returns or refunds, email us at ${CONTACT_INFO.emails.support} with your order number and we'll take care of it. You can also call ${CONTACT_INFO.phone} if it's urgent.`;
    } else if (userMessage.includes('track')) {
        botResponse = `You can check your order status any time from your account's order history once you're logged in. If something looks off, our support team is happy to dig into it — ${CONTACT_INFO.emails.support}.`;
    } else if (userMessage.includes('hour') || userMessage.includes('open') || userMessage.includes('opening time')) {
        botResponse = `For our current opening hours or to speak with someone directly, give us a call on ${CONTACT_INFO.phone} — happy to help.`;
    } else if (
        userMessage.includes('contact') || userMessage.includes('phone') || userMessage.includes('email') ||
        userMessage.includes('address') || userMessage.includes('location') || userMessage.includes('where are you')
    ) {
        botResponse =
            `You can reach the Celti Core team directly:\n` +
            `Phone: ${CONTACT_INFO.phone}\n` +
            `Customer Support: ${CONTACT_INFO.emails.support}\n` +
            `General Enquiries: ${CONTACT_INFO.emails.general}\n` +
            `Visit us: ${CONTACT_INFO.address}`;
    }

    if (botResponse) {
        return saveChat(session_id, originalMessage, botResponse, res);
    }


    // LAST RESORT: try a live catalog search on the raw message before
    // giving up entirely. This means any category or product name an
    // admin adds later — even ones not in the CATEGORY_TRIGGERS list
    // above — still works, since it's driven by what's actually in the
    // database rather than a fixed keyword list.

    db.all(
        `
        SELECT id FROM products
        WHERE is_active = 1
          AND (LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ? OR LOWER(brand) LIKE ?)
        LIMIT 1
        `,
        [`%${userMessage}%`, `%${userMessage}%`, `%${userMessage}%`, `%${userMessage}%`],
        (err, rows) => {

            if (!err && rows && rows.length > 0) {
                return searchProducts(session_id, userMessage, originalMessage, res);
            }

            return saveChat(
                session_id,
                originalMessage,
                "I'm not quite sure I follow — but I'd love to help! Try asking me things like:\n" +
                "• \"Show me whey protein under €30\"\n" +
                "• \"What's the difference between whey and creatine?\"\n" +
                "• \"Give me a beginner workout plan\"\n" +
                "• \"Where's my order?\" or \"How do I return something?\"\n\n" +
                `Or if you'd rather chat with a real person, just say "talk to a human" — or reach us directly on ${CONTACT_INFO.phone} / ${CONTACT_INFO.emails.support}.`,
                res
            );
        }
    );
}


// =========================
// GET CHAT HISTORY
// =========================

exports.getChatHistory = (req, res) => {

    const { sessionId } = req.params;
    const { token } = req.query;

    if (!token) {
        return res.status(401).json({
            error: "A valid session token is required to view chat history."
        });
    }

    db.get(
        `SELECT session_token FROM chat_sessions WHERE id = ?`,
        [sessionId],
        (sessionErr, session) => {

            if (sessionErr) {
                return res.status(500).json({ error: sessionErr.message });
            }

            if (!session || session.session_token !== token) {
                // Same response whether the session doesn't exist or the
                // token just doesn't match, so this can't be used to probe
                // which session ids exist.
                return res.status(403).json({
                    error: "Invalid session token."
                });
            }

            db.all(
                `
                SELECT *
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
                `,
                [sessionId],
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

    // Category names are admin-entered free text ("Pre-workout" vs how a
    // customer types "pre workout" or "preworkout") — stripping spaces and
    // hyphens from both sides before comparing means these all match
    // instead of silently returning nothing.
    const normalizedKeyword = keyword.replace(/[\s-]/g, '');

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
                OR REPLACE(REPLACE(LOWER(name), '-', ''), ' ', '') LIKE ?
                OR REPLACE(REPLACE(LOWER(category), '-', ''), ' ', '') LIKE ?
                OR REPLACE(REPLACE(LOWER(description), '-', ''), ' ', '') LIKE ?
                OR REPLACE(REPLACE(LOWER(brand), '-', ''), ' ', '') LIKE ?
            )
        `,
        [
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${normalizedKeyword}%`,
            `%${normalizedKeyword}%`,
            `%${normalizedKeyword}%`,
            `%${normalizedKeyword}%`
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
                    ? `That's everything I've got matching that for now — but our team can dig deeper if you'd like. Just reach out to ${CONTACT_INFO.emails.support}.`
                    : `I couldn't find anything matching that right now. Try a different keyword, or let me know your budget — or reach our team directly at ${CONTACT_INFO.emails.support}.`;

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

            const introLine = (excludeNames && excludeNames.size > 0)
                ? "Here are a few more options for you:"
                : "Great choice — here's what I'd recommend:";

            const reply =
                `${introLine}\n\n` +
                products.map(p => `${p.name} - €${p.price}`).join("\n") +
                `\n\nWant me to narrow these down further, or compare a couple of them?`;

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
        const normalizedCategory = category.replace(/[\s-]/g, '');
        sql += `
            AND (
                LOWER(name) LIKE ?
                OR LOWER(category) LIKE ?
                OR LOWER(description) LIKE ?
                OR REPLACE(REPLACE(LOWER(name), '-', ''), ' ', '') LIKE ?
                OR REPLACE(REPLACE(LOWER(category), '-', ''), ' ', '') LIKE ?
                OR REPLACE(REPLACE(LOWER(description), '-', ''), ' ', '') LIKE ?
            )
        `;
        params.push(
            `%${category}%`, `%${category}%`, `%${category}%`,
            `%${normalizedCategory}%`, `%${normalizedCategory}%`, `%${normalizedCategory}%`
        );
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
                    ? `That's all I have within that budget for now — but our team can take a closer look if you'd like. Reach out to ${CONTACT_INFO.emails.support}.`
                    : `No products found under €${budget}${category ? ` in ${category}` : ''}. Try a slightly higher budget, or reach our team directly at ${CONTACT_INFO.emails.support}.`;

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

            const introLine = (excludeNames && excludeNames.size > 0)
                ? `Here are a few more picks under €${budget}:`
                : `Here's what fits under €${budget}${category ? ` for ${category}` : ''}:`;

            const reply =
                `${introLine}\n\n` +
                products.map(p => `${p.name} - €${p.price}`).join("\n") +
                `\n\nLet me know if you'd like to see more, or adjust the budget.`;

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