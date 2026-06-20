# À Faire : Alignement avec la Simulation Bancaire (Argenta)

Ce document récapitule les trois axes d'amélioration identifiés pour aligner le simulateur web avec la simulation officielle de la banque Argenta (PDF).

## 1. Calculateur de Budget / Coût de Projet (Project Cost Calculator)
- [x] Remplacer la saisie directe du capital emprunté par un calcul basé sur le projet réel :
  - Saisie du **Prix d'achat du bien** (ex: 450 000 €).
  - Saisie des **Travaux / Rénovations** (ex: 50 000 €).
  - Calcul automatique de l'ensemble des frais annexes (droits d'enregistrement, notaire, inscription hypothécaire, dossier).
  - Saisie des **Fonds propres / Apport** (ex: 130 000 €).
  - Déduction automatique du **Capital Emprunté** nécessaire : `Capital = Coût Total - Fonds Propres`.

## 2. Intégration Cohérente de l'Apport Personnel
- [x] Unifier le concept d'apport / fonds propres dans toute l'application :
  - L'apport personnel renseigné dans le budget principal doit alimenter automatiquement le calcul du comparatif "Acheter vs. Louer".
  - Les changements sur l'apport doivent recalculer dynamiquement la mensualité du crédit principal en réduisant ou augmentant le capital emprunté.

## 3. Paramètres Régionaux et Calcul des Frais Belges
- [x] Ajouter un sélecteur de région (**Wallonie** / **Flandre**) pour calculer précisément les frais :
  - **Droits d'enregistrement** : 3.00% pour la Wallonie, 2.00% pour la Flandre (selon conditions du PDF).
  - **Frais de notaire** : calcul exact des barèmes de notaire belges plutôt qu'un taux forfaitaire.
  - **Frais d'inscription hypothécaire** : calcul selon les tranches belges pour l'inscription du crédit.
  - **Frais de dossier** : fixer des frais administratifs fixes à 350.00 € comme dans l'offre Argenta.
