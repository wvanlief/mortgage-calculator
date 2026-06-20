# Simulateur de Prêt Immobilier — Roadmap & Améliorations

---

## ✅ Phase 1 : Alignement avec la Simulation Bancaire (Argenta)

### 1. Calculateur de Budget / Coût de Projet
- [x] Remplacer la saisie directe du capital emprunté par un calcul basé sur le projet réel :
  - Saisie du **Prix d'achat du bien** (ex: 450 000 €).
  - Saisie des **Travaux / Rénovations** (ex: 50 000 €).
  - Calcul automatique des frais annexes (droits d'enregistrement, notaire, inscription hypothécaire, dossier).
  - Saisie des **Fonds propres / Apport** (ex: 130 000 €).
  - Déduction automatique du **Capital Emprunté** : `Capital = Coût Total - Fonds Propres`.

### 2. Intégration Cohérente de l'Apport Personnel
- [x] Unifier le concept d'apport / fonds propres dans toute l'application :
  - L'apport renseigné dans le budget principal alimente automatiquement le comparatif "Acheter vs. Louer".
  - Les changements sur l'apport recalculent dynamiquement la mensualité du crédit.

### 3. Paramètres Régionaux et Calcul des Frais Belges
- [x] Ajouter un sélecteur de région (**Wallonie** / **Flandre** / **Bruxelles-Capitale**) :
  - **Droits d'enregistrement** : 3% Wallonie, 2% Flandre, 12.5% Bruxelles (abattement 200k€ résidence principale).
  - **Frais de notaire** : barèmes régressifs belges + TVA 21%.
  - **Inscription hypothécaire** : calcul par tranches + débours régionaux.
  - **Frais de dossier** : 350 € fixes (Argenta).

---

## ✅ Phase 2 : Fonctionnalités Avancées

### 4. Précompte Immobilier
- [x] Implémenter le calcul estimatif du Précompte Immobilier :
  - Saisie du **Revenu Cadastral (RC)** non indexé.
  - Application du coefficient d'indexation 2026 (2.1763).
  - Taux moyen régional : Wallonie ~33.75%, Flandre ~39.70%, Bruxelles ~27.00%.
  - Affichage du coût annuel dans le récapitulatif des frais.
  - Intégration dans le comparatif Acheter vs. Louer (coût mensuel).

### 5. Outil d'Équivalence Régionale (Onglet dédié)
- [x] Créer un onglet "Équivalence Régionale" séparé du simulateur principal :
  - Régions couvertes : **Bruxelles**, **Brabant Wallon**, **Brabant Flamand**.
  - Profils types : Studio, Appartement standard, Maison familiale.
  - Calcul du **Price-to-Rent Ratio** avec jauge visuelle et conseil.
  - Comparaison des flux mensuels côte à côte (achat vs. location).
  - Prix et loyers éditables pour affiner l'estimation.

---

## 🔲 Phase 3 : Améliorations Futures (Backlog)

### 6. Calculateur de Taux d'Endettement (Debt-to-Income Ratio)
- [x] Ajouter un encadré "Capacité d'Emprunt" dans les paramètres du simulateur :
  - Saisie du **revenu net mensuel du foyer** (€/mois).
  - Calcul automatique du **taux d'endettement** : `(mensualité + charges + précompte) / revenu net × 100`.
  - Affichage avec indicateur coloré :
    - 🟢 < 33% : Acceptable pour la plupart des banques belges.
    - 🟡 33–40% : Zone de vigilance.
    - 🔴 > 40% : Au-dessus de la norme bancaire standard.
  - Note : les banques belges appliquent souvent un seuil de 40–45% (DSTI).


### 7. Simulation de Remboursement Anticipé (Early Repayment)
- [ ] Permettre de simuler l'impact de versements supplémentaires sur le prêt :
  - **Mode 1 — Mensualité supplémentaire** : payer X € de plus par mois → affiche la réduction de durée et d'intérêts.
  - **Mode 2 — Capital ponctuel** : rembourser un capital à une date donnée (ex: héritage, prime) → recalcul du tableau d'amortissement.
  - Affichage du gain total en intérêts économisés et de la nouvelle durée.
  - Note : en Belgique, l'indemnité de remploi est plafonnée à 3 mois d'intérêts.

### 8. Paramètres Configurables dans l'Outil d'Équivalence
- [ ] Rendre l'outil d'équivalence plus flexible :
  - Permettre de choisir la **quotité LTV** (actuellement fixée à 80%).
  - Permettre de choisir le **taux d'intérêt** et la **durée du prêt** (actuellement fixés à 3.41% / 25 ans).
  - Ajouter un curseur pour la **mise de fonds propres**.

### 9. Tooltips et Aide Contextuelle
- [ ] Ajouter des icônes `ℹ️` avec tooltips au survol sur les termes techniques :
  - Exemples : "Revenu Cadastral", "TAEG", "Inscription Hypothécaire", "Taux d'Endettement".
  - Permettre à l'utilisateur de comprendre les concepts sans quitter l'application.

### 10. Page de Résumé Imprimable (Print / PDF)
- [ ] Améliorer la fonction d'impression :
  - Générer une mise en page optimisée pour l'impression / export PDF.
  - Récapitulatif sur une page : paramètres du projet, mensualité, tableau des frais, résultat Acheter vs. Louer.
  - Inclure la date de simulation et un avertissement "estimation non contractuelle".
