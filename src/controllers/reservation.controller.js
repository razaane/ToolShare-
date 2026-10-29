const reservationService = require("../services/reservation.service");

/**
 * Créer une nouvelle réservation (POST /api/reservations)
 */
const create = async (req, res, next) => {
  try {
    const { magasinId, materielId, dateDebut, duree } = req.body;
    const userId = req.user.id;

    const reservation = await reservationService.createReservation({
      userId,
      magasinId,
      materielId,
      dateDebut,
      duree,
    });

    return res.status(201).json({
      success: true,
      message: "Réservation créée avec succès",
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Consulter la liste de ses propres réservations (GET /api/reservations/me)
 */
const getMyReservations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reservations = await reservationService.getMyReservations(userId);

    return res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Consulter les détails d'une réservation (GET /api/reservations/:id)
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await reservationService.getReservationById(id, userId);

    return res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Annuler une réservation avant son début (PATCH /api/reservations/:id/cancel)
 */
const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cancelledReservation = await reservationService.cancelReservation(id, userId);

    return res.status(200).json({
      success: true,
      message: "Réservation annulée avec succès",
      data: cancelledReservation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Consulter ses emprunts (GET /api/reservations/emprunts/me ou /api/emprunts/me)
 */
const getMyEmprunts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const emprunts = await reservationService.getMyEmprunts(userId);

    return res.status(200).json({
      success: true,
      data: emprunts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getMyReservations,
  getById,
  cancel,
  getMyEmprunts,
};
