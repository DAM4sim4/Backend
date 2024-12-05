const jwt = require("jsonwebtoken");
const User = require("../models/User");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error("Error: JWT_SECRET is not defined in the .env file.");
  process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  console.error("Error: Google OAuth credentials are not defined in the .env file.");
  process.exit(1);
}

// Helper: Generate JWT token
function generateToken(userId, role, expiresIn = "7d") {
  try {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    console.error("Error generating JWT token:", error.message);
    throw new Error("Error generating token");
  }
}

// Middleware: Verify JWT token
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

    // Check if user exists and is not banned
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(403).json({ message: "Invalid token" });
  }
}

// Middleware: Role-Based Authorization
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      console.error(`Unauthorized role: ${req.role}`);
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
}

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Create a new user if not found
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || `user${profile.id}@example.com`, // Fallback for missing email
            nom: profile.name?.familyName || "Unknown",
            prenom: profile.name?.givenName || "Unknown",
            role: "student", // Default role
            password: "", // Password-less logins for Google users
            numero_telephone: "", // Placeholder
            date_de_naissance: null, // Placeholder
            genre: "Other", // Placeholder
          });
          await user.save();
        }

        // Generate token
        const token = generateToken(user._id, user.role, "7d"); // Extend token validity for better UX
        return done(null, { user, token });
      } catch (error) {
        console.error("Error in Google OAuth strategy:", error.message);
        return done(error, null);
      }
    }
  )
);

// Serialize and Deserialize User
passport.serializeUser((data, done) => {
  const { user, token } = data;
  done(null, { userId: user._id, token });
});

passport.deserializeUser((data, done) => {
  done(null, data);
});

module.exports = {
  generateToken,
  verifyToken,
  authorizeRoles,
  passport,
};