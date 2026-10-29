const express = require("express");
const reservationController = require("../controllers/reservation.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Toutes les routes de réservation nécessitent d'être connecté
router.use(authenticate);

// Consulter ses emprunts
router.get("/emprunts/me", reservationController.getMyEmprunts);

// Consulter ses propres réservations
router.get("/me", reservationController.getMyReservations);

// Créer une nouvelle réservation
router.post("/", reservationController.create);

// Consulter les détails d'une réservation
router.get("/:id", reservationController.getById);

// Annuler une réservation
router.patch("/:id/cancel", reservationController.cancel);

module.exports = router;
