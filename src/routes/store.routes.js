const express = require("express");
const storeController = require("../controllers/store.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Magasins
 *   description: Consultation des magasins et matériels
 */

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Lister les magasins actifs
 *     tags: [Magasins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des magasins actifs récupérée avec succès
 *       401:
 *         description: Non authentifié
 */
router.get("/", authenticate, storeController.getActiveStores);

/**
 * @swagger
 * /api/stores/{id}/equipments:
 *   get:
 *     summary: Lister les matériels d'un magasin actif
 *     tags: [Magasins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du magasin
 *     responses:
 *       200:
 *         description: Liste des matériels du magasin récupérée
 *       404:
 *         description: Magasin introuvable ou inactif
 *       401:
 *         description: Non authentifié
 */
router.get("/:id/equipments", authenticate, storeController.getStoreEquipments);
router.get("/:id/materiels", authenticate, storeController.getStoreEquipments);

module.exports = router;
