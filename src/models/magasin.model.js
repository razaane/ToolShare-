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

module.exports = mongoose.model("Magasin", magasinSchema);