const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const installationRoutes = require("./routes/installation.routes");

app.use("/api/installation", installationRoutes);

module.exports = app;