# Modèle de données — cycle D2, capacités et verticales

*Les quarante-sept tables des quatre schémas, colonne par colonne. Le contrat que chaque fichier honore est [conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md) du cycle D1, **repris intégralement et jamais reformulé**. Les décisions et leurs motifs sont dans [research.md](./research.md).*

**47 tables · 4 fichiers · 4 schémas · dont 6 provisions.** Le modèle complet passe ainsi à **118 tables, 15 fichiers, 14 schémas, 20 provisions**.

---

## Ce qui est repris du cycle D1 sans être redit

**Les deux troncs communs.** Toute table qu'un terminal alimente (classes A, B, D) porte `id` (UUID **sans `DEFAULT`**), `tenant_id` (`UUID NOT NULL`), `horodatage_client` (`TIMESTAMPTZ NULL`, **indicatif**) et `cree_le` (`TIMESTAMPTZ NOT NULL DEFAULT now()`, **autorité serveur**). Toute table de classe C porte `id`, `tenant_id`, `cree_le` et `modifie_le` — **jamais `horodatage_client`**.

**Les trois éléments RLS**, dans leur forme littérale unique : `ENABLE` **et** `FORCE`, `isolation_tenant` en `USING` **et** `WITH CHECK` avec le second argument `true`, et `administration_editeur FOR ALL TO kaya_owner` **posée à la création**. P-01 ne cherche qu'une forme ; les tableaux ci-dessous ne la répètent pas.

**Les domaines partagés** : `montant_mineur` (`BIGINT`), `code_devise` (`CHAR(3)`), `quantite` (`NUMERIC`). **Aucun flottant, aucune quantité entière.**

**Les colonnes du tableau** : Table · Classe · Story · Colonnes propres · Contraintes nommées · `GRANT` à `kaya_app` · Index. Une colonne suivie de *(nu)* est un **rattachement inter-modules sans `REFERENCES`**, commenté comme tel dans le fichier.

---

## `96-stocks.sql` — schéma `stocks`, capacité `capacites/stocks`

> **En-tête du fichier** : le stock est une **capacité, pas un module** (ETB-02b). Seul le profil `SIMPLE` est implémenté ; `VALORISE` et `DETAILLE` sont déclarés au socle et **refusés explicitement**. Ce schéma ne couvre **pas** la valorisation, les commandes fournisseurs, les lots ni les dates limites.

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `point_de_stock` | **C · C2** | STK-01 | `etablissement_id` *(nu)*, `nom`, `type`, `actif` | `uq_point_de_stock_nom` (par établissement) | `SELECT, INSERT, UPDATE` | `ix_point_de_stock_etab` — *liste des points de stock d'un établissement (STK-01)* |
| `article_stock` | **C · C2** | STK-01 | `etablissement_id` *(nu)*, `nom`, `unite_mesure` (**NOT NULL**, défaut `'unite'`), `seuil_alerte` (`quantite`), `actif` | `uq_article_stock_nom` (par établissement) | `SELECT, INSERT, UPDATE` | `ix_article_stock_etab` — *catalogue de stock d'un établissement (STK-01)* |
| `article_stock_catalogue` | **C · C2** | STK-01 | `article_stock_id`, `article_id` *(nu — `ventes`)*, `quantite_consommee` (`quantite`) | `fk_article_stock_catalogue_article_stock` · `uq_article_stock_catalogue` (`article_id`, `article_stock_id`) | `SELECT, INSERT, UPDATE` | `ix_article_stock_catalogue_article` — *décrément sur vente : de l'article vendu vers l'article de stock (STK-02)* |
| `mouvement_stock` | **B · B3** | STK-02 | `article_stock_id`, `point_de_stock_id`, `type`, `quantite` (`quantite`), `cout_unitaire` (`montant_mineur`, **NULL, PROVISION**), `code_devise` (nullable), `origine_type`, `origine_id` *(nu)*, `motif` | `fk_mouvement_stock_article` · `fk_mouvement_stock_point` · `ck_mouvement_stock_type` · `ck_mouvement_stock_quantite_non_nulle` | **`SELECT, INSERT`** — *privilège plus strict que la classe : une correction est une contre-passation* | `ix_mouvement_stock_article_date` — *historique d'un article (STK-02)* · `ix_mouvement_stock_point_date` — *journal d'un point de stock (STK-02)* |
| `inventaire` | **B · B3** | STK-03 | `point_de_stock_id`, `etat`, `debute_le`, `cloture_le`, `realise_par_compte_id` *(nu)* | `fk_inventaire_point` · `ck_inventaire_etat` | **`SELECT, INSERT`** — *même régime* | `ix_inventaire_point_date` — *dernier inventaire d'un point de stock (STK-03)* |
| ★ `ligne_inventaire` | **B · B3** | STK-03 | `inventaire_id`, `article_stock_id`, `quantite_theorique` (`quantite`), `quantite_comptee` (`quantite`), `ecart` (`quantite`), `motif_ecart` | `fk_ligne_inventaire_inventaire` · `fk_ligne_inventaire_article` · `uq_ligne_inventaire_article` (par inventaire) | **`SELECT, INSERT`** | `ix_ligne_inventaire_inventaire` — *saisie et écarts d'un inventaire (STK-03)* |
| `alerte_seuil` | **A · A4** | STK-04 | `article_stock_id`, `point_de_stock_id`, `quantite_constatee` (`quantite`), `seuil` (`quantite`), `declenchee_le` | `fk_alerte_seuil_article` · `fk_alerte_seuil_point` | `SELECT, INSERT` | `ix_alerte_seuil_article_date` — *alertes récentes d'un article (STK-04)* |

