# Recherche et décisions — cycle D2

*Les décisions du cycle, leur motif, et ce qui a été écarté. La numérotation continue celle du cycle D1 ([D-01 à D-13](../001-modele-donnees-socle/research.md)) : une décision se cite par son numéro, et un numéro ne se réemploie jamais.*

**Ce qui n'a pas eu à être cherché** est en fin de document — c'est aussi une information.

---

## D-14 · Où les quatre fichiers s'insèrent, et pourquoi pas en trois chiffres

**Décision** : les préfixes restent à **deux chiffres**. `ventes` s'intercale dans la plage du socle à **`55-`** ; les capacités et les verticales viennent après tout le socle, à **`96-`**, **`97-`** et **`98-`**.

| Ordre | Fichier | Famille de crate |
|---|---|---|
| … | `50-documents.sql` | `socle/` |
| **6 bis** | **`55-ventes.sql`** | **`socle/ventes`** |
| … | `60-` à `95-` | `socle/` |
| **12** | **`96-stocks.sql`** | **`capacites/stocks`** |
| **13** | **`97-hebergement.sql`** | **`verticales/hebergement`** |
| **14** | **`98-pressing.sql`** | **`verticales/pressing`** |

**Motif** : trois chiffres casseraient l'ordre. Le tri lexicographique compare caractère à caractère, et le tiret (ASCII 45) précède tout chiffre (48) : `100-stocks.sql` trierait **avant** `10-etablissements.sql`, donc avant tout le socle. Le passage à trois chiffres imposerait de renommer les onze fichiers du D1 en une seule fois — un coût réel pour un bénéfice nul tant que quatre-vingt-dix-neuf fichiers suffisent.

**Pourquoi `ventes` dans la plage du socle** : `ventes` est un crate de `socle/` (constitution, principe 2). Le placer après les capacités et les verticales dirait le contraire à qui lit le répertoire — et le répertoire est ce qu'on lit avant le README.

**Ce que cet ordre ne prétend pas être** : une contrainte technique. **Aucune clé étrangère ne traverse un schéma** ; l'ordre entre ces quatre fichiers est donc libre pour PostgreSQL. Il est **purement documentaire**, et c'est précisément pourquoi il doit dire la hiérarchie de dépendance des crates — c'est la seule information qu'il porte.

**Ce qui reste libre après** : les places `05`, `15`, `25`, `35`, `45`, `65`, `75`, `85`, `91` à `94` et `99`. Le piège des trois chiffres est consigné au README pour le cycle qui voudra un quinzième fichier.

---

## D-15 · L'occupation porte deux intervalles, et un seul porte la contrainte

**Décision** : `occupation` porte **`periode`** — ce que le client occupe — **et `periode_indisponibilite`** — l'occupation **plus** le temps de remise en état. La contrainte d'exclusion porte sur **`periode_indisponibilite`**.

**Motif** : le cadrage §5.4 et la constitution (principe 4) exigent que le temps de remise en état soit **intégré à l'intervalle d'indisponibilité, pas géré à part**. Un intervalle unique force un choix, et les deux sont faux :

| Si l'intervalle unique est… | Ce qui casse |
|---|---|
| la période **facturée** | Deux occupations jointives passent la contrainte, et l'unité est attribuée **encore sale** |
| la période **d'indisponibilité** | Le calcul de durée facture le ménage au client — 30 min de trop sur un passage d'une heure, soit un palier entier du barème |

**Ce que la base garantit alors** : `periode ⊆ periode_indisponibilite`, par une contrainte `CHECK` nommée, et l'absence de chevauchement des indisponibilités par la contrainte d'exclusion. **Ce qu'elle ne garantit pas** : que la durée de remise en état corresponde à celle du référentiel — c'est un calcul, il appartient au `domain` de la phase 3.

**Écarté** : porter la remise en état comme une **seconde occupation** de motif « ménage ». Elle doublerait le nombre de lignes, obligerait à les créer et à les annuler ensemble sans transaction qui les couvre, et laisserait exister une indisponibilité orpheline le jour où l'une des deux écritures échoue.

---

## D-16 · La contrainte d'exclusion est partielle — une annulation libère

**Décision** : la contrainte est `EXCLUDE USING gist (unite_id WITH =, periode_indisponibilite WITH &&) WHERE (statut <> 'ANNULEE')`.

