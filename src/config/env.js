require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret_dev",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
