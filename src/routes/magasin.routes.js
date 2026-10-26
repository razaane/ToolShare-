const express = require("express");

const router = express.Router();

const controller = require("../controllers/magasin.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const checkManagerStore = require("../middlewares/checkManagerStore");

router.use(authenticate);
router.use(authorize("Gestionnaire"));

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Consulter son magasin
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
 *         description: Accès refusé au magasin
 *       404:
 *         description: Magasin introuvable
 */
router.get(
  "/:id",
  checkManagerStore,
  controller.getById
);

module.exports = router;