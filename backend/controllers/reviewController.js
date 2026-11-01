const db = require('../db');

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

function parseImages(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function isDelivered(status) {
    return typeof status === 'string' && status.toLowerCase() === 'delivered';
}

// The product grid/cards (Home, Category, Search) display product.rating
// and product.reviews — static columns on the products table, set manually
// via the admin product form. They don't auto-update just because a review
// got approved/rejected/deleted/edited, so we recompute and write them back
// here any time the set of approved reviews for a product changes. This
// keeps the grid's star rating in sync with the live reviews table without
// having to touch how the product cards themselves read that data.
function syncProductRating(productId) {
    db.get(
        `SELECT COUNT(*) AS total, AVG(rating) AS avgRating FROM reviews WHERE product_id = ? AND status = 'approved'`,
        [productId],
        (err, row) => {
            if (err) {
                console.error('Failed to compute product rating sync:', err.message);
                return;
            }

            const total = row ? row.total : 0;
            const avg = row && row.avgRating ? Number(row.avgRating) : 0;

            db.run(
                `UPDATE products SET rating = ?, reviews = ? WHERE id = ?`,
                [Number(avg.toFixed(1)), total, productId],
                (updateErr) => {
                    if (updateErr) {
                        console.error('Failed to sync product rating:', updateErr.message);
                    }
                }
            );
        }
    );
}

function mapReviewRow(row) {
    return {
        id: row.id,
        productId: row.product_id,
        userId: row.user_id,
        orderId: row.order_id,
        rating: row.rating,
        title: row.title,
        review: row.review,
        images: parseImages(row.images),
        isVerifiedPurchase: !!row.is_verified_purchase,
        status: row.status,
        helpfulCount: row.helpful_count || 0,
        adminReply: row.admin_reply || null,
        adminReplyAt: row.admin_reply_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        reviewerName: row.reviewer_name || 'Anonymous',
        productName: row.product_name || undefined
    };
}


// ==========================
// SUBMIT REVIEW
// POST /api/reviews  (logged-in customer)
// ==========================

exports.addReview = (req, res) => {

    const userId = req.user.userId || req.user.id;

    const {
        productId,
        orderId,
        rating,
        title,
        review,
        images
    } = req.body;

    if (!productId || !orderId) {
        return res.status(400).json({ error: 'productId and orderId are required' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle) {
        return res.status(400).json({ error: 'title is required' });
    }
    if (trimmedTitle.length > 150) {
        return res.status(400).json({ error: 'title must be 150 characters or fewer' });
    }

    const trimmedReview = typeof review === 'string' ? review.trim() : '';
    if (!trimmedReview) {
        return res.status(400).json({ error: 'review is required' });
    }
    if (trimmedReview.length > 2000) {
        return res.status(400).json({ error: 'review must be 2000 characters or fewer' });
    }

    let imagesArr = Array.isArray(images) ? images.filter(u => typeof u === 'string') : [];
    if (imagesArr.length > 5) {
        return res.status(400).json({ error: 'A maximum of 5 images is allowed per review' });
    }

    // Eligibility: the order must belong to this user, be Delivered, and
    // actually contain this product.
    db.get(
        `SELECT id, user_id, status FROM orders WHERE id = ?`,
        [orderId],
        (orderErr, order) => {

            if (orderErr) {
                return res.status(500).json({ error: orderErr.message });
            }

            if (!order || order.user_id !== userId) {
                return res.status(403).json({ error: 'This order does not belong to your account.' });
            }

            if (!isDelivered(order.status)) {
                return res.status(403).json({ error: 'You can only review products from delivered orders.' });
            }

            db.get(
                `SELECT id FROM order_items WHERE order_id = ? AND product_id = ?`,
                [orderId, productId],
                (itemErr, item) => {

                    if (itemErr) {
                        return res.status(500).json({ error: itemErr.message });
                    }

                    if (!item) {
                        return res.status(403).json({ error: 'This product was not part of that order.' });
                    }

                    db.get(
                        `SELECT id FROM reviews WHERE order_id = ? AND product_id = ?`,
                        [orderId, productId],
                        (dupErr, existing) => {

                            if (dupErr) {
                                return res.status(500).json({ error: dupErr.message });
                            }

                            if (existing) {
                                return res.status(409).json({
                                    error: 'You already reviewed this product for this order. Edit your existing review instead.',
                                    reviewId: existing.id
                                });
                            }

                            db.run(
                                `
                                INSERT INTO reviews
                                (product_id, user_id, order_id, rating, title, review, images, is_verified_purchase, status)
                                VALUES (?,?,?,?,?,?,?,1,'pending')
                                `,
                                [
                                    productId,
                                    userId,
                                    orderId,
                                    ratingNum,
                                    trimmedTitle,
                                    trimmedReview,
                                    JSON.stringify(imagesArr)
                                ],
                                function (err) {

                                    if (err) {
                                        return res.status(500).json({ error: err.message });
                                    }

                                    res.status(201).json({
                                        id: this.lastID,
                                        message: 'Review submitted. It will be visible on the product page once approved.'
                                    });
                                }
                            );

                        }
                    );

                }
            );

        }
    );
};


// ==========================
// UPDATE REVIEW (owner only)
// PUT /api/reviews/:reviewId
// ==========================

exports.updateReview = (req, res) => {

    const userId = req.user.userId || req.user.id;
    const { rating, title, review, images } = req.body;

    db.get(
        `SELECT * FROM reviews WHERE id = ?`,
        [req.params.reviewId],
        (err, existing) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!existing) {
                return res.status(404).json({ error: 'Review not found' });
            }

            if (existing.user_id !== userId) {
                return res.status(403).json({ error: 'You can only edit your own review.' });
            }

            let ratingNum = existing.rating;
            if (rating !== undefined) {
                ratingNum = Number(rating);
                if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
                }
            }

            let newTitle = existing.title;
            if (title !== undefined) {
                newTitle = typeof title === 'string' ? title.trim() : '';
                if (!newTitle) {
                    return res.status(400).json({ error: 'title cannot be empty' });
                }
                if (newTitle.length > 150) {
                    return res.status(400).json({ error: 'title must be 150 characters or fewer' });
                }
            }

            let newReview = existing.review;
            if (review !== undefined) {
                newReview = typeof review === 'string' ? review.trim() : '';
                if (!newReview) {
                    return res.status(400).json({ error: 'review cannot be empty' });
                }
                if (newReview.length > 2000) {
                    return res.status(400).json({ error: 'review must be 2000 characters or fewer' });
                }
            }

            let newImages = parseImages(existing.images);
            if (images !== undefined) {
                newImages = Array.isArray(images) ? images.filter(u => typeof u === 'string') : [];
                if (newImages.length > 5) {
                    return res.status(400).json({ error: 'A maximum of 5 images is allowed per review' });
                }
            }

            // Edited content needs re-moderation — an edit could turn an
            // approved, publicly-visible review into something that
            // shouldn't be, so it goes back to Pending until an admin
            // looks at it again.
            db.run(
                `
                UPDATE reviews
                SET rating = ?, title = ?, review = ?, images = ?, status = 'pending'
                WHERE id = ?
                `,
                [ratingNum, newTitle, newReview, JSON.stringify(newImages), req.params.reviewId],
                function (updateErr) {

                    if (updateErr) {
                        return res.status(500).json({ error: updateErr.message });
                    }

                    // If this review had been approved before the edit, it's
                    // now pending again and no longer counts toward the
                    // product's public rating — recompute it either way.
                    if (existing.status === 'approved') {
                        syncProductRating(existing.product_id);
                    }

                    res.json({ message: 'Review updated. It will need to be re-approved before it appears on the product page.' });
                }
            );

        }
    );
};


