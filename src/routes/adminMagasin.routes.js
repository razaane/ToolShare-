const express = require("express");

const router = express.Router();

const controller = require("../controllers/magasin.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  validateCreateMagasin,
  validateUpdateMagasin,
} = require("../validators/magasin.validator");

router.use(authenticate);
router.use(authorize("Admin"));

/**
 * @swagger
 * /api/admin/stores:
 *   post:
 *     summary: Créer un magasin
 *     tags: [Magasins]
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
 *               - site
 *               - adresse
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Magasin Safi
 *               site:
 *                 type: string
 *                 example: Safi
 *               adresse:
 *                 type: string
 *                 example: Zone industrielle de Safi
 *     responses:
 *       201:
 *         description: Magasin créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux Admins
 */
router.post(
  "/",
  validateCreateMagasin,
  controller.create
);

/**
 * @swagger
 * /api/admin/stores:
 *   get:
 *     summary: Lister tous les magasins
 *     tags: [Magasins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des magasins
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux Admins
 */
router.get(
  "/",
  controller.list
);

/**
 * @swagger
 * /api/admin/stores/{id}:
 *   get:
 *     summary: Consulter un magasin
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
 *         description: Magasin trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux Admins
 *       404:
 *         description: Magasin introuvable
 */
router.get(
  "/:id",
  controller.getById
);

/**
 * @swagger
 * /api/admin/stores/{id}:
 *   put:
 *     summary: Modifier un magasin
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Magasin Safi
 *               site:
 *                 type: string
 *                 example: Safi
 *               adresse:
 *                 type: string
 *                 example: Zone industrielle de Safi
 *     responses:
 *       200:
 *         description: Magasin modifié avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux Admins
 *       404:
 *         description: Magasin introuvable
 */
router.put(
  "/:id",
  validateUpdateMagasin,
  controller.update
);

/**
 * @swagger
 * /api/admin/stores/{id}/deactivate:
 *   patch:
 *     summary: Désactiver un magasin
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
 *         description: Magasin désactivé avec succès
 *       400:
 *         description: Magasin déjà désactivé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux Admins
 *       404:
 *         description: Magasin introuvable
 */
router.patch(
  "/:id/deactivate",
  controller.deactivate
);

/**
 * @swagger
 * /api/admin/stores/{id}/manager:
 *   patch:
 *     summary: Affecter un gestionnaire à un magasin
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - managerId
 *             properties:
 *               managerId:
 *                 type: string
 *                 example: 671234567890123456789012
 *     responses:
 *       200:
 *         description: Gestionnaire affecté avec succès
 *       400:
 *         description: Le compte n'est pas un Gestionnaire ou le magasin est désactivé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux Admins
 *       404:
 *         description: Magasin ou gestionnaire introuvable
 */
router.patch(
  "/:id/manager",
  controller.assignManager
);

module.exports = router;