**Motif** : sans la clause `WHERE`, **toute annulation rendrait l'unité définitivement inlouable sur son intervalle**. Une réservation annulée, un no-show, un départ anticipé — les trois sont des chemins nominaux du produit (RSV-04, SEJ-04), et les trois produiraient une unité morte.

**Pourquoi ne pas supprimer la ligne annulée** : `kaya_app` ne reçoit `DELETE` nulle part (contrat du D1 §3), et une annulation est une information — la politique d'annulation, le no-show facturé et l'avoir en dépendent. Un intervalle libéré ne s'efface pas, il cesse de réserver.

**Le coût, écrit** : la contrainte partielle est plus étroite qu'il n'y paraît. Une occupation qu'on **désannulerait** repasserait sous la contrainte et pourrait alors entrer en conflit — l'écriture échouerait. C'est le comportement voulu : on ne désannule pas, on crée une occupation nouvelle.

---

## D-17 · La mise hors service d'une unité est une occupation, pas une colonne

**Décision** : `occupation` porte un **motif** — `SEJOUR`, `RESERVATION`, `MAINTENANCE`, `BLOCAGE`. La mise hors service d'une unité est une occupation de motif `MAINTENANCE`.

**Motif** : le registre §7.2 classe la mise hors service en **B** (« retire une ressource de la disponibilité ») alors que `unite` est un référentiel de **C**. Une colonne sur `unite` donnerait à un référentiel une opération de classe B, et surtout **créerait un second mécanisme de disponibilité** : le calcul des unités libres devrait alors interroger les occupations **et** l'indicateur de l'unité. Deux mécanismes se contredisent le jour où l'un des deux n'est plus écrit — et c'est exactement le défaut que le cadrage §11.4 signale comme producteur de doubles attributions.

**Ce que la décision achète** : la mise hors service bénéficie **gratuitement** de la contrainte d'exclusion — on ne peut pas mettre en maintenance une unité déjà occupée, ni attribuer une unité en maintenance. Aucune ligne de code n'est nécessaire pour cela.

**Écarté** : un indicateur `hors_service` sur `unite`. Il ne porte pas d'intervalle, donc il ne dit ni depuis quand ni jusqu'à quand — et une mise hors service sans fin prévue est ce qui fait qu'on oublie de la lever.

---

## D-18 · `client` est une spécialisation de `comptes.personne`, jamais une copie

**Décision** : `hebergement.client` porte un **`personne_id` nu** (autre module) et **ne duplique aucune donnée d'identité** — ni nom, ni téléphone, ni type ou numéro de pièce.

**Motif** : `comptes.personne` porte déjà ces colonnes, l'index de recherche de SC-009 du cycle D1 (nom, téléphone, pièce, en moins de 300 ms sur 10 000 fiches) **et** `piece_capturee_le`, la colonne sur laquelle la purge ARTCI TRX-06 s'appuie. Les dupliquer donnerait :

- **deux cibles à la purge** — et une purge qui en oublie une est une non-conformité, pas un bogue ;
- **deux vérités** sur la même personne, que rien ne réconcilie ;
- **deux index** à tenir pour la même recherche.

**Ce que `client` porte alors** : ce qui est propre au client de l'hébergement et n'a pas de sens pour un employé ou un comptable — nationalité, adresse de séjour, catégorie commerciale, note interne.

**`client` ne porte donc AUCUN `etablissement_id`.** SEJ-01 et le registre §7.3 le disent : la fiche est *« rattachée au tenant, **partagée entre ses établissements** »*. Une colonne d'établissement la rattacherait à un seul, et contredirait `uq_client_personne`, unique **par tenant**. Un établissement retrouve « ses » clients **par ses séjours** — et c'est exactement ce que « partagée » signifie.

**Corollaire assumé** : la fiche client d'un établissement sans hébergement n'existe pas — et c'est correct : un maquis seul vend au comptoir, il n'a pas de fiche client (SEJ-05, « fiche client optionnelle »). Le socle ne suppose pas qu'un établissement possède de l'hébergement, et cette décision ne l'y oblige pas.

---

## D-19 · L'addition d'une table est une commande, pas une entité de plus

**Décision** : aucune table `addition`. Une addition **est** une `commande` de cible de facturation `TABLE`. `part_addition` divise cette commande.

**Motif** : l'entrée du cycle nomme `part_addition` — la **division** — sans nommer d'entité `addition`. Créer les deux dupliquerait le cycle de vie : ouverture, lignes, remise, fermeture, encaissement existent déjà sur la commande. Le transfert entre tables et la fusion se lisent alors comme un changement de cible, et non comme un déplacement de lignes entre deux agrégats.

