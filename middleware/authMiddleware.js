const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

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



module.exports = {
  generateToken,
  verifyToken,
  authorizeRoles
  
};