// ==========================
// GET APPROVED REVIEWS FOR PRODUCT (public)
// GET /api/reviews/:productId
// Query params: sort (newest|highest|lowest|helpful), rating (1-5), media (1),
//               limit, offset
// ==========================

exports.getProductReviews = (req, res) => {

    const { productId } = req.params;
    const { sort, rating, media } = req.query;

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const where = [`r.product_id = ?`, `r.status = 'approved'`];
    const params = [productId];

    const ratingNum = Number(rating);
    if (rating !== undefined && Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        where.push('r.rating = ?');
        params.push(ratingNum);
    }

    if (media === '1' || media === 'true') {
        where.push(`r.images IS NOT NULL AND r.images != '' AND r.images != '[]'`);
    }

    let orderBy = 'r.created_at DESC';
    if (sort === 'highest') orderBy = 'r.rating DESC, r.created_at DESC';
    else if (sort === 'lowest') orderBy = 'r.rating ASC, r.created_at DESC';
    else if (sort === 'helpful') orderBy = 'r.helpful_count DESC, r.created_at DESC';

    const whereSql = where.join(' AND ');

    db.get(
        `SELECT COUNT(*) AS total FROM reviews r WHERE ${whereSql}`,
        params,
        (countErr, countRow) => {

            if (countErr) {
                return res.status(500).json({ error: countErr.message });
            }

            const total = countRow ? countRow.total : 0;

            db.all(
                `
                SELECT r.*, u.username AS reviewer_name
                FROM reviews r
                LEFT JOIN users u ON u.id = r.user_id
                WHERE ${whereSql}
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?
                `,
                [...params, limit, offset],
                (err, rows) => {

                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    res.json({
                        reviews: rows.map(mapReviewRow),
                        total,
                        hasMore: offset + rows.length < total
                    });
                }
            );
        }
    );
};


