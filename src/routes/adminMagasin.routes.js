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

router.post(
  "/",
  validateCreateMagasin,
  controller.create
);

router.get(
  "/",
  controller.list
);

router.get(
  "/:id",
  controller.getById
);

router.put(
  "/:id",
  validateUpdateMagasin,
  controller.update
);

router.patch(
  "/:id/deactivate",
  controller.deactivate
);

router.patch(
  "/:id/manager",
  controller.assignManager
);

module.exports = router;