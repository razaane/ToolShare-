const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion du profil et des utilisateurs
 */

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

module.exports = router;
