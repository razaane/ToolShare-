require("dotenv").config();

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET est obligatoire en production");
}

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "dev_only_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
};