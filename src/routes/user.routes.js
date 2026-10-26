const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Utilisateurs
 *     description: Gestion du profil (EPIC 9 - Adnane)
 *   - name: Users
 *     description: Gestion des comptes (EPIC 7 - Razane)
 */

// ============================================================
// EPIC 9 (Adnane) : Routes profil et mot de passe
// ============================================================

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Consulter son profil utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur introuvable
 */
router.get("/me", authenticate, userController.getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Modifier son profil (rôle et mot de passe non modifiables)
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Adnane
 *               email:
 *                 type: string
 *                 format: email
 *                 example: adnane@test.com
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Modification non autorisée ou email déjà utilisé
 *       401:
 *         description: Non authentifié
 */
router.put("/me", authenticate, userController.updateMe);

/**
 * @swagger
 * /api/users/me/password:
 *   patch:
 *     summary: Changer son mot de passe
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Mot de passe actuel incorrect ou format invalide
 *       401:
 *         description: Non authentifié
 */
router.patch("/me/password", authenticate, userController.changePassword);

// ============================================================
// EPIC 7 (Razane) : Routes admin gestion des comptes
// ============================================================

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un compte (Admin ou Gestionnaire)
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
 *               role:
 *                 type: string
 *                 enum: [Admin, Gestionnaire, Utilisateur]
 *     responses:
 *       201:
 *         description: Compte créé
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/", authenticate, authorize("Admin", "Gestionnaire"), userController.create);

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
router.get("/", authenticate, authorize("Admin"), userController.list);

/**
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
router.get("/by-email", authenticate, authorize("Admin"), userController.getByEmail);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un compte par ID (Admin)
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
 *         description: Introuvable
 */
router.get("/:id", authenticate, authorize("Admin"), userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Modifier un compte (Admin)
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
 *         description: Compte modifié
 *       404:
 *         description: Introuvable
 */
router.put("/:id", authenticate, authorize("Admin"), userController.update);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Désactiver un compte (Admin)
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
 *         description: Compte désactivé
 *       400:
 *         description: Déjà désactivé
 *       404:
 *         description: Introuvable
 */
router.patch("/:id/deactivate", authenticate, authorize("Admin"), userController.deactivate);

module.exports = router;
