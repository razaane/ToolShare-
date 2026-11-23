const express = require("express");
const controller = require("../controllers/admin.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();
router.use(authenticate);
router.use(authorize("Admin"));

/**
 * @swagger
 * /api/admin/reservations:
 *   get:
 *     summary: Lister les réservations de tous les magasins (Admin)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [confirmée, en cours, terminée, annulée] } }
 *       - { in: query, name: magasin, schema: { type: string } }
 *       - { in: query, name: materiel, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses:
 *       200: { description: Liste des réservations }
 *       400: { description: Filtre invalide }
 *       401: { description: Non authentifié }
 *       403: { description: Accès réservé aux Admins }
 */
router.get("/reservations", controller.listReservations);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Statistiques globales (magasins, matériels, utilisateurs, réservations par statut)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Statistiques }
 *       401: { description: Non authentifié }
 *       403: { description: Accès réservé aux Admins }
 */
router.get("/stats", controller.getStats);

module.exports = router;