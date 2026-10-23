
const userRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");

const ROLES = ["Admin", "Gestionnaire", "Utilisateur"];

async function createUser(data, creatorRole) {
  const role = data.role || "Utilisateur";

  if (!ROLES.includes(role)) {
    throw new AppError("Rôle invalide", 400);
  }

  if (creatorRole === "Gestionnaire" && role !== "Utilisateur") {
    throw new AppError(
      "Un gestionnaire peut créer uniquement des utilisateurs",
      403
    );
  }

  if (!["Admin", "Gestionnaire"].includes(creatorRole)) {
    throw new AppError("Accès refusé", 403);
  }

  if (!data.name || !data.email || !data.password) {
    throw new AppError("name, email et password sont obligatoires", 400);
  }

  const email = data.email.trim().toLowerCase();
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError("Cet email est déjà utilisé", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await userRepository.create({
    name: data.name.trim(),
    email,
    password: hashedPassword,
    role,
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
  if (!user) throw new AppError("Utilisateur introuvable", 404);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function getUserByEmail(email) {
  if (!email) throw new AppError("Email obligatoire", 400);

  const user = await userRepository.findByEmail(email.trim());
  if (!user) throw new AppError("Utilisateur introuvable", 404);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function updateUser(id, data) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("Utilisateur introuvable", 404);

  // Le rôle doit être valide s'il est fourni.
  if (data.role !== undefined && !ROLES.includes(data.role)) {
    throw new AppError("Rôle invalide", 400);
  }

  // Ne modifier que les champs autorisés.
  const updates = {};

  if (data.name !== undefined) updates.name = data.name.trim();

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();

    if (email !== user.email) {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new AppError("Cet email est déjà utilisé", 409);
      }
    }

    updates.email = email;
  }

  if (data.password !== undefined && data.password !== "") {
    updates.password = await bcrypt.hash(data.password, 10);
  }

  if (data.role !== undefined) updates.role = data.role;

  const updatedUser = await userRepository.update(id, updates);

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
