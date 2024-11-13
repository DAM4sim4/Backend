const jwt = require('jsonwebtoken'); 

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
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
  
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Error verifying token:", err.message);
        return res.status(403).json({ message: "Invalid token" });
      }
      req.userId = decoded.userId; // Set the userId from the token payload
      req.role = decoded.role;     // Set the role from the token payload
      next();
    });
  }



module.exports = {
  generateToken,
  verifyToken
};
