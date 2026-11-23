const express = require("express");
const managerController = require("../controllers/manager.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Gestionnaire
 *   description: Espace Gestionnaire (limité à son magasin)
 * /api/manager/store:
 *   get:
 *     summary: Consulter son magasin
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Magasin }, 401: { description: Non authentifié }, 403: { description: Aucun magasin affecté ou rôle interdit } }
 * /api/manager/equipments:
 *   post:
 *     summary: Ajouter un matériel dans son magasin
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, reference]
 *             properties: { nom: { type: string }, reference: { type: string } }
 *     responses: { 201: { description: Matériel créé }, 400: { description: Données invalides }, 409: { description: Référence déjà utilisée } }
 * /api/manager/equipments/{id}:
 *   put:
 *     summary: Modifier un matériel de son magasin
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Matériel modifié }, 403: { description: Autre magasin }, 404: { description: Introuvable }, 409: { description: Référence déjà utilisée } }
 * /api/manager/equipments/{id}/deactivate:
 *   patch:
 *     summary: Désactiver un matériel
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Matériel désactivé }, 403: { description: Autre magasin }, 404: { description: Introuvable } }
 * /api/manager/equipments/{id}/unavailable:
 *   patch:
 *     summary: Déclarer un matériel indisponible
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Matériel indisponible }, 403: { description: Autre magasin }, 404: { description: Introuvable } }
 * /api/manager/equipments/{id}/available:
 *   patch:
 *     summary: Remettre un matériel en service
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Matériel remis en service }, 400: { description: Matériel désactivé }, 403: { description: Autre magasin } }
 * /api/manager/users:
 *   post:
 *     summary: Créer un compte Utilisateur (rôle Utilisateur uniquement)
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties: { name: { type: string }, email: { type: string, format: email }, password: { type: string } }
 *     responses: { 201: { description: Compte créé }, 403: { description: Rôle Admin ou Gestionnaire interdit }, 409: { description: Email déjà utilisé } }
 * /api/manager/reservations:
 *   get:
 *     summary: Réservations du magasin (filtres statut, matériel, période)
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [confirmée, en cours, terminée, annulée] } }
 *       - { in: query, name: materiel, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses: { 200: { description: Liste }, 400: { description: Filtre invalide } }
 * /api/manager/reservations/overdue:
 *   get:
 *     summary: Emprunts en retard
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Liste des retards } }
 * /api/manager/reservations/history:
 *   get:
 *     summary: Historique des remises et retours du magasin
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Historique } }
 * /api/manager/reservations/{id}:
 *   get:
 *     summary: Détail d'une réservation du magasin
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Réservation }, 403: { description: Autre magasin }, 404: { description: Introuvable } }
 * /api/manager/reservations/{id}/handover:
 *   patch:
 *     summary: Enregistrer la remise (confirmée vers en cours)
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Remise enregistrée }, 403: { description: Autre magasin }, 409: { description: Transition interdite ou matériel déjà emprunté } }
 * /api/manager/reservations/{id}/return:
 *   patch:
 *     summary: Enregistrer le retour (en cours vers terminée) avec l'état constaté
 *     tags: [Gestionnaire]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [etatRetour]
 *             properties: { etatRetour: { type: string, enum: [bon, endommagé] } }
 *     responses: { 200: { description: Retour enregistré }, 400: { description: État constaté manquant }, 403: { description: Autre magasin }, 409: { description: Transition interdite } }
 */

/**
 * @swagger
 * tags:
 *   - name: Gestionnaire
 *     description: Espace Gestionnaire - matériels, comptes, réservations, remises et retours de son magasin uniquement
 */

// Toutes les routes du gestionnaire necessitent une authentification et le role Gestionnaire
router.use(authenticate);
router.use(authorize("Gestionnaire"));

// --- Materiels ---

