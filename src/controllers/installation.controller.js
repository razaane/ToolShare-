const installationService = require("../services/installation.service");

async function getStatus(req,res,next) {
    try{
        const status = await installationService.getStatus();
        return res.json(status);
    }catch(err){
        next(err)
    }
}

async function install(req, res, next) {
  try {
    const admin = await installationService.install(req.body);

    res.status(201).json({
      success: true,
      message: "Installation réussie",
      data: admin,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {getStatus , install }