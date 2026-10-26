jest.mock("../../src/repositories/magasin.repository", () => ({
  findById: jest.fn(),
  findActive: jest.fn(),
}));

jest.mock("../../src/repositories/materiel.repository", () => ({
  findById: jest.fn(),
  listByStore: jest.fn(),
}));

jest.mock("../../src/repositories/reservation.repository", () => ({
  findOverlapping: jest.fn(),
}));

const magasinRepository = require("../../src/repositories/magasin.repository");
const materielRepository = require("../../src/repositories/materiel.repository");
const reservationRepository = require("../../src/repositories/reservation.repository");

const storeService = require("../../src/services/store.service");
const equipmentService = require("../../src/services/equipment.service");

describe("TL-45, TL-46 & TL-47 : Tests Magasins actifs et Disponibilité sur créneau", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TL-45 / TL-133 : Magasins actifs et masquage des magasins inactifs", () => {
    test("listActiveStores masque les magasins inactifs et ne retourne que les actifs", async () => {
      magasinRepository.findActive.mockResolvedValue([
        { _id: "m1", nom: "Magasin Safi Nord", site: "Safi", adresse: "Rue 1", actif: true },
        { _id: "m2", nom: "Magasin Safi Sud", site: "Safi", adresse: "Rue 2", actif: true },
      ]);

      const stores = await storeService.listActiveStores();

      expect(stores).toHaveLength(2);
      expect(stores[0].nom).toBe("Magasin Safi Nord");
      expect(stores.every((s) => s.actif === true)).toBe(true);
    });

    test("listStoreEquipments refuse l'accès si le magasin est inactif (404)", async () => {
      magasinRepository.findById.mockResolvedValue({
        _id: "m_inactif",
        nom: "Magasin Fermé",
        actif: false,
      });

      await expect(
        storeService.listStoreEquipments("m_inactif")
      ).rejects.toThrow("Magasin introuvable ou inactif");

      expect(materielRepository.listByStore).not.toHaveBeenCalled();
    });

    test("listStoreEquipments retourne uniquement les matériels actifs du magasin", async () => {
      magasinRepository.findById.mockResolvedValue({
        _id: "m1",
        nom: "Magasin Safi",
        actif: true,
      });

      materielRepository.listByStore.mockResolvedValue([
        {
          _id: "mat1",
          nom: "Perceuse à percussion",
          reference: "PERC-001",
          etat: "bon",
          disponibilite: "Disponible",
          magasin: "m1",
          actif: true,
        },
      ]);

      const equipments = await storeService.listStoreEquipments("m1");

      expect(equipments).toHaveLength(1);
      expect(equipments[0].nom).toBe("Perceuse à percussion");
      expect(materielRepository.listByStore).toHaveBeenCalledWith("m1", { actif: true });
    });
  });

  describe("TL-46 / TL-133 : Disponibilité d'un matériel sur un créneau", () => {
    test("Retourne disponible (true) quand aucune réservation ne chevauche", async () => {
      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        nom: "Meuleuse Bosch",
        reference: "MEUL-100",
        etat: "bon",
        disponibilite: "Disponible",
        actif: true,
        magasin: "m1",
      });

      magasinRepository.findById.mockResolvedValue({
        _id: "m1",
        actif: true,
      });

      reservationRepository.findOverlapping.mockResolvedValue([]);

      const result = await equipmentService.checkEquipmentAvailability(
        "mat1",
        "2026-11-01T10:00:00.000Z",
        3
      );

      expect(result.available).toBe(true);
      expect(result.durationHours).toBe(3);
      expect(reservationRepository.findOverlapping).toHaveBeenCalled();
    });

    test("Retourne disponible (false) si une réservation active chevauche le créneau", async () => {
      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        nom: "Meuleuse Bosch",
        reference: "MEUL-100",
        etat: "bon",
        disponibilite: "Disponible",
        actif: true,
        magasin: "m1",
      });

      magasinRepository.findById.mockResolvedValue({
        _id: "m1",
        actif: true,
      });

      reservationRepository.findOverlapping.mockResolvedValue([
        {
          _id: "res1",
          status: "confirmée",
          dateDebut: new Date("2026-11-01T11:00:00.000Z"),
          dateFin: new Date("2026-11-01T14:00:00.000Z"),
        },
      ]);

      const result = await equipmentService.checkEquipmentAvailability(
        "mat1",
        "2026-11-01T10:00:00.000Z",
        4
      );

      expect(result.available).toBe(false);
      expect(result.reason).toContain("déjà réservé sur ce créneau");
    });

    test("Retourne disponible (false) si le matériel est déclaré indisponible ou endommagé", async () => {
      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        nom: "Meuleuse Bosch",
        reference: "MEUL-100",
        etat: "endommagé",
        disponibilite: "indisponible",
        actif: true,
        magasin: "m1",
      });

      const result = await equipmentService.checkEquipmentAvailability(
        "mat1",
        "2026-11-01T10:00:00.000Z",
        2
      );

      expect(result.available).toBe(false);
      expect(result.reason).toContain("indisponible ou endommagé");
    });
  });
});
