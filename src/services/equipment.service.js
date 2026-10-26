const materielRepository = require("../repositories/materiel.repository");
const magasinRepository = require("../repositories/magasin.repository");
const reservationRepository = require("../repositories/reservation.repository");
const AppError = require("../utils/AppError");

/**
 * Vérifier la disponibilité d'un matériel sur un créneau (TL-46 / TL-132)
 * @param {string} equipmentId - ID du matériel
 * @param {Date|string} startAt - Date et heure de début
 * @param {number} durationHours - Durée en heures (> 0)
 */
const checkEquipmentAvailability = async (equipmentId, startAt, durationHours) => {
  if (!startAt) {
    throw new AppError("La date de début (startAt) est requise", 400);
  }

  const startDate = new Date(startAt);
  if (isNaN(startDate.getTime())) {
    throw new AppError("La date de début (startAt) est invalide", 400);
  }

  const parsedDuration = Number(durationHours);
  if (!parsedDuration || parsedDuration <= 0) {
    throw new AppError("La durée (durationHours) doit être un nombre strictement supérieur à 0", 400);
  }

  // Calcul automatique de la date de fin
  const endDate = new Date(startDate.getTime() + parsedDuration * 3600 * 1000);

  // 1. Vérification de l'existence du matériel
  const equipment = await materielRepository.findById(equipmentId);
  if (!equipment) {
    throw new AppError("Matériel introuvable", 404);
  }

  // 2. Vérification de l'état du matériel
  if (!equipment.actif) {
    return {
      available: false,
      reason: "Le matériel est désactivé",
      equipment: { id: equipment._id, nom: equipment.nom, reference: equipment.reference },
      startAt: startDate,
      endAt: endDate,
      durationHours: parsedDuration,
    };
  }

  if (equipment.disponibilite === "indisponible" || equipment.etat === "endommagé") {
    return {
      available: false,
      reason: "Le matériel est actuellement marqué comme indisponible ou endommagé",
      equipment: { id: equipment._id, nom: equipment.nom, reference: equipment.reference },
      startAt: startDate,
      endAt: endDate,
      durationHours: parsedDuration,
    };
  }

  // 3. Vérification du statut du magasin associé
  if (equipment.magasin) {
    const store = await magasinRepository.findById(equipment.magasin);
    if (!store || !store.actif) {
      return {
        available: false,
        reason: "Le magasin associé à ce matériel est inactif ou introuvable",
        equipment: { id: equipment._id, nom: equipment.nom, reference: equipment.reference },
        startAt: startDate,
        endAt: endDate,
        durationHours: parsedDuration,
      };
    }
  }

  // 4. Détection des chevauchements de réservations actives
  const overlapping = await reservationRepository.findOverlapping(
    equipmentId,
    startDate,
    endDate
  );

  if (overlapping && overlapping.length > 0) {
    return {
      available: false,
      reason: "Le matériel est déjà réservé sur ce créneau",
      equipment: { id: equipment._id, nom: equipment.nom, reference: equipment.reference },
      startAt: startDate,
      endAt: endDate,
      durationHours: parsedDuration,
      overlappingReservationsCount: overlapping.length,
    };
  }

  return {
    available: true,
    message: "Le matériel est disponible sur ce créneau",
    equipment: {
      id: equipment._id,
      nom: equipment.nom,
      reference: equipment.reference,
      etat: equipment.etat,
      magasin: equipment.magasin,
    },
    startAt: startDate,
    endAt: endDate,
    durationHours: parsedDuration,
  };
};

module.exports = {
  checkEquipmentAvailability,
};
