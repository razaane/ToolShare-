const materielService = require("../services/materiel.service");
const userService = require("../services/user.service");
const magasinRepository = require("../repositories/magasin.repository");
const reservationService = require("../services/reservation.service");
const AppError = require("../utils/AppError");

// ============================================================
// GESTION DES MATÉRIELS (TL-152, TL-153, TL-156)
// ============================================================

// Ajouter un matériel dans son magasin
const createEquipment = async (req, res, next) => {
  try {
    const magasinId = req.user.magasin;
    if (!magasinId) {
      throw new AppError("Aucun magasin n'est affecté à ce gestionnaire", 403);
    }

    const materiel = await materielService.createMateriel(magasinId, req.body);
    return res.status(201).json({
      success: true,
      message: "Matériel créé avec succès",
      data: materiel,
    });
  } catch (err) {
    next(err);
  }
};

// Modifier un matériel de son magasin
const updateEquipment = async (req, res, next) => {
  try {
    const magasinId = req.user.magasin;
    const materielId = req.params.id;

    const materiel = await materielService.updateMateriel(magasinId, materielId, req.body);
    return res.status(200).json({
      success: true,
      message: "Matériel mis à jour avec succès",
      data: materiel,
    });
  } catch (err) {
    next(err);
  }
};

// Désactiver un matériel
const deactivateEquipment = async (req, res, next) => {
  try {
    const magasinId = req.user.magasin;
    const materielId = req.params.id;

    const materiel = await materielService.desactiverMateriel(magasinId, materielId);
    return res.status(200).json({
      success: true,
      message: "Matériel désactivé avec succès",
      data: materiel,
    });
  } catch (err) {
    next(err);
  }
};

// Déclarer un matériel indisponible
const declareUnavailable = async (req, res, next) => {
  try {
    const magasinId = req.user.magasin;
    const materielId = req.params.id;

    const materiel = await materielService.declarerIndisponible(magasinId, materielId);
    return res.status(200).json({
      success: true,
      message: "Matériel déclaré indisponible",
      data: materiel,
    });
  } catch (err) {
    next(err);
  }
};

// Remettre un matériel en service (disponible)
const setAvailable = async (req, res, next) => {
  try {
    const magasinId = req.user.magasin;
    const materielId = req.params.id;

    const materiel = await materielService.remettreEnService(magasinId, materielId);
    return res.status(200).json({
      success: true,
      message: "Matériel remis en service avec succès",
      data: materiel,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// CONSULTATION DU MAGASIN (TL-155, TL-157)
// ============================================================

const getMyStore = async (req, res, next) => {
  try {
    const magasinId = req.user.magasin;
    if (!magasinId) {
      throw new AppError("Aucun magasin n'est affecté à ce gestionnaire", 403);
    }

    const store = await magasinRepository.findById(magasinId);
    if (!store) {
      throw new AppError("Magasin introuvable", 404);
    }

    return res.status(200).json({
      success: true,
      data: store,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// CRÉATION DE COMPTE UTILISATEUR (TL-154, TL-157)
// ============================================================

const createUser = async (req, res, next) => {
  try {
    // Le gestionnaire ne peut créer QUE des comptes "Utilisateur" (403 sinon)
    const newUser = await userService.createUser(req.body, req.user.role);
    return res.status(201).json({
      success: true,
      message: "Compte utilisateur créé avec succès",
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
};

// Retourne l'id du magasin du gestionnaire ou lève une 403
const requireManagerStore = (req) => {
  const magasinId = req.user.magasin;
  if (!magasinId) {
    throw new AppError("Aucun magasin n'est affecté à ce gestionnaire", 403);
  }
  return magasinId;
};

const getStoreReservations = async (req, res, next) => {
  try {
    const magasinId = requireManagerStore(req);

    // Filtres optionnels : ?status=confirmée&materiel=<id>&from=2026-11-01&to=2026-11-30
    const reservations = await reservationService.listStoreReservations(magasinId, req.query);
    return res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (err) {
    next(err);
  }
};

const getStoreReservationById = async (req, res, next) => {
  try {
    const magasinId = requireManagerStore(req);
    const reservation = await reservationService.getStoreReservationDetails(req.params.id, magasinId);
    return res.status(200).json({ success: true, data: reservation });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// REMISE, RETOUR, RETARDS ET HISTORIQUE (TL-163 à TL-170)
// ============================================================

const handOverReservation = async (req, res, next) => {
  try {
    const magasinId = requireManagerStore(req);
    const reservation = await reservationService.handOverReservation(req.params.id, magasinId);
    return res.status(200).json({
      success: true,
      message: "Remise du matériel enregistrée",
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};

const returnReservation = async (req, res, next) => {
  try {
    const magasinId = requireManagerStore(req);
    const reservation = await reservationService.returnReservation(
      req.params.id,
      magasinId,
      req.body || {}
    );
    return res.status(200).json({
      success: true,
      message: "Retour du matériel enregistré",
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
};

const getOverdueLoans = async (req, res, next) => {
  try {
    const magasinId = requireManagerStore(req);
    const loans = await reservationService.listOverdueLoans(magasinId);
    return res.status(200).json({ success: true, data: loans });
  } catch (err) {
    next(err);
  }
};

const getStoreHistory = async (req, res, next) => {
  try {
    const magasinId = requireManagerStore(req);
    const history = await reservationService.listStoreHistory(magasinId);
    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEquipment,
  updateEquipment,
  deactivateEquipment,
  declareUnavailable,
  setAvailable,
  getMyStore,
  createUser,
  getStoreReservations,
  getStoreReservationById, handOverReservation, returnReservation, getOverdueLoans, getStoreHistory,
};
