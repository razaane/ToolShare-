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

async function install(body){
    const status = await getStatus();
     
    if(status.installed === true){
        throw new AppError("L'application est déjà installée" , 400);
    }

    validateInstall(body);
    const HashedPasswored = await bcrypt.hash(body.password ,10);

    const user = await userRepository.create({
        name : body.name,
        email : body.email,
        password: HashedPasswored,
        role : "Admin",
    });

    await installationRepository.create({
        installed : true,
        installedAt : new Date(),
    });

    return {
        id : user.id,
        name : user.name,
        email : user.email,
        role:user.role,
    }

}

module.exports = { getStatus , install };