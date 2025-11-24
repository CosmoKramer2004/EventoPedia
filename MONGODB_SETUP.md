# NeonTix - MongoDB Setup Guide

## 🚀 Quick Start

### 1. Install MongoDB
Make sure you have MongoDB installed and running locally, or use MongoDB Atlas (cloud).

**Local MongoDB:**
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Or use MongoDB Atlas at: https://www.mongodb.com/cloud/atlas
```

### 2. Set Environment Variable (Optional)
By default, the app connects to `mongodb://localhost:27017/neontix`

To use a different MongoDB URI, set the environment variable:
```bash
export MONGODB_URI="your-mongodb-connection-string"
```

Or create a `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/neontix
```

### 3. Seed the Database
Run the seed script to populate your database with sample data:
```bash
npm run seed
```

This will create:
- **3 Users** (admin, user, producer)
- **3 Events** (Music Festival, Tech Summit, Comedy Night)
- **3 Bookings**
- **1 Post** with comments
- **1 Notification**

### 4. Start the Application
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔐 Login Credentials

After seeding, use these credentials:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | password |
| Consumer | user | password |
| Producer | producer | password |

## 📊 Database Collections

### Users
- Stores user accounts with hashed passwords
- Roles: admin, user, producer

### Events
- Event details, pricing, seating
- Embedded reviews
- Linked to producer via `producerId`

### Bookings
- Ticket purchases
- Denormalized event data for fast PDF generation

### Posts
- Community posts from producers
- Embedded comments
- Hearts (likes) array

### Notifications
- User notifications for new posts
- Read/unread status

## 🔧 MongoDB Atlas Setup (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Add database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string
6. Export or add to `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neontix
   ```
7. Run `npm run seed`
8. Run `npm run dev`

## 🎯 Key Features

- ✅ User authentication with bcrypt
- ✅ Role-based access control
- ✅ Event management (CRUD)
- ✅ Booking system with seat locking
- ✅ Community posts with comments
- ✅ Real-time notifications
- ✅ PDF ticket generation

## 📝 Notes

- Passwords are hashed using bcrypt
- Seat locks are still in-memory (consider Redis for production)
- All IDs are MongoDB ObjectIds
- Comments are embedded in Posts for simplicity
