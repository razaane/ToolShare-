const mongoose = require("mongoose");
const reservationRepository = require("../repositories/reservation.repository");
const Magasin = require("../models/magasin.model");
const Materiel = require("../models/materiel.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

const STATUTS = ["confirmée", "en cours", "terminée", "annulée"];

const checkId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} invalide`, 400);
  }
};

const parseDate = (value, label, endOfDay = false) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new AppError(`${label} invalide`, 400);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
};

const listAllReservations = async (query = {}) => {
  const filters = {};
  if (query.status) {
    if (!STATUTS.includes(query.status)) throw new AppError("Statut invalide", 400);
    filters.status = query.status;
  }
  if (query.magasin) { checkId(query.magasin, "Identifiant de magasin"); filters.magasin = query.magasin; }
  if (query.materiel) { checkId(query.materiel, "Identifiant de matériel"); filters.materiel = query.materiel; }
  if (query.from) filters.from = parseDate(query.from, "Date de début de période");
  if (query.to) filters.to = parseDate(query.to, "Date de fin de période", true);
  if (filters.from && filters.to && filters.from > filters.to) {
    throw new AppError("La période est invalide : from doit précéder to", 400);
  }
  return await reservationRepository.findAll(filters);
};

const getStats = async () => {
  const [stores, equipments, users, byStatus] = await Promise.all([
    Magasin.countDocuments(),
    Materiel.countDocuments(),
    User.countDocuments(),
    reservationRepository.countByStatus(),
  ]);

  const reservationsByStatus = Object.fromEntries(STATUTS.map((s) => [s, 0]));
  byStatus.forEach(({ _id, count }) => { reservationsByStatus[_id] = count; });

  return {
    stores,
    equipments,
    users,
    reservations: {
      total: Object.values(reservationsByStatus).reduce((a, b) => a + b, 0),
      byStatus: reservationsByStatus,
    },
  };
};

module.exports = { listAllReservations, getStats };