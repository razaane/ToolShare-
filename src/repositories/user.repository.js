const User = require("../models/user.model");

async function create(data) {
  return await User.create(data);
}

async function findById(id) {
  return await User.findById(id);
}

async function findByEmail(email) {
  return await User.findOne({ email: email.toLowerCase() });
}

async function update(id, data) {
  return await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
}

async function list() {
  return await User.find().sort({ name: 1 });
}

module.exports = {
  create,
  findById,
  findByEmail,
  update,
  list
};