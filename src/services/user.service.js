const userRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");

async function createUser(data) {
  const existingUser = await userRepository.findByEmail(data.email);

  if (existingUser) {
    throw new AppError("Cet email est déjà utilisé", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await userRepository.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role || "Utilisateur",
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function getUserById(id) {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new AppError("Utilisateur introuvable", 404);
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function getUserByEmail(email) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError("Utilisateur introuvable", 404);
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function updateUser(id, data) {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new AppError("Utilisateur introuvable", 404);
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError("Cet email est déjà utilisé", 409);
    }

    data.email = data.email.toLowerCase();
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await userRepository.update(id, data);

  return {
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
  };
}

async function listUsers() {
  const users = await userRepository.list();

  return users.map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  listUsers,
};
