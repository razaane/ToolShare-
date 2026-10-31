const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");

const JWT_SECRET = process.env.JWT_SECRET || "toolshare_jwt_secret_dev_key_2026";

/**
 * Middleware d'authentification vérifiant le JWT Bearer Token
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Accès non autorisé : jeton manquant", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next(new AppError("Jeton invalide ou expiré", 401));
    }

    const user = await userRepository.findById(decoded.id || decoded.userId || decoded._id);
    if (!user) {
      return next(new AppError("L'utilisateur associé à ce jeton n'existe plus", 401));
    }

    // Injection de l'utilisateur dans la requête (avec magasin pour le gestionnaire)
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      magasin: user.magasin ? user.magasin.toString() : null,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware d'autorisation par rôle
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Accès interdit : permissions insuffisantes", 403));
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  JWT_SECRET,
};
