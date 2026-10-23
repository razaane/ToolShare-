const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require("./swagger");

const app = express();
app.use(cors());
app.use(express.json());

const installationRoutes = require("./routes/installation.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes =  require("./routes/auth.routes");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/installation", installationRoutes);

app.use("/api/auth",authRoutes);
app.use("/api/users", userRoutes);

module.exports = app;