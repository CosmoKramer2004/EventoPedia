const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    seatIds: [{
        type: String,
        required: true
    }],
    amount: {
        type: Number,
        required: true
    },
    ticketCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Denormalized fields for faster ticket generation
    eventTitle: String,
    eventDate: String,
    eventLocation: String
}, {
    timestamps: true
});

BookingSchema.index({ userId: 1, eventId: 1 });

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
