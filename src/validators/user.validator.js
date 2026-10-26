const AppError = require("../utils/AppError");

/**
 * Valide les données de changement de mot de passe
 */
const validateChangePassword = (body) => {
  const { currentPassword, newPassword } = body;

  if (!currentPassword || typeof currentPassword !== "string") {
    throw new AppError("Le mot de passe actuel est obligatoire", 400);
  }

  if (!newPassword || typeof newPassword !== "string") {
    throw new AppError("Le nouveau mot de passe est obligatoire", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Le nouveau mot de passe doit comporter au moins 6 caractères", 400);
  }
};

/**
 * Valide les données de mise à jour du profil
 */
const validateUpdateProfile = (body) => {
  if (body.role !== undefined || body.password !== undefined) {
    throw new AppError(
      "La modification du rôle ou du mot de passe n'est pas autorisée via cette route",
      400
    );
  }

  if (body.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new AppError("Le format de l'adresse email est invalide", 400);
    }
  }

  if (body.name !== undefined && body.name.trim().length === 0) {
    throw new AppError("Le nom ne peut pas être vide", 400);
  }
};

module.exports = {
  validateChangePassword,
  validateUpdateProfile,
};
