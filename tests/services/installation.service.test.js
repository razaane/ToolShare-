jest.mock("../../src/repositories/installation.repository", () => ({
  find: jest.fn(),
  create: jest.fn()
}));

jest.mock("../../src/repositories/user.repository", () => ({
  create: jest.fn()
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("motdepasse_crypte")
}));

const installationRepository = require("../../src/repositories/installation.repository");
const userRepository = require("../../src/repositories/user.repository");
const bcrypt = require("bcryptjs");

const installationService = require("../../src/services/installation.service");

describe("Installation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getStatus retourne installed false si l'application n'est pas installée", async () => {
    installationRepository.find.mockResolvedValue(null);

    const result = await installationService.getStatus();

    expect(result).toEqual({ installed: false });
  });

  test("install crée un administrateur lors de la première installation", async () => {
    installationRepository.find.mockResolvedValue(null);

    userRepository.create.mockResolvedValue({
      id: "123",
      name: "Admin",
      email: "admin@test.com",
      role: "Admin"
    });

    const body = {
      name: "Admin",
      email: "admin@test.com",
      password: "Password123!"
    };

    const result = await installationService.install(body);

    expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      name: "Admin",
      email: "admin@test.com",
      password: "motdepasse_crypte",
      role: "Admin"
    });
    expect(installationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ installed: true })
    );
    expect(result.email).toBe("admin@test.com");
  });

  test("install refuse une deuxième installation", async () => {
    installationRepository.find.mockResolvedValue({
      installed: true
    });

    await expect(
      installationService.install({
        name: "Admin",
        email: "admin@test.com",
        password: "Password123!"
      })
    ).rejects.toThrow("L'application est déjà installée");

    expect(userRepository.create).not.toHaveBeenCalled();
  });
});