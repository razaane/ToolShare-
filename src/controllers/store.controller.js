const storeService = require("../services/store.service");

/**
 * Récupérer tous les magasins actifs (GET /api/stores)
 */
const getActiveStores = async (req, res, next) => {
  try {
    const stores = await storeService.listActiveStores();
    return res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Récupérer les matériels d'un magasin actif (GET /api/stores/:id/equipments)
 */
const getStoreEquipments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipments = await storeService.listStoreEquipments(id);
    return res.status(200).json({
      success: true,
      count: equipments.length,
      data: equipments,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActiveStores,
  getStoreEquipments,
};
