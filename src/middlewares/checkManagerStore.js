const AppError = require("../utils/AppError");

function checkManagerStore(req, res, next) {
  if (!req.user) {
    return next(new AppError("Non authentifié", 401));
  }

  if (req.user.role !== "Gestionnaire") {
    return next();
  }

  const magasinId =
    req.params.magasinId ||
    req.params.storeId ||
    req.params.id;

  if (!req.user.magasin) {
    return next(
      new AppError("Aucun magasin n'est affecté à ce gestionnaire", 403)
    );
  }

  if (req.user.magasin.toString() !== magasinId) {
    return next(
      new AppError(
        "Accès refusé : vous pouvez uniquement agir sur votre magasin",
        403
      )
    );
  }

  next();
}

module.exports = checkManagerStore;