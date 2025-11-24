const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'producer'],
        default: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
