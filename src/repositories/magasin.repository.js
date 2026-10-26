const Magasin = require("../models/magasin.model");

async function create(data) {
  return await Magasin.create(data);
}

async function findById(id) {
  return await Magasin.findById(id);
}

async function findActive() {
  return await Magasin.find({ isActive: true }).sort({ nom: 1 });
}

async function findAll() {
  return await Magasin.find().sort({ createdAt: -1 });
}

async function update(id, data) {
  return await Magasin.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

async function remove(id) {
  return await Magasin.findByIdAndDelete(id);
}

module.exports = {
  create,
  findById,
  findActive,
  findAll,
  update,
  remove,
};
