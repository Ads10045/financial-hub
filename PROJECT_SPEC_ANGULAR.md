# Spécifications de Migration : Financial Hub (Node.js + Angular)

Ce document détalle l'architecture cible et les étapes pour migrer l'application **Financial Hub** vers une stack **Node.js (Backend)** + **Angular 18+ (Frontend)**, tout en préservant intégralement les règles métiers (RG), le design "IBM Green" et les fonctionnalités existantes (MFA, Email, Base de Données).

---

## 1. Stack Technique & Architecture Cible

L'application sera divisée en deux projets distincts (Monorepo ou Repos séparés) :

### 1.1. Backend (API & Data)
*   **Runtime** : Node.js (v20+).
*   **Framework** : Express.js (pour la simplicité et la flexibilité des routes API).
*   **Langage** : TypeScript.
*   **Base de Données** : PostgreSQL.
*   **ORM** : Prisma (Gestion du schéma `User` et migrations).
*   **Emailing** : Nodemailer (Configuration Gmail SMTP existante).
*   **Authentification** : JWT (JSON Web Tokens) pour la session stateless ou Cookies sélurisés.
*   **Structure** :
    ```
    backend/
      src/
        controllers/  # Logique des endpoints (Auth, User)
        routes/       # Définitions des URLs (/api/auth/...)
        services/     # Métier (EmailService, AuthService, PrismaService)
        middlewares/  # Vérification JWT, Logs
    ```

### 1.2. Frontend (UI & UX)
*   **Framework** : Angular 18+ (Standalone Components).
*   **Styling** : Tailwind CSS (Configuration `00915a` pour le vert IBM).
*   **State** : Services Angular avec RxJS.
*   **Librairies** :
    *   `qrcode` (Génération QR MFA).
    *   `canvas-confetti` (Animation succès).
    *   `lucide-angular` (Icônes).

---

## 2. Base de Données (PostgreSQL & Prisma)

Le Backend utilisera le schéma Prisma déjà validé.

### Modèle `User`
```prisma
model User {
  id        String   @id // Ex: "26626656"
  password  String
  firstName String
  lastName  String
  email     String   @unique
  phone     String?
  role      String   @default("User")
  status    String   @default("Active")
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 3. Règles de Gestion (RG) & Parcours Utilisateur

### 3.1. Login (Authentification Primaire)
**Endpoints Backend** : `POST /api/auth/login`

*   **Champs** : Identifiant (ID ou Email) + Mot de passe.
*   **RG-01 (Vérification)** :
    *   L'API vérifie les credentials dans PostgreSQL via Prisma.
    *   Si valide : Retourne `success: true` et le `userId` (pas encore de token complet, étape MFA requise).
    *   Si invalide : Retourne 401.
*   **RG-Démo (Backdoor)** : Si ID `26626656`, le mot de passe est ignoré (optionnel, à conserver si souhaité pour tests rapides).

### 3.2. MFA (Identification Secondaire)
**Endpoints Backend** : `POST /api/auth/mfa/verify`

L'utilisateur doit valider son identité via **Application** OU **Email**.

*   **RG-02 (Unified MFA)** :
    *   Le backend génère un Secret TOTP unique pour la session.
    *   **Flux App** : Le frontend affiche le QR Code (généré via `otpauth://...` avec le secret).
    *   **Flux Email** : Le backend génère le code à 6 chiffres via ce même secret et l'envoie par **Email** (Nodemailer) à l'adresse de l'utilisateur.
    *   **Validation** : Le code (app ou email) est le **même**. L'utilisateur le saisit.
    *   L'API `/verify` valide le code.

### 3.3. Succès & Session
**Endpoints Backend** : Retour du token final JTW ou Cookie.

*   **RG-03 (Session)** :
    *   Si MFA valide : Le backend signe un JWT (`auth_token`) valide pour **10 secondes** (selon la règle spécifiée) ou 7 jours (selon paramétrage).
    *   Le frontend stocke ce token (HttpOnly Cookie idéalement).

*   **RG-04 (UX Success)** :
    *   Animation Confetti (Vert).
    *   Redirection vers `/dashboard` après 2.5s.

---

## 4. Charte Graphique "IBM Green"

**Important** : Le design doit être strictement préservé.

*   **Branding** :
    *   Nom : **IBM**.
    *   Couleur Primaire : **Vert** (`#00915a`).
*   **Variables Tailwind (Frontend)** :
    *   Configurer `tailwind.config.js` pour inclure la couleur personnalisée `ibm-green: '#00915a'`.
*   **Composants** :
    *   Boutons : Fond vert au repos, vert foncé au survol.
    *   Liens : Texte vert.
    *   Focus : Ring vert.
    *   Fonds clairs : `bg-green-50` (au lieu de blue-50).

---

