const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Nom is required'],
        trim: true,
    },
    prenom: {
        type: String,
        required: [true, 'Prenom is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email address',
        ],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    date_de_naissance: {
        type: String,
        required: [true, 'Date de naissance is required'],
    },
    genre: {
        type: String,
        enum: ['homme', 'femme', 'autre'],
        required: [true, 'Genre is required'],
    },
    numero_telephone: {
        type: String,
        required: [true, 'Numero Telephone is required'],
    },
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
    role: {
        type: String,
        enum: ['student', 'tutor', 'admin'],
        required: true,
    },
    sport: String,
    creativity: String,
    lifestyle: String,
    science: String,
    divertissement: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