/**
 * @swagger
 * /api/manager/equipments:
 *   post:
 *     summary: Ajouter un matériel dans son magasin
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - reference
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Perceuse à percussion
 *               reference:
 *                 type: string
 *                 description: Référence unique
 *                 example: PERC-001
 *     responses:
 *       201:
 *         description: Matériel créé avec succès
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
 *                   example: Matériel créé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Materiel'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou aucun magasin affecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Cette référence existe déjà
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/equipments", managerController.createEquipment);

/**
 * @swagger
 * /api/manager/equipments/{id}:
 *   put:
 *     summary: Modifier un matériel de son magasin
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EquipmentId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Perceuse sans fil
 *               reference:
 *                 type: string
 *                 example: PERC-002
 *     responses:
 *       200:
 *         description: Matériel mis à jour avec succès
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
 *                   example: Matériel mis à jour avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Materiel'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou matériel d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Cette référence existe déjà
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/equipments/:id", managerController.updateEquipment);

/**
 * @swagger
 * /api/manager/equipments/{id}/deactivate:
 *   patch:
 *     summary: Désactiver un matériel de son magasin
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EquipmentId'
 *     responses:
 *       200:
 *         description: Matériel désactivé avec succès
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
 *                   example: Matériel désactivé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Materiel'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou matériel d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/equipments/:id/deactivate", managerController.deactivateEquipment);

/**
 * @swagger
 * /api/manager/equipments/{id}/unavailable:
 *   patch:
 *     summary: Déclarer un matériel indisponible
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EquipmentId'
 *     responses:
 *       200:
 *         description: Matériel déclaré indisponible
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
 *                   example: Matériel déclaré indisponible
 *                 data:
 *                   $ref: '#/components/schemas/Materiel'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou matériel d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/equipments/:id/unavailable", managerController.declareUnavailable);

/**
 * @swagger
 * /api/manager/equipments/{id}/available:
 *   patch:
 *     summary: Remettre un matériel en service (disponible et en bon état)
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EquipmentId'
 *     responses:
 *       200:
 *         description: Matériel remis en service avec succès
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
 *                   example: Matériel remis en service avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Materiel'
 *       400:
 *         description: Ce matériel est désactivé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou matériel d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/equipments/:id/available", managerController.setAvailable);

// --- Magasin ---

/**
 * @swagger
 * /api/manager/store:
 *   get:
 *     summary: Consulter son magasin
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Magasin du gestionnaire connecté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 671234567890123456789013
 *                     nom:
 *                       type: string
 *                       example: Magasin Safi
 *                     site:
 *                       type: string
 *                       example: Safi
 *                     adresse:
 *                       type: string
 *                       example: Zone industrielle de Safi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou aucun magasin affecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Magasin introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/store", managerController.getMyStore);

// --- Utilisateurs ---

/**
 * @swagger
 * /api/manager/users:
 *   post:
 *     summary: Créer un compte Utilisateur (le rôle Utilisateur uniquement)
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: motdepasse123
 *               role:
 *                 type: string
 *                 enum: [Utilisateur]
 *                 default: Utilisateur
 *                 description: Seul le rôle Utilisateur est autorisé pour un gestionnaire
 *     responses:
 *       201:
 *         description: Compte utilisateur créé avec succès
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
 *                   example: Compte utilisateur créé avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 671234567890123456789015
 *                     name:
 *                       type: string
 *                       example: Jean Dupont
 *                     email:
 *                       type: string
 *                       example: jean@test.com
 *                     role:
 *                       type: string
 *                       example: Utilisateur
 *       400:
 *         description: Champs obligatoires manquants ou rôle invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Un gestionnaire ne peut créer ni Admin ni Gestionnaire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Cet email est déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/users", managerController.createUser);

// --- Reservations du magasin ---

/**
 * @swagger
 * /api/manager/reservations:
 *   get:
 *     summary: Consulter et filtrer les réservations de son magasin
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [confirmée, en cours, terminée, annulée]
 *         description: Filtrer par statut
 *       - in: query
 *         name: materiel
 *         schema:
 *           type: string
 *         description: Filtrer par ID de matériel
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Début de période (réservations qui commencent à partir de cette date)
 *         example: 2026-12-01
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fin de période (une date seule inclut toute la journée)
 *         example: 2026-12-31
 *     responses:
 *       200:
 *         description: Réservations du magasin (la plus récente en premier)
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
 *       400:
 *         description: Statut, identifiant, date ou période invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou aucun magasin affecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/reservations", managerController.getStoreReservations);

// --- Retards et historique (declarees avant "/reservations/:id") ---

/**
 * @swagger
 * /api/manager/reservations/overdue:
 *   get:
 *     summary: Consulter les emprunts en retard de son magasin
 *     description: Emprunts "en cours" dont la date de fin est dépassée sans retour enregistré.
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emprunts en retard (le plus ancien en premier)
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
 *       403:
 *         description: Rôle autre que Gestionnaire, ou aucun magasin affecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/reservations/overdue", managerController.getOverdueLoans);

/**
 * @swagger
 * /api/manager/reservations/history:
 *   get:
 *     summary: Consulter l'historique des mouvements de son magasin (remises et retours)
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réservations "en cours" et "terminée" du magasin (remise la plus récente en premier)
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
 *       403:
 *         description: Rôle autre que Gestionnaire, ou aucun magasin affecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/reservations/history", managerController.getStoreHistory);

/**
 * @swagger
 * /api/manager/reservations/{id}:
 *   get:
 *     summary: Consulter le détail d'une réservation de son magasin
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     responses:
 *       200:
 *         description: Détail de la réservation
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
 *       400:
 *         description: Identifiant de réservation invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou réservation d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/reservations/:id", managerController.getStoreReservationById);

// --- Remise et retour du materiel ---

/**
 * @swagger
 * /api/manager/reservations/{id}/handover:
 *   patch:
 *     summary: Enregistrer la remise du matériel (confirmée vers en cours)
 *     description: >
 *       Enregistre la date réelle de remise. La remise est refusée (409) si la réservation n'est pas
 *       "confirmée" (double remise comprise), si le matériel est déjà emprunté ou s'il est
 *       indisponible ou endommagé.
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     responses:
 *       200:
 *         description: Remise enregistrée (statut "en cours")
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
 *                   example: Remise du matériel enregistrée
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Identifiant de réservation invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou réservation d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Transition interdite, matériel déjà emprunté, ou matériel indisponible ou endommagé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/reservations/:id/handover", managerController.handOverReservation);

/**
 * @swagger
 * /api/manager/reservations/{id}/return:
 *   patch:
 *     summary: Enregistrer le retour du matériel et son état constaté (en cours vers terminée)
 *     description: >
 *       Enregistre la date réelle de retour et l'état constaté. Si le matériel est retourné
 *       "endommagé", il devient automatiquement indisponible. Le retour est refusé (409) si la
 *       réservation n'est pas "en cours".
 *     tags: [Gestionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - etatRetour
 *             properties:
 *               etatRetour:
 *                 type: string
 *                 enum: [bon, endommagé]
 *                 example: bon
 *     responses:
 *       200:
 *         description: Retour enregistré (statut "terminée")
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
 *                   example: Retour du matériel enregistré
 *                 data:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: État constaté absent ou invalide, ou identifiant de réservation invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rôle autre que Gestionnaire, ou réservation d'un autre magasin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Transition interdite (la réservation n'est pas "en cours")
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/reservations/:id/return", managerController.returnReservation);

module.exports = router;