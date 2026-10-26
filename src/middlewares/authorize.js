const AppError = require("../utils/AppError");

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("Non authentifié", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError("Accès refusé", 403));
        }

        next();
    };
}

module.exports = authorize;