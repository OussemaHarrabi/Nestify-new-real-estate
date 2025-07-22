const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, phone, fullName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Un utilisateur avec cet email existe déjà'
        }
      });
    }
    
    // Create user (password will be hashed by the beforeSave hook)
    const newUser = await User.create({
      email,
      password,
      phone,
      fullName
    });
    
    console.log('User created successfully:', newUser.id);
    
    // Generate JWT token
    const accessToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone
        },
        accessToken
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Erreur serveur lors de l\'inscription',
        details: error.message
      }
    });
  }
};

const login = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Login temporairement désactivé'
  });
};

module.exports = {
  register,
  login
};