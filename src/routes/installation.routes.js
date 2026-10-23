
const express = require("express");
const installationController = require("../controllers/installation.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Installation
 *   description: Vérification et initialisation de ToolShare
 */

/**
 * @swagger
 * /api/installation/status:
 *   get:
 *     summary: Vérifier le statut de l'installation
 *     tags: [Installation]
 *     responses:
 *       200:
 *         description: Statut de l'installation récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 installed:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Erreur serveur
 */
router.get("/status", installationController.getStatus);

/**
 * @swagger
 * /api/installation:
 *   post:
 *     summary: Initialiser ToolShare
 *     tags: [Installation]
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
 *                 example: Admin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Installation effectuée avec succès
 *       400:
 *         description: Installation déjà effectuée ou données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post("/", installationController.install);

module.exports = router;
