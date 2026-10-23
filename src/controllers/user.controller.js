const userService = require("../services/user.service");


async function create(req, res, next) {
  try {
    const user = await userService.createUser(
      req.body,
      req.user.role
    );
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}


async function getById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function getByEmail(req, res, next) {
  try {
    const user = await userService.getUserByEmail(req.query.email);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body
    );

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const users = await userService.listUsers();

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getById,
  getByEmail,
  update,
  list,
};