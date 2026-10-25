const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require("./swagger");

const app = express();
app.use(cors());
app.use(express.json());

const installationRoutes = require("./routes/installation.routes");
const userRoutes = require("./routes/user.routes");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/installation", installationRoutes);
app.use("/api/users", userRoutes);

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
  });
});

module.exports = app;