**Ce que cela impose au modèle** : la cible de facturation est un couple `(cible_type, cible_id)` sur la commande — `TABLE`, `SEJOUR`, `COMPTOIR`, `EMPORTER` —, la même forme que `caisse.encaissement` et `documents.document_operationnel` emploient déjà au socle. **Une forme, pas deux.**

**Écarté** : une table `addition` rattachée à `table_pdv`. Elle aurait obligé à choisir, pour chaque opération, laquelle des deux entités la porte — et ce choix se serait fait deux fois différemment.

---

## D-20 · Le lot d'envoi est immuable, et sa composition l'est par conséquence

**Décision** : `lot_envoi` reçoit `SELECT, INSERT` seuls. La ligne de commande porte un **`lot_envoi_id` nullable**, renseigné **une fois**, à l'envoi.

**Motif** : « un second envoi crée un second lot, il ne modifie pas le premier » (registre §8.2). Ce que cette phrase interdit est de **rouvrir un lot** pour y verser des lignes saisies après coup — c'est ainsi qu'un bon de cuisine imprimé cesse de correspondre à ce que la cuisine prépare. Une ligne saisie après le premier envoi part au **second** lot.

**Pourquoi une colonne plutôt qu'une table de liaison** : une table `ligne_lot_envoi` append-only dirait la même chose et coûterait une jointure sur le chemin le plus chaud du produit — l'écran de préparation. La colonne suffit dès lors qu'elle n'est écrite qu'une fois, et le commentaire d'en-tête de `ligne_commande` le dit.

**Ce que le modèle ne peut pas empêcher, et qui appartient à la phase 3** : réécrire `lot_envoi_id` sur une ligne déjà envoyée. `ligne_commande` a besoin d'`UPDATE` pour son annulation de classe B ; le privilège ne peut donc pas fermer cette porte. **C'est une règle de service, écrite au contrat de la phase 3**, pas une garantie de la base — et le dire est plus honnête que de laisser croire à une immuabilité que le `GRANT` ne porte pas.

---

## D-21 · La destination de préparation, et le repli qui évite le bon manquant

**Décision** : `destination_preparation` est une table rattachée à l'**établissement**. `article.destination_preparation_id` est **nullable**. Le repli est la clé de configuration **`ventes.destination_preparation_defaut`**, de portée la plus basse `POINT_DE_VENTE`, créée au cycle D1.

**Motif** : « cuisine » et « bar » ne sont pas les mêmes chez tous les exploitants, et une énumération imposerait une migration au premier client qui a **deux cuisines** (registre §8.1). Le rattachement à l'établissement et non au point de vente vient du même document : **une cuisine sert plusieurs points de vente**.

**Pourquoi le repli passe par la configuration et non par une colonne sur le point de vente** : `etablissements.point_de_vente` appartient au socle, livré et figé par le cycle D1 ; lui ajouter une colonne violerait le périmètre de ce cycle. Et la clé existe déjà — le récapitulatif des paramètres d'établissement l'inscrit, avec sa portée. **La contrainte de périmètre et la bonne conception disent ici la même chose.**

**Ce qui est en jeu** : sans repli, un article sans destination produirait un envoi **sans bon**. Personne ne s'en apercevrait avant que le plat ne manque.

---

## D-22 · Les deux sagas, et pourquoi leur cas orphelin est le chemin nominal

**Décision** : deux rattachements inter-modules, tous deux en identifiant **nu et nullable**, tous deux commentés comme sagas à compensation explicite :

| Saga | Colonne | Sens |
|---|---|---|
| Report d'une consommation sur la note d'un séjour | `hebergement.ligne_sejour.ligne_commande_id` | `ventes` → `hebergement` |
| Bon de dépôt d'un client logé | `pressing.bon_depot.sejour_id` | `pressing` → `hebergement` |

**Motif** : la constitution (principe 2) interdit qu'une transaction couvre deux modules ; les opérations inter-modules sont des **sagas simples avec compensation explicite**. Une clé étrangère ferait plus qu'enfreindre une règle d'architecture : elle **ferait échouer en base l'écriture que le produit doit accepter**.

