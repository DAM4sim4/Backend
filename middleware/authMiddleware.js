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



module.exports = {
  generateToken
};
