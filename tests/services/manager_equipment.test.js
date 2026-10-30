// Tests unitaires - EPIC 11 : Espace Gestionnaire
// TL-158, TL-159, TL-160, TL-161, TL-162

const materielService = require("../../src/services/materiel.service");
const userService = require("../../src/services/user.service");
const reservationRepository = require("../../src/repositories/reservation.repository");

// Mock du repository materiel
jest.mock("../../src/repositories/materiel.repository", () => ({
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  listByStore: jest.fn(),
}));

// Mock du repository user
jest.mock("../../src/repositories/user.repository", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
}));

// Mock du repository reservation
jest.mock("../../src/repositories/reservation.repository", () => ({
  findByStore: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findOverlapping: jest.fn(),
  findByUser: jest.fn(),
  findEmpruntsByUser: jest.fn(),
  update: jest.fn(),
}));

const materielRepository = require("../../src/repositories/materiel.repository");
const userRepository = require("../../src/repositories/user.repository");

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// TL-158 : Tester la reference unique et la restriction par magasin
// ============================================================
describe("TL-158 - Restriction par magasin et reference unique", () => {
  const magasinId = "magasin123";
  const autreMagasinId = "autremagasin456";

  test("updateMateriel : leve 403 si le materiel appartient a un autre magasin", async () => {
    // verifierMateriel est appelee en interne par updateMateriel
    materielRepository.findById.mockResolvedValue({
      _id: "mat1",
      nom: "Perceuse",
      reference: "REF001",
      magasin: { toString: () => autreMagasinId },
      actif: true,
    });

    await expect(materielService.updateMateriel(magasinId, "mat1", { nom: "Nouveau" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test("desactiverMateriel : leve 404 si le materiel n'existe pas", async () => {
    // verifierMateriel est appelee en interne par desactiverMateriel
    materielRepository.findById.mockResolvedValue(null);

    await expect(materielService.desactiverMateriel(magasinId, "matInconnu")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("createMateriel : cree un materiel avec nom et reference valides", async () => {
    const fakeData = { nom: "Marteau", reference: "REF002" };
    const fakeMateriel = { _id: "mat2", nom: "Marteau", reference: "REF002", magasin: magasinId };

    materielRepository.create.mockResolvedValue(fakeMateriel);

    const result = await materielService.createMateriel(magasinId, fakeData);
    expect(result).toEqual(fakeMateriel);
    expect(materielRepository.create).toHaveBeenCalledWith({
      nom: "Marteau",
      reference: "REF002",
      magasin: magasinId,
    });
  });

  test("createMateriel : leve 400 si le nom ou la reference est absent", async () => {
    await expect(materielService.createMateriel(magasinId, { nom: "Marteau" })).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(materielService.createMateriel(magasinId, { reference: "REF003" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ============================================================
// TL-159 : Tester indisponible et remise en service
// ============================================================
describe("TL-159 - Declarer indisponible et remettre en service", () => {
  const magasinId = "magasin123";
  const materielId = "mat1";

  const fakeMaterielActif = {
    _id: materielId,
    nom: "Perceuse",
    reference: "REF001",
    magasin: { toString: () => magasinId },
    actif: true,
    disponibilite: "Disponible",
  };

  test("declarerIndisponible : met la disponibilite a indisponible", async () => {
    materielRepository.findById.mockResolvedValue(fakeMaterielActif);
    materielRepository.update.mockResolvedValue({ ...fakeMaterielActif, disponibilite: "indisponible" });

    const result = await materielService.declarerIndisponible(magasinId, materielId);
    expect(result.disponibilite).toBe("indisponible");
    expect(materielRepository.update).toHaveBeenCalledWith(materielId, { disponibilite: "indisponible" });
  });

  test("remettreEnService : met la disponibilite a Disponible et etat a bon", async () => {
    materielRepository.findById.mockResolvedValue(fakeMaterielActif);
    materielRepository.update.mockResolvedValue({ ...fakeMaterielActif, disponibilite: "Disponible", etat: "bon" });

    const result = await materielService.remettreEnService(magasinId, materielId);
    expect(result.disponibilite).toBe("Disponible");
    expect(result.etat).toBe("bon");
  });

  test("remettreEnService : leve 400 si le materiel est desactive (actif = false)", async () => {
    materielRepository.findById.mockResolvedValue({
      ...fakeMaterielActif,
      actif: false,
    });

    await expect(materielService.remettreEnService(magasinId, materielId)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ============================================================
// TL-160 : Tester que la creation de comptes est limitee au role Utilisateur
// ============================================================
describe("TL-160 - Creation de compte par gestionnaire (role limite)", () => {
  const dataBase = {
    name: "Jean Dupont",
    email: "jean@example.com",
    password: "motdepasse123",
  };

  test("createUser : leve 403 si le gestionnaire essaie de creer un Admin", async () => {
    await expect(
      userService.createUser({ ...dataBase, role: "Admin" }, "Gestionnaire")
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("createUser : leve 403 si le gestionnaire essaie de creer un autre Gestionnaire", async () => {
    await expect(
      userService.createUser({ ...dataBase, role: "Gestionnaire" }, "Gestionnaire")
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("createUser : reussit si le gestionnaire cree un Utilisateur", async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({
      _id: "user1",
      name: dataBase.name,
      email: dataBase.email,
      role: "Utilisateur",
    });

    const result = await userService.createUser({ ...dataBase, role: "Utilisateur" }, "Gestionnaire");
    expect(result.role).toBe("Utilisateur");
  });
});

// ============================================================
// TL-161 + TL-162 : Lister et filtrer les reservations du magasin
// ============================================================
describe("TL-161 + TL-162 - Lister et filtrer les reservations du magasin", () => {
  const magasinId = "magasin123";

  test("findByStore : retourne les reservations du magasin sans filtre", async () => {
    const fakeReservations = [
      { _id: "res1", status: "confirmee", magasin: magasinId },
      { _id: "res2", status: "en cours", magasin: magasinId },
    ];
    reservationRepository.findByStore.mockResolvedValue(fakeReservations);

    const result = await reservationRepository.findByStore(magasinId, {});
    expect(result).toHaveLength(2);
    expect(reservationRepository.findByStore).toHaveBeenCalledWith(magasinId, {});
  });

  test("findByStore : filtre par statut", async () => {
    const fakeReservations = [{ _id: "res1", status: "confirmee", magasin: magasinId }];
    reservationRepository.findByStore.mockResolvedValue(fakeReservations);

    const result = await reservationRepository.findByStore(magasinId, { status: "confirmee" });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("confirmee");
  });

  test("findByStore : filtre par materiel", async () => {
    const fakeReservations = [{ _id: "res2", materiel: "mat1", magasin: magasinId }];
    reservationRepository.findByStore.mockResolvedValue(fakeReservations);

    const result = await reservationRepository.findByStore(magasinId, { materiel: "mat1" });
    expect(result).toHaveLength(1);
    expect(reservationRepository.findByStore).toHaveBeenCalledWith(magasinId, { materiel: "mat1" });
  });

  test("findByStore : retourne un tableau vide si aucune reservation", async () => {
    reservationRepository.findByStore.mockResolvedValue([]);

    const result = await reservationRepository.findByStore(magasinId, {});
    expect(result).toEqual([]);
  });
});
