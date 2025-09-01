# AeroSynapse - Système Intégré de Conscience Situationnelle et Planification de Vol

**AeroSynapse** est un outil web avancé de conscience situationnelle et de planification de vol conçu pour les pilotes professionnels et d'aviation générale. Il combine des données de trafic aérien en temps réel, des informations météorologiques multi-sources, la planification de routes et l'analyse de sécurité historique dans une interface web unifiée et professionnelle.

## 🚀 Caractéristiques Principales

### 🛩️ Trafic Aérien en Temps Réel
- Visualisation d'aéronefs en temps réel style FlightRadar24
- Informations détaillées de chaque aéronef (immatriculation, type, origine/destination)
- Filtres avancés par altitude, type d'aéronef, compagnie aérienne
- Alertes de proximité et détection de conflits

### ⚠️ Système de Prévention de Collisions (type TCAS)
- Algorithmes avancés de détection de proximité
- Alertes visuelles et auditives pour conflits potentiels
- Calcul du temps jusqu'à l'approche la plus proche
- Suggestions de résolution basées sur les règles de l'air

### 🌦️ Module de Météorologie Avancée
- **Agrégation multi-sources** de données météorologiques (AWC, NOAA, EUMETSAT, RainViewer)
- **Système de confiance** qui évalue la concordance entre sources
- **METARs, TAFs et SIGMETs** en temps réel
- **Overlays météorologiques** (radar, satellite, vents en altitude)
- **Indice de confiance** pour prise de décisions éclairée

### 🛡️ Module de Sécurité et Historique d'Accidents
- **Base de données d'accidents** (NTSB, Aviation Safety Network)
- **Analyse de risque par localisation** avec multiples facteurs
- **Visualisation d'accidents historiques** sur la carte
- **Statistiques de sécurité** et tendances temporelles
- **Alertes de sécurité automatiques** par clusters d'accidents

### 🗺️ Planification de Routes Intelligente
- Calculatrice de routes directes et par airways
- Base de données complète d'aéroports et waypoints
- Informations de carburant, temps et distance
- Intégration avec cartes de navigation

### 🌐 Informations d'Espace Aérien (FIR)
- Visualisation des frontières FIR, CTR, TMA
- Base de données d'aides à la navigation (VOR, DME, NDB, ILS)
- Espaces aériens restreints et dangereux
- Fréquences et procédures spécifiques

### 🌍 Support Multi-langues
- **Anglais, Espagnol, Portugais et Français**
- **Changement dynamique** de langue
- **Détection automatique** de la langue du navigateur
- **Interface entièrement traduite**

### 🎨 Interface Utilisateur Professionnelle
- **Mode nuit** optimisé pour cockpit
- **Panneaux redimensionnables** et personnalisables
- **Couleurs standard de l'aviation** pour interprétation rapide
- **Design responsive** pour différents appareils
- **Outil web** accessible depuis n'importe quel navigateur

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Material-UI** pour les composants
- **Leaflet** pour cartes interactives
- **Socket.IO** pour communication temps réel
- **React-i18next** pour internationalisation
- **Context API** pour gestion d'état

### Backend
- **Node.js** avec Express et TypeScript
- **PostgreSQL** avec PostGIS pour données géospatiales
- **Socket.IO** pour WebSocket
- **Winston** pour logging
- **Joi** pour validation de données
- **APIs externes** pour données météorologiques et de sécurité

## 📁 Structure du Projet

```
AeroSynapse/
├── frontend/          # Application React Web
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── contexts/      # Contextes d'État
│   │   ├── hooks/         # Hooks Personnalisés
│   │   ├── i18n/          # Système d'Internationalisation
│   │   ├── services/      # Services API
│   │   ├── types/         # Types TypeScript
│   │   └── utils/         # Utilitaires
│   └── public/        # Fichiers Statiques
├── backend/           # API et Services
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── database/      # Base de Données
│   │   ├── middleware/    # Middleware
│   │   ├── routes/        # Routes API
│   │   ├── services/      # Logique Métier
│   │   └── utils/         # Utilitaires
│   └── .env.example   # Variables d'Environnement
├── docs/              # Documentation
└── README.md          # Ce Fichier
```

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18 ou supérieur
- PostgreSQL 14+ avec PostGIS
- npm ou yarn

### Installation

1. **Cloner le dépôt :**
   ```bash
   git clone <repository-url>
   cd AeroSynapse
   ```

2. **Installer les dépendances frontend :**
   ```bash
   cd frontend
   npm install
   ```

3. **Installer les dépendances backend :**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configurer les variables d'environnement :**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos configurations
   ```

5. **Configurer la base de données PostgreSQL :**
   ```sql
   CREATE DATABASE aerosynapse;
   CREATE USER aerosynapse_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aerosynapse TO aerosynapse_user;
   
   -- Se connecter à la base de données et activer PostGIS
   \c aerosynapse
   CREATE EXTENSION postgis;
   ```

6. **Compiler TypeScript :**
   ```bash
   npm run build
   ```

7. **Démarrer les services :**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

## 🌐 URLs d'Accès

- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:3001/api
- **Health Check** : http://localhost:3001/health

## 🌍 Support des Langues

L'application détecte automatiquement la langue du navigateur et supporte :
- 🇺🇸 **Anglais** (Par défaut)
- 🇪🇸 **Espagnol**
- 🇧🇷 **Portugais**
- 🇫🇷 **Français**

Les utilisateurs peuvent changer la langue en utilisant le sélecteur de langue dans l'interface.

## 📖 Documentation

- [README en Anglais](README.en.md)
- [README en Espagnol](README.md)
- [README en Portugais](README.pt.md)
- [README en Français](README.fr.md)
- [Documentation Backend](backend/README.md)

## 🤝 Contribuer

1. Forker le dépôt
2. Créer une branche de fonctionnalité : `git checkout -b feature/nouvelle-fonctionnalite`
3. Committer vos changements : `git commit -am 'Ajouter nouvelle fonctionnalité'`
4. Pousser vers la branche : `git push origin feature/nouvelle-fonctionnalite`
5. Créer une Pull Request

## 📄 Licence

Licence MIT - voir le fichier LICENSE pour les détails.

## 🆘 Support

Pour le support technique ou questions :
- Créer une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation dans `/docs`

---

**AeroSynapse** - Outil professionnel de conscience situationnelle et planification de vol pour l'aviation.