const magasinRepository = require("../../src/repositories/magasin.repository");
const userRepository = require("../../src/repositories/user.repository");
const magasinService = require("../../src/services/magasin.service");

jest.mock("../../src/repositories/magasin.repository");
jest.mock("../../src/repositories/user.repository");

describe("Magasin Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Création d'un magasin", async () => {
    magasinRepository.create.mockResolvedValue({
      _id: "magasin123",
      nom: "Magasin Safi",
      site: "Safi",
      adresse: "Zone industrielle",
      isActive: true,
    });

    const result = await magasinService.createMagasin({
      nom: "Magasin Safi",
      site: "Safi",
      adresse: "Zone industrielle",
    });

    expect(result._id).toBe("magasin123");
    expect(result.isActive).toBe(true);

    expect(magasinRepository.create).toHaveBeenCalledWith({
      nom: "Magasin Safi",
      site: "Safi",
      adresse: "Zone industrielle",
    });
  });

  test("Création sans nom : erreur 400", async () => {
    await expect(
      magasinService.createMagasin({
        site: "Safi",
        adresse: "Zone industrielle",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test("Consultation d'un magasin", async () => {
    magasinRepository.findById.mockResolvedValue({
      _id: "magasin123",
      nom: "Magasin Safi",
      isActive: true,
    });

    const result = await magasinService.getMagasinById("magasin123");

    expect(result._id).toBe("magasin123");
    expect(magasinRepository.findById).toHaveBeenCalledWith(
      "magasin123"
    );
  });

  test("Magasin inexistant : erreur 404", async () => {
    magasinRepository.findById.mockResolvedValue(null);

    await expect(
      magasinService.getMagasinById("unknown")
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("Modification d'un magasin", async () => {
    magasinRepository.findById.mockResolvedValue({
      _id: "magasin123",
      nom: "Ancien nom",
    });

    magasinRepository.update.mockResolvedValue({
      _id: "magasin123",
      nom: "Nouveau nom",
    });

    const result = await magasinService.updateMagasin(
      "magasin123",
      {
        nom: "Nouveau nom",
      }
    );

    expect(result.nom).toBe("Nouveau nom");

    expect(magasinRepository.update).toHaveBeenCalledWith(
      "magasin123",
      {
        nom: "Nouveau nom",
      }
    );
  });

  test("Désactivation d'un magasin", async () => {
    magasinRepository.findById.mockResolvedValue({
      _id: "magasin123",
      isActive: true,
    });

    magasinRepository.update.mockResolvedValue({
      _id: "magasin123",
      isActive: false,
    });

    const result = await magasinService.deactivateMagasin(
      "magasin123"
    );

    expect(result.isActive).toBe(false);

    expect(magasinRepository.update).toHaveBeenCalledWith(
      "magasin123",
      {
        isActive: false,
      }
    );
  });

  test("Impossible de désactiver un magasin déjà désactivé", async () => {
    magasinRepository.findById.mockResolvedValue({
      _id: "magasin123",
      isActive: false,
    });

    await expect(
      magasinService.deactivateMagasin("magasin123")
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test("Affecter un Gestionnaire à un magasin", async () => {
    magasinRepository.findById.mockResolvedValue({
      _id: "magasin123",
      isActive: true,
    });

    userRepository.findById.mockResolvedValue({
      _id: "manager123",
      name: "Manager",
      role: "Gestionnaire",
      isActive: true,
    });

    userRepository.update.mockResolvedValue({
      _id: "manager123",
      name: "Manager",
      role: "Gestionnaire",
      magasin: "magasin123",
    });

    const result = await magasinService.assignManager(
      "magasin123",
      "manager123"
    );

    expect(result.magasin).toBe("magasin123");

    expect(userRepository.update).toHaveBeenCalledWith(
      "manager123",
      {
        magasin: "magasin123",
      }
    );
  });

  test("Impossible d'affecter un utilisateur qui n'est pas Gestionnaire", async () => {
    magasinRepository.findById.mockResolvedValue({
      _id: "magasin123",
      isActive: true,
    });

    userRepository.findById.mockResolvedValue({
      _id: "user123",
      role: "Utilisateur",
      isActive: true,
    });

    await expect(
      magasinService.assignManager(
        "magasin123",
        "user123"
      )
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});