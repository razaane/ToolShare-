const mongoose = require("mongoose");
const reservationRepository = require("../repositories/reservation.repository");
const materielRepository = require("../repositories/materiel.repository");
const magasinRepository = require("../repositories/magasin.repository");
const AppError = require("../utils/AppError");

/**
 * TL-49, TL-50, TL-51 : Créer une réservation avec règles métier, détection de chevauchement et transaction
 */
const createReservation = async ({ userId, magasinId, materielId, dateDebut, duree }) => {
  // 1. Validation de la présence des champs obligatoires
  if (!userId || !magasinId || !materielId) {
    throw new AppError("Identifiants utilisateur, magasin et matériel requis", 400);
  }

  // 2. Validation de la date de début
  if (!dateDebut) {
    throw new AppError("La date de début est requise", 400);
  }
  const startDate = new Date(dateDebut);
  if (isNaN(startDate.getTime())) {
    throw new AppError("La date de début est invalide", 400);
  }
  if (startDate.getTime() < Date.now()) {
    throw new AppError("La date de début ne peut pas être dans le passé", 400);
  }

  // 3. Validation de la durée
  const parsedDuree = Number(duree);
  if (!parsedDuree || parsedDuree <= 0) {
    throw new AppError("La durée doit être un nombre d'heures strictement supérieur à 0", 400);
  }

  // 4. Calcul automatique de la date de fin
  const endDate = new Date(startDate.getTime() + parsedDuree * 3600 * 1000);

  // 5. Vérifier que le magasin existe et est actif
  const magasin = await magasinRepository.findById(magasinId);
  if (!magasin) {
    throw new AppError("Magasin introuvable", 404);
  }
  const isMagasinActif = magasin.isActive !== undefined ? magasin.isActive : magasin.actif;
  if (!isMagasinActif) {
    throw new AppError("Le magasin choisi est inactif", 400);
  }

  // 6. Vérifier que le matériel existe et est actif
  const materiel = await materielRepository.findById(materielId);
  if (!materiel || materiel.actif === false) {
    throw new AppError("Matériel introuvable ou inactif", 404);
  }

  // 7. Vérifier que le matériel appartient bien au magasin sélectionné
  const materielMagasinId = materiel.magasin ? materiel.magasin.toString() : "";
  if (materielMagasinId !== magasinId.toString()) {
    throw new AppError("Le matériel n'appartient pas au magasin choisi", 400);
  }

  // 8. Vérifier que le matériel est disponible et en bon état
  if (materiel.disponibilite === "indisponible" || materiel.etat === "endommagé") {
    throw new AppError("Le matériel est indisponible ou endommagé", 400);
  }

  // 9 & 10. TL-51 : Gestion de la concurrence avec session / transaction
  let session = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = null;
    }
  }

  try {
    // Vérification des chevauchements (statuts bloquants : "confirmée", "en cours")
    const overlapping = await reservationRepository.findOverlapping(
      materielId,
      startDate,
      endDate,
      session ? { session } : {}
    );

    if (overlapping && overlapping.length > 0) {
      throw new AppError("Le matériel est déjà réservé sur ce créneau", 409);
    }

    // Création de la réservation
    const reservationData = {
      utilisateur: userId,
      magasin: magasinId,
      materiel: materielId,
      dateDebut: startDate,
      duree: parsedDuree,
      dateFin: endDate,
      status: "confirmée",
    };

    const reservation = await reservationRepository.create(
      reservationData,
      session ? { session } : {}
    );

    if (session) {
      await session.commitTransaction();
    }

    return reservation;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * TL-52 / TL-143 : Consulter ses réservations
 */
const getMyReservations = async (userId) => {
  if (!userId) {
    throw new AppError("Utilisateur non authentifié", 401);
  }
  return await reservationRepository.findByUser(userId);
};

/**
 * TL-52 : Consulter le détail d'une réservation (propriétaire uniquement)
 */
const getReservationById = async (reservationId, userId) => {
  const reservation = await reservationRepository.findById(reservationId);
  if (!reservation) {
    throw new AppError("Réservation introuvable", 404);
  }

  const ownerId = reservation.utilisateur && reservation.utilisateur._id
    ? reservation.utilisateur._id.toString()
    : reservation.utilisateur.toString();

  if (ownerId !== userId.toString()) {
    throw new AppError("Accès refusé à cette réservation", 403);
  }

  return reservation;
};

/**
 * TL-52 / TL-144 : Annuler une réservation confirmée avant son début
 */
const cancelReservation = async (reservationId, userId) => {
  const reservation = await reservationRepository.findById(reservationId);
  if (!reservation) {
    throw new AppError("Réservation introuvable", 404);
  }

  // Vérifier la propriété de la réservation (403 si autre utilisateur)
  const ownerId = reservation.utilisateur && reservation.utilisateur._id
    ? reservation.utilisateur._id.toString()
    : reservation.utilisateur.toString();

  if (ownerId !== userId.toString()) {
    throw new AppError("Vous n'êtes pas autorisé à annuler cette réservation", 403);
  }

  // Vérifier que la réservation est encore au statut confirmée
  if (reservation.status !== "confirmée") {
    throw new AppError("Seule une réservation confirmée peut être annulée", 400);
  }

  // Vérifier que la réservation n'a pas déjà débuté
  if (new Date(reservation.dateDebut).getTime() <= Date.now()) {
    throw new AppError("Impossible d'annuler une réservation déjà commencée ou passée", 400);
  }

  // Mettre à jour le statut à "annulée"
  return await reservationRepository.update(reservationId, { status: "annulée" });
};

/**
 * TL-52 / TL-145 : Consulter ses emprunts (en cours ou terminés)
 */
const getMyEmprunts = async (userId) => {
  if (!userId) {
    throw new AppError("Utilisateur non authentifié", 401);
  }
  return await reservationRepository.findEmpruntsByUser(userId);
};

const STATUTS = ["confirmée", "annulée", "en cours", "terminée"];
const ETATS_RETOUR = ["bon", "endommagé"];

// Retourne l'id (string) d'un champ qui peut être peuplé ou non
const idOf = (value) => (value && value._id ? value._id : value).toString();

const assertObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} invalide`, 400);
  }
};

// Convertit une date de filtre (une date seule "2026-11-30" = fin de journée pour "to")
const parseFilterDate = (value, label, endOfDay = false) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${label} invalide`, 400);
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
};

