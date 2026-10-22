
const Materiel = require("../models/Materiel");

async function create(data) {
  return await Materiel.create(data);
}

async function findById(id) {
  return await Materiel.findById(id);
}

async function update(id, data) {
  return await Materiel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
}

async function listByStore(magasinId, filters = {}) {
  const query = { magasin: magasinId };

  if (filters.etat) {
    query.etat = filters.etat;
  }

  if (filters.disponibilite) {
    query.disponibilite = filters.disponibilite;
  }

  if (filters.actif !== undefined) {
    query.actif = filters.actif;
  }

  return await Materiel.find(query).sort({ nom: 1 });
}

module.exports = {
  create,
  findById,
  update,
  listByStore
};
