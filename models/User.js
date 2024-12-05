const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true }, // Unique for Google-authenticated users
    nom: { type: String, trim: true, required: true, default: "Unknown" },
    prenom: { type: String, trim: true, required: true, default: "User" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      select: false, // Exclude password from queries
    },
    dateDeNaissance: {
      type: Date,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Date of birth cannot be in the future",
      },
    },
    genre: {
      type: String,
      enum: ["Male", "Female", "Other"],
      set: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    numeroTelephone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, "Invalid phone number format"],
    },
    adresse: {
      type: String,
      trim: true,
    },
    recoveryCode: {
      type: String,
      select: false,
    },
    recoveryCodeExpiry: {
      type: Date,
      select: false,
    },
    photo: {
      type: String,
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
    },
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
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
      set: (role) => role.toLowerCase(), // Enforce lowercase for role
    },
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
  },
  { timestamps: true }
); // Automatically add createdAt and updatedAt

// Virtual Field for Full Name
userSchema.virtual("fullName").get(function () {
  return `${this.prenom} ${this.nom}`.trim();
});

// Handle Unique Constraint Errors
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    if (error.keyPattern && error.keyPattern.email) {
      next(new Error("Email already exists."));
    } else if (error.keyPattern && error.keyPattern.googleId) {
      next(new Error("Google account is already linked to another user."));
    } else {
      next(new Error("Duplicate field value error."));
    }
  } else {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);