## 5. Endpoints API du Backend (Node.js)

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Vérifie ID/Password. Initie la session temporaire. |
| `POST` | `/api/auth/mfa/send-email` | Envoie le code TOTP par email. |
| `POST` | `/api/auth/mfa/verify` | Vérifie le code TOTP. Crée la session finale. |
| `POST` | `/api/auth/logout` | Détruit la session (Cookie). |
| `GET` | `/api/user/me` | Récupère les infos du profil connecté (via Token). |

---

---

## 6. Guide de Mise en Œuvre (Runbook Pas-à-Pas)

Cette section détaille chaque commande et fichier nécessaire pour construire le projet de A à Z.

### PHASE 1 : Initialisation du Backend (Node.js)

#### 1. Configuration Initiale
```bash
# Dans la racine du workspace
mkdir backend
cd backend
npm init -y
npm install express cors dotenv @prisma/client nodemailer body-parser cookie-parser
npm install --save-dev typescript @types/node @types/express @types/cors prisma ts-node nodemon @types/nodemailer @types/cookie-parser
npx tsc --init
```

#### 2. Structure des Fichiers Backend
Créez l'arborescence suivante :
```
backend/
├── src/
│   ├── app.ts                # Point d'entrée
│   ├── config/
│   │   └── database.ts       # Instance Prisma
│   ├── controllers/
│   │   └── authController.ts # Logique Login/MFA
│   ├── routes/
│   │   └── authRoutes.ts     # Routes API
│   ├── services/
│   │   ├── emailService.ts   # Nodemailer
│   │   └── otpService.ts     # Génération TOTP
│   └── middlewares/
├── .env                      # Variables (DB + Email)
└── package.json
```

#### 3. Configuration de la Base de Données
Copiez le dossier `prisma` existant dans `backend/prisma` ou initialisez-le :
```bash
npx prisma init
# Assurez-vous que schema.prisma contient le modèle User
npx prisma generate
```

#### 4. Code : `src/app.ts` (Squelette)
```typescript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';

const app = express();
app.use(cors({ origin: 'http://localhost:4200', credentials: true })); // Autoriser Angular
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
```

---

### PHASE 2 : Initialisation du Frontend (Angular)

#### 1. Création du Projet
```bash
# Retour à la racine
cd ..
ng new frontend --style=css --ssr=false
cd frontend
```

#### 2. Installation de Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```
*   **Mise à jour `tailwind.config.js`** pour le "Vert IBM" :
    ```javascript
    theme: {
      extend: {
        colors: {
          'ibm-green': '#00915a',
          'ibm-green-dark': '#006039',
        }
      }
    }
    ```
*   Ajouter les directives Tailwind dans `src/styles.css`.

#### 3. Installation des Dépendances UI
```bash
npm install lucide-angular canvas-confetti qrcode
npm install --save-dev @types/canvas-confetti @types/qrcode
```

#### 4. Structure des Composants Angular
Générez les composants clés :
```bash
ng g c pages/login
ng g c pages/dashboard
ng g c components/ui/button
ng g c components/ui/input
ng g s services/auth
ng g s services/api
```

> **IMPORTANT : Fidélité du Design**
> Pour garantir que le design, les libellés et la structure restent **identiques**, le portage se fera en **copiant le HTML et les classes Tailwind** depuis les fichiers React (`src/app/[locale]/login/page.tsx` et `dashboard/page.tsx`) vers les templates Angular (`.html`).
> *   Les balises React `<div className="...">` deviennent `<div class="...">`.
> *   Les conditions `{cond && ...}` deviennent `*ngIf="cond"`.
> *   Les textes et labels doivent être copiés/collés à l'identique.

---

### PHASE 3 : Intégration & Logique Métier

#### 1. Service d'Authentification (`auth.service.ts`)
Ce service doit gérer l'état de la connexion.
*   Méthode `login(id, pwd)` -> Appel Backend `POST /api/auth/login`.
*   Méthode `verifyMfa(code)` -> Appel Backend `POST /api/auth/mfa/verify`.
*   Gestion du Cookie : Angular doit envoyer `{ withCredentials: true }` dans les requêtes HTTP pour que le cookie de session soit transmis.

#### 2. Page de Login (`login.component.ts`)
*   Logique des `steps` (Login -> MFA -> Success).
*   Appel à `QRCode.toDataURL()` pour afficher le QR code reçu du backend (ou généré localement avec le secret).
*    Gestion des timers (Redirection 10s).

#### 3. Dashboard (`dashboard.component.ts`)
*   Vérification de la session au chargement (`CanActivate` Guard).
*   Affichage des données utilisateur (`user` object).

---

## 7. Migration des Données

*   **Script de Seed** : Exécutez `npx tsx prisma/seed.ts` dans le dossier backend pour peupler la base PostgreSQL avec les utilisateurs initiaux (Younes, John, Joker).
*   **Vérification** : Utilisez `npx prisma studio` pour vérifier que les utilisateurs sont bien créés.

Ce plan détaillé couvre l'intégralité du cycle de vie du développement pour la migration vers Node/Angular.