**Le cas orphelin, écrit une fois pour les deux** : une consommation saisie hors ligne arrive sur une note déjà arrêtée. C'est le **conflit le plus fréquent du produit** (registre §12, cas piège 2), aggravé par l'avoir FNE par quantité. La compensation est l'écriture d'une ligne dans `synchronisation.reconciliation_orpheline` — créée au cycle D1, en `SELECT, INSERT` seuls — et **jamais** un rejet silencieux, **jamais** un ajout d'office sur une note close.

**Aucune table de réconciliation nouvelle n'est créée.** Il n'y en a qu'une, elle est au socle, et les deux sagas y renvoient. Deux files de réconciliation seraient deux écrans, deux traitements et un jour une file que plus personne ne relève.

---

## D-23 · **P-05** — la porte qui refuse une clé étrangère entre deux schémas

**Décision** : ce cycle **crée une porte nouvelle**, `P-05`, qui échoue si une contrainte de clé étrangère joint deux schémas différents.

**Pourquoi maintenant, et pas au cycle D1.** Le plan du D1 a examiné cette porte et l'a **explicitement différée à ce cycle**, en écrivant pourquoi : « le cycle D1 crée les schémas du socle seuls, et la tentation n'apparaîtra qu'au cycle D2, où `ventes → hebergement` et `pressing → hebergement` sont deux rattachements sans FK. **C'est là qu'elle sera justifiée**, avec une cible non vide à inspecter. » Ce cycle est celui-là.

**Le coût manifeste qu'elle prévient** — et ce n'est pas un principe d'architecture abstrait :

1. Une clé étrangère posée sur `ligne_sejour.ligne_commande_id` **casse le chemin nominal** du conflit le plus fréquent du produit. L'écriture orpheline ne partirait pas en réconciliation : elle échouerait, en base, sur une contrainte.
2. Le mode de défaillance est **silencieux et différé**. Un cycle de phase 3 qui relit le fichier prend l'absence de `REFERENCES` pour un oubli et l'ajoute — de bonne foi. La migration s'applique, tous les tests passent, et le défaut ne se voit qu'à la première coupure réseau en exploitation.
3. **Le commentaire de colonne est aujourd'hui la seule défense, et un commentaire ne refuse rien.** C'est la définition d'une règle non opposable.

**Ce qu'elle coûte** : une requête sur `pg_constraint`, sur la base que **P-01 a déjà montée**. Pas de conteneur de plus, pas de dépendance, quelques secondes.

**Pourquoi le numéro 5** : `P-03` (dépendances) et `P-04` (écrans) sont nommées par la constitution et réservées par le noyau ; les numéros s'attribuent dans l'ordre d'apparition, et la première porte hors noyau est donc **P-05**.

**Ce qu'elle amende** : la spécification approuvée disait « aucune porte nouvelle » (FR-044, SC-013, hors périmètre). **Ces trois points sont corrigés dans le même changement** — un conflit constaté ne se tranche pas en silence (constitution, gouvernance).

**Écarté** : laisser le contrôle humain, comme le D1 l'a fait pour ce même point (constat T036, mesuré à zéro). Écarté parce que la cible passe de **zéro** rattachement inter-modules à **onze cibles distinctes et une trentaine de colonnes**, et qu'elle grandira à chaque cycle de phase 3. Un constat humain daté tient sur une ligne de `compose.yml` ; il ne tient pas sur une trentaine de colonnes qu'un cycle ultérieur pourrait « réparer ».

---

## D-24 · `mouvement_stock` reste en classe B, avec un privilège plus strict

**Décision** : `mouvement_stock` et `inventaire` sont de **classe B** — décision O-02 non tranchée — et reçoivent **`SELECT, INSERT` seuls**.

**Motif** : le registre est formel (§12) — jusqu'à l'arbitrage d'une décision ouverte, **la classe inscrite s'applique**, et c'est toujours la plus stricte des options. Ce cycle ne tranche pas O-02 : c'est une question à poser au pilote (le stock sert-il à détecter le vol, ou seulement à réapprovisionner ?), pas une question de modèle.

**Pourquoi le privilège est plus strict que la classe** : un mouvement constaté ne se corrige pas, il se **contre-passe**. C'est le même régime que les six tables de caisse du socle — `sortie_de_caisse`, `comptage`, `coupure_comptee`, `ecart_de_caisse`, `cloture_shift`, `cloture_journaliere` —, et le rapport du cycle D1 (T020) l'a déjà relevé comme une décision de **forme**, pas de classe.

**Ce que le commentaire d'en-tête doit dire**, faute de quoi la prochaine lecture y verra une incohérence : la classe est B, le privilège dit **en plus** qu'aucune ligne ne se récrit.

