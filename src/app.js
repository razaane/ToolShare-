const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require("./swagger");

const app = express();
app.use(cors());
app.use(express.json());

const installationRoutes = require("./routes/installation.routes");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/installation", installationRoutes);

module.exports = app;