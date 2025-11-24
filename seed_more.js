const mongoose = require('mongoose');
const Event = require('./lib/models/Event');
const User = require('./lib/models/User');
const connectDB = require('./lib/db/connect');

const events = [
    {
        title: "Tech Innovation Summit 2024",
        description: "Join leading tech visionaries for a day of keynotes, workshops, and networking. Explore the future of AI, blockchain, and sustainable technology.",
        date: "2024-09-15",
        time: "09:00",
        location: "Silicon Valley Convention Center",
        price: 299,
        category: "Technology",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80",
        totalSeats: 500,
        rows: 20,
        cols: 25,
        bookedSeats: []
    },
    {
        title: "Jazz Under the Stars",
        description: "An enchanting evening of smooth jazz performances in the open-air amphitheater. Featuring world-renowned saxophonists and pianists.",
        date: "2024-08-20",
        time: "19:30",
        location: "City Park Amphitheater",
        price: 45,
        category: "Music",
        image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80",
        totalSeats: 200,
        rows: 10,
        cols: 20,
        bookedSeats: []
    },
    {
        title: "Modern Art Gallery Opening",
        description: "Exclusive preview of the 'Abstract Realities' exhibition. Meet the artists and enjoy complimentary wine and hors d'oeuvres.",
        date: "2024-10-05",
        time: "18:00",
        location: "Metropolitan Art Gallery",
        price: 0,
        category: "Art",
        image: "https://images.unsplash.com/photo-1518998053901-5348d3969105?auto=format&fit=crop&q=80",
        totalSeats: 100,
        rows: 5,
        cols: 20,
        bookedSeats: []
    },
    {
        title: "Culinary Masterclass: Italian Cuisine",
        description: "Learn to craft authentic Italian dishes with Chef Marco. Hands-on cooking class followed by a 3-course dinner.",
        date: "2024-09-10",
        time: "17:00",
        location: "The Gourmet Kitchen",
        price: 120,
        category: "Food",
        image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80",
        totalSeats: 20,
        rows: 4,
        cols: 5,
        bookedSeats: []
    }
];

async function seed() {
    await connectDB();

    // Get a producer ID (using the first user found for simplicity, or create one)
    let producer = await User.findOne({ role: 'producer' });
    if (!producer) {
        console.log("No producer found, creating one...");
        // ... (skip for now, assuming seed.js ran)
        producer = await User.findOne({}); // Fallback
    }

    if (!producer) {
        console.log("No users found. Run npm run seed first.");
        process.exit(1);
    }

    console.log(`Seeding events for producer: ${producer.name}`);

    for (const eventData of events) {
        await Event.create({
            ...eventData,
            producerId: producer._id
        });
        console.log(`Created event: ${eventData.title}`);
    }

    console.log("Seeding complete.");
    process.exit(0);
}

seed();
