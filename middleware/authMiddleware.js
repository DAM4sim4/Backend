const jwt = require('jsonwebtoken'); 
const User = require('../models/User');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

// Generate JWT token function
async function generateToken(userId, role) {
  try {
    const token = await jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.error(error);
    throw new Error("Error generating token");
  }
}

// Verify token middleware
async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;

    // Check if user is banned
    const user = await User.findById(req.userId);
    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(403).json({ message: "Invalid token" });
  }
}

  // roleMiddleware.js
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      // Creating a new user with Google profile data, and add default or placeholder values if needed
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        nom: profile.name.familyName || 'Unknown',
        prenom: profile.name.givenName || 'Unknown',
        role: 'Student', // Default role, or you could ask the user to choose this later
        password: '', // No password needed for Google users, or manage password-less logins
        numero_telephone: '', // Placeholder, or prompt user to add later
        date_de_naissance: null, // Placeholder, or prompt user to add later
        genre: 'Other' // Placeholder or default value
      });
      await user.save();
    }

    // Generate token with userId and role
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return done(null, { user, token });
  } catch (error) {
    return done(error, null);
  }
}));


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));



module.exports = {
  generateToken,
  verifyToken,
  authorizeRoles,
  passport
  
};
