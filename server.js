const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const connectDB = require('./lib/db/connect');
const User = require('./lib/models/User');
const Event = require('./lib/models/Event');
const Booking = require('./lib/models/Booking');
const Post = require('./lib/models/Post');
const Notification = require('./lib/models/Notification');
const crypto = require('crypto');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 3000;

// In-memory seat locks (for demo purposes)
// In production, use Redis or database with TTL
const seatLocks = new Map();
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Cleanup expired locks every minute
setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, lock] of seatLocks.entries()) {
        if (now > lock.expiresAt) {
            seatLocks.delete(key);
            expiredCount++;
        }
    }

    if (expiredCount > 0) {
        console.log(`Released ${expiredCount} expired seat locks`);
    }
}, 60 * 1000);

app.prepare().then(async () => {
    // Connect to MongoDB
    await connectDB();

    const server = express();
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));

    // Helper to map MongoDB _id to id for frontend
    const mapId = (doc) => {
        if (!doc) return doc;
        if (Array.isArray(doc)) {
            return doc.map(item => {
                const obj = item.toObject ? item.toObject() : item;
                return { ...obj, id: obj._id.toString() };
            });
        }
        const obj = doc.toObject ? doc.toObject() : doc;
        return { ...obj, id: obj._id.toString() };
    };

    // API Routes

    // Login
    server.post('/api/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const userObj = user.toObject();
            delete userObj.password;
            // Map _id to id for frontend compatibility
            userObj.id = userObj._id.toString();
            res.json(userObj);
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Login failed' });
        }
    });

    // Register
    server.post('/api/register', async (req, res) => {
        try {
            const { username, password, name, role } = req.body;

            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                username,
                password: hashedPassword,
                name,
                role: role || 'user'
            });

            const userObj = newUser.toObject();
            delete userObj.password;
            userObj.id = userObj._id.toString();
            res.json(userObj);
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    // Get Events
    server.get('/api/events', async (req, res) => {
        try {
            const { search } = req.query;
            let query = {};

            if (search) {
                query = {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { category: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            const events = await Event.find(query).lean();
            res.json(mapId(events));
        } catch (err) {
            console.error('Get events error:', err);
            res.status(500).json({ error: 'Failed to fetch events' });
        }
    });

    // Helper to generate embedding
    async function getEmbedding(title, description) {
        try {
            const res = await fetch('http://localhost:5001/generate-embedding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            if (res.ok) {
                const data = await res.json();
                return data.embedding;
            }
        } catch (err) {
            console.error('Embedding generation failed:', err);
        }
        return null;
    }

    // Create Event
    server.post('/api/events', async (req, res) => {
        try {
            const { title, description } = req.body;
            const embedding = await getEmbedding(title, description);

            const event = await Event.create({
                ...req.body,
                embedding
            });
            res.status(201).json(mapId(event));
        } catch (err) {
            console.error('Create event error:', err);
            res.status(500).json({ error: 'Failed to create event' });
        }
    });

    // Get Recommendations
    server.get('/api/recommendations', async (req, res) => {
        try {
            const userId = req.query.userId;
            // if (!userId) return res.status(400).json({ error: 'User ID required' });

            const response = await fetch('http://localhost:5001/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                const data = await response.json();
                res.json(data.recommendations);
            } else {
                res.json([]); // Fallback to empty
            }
        } catch (err) {
            console.error('Recommendation error:', err);
            res.status(500).json({ error: 'Failed to fetch recommendations' });
        }
    });

    // Get Producer Events
    server.get('/api/events/producer/:producerId', async (req, res) => {
        try {
            const events = await Event.find({ producerId: req.params.producerId }).lean();
            res.json(mapId(events));
        } catch (err) {
            console.error('Get producer events error:', err);
            res.status(500).json({ error: 'Failed to fetch producer events' });
        }
    });



    // Get Single Event
    server.get('/api/events/:id', async (req, res) => {
        try {
            const event = await Event.findById(req.params.id).lean();
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            res.json(mapId(event));
        } catch (err) {
            console.error('Get event error:', err);
            res.status(500).json({ error: 'Failed to fetch event' });
        }
    });

    // Update Event
    server.put('/api/events/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            if (updates.producerId && event.producerId && event.producerId.toString() !== updates.producerId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const updatedEvent = await Event.findByIdAndUpdate(id, updates, { new: true });
            res.json(mapId(updatedEvent));
        } catch (err) {
            console.error('Update event error:', err);
            res.status(500).json({ error: 'Failed to update event' });
        }
    });

    // Lock Seat
    server.post('/api/bookings/lock', async (req, res) => {
        try {
            const { eventId, seatId, userId } = req.body;
            const lockKey = `${eventId}-${seatId}`;
            const now = Date.now();

            // Clean expired locks
            for (const [key, lock] of seatLocks.entries()) {
                if (lock.expiresAt < now) {
                    seatLocks.delete(key);
                }
            }

            // Check if seat is already locked by someone else
            const existingLock = seatLocks.get(lockKey);
            if (existingLock && existingLock.userId !== userId && existingLock.expiresAt > now) {
                return res.status(423).json({ error: 'Seat is temporarily locked by another user' });
            }

            // Check if seat is permanently booked
            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            if (event.bookedSeats.includes(seatId)) {
                return res.status(423).json({ error: 'Seat is already booked' });
            }

            // Create/update lock
            seatLocks.set(lockKey, { userId, expiresAt: now + LOCK_TIMEOUT });
            res.json({ success: true, expiresAt: now + LOCK_TIMEOUT });
        } catch (err) {
            console.error('Lock seat error:', err);
            res.status(500).json({ error: 'Failed to lock seat' });
        }
    });

    // Create Booking
    server.post('/api/bookings', async (req, res) => {
        try {
            const { userId, eventId, seatIds, amount, eventTitle, eventDate, eventLocation } = req.body;

            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Check if any seats are already booked
            const alreadyBooked = seatIds.some(seat => event.bookedSeats.includes(seat));
            if (alreadyBooked) {
                return res.status(400).json({ error: 'Some seats are already booked' });
            }

            // Update event with booked seats
            event.bookedSeats.push(...seatIds);
            await event.save();

            // Check if user already has a booking for this event
            let booking = await Booking.findOne({ userId, eventId });

            if (booking) {
                // Update existing booking
                booking.seatIds.push(...seatIds);
                booking.amount += amount;
                // Ensure event details are up to date
                booking.eventTitle = eventTitle;
                booking.eventDate = eventDate;
                booking.eventLocation = eventLocation;

                // Ensure ticketCode exists for legacy bookings
                if (!booking.ticketCode) {
                    booking.ticketCode = crypto.randomBytes(4).toString('hex').toUpperCase();
                }

                await booking.save();
            } else {
                // Generate unique ticket code
                const ticketCode = crypto.randomBytes(4).toString('hex').toUpperCase();

                // Create new booking
                booking = await Booking.create({
                    userId,
                    eventId,
                    seatIds,
                    amount,
                    ticketCode,
                    eventTitle,
                    eventDate,
                    eventLocation
                });
            }

            // Clear locks for these seats
            seatIds.forEach(seatId => {
                const lockKey = `${eventId}-${seatId}`;
                seatLocks.delete(lockKey);
            });

            res.json(mapId(booking));
        } catch (err) {
            console.error('Create booking error:', err);
            res.status(500).json({ error: 'Failed to create booking' });
        }
    });

    // Get User Bookings
    server.get('/api/bookings/user/:userId', async (req, res) => {
        try {
            const bookings = await Booking.find({ userId: req.params.userId }).lean();
            res.json(mapId(bookings));
        } catch (err) {
            console.error('Get user bookings error:', err);
            res.status(500).json({ error: 'Failed to fetch bookings' });
        }
    });

    // Get Event Bookings (Producer)
    server.get('/api/bookings/event/:eventId', async (req, res) => {
        try {
            const bookings = await Booking.find({ eventId: req.params.eventId })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .lean();
            res.json(mapId(bookings));
        } catch (err) {
            console.error('Get event bookings error:', err);
            res.status(500).json({ error: 'Failed to fetch event bookings' });
        }
    });

    // Toggle Interest
    server.post('/api/events/:id/interest', async (req, res) => {
        try {
            const { userId } = req.body;
            const event = await Event.findById(req.params.id);

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const index = event.interestedUsers.indexOf(userId);
            if (index > -1) {
                event.interestedUsers.splice(index, 1);
            } else {
                event.interestedUsers.push(userId);
            }

            await event.save();
            res.json({ interestedUsers: event.interestedUsers });
        } catch (err) {
            console.error('Toggle interest error:', err);
            res.status(500).json({ error: 'Failed to toggle interest' });
        }
    });

    // Add Review
    server.post('/api/reviews', async (req, res) => {
        try {
            const { eventId, userId, rating, comment, userName } = req.body;

            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            event.reviews.push({
                userId,
                userName,
                rating,
                comment,
                date: new Date()
            });

            await event.save();
            res.json({ success: true });
        } catch (err) {
            console.error('Add review error:', err);
            res.status(500).json({ error: 'Failed to add review' });
        }
    });

    // Get posts for an event
    server.get('/api/posts/:eventId', async (req, res) => {
        try {
            const posts = await Post.find({ eventId: req.params.eventId })
                .sort({ createdAt: -1 })
                .lean();
            res.json(mapId(posts));
        } catch (err) {
            console.error('Get posts error:', err);
            res.status(500).json({ error: 'Failed to fetch posts' });
        }
    });

    // Create post (producer only)
    server.post('/api/posts', async (req, res) => {
        try {
            const { eventId, userId, content } = req.body;

            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const newPost = await Post.create({
                eventId,
                userId,
                content,
                hearts: [],
                comments: []
            });

            // Notify all users who booked this event
            const eventBookings = await Booking.find({ eventId }).distinct('userId');
            const notifiedUsers = new Set();

            const notifications = [];
            for (const bookingUserId of eventBookings) {
                const userIdStr = bookingUserId.toString();
                if (!notifiedUsers.has(userIdStr) && userIdStr !== userId) {
                    notifications.push({
                        userId: bookingUserId,
                        type: 'new_post',
                        eventId,
                        eventTitle: event.title,
                        postId: newPost._id,
                        message: `New post in ${event.title}`,
                        read: false
                    });
                    notifiedUsers.add(userIdStr);
                }
            }

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            res.json(mapId(newPost));
        } catch (err) {
            console.error('Create post error:', err);
            res.status(500).json({ error: 'Failed to create post' });
        }
    });

    // Heart/unheart a post
    server.post('/api/posts/:postId/heart', async (req, res) => {
        try {
            const { userId } = req.body;
            const post = await Post.findById(req.params.postId);

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const heartIndex = post.hearts.findIndex(id => id.toString() === userId);
            if (heartIndex > -1) {
                post.hearts.splice(heartIndex, 1);
            } else {
                post.hearts.push(userId);
            }

            await post.save();
            res.json({ hearts: post.hearts.length });
        } catch (err) {
            console.error('Heart post error:', err);
            res.status(500).json({ error: 'Failed to update heart' });
        }
    });

    // Add comment to post
    server.post('/api/posts/:postId/comment', async (req, res) => {
        try {
            const { userId, userName, comment } = req.body;
            const post = await Post.findById(req.params.postId);

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            post.comments.push({
                userId,
                userName,
                comment,
                createdAt: new Date()
            });

            await post.save();
            res.json({ success: true });
        } catch (err) {
            console.error('Add comment error:', err);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    });

    // Get user notifications
    server.get('/api/notifications/:userId', async (req, res) => {
        try {
            const notifications = await Notification.find({ userId: req.params.userId })
                .sort({ createdAt: -1 })
                .lean();
            res.json(mapId(notifications));
        } catch (err) {
            console.error('Get notifications error:', err);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    });

    // Mark notification as read
    server.put('/api/notifications/:notificationId/read', async (req, res) => {
        try {
            const notification = await Notification.findByIdAndUpdate(
                req.params.notificationId,
                { read: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.json({ success: true });
        } catch (err) {
            console.error('Mark notification read error:', err);
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    });

    // Generate PDF ticket
    server.post('/api/tickets/generate', async (req, res) => {
        try {
            const { bookingId } = req.body;
            const booking = await Booking.findById(bookingId).lean();

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // Generate HTML ticket
            const ticketHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #F9F9F4;
            padding: 40px;
        }
        .ticket {
            background: white;
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #C17C5C;
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #C17C5C 0%, #5B7C75 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-family: 'Instrument Serif', serif;
            font-size: 48px;
            margin-bottom: 10px;
        }
        .header p {
            font-family: 'Space Mono', monospace;
            font-size: 12px;
            letter-spacing: 2px;
            opacity: 0.9;
        }
        .content {
            padding: 50px;
        }
        .event-title {
            font-family: 'Instrument Serif', serif;
            font-size: 36px;
            color: #2C2C2C;
            margin-bottom: 30px;
            border-bottom: 2px solid #E0E0D8;
            padding-bottom: 20px;
        }
        .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        .detail-item {
            border-left: 3px solid #C17C5C;
            padding-left: 20px;
        }
        .detail-label {
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #666;
            margin-bottom: 8px;
        }
        .detail-value {
            font-size: 18px;
            color: #2C2C2C;
            font-weight: 600;
        }
        .seats {
            background: #F9F9F4;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .seats h3 {
            font-family: 'Instrument Serif', serif;
            font-size: 24px;
            margin-bottom: 15px;
        }
        .seat-list {
            font-family: 'Space Mono', monospace;
            font-size: 16px;
            color: #2C2C2C;
        }
        .footer {
            text-align: center;
            padding: 30px;
            background: #F9F9F4;
            border-top: 1px solid #E0E0D8;
        }
        .booking-id {
            font-family: 'Space Mono', monospace;
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .ticket-code {
            font-family: 'Space Mono', monospace;
            font-size: 24px;
            font-weight: 700;
            color: #C17C5C;
            letter-spacing: 4px;
            margin-bottom: 10px;
        }
        .qr-placeholder {
            width: 120px;
            height: 120px;
            background: #E0E0D8;
            margin: 20px auto;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <h1>Eventopedia</h1>
            <p>YOUR EVENT TICKET</p>
        </div>
        <div class="content">
            <div class="event-title">${booking.eventTitle}</div>
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${new Date(booking.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${booking.eventLocation}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Amount Paid</div>
                    <div class="detail-value">$${booking.amount}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Booked On</div>
                    <div class="detail-value">${new Date(booking.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
            <div class="seats">
                <h3>Your Seats</h3>
                <div class="seat-list">${booking.seatIds.join(', ')}</div>
            </div>
        </div>
        <div class="footer">
            <div class="qr-placeholder">QR CODE</div>
            <div class="ticket-code">${booking.ticketCode || 'PENDING'}</div>
            <div class="booking-id">Booking Ref: ${booking._id}</div>
        </div>
    </div>
</body>
</html>
            `;

            const htmlPdf = require('html-pdf-node');

            const options = {
                format: 'A4',
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            };

            const file = { content: ticketHTML };

            const pdfBuffer = await htmlPdf.generatePdf(file, options);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking._id}.pdf`);
            res.send(pdfBuffer);
        } catch (err) {
            console.error('PDF generation error:', err);
            res.status(500).json({ error: 'Failed to generate ticket' });
        }
    });

    server.all(/(.*)/, (req, res) => {
        return handle(req, res);
    });

    server.listen(port, err => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
