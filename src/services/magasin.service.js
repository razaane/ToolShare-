const magasinRepository = require("../repositories/magasin.repository");
const userRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");

async function createMagasin(data) {
  if (!data.nom || !data.site || !data.adresse) {
    throw new AppError(
      "nom, site et adresse sont obligatoires",
      400
    );
  }

  const magasin = await magasinRepository.create({
    nom: data.nom.trim(),
    site: data.site.trim(),
    adresse: data.adresse.trim(),
  });

  return magasin;
}

async function getMagasinById(id) {
  const magasin = await magasinRepository.findById(id);

  if (!magasin) {
    throw new AppError("Magasin introuvable", 404);
  }

  return magasin;
}

async function listMagasins() {
  return await magasinRepository.findAll();
}

async function updateMagasin(id, data) {
  const magasin = await magasinRepository.findById(id);

  if (!magasin) {
    throw new AppError("Magasin introuvable", 404);
  }

  const updates = {};

  if (data.nom !== undefined) {
    updates.nom = data.nom.trim();
  }

  if (data.site !== undefined) {
    updates.site = data.site.trim();
  }

  if (data.adresse !== undefined) {
    updates.adresse = data.adresse.trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("Aucune modification fournie", 400);
  }

  return await magasinRepository.update(id, updates);
}

async function deactivateMagasin(id) {
  const magasin = await magasinRepository.findById(id);

  if (!magasin) {
    throw new AppError("Magasin introuvable", 404);
  }

  if (magasin.isActive === false) {
    throw new AppError("Ce magasin est déjà désactivé", 400);
  }

  return await magasinRepository.update(id, {
    isActive: false,
  });
}

async function assignManager(magasinId, managerId) {
  const magasin = await magasinRepository.findById(magasinId);

  if (!magasin) {
    throw new AppError("Magasin introuvable", 404);
  }

  if (magasin.isActive === false) {
    throw new AppError("Impossible d'affecter un gestionnaire à un magasin désactivé", 400);
  }

  const manager = await userRepository.findById(managerId);

  if (!manager) {
    throw new AppError("Gestionnaire introuvable", 404);
  }

  if (manager.role !== "Gestionnaire") {
    throw new AppError(
      "Le compte doit avoir le rôle Gestionnaire",
      400
    );
  }

  if (manager.isActive === false) {
    throw new AppError(
      "Le gestionnaire est désactivé",
      400
    );
  }

  return await userRepository.update(managerId, {
    magasin: magasinId,
  });
}

module.exports = {
  createMagasin,
  getMagasinById,
  listMagasins,
  updateMagasin,
  deactivateMagasin,
  assignManager,
};