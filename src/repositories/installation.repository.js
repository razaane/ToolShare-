const Installation = require("../models/installation.model");

async function find() {
  return Installation.findOne();
}

async function create(data){
    return Installation.create(data);
}

module.exports = { find ,create};