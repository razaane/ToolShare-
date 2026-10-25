const mongoose = require("mongoose");

const magasinSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    site: {
      type: String,
      required: true,
      trim: true,
    },
    adresse: {
      type: String,
      required: true,
      trim: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Getter virtuel isActive pour compatibilité
magasinSchema.virtual("isActive").get(function () {
  return this.actif;
});

const Magasin = mongoose.model("Magasin", magasinSchema);

// Enregistrement d'un alias "Store" pour compatibilité de modèle
try {
  mongoose.model("Store", magasinSchema);
} catch (e) {
  // Déjà enregistré
}

module.exports = Magasin;
