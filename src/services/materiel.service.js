
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

async function createMateriel(magasinId, data) {
  if (!data.nom || !data.reference) {
    throw new AppError("Le nom et la référence sont obligatoires",400);
  }

  return await materielRepository.create({
    nom: data.nom,
    reference: data.reference,
    magasin: magasinId
  });
}

async function updateMateriel(magasinId, materielId, data) {
  await verifierMateriel(magasinId, materielId);

  return await materielRepository.update(materielId, {
    nom: data.nom,
    reference: data.reference
  });
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
