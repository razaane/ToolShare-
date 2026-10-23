
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des comptes utilisateurs
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un compte
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [Admin, Gestionnaire, Utilisateur]
 *               magasin:
 *                 type: string
 *                 description: ID du magasin, pour un Gestionnaire créé par l'Admin
 *     responses:
 *       201:
 *         description: Compte créé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Rôle non autorisé
 *       409:
 *         description: Email déjà utilisé
 */
router.post(
  "/",
  authorize("Admin", "Gestionnaire"),
  userController.create
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister les comptes (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des comptes
 */
router.get("/", authorize("Admin"), userController.list);

/**
 * IMPORTANT : cette route doit précéder /:id.
 *
 * @swagger
 * /api/users/by-email:
 *   get:
 *     summary: Rechercher un compte par email (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Compte trouvé
 *       404:
 *         description: Compte introuvable
 */
router.get("/by-email", authorize("Admin"), userController.getByEmail);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un compte par ID (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compte trouvé
 *       404:
 *         description: Compte introuvable
 */
router.get("/:id", authorize("Admin"), userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Modifier un compte (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin, Gestionnaire, Utilisateur]
 *     responses:
 *       200:
 *         description: Compte modifié
 *       404:
 *         description: Compte introuvable
 */
router.put("/:id", authorize("Admin"), userController.update);

module.exports = router;
