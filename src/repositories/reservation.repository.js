const Reservation = require("../models/reservation.model");

async function create(data) {
  return await Reservation.create(data);
}

async function findById(id) {
  return await Reservation.findById(id)
    .populate("utilisateur", "name email role")
    .populate("materiel", "nom reference etat disponibilite")
    .populate("magasin", "nom site adresse");
}

/**
 * Chercher les réservations actives qui chevauchent le créneau [startAt, endAt[
 * Règle TL-50 / TL-140 :
 * - Statuts bloquants : "confirmée", "en cours"
 * - Chevauchement : dateDebut < endAt && dateFin > startAt
 * - début == fin est autorisé (pas de chevauchement)
 */
async function findOverlapping(materielId, startAt, endAt) {
  return await Reservation.find({
    materiel: materielId,
    status: { $in: ["confirmée", "en cours"] },
    dateDebut: { $lt: endAt },
    dateFin: { $gt: startAt },
  });
}

async function findByUser(userId) {
  return await Reservation.find({ utilisateur: userId })
    .populate("materiel", "nom reference")
    .populate("magasin", "nom site")
    .sort({ dateDebut: -1 });
}

async function findByStore(magasinId, filters = {}) {
  const query = { magasin: magasinId };
  if (filters.status) query.status = filters.status;
  if (filters.materiel) query.materiel = filters.materiel;
  return await Reservation.find(query)
    .populate("utilisateur", "name email")
    .populate("materiel", "nom reference")
    .sort({ dateDebut: -1 });
}

async function update(id, data) {
  return await Reservation.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

module.exports = {
  create,
  findById,
  findOverlapping,
  findByUser,
  findByStore,
  update,
};
