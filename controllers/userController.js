const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
//const { requestPasswordReset, verifyResetCode, resetPassword } = require('../middleware/passwordService');


// Register User
const registerUser = async (req, res) => {
    const { 
        nom, prenom, email, password, date_de_naissance, genre, 
        numero_telephone, role, adresse, photo, institution, 
        sport, creativity, lifestyle, science, divertissement 
    } = req.body;

    // Validate required fields
    if (!nom || !prenom || !email || !password || !date_de_naissance || !genre || !numero_telephone || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            nom,
            prenom,
            email,
            password: hashedPassword,
            date_de_naissance,
            genre,
            numero_telephone,
            role,
            // default empty
            adresse: adresse || '', 
            photo: photo || '', 
            institution: institution || '', 
            sport: sport || [], 
            creativity: creativity || [], 
            lifestyle: lifestyle || [], 
            science: science || [], 
            divertissement: divertissement || [] 
        });

        // Save user to database
        await newUser.save();

        // Respond with success message
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                nom: newUser.nom,
                prenom: newUser.prenom,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
  
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
  
      // Generate the token
      const token = await generateToken(user._id, user.role);
  
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Get user profile
const getUserProfile = async (req, res) => {
    const userId = req.userId; // Set by verifyToken middleware
  
    try {
      // Find user by ID
      const user = await User.findById(userId).select('-password'); // Exclude password field
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({
        message: "User profile retrieved successfully",
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          date_de_naissance: user.date_de_naissance,
          genre: user.genre,
          numero_telephone: user.numero_telephone,
          adresse: user.adresse,
          photo: user.photo,
          institution: user.institution,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Update user profile
const updateUserProfile = async (req, res) => {
    const userId = req.userId; // Set by verifyToken middleware
    const { nom, prenom, email, date_de_naissance, genre, numero_telephone, adresse, photo, institution } = req.body;
  
    try {
      // Find user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update allowed fields
      if (nom) user.nom = nom;
      if (prenom) user.prenom = prenom;
      if (email) user.email = email;
      if (date_de_naissance) user.date_de_naissance = date_de_naissance;
      if (genre) user.genre = genre;
      if (numero_telephone) user.numero_telephone = numero_telephone;
      if (adresse) user.adresse = adresse;
      if (photo) user.photo = photo;
      if (institution) user.institution = institution;
  
      // Save updated user
      await user.save();
  
      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          date_de_naissance: user.date_de_naissance,
          genre: user.genre,
          numero_telephone: user.numero_telephone,
          adresse: user.adresse,
          photo: user.photo,
          institution: user.institution,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Update user password
const updatePassword = async (req, res) => {
  const userId = req.userId; // Set by verifyToken middleware
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "Please provide current password, new password, and confirmation password" });
  }

  // Check if new password and confirm password match
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "New passwords do not match" });
  }

  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password is correct
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
/*
  // Request password reset
const requestPasswordResetController = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    await requestPasswordReset(phoneNumber);
    res.status(200).json({ message: "Reset code sent via SMS" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Verify reset code
const verifyResetCodeController = async (req, res) => {
  const { phoneNumber, resetCode } = req.body;
  try {
    await verifyResetCode(phoneNumber, resetCode);
    res.status(200).json({ message: "Reset code verified. You can now reset your password." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Reset password
const resetPasswordController = async (req, res) => {
  const { phoneNumber, newPassword } = req.body;
  try {
    await resetPassword(phoneNumber, newPassword);
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
*/

module.exports = { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  updatePassword,
  /*requestPasswordResetController, 
  verifyResetCodeController, 
  resetPasswordController */
};
