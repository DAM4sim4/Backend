const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const twilioService = require('../twilioService'); // Make sure this is imported

const verifyRecoveryCode = (req, res) => {
    const { input, recoveryCode } = req.body; // input is phone/email, recoveryCode is OTP

    if (twilioService.verifyOTP(input, recoveryCode)) {
        res.status(200).send({ message: 'OTP verified successfully' });
    } else {
        res.status(400).send({ error: 'Invalid or expired OTP' });
    }
};
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

const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const forgotPassword = async (req, res) => {
    const { input } = req.body; // Input can be email or phone number
    if (!input) {
        return res.status(400).json({ message: 'Email or phone number is required' });
    }

    try {
        // Find user by email or phone number
        const user = await User.findOne({
            $or: [{ email: input }, { numero_telephone: input }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a 6-digit recovery code
        const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10); // Code expires in 10 minutes

        // Update user with recovery code and expiry
        user.recoveryCode = recoveryCode;
        user.recoveryCodeExpiry = expiry;
        await user.save();

        // Send recovery code via SMS or email
        if (isValidPhoneNumber(input)) {
            // Send SMS
            await client.messages.create({
                body: `Your recovery code is ${recoveryCode}. It expires in 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: input,
            });
            res.status(200).json({ message: 'Recovery code sent via SMS' });
        } else if (isValidEmail(input)) {
            // Send email logic (optional, if email support is needed)
            // Placeholder: use a mailer service like Nodemailer
            res.status(200).json({ message: 'Recovery code sent to email' });
        } else {
            res.status(400).json({ message: 'Invalid email or phone number format' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// const verifyRecoveryCode = async (req, res) => {
//   const { input, recoveryCode } = req.body; // Input: email or phone number, and the code
//   if (!input || !recoveryCode) {
//       return res.status(400).json({ message: 'Input and recovery code are required' });
//   }

//   try {
//       // Find user by email or phone number
//       const user = await User.findOne({
//           $or: [{ email: input }, { numero_telephone: input }],
//       });

//       if (!user || user.recoveryCode !== recoveryCode) {
//           return res.status(400).json({ message: 'Invalid recovery code' });
//       }

//       // Check if code is expired
//       if (new Date() > user.recoveryCodeExpiry) {
//           return res.status(400).json({ message: 'Recovery code has expired' });
//       }

//       // Clear recovery code and expiry after successful verification
//       user.recoveryCode = null;
//       user.recoveryCodeExpiry = null;
//       await user.save();

//       res.status(200).json({ message: 'Recovery code verified successfully' });
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//   }
// };

const resetPassword = async (req, res) => {
  const { input, newPassword } = req.body;
  if (!input || !newPassword) {
      return res.status(400).json({ message: 'Input and new password are required' });
  }

  try {
      // Find user by email or phone number
      const user = await User.findOne({
          $or: [{ email: input }, { numero_telephone: input }],
      });

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user's password
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};



// Helper functions
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhoneNumber = (number) => /^[+]?[0-9]{8,15}$/.test(number);

module.exports = { verifyRecoveryCode,forgotPassword,resetPassword,registerUser, loginUser,logoutUser, getUserProfile, updateUserProfile, banUser, unbanUser, getAllStudents, updatePassword};
