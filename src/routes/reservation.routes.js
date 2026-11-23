const express = require("express");
const reservationController = require("../controllers/reservation.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Réservations
 *   description: Réservations de l'utilisateur connecté
 * /api/reservations:
 *   post:
 *     summary: Créer une réservation
 *     tags: [Réservations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [magasinId, materielId, dateDebut, duree]
 *             properties:
 *               magasinId: { type: string }
 *               materielId: { type: string }
 *               dateDebut: { type: string, format: date-time }
 *               duree: { type: number, description: Durée en heures }
 *     responses: { 201: { description: Réservation confirmée }, 400: { description: Données invalides }, 409: { description: Créneau déjà réservé } }
 * /api/reservations/me:
 *   get:
 *     summary: Mes réservations
 *     tags: [Réservations]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Liste } }
 * /api/reservations/emprunts/me:
 *   get:
 *     summary: Mes emprunts (en cours ou terminés)
 *     tags: [Réservations]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Liste } }
 * /api/reservations/{id}:
 *   get:
 *     summary: Détail d'une de mes réservations
 *     tags: [Réservations]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Réservation }, 403: { description: Réservation d'un autre utilisateur }, 404: { description: Introuvable } }
 * /api/reservations/{id}/cancel:
 *   patch:
 *     summary: Annuler une réservation confirmée avant son début
 *     tags: [Réservations]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Réservation annulée }, 400: { description: Annulation impossible }, 403: { description: Réservation d'un autre utilisateur } }
 */
/**
 * @swagger
 * tags:
 *   - name: Réservations
 *     description: Espace Utilisateur - réserver, consulter et annuler ses réservations, consulter ses emprunts
 */

// Toutes les routes de réservation nécessitent d'être connecté
router.use(authenticate);

/**
 * @swagger
 * /api/reservations/emprunts/me:
 *   get:
 *     summary: Consulter ses emprunts et leur historique (réservations "en cours" ou "terminée")
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des emprunts de l'utilisateur connecté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/emprunts/me", reservationController.getMyEmprunts);

/**
 * @swagger
 * /api/reservations/me:
 *   get:
 *     summary: Consulter ses propres réservations avec leur statut
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations de l'utilisateur connecté (la plus récente en premier)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", reservationController.getMyReservations);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Créer une réservation (la date de fin est calculée à partir de la durée)
 *     description: >
 *       Le matériel doit appartenir au magasin choisi, être actif, disponible et en bon état.
 *       Le magasin doit être actif. La date de début ne peut pas être dans le passé et la durée
 *       doit être strictement positive. Deux réservations actives (confirmée, en cours) du même
 *       matériel ne peuvent pas se chevaucher.
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - magasinId
 *               - materielId
 *               - dateDebut
 *               - duree
 *             properties:
 *               magasinId:
 *                 type: string
 *                 example: 671234567890123456789013
 *               materielId:
 *                 type: string
 *                 example: 671234567890123456789012
 *               dateDebut:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-12-01T09:00:00.000Z
 *               duree:
 *                 type: number
 *                 description: Durée en heures (strictement supérieure à 0)
 *                 example: 4
 *     responses:
 *       201:
 *         description: Réservation créée avec succès (statut "confirmée")
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Réservation créée avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Données invalides (durée <= 0, date passée ou invalide, matériel d'un autre magasin, matériel indisponible ou endommagé, magasin inactif)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Magasin introuvable, ou matériel introuvable ou inactif
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Le matériel est déjà réservé sur ce créneau
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", reservationController.create);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Consulter le détail d'une de ses réservations
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     responses:
 *       200:
 *         description: Détail de la réservation (utilisateur, matériel et magasin inclus)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Cette réservation appartient à un autre utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", reservationController.getById);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   patch:
 *     summary: Annuler une réservation confirmée avant son début
 *     description: Une réservation annulée libère le créneau.
 *     tags: [Réservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     responses:
 *       200:
 *         description: Réservation annulée avec succès (statut "annulée")
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Réservation annulée avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: La réservation n'est pas "confirmée" ou a déjà commencé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Cette réservation appartient à un autre utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/:id/cancel", reservationController.cancel);

module.exports = router;