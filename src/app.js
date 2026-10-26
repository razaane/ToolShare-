const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require("./swagger");

const app = express();
app.use(cors());
app.use(express.json());

const installationRoutes = require("./routes/installation.routes");
const userRoutes = require("./routes/user.routes");
const storeRoutes = require("./routes/store.routes");
const equipmentRoutes = require("./routes/equipment.routes");
const authRoutes = require("./routes/auth.routes");
const adminMagasinRoutes = require("./routes/adminMagasin.routes");
const magasinRoutes = require("./routes/magasin.routes");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/installation", installationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/stores", adminMagasinRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/magasins", storeRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/materiels", equipmentRoutes);

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
  });
});

module.exports = app;