**Ce que la décision ne préjuge pas** : si O-02 fait passer `mouvement_stock` en A, **rien ne change dans ce fichier** — les privilèges d'une classe A append-only sont exactement ceux-là. C'est un argument de plus pour la forme retenue : elle est juste dans les deux branches de la décision ouverte.

---

## D-25 · Une entité que le registre décrit sans la nommer — `ligne_inventaire`

**Décision** : la ligne d'un inventaire s'appelle **`ligne_inventaire`**, de classe **B · B3**, story STK-03. Elle est inscrite au registre §6.1 et au journal §13.

**Motif** : le registre nomme `inventaire` « saisie, écart » sans nommer la table qui porte **l'article compté, la quantité constatée et l'écart**. Un inventaire sans ses lignes ne porte pas l'information de STK-03.

**Nom retenu contre `comptage_article` et `ligne_comptage`** : `comptage` est déjà pris au socle (`caisse.comptage`, le comptage de caisse), et deux entités homonymes dans deux schémas passeraient P-02 avec une seule déclaration — la limite écrite du contrat de P-02. `ligne_inventaire` dit à quoi elle appartient et ne collisionne avec rien.

**C'est la seule entité que ce cycle nomme.** Tout le reste des §6, §7 et §8 est déjà nommé, et **ces lignes sont honorées telles quelles** — elles ont été décidées à froid.

---

## D-26 · Ce qui ne reçoit délibérément aucune table

**Décision** : sept choses que ce cycle pourrait créer et ne crée pas. Le fichier concerné le dit en commentaire, plutôt que de laisser croire à un oubli.

| Ce qu'on pourrait chercher | Pourquoi il n'y a pas de table | Où c'est |
|---|---|---|
| `unite.statut_occupation` | **Dérivé** des occupations (registre §7.2). Le poser à la main produit des doubles attributions | Calculé |
| La salle de réunion | Une **unité d'une catégorie dédiée** (HEB-01), pas une entité | `categorie` + `unite` |
| Le panier de la page publique QR | Surface web publique **hors application** (registre §9) | Nulle part en base |
| La limitation de débit par jeton | **Éphémère Redis**, reconstructible (QRC-04) | Nulle part en base |
| La politique d'annulation, l'expiration d'une réservation provisoire | **Clés du catalogue** de configuration, portée établissement (RSV-01, RSV-03) | `parametre_catalogue` |
| Le décompte d'une prestation incluse | **Incrément 2** (registre §10). La table de la prestation existe ; son décompte n'a aucune story au MVP | Rien |
| Les schémas `restauration` et `bar` | **Coquilles vides** — leur tronc commun est `socle/ventes` (registre §8) | `ventes` |

**Motif commun** : une table qu'aucune story n'écrit est une table qu'on remplira un jour de ce qui traîne. Et une absence non expliquée se lit comme un oubli, puis se « répare ».

---

## D-27 · L'index de disponibilité, et ce qu'il faut mesurer

**Décision** : la contrainte d'exclusion **crée son propre index GiST** sur `(unite_id, periode_indisponibilite)` ; **aucun index supplémentaire n'est créé pour la recherche de chevauchement**. Un index séparé est ajouté pour la **recherche par catégorie** — trouver les unités libres d'une catégorie sur un intervalle.

**Motif** : une contrainte `EXCLUDE` est adossée à un index, et cet index sert les requêtes de chevauchement `&&`. En créer un second ferait payer chaque écriture deux fois pour la même recherche — exactement ce que la règle « un index sans usage nommé n'est pas créé » (contrat du D1 §6, [D-13](../001-modele-donnees-socle/research.md)) refuse.

**Ce qui reste à mesurer, et pourquoi ce n'est pas supposé** : la recherche de SC-010 part de la **catégorie** et non de l'unité — « les unités libres de la catégorie X entre T1 et T2 ». Le planificateur doit alors joindre `unite` puis exclure par les occupations, et rien ne garantit d'avance qu'il choisisse l'index GiST plutôt qu'un balayage. **C'est le cas que le quickstart mesure**, sur 50 unités et 20 000 occupations, avec `EXPLAIN (ANALYZE, BUFFERS)` — comme SC-009 l'a été au cycle D1.

**Réserve honnête, reprise du D1** : la mesure se fait sur poste Apple Silicon, table en cache. Elle ne prédit pas la production sur VPS `linux/amd64` à cache froid. **Ce qu'elle prouve est structurel** : le planificateur choisit un parcours d'index, et non un balayage séquentiel.

