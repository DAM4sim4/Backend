const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const twilioService = require('../twilioService'); // Make sure this is imported
const { sendOTP } = require('../twilioService'); // Ensure the correct path to twilioService



// Register User
const registerUser = async (req, res) => {
  const {
      nom, prenom, email, password, date_de_naissance, genre,
      numero_telephone, role, adresse, photo, institution,
      sport, creativity, lifestyle, science, divertissement
  } = req.body;

  // Validate required fields
  if (!nom || !prenom || !email || !password || !date_de_naissance || !genre || !numero_telephone || !role) {
      return res.status(400).json({
          error: true,
          message: 'Please provide all required fields'
      });
  }

  try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
          return res.status(400).json({
              error: true,
              message: 'Email is already in use'
          });
      }

      // Validate password strength
      if (password.length < 8) {
          return res.status(400).json({
              error: true,
              message: 'Password must be at least 8 characters long'
          });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          date_de_naissance,
          genre,
          numero_telephone,
          role: role.toLowerCase(), // Normalize role to lowercase
          adresse: adresse?.trim() || '',
          photo: photo || '',
          institution: institution?.trim() || '',
          sport: sport || [],
          creativity: creativity || [],
          lifestyle: lifestyle || [],
          science: science || [],
          divertissement: divertissement || []
      });

      // Save user to database
      await newUser.save();

      // Respond with success
      return res.status(201).json({
          error: false,
          message: 'User registered successfully',
          user: {
              id: newUser._id,
              nom: newUser.nom,
              prenom: newUser.prenom,
              email: newUser.email,
              role: newUser.role
          }
      });
  } catch (error) {
      console.error('Error during user registration:', error.message);

      // Respond with generic server error
      return res.status(500).json({
          error: true,
          message: 'An internal server error occurred'
      });
  }
};


// Login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
    
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
    
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
    
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
      res.status(500).json({ message: "An internal server error occurred" });
    }
  };

  const logoutUser = async (req, res) => {
    try {
      const userId = req.userId; // Extracted from verifyToken middleware
  
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update the isConnected status to false
      user.isConnected = false;
      await user.save();
  
      res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
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

  // Ban a user
const banUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(400).json({ message: 'User is already banned' });
  }

    user.isBanned = true;
    await user.save();

    res.status(200).json({ message: 'User has been banned' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unban a user
const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isBanned) {
      return res.status(400).json({ message: 'User is already not banned' });
  }

    user.isBanned = false;
    await user.save();

    res.status(200).json({ message: 'User has been unbanned' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all students (admin only)
const getAllStudents = async (req, res) => {
  try {
    // Extract sorting parameters from query 
    const sortBy = req.query.sortBy || 'nom';
    const order = req.query.order === 'desc' ? -1 : 1;

    // Find all users with the role of 'student' and sort based on the query parameters
    const students = await User.find({ role: 'student' })
      .select('-password') // Exclude password
      .sort({ [sortBy]: order }); // Apply sorting

    res.status(200).json({
      message: 'List of students retrieved successfully',
      students,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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


// Helper to create error responses
const createError = (status, message) => ({ status, message });

// Utility to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Forgot Password - Send Recovery Code
const forgotPassword = async (req, res) => {
    const { input } = req.body;

    if (!input) {
        return res.status(400).json({ message: 'Email or phone number is required.' });
    }

    try {
        const user = await User.findOne({
            $or: [{ email: input }, { numero_telephone: input }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Generate OTP and set expiry
        const otp = generateOTP();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10);

        // Save OTP and expiry
        user.recoveryCode = otp;
        user.recoveryCodeExpiry = expiry;
        await user.save();

        // Send OTP via Twilio
        await sendOTP(input, otp);

        return res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// Verify OTP
const verifyRecoveryCode = async (req, res) => {
    const { input, recoveryCode } = req.body;

    if (!input || !recoveryCode) {
        return res.status(400).json({ message: 'Input and OTP are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [{ email: input }, { numero_telephone: input }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.recoveryCode !== recoveryCode || new Date() > user.recoveryCodeExpiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        return res.status(200).json({ message: 'OTP verified successfully.' });
    } catch (error) {
        console.error('OTP verification error:', error.message);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// Reset Password
const resetPasswordWithOTP = async (req, res) => {
    const { input, recoveryCode, newPassword } = req.body;

    if (!input || !recoveryCode || !newPassword) {
        return res.status(400).json({ message: 'Input, OTP, and new password are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [{ email: input }, { numero_telephone: input }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.recoveryCode !== recoveryCode || new Date() > user.recoveryCodeExpiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Update password
        user.password = await bcrypt.hash(newPassword, 10);
        user.recoveryCode = null;
        user.recoveryCodeExpiry = null;
        await user.save();

        return res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Password reset error:', error.message);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};



module.exports = { verifyRecoveryCode,forgotPassword, verifyRecoveryCode,
  resetPasswordWithOTP,registerUser, loginUser,logoutUser, getUserProfile, updateUserProfile, banUser, unbanUser, getAllStudents, updatePassword};