// ==========================
// GET RATING SUMMARY FOR PRODUCT (public)
// GET /api/reviews/:productId/summary
// ==========================

exports.getProductReviewSummary = (req, res) => {

    db.all(
        `
        SELECT rating, COUNT(*) AS count
        FROM reviews
        WHERE product_id = ? AND status = 'approved'
        GROUP BY rating
        `,
        [req.params.productId],
        (err, rows) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            let totalCount = 0;
            let ratingSum = 0;

            rows.forEach(row => {
                if (breakdown[row.rating] !== undefined) {
                    breakdown[row.rating] = row.count;
                }
                totalCount += row.count;
                ratingSum += row.rating * row.count;
            });

            res.json({
                average: totalCount > 0 ? Number((ratingSum / totalCount).toFixed(2)) : 0,
                total: totalCount,
                breakdown
            });
        }
    );
};


// ==========================
// ELIGIBILITY CHECK (logged-in customer)
// GET /api/reviews/eligibility/:productId
// Returns which of the user's delivered orders containing this product
// don't have a review yet, plus their existing reviews for it (any status).
// ==========================

exports.getEligibility = (req, res) => {

    const userId = req.user.userId || req.user.id;
    const { productId } = req.params;

    db.all(
        `
        SELECT o.id AS order_id, o.created_at AS delivered_order_at
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ? AND oi.product_id = ? AND LOWER(o.status) = 'delivered'
        ORDER BY o.created_at DESC
        `,
        [userId, productId],
        (ordersErr, eligibleOrders) => {

            if (ordersErr) {
                return res.status(500).json({ error: ordersErr.message });
            }

            db.all(
                `
                SELECT * FROM reviews
                WHERE user_id = ? AND product_id = ?
                ORDER BY created_at DESC
                `,
                [userId, productId],
                (revErr, myReviews) => {

                    if (revErr) {
                        return res.status(500).json({ error: revErr.message });
                    }

                    const reviewedOrderIds = new Set(myReviews.map(r => r.order_id));

                    res.json({
                        eligibleOrders: eligibleOrders
                            .filter(o => !reviewedOrderIds.has(o.order_id))
                            .map(o => ({ orderId: o.order_id, deliveredAt: o.delivered_order_at })),
                        myReviews: myReviews.map(mapReviewRow)
                    });
                }
            );
        }
    );
};


// ==========================
// MARK REVIEW HELPFUL (logged-in customer, one vote per user)
// POST /api/reviews/:reviewId/helpful
// ==========================

