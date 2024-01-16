#!/bin/bash
./node_modules/.bin/electron-builder

# Étape 2: Signer l'application
# Remplacez '/chemin/vers/VotreApp.app' par le chemin réel vers votre application empaquetée
DMG_PATH="./build/Vitta Companion-$npm_package_version-arm64.dmg"

# Vérification de l'existence du fichier
if [ -f "$DMG_PATH" ]; then
    echo "Fichier DMG trouvé : $DMG_PATH"
    
    # Signature du fichier DMG
    codesign --deep --force --sign "VittaCert" --keychain --verbose "$DMG_PATH"
else
    echo "Fichier DMG non trouvé : $DMG_PATH"
fi