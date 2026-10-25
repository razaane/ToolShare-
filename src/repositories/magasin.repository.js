const Magasin = require("../models/magasin.model");

async function create(data) {
  return await Magasin.create(data);
}

async function findById(id) {
  return await Magasin.findById(id);
}

async function findActive() {
  return await Magasin.find({ actif: true }).sort({ nom: 1 });
}

async function list() {
  return await Magasin.find().sort({ nom: 1 });
}

async function update(id, data) {
  return await Magasin.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

module.exports = {
  create,
  findById,
  findActive,
  list,
  update,
};
