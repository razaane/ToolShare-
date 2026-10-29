const authService = require("../../src/services/auth.service");
const User = require("../../src/models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../src/models/user.model");
jest.mock("bcryptjs");

describe("Auth Service - login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Login valide : retourne un token", async () => {
    User.findOne.mockResolvedValue({
      _id: "123",
      email: "admin@test.com",
      password: "hashed_password",
      role: "Admin",
      isActive: true,
    });

    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.login(
      "admin@test.com",
      "Password123!"
    );

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe("Admin");
    expect(jwt.verify(result.token, process.env.JWT_SECRET ||
      require("../../src/config/env").jwtSecret).id).toBe("123");
  });

  test("Email inexistant : retourne une erreur 401", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.login("inconnu@test.com", "Password123!")
    ).rejects.toThrow("Email ou mot de passe incorrect");
  });

  test("Mot de passe incorrect : retourne une erreur 401", async () => {
    User.findOne.mockResolvedValue({
      _id: "123",
      email: "admin@test.com",
      password: "hashed_password",
      role: "Admin",
      isActive: true,
    });

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login("admin@test.com", "FauxPassword!")
    ).rejects.toThrow("Email ou mot de passe incorrect");
  });
});
