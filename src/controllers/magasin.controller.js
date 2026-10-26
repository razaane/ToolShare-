const magasinService = require("../services/magasin.service");

async function create(req, res, next) {
  try {
    const magasin = await magasinService.createMagasin(req.body);

    res.status(201).json(magasin);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const magasins = await magasinService.listMagasins();

    res.status(200).json(magasins);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const magasin = await magasinService.getMagasinById(
      req.params.id
    );

    res.status(200).json(magasin);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const magasin = await magasinService.updateMagasin(
      req.params.id,
      req.body
    );

    res.status(200).json(magasin);
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const magasin = await magasinService.deactivateMagasin(
      req.params.id
    );

    res.status(200).json({
      message: "Magasin désactivé avec succès",
      magasin,
    });
  } catch (err) {
    next(err);
  }
}

async function assignManager(req, res, next) {
  try {
    const manager = await magasinService.assignManager(
      req.params.id,
      req.body.managerId
    );

    res.status(200).json({
      message: "Gestionnaire affecté avec succès",
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        magasin: manager.magasin,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  deactivate,
  assignManager,
};