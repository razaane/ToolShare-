const Reservation = require("../models/reservation.model");

// Créer une nouvelle réservation
async function create(data, options = {}) {
  if (options.session) {
    const created = await Reservation.create([data], { session: options.session });
    return created[0];
  }
  return await Reservation.create(data);
}

// Trouver une réservation par son ID avec les détails associés
async function findById(id) {
  return await Reservation.findById(id)
    .populate("utilisateur", "name email role")
    .populate("materiel", "nom reference etat disponibilite")
    .populate("magasin", "nom site adresse");
}

// Chercher les réservations actives qui se chevauchent sur le créneau
async function findOverlapping(materielId, startAt, endAt, options = {}) {
  const query = Reservation.find({
    materiel: materielId,
    status: { $in: ["confirmée", "en cours"] },
    dateDebut: { $lt: endAt },
    dateFin: { $gt: startAt },
  });

  if (options.session) {
    query.session(options.session);
  }

  return await query;
}

// Trouver toutes les réservations d'un utilisateur
async function findByUser(userId) {
  return await Reservation.find({ utilisateur: userId })
    .populate("materiel", "nom reference")
    .populate("magasin", "nom site")
    .sort({ dateDebut: -1 });
}

// Trouver les emprunts d'un utilisateur (en cours ou terminés)
async function findEmpruntsByUser(userId) {
  return await Reservation.find({
    utilisateur: userId,
    status: { $in: ["en cours", "terminée"] },
  })
    .populate("materiel", "nom reference")
    .populate("magasin", "nom site")
    .sort({ dateDebut: -1 });
}

// Trouver les réservations d'un magasin
async function findByStore(magasinId, filters = {}) {
  const query = { magasin: magasinId };
  if (filters.status) query.status = filters.status;
  if (filters.materiel) query.materiel = filters.materiel;
  return await Reservation.find(query)
    .populate("utilisateur", "name email")
    .populate("materiel", "nom reference")
    .sort({ dateDebut: -1 });
}

// Mettre à jour une réservation
async function update(id, data, options = {}) {
  return await Reservation.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    ...(options.session ? { session: options.session } : {}),
  });
}

module.exports = {
  create,
  findById,
  findOverlapping,
  findByUser,
  findEmpruntsByUser,
  findByStore,
  update,
};
