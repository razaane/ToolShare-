const installationRepository = require("../repositories/installation.repository");
const userRepository = require("../repositories/user.repository");

const { validateInstall } = require("../validators/installation.validator");
const AppError = require("../utils/AppError");

const bcrypt = require("bcryptjs");

async function getStatus() {
  const installation = await installationRepository.find();

  return {
    installed: Boolean(installation && installation.installed)
  };
}



module.exports = { getStatus };