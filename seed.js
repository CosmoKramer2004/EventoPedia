const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./lib/db/connect');
const User = require('./lib/models/User');
const Event = require('./lib/models/Event');
const Booking = require('./lib/models/Booking');
const Post = require('./lib/models/Post');
const Notification = require('./lib/models/Notification');

async function seed() {
    try {
        await connectDB();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Event.deleteMany({});
        await Booking.deleteMany({});
        await Post.deleteMany({});
        await Notification.deleteMany({});

        // Create Users
        console.log('👥 Creating users...');
        const hashedPassword = await bcrypt.hash('password', 10);

        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin'
        });

        const user1 = await User.create({
            username: 'user',
            password: hashedPassword,
            name: 'John Doe',
            role: 'user'
        });

        const producer1 = await User.create({
            username: 'producer',
            password: hashedPassword,
            name: 'Abhishek',
            role: 'producer'
        });

        console.log(`✅ Created ${await User.countDocuments()} users`);

        // Create Events
        console.log('🎪 Creating events...');
        const event1 = await Event.create({
            title: 'Summer Music Festival 2024',
            description: 'Join us for the biggest music festival of the year featuring top artists from around the world!',
            date: '2023-12-15',
            time: '18:00',
            location: 'Central Park, New York',
            price: 150,
            totalSeats: 100,
            rows: 10,
            cols: 10,
            category: 'Music',
            image: '/images/concert.png',
            producerId: producer1._id,
            bookedSeats: ['0-0', '0-1', '1-0'],
            reviews: [
                {
                    userId: user1._id,
                    userName: 'John Doe',
                    rating: 5,
                    comment: 'Amazing experience! Can\'t wait for next year!',
                    date: new Date('2023-11-23T12:52:27.315Z')
                }
            ]
        });

        const event2 = await Event.create({
            title: 'Future Tech Summit 2024',
            description: 'Explore the latest innovations in AI, blockchain, and quantum computing with industry leaders.',
            date: '2024-01-20',
            time: '09:00',
            location: 'Convention Center, San Francisco',
            price: 299,
            totalSeats: 100,
            rows: 10,
            cols: 10,
            category: 'Technology',
            image: '/images/conference.png',
            producerId: producer1._id,
            bookedSeats: ['0-6', '0-5'],
            reviews: []
        });

        const event3 = await Event.create({
            title: 'Laugh Out Loud: Comedy Night',
            description: 'An evening full of laughter with top comedians performing their best acts!',
            date: '2023-11-30',
            time: '20:00',
            location: 'The Comedy Club, Chicago',
            price: 75,
            totalSeats: 100,
            rows: 10,
            cols: 10,
            category: 'Comedy',
            image: '/images/comedy.png',
            producerId: producer1._id,
            bookedSeats: ['2-3', '2-4', '2-5'],
            reviews: []
        });

        console.log(`✅ Created ${await Event.countDocuments()} events`);

        // Create Bookings
        console.log('🎫 Creating bookings...');
        await Booking.create({
            userId: user1._id,
            eventId: event1._id,
            seatIds: ['0-0', '0-1', '1-0'],
            amount: 450,
            eventTitle: event1.title,
            eventDate: event1.date,
            eventLocation: event1.location
        });

        await Booking.create({
            userId: user1._id,
            eventId: event2._id,
            seatIds: ['0-6', '0-5'],
            amount: 598,
            eventTitle: event2.title,
            eventDate: event2.date,
            eventLocation: event2.location
        });

        await Booking.create({
            userId: user1._id,
            eventId: event3._id,
            seatIds: ['2-3', '2-4', '2-5'],
            amount: 225,
            eventTitle: event3.title,
            eventDate: event3.date,
            eventLocation: event3.location
        });

        console.log(`✅ Created ${await Booking.countDocuments()} bookings`);

        // Create Posts
        console.log('📝 Creating posts...');
        const post1 = await Post.create({
            eventId: event1._id,
            userId: producer1._id,
            content: 'Excited to announce our amazing lineup for Summer Music Festival! Get ready for an unforgettable experience! 🎵🎉',
            hearts: [user1._id],
            comments: [
                {
                    userId: user1._id,
                    userName: 'John Doe',
                    comment: 'Can\'t wait! Already got my tickets!',
                    createdAt: new Date()
                }
            ]
        });

        console.log(`✅ Created ${await Post.countDocuments()} posts`);

        // Create Notifications
        console.log('🔔 Creating notifications...');
        await Notification.create({
            userId: user1._id,
            type: 'new_post',
            eventId: event1._id,
            eventTitle: event1.title,
            postId: post1._id,
            message: `New post in ${event1.title}`,
            read: false
        });

        console.log(`✅ Created ${await Notification.countDocuments()} notifications`);

        console.log('\n🎉 Seed data created successfully!\n');
        console.log('📊 Summary:');
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Events: ${await Event.countDocuments()}`);
        console.log(`   Bookings: ${await Booking.countDocuments()}`);
        console.log(`   Posts: ${await Post.countDocuments()}`);
        console.log(`   Notifications: ${await Notification.countDocuments()}`);
        console.log('\n🔐 Login Credentials:');
        console.log('   Admin: admin / password');
        console.log('   User: user / password');
        console.log('   Producer: producer / password');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seed();