// Charge une réservation et vérifie qu'elle appartient au magasin du gestionnaire
const getStoreReservation = async (reservationId, magasinId) => {
  assertObjectId(reservationId, "Identifiant de réservation");

  const reservation = await reservationRepository.findById(reservationId);
  if (!reservation) {
    throw new AppError("Réservation introuvable", 404);
  }
  if (!magasinId || idOf(reservation.magasin) !== magasinId.toString()) {
    throw new AppError("Accès refusé : cette réservation n'appartient pas à votre magasin", 403);
  }
  return reservation;
};

/**
 * TL-161 / TL-162 : Réservations du magasin avec filtres (statut, matériel, période)
 * query : { status, materiel, from, to }
 */
const listStoreReservations = async (magasinId, query = {}) => {
  const filters = {};

  if (query.status) {
    if (!STATUTS.includes(query.status)) {
      throw new AppError("Statut invalide", 400);
    }
    filters.status = query.status;
  }

  if (query.materiel) {
    assertObjectId(query.materiel, "Identifiant de matériel");
    filters.materiel = query.materiel;
  }

  if (query.from) filters.from = parseFilterDate(query.from, "Date de début de période");
  if (query.to) filters.to = parseFilterDate(query.to, "Date de fin de période", true);

  if (filters.from && filters.to && filters.from > filters.to) {
    throw new AppError("La période est invalide : from doit précéder to", 400);
  }

  return await reservationRepository.findByStore(magasinId, filters);
};

/**
 * Détail d'une réservation du magasin du gestionnaire
 */
const getStoreReservationDetails = async (reservationId, magasinId) => {
  return await getStoreReservation(reservationId, magasinId);
};

/**
 * TL-163 / TL-164 : Remise du matériel (confirmée -> en cours)
 */
const handOverReservation = async (reservationId, magasinId) => {
  const reservation = await getStoreReservation(reservationId, magasinId);

  if (reservation.status !== "confirmée") {
    throw new AppError(
      `Transition interdite : une réservation "${reservation.status}" ne peut pas être remise`,
      409
    );
  }

  const materielId = idOf(reservation.materiel);

  // Le matériel ne doit pas être déjà emprunté (autre réservation "en cours")
  const dejaEmprunte = await reservationRepository.findInProgressByMateriel(
    materielId,
    reservationId
  );
  if (dejaEmprunte) {
    throw new AppError("Ce matériel est déjà emprunté", 409);
  }

  // Un matériel indisponible ou endommagé ne peut pas être remis
  const materiel = reservation.materiel;
  if (materiel && (materiel.disponibilite === "indisponible" || materiel.etat === "endommagé")) {
    throw new AppError("Ce matériel est indisponible ou endommagé", 409);
  }

  return await reservationRepository.update(reservationId, {
    status: "en cours",
    dateRemise: new Date(),
  });
};

/**
 * TL-165 / TL-166 : Retour du matériel (en cours -> terminée)
 * Si le matériel est retourné "endommagé", il devient indisponible.
 */
const returnReservation = async (reservationId, magasinId, { etatRetour } = {}) => {
  if (!ETATS_RETOUR.includes(etatRetour)) {
    throw new AppError('L\'état constaté est obligatoire ("bon" ou "endommagé")', 400);
  }

  const reservation = await getStoreReservation(reservationId, magasinId);

  if (reservation.status !== "en cours") {
    throw new AppError(
      `Transition interdite : une réservation "${reservation.status}" ne peut pas être retournée`,
      409
    );
  }

  const updated = await reservationRepository.update(reservationId, {
    status: "terminée",
    dateRetourEffective: new Date(),
    etatRetour,
  });

  if (etatRetour === "endommagé") {
    await materielRepository.update(idOf(reservation.materiel), {
      etat: "endommagé",
      disponibilite: "indisponible",
    });
  }

  return updated;
};

/**
 * TL-167 : Emprunts en retard (date de fin dépassée sans retour)
 */
const listOverdueLoans = async (magasinId) => {
  return await reservationRepository.findOverdueByStore(magasinId, new Date());
};

/**
 * TL-168 : Historique des mouvements du magasin
 */
const listStoreHistory = async (magasinId) => {
  return await reservationRepository.findHistoryByStore(magasinId);
};

module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  cancelReservation,
  getMyEmprunts,
  // Espace Gestionnaire
  listStoreReservations,
  getStoreReservationDetails,
  handOverReservation,
  returnReservation,
  listOverdueLoans,
  listStoreHistory,
};