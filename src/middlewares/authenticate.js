
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            throw new AppError("Token manquant", 401);
        }

        const token = header.split(" ")[1];

        const payload = jwt.verify(token, config.jwtSecret);

        const user = await User.findById(payload.id);

        if (!user ) {
            throw new AppError("Utilisateur introuvable ", 401);
        }

        req.user = user;
        next();

    } catch (err) {
        if (err.name === "JsonWebTokenError" ||
            err.name === "TokenExpiredError") {
            return next(new AppError("Token invalide ou expiré", 401));
        }

        next(err);
    }
}

module.exports = authenticate;