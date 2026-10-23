
const bcrypt = require("bcryptjs");

const userRepository = require("../../src/repositories/user.repository");
const userService = require("../../src/services/user.service");

jest.mock("../../src/repositories/user.repository");

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Création valide : password hashé et compte créé", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    userRepository.create.mockImplementation(async (data) => ({
      _id: "123",
      ...data,
    }));

    const result = await userService.createUser(
      {
        name: "Test User",
        email: "test@test.com",
        password: "Password123!",
        role: "Utilisateur",
      },
      "Admin"
    );

    expect(result.id).toBe("123");
    expect(result.role).toBe("Utilisateur");
    expect(result.email).toBe("test@test.com");

    const savedUser = userRepository.create.mock.calls[0][0];

    expect(savedUser.password).not.toBe("Password123!");
    expect(
      await bcrypt.compare("Password123!", savedUser.password)
    ).toBe(true);
  });

  test("Email déjà utilisé : erreur 409", async () => {
    userRepository.findByEmail.mockResolvedValue({
      email: "test@test.com",
    });

    await expect(
      userService.createUser(
        {
          name: "Test User",
          email: "test@test.com",
          password: "Password123!",
          role: "Utilisateur",
        },
        "Admin"
      )
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("Rôle invalide : erreur 400", async () => {
    await expect(
      userService.createUser(
        {
          name: "Test User",
          email: "test@test.com",
          password: "Password123!",
          role: "Invalide",
        },
        "Admin"
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("Désactivation valide : isActive devient false", async () => {
    userRepository.findById.mockResolvedValue({
      _id: "123",
      name: "Test User",
      email: "test@test.com",
      role: "Utilisateur",
      isActive: true,
    });

    userRepository.update.mockResolvedValue({
      _id: "123",
      name: "Test User",
      email: "test@test.com",
      role: "Utilisateur",
      isActive: false,
    });

    const result = await userService.deactivateUser("123");

    expect(userRepository.update).toHaveBeenCalledWith("123", {
      isActive: false,
    });
    expect(result.isActive).toBe(false);
  });

  test("Compte inexistant : erreur 404", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      userService.deactivateUser("999")
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("Compte déjà désactivé : erreur 400", async () => {
    userRepository.findById.mockResolvedValue({
      _id: "123",
      isActive: false,
    });

    await expect(
      userService.deactivateUser("123")
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
