
jest.mock("../../src/repositories/reservation.repository", () => ({
  findById: jest.fn(),
  findByStore: jest.fn(),
  findInProgressByMateriel: jest.fn(),
  findOverdueByStore: jest.fn(),
  findHistoryByStore: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  findOverlapping: jest.fn(),
  findByUser: jest.fn(),
  findEmpruntsByUser: jest.fn(),
}));

jest.mock("../../src/repositories/materiel.repository", () => ({
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  listByStore: jest.fn(),
}));

jest.mock("../../src/repositories/magasin.repository", () => ({
  findById: jest.fn(),
}));

const reservationRepository = require("../../src/repositories/reservation.repository");
const materielRepository = require("../../src/repositories/materiel.repository");
const reservationService = require("../../src/services/reservation.service");
const materielService = require("../../src/services/materiel.service");

// Identifiants Mongo valides (24 caractères hexadécimaux)
const MAGASIN = "507f1f77bcf86cd799439011";
const AUTRE_MAGASIN = "507f1f77bcf86cd799439022";
const RESERVATION = "507f1f77bcf86cd799439033";
const MATERIEL = "507f1f77bcf86cd799439044";

// Réservation telle que renvoyée par findById (champs peuplés)
const fakeReservation = (overrides = {}) => ({
  _id: RESERVATION,
  status: "confirmée",
  magasin: { _id: MAGASIN, nom: "Magasin Safi" },
  materiel: { _id: MATERIEL, nom: "Perceuse", disponibilite: "Disponible", etat: "bon" },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// EPIC 11 : référence unique -> 409
// ============================================================
describe("Matériel : référence déjà utilisée", () => {
  test("createMateriel : renvoie 409 si la référence existe déjà (E11000)", async () => {
    materielRepository.create.mockRejectedValue({ code: 11000 });

    await expect(
      materielService.createMateriel(MAGASIN, { nom: "Perceuse", reference: "REF001" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("updateMateriel : renvoie 409 si la nouvelle référence existe déjà", async () => {
    materielRepository.findById.mockResolvedValue({
      _id: MATERIEL,
      magasin: { toString: () => MAGASIN },
    });
    materielRepository.update.mockRejectedValue({ code: 11000 });

    await expect(
      materielService.updateMateriel(MAGASIN, MATERIEL, { reference: "REF001" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("updateMateriel : n'envoie que les champs fournis", async () => {
    materielRepository.findById.mockResolvedValue({
      _id: MATERIEL,
      magasin: { toString: () => MAGASIN },
    });
    materielRepository.update.mockResolvedValue({ _id: MATERIEL, nom: "Nouveau" });

    await materielService.updateMateriel(MAGASIN, MATERIEL, { nom: "Nouveau" });

    expect(materielRepository.update).toHaveBeenCalledWith(MATERIEL, { nom: "Nouveau" });
  });
});

// ============================================================
// EPIC 11 : filtres des réservations du magasin (statut, matériel, période)
// ============================================================
describe("listStoreReservations : filtres", () => {
  test("transmet les filtres statut, matériel et période au repository", async () => {
    reservationRepository.findByStore.mockResolvedValue([]);

    await reservationService.listStoreReservations(MAGASIN, {
      status: "en cours",
      materiel: MATERIEL,
      from: "2026-11-01",
      to: "2026-11-30",
    });

    const filters = reservationRepository.findByStore.mock.calls[0][1];
    expect(filters.status).toBe("en cours");
    expect(filters.materiel).toBe(MATERIEL);
    expect(filters.from).toEqual(new Date("2026-11-01"));
    // "to" donné comme date seule : inclut toute la journée
    expect(filters.to).toEqual(new Date("2026-11-30T23:59:59.999Z"));
  });

  test("sans filtre : appelle le repository avec un objet vide", async () => {
    reservationRepository.findByStore.mockResolvedValue([{ _id: "r1" }]);

    const result = await reservationService.listStoreReservations(MAGASIN, {});

    expect(result).toHaveLength(1);
    expect(reservationRepository.findByStore).toHaveBeenCalledWith(MAGASIN, {});
  });

  test("renvoie 400 si le statut est inconnu", async () => {
    await expect(
      reservationService.listStoreReservations(MAGASIN, { status: "nimporte" })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(reservationRepository.findByStore).not.toHaveBeenCalled();
  });

  test("renvoie 400 si la date ou la période est invalide", async () => {
    await expect(
      reservationService.listStoreReservations(MAGASIN, { from: "pas-une-date" })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      reservationService.listStoreReservations(MAGASIN, { from: "2026-12-01", to: "2026-11-01" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("renvoie 400 si l'identifiant du matériel est invalide", async () => {
    await expect(
      reservationService.listStoreReservations(MAGASIN, { materiel: "abc" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ============================================================
// EPIC 12 : remise du matériel (confirmée -> en cours)
// ============================================================
describe("handOverReservation : remise", () => {
  test("passe la réservation de confirmée à en cours et enregistre la date de remise", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation());
    reservationRepository.findInProgressByMateriel.mockResolvedValue(null);
    reservationRepository.update.mockResolvedValue({ _id: RESERVATION, status: "en cours" });

    const result = await reservationService.handOverReservation(RESERVATION, MAGASIN);

    expect(result.status).toBe("en cours");
    const [id, data] = reservationRepository.update.mock.calls[0];
    expect(id).toBe(RESERVATION);
    expect(data.status).toBe("en cours");
    expect(data.dateRemise).toBeInstanceOf(Date);
  });

  test("403 si la réservation appartient à un autre magasin", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation());

    await expect(
      reservationService.handOverReservation(RESERVATION, AUTRE_MAGASIN)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(reservationRepository.update).not.toHaveBeenCalled();
  });

  test("404 si la réservation n'existe pas", async () => {
    reservationRepository.findById.mockResolvedValue(null);

    await expect(
      reservationService.handOverReservation(RESERVATION, MAGASIN)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("400 si l'identifiant de réservation est invalide", async () => {
    await expect(
      reservationService.handOverReservation("abc", MAGASIN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("409 : double remise refusée (réservation déjà en cours)", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation({ status: "en cours" }));

    await expect(
      reservationService.handOverReservation(RESERVATION, MAGASIN)
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(reservationRepository.update).not.toHaveBeenCalled();
  });

  test("409 : transitions interdites depuis annulée et terminée", async () => {
    for (const status of ["annulée", "terminée"]) {
      reservationRepository.findById.mockResolvedValue(fakeReservation({ status }));
      await expect(
        reservationService.handOverReservation(RESERVATION, MAGASIN)
      ).rejects.toMatchObject({ statusCode: 409 });
    }
  });

  test("409 si le matériel est déjà emprunté par une autre réservation", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation());
    reservationRepository.findInProgressByMateriel.mockResolvedValue({ _id: "autre" });

    await expect(
      reservationService.handOverReservation(RESERVATION, MAGASIN)
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(reservationRepository.update).not.toHaveBeenCalled();
  });

  test("409 si le matériel est indisponible ou endommagé", async () => {
    reservationRepository.findById.mockResolvedValue(
      fakeReservation({
        materiel: { _id: MATERIEL, disponibilite: "indisponible", etat: "endommagé" },
      })
    );
    reservationRepository.findInProgressByMateriel.mockResolvedValue(null);

    await expect(
      reservationService.handOverReservation(RESERVATION, MAGASIN)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ============================================================
// EPIC 12 : retour du matériel (en cours -> terminée)
// ============================================================
describe("returnReservation : retour", () => {
  test("retour en bon état : terminée, date réelle de retour et état constaté", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation({ status: "en cours" }));
    reservationRepository.update.mockResolvedValue({ _id: RESERVATION, status: "terminée" });

    const result = await reservationService.returnReservation(RESERVATION, MAGASIN, {
      etatRetour: "bon",
    });

    expect(result.status).toBe("terminée");
    const [, data] = reservationRepository.update.mock.calls[0];
    expect(data.status).toBe("terminée");
    expect(data.etatRetour).toBe("bon");
    expect(data.dateRetourEffective).toBeInstanceOf(Date);
    // Matériel intact : on ne le modifie pas
    expect(materielRepository.update).not.toHaveBeenCalled();
  });

  test("retour endommagé : le matériel devient indisponible et endommagé", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation({ status: "en cours" }));
    reservationRepository.update.mockResolvedValue({ _id: RESERVATION, status: "terminée" });

    await reservationService.returnReservation(RESERVATION, MAGASIN, { etatRetour: "endommagé" });

    expect(materielRepository.update).toHaveBeenCalledWith(MATERIEL, {
      etat: "endommagé",
      disponibilite: "indisponible",
    });
  });

  test("400 si l'état constaté est absent ou invalide", async () => {
    await expect(
      reservationService.returnReservation(RESERVATION, MAGASIN, {})
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      reservationService.returnReservation(RESERVATION, MAGASIN, { etatRetour: "cassé" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("409 : retour impossible si la réservation n'est pas en cours", async () => {
    for (const status of ["confirmée", "annulée", "terminée"]) {
      reservationRepository.findById.mockResolvedValue(fakeReservation({ status }));
      await expect(
        reservationService.returnReservation(RESERVATION, MAGASIN, { etatRetour: "bon" })
      ).rejects.toMatchObject({ statusCode: 409 });
    }
    expect(reservationRepository.update).not.toHaveBeenCalled();
  });

  test("403 si la réservation appartient à un autre magasin", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation({ status: "en cours" }));

    await expect(
      reservationService.returnReservation(RESERVATION, AUTRE_MAGASIN, { etatRetour: "bon" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ============================================================
// EPIC 12 : retards, historique et détail
// ============================================================
describe("Retards, historique et détail", () => {
  test("listOverdueLoans : interroge le repository avec le magasin et la date du jour", async () => {
    reservationRepository.findOverdueByStore.mockResolvedValue([{ _id: "r1" }]);

    const result = await reservationService.listOverdueLoans(MAGASIN);

    expect(result).toHaveLength(1);
    const [magasinId, now] = reservationRepository.findOverdueByStore.mock.calls[0];
    expect(magasinId).toBe(MAGASIN);
    expect(now).toBeInstanceOf(Date);
  });

  test("listStoreHistory : retourne l'historique du magasin", async () => {
    reservationRepository.findHistoryByStore.mockResolvedValue([{ _id: "r1" }, { _id: "r2" }]);

    const result = await reservationService.listStoreHistory(MAGASIN);

    expect(result).toHaveLength(2);
    expect(reservationRepository.findHistoryByStore).toHaveBeenCalledWith(MAGASIN);
  });

  test("getStoreReservationDetails : 403 pour une réservation d'un autre magasin", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation());

    await expect(
      reservationService.getStoreReservationDetails(RESERVATION, AUTRE_MAGASIN)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("getStoreReservationDetails : retourne la réservation de son magasin", async () => {
    reservationRepository.findById.mockResolvedValue(fakeReservation());

    const result = await reservationService.getStoreReservationDetails(RESERVATION, MAGASIN);

    expect(result._id).toBe(RESERVATION);
  });
});
