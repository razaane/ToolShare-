const userService = require("../services/user.service");

/**
 * Récupérer le profil de l'utilisateur connecté (GET /api/users/me)
 */
const getMe = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur connecté (PUT /api/users/me)
 * Règle : Rôle et mot de passe non modifiables
 */
const updateMe = async (req, res, next) => {
  try {
    const updatedProfile = await userService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: updatedProfile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Modifier son mot de passe (PATCH /api/users/me/password)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
};
