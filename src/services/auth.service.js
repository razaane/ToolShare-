
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const config = require("../config/env");
const AppError = require("../utils/AppError");

async function login(email, password) {
  if (!email || !password) {
    throw new AppError("Email et mot de passe obligatoires", 400);
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) {
    throw new AppError("Email ou mot de passe incorrect", 401);
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    throw new AppError("Email ou mot de passe incorrect", 401);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    message: "Connexion réussie",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

module.exports = { login };
