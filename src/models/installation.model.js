const mongoose = require("mongoose");

const installationSchema = new mongoose.Schema(
  {
    installed: {
      type: Boolean,
      default: false
    },
    installedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  },
  
);

module.exports = mongoose.model("Installation", installationSchema);