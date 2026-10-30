const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    materiel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Materiel",
      required: true,
    },

    magasin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Magasin",
      required: true,
    },

    dateDebut: {
      type: Date,
      required: true,
    },

    duree: {
      type: Number,
      required: true,
    },

    dateFin: {
      type: Date,
      required: true,
    },

    dateRemise: {
      type: Date,
    },

    dateRetourEffective: {
      type: Date,
    },

    etatRetour: {
      type: String,
      enum: ["bon", "endommagé"],
    },

    status: {
      type: String,
      enum: ["confirmée", "annulée", "en cours", "terminée"],
      default: "confirmée",
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour optimiser les requêtes de disponibilité et chevauchement (TL-135)
reservationSchema.index({ materiel: 1, dateDebut: 1, dateFin: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
