#!/bin/bash

# Script de déploiement automatique sur Vercel
# Usage: ./vercel-deploy.sh

echo "🚀 Démarrage du processus de déploiement sur Vercel..."

# 1. Vérifier si Node.js et npm sont installés
if ! command -v npm &> /dev/null
then
    echo "❌ Erreur : npm n'est pas installé. Veuillez installer Node.js."
    exit 1
fi

# 2. Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null
then
    echo "📦 Vercel CLI non trouvé. Installation globale en cours..."
    # Utilisation de sudo si nécessaire pour l'installation globale, sinon local
    npm install -g vercel || echo "⚠️ Échec de l'installation globale, essai avec npx..."
fi

# 3. Installation des dépendances du projet
if [ -f "package.json" ]; then
    echo "📦 Installation des dépendances du projet..."
    npm install
else
    echo "⚠️ Aucun fichier package.json trouvé. Assurez-vous d'être à la racine du projet."
fi

# 4. Connexion à Vercel (si pas déjà connecté)
echo "🔑 Vérification de la connexion Vercel..."
npx vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "Veuillez vous connecter à Vercel :"
    npx vercel login
fi

# 5. Déploiement (Preview)
echo "☁️  Déploiement de la version PREVIEW..."
npx vercel

# 6. Demander pour la Production
echo ""
read -p "❓ Voulez-vous déployer cette version en PRODUCTION (URL finale) ? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[OoYy]$ ]]
then
    echo "🚀 Déploiement en PRODUCTION..."
    npx vercel --prod
    echo "✅ Déploiement terminé !"
else
    echo "ℹ️  Déploiement en production annulé. La version Preview est disponible ci-dessus."
fi
