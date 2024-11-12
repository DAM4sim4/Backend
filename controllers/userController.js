const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');

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

module.exports = { registerUser, loginUser };
