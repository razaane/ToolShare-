const jwt = require("jsonwebtoken");
const authenticate = require("../../src/middlewares/authenticate");
const authorize = require("../../src/middlewares/authorize");
const User = require("../../src/models/user.model");
const config = require("../../src/config/env");

jest.mock("../../src/models/user.model");

describe("Auth Middlewares", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });

  test("Token valide", async () => {
    const token = jwt.sign(
      { id: "123" },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    req.headers.authorization = `Bearer ${token}`;

    User.findById.mockResolvedValue({
      _id: "123",
      name: "Admin",
      role: "Admin",
    });

    await authenticate(req, res, next);

    expect(req.user.role).toBe("Admin");
    expect(next).toHaveBeenCalledWith();
  });

  test("Token expiré", async () => {
    const token = jwt.sign(
      { id: "123" },
      config.jwtSecret,
      { expiresIn: "-1s" }
    );

    req.headers.authorization = `Bearer ${token}`;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  test("Token manquant", async () => {
    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  test("Rôle non autorisé", () => {
    req.user = { role: "Utilisateur" };

    authorize("Admin")(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  test("Rôle autorisé", () => {
    req.user = { role: "Admin" };

    authorize("Admin")(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});