---

## D-28 · Le pressing ne dépend d'aucune autre verticale

**Décision** : `pressing.bon_depot` porte un **`personne_id` nu vers `comptes.personne`** (socle), et **jamais** vers `hebergement.client`. Le rattachement à un séjour est une colonne **distincte, nullable et facultative** — la seconde saga.

**Motif** : la hiérarchie de dépendance des crates est stricte (constitution, principe 2) — `verticales/` dépend de `socle/` et de `capacites/`, **jamais d'une autre verticale**. Un `client_id` pointant sur `hebergement.client` ferait dépendre le pressing de l'hébergement, et **un test structurel doit échouer** sur exactement cela.

**Ce qui est en jeu, concrètement** : un **pressing seul est un établissement valide** (cadrage, contexte produit). Si le bon de dépôt ne savait identifier un client qu'à travers l'hébergement, un pressing sans chambres ne pourrait nommer aucun client — ou obligerait à créer un `hebergement.client` sur un établissement qui n'a pas d'hébergement. C'est la faute que la constitution nomme : « toute conception qui a besoin de cette supposition est mal placée ».

**Ce que la colonne de séjour reste alors** : un rattachement **facultatif**, qui n'existe que si le module hébergement est actif **et** que le client est logé. Un rattachement optionnel entre verticales, porté comme une saga et sans clé étrangère, ne crée aucune dépendance de crate — c'est la différence entre « le pressing sait poster une charge sur une note quand il y en a une » et « le pressing a besoin de l'hébergement pour fonctionner ».

**Corollaire symétrique** : `hebergement.ligne_sejour.bon_depot_id` — le report d'un bon de pressing sur la note — est également **nu et nullable**. `hebergement` ne dépend pas de `pressing` non plus.

**Ce que le rattachement croisé impose, et qui ne va pas de soi.** Les deux colonnes se répondent — `bon_depot.sejour_id` d'un côté, `ligne_sejour.bon_depot_id` de l'autre — et un lecteur pressé y verrait une dépendance mutuelle entre deux verticales, que la hiérarchie de crates interdit. Elle n'existe pas, à **une condition qui doit être écrite** : le consommateur lit un **événement outbox dont la charge utile est financièrement complète et dénormalisée**, et dont le type est déclaré au **socle** — jamais une structure du crate d'en face. C'est la règle du grand livre permanent (cadrage §14.7), et c'est elle qui rend le rattachement possible sans dépendance de compilation. **Un test structurel de phase 3 doit échouer si l'un des deux crates déclare l'autre dans son manifeste.**

---

## Ce qui n'a pas eu à être cherché

- **Le patron SQL de chaque table.** Il est écrit, arbitré et mesuré : [contracts/conventions-sql.md](../001-modele-donnees-socle/contracts/conventions-sql.md) du cycle D1, lui-même repris de `docs/module-dore.md` « Couche 1 ». Ce cycle l'**applique** ; il ne le rediscute pas, et surtout il ne le **reformule** pas — une reformulation dérive, et P-01 n'accepte qu'une seule forme.
- **L'extension `btree_gist`.** Posée par `00-conventions.sql` au cycle D1, explicitement « pour le cycle D2, qui en a besoin pour la contrainte d'exclusion de `occupation` » ([D-11](../001-modele-donnees-socle/research.md)). Elle est là, et elle est nécessaire : `unite_id WITH =` sur un `UUID` ne s'indexe en GiST que par elle.
- **Les versions.** Aucune dépendance n'est ajoutée, aucune n'est montée, **aucune famille du §3.4 n'est ouverte**. Ce cycle ne crée ni `Cargo.toml`, ni `package.json`, ni service de plus dans `compose.yml`. `postgres:18.4` est repris tel quel, sans revérification, conformément à l'instruction.
- **Les décisions ouvertes O-02 et O-03.** Elles ne sont pas de ce cycle : O-02 se tranche avec le pilote au terrain, O-03 se tranche au cycle qui crée le crate de la surface QR. Le registre s'applique en l'état, et c'est la position la plus stricte.
- **La numérotation continue.** `numerotation_fiche_police`, `numerotation_reference` et `numerotation_retrait` reprennent à l'identique le patron de `documents.numerotation_document` ([D-05](../001-modele-donnees-socle/research.md)) : **compteur en table à verrou de ligne, jamais une `SEQUENCE`**.
