# Reveil planningo (Android)

MVP Android pour executer les alarmes generees par la PWA.

## Demarrage

1. Ouvrir `android/` dans Android Studio.
2. Laisser la synchronisation Gradle se faire.
3. Lancer sur un appareil Android (minSdk 26).

## Import du plan

- Dans la PWA : bouton "Mettre a jour le reveil" -> Partager vers l'app.
- L'app importe le JSON et programme les alarmes exactes.

## Notes importantes

- Les alarmes exactes peuvent necessiter une autorisation (Android 12+).
- Le mode silencieux / DND peut limiter la sonnerie.
- Le reveil reste actif tant que l'utilisateur ne clique pas "Arreter" ou "Repeter".
- Reprogrammation automatique apres redemarrage du telephone (BOOT_COMPLETED).
- Reprogrammation automatique apres mise a jour de l'app (MY_PACKAGE_REPLACED).

## Prochaines etapes possibles

- Reprogrammation automatique apres reboot.
- Gestion d'une option "Repeter" desactivable.
- Personnalisation sonnerie/vibration.
