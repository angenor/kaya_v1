<!--
SYNC IMPACT REPORT
==================
Version : GABARIT NON RENSEIGNÉ → 1.0.0
Type de changement : MAJOR — première ratification. Le fichier ne contenait que les
jetons du gabarit ; aucun principe n'existait auparavant.

Principes ajoutés (14, numérotés 0 à 13 — la numérotation d'origine est conservée
pour que les références « principe 6 » restent stables dans les specs et les plans) :
  0.  Ordre de construction — trois phases
  1.  Sources de vérité
  2.  Architecture — monolithe modulaire, hiérarchie de crates
  3.  Multi-tenant
  4.  Temps et disponibilité
  5.  Argent et fiscalité
  6.  Hors ligne
  7.  Application unique — un code, trois coquilles
  8.  Qualité et interface
  9.  Sécurité
  10. Périmètre
  11. Versions
  12. Référence visuelle
  13. Vérification — une commande, quatre portes

Sections ajoutées :
  - Contexte produit et documents de référence (occupe l'emplacement de la section 2
    du gabarit)
  - Flux de travail de développement (occupe l'emplacement de la section 3 du gabarit)
  - Gouvernance

Sections supprimées : aucune (le gabarit n'avait aucun contenu).

Divergences constatées avec les documents produit, tranchées en faveur de l'entrée
utilisateur et signalées ici :
  - Familles de crates : le cadrage §13.1 place `restauration` et `bar` dans
    `verticales/` et omet `metriques` et `ventes` de `socle/`. La présente
    constitution retient socle/{…, metriques, ventes} et verticales/{hebergement,
    pressing} — cohérent avec « le socle connaît article_vendable ». Le cadrage
    §13.1 doit être aligné.
  - Capacitor : `docs/user-stories-v1.md` §0.5 le conditionne à « un besoin natif
    constaté » en incrément 3 ; la présente constitution le déclare décidé et non
    optionnel comme cible de production mobile. Les user stories doivent être
    alignées.

TODO différés :
  - `docs/modele-donnees/` n'existe pas encore — livrable de la phase 1 (cycles D1, D2).
  - `scripts/verifier.sh` n'existe pas encore — dû dès le premier cycle de phase 1.
-->

# Constitution de Kaya

## Principes fondamentaux

### 0. Ordre de construction — trois phases, dans cet ordre

Trois phases, jamais sautées :

- **Phase 1 — le modèle de données.** Tout le MVP en SQL applicable dans
  `docs/modele-donnees/`, **un fichier par schéma PostgreSQL**, provisions comprises.
  Aucun écran, aucun endpoint.
- **Phase 2 — l'application entière en données simulées.** Tous les écrans, tous les
  parcours, cliquables de bout en bout, sans aucun backend.
- **Phase 3 — le backend**, qui remplace les données simulées **endpoint par endpoint**.

Règles opposables :

- Un cycle **NE DOIT JAMAIS** sauter une phase. Un cycle de phase 3 **PEUT** revenir
  corriger un écran de phase 2 : c'est le cas normal, pas une exception.
- **Règle de branchement** : aucune donnée simulée ne survit à la mise en service de
  l'endpoint qui la remplace. Le cycle backend qui livre un endpoint **DOIT** supprimer
  la simulation correspondante **dans le même changement**. Un test échoue si une
  simulation subsiste pour un endpoint servi.
- Le jeu de données simulées de la phase 2 **DOIT** avoir la forme du modèle : mêmes
  noms de champs, mêmes types, mêmes valeurs d'énumération.

**Motif** : la boucle de retour. Un écart se voit à l'écran en quelques secondes ; dans
une spécification il demande une relecture entière — et le développeur est seul. Le
modèle vient d'abord parce qu'il est la contrainte la plus coûteuse à changer plus tard.

### 1. Sources de vérité

**(a) Le contrat OpenAPI.** Il est généré par utoipa depuis le code Actix. Le client
TypeScript est généré depuis ce contrat, **jamais écrit à la main**. Un diff de client
non commité fait échouer la vérification.

**(b) Le modèle de données SQL de `docs/modele-donnees/`, au même titre.** Le schéma
PostgreSQL n'est modifié que par migrations sqlx versionnées ; une migration appliquée
n'est jamais modifiée ; **toute migration met à jour le fichier de son schéma dans le
même changement**. Un test compare le schéma réel de la base aux fichiers et fait
échouer le build sur tout écart. Les seeds sont rejouables à part.

**(c) La configuration d'établissement.** Tout paramètre métier qualifié de
« paramétrable » vit dans la configuration d'établissement — héritage
tenant → établissement → module → point de vente, avec surcharge — **jamais en dur dans
le code**. Le récapitulatif des paramètres en fin de `docs/user-stories-v1.md` fait foi.

**Motif** : une source de vérité périmée est pire que pas de source du tout. Sans la
mise à jour dans le même changement, les fichiers deviennent une photo périmée en trois
cycles.

### 2. Architecture — monolithe modulaire, hiérarchie de crates

Monolithe modulaire Rust, *microservices-ready*, ce qui signifie exactement ceci et rien
de plus :

- Un crate par domaine, interfaces exposées par **traits**, dépendances injectées.
- **Un schéma PostgreSQL par module.** Aucune requête ne joint deux schémas de modules
  différents ; les lectures inter-modules passent par un trait exposé.
- Aucune transaction SQL ne couvre deux modules. Les opérations inter-modules sont des
  **sagas simples avec compensation explicite**.
- Toute transition d'état écrit un **événement outbox dans la même transaction**.
- **Aucun service n'est extrait au MVP. Aucune file de messages externe n'est
  introduite** — l'outbox est consommé par un worker in-process.

**Trois familles de crates, hiérarchie de dépendance stricte :**

| Famille | Contenu | Peut dépendre de |
|---|---|---|
| `socle/` | etablissements, comptes, caisse, fiscalite, documents, synchronisation, pilotage, editeur, metriques, ventes | `socle/` uniquement |
| `capacites/` | stocks — *(les autres non implémentées)* | `socle/` |
| `verticales/` | hebergement, pressing | `socle/`, `capacites/` |

- **Un test structurel échoue si un crate de `socle/` dépend d'un crate de
  `verticales/`.**
- **Le socle ne connaît ni « chambre », ni « unité louable », ni « séjour »** : il
  connaît `article_vendable` et `ressource_reservable`. Tout le spécifique hôtelier vit
  dans `verticales/hebergement`.

**Module d'activité ≠ capacité** — deux référentiels distincts, tous deux en table :

- **Module** (la verticale) : `HEBERGEMENT`, `RESTAURATION`, `BAR`, `PRESSING`,
  `SALLE_REUNION`.
- **Capacité** (le transverse) : `STOCK`, `LIVRAISON`, `PRODUCTION`,
  `COMMERCE_EN_LIGNE`, `CANAL_VENTE_EXTERNE`, `FIDELITE`, `DEVIS`, `COMPTES_CLIENTS`.
- Un module **déclare** les capacités qu'il consomme.
- Seule `STOCK` au profil `SIMPLE` est implémentée. **Toute autre valeur est refusée
  explicitement, jamais ignorée.**

**Crate `domain` partagé** — moteur fiscal, barèmes, validation, types métier — consommé
par l'API et par le nœud de site : **une seule implémentation du calcul de la taxe de
nuitée**, pas deux.

**Rôles des dépôts de données** : PostgreSQL est la seule vérité durable. Redis ne porte
que de l'éphémère reconstructible (sessions, file FNE, verrous, limitation de débit,
cache). Garage est accédé par l'API S3.

**Motif** : sans la règle socle/verticales, l'hôtellerie contamine le noyau en trois
cycles et le produit cesse d'être extensible à d'autres activités.

### 3. Multi-tenant

- Chaque table porte `tenant_id`.
- **RLS `ENABLE` ET `FORCE`** sur toutes les tables, avec un **rôle applicatif distinct
  du propriétaire des tables**.
- `SET LOCAL app.current_tenant` posé **dans chaque transaction**, jamais à l'ouverture
  de connexion.
- La porte **P-01** échoue si une table du schéma n'a aucune politique RLS.
- Un test d'isolation vérifie que le tenant A ne lit ni n'écrit aucune ligne du tenant B,
  **sur chaque endpoint**.

**Motif** : une politique RLS manquante est une fuite de données entre clients. C'est le
seul défaut dont le coût ne se rattrape pas.

### 4. Temps et disponibilité

- Une occupation est un **intervalle `[début, fin)` en timestamp avec le fuseau de
  l'établissement**, **jamais une paire de dates** — le marché pratique massivement le
  passage horaire et la demi-journée.
- La disponibilité est garantie par une **contrainte d'exclusion PostgreSQL**
  (`EXCLUDE USING gist` sur `unite_id` + `tstzrange`), **pas par un verrou applicatif**.
- Le temps de remise en état est **intégré à l'intervalle d'indisponibilité**.
- Toute logique métier, tout calcul fiscal, toute clôture et **tout calcul de durée de
  passage** s'appuient exclusivement sur l'**horodatage d'autorité serveur**, jamais sur
  l'horloge d'un terminal.

**Motif** : un verrou applicatif se contourne par un second processus ; une contrainte
d'exclusion ne se contourne pas. Et une horloge de terminal se règle à la main.

### 5. Argent et fiscalité

- **Tous les montants sont des entiers en unités mineures** + code ISO 4217 porté par
  l'établissement (XOF, 0 décimale).
- **Toute quantité — ligne de vente, mouvement de stock — est en `NUMERIC`, jamais en
  entier.** Un hôtel vend 1 bière ; une quincaillerie vendra 2,3 mètres de fer ; une
  boulangerie achètera 47,5 kg de farine. Passer d'entier à décimal après mise en
  production imposerait de migrer toutes les lignes.
- Les prix sont **verrouillés à la création de la ligne**.
- **Aucune règle fiscale ne vit hors du trait `JurisdictionAdapter`** — un seul
  adaptateur au MVP (`CoteDIvoire`).
- Chaque formule de location porte `assujettie_taxe_nuitee` et une règle de conversion :
  le traitement fiscal du passage et de la demi-journée est un **paramètre, jamais une
  constante**.
- Tout calcul fiscal a un **test doré sur jeu de cas figés**, exécuté à chaque
  vérification.
- **Documents opérationnels et documents fiscaux sont deux agrégats étanches**, avec deux
  numérotations et deux cycles de vie. Tout document opérationnel porte la mention
  « Document non fiscal — ne tient pas lieu de facture ».
- L'API FNE n'ayant **aucune clé d'idempotence**, l'état `INDETERMINEE` (timeout)
  **n'est jamais rejoué automatiquement** : rapprochement manuel obligatoire.
- Les **id d'items retournés par l'API de certification sont persistés** — sans eux aucun
  avoir n'est possible.

**Motif** : le pilote abandonne le papier pour la conformité. Un double envoi FNE crée
une seconde facture réelle chez l'administration ; il ne s'annule pas côté client.

### 6. Hors ligne

- Chaque entité déclare sa **classe A/B/C/D** dans `docs/registre-classes-offline.md`.
- **Une opération B, C ou D atteignable depuis un chemin de code exécutable hors ligne
  fait échouer le build.**
- Toute écriture porte un **UUID v7 client** ; le serveur déduplique ; le rejeu est
  idempotent ; **le serveur fait foi en conflit**.
- La file se vide **au retour au premier plan** par défaut. Aucune plateforme ne
  garantit la synchronisation en arrière-plan : Background Sync est une API Chromium,
  `BGTaskScheduler` et `WorkManager` supposent la coquille native. **Les trois sont des
  optimisations, jamais des hypothèses.**
- **Aucune donnée B, C ou D en cache d'écriture sur un terminal.**
- L'interface **annonce immédiatement** toute action indisponible faute de réseau :
  jamais de grisé silencieux, jamais d'échec après coup, jamais de mise en file « au cas
  où ».
- **Ces règles s'appliquent dès la phase 2, sur les données simulées** : une opération de
  classe C doit être refusée hors ligne même quand rien n'est branché.

**Motif** : un écran qui accepte en phase 2 ce que le serveur refusera en phase 3 est un
écran à refaire, et le mensonge ne se découvre qu'au branchement.

### 7. Application unique — un code, trois coquilles dans le temps

**Une seule application Nuxt 4 en SPA** pour tous les rôles métier. La coquille qui
l'embarque change au fil du temps, le code non :

| Coquille | Statut |
|---|---|
| **PWA** — service worker, manifeste, installation | **Phase 2 et démonstration. Ce n'est PAS la cible de production.** |
| **Capacitor** — Android et iOS | **La production mobile. Décidé et non optionnel.** |
| **Tauri desktop** | Option ouverte pour le poste de réception, à trancher. |

Capacitor embarque le build web tel quel : le passage n'est pas une réécriture, c'est une
coquille ajoutée plus des plugins natifs. Les limites du web sur le Bluetooth (impression
thermique absente de Safari), les notifications et le stockage sécurisé ne se contournent
pas.

**Règles d'interface :**

- Les **rôles sont cumulables** : un utilisateur porte N rôles, ses permissions sont
  l'union — c'est la norme, pas l'exception.
- L'accueil est un **tableau de bord de tuiles filtrées par permission**, jamais un menu
  figé.
- **Chargement paresseux par module.**
- L'interface **ne montre jamais un module d'activité inactif** : pas de grisé, absent.
  Même règle pour une action qu'une permission interdit : **absente, jamais grisée**.

**Règle de plateforme :**

- **Toute capacité de plateforme passe par `PlatformAdapter`** — impression, scan, caméra
  et OCR, stockage sécurisé, notifications, géolocalisation, état réseau.
- **Deux implémentations sont prévues d'emblée** : `web` (phase 2) et `capacitor`
  (production).
- **Aucun composant n'appelle jamais une API de plateforme directement.**
- **Une capacité absente le dit explicitement à l'utilisateur et propose l'alternative.**
  En phase 2 ce message est fréquent et c'est normal ; en production Capacitor il devient
  rare.

**Motif** : c'est la règle `PlatformAdapter`, et elle seule, qui rend le changement de
coquille mécanique plutôt qu'une réécriture.

### 8. Qualité et interface

- Transitions d'état couvertes par des **tests d'intégration**.
- Requêtes sqlx **vérifiées à la compilation** (`cargo sqlx prepare`).
- **Aucune chaîne utilisateur en dur** : clés i18n **fr ET en**, fr par défaut.
- **Mode sombre dès le premier écran**, jamais rétrofitté.
- **Aucune couleur ni espacement littéral** hors des tokens de `docs/design/tokens.md`.
- Logs structurés avec corrélation ; Sentry ; sonde `/health`.
- **Tout cycle qui produit des écrans est vérifié en navigateur réel, sur les deux
  moteurs (Chromium ET WebKit)** : un test qui monte un composant ne prouve pas qu'une
  page s'atteint.
- Le cycle livre un **index des écrans navigable**, pour que la revue se fasse à l'écran
  et non dans les documents.

**Motif** : le mode sombre et l'i18n rétrofités touchent chaque fichier une seconde fois.
Et un composant monté en test ne dit rien de la route qui devait y mener.

### 9. Sécurité

- **Le verrouillage par adresse MAC est techniquement impossible — il n'est jamais
  implémenté.** À la place : **enrôlement d'appareil par paire de clés non extractibles**
  (WebCrypto, stockage IndexedDB non exportable) signant chaque requête, et **liste
  blanche révocable côté serveur**.
- **L'attestation d'intégrité n'existe pas sur le web** : la sécurité repose sur le
  serveur, jamais sur une promesse du client. C'est une différence réelle avec le natif ;
  elle est assumée et écrite.
- **Le géorepérage est souple** : 300 m par défaut, alerte au gérant, **jamais bloquant
  sur une action critique**.
- **Coffre chiffré par tenant** pour les clés FNE.
- **Journal d'audit immuable** sur : remise, annulation, avoir, ouverture de tiroir,
  modification de tarif, changement de rôle, écart de caisse, rebascule de palier de
  passage. C'est un **module de premier plan, pas un journal technique**. La taxonomie
  des familles tracées est `docs/taxonomie-audit.md`.

**Motif** : une porte de sécurité qui repose sur une promesse du client n'est pas une
porte. Et un géorepérage bloquant transforme une imprécision GPS en incident
d'exploitation.

### 10. Périmètre

- **« Prêt ≠ construit »** : les provisions du cadrage §14 — adaptateurs de juridiction
  supplémentaires, devises actives, modules additionnels, canal TERNE, partenaires
  externes, contrats et cautions, comptes entreprises, IoT — sont des **choix de modèle
  de données uniquement**. Aucune UI, aucune logique au MVP.
- **Elles existent donc en phase 1, et nulle part ailleurs.** Une provision qui
  apparaîtrait dans un écran de phase 2 ou un endpoint de phase 3 n'est plus une
  provision : c'est du périmètre entré par la porte de service.
- **Toute fonctionnalité qui ne contribue pas à faire abandonner le papier au pilote ou à
  garantir la conformité fiscale est refusée.**
- Les priorités **P0 / P1 / P2 / PROVISION** des user stories font foi.

**Motif** : une provision coûte zéro dans le modèle de données et coûte un incrément
partout ailleurs.

### 11. Versions

- **La dernière version stable de chaque brique, sauf conflit constaté** —
  peerDependency non satisfaite, contrainte de crate incompatible, API rompue qui échoue
  à l'exécution. Dans ce cas on descend **au minimum** et on écrit la contrainte **et sa
  condition de levée**.
- Toute version est **vérifiée sur le registre officiel avec l'URL et la date citées**,
  puis **épinglée exactement** (pas d'intervalle) et **figée par lockfile commité**.
- **Ne jamais proposer un numéro de version de mémoire.**
- **Ajouter et monter sont libres en cours de cycle**, la seule condition étant que la
  suite de tests passe après ; l'inscription à `docs/versions-reference.md` se fait
  **dans le même changement**.
- **Aucune revue périodique n'est programmée** : le développeur est seul, et une échéance
  calendaire manquée une fois est une règle morte.
- **Seule limite au jugement** : deux dépendances de la même famille fonctionnelle ne
  cohabitent pas (§3.4 de `docs/versions-reference.md`).

**Motif** : un numéro cité de mémoire est faux une fois sur trois, et l'erreur ne se voit
qu'au build de quelqu'un d'autre — ici, plus tard, soi-même.

### 12. Référence visuelle — la grammaire fait foi, pas le dessin

**Référence de travail** : `docs/design/html/{code}-{nom}[-{etat}].html` — les onze
écrans maquettés, valeurs exactes et hiérarchie DOM, **un fichier par état**. Les
fondations sont dans `docs/design/fondation/`, les prototypes animés dans
`docs/design/proto/`, les documents imprimés dans `docs/design/documents/`.

**Ce qui fait foi toujours :**

- `docs/design/tokens.md` — couleurs, espacements, rayons, typographie. **Il prime sur
  tout export en cas de divergence.**
- `docs/design/composants.md` et le styleguide — les **seize composants** et leurs états.
- `docs/design/lexique.md` — le vocabulaire vu par l'utilisateur.
- `docs/design/mouvement.md` — durées et courbes.
- Les **neuf règles de simplicité** et les **deux zones** de `docs/Kaya_Design.md`.

**Ce qui est une proposition** : la disposition d'un écran, le choix des composants sur
cet écran, le nombre de champs. **Les maquettes ont été dessinées avant le modèle de
données ; elles n'ont pas pu tout prévoir.** Quand le modèle ou une fonctionnalité exige
un élément qu'un écran n'a pas — une colonne, un état, une action — **tu l'ajoutes, et tu
mets la maquette à jour dans le même changement**. Une maquette qui ment est pire qu'une
maquette absente : la suivante s'appuiera dessus.

Un écran qui s'écarte de sa maquette reste juste tant qu'il **parle la même langue** ; un
écran qui invente une couleur, un composant ou un mot ne l'est plus. **La dérive vient du
vocabulaire, pas de la mise en page.** Et un ajout se fait, il ne se subit pas : ajouter
trois actions faute d'avoir tranché laquelle compte viole la règle **« une action
principale par écran »**.

**Un écran se code dans quatre cas :**

1. **Maquetté** — un fichier d'état existe.
2. **Dérivé** — une ligne de `docs/design/derivation.md` dit de quel motif il hérite.
3. **Composé** — assemblé à partir des seize composants canoniques.
4. **Découvert à l'implémentation** — un écran que les documents n'avaient pas prévu et
   sans lequel un parcours ne se termine pas. **Ce quatrième cas est autorisé et n'arrête
   pas le cycle** : l'écran se code avec les composants existants, le lexique et les
   tokens, **puis s'inscrit à `docs/design/derivation.md` dans le même changement**, avec
   la mention « découvert à l'implémentation, à valider ».

Ce qu'on refuse n'est pas d'inventer un écran, c'est de l'inventer **en silence** —
trente écrans non inscrits finissent par ne plus se ressembler.

**Le HTML de maquette n'est jamais copié ni déplacé vers `app/`** — c'est une cible, pas
une source : il est autonome, non sémantique, sans i18n, sans mode sombre câblé, sans
RBAC. On lit ses valeurs, on réimplémente. **Seule exception** : `docs/design/theme.css`,
le bloc `@theme` Tailwind 4, est copié tel quel dans `app/assets/css/` — c'est lui qui
porte les tokens.

**Tailwind 4 d'abord, CSS en dernier recours** : tout style s'exprime en utilitaires du
noyau référençant les tokens de `@theme` ; le mode sombre passe par la variante `dark:`,
**jamais par une seconde palette** ; aucune classe personnalisée ni style en ligne ; le
CSS explicite est réservé à ce que Tailwind n'exprime pas (`@keyframes`, impression
thermique) et reste regroupé. **Une seule identité visuelle sur toutes les plateformes.**

### 13. Vérification — une commande, un noyau de quatre portes, et elle grossit

**Une seule commande.** Tout ce qui doit passer avant un commit vit dans
`scripts/verifier.sh`, lancé par une commande unique documentée au README. Pas dix
scripts qu'on lance de mémoire : un seul, qui enchaîne tout et qui **sort en échec au
premier contrôle rouge**. **L'agent le lance à la fin de chaque tâche.**

**Le serveur de CI vient en phase 3, pas avant.** GitHub Actions n'arbitre qu'entre
développeurs, et le développeur est seul. Ce qui a de la valeur tout de suite, c'est que
la vérification soit **mécanique** — pas qu'une machine la lance. **Déclencheur du
passage au serveur** : le script local dépasse deux ou trois minutes et on cesse de le
lancer. Ce jour-là, `.github/workflows/` le fait à notre place, **et le script ne change
pas**.

**Le noyau est de quatre portes, et on ne commence pas par un catalogue :**

| Porte | Ce qu'elle vérifie | Dès |
|---|---|---|
| **P-01** | le modèle de données s'applique sur une base vierge, dans l'ordre, et chaque table porte `ENABLE` + `FORCE` + sa politique | phase 1 |
| **P-02** | toute table du modèle a une classe déclarée dans `docs/registre-classes-offline.md` | phase 1 |
| **P-03** | aucune dépendance en intervalle, lockfiles commités et à jour, chaque version inscrite à `docs/versions-reference.md` | dès qu'un manifeste existe |
| **P-04** | l'application démarre et **chaque écran s'atteint**, en clair et en sombre, sur Chromium ET WebKit | phase 2 |

**Une porte s'ajoute quand une erreur réelle s'est produite**, ou quand son absence
coûterait une fuite de données entre clients — **jamais parce qu'elle figurerait bien
dans une liste**. Une porte écrite avant d'avoir rencontré le problème qu'elle prévient
regarde souvent à côté. Les numéros s'attribuent **dans l'ordre d'apparition** ; il n'y a
pas de catalogue préétabli.

Ce que la phase 3 ajoutera nécessairement, et qu'on n'écrit pas d'avance : le client
TypeScript régénéré sans diff, l'isolation multi-tenant sur chaque endpoint, l'outbox sur
chaque transition, les tests de classe hors-ligne, et l'absence de jointure entre schémas
de modules.

**Contrat que chaque porte respecte, sans exception :**

1. Elle **déclare son périmètre inspecté**.
2. Elle **vérifie sa complétude**.
3. Elle **ne modifie pas ce qu'elle inspecte**.
4. Elle **prouve que sa cible n'est pas vide** — une porte qui ne trouve jamais rien est
   indistinguable d'une porte qui n'a rien à trouver.
5. Elle a **un test négatif** : on la casse volontairement une fois pour vérifier qu'elle
   échoue vraiment. **Une porte sans test négatif est une décoration.**

## Contexte produit et documents de référence

**Kaya** est une plateforme de gestion pour **établissements d'hébergement et de service
en Afrique**. Établissement pilote : **Résidence Hôtel Deloria, Abengourou, Côte
d'Ivoire**. **Développeur solo. Monorepo unique.**

**L'entité centrale est l'ÉTABLISSEMENT, pas l'hôtel.** Un établissement active les
**modules d'activité** dont il a besoin — hébergement, restauration, bar, pressing, salle
de réunion. Un maquis seul, un bar seul, un pressing seul et une résidence meublée seule
sont des **établissements valides**.

**Aucun crate partagé ne doit supposer qu'un établissement possède de l'hébergement, ni
qu'il possède un point de vente.** Toute conception qui a besoin de cette supposition est
mal placée : elle appartient à une verticale.

**Documents produit de référence** — en cas de doute, ils priment sur toute supposition :

| Document | Ce qu'il arbitre |
|---|---|
| `docs/cadrage-v1.md` | périmètre, modèle d'entité, fiscalité, topologies, stack, provisions §14 |
| `docs/user-stories-v1.md` | stories, priorités P0/P1/P2/PROVISION, *Definition of Done*, ordre des cycles, récapitulatif des paramètres d'établissement |
| `docs/registre-classes-offline.md` | classe A/B/C/D de chaque entité |
| `docs/taxonomie-audit.md` | familles d'événements tracées au journal d'audit |
| `docs/versions-reference.md` | versions épinglées et leur justification |
| `docs/design/` | tokens, composants, lexique, mouvement, maquettes, dérivations |
| `docs/modele-donnees/` | le schéma SQL de référence — livrable de la phase 1 |

**Ordre de préséance en cas de conflit** : la présente constitution, puis
`docs/cadrage-v1.md`, puis `docs/user-stories-v1.md`, puis les autres documents. Un
conflit constaté n'est jamais tranché en silence : il est corrigé dans le document
perdant, **dans le même changement**.

## Flux de travail de développement

**Un cycle** est une unité de travail livrable. En phase 2 il correspond à **un parcours**
(F1 à F7), pas à un module ; en phases 1 et 3 il correspond à un lot d'entités ou de
modules (D1, D2 puis T1 à T5).

**Le cycle est terminé quand la *Definition of Done* de `docs/user-stories-v1.md` §0.4 est
satisfaite.** Les points qui ne s'appliquent pas à la phase courante se déclarent
**« sans objet »**, **jamais cochés en silence**.

**Chaque tâche se termine par `scripts/verifier.sh`.** L'agent le lance ; il ne rapporte
pas une tâche comme terminée si le script est rouge. Aucun contrôle n'est lancé à la main
en plus du script : ce qui compte est dedans, ou n'existe pas.

**Ce qu'un cycle met à jour dans le même changement que le code** — sans exception, parce
qu'un document mis à jour « juste après » ne l'est jamais :

- `docs/modele-donnees/{schema}.sql` quand une migration touche le schéma (principe 1b).
- `docs/registre-classes-offline.md` quand une entité apparaît (principe 6).
- `docs/versions-reference.md` quand une dépendance est ajoutée ou montée (principe 11).
- La maquette concernée quand un écran gagne un élément qu'elle n'avait pas (principe 12).
- `docs/design/derivation.md` quand un écran est découvert à l'implémentation
  (principe 12, cas 4).
- Le **test négatif** de toute porte ajoutée par le cycle (principe 13).

**Ce que la phase 2 ne prouve pas, et qu'il faut dire au pilote** : ni la conformité
fiscale, ni la résistance aux coupures réelles, ni les performances sur le matériel visé.
Une démonstration sur données simulées montre le produit ; elle ne montre pas qu'il tient.

## Gouvernance

**La constitution prime sur toute autre pratique.** Un plan, une spécification ou un
commit qui la contredit est en défaut, quelle que soit sa qualité par ailleurs. Les
documents produit arbitrent le *quoi* ; la constitution arbitre le *comment*, et elle ne
se contourne pas au motif que le cadrage serait muet.

**Amendement.** Tout changement de la constitution passe par `/speckit-constitution` et
produit, dans le même changement : (1) le texte amendé, (2) le rapport d'impact en
commentaire de tête, (3) la mise à jour des documents que l'amendement rend faux. Un
amendement qui laisse un document de référence en contradiction n'est pas terminé. Les
dates sont au format ISO `AAAA-MM-JJ`.

**Versionnement de la constitution** — sémantique :

- **MAJEUR** : suppression ou redéfinition incompatible d'un principe ou d'une règle de
  gouvernance.
- **MINEUR** : ajout d'un principe ou d'une section, ou extension matérielle d'une règle.
- **CORRECTIF** : clarification, reformulation, correction non sémantique.

**Contrôle de conformité.** Il est **mécanique, pas calendaire** : `scripts/verifier.sh`
est le seul contrôle qui ait de la valeur pour un développeur seul, et **aucune revue
périodique n'est programmée** — une échéance manquée une fois est une règle morte. Quand
un principe se révèle non vérifiable mécaniquement et qu'une erreur réelle s'est produite,
la réponse est **une nouvelle porte avec son test négatif** (principe 13), pas un rappel.

**Guidance d'exécution.** Les documents de `docs/` listés en section « Contexte produit »
sont la référence de travail au quotidien ; la constitution ne les remplace pas, elle
fixe ce qui ne se négocie pas.

**Version** : 1.0.0 | **Ratifiée le** : 2026-08-06 | **Dernier amendement** : 2026-08-06
