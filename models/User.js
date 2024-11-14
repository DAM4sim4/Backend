const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: { type: String },
    prenom: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google users
    date_de_naissance: { type: Date },
    genre: { type: String,enum: ['male', 'female', 'Not specified'] },
    numero_telephone: { type: String },
    adresse: String,
    photo: String,
    institution: String,
    isBanned: {
        type: Boolean,
        default: false,
    },
    isConnected: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    role: { type: String,enum: ['student', 'tutor', 'admin'], default: 'user' },
    sport: {
        type: [String],
        default: [],
    },
    creativity: {
        type: [String],
        default: [],
    },
    lifestyle: {
        type: [String],
        default: [],
    },
    science: {
        type: [String],
        default: [],
    },
    divertissement: {
        type: [String],
        default: [],
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

//Comment