**7 tables.** `cout_unitaire` est la **provision-colonne** de l'amendement A4 : nullable, **jamais renseignée au MVP**, et son commentaire de colonne le dit — sans elle, aucune valorisation rétroactive ne serait possible et le profil `VALORISE` exigerait de recréer tout l'historique.

> **`mouvement_stock` et `inventaire` sont de classe B, avec un privilège plus strict** ([D-24](./research.md)). La décision O-02 n'est pas tranchée par ce cycle ; jusqu'à son arbitrage, la classe inscrite au registre s'applique. Le commentaire d'en-tête déclare la classe **et** dit pourquoi le privilège va au-delà.

---

## `55-ventes.sql` — schéma `ventes`, module `socle/ventes`

> **En-tête du fichier** : le tronc commun de la vente vit ici, **pas dans une verticale** — catalogue, commande, ligne, envoi, remise, division. `verticales/restauration` et `verticales/bar` sont des **coquilles vides** : il n'existe ni schéma `restauration`, ni schéma `bar`, et ce n'est pas un oubli (registre §8). Ce schéma ne connaît **ni chambre, ni séjour** : la cible de facturation `SEJOUR` est une **valeur opaque**, résolue par un trait exposé.

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `categorie_article` | **C · C2** | PDV-01 | `point_de_vente_id` *(nu)*, `nom`, `ordre` | `uq_categorie_article_nom` (par point de vente) | `SELECT, INSERT, UPDATE` | `ix_categorie_article_pdv` — *catalogue ordonné d'un point de vente (PDV-01)* |
| `destination_preparation` | **C · C2** | PDV-04 | `etablissement_id` *(nu)*, `nom`, `actif` | `uq_destination_preparation_nom` (par établissement) | `SELECT, INSERT, UPDATE` | `ix_destination_preparation_etab` — *destinations d'un établissement (PDV-04)* |
| `article` | **C · C2** | PDV-01 | `point_de_vente_id` *(nu)*, `categorie_article_id`, `destination_preparation_id` (**NULL** — repli), `nom`, `prix` (`montant_mineur`), `code_devise`, `taux_tva`, `disponible`, `suivi_stock`, `unite_mesure` (**NOT NULL**, défaut `'unite'`), `code_barre` (**NULL, PROVISION**), `article_parent_id` (**NULL, PROVISION**) | `fk_article_categorie` · `fk_article_destination` · `fk_article_parent` · `uq_article_nom` (par point de vente) · `ck_article_taux_tva` | `SELECT, INSERT, UPDATE` | `ix_article_pdv_categorie` — *catalogue d'un point de vente par catégorie (PDV-01)* · `ix_article_code_barre` (partiel, non nul) — *lecture code-barre, profil `DETAILLE* (A5)* |
| `conversion_unite_mesure` **(PROVISION)** | **C · C2** | PDV-01 | `unite_source`, `unite_cible`, `facteur` (`quantite`) | `uq_conversion_unite_mesure` (`unite_source`, `unite_cible`) | **aucun** — *pas même `SELECT` (A3)* | — |
| `commande` | **A · A4** *(ouverture, réception QR)* · **B · B3** *(validation QR, addition de table)* | PDV-02, PDV-03, QRC-03 | `point_de_vente_id` *(nu)*, `cible_type`, `cible_id` *(nu)*, `etat`, `reference_retrait` (nullable), `jeton_table_id` (nullable), `ouverte_le`, `fermee_le`, `ouverte_par_compte_id` *(nu)* | `fk_commande_jeton_table` · `ck_commande_etat` — **aucune contrainte sur `cible_type`** | `SELECT, INSERT, UPDATE` | `ix_commande_pdv_etat` — *commandes ouvertes d'un point de vente (PDV-02)* · `ix_commande_cible` — *addition d'une table, note d'un séjour (PDV-02)* · `uq_commande_reference_retrait` (partiel, non nul) — *unicité de la référence à emporter (PDV-02)* |
| `ligne_commande` | **A · A4** *(saisie, modification avant envoi)* · **B · B3** *(annulation après envoi)* | PDV-03 | `commande_id`, `article_id`, `quantite` (`quantite`), `prix_unitaire` (`montant_mineur`, **verrouillé à la création**), `code_devise`, `taux_tva`, `commentaire`, `etat`, `lot_envoi_id` (nullable), `motif_annulation`, `annulee_par_compte_id` *(nu)* | `fk_ligne_commande_commande` · `fk_ligne_commande_article` · `fk_ligne_commande_lot` · `ck_ligne_commande_etat` · `ck_ligne_commande_quantite_positive` · `ck_ligne_commande_motif_si_annulee` | `SELECT, INSERT, UPDATE` — *les **deux** classes sont au commentaire d'en-tête* | `ix_ligne_commande_commande` — *lignes d'une addition (PDV-03)* · `ix_ligne_commande_lot` — *bon de préparation d'un lot (PDV-04)* |
| `lot_envoi` | **A · A4** | PDV-04 | `commande_id`, `destination_preparation_id`, `numero_lot`, `envoye_le`, `envoye_par_compte_id` *(nu)* | `fk_lot_envoi_commande` · `fk_lot_envoi_destination` · `uq_lot_envoi_numero` (par commande) | **`SELECT, INSERT`** — **immuable par privilège** | `ix_lot_envoi_destination_date` — *écran de préparation par destination, par ancienneté (PDV-07)* |
| `remise` | **B · B3** | PDV-03 | `commande_id`, `ligne_commande_id` (nullable), `type`, `valeur`, `montant_applique` (`montant_mineur`), `code_devise`, `motif`, `autorise_par_compte_id` *(nu)* | `fk_remise_commande` · `fk_remise_ligne` · `ck_remise_type` · `ck_remise_motif_obligatoire` | `SELECT, INSERT, UPDATE` | `ix_remise_commande` — *remises d'une addition (PDV-03)* |
| `part_addition` | **B · B3** | PDV-05 | `commande_id`, `mode_division`, `montant` (`montant_mineur`), `code_devise`, `cible_type`, `cible_id` *(nu)*, `reglee_le` | `fk_part_addition_commande` · `ck_part_addition_mode` — **aucune contrainte sur `cible_type`** | `SELECT, INSERT, UPDATE` | `ix_part_addition_commande` — *parts d'une addition divisée (PDV-05)* |
| `numerotation_reference` | **B · B3** | PDV-02 | `etablissement_id` *(nu)*, `portee`, `dernier_numero` | `uq_numerotation_reference_portee` | `SELECT, INSERT, UPDATE` | — *(l'unicité sert le verrou de ligne)* |
| `jeton_table` | **C · C2** | QRC-01 | `table_pdv_id` *(nu)*, `empreinte_jeton`, `emis_le`, `revoque_le` (nullable) | `uq_jeton_table_empreinte` | `SELECT, INSERT, UPDATE` | `ix_jeton_table_pdv` — *jetons actifs d'une table, révocation (QRC-01)* |

**11 tables, dont 1 provision.**

> **Aucune contrainte `CHECK` n'énumère les valeurs de `cible_type`, et c'est le socle qui l'a tranché.** `caisse.encaissement` porte `ck_encaissement_mode` — le mode de règlement décide de la classe hors-ligne — mais **laisse `cible_type` libre** ; `documents.document_operationnel` fait de même. Énumérer ici obligerait `ventes`, qui est du **socle**, à **nommer `SEJOUR` dans une contrainte de base** : la valeur circule, mais elle reste **opaque**, et le routage de facturation est fermé par le code de la phase 3, pas par le schéma. Une `CHECK` imposerait en outre une migration au premier module d'activité nouveau.
>
> **`numerotation_reference` est un compteur en table à verrou de ligne, jamais une `SEQUENCE`** — une `SEQUENCE` n'est pas transactionnelle, et un trou dans une référence de retrait est une commande dont personne ne sait si elle a existé ([D-05](../001-modele-donnees-socle/research.md)).
>
> **Le prix est verrouillé à la création de la ligne** : `ligne_commande.prix_unitaire` est une **copie**, jamais une lecture différée de `article.prix`. Une modification de tarif ne modifie aucune commande existante (PDV-01).
>
> **`lot_envoi` est immuable ; sa composition l'est par conséquence, pas par privilège** ([D-20](./research.md)). `ligne_commande` a besoin d'`UPDATE` pour son annulation de classe B ; la règle « `lot_envoi_id` ne s'écrit qu'une fois » est **une règle de service de la phase 3**, écrite au contrat, et le commentaire d'en-tête le dit plutôt que de laisser croire à une garantie de la base.

---

## `97-hebergement.sql` — schéma `hebergement`, verticale `verticales/hebergement`

> **En-tête du fichier** : tout le spécifique hôtelier vit ici et **nulle part ailleurs** (constitution, principe 2). La salle de réunion est une **unité d'une catégorie dédiée**, pas une entité nouvelle. Le **statut d'occupation d'une unité est dérivé** des occupations et n'a **aucune colonne**.

### Référentiel

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `categorie` | **C · C2** | HEB-01 | `etablissement_id` *(nu)*, `nom`, `capacite_accueil`, `ordre`, `actif` | `uq_categorie_nom` (par établissement) | `SELECT, INSERT, UPDATE` | `ix_categorie_etab` — *catégories d'un établissement (HEB-01)* |
| `unite` | **C · C2** *(référentiel)* · **A · A4** *(statut ménage — dernier-écrit-gagne, seul cas du produit)* | HEB-01, HEB-06 | `categorie_id`, `code`, `etage`, `statut_menage`, `actif` | `fk_unite_categorie` · `uq_unite_code` (par établissement) · `ck_unite_statut_menage` | `SELECT, INSERT, UPDATE` | `ix_unite_categorie` — *unités d'une catégorie, **support de la recherche de disponibilité** (HEB-02, SEJ-02)* · `ix_unite_statut_menage` — *unités à nettoyer du jour (HEB-06, RSV-02)* |
| `formule` | **C · C2** | HEB-03 | `categorie_id`, `type`, `prix_base` (`montant_mineur`), `code_devise`, `duree_min_minutes`, `duree_max_minutes`, `heure_arrivee_standard`, `heure_depart_standard`, `jours_autorises`, **`assujettie_taxe_nuitee`**, **`regle_conversion_taxe`**, `actif` | `fk_formule_categorie` · `ck_formule_type` · `ck_formule_duree_coherente` | `SELECT, INSERT, UPDATE` | `ix_formule_categorie` — *formules proposées pour une catégorie (HEB-03)* |
| `temps_remise_en_etat` | **C · C2** | HEB-01, HEB-02 | `categorie_id`, `formule_id`, `duree_minutes` | `fk_temps_remise_categorie` · `fk_temps_remise_formule` · **`uq_temps_remise_categorie_formule`** · `ck_temps_remise_duree_positive` | `SELECT, INSERT, UPDATE` | — *(l'unicité sert la résolution)* |
| `bareme_palier` | **C · C2** | HEB-04 | `formule_id`, `duree_minutes`, `prix` (`montant_mineur`), `code_devise`, `est_heure_supplementaire` | `fk_bareme_palier_formule` · `uq_bareme_palier_duree` (par formule) | `SELECT, INSERT, UPDATE` | `ix_bareme_palier_formule` — *barème ordonné d'une formule de passage (HEB-04)* |
| `plage_demi_journee` | **C · C2** | HEB-05 | `formule_id`, `libelle`, `heure_debut`, `heure_fin` | `fk_plage_demi_journee_formule` · `ck_plage_demi_journee_ordre` | `SELECT, INSERT, UPDATE` | `ix_plage_demi_journee_formule` — *plages d'une formule demi-journée (HEB-05)* |
| `calendrier_tarifaire` | **C · C2** | HEB-07 | `formule_id`, `date_effet`, `date_fin` (nullable), `prix` (`montant_mineur`), `code_devise`, `priorite` | `fk_calendrier_tarifaire_formule` · `ck_calendrier_tarifaire_periode` | `SELECT, INSERT, UPDATE` | `ix_calendrier_tarifaire_formule_date` — *tarif applicable à une date (HEB-07)* |

> **`temps_remise_en_etat` est une table dont l'unicité porte sur le couple catégorie + formule.** La durée varie par l'une **et** par l'autre — 30 min en passage, 2 h en nuitée, 1 h en demi-journée sur la même catégorie —, ce qu'une colonne ne porte pas (registre §7.1, `docs/user-stories-v1.md` note « quatre valeurs HEB »).
>
> **`assujettie_taxe_nuitee` et `regle_conversion_taxe` sont des paramètres, jamais des constantes.** Le traitement fiscal du passage et de la demi-journée n'est pas arrêté (cadrage §5.5, décision B-02) et **peut différer par commune**. Le calcul, lui, ne vit **que** dans le `JurisdictionAdapter` de la phase 3 : cette table porte des **entrées**, pas une règle.
>
> **Le seuil de bascule passage → nuitée n'est pas ici** : c'est la clé de catalogue `seuil_bascule_nuitee_minutes`, de portée établissement, créée au cycle D1 — comme `heure_arrivee_standard` et `heure_depart_standard`, dont les colonnes de `formule` ne portent que la **surcharge par formule**.

### Disponibilité — le cœur du produit

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `occupation` | **B · B3** | HEB-02, HEB-06 | `unite_id`, `motif`, **`periode` (`tstzrange`)**, **`periode_indisponibilite` (`tstzrange`)**, `statut`, `origine_type`, `origine_id` | `fk_occupation_unite` · `ck_occupation_motif` · `ck_occupation_statut` · **`ck_occupation_periode_incluse`** (`periode` contenue dans `periode_indisponibilite`) · **`ex_occupation_unite_periode`** — `EXCLUDE USING gist (unite_id WITH =, periode_indisponibilite WITH &&) WHERE (statut <> 'ANNULEE')` | `SELECT, INSERT, UPDATE` | *(l'index GiST de la contrainte d'exclusion sert les recherches de chevauchement — **aucun index de plus**)* · `ix_occupation_origine` — *retrouver l'occupation d'un séjour ou d'une réservation (SEJ-04, RSV-04)* |

**C'est la table la plus structurante du produit**, et trois propriétés en font le tour :

1. **Un `tstzrange`, jamais une paire de dates.** Le marché pratique massivement le passage horaire et la demi-journée (cadrage §5.1). Ce choix est **irréversible** : le rattraper coûterait la migration de toutes les occupations.
2. **Deux périodes, une seule contrainte** ([D-15](./research.md)). `periode` est ce que le client occupe et ce qui se facture ; `periode_indisponibilite` l'englobe **avec le temps de remise en état**, et c'est elle que la contrainte d'exclusion protège. Une période unique facturerait le ménage, ou attribuerait une unité encore sale.
3. **La contrainte est partielle** ([D-16](./research.md)). Sans le `WHERE`, toute annulation rendrait l'unité **définitivement inlouable** sur son intervalle — et l'annulation, le no-show et le départ anticipé sont trois chemins nominaux.

**La mise hors service d'une unité est une occupation de motif `MAINTENANCE`** ([D-17](./research.md)), et non une colonne de `unite` : un seul mécanisme de disponibilité, jamais deux. Elle bénéficie ainsi **gratuitement** de la contrainte — on ne met pas en maintenance une unité occupée, on n'attribue pas une unité en maintenance.

> **La contrainte d'exclusion se pose à la CRÉATION de la table.** Ajoutée après coup, elle échoue sur les données existantes — piège consigné par le cycle D1 dans `00-conventions.sql`, et **ce cycle est le premier à le rencontrer pour de vrai**.

### Séjour

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `client` | **C · C2** | SEJ-01 | `personne_id` *(nu — `comptes`)*, `nationalite`, `adresse`, `categorie_commerciale`, `note_interne` — **aucun `etablissement_id`** | `uq_client_personne` (par tenant) | `SELECT, INSERT, UPDATE` | `ix_client_personne` — *retrouver le client depuis la personne trouvée par SC-009 (SEJ-01)* |
| `preference_personne` | **A · A4** | SEJ-01 | `personne_id` *(nu — `comptes`)*, `type`, `valeur` | — | `SELECT, INSERT` | `ix_preference_personne_personne` — *préférences à l'arrivée (SEJ-01, SEJ-02)* |
| `sejour` | **B · B3** | SEJ-02, SEJ-04 | `etablissement_id` *(nu)*, `client_id` (nullable), `unite_id`, `formule_id`, `occupation_id`, `reservation_id` (nullable), `etat`, `arrive_le`, `parti_le` | `fk_sejour_client` · `fk_sejour_unite` · `fk_sejour_formule` · `fk_sejour_occupation` · `fk_sejour_reservation` · `ck_sejour_etat` | `SELECT, INSERT, UPDATE` | `ix_sejour_etab_etat` — *séjours en cours d'un établissement (SEJ-02)* · `ix_sejour_client` — *historique des séjours d'un client (SEJ-01)* · `ix_sejour_unite_arrivee` — *occupant courant d'une unité (HEB-06)* |
| `accompagnant` | **A · A4** | SEJ-02 | `sejour_id`, `nom`, `prenoms`, `type_piece`, `numero_piece`, `est_mineur` | `fk_accompagnant_sejour` | `SELECT, INSERT` | `ix_accompagnant_sejour` — *accompagnants d'un séjour, base du calcul de taxe (SEJ-02, FIS-03)* |
| `note_sejour` | **B · B3** | SEJ-02, SEJ-04 | `sejour_id`, `etat`, `arretee_le`, `total_provisoire` (`montant_mineur`), `code_devise` | `fk_note_sejour_sejour` · `uq_note_sejour_sejour` · `ck_note_sejour_etat` | `SELECT, INSERT, UPDATE` | — *(l'unicité suffit : une note par séjour)* |
| `ligne_sejour` | **B · B3** — *ou **classe de la ligne d'origine** quand elle vient d'un point de vente* | SEJ-03 | `note_sejour_id`, `type`, `libelle`, `quantite` (`quantite`), `prix_unitaire` (`montant_mineur`), `code_devise`, `taux_tva`, **`ligne_commande_id` *(nu — SAGA `ventes` → `hebergement`)***, `sejour_origine_id` (nullable — transfert de charges), `bon_depot_id` *(nu — `pressing`)* | `fk_ligne_sejour_note` · `fk_ligne_sejour_sejour_origine` · `ck_ligne_sejour_type` | `SELECT, INSERT, UPDATE` | `ix_ligne_sejour_note` — *note en temps réel, total provisoire instantané (SEJ-03)* · **`uq_ligne_sejour_ligne_commande`** — index **UNIQUE** partiel sur la colonne non nulle : *l'idempotence du report est portée par une **contrainte**, jamais par du code (PDV-02)* · **`uq_ligne_sejour_bon_depot`** — idem pour le report du pressing |
| `fiche_police` | **B · B3** | SEJ-02 | `sejour_id`, `numero`, `complete`, `emise_le`, `contenu` (`JSONB`) | `fk_fiche_police_sejour` · `uq_fiche_police_numero` (par établissement et année) | `SELECT, INSERT, UPDATE` | `ix_fiche_police_sejour` — *fiche d'un séjour (SEJ-02)* |
| `numerotation_fiche_police` | **B · B3** | SEJ-02 | `etablissement_id` *(nu)*, `annee`, `dernier_numero` | `uq_numerotation_fiche_police_portee` | `SELECT, INSERT, UPDATE` | — *(l'unicité sert le verrou de ligne)* |
| `taxe_sejour_constat` | **B · B3** | SEJ-04 | `sejour_id`, `nuitees_assujetties`, `nombre_personnes`, `montant_unitaire` (`montant_mineur`), `montant_total` (`montant_mineur`), `code_devise`, `regle_appliquee`, `constate_le` | `fk_taxe_sejour_constat_sejour` · `uq_taxe_sejour_constat_sejour` | **`SELECT, INSERT`** — **immuable par privilège : le constat est figé au départ** | `ix_taxe_sejour_constat_date` — *état de reversement communal par période (FIS-08)* |

> **`client` ne duplique aucune donnée d'identité** ([D-18](./research.md)). Nom, téléphone, type et numéro de pièce vivent sur `comptes.personne`, qui porte l'index de SC-009 **et** `piece_capturee_le`, la colonne de la purge ARTCI TRX-06. Les dupliquer donnerait **deux cibles à la purge**, et une purge qui en oublie une est une non-conformité.
>
> **`client` ne porte AUCUN `etablissement_id`, et c'est SEJ-01 qui l'impose** : la fiche est *« rattachée au tenant, **partagée entre ses établissements** »* (registre §7.3). Une colonne d'établissement la rattacherait à un seul et contredirait `uq_client_personne`, unique **par tenant**. Un établissement retrouve « ses » clients **par ses séjours** — `sejour.etablissement_id` —, ce qui est exactement ce que « partagée » veut dire. L'isolation reste portée par `tenant_id`, comme sur toute table du modèle.
>
> **`ligne_sejour.ligne_commande_id` est la première des deux sagas.** Aucun `REFERENCES` : `ventes` et `hebergement` sont deux modules, et une clé étrangère **ferait échouer en base l'écriture orpheline** que le produit doit accepter puis réconcilier. Voir [contracts/sagas-inter-modules.md](./contracts/sagas-inter-modules.md).
>
> **L'idempotence du report est portée par un index UNIQUE partiel, jamais par une lecture préalable.** Un index ordinaire retrouverait le doublon ; il ne le **refuserait** pas — et un événement rejoué après coupure produirait une **seconde ligne sur la note**, donc une double facturation découverte au départ du client. La forme est celle du socle : *« l'idempotence est portée par une contrainte, pas par du code »* (`uq_evenement_metrique_id`, cycle D1). Le service de la phase 3 **insère et traite le conflit `23505`** — il ne lit pas avant d'écrire, exactement comme pour la contrainte d'exclusion.
>
> **`taxe_sejour_constat` fige le constat du départ.** Le calcul est celui du `JurisdictionAdapter` ; cette table en est la **trace figée**, avec la règle appliquée — sans quoi un changement de paramétrage réécrirait rétroactivement des taxes déjà déclarées.

### Réservation

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `reservation` | **B · B3** | RSV-01, RSV-04 | `etablissement_id` *(nu)*, `client_id`, `categorie_id`, `unite_id` (nullable), `formule_id`, `occupation_id` (nullable), `statut`, `expire_le`, `annulee_le`, `motif_annulation` | `fk_reservation_client` · `fk_reservation_categorie` · `fk_reservation_unite` · `fk_reservation_formule` · `fk_reservation_occupation` · `ck_reservation_statut` | `SELECT, INSERT, UPDATE` | `ix_reservation_etab_statut` — *réservations à honorer, provisoires à expirer (RSV-01)* · `ix_reservation_client` — *réservations d'un client (RSV-01)* |
| `arrhes` | **B · B3** *(espèces, virement)* · **D · D1** *(Mobile Money, carte)* | RSV-03 | `reservation_id`, `encaissement_id` *(nu — `caisse`)*, `montant` (`montant_mineur`), `code_devise`, `impute_le`, `restitue_le` | `fk_arrhes_reservation` | `SELECT, INSERT, UPDATE` | `ix_arrhes_reservation` — *arrhes à imputer au check-in (RSV-03, RSV-05)* |

> **`arrhes` porte la classe de son mode de règlement** (registre §7.4). L'encaissement lui-même vit dans `caisse` (socle) ; cette table porte l'**imputation** — ce qui a été versé, sur quelle réservation, et ce qu'il en advient au check-in ou à l'annulation. Le commentaire d'en-tête déclare les **deux** classes.
>
> **La politique d'annulation et le délai d'expiration d'une provisoire ne sont pas ici** : ce sont des **clés du catalogue** de configuration, de portée établissement (RSV-01, RSV-03, récapitulatif des paramètres).

### Maintenance

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `incident_maintenance` | **A · A4** | registre §7.5 | `unite_id`, `signale_par_compte_id` *(nu)*, `description`, `gravite`, `signale_le` | `fk_incident_maintenance_unite` · `ck_incident_gravite` | `SELECT, INSERT` | `ix_incident_maintenance_unite_date` — *incidents ouverts d'une unité (HEB-06)* |
| `intervention` | **A · A4** | registre §7.5 | `incident_maintenance_id`, `occupation_id` (nullable), `compte_rendu`, `intervenant`, `realisee_le` | `fk_intervention_incident` · `fk_intervention_occupation` | `SELECT, INSERT` | `ix_intervention_incident` — *comptes rendus d'un incident (HEB-06)* |

> **`intervention.occupation_id` relie l'intervention à la mise hors service qui l'accompagne**, quand il y en a une. C'est une clé étrangère **interne au schéma** — normale et souhaitable.

### Provisions

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` |
|---|---|---|---|---|---|
| `prestation_incluse` **(PROVISION)** | **C · C2** | HEB-09 | `formule_id`, `type`, `quantite` (`quantite`), `valeur_unitaire_plafond` (`montant_mineur`), `code_devise` | `fk_prestation_incluse_formule` | `SELECT` |
| `contrat_location` **(PROVISION)** | **C · C2** | HEB-08 | `client_id`, `unite_id`, `date_debut`, `date_fin`, `loyer` (`montant_mineur`), `code_devise`, `periodicite` | `fk_contrat_location_client` · `fk_contrat_location_unite` | `SELECT` |
| `caution` **(PROVISION)** | **C · C2** | HEB-08 | `contrat_location_id`, `montant` (`montant_mineur`), `code_devise`, `versee_le`, `restituee_le` | `fk_caution_contrat` | `SELECT` |
| `charge_locative` **(PROVISION)** | **C · C2** | HEB-08 | `contrat_location_id`, `type`, `montant` (`montant_mineur`), `code_devise`, `periode_debut`, `periode_fin` | `fk_charge_locative_contrat` | `SELECT` |
| `etat_des_lieux` **(PROVISION)** | **C · C2** | HEB-08 | `contrat_location_id`, `type`, `constat` (`JSONB`), `realise_le` | `fk_etat_des_lieux_contrat` · `ck_etat_des_lieux_type` | `SELECT` |

**26 tables, dont 5 provisions.** Chacune porte la mention littérale **« PROVISION — tables seulement, aucune logique au MVP »**.

> **Le décompte d'une prestation incluse n'a pas de table** (registre §10, incrément 2). La prestation existe ; sa consommation n'a aucune story au MVP, et une table qu'aucune story n'écrit se remplit un jour de ce qui traîne.

---

## `98-pressing.sql` — schéma `pressing`, verticale `verticales/pressing`

> **En-tête du fichier** : le pressing n'est pas une vente immédiate — il y a **dépôt, délai, retrait**. Le tronc commun de la vente est dans `ventes` ; ce schéma ne garde que ce qui lui est propre. **Il ne suppose jamais que l'établissement possède de l'hébergement** : un pressing seul est un établissement valide.

| Table | Classe | Story | Colonnes propres | Contraintes nommées | `GRANT` | Index |
|---|---|---|---|---|---|---|
| `bon_depot` | **B · B3** *(création, transition `pret → retire`)* · **A · A4** *(transitions `depose → en_traitement → pret`)* | PDV-06 | `point_de_vente_id` *(nu)*, `personne_id` *(nu — `comptes`, nullable)*, **`sejour_id` *(nu — SAGA `pressing` → `hebergement`, nullable)***, `numero_retrait`, `etat`, **`moment_reglement`** *(résolu à la création puis **FIGÉ**)*, `date_retrait_promise`, `retire_le`, `montant_total` (`montant_mineur`), `code_devise` | `uq_bon_depot_numero` (par établissement et période) · `ck_bon_depot_etat` · `ck_bon_depot_moment_reglement` | `SELECT, INSERT, UPDATE` — *les **deux** classes sont au commentaire d'en-tête* | `ix_bon_depot_etat_date` — *bons prêts, bons en retard (PDV-06)* · `ix_bon_depot_sejour` (partiel, non nul) — *bons rattachés à un séjour, **et leur cas orphelin** (PDV-06)* · `ix_bon_depot_personne` (partiel, non nul) — *retrouver les bons d'un client extérieur (PDV-06)* |
| `piece_deposee` | **A · A4** | PDV-06 | `bon_depot_id`, `designation`, `quantite` (`quantite`), `etat_constate`, `prix_unitaire` (`montant_mineur`), `code_devise` | `fk_piece_deposee_bon` | `SELECT, INSERT` | `ix_piece_deposee_bon` — *pièces d'un bon (PDV-06)* |
| `numerotation_retrait` | **B · B3** | PDV-06 | `etablissement_id` *(nu)*, `portee`, `dernier_numero` | `uq_numerotation_retrait_portee` | `SELECT, INSERT, UPDATE` | — *(l'unicité sert le verrou de ligne)* |

**3 tables.**

> **`bon_depot.personne_id` pointe sur `comptes.personne`, jamais sur `hebergement.client`** ([D-28](./research.md)). `verticales/pressing` ne peut dépendre que de `socle/` et de `capacites/` — jamais d'une autre verticale. Un pressing seul est un établissement valide, et le modèle ne doit pas supposer le contraire.
>
> **`bon_depot.sejour_id` est la seconde saga.** Nullable et nue : le rattachement à un séjour n'existe que si le module hébergement est actif **et** que le client est logé. Voir [contracts/sagas-inter-modules.md](./contracts/sagas-inter-modules.md).
>
> **`moment_reglement` est résolu à la création du bon, puis figé.** Le paramètre `pressing.moment_reglement` a pour portée la plus basse le point de vente ; le changer **ne déplace pas l'exigibilité d'un bon déjà pris**. Une lecture différée du paramètre au retrait ferait exactement l'inverse, silencieusement.
>
> **`numerotation_retrait` est un compteur en table à verrou de ligne, jamais une `SEQUENCE`** — *un trou est une pièce de linge dont personne ne sait si elle a existé* (registre §8.4).

---

## Récapitulatif — ce que le cycle ajoute

> **Convention de comptage, écrite parce qu'elle n'est pas devinable** : une table à **double classe compte dans les DEUX colonnes**. La somme des colonnes de classe dépasse donc le nombre de tables, exactement du nombre de doubles classes — et c'est ce qui rend le tableau vérifiable ligne à ligne. Compter une double classe une seule fois obligerait à choisir laquelle, et ce choix se ferait deux fois différemment.

| Fichier | Schéma | Tables | Provisions | Classe A | Classe B | Classe C | Classe D | Doubles classes |
|---|---|---|---|---|---|---|---|---|
| `55-ventes.sql` | `ventes` | 11 | 1 | 3 | 5 | 5 | — | `commande` (A/B) · `ligne_commande` (A/B) |
| `96-stocks.sql` | `stocks` | 7 | — | 1 | 3 | 3 | — | — |
| `97-hebergement.sql` | `hebergement` | 26 | 5 | 5 | 9 | 13 | 1 | `unite` (C/A) · `arrhes` (B/D) · `ligne_sejour` (B / classe d'origine) |
| `98-pressing.sql` | `pressing` | 3 | — | 2 | 2 | — | — | `bon_depot` (B/A) |
| | **Total D2** | **47** | **6** | **11** | **19** | **21** | **1** | **6** |

*Contrôle : 11 + 19 + 21 + 1 = 52 = 47 tables + 5 doubles classes portant deux valeurs fixes. `ligne_sejour` est la sixième double classe, mais sa seconde valeur — **la classe de la ligne d'origine** — n'est pas une valeur fixe et ne s'inscrit dans aucune colonne.*

**Six tables portent deux classes selon l'opération** — c'est le **cas normal** dans les verticales, où la même ligne se saisit hors ligne et s'annule en ligne. Le commentaire d'en-tête déclare les deux, avec l'opération de chacune, et les privilèges permettent les deux.

**`mouvement_stock` et `inventaire` n'en font pas partie** : elles portent **une seule classe, B**, avec un privilège plus strict qu'elle n'exige ([D-24](./research.md)). Une décision de forme n'est pas une seconde classe, et les confondre ferait chercher au lecteur une double déclaration qui n'a pas lieu d'être.

### Les rattachements inter-modules — aucun `REFERENCES`, tous commentés

| Depuis | Vers | Colonne | Nature |
|---|---|---|---|
| `hebergement.ligne_sejour` | `ventes.ligne_commande` | `ligne_commande_id` | **SAGA — cas orphelin nominal** |
| `pressing.bon_depot` | `hebergement.sejour` | `sejour_id` | **SAGA — cas orphelin nominal** |
| `hebergement.ligne_sejour` | `pressing.bon_depot` | `bon_depot_id` | Report du pressing sur la note |
| `ventes.commande` | *(cible opaque)* | `cible_type` + `cible_id` | Ciblage de facturation — `ventes` ne nomme jamais « séjour » ailleurs |
| `hebergement.client`, `.preference_personne` · `pressing.bon_depot` | `comptes.personne` | `personne_id` | Identité, purge TRX-06 unique |
| `hebergement.arrhes` | `caisse.encaissement` | `encaissement_id` | Imputation |
| `stocks.article_stock_catalogue` | `ventes.article` | `article_id` | Liaison catalogue → stock |
| `ventes.jeton_table` | `etablissements.table_pdv` | `table_pdv_id` | Jeton QR |
| `ventes.article`, `.categorie_article`, `.commande` · `pressing.bon_depot` | `etablissements.point_de_vente` | `point_de_vente_id` | Rattachement au lieu de vente |
| Neuf tables — `point_de_stock`, `article_stock`, `destination_preparation`, `numerotation_reference`, `categorie`, `sejour`, `reservation`, `numerotation_fiche_police`, `numerotation_retrait` | `etablissements.etablissement` | `etablissement_id` | Portée d'établissement |
| Six tables — `inventaire`, `commande`, `ligne_commande`, `lot_envoi`, `remise`, `incident_maintenance` | `comptes.compte` | `*_par_compte_id` | Auteur d'une opération tracée |

**Onze cibles distinctes, une trentaine de colonnes** — c'est l'ordre de grandeur qui justifie la porte P-05, et il grandira à chaque cycle de phase 3.

**Aucune de ces colonnes ne porte de `REFERENCES`**, et chacune porte un commentaire qui le dit — sans lui, le cycle qui relira le fichier prendrait l'absence pour un oubli et l'ajouterait. **C'est ce que la porte [P-05](./contracts/verifier-p05.md) rend désormais impossible.**
