const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compte",
      required: true
    },

    materiel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Materiel",
      required: true
    },

    magasin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Magasin",
      required: true
    },

    dateDebut: {
      type: Date,
      required: true
    },

    duree: {
      type: Number,
      required: true
    },

    dateFin: {
      type: Date,
      required: true
    },

    dateRemise: {
      type: Date
    },

    dateRetourEffective: {
      type: Date
    },

    etatRetour: {
      type: String,
      enum: ["bon", "endommagé"]
    },

    status: {
      type: String,
      enum: ["confirmée", "annulée", "en cours", "terminée"],
      default: "confirmée"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);