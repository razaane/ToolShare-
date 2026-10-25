const mongoose = require("mongoose");

const materielSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true
    },

    reference: {
      type: String,
      required: true,
      unique: true
    },

    etat: {
      type: String,
      enum: ["bon", "endommagé"],
      default: "bon"
    },

    disponibilite: {
      type: String,
      enum: ["Disponible", "indisponible"],
      default: "Disponible"
    },

    magasin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Magasin",
      required: true
    },

    actif: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Materiel", materielSchema);