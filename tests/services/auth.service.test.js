const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user.model");
const authService = require("../../src/services/auth.service");

jest.mock("../../src/models/user.model");

describe("Auth Service - login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Login valide : retourne un token", async () => {
    User.findOne.mockResolvedValue({
      _id: "123",
      name: "Admin",
      email: "admin@test.com",
      password: await bcrypt.hash("Password123!", 10),
      role: "Admin",
    });

    const result = await authService.login(
      "admin@test.com",
      "Password123!"
    );

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe("Admin");
    expect(jwt.verify(result.token, process.env.JWT_SECRET ||
      require("../src/config/env").jwtSecret).id).toBe("123");
  });

  test("Email inexistant : retourne une erreur 401", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.login("wrong@test.com", "Password123!")
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test("Mot de passe incorrect : retourne une erreur 401", async () => {
    User.findOne.mockResolvedValue({
      _id: "123",
      email: "admin@test.com",
      password: await bcrypt.hash("Correct123!", 10),
      role: "Admin",
    });

    await expect(
      authService.login("admin@test.com", "Wrong123!")
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test("Email et mot de passe manquants : retourne une erreur 400", async () => {
    await expect(
      authService.login("", "")
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});