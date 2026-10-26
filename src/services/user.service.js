const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");

const ROLES = ["Admin", "Gestionnaire", "Utilisateur"];

// =============================================================
// EPIC 9 - Espace Utilisateur (Adnane) : profil et mot de passe
// =============================================================

const formatUserResponse = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("Utilisateur non trouvé", 404);
  return formatUserResponse(user);
};

const updateProfile = async (userId, data) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("Utilisateur non trouvé", 404);

  // Règle TL-129 : Interdiction formelle de modifier le rôle ou le mot de passe
  if (data.role !== undefined || data.password !== undefined) {
    throw new AppError("La modification du rôle ou du mot de passe n'est pas autorisée via cette route", 400);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.email !== undefined) {
    const newEmail = data.email.trim().toLowerCase();
    if (newEmail !== user.email.toLowerCase()) {
      const existingUser = await userRepository.findByEmail(newEmail);
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        throw new AppError("Cet email est déjà utilisé par un autre compte", 400);
      }
      updateData.email = newEmail;
    }
  }

  const updatedUser = await userRepository.update(userId, updateData);
  return formatUserResponse(updatedUser);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new AppError("Le mot de passe actuel et le nouveau mot de passe sont obligatoires", 400);
  }
  if (newPassword.length < 6) {
    throw new AppError("Le nouveau mot de passe doit comporter au moins 6 caractères", 400);
  }
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("Utilisateur non trouvé", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Mot de passe actuel incorrect", 400);

  if (currentPassword === newPassword) {
    throw new AppError("Le nouveau mot de passe doit être différent du mot de passe actuel", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.update(userId, { password: hashedPassword });
  return { message: "Mot de passe modifié avec succès" };
};

// =============================================================
// EPIC 7 - Espace Admin (Razane) : gestion des comptes
// =============================================================

async function createUser(data, creatorRole) {
  const role = data.role || "Utilisateur";
  if (!ROLES.includes(role)) throw new AppError("Rôle invalide", 400);
  if (creatorRole === "Gestionnaire" && role !== "Utilisateur") {
    throw new AppError("Un gestionnaire peut créer uniquement des utilisateurs", 403);
  }
  if (!["Admin", "Gestionnaire"].includes(creatorRole)) {
    throw new AppError("Accès refusé", 403);
  }
  if (!data.name || !data.email || !data.password) {
    throw new AppError("name, email et password sont obligatoires", 400);
  }
  const email = data.email.trim().toLowerCase();
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) throw new AppError("Cet email est déjà utilisé", 409);

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await userRepository.create({
    name: data.name.trim(),
    email,
    password: hashedPassword,
    role,
  });
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("Utilisateur introuvable", 404);
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function getUserByEmail(email) {
  if (!email) throw new AppError("Email obligatoire", 400);
  const user = await userRepository.findByEmail(email.trim());
  if (!user) throw new AppError("Utilisateur introuvable", 404);
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function updateUser(id, data) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("Utilisateur introuvable", 404);
  if (data.role !== undefined && !ROLES.includes(data.role)) {
    throw new AppError("Rôle invalide", 400);
  }
  const updates = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    if (email !== user.email) {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) throw new AppError("Cet email est déjà utilisé", 409);
    }
    updates.email = email;
  }
  if (data.password !== undefined && data.password !== "") {
    updates.password = await bcrypt.hash(data.password, 10);
  }
  if (data.role !== undefined) updates.role = data.role;
  const updatedUser = await userRepository.update(id, updates);
  return { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role };
}

async function listUsers() {
  const users = await userRepository.list();
  return users.map((user) => ({ id: user._id, name: user.name, email: user.email, role: user.role }));
}

async function deactivateUser(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("Utilisateur introuvable", 404);
  if (user.isActive === false) throw new AppError("Ce compte est déjà désactivé", 400);
  const deactivatedUser = await userRepository.update(id, { isActive: false });
  return { id: deactivatedUser._id, name: deactivatedUser.name, email: deactivatedUser.email, role: deactivatedUser.role, isActive: deactivatedUser.isActive };
}

module.exports = {
  // EPIC 9 (Adnane)
  getProfile,
  updateProfile,
  changePassword,
  // EPIC 7 Admin (Razane)
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  listUsers,
  deactivateUser,
};
