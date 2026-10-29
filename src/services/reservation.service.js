const mongoose = require("mongoose");
const reservationRepository = require("../repositories/reservation.repository");
const materielRepository = require("../repositories/materiel.repository");
const magasinRepository = require("../repositories/magasin.repository");
const AppError = require("../utils/AppError");

/**
 * TL-49, TL-50, TL-51 : Créer une réservation avec règles métier, détection de chevauchement et transaction
 */
const createReservation = async ({ userId, magasinId, materielId, dateDebut, duree }) => {
  // 1. Validation de la présence des champs obligatoires
  if (!userId || !magasinId || !materielId) {
    throw new AppError("Identifiants utilisateur, magasin et matériel requis", 400);
  }

  // 2. Validation de la date de début
  if (!dateDebut) {
    throw new AppError("La date de début est requise", 400);
  }
  const startDate = new Date(dateDebut);
  if (isNaN(startDate.getTime())) {
    throw new AppError("La date de début est invalide", 400);
  }
  if (startDate.getTime() < Date.now()) {
    throw new AppError("La date de début ne peut pas être dans le passé", 400);
  }

  // 3. Validation de la durée
  const parsedDuree = Number(duree);
  if (!parsedDuree || parsedDuree <= 0) {
    throw new AppError("La durée doit être un nombre d'heures strictement supérieur à 0", 400);
  }

  // 4. Calcul automatique de la date de fin
  const endDate = new Date(startDate.getTime() + parsedDuree * 3600 * 1000);

  // 5. Vérifier que le magasin existe et est actif
  const magasin = await magasinRepository.findById(magasinId);
  if (!magasin) {
    throw new AppError("Magasin introuvable", 404);
  }
  const isMagasinActif = magasin.isActive !== undefined ? magasin.isActive : magasin.actif;
  if (!isMagasinActif) {
    throw new AppError("Le magasin choisi est inactif", 400);
  }

  // 6. Vérifier que le matériel existe et est actif
  const materiel = await materielRepository.findById(materielId);
  if (!materiel || materiel.actif === false) {
    throw new AppError("Matériel introuvable ou inactif", 404);
  }

  // 7. Vérifier que le matériel appartient bien au magasin sélectionné
  const materielMagasinId = materiel.magasin ? materiel.magasin.toString() : "";
  if (materielMagasinId !== magasinId.toString()) {
    throw new AppError("Le matériel n'appartient pas au magasin choisi", 400);
  }

  // 8. Vérifier que le matériel est disponible et en bon état
  if (materiel.disponibilite === "indisponible" || materiel.etat === "endommagé") {
    throw new AppError("Le matériel est indisponible ou endommagé", 400);
  }

  // 9 & 10. TL-51 : Gestion de la concurrence avec session / transaction
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    // Si standalone mongo (sans replica set), on continue sans session
    session = null;
  }

  try {
    // Vérification des chevauchements (statuts bloquants : "confirmée", "en cours")
    const overlapping = await reservationRepository.findOverlapping(
      materielId,
      startDate,
      endDate,
      session ? { session } : {}
    );

    if (overlapping && overlapping.length > 0) {
      throw new AppError("Le matériel est déjà réservé sur ce créneau", 409);
    }

    // Création de la réservation
    const reservationData = {
      utilisateur: userId,
      magasin: magasinId,
      materiel: materielId,
      dateDebut: startDate,
      duree: parsedDuree,
      dateFin: endDate,
      status: "confirmée",
    };

    const reservation = await reservationRepository.create(
      reservationData,
      session ? { session } : {}
    );

    if (session) {
      await session.commitTransaction();
    }

    return reservation;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  createReservation,
};
