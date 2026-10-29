jest.mock("../../src/repositories/reservation.repository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOverlapping: jest.fn(),
  findByUser: jest.fn(),
  findEmpruntsByUser: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../src/repositories/materiel.repository", () => ({
  findById: jest.fn(),
}));

jest.mock("../../src/repositories/magasin.repository", () => ({
  findById: jest.fn(),
}));

const reservationRepository = require("../../src/repositories/reservation.repository");
const materielRepository = require("../../src/repositories/materiel.repository");
const magasinRepository = require("../../src/repositories/magasin.repository");
const reservationService = require("../../src/services/reservation.service");

describe("EPIC 10 - TL-54 : Tests unitaires du service de réservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TL-147 : Calcul de fin, durée (> 0) et date de début", () => {
    test("Refuse si un champ obligatoire manque", async () => {
      await expect(
        reservationService.createReservation({
          userId: "",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: "2030-01-01T10:00:00Z",
          duree: 2,
        })
      ).rejects.toThrow("Identifiants utilisateur, magasin et matériel requis");
    });

    test("Refuse si la date de début est invalide", async () => {
      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: "date-invalide",
          duree: 2,
        })
      ).rejects.toThrow("La date de début est invalide");
    });

    test("Refuse si la date de début est dans le passé", async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: pastDate,
          duree: 2,
        })
      ).rejects.toThrow("La date de début ne peut pas être dans le passé");
    });

    test("Refuse si la durée est inférieure ou égale à 0", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: futureDate,
          duree: 0,
        })
      ).rejects.toThrow("La durée doit être un nombre d'heures strictement supérieur à 0");
    });

    test("Refuse si le magasin est introuvable ou inactif", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
      magasinRepository.findById.mockResolvedValue({
        _id: "mag1",
        nom: "Magasin Test",
        isActive: false,
      });

      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: futureDate,
          duree: 2,
        })
      ).rejects.toThrow("Le magasin choisi est inactif");
    });

    test("Refuse si le matériel n'appartient pas au magasin choisi", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
      magasinRepository.findById.mockResolvedValue({
        _id: "mag1",
        nom: "Magasin Test",
        isActive: true,
      });

      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        nom: "Perceuse",
        magasin: "autre_magasin",
        actif: true,
        disponibilite: "Disponible",
        etat: "bon",
      });

      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: futureDate,
          duree: 2,
        })
      ).rejects.toThrow("Le matériel n'appartient pas au magasin choisi");
    });

    test("Refuse si le matériel est indisponible ou endommagé", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
      magasinRepository.findById.mockResolvedValue({
        _id: "mag1",
        isActive: true,
      });

      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        nom: "Scie",
        magasin: "mag1",
        actif: true,
        disponibilite: "indisponible",
        etat: "bon",
      });

      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: futureDate,
          duree: 3,
        })
      ).rejects.toThrow("Le matériel est indisponible ou endommagé");
    });

    test("Calcule correctement la date de fin et crée la réservation", async () => {
      const startDateStr = new Date(Date.now() + 100000).toISOString();
      const startDate = new Date(startDateStr);
      const duree = 3;
      const expectedEndDate = new Date(startDate.getTime() + duree * 3600 * 1000);

      magasinRepository.findById.mockResolvedValue({
        _id: "mag1",
        isActive: true,
      });

      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        magasin: "mag1",
        actif: true,
        disponibilite: "Disponible",
        etat: "bon",
      });

      reservationRepository.findOverlapping.mockResolvedValue([]);
      reservationRepository.create.mockImplementation((data) => Promise.resolve({ _id: "res1", ...data }));

      const res = await reservationService.createReservation({
        userId: "user1",
        magasinId: "mag1",
        materielId: "mat1",
        dateDebut: startDateStr,
        duree,
      });

      expect(res).toBeDefined();
      expect(res.status).toBe("confirmée");
      expect(new Date(res.dateFin).getTime()).toBe(expectedEndDate.getTime());
    });
  });

  describe("TL-148 : Chevauchements, début = fin et libération de créneau", () => {
    test("Refuse si une réservation active chevauche le créneau (409 Conflit)", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

      magasinRepository.findById.mockResolvedValue({ _id: "mag1", isActive: true });
      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        magasin: "mag1",
        actif: true,
        disponibilite: "Disponible",
        etat: "bon",
      });

      // Simulation d'une réservation active déjà existante
      reservationRepository.findOverlapping.mockResolvedValue([
        { _id: "res_existante", status: "confirmée" },
      ]);

      await expect(
        reservationService.createReservation({
          userId: "user1",
          magasinId: "mag1",
          materielId: "mat1",
          dateDebut: futureDate,
          duree: 2,
        })
      ).rejects.toThrow("Le matériel est déjà réservé sur ce créneau");
    });

    test("Autorise la réservation si aucune réservation ne chevauche (créneau libre ou début = fin)", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

      magasinRepository.findById.mockResolvedValue({ _id: "mag1", isActive: true });
      materielRepository.findById.mockResolvedValue({
        _id: "mat1",
        magasin: "mag1",
        actif: true,
        disponibilite: "Disponible",
        etat: "bon",
      });

      // findOverlapping retourne un tableau vide car début = fin est autorisé
      reservationRepository.findOverlapping.mockResolvedValue([]);
      reservationRepository.create.mockResolvedValue({
        _id: "res_ok",
        status: "confirmée",
      });

      const res = await reservationService.createReservation({
        userId: "user1",
        magasinId: "mag1",
        materielId: "mat1",
        dateDebut: futureDate,
        duree: 2,
      });

      expect(res.status).toBe("confirmée");
    });
  });

  describe("TL-149 : Annulation, vérification de propriété (403) et consultation", () => {
    test("Refuse l'annulation avec 403 si ce n'est pas le propriétaire", async () => {
      reservationRepository.findById.mockResolvedValue({
        _id: "res1",
        utilisateur: { _id: "user_autre" },
        status: "confirmée",
        dateDebut: new Date(Date.now() + 3600 * 1000),
      });

      await expect(
        reservationService.cancelReservation("res1", "user_connecte")
      ).rejects.toThrow("Vous n'êtes pas autorisé à annuler cette réservation");
    });

    test("Refuse l'annulation si la réservation n'est pas confirmée", async () => {
      reservationRepository.findById.mockResolvedValue({
        _id: "res1",
        utilisateur: { _id: "user1" },
        status: "annulée",
        dateDebut: new Date(Date.now() + 3600 * 1000),
      });

      await expect(
        reservationService.cancelReservation("res1", "user1")
      ).rejects.toThrow("Seule une réservation confirmée peut être annulée");
    });

    test("Refuse l'annulation si la date de début est déjà passée", async () => {
      reservationRepository.findById.mockResolvedValue({
        _id: "res1",
        utilisateur: { _id: "user1" },
        status: "confirmée",
        dateDebut: new Date(Date.now() - 1000),
      });

      await expect(
        reservationService.cancelReservation("res1", "user1")
      ).rejects.toThrow("Impossible d'annuler une réservation déjà commencée ou passée");
    });

    test("Annulation réussie avant le début", async () => {
      reservationRepository.findById.mockResolvedValue({
        _id: "res1",
        utilisateur: { _id: "user1" },
        status: "confirmée",
        dateDebut: new Date(Date.now() + 7200 * 1000),
      });

      reservationRepository.update.mockResolvedValue({
        _id: "res1",
        status: "annulée",
      });

      const res = await reservationService.cancelReservation("res1", "user1");
      expect(res.status).toBe("annulée");
      expect(reservationRepository.update).toHaveBeenCalledWith("res1", { status: "annulée" });
    });

    test("getMyReservations retourne la liste des réservations", async () => {
      reservationRepository.findByUser.mockResolvedValue([
        { _id: "res1", status: "confirmée" },
      ]);

      const res = await reservationService.getMyReservations("user1");
      expect(res).toHaveLength(1);
      expect(reservationRepository.findByUser).toHaveBeenCalledWith("user1");
    });

    test("getMyEmprunts retourne la liste des emprunts", async () => {
      reservationRepository.findEmpruntsByUser.mockResolvedValue([
        { _id: "emp1", status: "en cours" },
      ]);

      const res = await reservationService.getMyEmprunts("user1");
      expect(res).toHaveLength(1);
      expect(reservationRepository.findEmpruntsByUser).toHaveBeenCalledWith("user1");
    });
  });
});