exports.markHelpful = (req, res) => {

    const userId = req.user.userId || req.user.id;
    const { reviewId } = req.params;

    db.run(
        `INSERT INTO review_helpful_votes (review_id, user_id) VALUES (?, ?)`,
        [reviewId, userId],
        function (err) {

            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'You already marked this review as helpful.' });
                }
                return res.status(500).json({ error: err.message });
            }

            db.run(
                `UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?`,
                [reviewId],
                function (updateErr) {

                    if (updateErr) {
                        return res.status(500).json({ error: updateErr.message });
                    }

                    db.get(
                        `SELECT helpful_count FROM reviews WHERE id = ?`,
                        [reviewId],
                        (getErr, row) => {
                            if (getErr) {
                                return res.status(500).json({ error: getErr.message });
                            }
                            res.json({ message: 'Marked as helpful', helpfulCount: row ? row.helpful_count : null });
                        }
                    );
                }
            );
        }
    );
};


// ==========================
// ADMIN: GET ALL REVIEWS (with filters)
// GET /api/reviews/admin/all
// ==========================

exports.getAllReviews = (req, res) => {

    const { productId, rating, status } = req.query;

    const where = [];
    const params = [];

    if (productId) {
        where.push('r.product_id = ?');
        params.push(productId);
    }

    const ratingNum = Number(rating);
    if (rating !== undefined && Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        where.push('r.rating = ?');
        params.push(ratingNum);
    }

    if (status && VALID_STATUSES.includes(String(status).toLowerCase())) {
        where.push('r.status = ?');
        params.push(String(status).toLowerCase());
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    db.all(
        `
        SELECT r.*, u.username AS reviewer_name, p.name AS product_name
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        LEFT JOIN products p ON p.id = r.product_id
        ${whereSql}
        ORDER BY r.created_at DESC
        `,
        params,
        (err, rows) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(rows.map(mapReviewRow));
        }
    );
};


// ==========================
// ADMIN: APPROVE / REJECT REVIEW
// PATCH /api/reviews/:reviewId/status
// ==========================

exports.updateReviewStatus = (req, res) => {

    const status = String(req.body.status || '').toLowerCase();

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    db.get(
        `SELECT product_id FROM reviews WHERE id = ?`,
        [req.params.reviewId],
        (findErr, existing) => {

            if (findErr) {
                return res.status(500).json({ error: findErr.message });
            }

            if (!existing) {
                return res.status(404).json({ error: 'Review not found' });
            }

            db.run(
                `UPDATE reviews SET status = ? WHERE id = ?`,
                [status, req.params.reviewId],
                function (err) {

                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    syncProductRating(existing.product_id);

                    res.json({ message: `Review ${status}` });
                }
            );
        }
    );
};


// ==========================
// ADMIN: REPLY TO REVIEW
// POST /api/reviews/:reviewId/reply
// ==========================

exports.replyToReview = (req, res) => {

    const reply = typeof req.body.reply === 'string' ? req.body.reply.trim() : '';

    if (!reply) {
        return res.status(400).json({ error: 'reply is required' });
    }
    if (reply.length > 2000) {
        return res.status(400).json({ error: 'reply must be 2000 characters or fewer' });
    }

    db.run(
        `UPDATE reviews SET admin_reply = ?, admin_reply_at = NOW() WHERE id = ?`,
        [reply, req.params.reviewId],
        function (err) {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Review not found' });
            }

            res.json({ message: 'Reply posted' });
        }
    );
};


// ==========================
// ADMIN: DELETE REVIEW
// DELETE /api/reviews/:reviewId
// ==========================

exports.deleteReview = (req, res) => {

    db.get(
        `SELECT product_id FROM reviews WHERE id = ?`,
        [req.params.reviewId],
        (findErr, existing) => {

            if (findErr) {
                return res.status(500).json({ error: findErr.message });
            }

            if (!existing) {
                return res.status(404).json({ error: 'Review not found' });
            }

            db.run(
                `DELETE FROM review_helpful_votes WHERE review_id = ?`,
                [req.params.reviewId],
                function () {

                    db.run(
                        `DELETE FROM reviews WHERE id = ?`,
                        [req.params.reviewId],
                        function (err) {

                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }

                            if (this.changes === 0) {
                                return res.status(404).json({ error: 'Review not found' });
                            }

                            syncProductRating(existing.product_id);

                            res.json({ message: 'Review deleted' });
                        }
                    );
                }
            );
        }
    );
};