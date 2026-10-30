const express = require("express");
const managerController = require("../controllers/manager.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

// Toutes les routes du gestionnaire necessitent une authentification et le role Gestionnaire
router.use(authenticate);
router.use(authorize("Gestionnaire"));

// --- Materiels ---
router.post("/equipments", managerController.createEquipment);
router.put("/equipments/:id", managerController.updateEquipment);
router.patch("/equipments/:id/deactivate", managerController.deactivateEquipment);
router.patch("/equipments/:id/unavailable", managerController.declareUnavailable);
router.patch("/equipments/:id/available", managerController.setAvailable);

// --- Magasin ---
router.get("/store", managerController.getMyStore);

// --- Utilisateurs ---
router.post("/users", managerController.createUser);

// --- Reservations du magasin ---
router.get("/reservations", managerController.getStoreReservations);

module.exports = router;
