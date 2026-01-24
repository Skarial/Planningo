#!/bin/bash
set -e

# Vérification de la branche courante
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "avancement" ]; then
  echo "ERREUR : tu n'es pas sur la branche avancement (branche actuelle : $BRANCH)"
  exit 1
fi

# Demande du message de commit
echo "Message de commit :"
read MESSAGE

if [ -z "$MESSAGE" ]; then
  echo "ERREUR : message de commit vide"
  exit 1
fi

# Commit sur avancement
git add .
git commit -m "$MESSAGE"
git push origin avancement

# Merge vers principal
git checkout principal
git merge avancement
git push origin principal

# Retour sur avancement + mise à jour
git checkout avancement
git merge principal

echo "OK : avancement → principal → avancement terminé"
