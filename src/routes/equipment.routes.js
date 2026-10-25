const express = require("express");
const equipmentController = require("../controllers/equipment.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Matériels
 *   description: Gestion et disponibilité des matériels
 */

/**
 * @swagger
 * /api/equipments/{id}/availability:
 *   get:
 *     summary: Vérifier la disponibilité d'un matériel sur un créneau (début et durée)
 *     tags: [Matériels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du matériel
 *       - in: query
 *         name: startAt
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         example: "2026-11-01T09:00:00.000Z"
 *         description: Date et heure de début
 *       - in: query
 *         name: durationHours
 *         required: true
 *         schema:
 *           type: number
 *         example: 4
 *         description: Durée en heures
 *     responses:
 *       200:
 *         description: Statut de disponibilité récupéré avec succès
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Matériel introuvable
 *       401:
 *         description: Non authentifié
 */
router.get("/:id/availability", authenticate, equipmentController.checkAvailability);
router.get("/:id/disponibilite", authenticate, equipmentController.checkAvailability);

module.exports = router;
