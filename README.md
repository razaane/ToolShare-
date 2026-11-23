# ToolShare

Plateforme web de réservation et de gestion de matériel professionnel, répartie entre plusieurs magasins.

- **Frontend** : React (SPA responsive) — Sprint 3
- **Backend** : API REST Node.js / Express / MongoDB — Sprint 2
- **Profils** : Administrateur, Manager, Client

> Correspondance des rôles : l'API utilise `Admin`, `Gestionnaire` et `Utilisateur`. L'interface les affiche comme Administrateur, Manager et Client.

## Sommaire

1. Prérequis
2. Architecture
3. Configuration
4. Installation et lancement
5. Tests
6. Docker
7. CI/CD (GitHub Actions et Docker Hub)
8. Démonstration des fonctionnalités
9. Référence rapide de l'API
10. Sécurité

---

## 1. Prérequis

| Outil | Version conseillée |
|---|---|
| Node.js | 20 ou plus |
| npm | 10 ou plus |
| Docker et Docker Compose | récents |
| MongoDB | 7 (fourni par Docker Compose) |

## 2. Architecture

```
toolshare/
├── frontend/                 # React (Vite)
│   ├── src/
│   │   ├── api/              # instance Axios centralisée + services
│   │   ├── context/          # AuthContext (session, rôle, token)
│   │   ├── hooks/            # useAuth et hooks React Query
│   │   ├── components/       # composants réutilisables (formulaires, tableaux, états)
│   │   ├── layouts/          # ClientLayout, ManagerLayout, AdminLayout
│   │   ├── pages/            # pages par espace (client, manager, admin, auth)
│   │   ├── routes/           # routes publiques, privées, imbriquées, ProtectedRoute
│   │   └── tests/            # Jest + React Testing Library
│   ├── Dockerfile
│   ├── nginx.conf            # fallback SPA (try_files vers index.html)
│   └── .dockerignore
├── backend/                  # API Express (Sprint 2)
│   ├── src/
│   │   ├── routes/ controllers/ services/ repositories/ models/
│   │   ├── middlewares/      # authenticate, authorize, checkManagerStore
│   │   └── validators/
│   ├── tests/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
└── .github/workflows/        # ci.yml et cd.yml
```

### Choix techniques

- **Axios** : une seule instance (URL de base configurable, ajout du token Bearer, traitement commun des erreurs 401/403).
- **TanStack Query** : queries, mutations, cache et invalidation après chaque modification.
- **Context API** : authentification et session (`AuthContext`, `useAuth`).
- **React Router** : routes publiques, privées et imbriquées, layouts séparés par rôle, page « Accès refusé » et page 404.
- **useMemo** : utilisé uniquement pour les filtres et calculs dérivés.
- **Backend en couches** : routes → contrôleurs → services → repositories → modèles.

## 3. Configuration

Les secrets ne sont jamais versionnés ni copiés dans les images. Copier les fichiers d'exemple :

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### Backend (`.env`)

| Variable | Rôle | Exemple |
|---|---|---|
| `PORT` | Port de l'API | `3000` |
| `MONGO_URI` | Connexion MongoDB | `mongodb://mongo:27017/toolshare` |
| `JWT_SECRET` | Secret de signature des jetons (obligatoire, long et aléatoire) | `à générer` |
| `JWT_EXPIRES_IN` | Durée de validité du jeton | `1d` |
| `CORS_ORIGIN` | Origine du frontend autorisée | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Rôle | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API | `http://localhost:3000/api` |

## 4. Installation et lancement

### Sans Docker

```bash
# Backend
cd backend
npm install
npm run dev            # http://localhost:3000

# Frontend (autre terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

MongoDB doit être démarré (local ou conteneur) et `MONGO_URI` renseignée.

### Première utilisation

Aucune inscription publique. Le premier administrateur est créé via la route d'installation :

- `GET /api/installation/status` : indique si la plateforme est déjà installée
- `POST /api/installation` : crée le compte administrateur initial

Ensuite, l'administrateur crée les magasins et les comptes, puis affecte un manager à chaque magasin. Un manager peut créer des comptes Client pour son magasin.

### Documentation de l'API

Swagger UI : `http://localhost:3000/api-docs`

## 5. Tests

### Frontend (Jest + React Testing Library)

```bash
cd frontend
npm test
```

Les appels API sont simulés (aucune dépendance au serveur ni à MongoDB). Scénarios couverts :

- catalogue chargé depuis l'API, état de chargement et état d'erreur
- validation du formulaire de réservation et message en cas de conflit (409)
- protection des routes et navigation selon le rôle
- remise et retour d'un matériel (changement de statut)

### Backend (Jest)

```bash
cd backend
npm test
```

### Lint

```bash
npm run lint           # dans frontend/ et backend/
```

## 6. Docker

Deux images indépendantes :

