const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");

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

  if (!user) {
    throw new AppError("Utilisateur non trouvé", 404);
  }

  return formatUserResponse(user);
};

const updateProfile = async (userId, data) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("Utilisateur non trouvé", 404);
  }

  // Règle TL-129 : Interdiction formelle de modifier le rôle ou le mot de passe via cette route
  if (data.role !== undefined || data.password !== undefined) {
    throw new AppError("La modification du rôle ou du mot de passe n'est pas autorisée via cette route", 400);
  }

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

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

  if (!user) {
    throw new AppError("Utilisateur non trouvé", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Mot de passe actuel incorrect", 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError("Le nouveau mot de passe doit être différent du mot de passe actuel", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.update(userId, { password: hashedPassword });

  return { message: "Mot de passe modifié avec succès" };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};