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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Alias "actif" pour compatibilité avec le service store
magasinSchema.virtual("actif").get(function () {
  return this.isActive;
});

module.exports = mongoose.model("Magasin", magasinSchema);
