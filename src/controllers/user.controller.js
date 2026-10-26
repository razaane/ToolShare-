const userService = require("../services/user.service");
const {
  validateChangePassword,
  validateUpdateProfile,
} = require("../validators/user.validator");

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
 * Règle : Rôle et mot de passe non modifiables (TL-129)
 */
const updateMe = async (req, res, next) => {
  try {
    validateUpdateProfile(req.body);
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
 * Modifier son mot de passe (PATCH /api/users/me/password) (TL-130)
 */
const changePassword = async (req, res, next) => {
  try {
    validateChangePassword(req.body);
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

// --- Fonctions Admin (EPIC 7 - Razane) ---

async function create(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user.role);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function getByEmail(req, res, next) {
  try {
    const user = await userService.getUserByEmail(req.query.email);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const user = await userService.deactivateUser(req.params.id);
    res.status(200).json({
      message: "Compte désactivé avec succès",
      user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // EPIC 9 (Adnane)
  getMe,
  updateMe,
  changePassword,
  // EPIC 7 Admin (Razane)
  create,
  getById,
  getByEmail,
  update,
  list,
  deactivate,
};
