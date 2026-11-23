
const materielRepository = require("../repositories/materiel.repository");
const AppError = require("../utils/AppError");

async function verifierMateriel(magasinId, materielId) {
  const materiel = await materielRepository.findById(materielId);

  if (!materiel) {
    throw new AppError("Matériel introuvable",404);
  }

  if (materiel.magasin.toString() !== magasinId.toString()) {
    throw new AppError("Accès interdit à ce matériel",403);
  }

  return materiel;
}

// Erreur Mongo E11000 (index unique) -> 409 au lieu de 500
function convertirErreurDoublon(err) {
  if (err && err.code === 11000) {
    return new AppError("Cette référence existe déjà", 409);
  }
  return err;
}

async function createMateriel(magasinId, data) {
  if (!data.nom || !data.reference) {
    throw new AppError("Le nom et la référence sont obligatoires",400);
  }

  try {
    return await materielRepository.create({
      nom: data.nom,
      reference: data.reference,
      magasin: magasinId
    });
  } catch (err) {
    throw convertirErreurDoublon(err);
  }
}

async function updateMateriel(magasinId, materielId, data) {
  await verifierMateriel(magasinId, materielId);

  // On ne modifie que les champs réellement envoyés
  const updates = {};
  if (data.nom !== undefined) updates.nom = data.nom;
  if (data.reference !== undefined) updates.reference = data.reference;

  try {
    return await materielRepository.update(materielId, updates);
  } catch (err) {
    throw convertirErreurDoublon(err);
  }
}

async function desactiverMateriel(magasinId, materielId) {
  await verifierMateriel(magasinId, materielId);

  return await materielRepository.update(materielId, {
    actif: false
  });
}

async function declarerIndisponible(magasinId, materielId) {
  await verifierMateriel(magasinId, materielId);

  return await materielRepository.update(materielId, {
    disponibilite: "indisponible"
  });
}

async function remettreEnService(magasinId, materielId) {
  const materiel = await verifierMateriel(magasinId, materielId);

  if (!materiel.actif) {
    throw new AppError("Ce matériel est désactivé",400);
  }

  return await materielRepository.update(materielId, {
    disponibilite: "Disponible",
    etat: "bon"
  });
}

module.exports = {
  createMateriel,
  updateMateriel,
  desactiverMateriel,
  declarerIndisponible,
  remettreEnService
};
