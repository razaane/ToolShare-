const magasinRepository = require("../repositories/magasin.repository");
const materielRepository = require("../repositories/materiel.repository");
const AppError = require("../utils/AppError");

/**
 * Lister les magasins actifs (les magasins inactifs sont masqués)
 */
const listActiveStores = async () => {
  const stores = await magasinRepository.findActive();
  return stores.map((store) => ({
    id: store._id,
    nom: store.nom,
    site: store.site,
    adresse: store.adresse,
    actif: store.actif,
  }));
};

/**
 * Lister les matériels d'un magasin actif
 */
const listStoreEquipments = async (storeId) => {
  const store = await magasinRepository.findById(storeId);

  // Règle TL-45 / TL-133 : Le magasin doit exister et être actif
  if (!store || !store.actif) {
    throw new AppError("Magasin introuvable ou inactif", 404);
  }

  // Seuls les matériels actifs de ce magasin sont consultables
  const equipments = await materielRepository.listByStore(storeId, { actif: true });

  return equipments.map((eq) => ({
    id: eq._id,
    nom: eq.nom,
    reference: eq.reference,
    etat: eq.etat,
    disponibilite: eq.disponibilite,
    magasin: eq.magasin,
    actif: eq.actif,
  }));
};

module.exports = {
  listActiveStores,
  listStoreEquipments,
};
