function validateCreateMagasin(req, res, next) {
  const { nom, site, adresse } = req.body;

  if (!nom || !site || !adresse) {
    return res.status(400).json({
      message: "nom, site et adresse sont obligatoires",
    });
  }

  next();
}

function validateUpdateMagasin(req, res, next) {
  const { nom, site, adresse } = req.body;

  if (
    nom === undefined &&
    site === undefined &&
    adresse === undefined
  ) {
    return res.status(400).json({
      message: "Au moins un champ doit être fourni",
    });
  }

  next();
}

module.exports = {
  validateCreateMagasin,
  validateUpdateMagasin,
};