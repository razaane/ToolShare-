const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un utilisateur
 *     tags: [Users]
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
 *                 example: Mohamed
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mohamed@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               role:
 *                 type: string
 *                 enum:
 *                   - Admin
 *                   - Gestionnaire
 *                   - Utilisateur
 *                 example: Utilisateur
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/", userController.create);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister les utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/", userController.list);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 671234567890abcdef123456
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */
router.get("/:id", userController.getById);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Récupérer un utilisateur par email
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
 *         example: mohamed@test.com
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */
router.get("/by-email", userController.getByEmail);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Modifier un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 671234567890abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mohamed
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mohamed2@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *               role:
 *                 type: string
 *                 enum:
 *                   - Admin
 *                   - Gestionnaire
 *                   - Utilisateur
 *                 example: Gestionnaire
 *     responses:
 *       200:
 *         description: Utilisateur modifié avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 *       409:
 *         description: Email déjà utilisé
 */
router.put("/:id", userController.update);

router.use(authenticate);
router.use(authorize("Admin"));

module.exports = router;
