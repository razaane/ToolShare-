const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ToolShare API",
      version: "1.0.0",
      description: "Documentation de l'API ToolShare",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    components: {
      // Schéma de sécurité Bearer JWT (bouton "Authorize" de Swagger UI)
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Message d'erreur" },
          },
        },
        Materiel: {
          type: "object",
          properties: {
            _id: { type: "string", example: "671234567890123456789012" },
            nom: { type: "string", example: "Perceuse à percussion" },
            reference: { type: "string", example: "PERC-001" },
            etat: { type: "string", enum: ["bon", "endommagé"], example: "bon" },
            disponibilite: {
              type: "string",
              enum: ["Disponible", "indisponible"],
              example: "Disponible",
            },
            magasin: { type: "string", example: "671234567890123456789013" },
            actif: { type: "boolean", example: true },
          },
        },
        Reservation: {
          type: "object",
          properties: {
            _id: { type: "string", example: "671234567890123456789014" },
            utilisateur: { type: "string", example: "671234567890123456789015" },
            materiel: { type: "string", example: "671234567890123456789012" },
            magasin: { type: "string", example: "671234567890123456789013" },
            dateDebut: { type: "string", format: "date-time", example: "2026-12-01T09:00:00.000Z" },
            duree: { type: "number", description: "Durée en heures", example: 4 },
            dateFin: { type: "string", format: "date-time", example: "2026-12-01T13:00:00.000Z" },
            dateRemise: { type: "string", format: "date-time", nullable: true },
            dateRetourEffective: { type: "string", format: "date-time", nullable: true },
            etatRetour: { type: "string", enum: ["bon", "endommagé"], nullable: true },
            status: {
              type: "string",
              enum: ["confirmée", "annulée", "en cours", "terminée"],
              example: "confirmée",
            },
          },
        },
      },

      parameters: {
        ReservationId: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "ID de la réservation",
        },
        EquipmentId: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "ID du matériel",
        },
      },

      responses: {
        BadRequest: {
          description: "Données invalides",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Unauthorized: {
          description: "Non authentifié (jeton manquant, invalide ou expiré)",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Forbidden: {
          description: "Accès interdit (mauvais rôle ou ressource d'un autre magasin / utilisateur)",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        NotFound: {
          description: "Ressource introuvable",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Conflict: {
          description: "Conflit (créneau déjà réservé, transition interdite ou doublon)",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};