| Image | Contenu |
|---|---|
| `toolshare-frontend` | React compilé, servi par Nginx (rechargement d'une route SPA fonctionnel) |
| `toolshare-backend` | API Express, configurée par variables d'environnement |

MongoDB utilise l'image officielle `mongo:7`. Ce n'est pas une image applicative du projet.

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api-docs |

Construction séparée :

```bash
docker build -t toolshare-frontend ./frontend
docker build -t toolshare-backend ./backend
```

## 7. CI/CD (GitHub Actions et Docker Hub)

### CI — `.github/workflows/ci.yml`

Déclenchée sur push et pull request vers `main`, pour le frontend et le backend :

1. installation des dépendances (`npm ci`)
2. ESLint
3. tests automatisés
4. build de production

Un échec bloque la livraison.

### CD — `.github/workflows/cd.yml`

Déclenchée sur push dans `main` (y compris après fusion d'une pull request), uniquement après succès de la CI :

1. construction des images frontend et backend
2. connexion à Docker Hub avec les secrets GitHub
3. publication dans deux dépôts distincts : `<username>/toolshare-frontend` et `<username>/toolshare-backend`
4. tags `latest` et SHA du commit pour chaque image

Une pull request non fusionnée ne publie rien.

### Secrets GitHub à créer

| Secret | Contenu |
|---|---|
| `DOCKERHUB_USERNAME` | Nom d'utilisateur Docker Hub |
| `DOCKERHUB_TOKEN` | Jeton d'accès Docker Hub (pas le mot de passe) |

### Images publiées

- Frontend : `https://hub.docker.com/r/<username>/toolshare-frontend`
- Backend : `https://hub.docker.com/r/<username>/toolshare-backend`

## 8. Démonstration des fonctionnalités

### Client
1. Connexion, redirection vers l'espace Client.
2. Consultation des magasins, puis du catalogue d'un magasin (recherche, filtres, pagination).
3. Page de détail d'un matériel.
4. Réservation : matériel, magasin, date/heure de début, durée, puis récapitulatif et confirmation.
5. Tentative sur un créneau déjà pris : le conflit est affiché.
6. « Mes réservations » : filtre par statut, détail, annulation d'une réservation confirmée.

### Manager
1. Tableau de bord du magasin : matériels, réservations, emprunts en cours, retards.
2. Gestion du matériel : création, modification, désactivation, indisponible / remise en service.
3. Réservations du magasin : recherche et filtres (statut, matériel, période), détail.
4. Remise : `Confirmée` → `En cours`.
5. Retour avec état constaté (bon ou endommagé) : `En cours` → `Terminée`. Un matériel endommagé devient indisponible.
6. Aucune action possible sur un autre magasin (403).

### Administrateur
1. Tableau de bord global : magasins, matériels, utilisateurs, réservations par statut.
2. Magasins : consultation, création, modification, désactivation.
3. Utilisateurs : consultation, création de comptes, affectation d'un manager à un magasin.
4. Supervision des réservations de tous les magasins (recherche, filtres, détail).

### Autres parcours
- Accès à un espace interdit : page « Accès refusé ».
- Route inconnue : page 404.
- Session expirée (401) : retour à la connexion.

## 9. Référence rapide de l'API

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/login` | public |
| GET / POST | `/api/installation/status`, `/api/installation` | public (première installation) |
| GET | `/api/stores` | connecté |
| GET | `/api/stores/:id/equipments` | connecté |
| GET | `/api/equipments/:id/availability?startAt=&durationHours=` | connecté |
| POST | `/api/reservations` | connecté |
| GET | `/api/reservations/me` | connecté |
| GET | `/api/reservations/:id` | propriétaire |
| PATCH | `/api/reservations/:id/cancel` | propriétaire |
| GET | `/api/manager/store` | Gestionnaire |
| POST / PUT | `/api/manager/equipments`, `/api/manager/equipments/:id` | Gestionnaire |
| PATCH | `/api/manager/equipments/:id/deactivate`, `/unavailable`, `/available` | Gestionnaire |
| POST | `/api/manager/users` | Gestionnaire (comptes Client uniquement) |
| GET | `/api/manager/reservations` (`status`, `materiel`, `from`, `to`) | Gestionnaire |
| GET | `/api/manager/reservations/overdue`, `/history`, `/:id` | Gestionnaire |
| PATCH | `/api/manager/reservations/:id/handover`, `/return` | Gestionnaire |
| GET / POST / PUT | `/api/admin/stores`, `/api/admin/stores/:id` | Admin |
| PATCH | `/api/admin/stores/:id/deactivate`, `/manager` | Admin |
| GET / POST / PUT | `/api/users`, `/api/users/:id` | Admin |
| PATCH | `/api/users/:id/deactivate` | Admin |

Statuts de réservation : `confirmée`, `en cours`, `terminée`, `annulée`. Les réservations annulées ne bloquent plus les créneaux. Deux réservations actives du même matériel ne peuvent pas se chevaucher (409).

## 10. Sécurité

- Les contrôles côté client ne remplacent jamais les autorisations du backend.
- Les textes utilisateur sont affichés par React (échappés), sans injection de HTML.
- Les erreurs 401 et 403 sont traitées globalement dans l'instance Axios.
- Aucun secret dans le dépôt ni dans les images ; `.env` est ignoré par Git et Docker.
- CORS restreint à l'origine du frontend.