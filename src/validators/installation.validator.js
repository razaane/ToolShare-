const AppError = require("../utils/AppError");

function validateInstall(body={}) {
  if (!body.name || !body.email || !body.password) {
    throw new AppError("Tous les champs sont obligatoires", 400);
  }

  if (body.password.length < 8) {
    throw new AppError(
      "Le mot de passe doit contenir au moins 8 caractères",
      400
    );
  }
}

module.exports = {
  validateInstall,
};
