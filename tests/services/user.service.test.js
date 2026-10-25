jest.mock("../../src/repositories/user.repository", () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue("nouveau_mot_de_passe_hache"),
}));

const userRepository = require("../../src/repositories/user.repository");
const bcrypt = require("bcryptjs");
const userService = require("../../src/services/user.service");

describe("TL-44 & TL-47 : Tests Profil Utilisateur et Changement de Mot de Passe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    test("Consulte son profil avec succès sans exposer le mot de passe", async () => {
      userRepository.findById.mockResolvedValue({
        _id: "user123",
        name: "Adnane",
        email: "adnane@test.com",
        role: "Utilisateur",
        password: "secret_haché_ne_pas_exposer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const profile = await userService.getProfile("user123");

      expect(profile).toBeDefined();
      expect(profile.name).toBe("Adnane");
      expect(profile.email).toBe("adnane@test.com");
      expect(profile.role).toBe("Utilisateur");
      expect(profile.password).toBeUndefined();
    });

    test("Lève une 404 si l'utilisateur est introuvable", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getProfile("unknown")).rejects.toThrow(
        "Utilisateur non trouvé"
      );
    });
  });

  describe("updateProfile - Règle du rôle non modifiable", () => {
    test("Refuse formellement la tentative de modifier le rôle (TL-129)", async () => {
      userRepository.findById.mockResolvedValue({
        _id: "user123",
        name: "Adnane",
        email: "adnane@test.com",
        role: "Utilisateur",
      });

      await expect(
        userService.updateProfile("user123", { role: "Admin" })
      ).rejects.toThrow("La modification du rôle ou du mot de passe n'est pas autorisée");

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    test("Refuse la modification du mot de passe via updateProfile", async () => {
      userRepository.findById.mockResolvedValue({
        _id: "user123",
        name: "Adnane",
        email: "adnane@test.com",
        role: "Utilisateur",
      });

      await expect(
        userService.updateProfile("user123", { password: "HackPassword123" })
      ).rejects.toThrow("La modification du rôle ou du mot de passe n'est pas autorisée");
    });

    test("Met à jour le nom et l'email avec succès sans modifier le rôle", async () => {
      userRepository.findById.mockResolvedValue({
        _id: "user123",
        name: "Adnane",
        email: "ancien@test.com",
        role: "Utilisateur",
      });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.update.mockResolvedValue({
        _id: "user123",
        name: "Adnane Modifié",
        email: "nouveau@test.com",
        role: "Utilisateur",
      });

      const result = await userService.updateProfile("user123", {
        name: "Adnane Modifié",
        email: "nouveau@test.com",
      });

      expect(userRepository.update).toHaveBeenCalledWith("user123", {
        name: "Adnane Modifié",
        email: "nouveau@test.com",
      });
      expect(result.name).toBe("Adnane Modifié");
      expect(result.email).toBe("nouveau@test.com");
      expect(result.role).toBe("Utilisateur");
      expect(result.password).toBeUndefined();
    });
  });

  describe("changePassword (TL-130)", () => {
    test("Refuse si le mot de passe actuel est incorrect", async () => {
      userRepository.findById.mockResolvedValue({
        _id: "user123",
        password: "vrai_mot_de_passe_hache",
      });

      bcrypt.compare.mockResolvedValue(false);

      await expect(
        userService.changePassword("user123", "mauvais_pass", "NouveauPass123")
      ).rejects.toThrow("Mot de passe actuel incorrect");

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    test("Modifie le mot de passe avec succès après vérification", async () => {
      userRepository.findById.mockResolvedValue({
        _id: "user123",
        password: "ancien_mot_de_passe_hache",
      });

      bcrypt.compare.mockResolvedValue(true);
      userRepository.update.mockResolvedValue(true);

      const res = await userService.changePassword(
        "user123",
        "AncienPass123",
        "NouveauPass123"
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "AncienPass123",
        "ancien_mot_de_passe_hache"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("NouveauPass123", 10);
      expect(userRepository.update).toHaveBeenCalledWith("user123", {
        password: "nouveau_mot_de_passe_hache",
      });
      expect(res.message).toBe("Mot de passe modifié avec succès");
    });
  });
});
