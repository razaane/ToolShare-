
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
 *     responses:
 *       200:
 *         description: Installation effectuée ou statut retourné
 *       400:
 *         description: Requête invalide ou installation impossible
 *       500:
 *         description: Erreur serveur
 */
router.post("/", installationController.install);

module.exports = router;
