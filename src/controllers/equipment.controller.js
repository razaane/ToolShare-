const equipmentService = require("../services/equipment.service");

/**
 * Vérifier la disponibilité d'un matériel sur un créneau (GET /api/equipments/:id/availability)
 * Paramètres query attendus : startAt (ISO Date), durationHours (nombre)
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const startAt = req.query.startAt || req.body.startAt;
    const durationHours = req.query.durationHours || req.body.durationHours;

    const result = await equipmentService.checkEquipmentAvailability(
      id,
      startAt,
      durationHours
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkAvailability,
};
