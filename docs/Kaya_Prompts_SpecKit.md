# Kaya — Prompts Spec Kit (prêts à coller)

*Compagnon d'exécution du Cadrage v1 et des User Stories v1 — Développement solo avec Claude Code + GitHub Spec Kit*

**Version 2.0.0 — 2026-08-06. Réécrit pour la stratégie en trois phases.**

---

## 0. Ce qui a changé le 2026-08-06, et pourquoi

> **Le constat, écrit tel quel** : dans l'ordre backend d'abord, le produit était trop compliqué à
> développer. Pas trop compliqué à *concevoir* — les documents de cadrage tiennent — trop
> compliqué à *faire avancer* : chaque cycle produisait des tables, des traits et des tests que
> rien ne montrait, et vérifier qu'ils étaient justes demandait de relire des spécifications
> entières. Un développeur seul n'a pas ce temps-là.

**Le remède est un changement d'ordre, pas de périmètre.** Rien n'est retiré du produit ; ce qui
change est ce qu'on construit en premier, et ce à quoi on regarde pour savoir si c'est juste.

| | Ordre d'avant | Ordre retenu |
|---|---|---|
| 1 | Socle backend, puis module par module | **Le modèle de données complet, en SQL** |
| 2 | Écrans branchés au fur et à mesure | **Toute l'application, avec des données simulées** |
| 3 | — | **Le backend, qui remplace les simulations une par une** |
| Ce qu'on regarde pour valider | une spécification, des tests verts | **l'écran, tout de suite** |

**Les trois raisons de cet ordre :**

1. **Le modèle de données d'abord** parce qu'il est la contrainte la plus coûteuse à changer plus
   tard, et parce que tout le reste s'y appuie : les données simulées prennent la forme des tables
   réelles, donc le branchement du backend devient un remplacement mécanique et non une traduction.
2. **Le front ensuite** parce que **l'écart se voit à l'œil en quelques secondes**, là où un écart
   dans une spécification demande une relecture. C'est la boucle de retour la plus courte dont
   dispose un développeur seul.
3. **Le backend enfin**, contre des écrans qui existent et un modèle arrêté — donc sans avoir à
   deviner ni la forme des données, ni ce dont l'interface a besoin.

**Ce qui NE change pas** : le périmètre du MVP, les personas, la conformité fiscale, les classes
hors-ligne, le design system et les maquettes déjà produites, la stack backend (Rust, Actix, sqlx,
PostgreSQL). **Deux choses changent en plus de l'ordre** : l'application est une **PWA Nuxt** et
non plus une coquille Tauri (cadrage §13.3), et la doctrine des écrans est **assouplie** — un écran
qui manque se code, il ne bloque plus le cycle (§5, et `docs/Kaya_Design.md` §2).

### 0.1 Préparation (une seule fois)

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init kaya --ai claude
cd kaya
```

Le paquet installé utilise le **tiret** comme séparateur (`/speckit-specify`), conformément à
`.specify/integration.json` → `invoke_separator: "-"`. Tous les prompts de ce fichier l'emploient.

**État réel du dépôt au 2026-08-06 — il ne contient QUE de la documentation :**

```
docs/
├── cadrage-v1.md               source de vérité produit et technique
├── user-stories-v1.md          source de vérité fonctionnelle, priorités
├── registre-classes-offline.md classes A/B/C/D — une entité absente n'est pas implémentable
├── versions-reference.md       versions employées + URL des registres ; §1 = le régime
├── Kaya_Prompts_SpecKit.md     ce fichier
├── Kaya_Design.md              principes, doctrine d'écran, contrat d'écran
├── Kaya_Vision_Plateforme.md   fermé jusqu'au jalon J1
├── module-dore.md              patron de tranche verticale — À LIRE avant tout Rust
├── taxonomie-audit.md          les familles d'actions tracées au registre des actions
├── conformite/                 licences tierces, registre des traitements
└── design/                     ✅ LA MAQUETTE EST PRODUITE ET NE SE REFAIT PAS
    ├── theme.css               ⚠️ SEUL fichier copié vers app/assets/css/
    ├── tokens.md               valeurs curées — PRIME sur tout export
    ├── composants.md           les 16 composants canoniques — FAIT FOI sur le nombre
    ├── mouvement.md            durées, courbes, sept patrons
    ├── styleguide.html         tous les composants, tous états, clair + sombre
    ├── derivation.md           quel écran hérite de quel motif — NORMATIF
    ├── lexique.md              vocabulaire utilisateur — NORMATIF
    ├── html/                   29 fichiers {code}-{nom}[-{etat}].html — 11 écrans — RÉFÉRENCE
    ├── fondation/              directions, mouvement, plaisir, difficiles, illustrations
    ├── documents/              D1-D5 tickets, D6 note provisoire, D7 facture
    └── proto/                  proto-0 à proto-6, prototypes animés
```

> ⚠️ **AUCUN CODE N'EXISTE.** Pas de `backend/`, pas de `app/`, pas de `.specify/`, pas de
> `specs/`. Une version antérieure du projet avait produit du code ; **elle n'est pas dans ce
> dépôt et ne s'y importe pas**. Les documents qui parlent de « cycle 003 », de « porte P-19 » ou
> d'un fichier `app/core/rbac` décrivent cette version antérieure : **leurs raisonnements valent,
> leurs chemins ne valent plus.**
>
> ✅ **SAUF `docs/design/`, qui est bien là, complet et opposable.** Les maquettes, le styleguide,
> les tokens, le lexique et la matrice de dérivation **ne se refont pas** : ils sont l'entrée de la
> phase 2, pas son livrable.

### 0.2 Monorepo — arborescence cible

```
kaya/
├── docs/
│   ├── modele-donnees/           # ⭐ PHASE 1 — LE MODÈLE, UN FICHIER PAR SCHÉMA
│   │   ├── README.md             #   index, conventions, vue d'ensemble des relations
│   │   ├── 00-conventions.sql    #   rôles, extensions, patron RLS, types partagés
│   │   ├── etablissements.sql
│   │   ├── comptes.sql
│   │   ├── caisse.sql
│   │   ├── fiscalite.sql
│   │   ├── documents.sql
│   │   ├── synchronisation.sql
│   │   ├── pilotage.sql
│   │   ├── editeur.sql
│   │   ├── metriques.sql
│   │   ├── stocks.sql
│   │   ├── hebergement.sql
│   │   ├── ventes.sql
│   │   └── pressing.sql
│   └── design/                   # la maquette — lue, jamais copiée (sauf theme.css)
├── app/                          # ⭐ PHASE 2 — PWA Nuxt 4, APPLICATION UNIQUE
│   ├── modules/                  #   reception/ pdv/ caisse/ fiscalite/ direction/ config/
│   ├── core/                     #   auth, rbac, i18n, thème, sync, données, PlatformAdapter
│   │   └── donnees/              #   ⭐ la couche de données : simulée en phase 2, réelle en 3
│   └── public/                   #   manifeste PWA, icônes
├── web/                          # Nuxt — surfaces publiques séparées
│   ├── qr/                       #   page de commande par QR (SSR)
│   └── console/                  #   console éditeur
├── backend/                      # ⭐ PHASE 3 — workspace Rust
│   ├── crates/
│   │   ├── domain/               #   types, règles, moteur fiscal, barèmes — PARTAGÉ
│   │   ├── socle/                #   ← ne dépend QUE de socle/. Jamais de verticales/
│   │   │   ├── etablissements/ comptes/ caisse/ fiscalite/ documents/
│   │   │   ├── synchronisation/ pilotage/ editeur/ metriques/
│   │   │   └── ventes/           #   tronc commun de la vente (catalogue, commande, table)
│   │   ├── capacites/            #   ← dépend de socle/. stocks/ (les autres non implémentées)
│   │   └── verticales/           #   ← dépend de socle/ et capacites/
│   │       ├── hebergement/      #   unités, formules, disponibilité, séjours, réservations
│   │       └── pressing/         #   bons de dépôt, cycle de retrait
│   ├── api/                      # binaire Actix — assemble les crates, expose utoipa
│   └── migrations/               # migrations sqlx versionnées + seeds/
├── clients/ts/                   # client API généré — JAMAIS édité à la main
├── infra/                        # compose dev, paquet auto-hébergé, sauvegardes
├── specs/                        # généré par Spec Kit (un dossier par cycle)
└── .github/workflows/            # CI filtrée par chemins
```

**Cycle type** (identique aux trois phases) :

```
/speckit-constitution   (une seule fois, §1)
puis : /speckit-specify (§3) → /speckit-clarify (§2.1) → /speckit-plan (§2.2)
→ /speckit-tasks (§2.3) → /speckit-analyze (§2.4) → /speckit-implement (§2.5)
→ commit / merge
```

---

## 1. Constitution (à coller une seule fois)

```
/speckit-constitution

Projet : Kaya — plateforme de gestion pour établissements d'hébergement et de
service en Afrique. Pilote : Résidence Hôtel Deloria, Abengourou, Côte d'Ivoire.
Développeur solo. Monorepo unique.

L'ENTITÉ CENTRALE EST L'ÉTABLISSEMENT, PAS L'HÔTEL. Un établissement active les
MODULES D'ACTIVITÉ dont il a besoin (hébergement, restauration, bar, pressing,
salle de réunion). Un maquis seul, un bar seul, un pressing seul et une résidence
meublée seule sont des établissements valides. AUCUN crate partagé ne doit
supposer qu'un établissement possède de l'hébergement, ni qu'il possède un point
de vente.

Documents produit de référence : docs/cadrage-v1.md et docs/user-stories-v1.md —
en cas de doute, ces documents priment sur toute supposition.

Principes non négociables :

0. ORDRE DE CONSTRUCTION — TROIS PHASES, DANS CET ORDRE.
   PHASE 1 : le MODÈLE DE DONNÉES complet, en SQL, dans docs/modele-donnees/,
   un fichier par schéma Postgres. Aucun écran, aucun endpoint.
   PHASE 2 : l'APPLICATION ENTIÈRE avec des DONNÉES SIMULÉES — tous les écrans,
   tous les parcours, cliquables de bout en bout, sans aucun backend.
   PHASE 3 : le BACKEND, qui remplace les données simulées endpoint par endpoint.
   Le motif est la boucle de retour : un écart se voit à l'écran en quelques
   secondes, dans une spécification il demande une relecture — et le développeur
   est seul. Un cycle ne saute pas de phase ; en revanche un cycle de phase 3 peut
   revenir corriger un écran de phase 2, c'est le cas normal.
   RÈGLE DE BRANCHEMENT : aucune donnée simulée ne survit à la mise en service de
   l'endpoint qui la remplace. Le cycle backend qui livre un endpoint SUPPRIME la
   simulation correspondante dans le même changement — un test échoue si une
   simulation subsiste pour un endpoint servi.

1. SOURCES DE VÉRITÉ. (a) Le contrat OpenAPI est généré par utoipa depuis le code
   Actix ; le client TypeScript est généré depuis ce contrat en CI, jamais écrit
   à la main ; un diff de client non commité fait échouer le build. (b) LE MODÈLE
   DE DONNÉES SQL de docs/modele-donnees/ EST SOURCE DE VÉRITÉ AU MÊME TITRE : le
   schéma PostgreSQL n'est modifié que par migrations sqlx versionnées, une
   migration appliquée n'est jamais modifiée, ET TOUTE MIGRATION MET À JOUR LE
   FICHIER DE SON SCHÉMA DANS LE MÊME CHANGEMENT. Un test compare le schéma réel
   de la base aux fichiers et fait échouer le build sur tout écart. Les seeds sont
   rejouables à part. (c) Tout paramètre métier qualifié de « paramétrable » vit
   dans la configuration d'établissement (héritage tenant → établissement →
   module → point de vente, avec surcharge), jamais en dur dans le code. Le
   récapitulatif des paramètres en fin de docs/user-stories-v1.md fait foi.

2. ARCHITECTURE. Monolithe modulaire Rust, microservices-ready : un crate par
   domaine, interfaces par traits, UN SCHÉMA POSTGRES PAR MODULE. Aucune requête
   ne joint deux schémas de modules différents — les lectures inter-modules
   passent par un trait exposé. Aucune transaction SQL ne couvre deux modules ;
   les opérations inter-modules sont des sagas simples avec compensation
   explicite. Toute transition d'état écrit un événement outbox dans la même
   transaction. AUCUN service n'est extrait au MVP, AUCUNE file de messages
   externe n'est introduite — l'outbox est consommé par un worker in-process.
   Le crate domain (moteur fiscal, barèmes, validation, types) est partagé entre
   l'API et le nœud de site : UNE SEULE implémentation du calcul de la taxe de
   nuitée. Redis ne porte que de l'éphémère reconstructible (sessions, file FNE,
   verrous, rate-limit, cache). Garage via API S3. Postgres est la seule vérité
   durable.
   TROIS FAMILLES DE CRATES, HIÉRARCHIE STRICTE : socle/ (etablissements, comptes,
   caisse, fiscalite, documents, synchronisation, pilotage, editeur, metriques,
   ventes) ne dépend QUE de socle/ ; capacites/ (stocks — les autres non
   implémentées) dépend de socle/ ; verticales/ (hebergement, pressing) dépend de
   socle/ et capacites/. UN TEST DE CI ÉCHOUE SI UN CRATE DE socle/ DÉPEND D'UN
   CRATE DE verticales/. LE SOCLE NE CONNAÎT NI « chambre », NI « unité louable »,
   NI « séjour » : il connaît article_vendable et ressource_reservable. Tout le
   spécifique hôtelier vit dans verticales/hebergement. C'est ce qui garde le
   produit extensible à d'autres activités ; sans cette règle, l'hôtellerie
   contamine le noyau en trois cycles.
   MODULE D'ACTIVITÉ ≠ CAPACITÉ : deux référentiels distincts, tous deux en table.
   Le module est la verticale (HEBERGEMENT, RESTAURATION, BAR, PRESSING,
   SALLE_REUNION) ; la capacité est le transverse (STOCK, LIVRAISON, PRODUCTION,
   COMMERCE_EN_LIGNE, FIDELITE, DEVIS, COMPTES_CLIENTS). Un module déclare les
   capacités qu'il consomme. Seule STOCK au profil SIMPLE est implémentée ; toute
   autre valeur est REFUSÉE EXPLICITEMENT, jamais ignorée.

3. MULTI-TENANT. Chaque table porte tenant_id. RLS ENABLE **ET** FORCE sur toutes
   les tables, avec un rôle applicatif distinct du propriétaire des tables.
   SET LOCAL app.current_tenant posé DANS CHAQUE TRANSACTION, jamais à l'ouverture
   de connexion. Un test de CI échoue si une table du schéma n'a aucune politique
   RLS. Un test d'isolation vérifie que le tenant A ne lit ni n'écrit aucune ligne
   du tenant B, sur chaque endpoint.

4. TEMPS ET DISPONIBILITÉ. Une occupation est un intervalle [début, fin) en
   TIMESTAMP AVEC FUSEAU DE L'ÉTABLISSEMENT, JAMAIS une paire de dates — le marché
   pratique massivement le passage horaire et la demi-journée. La disponibilité
   est garantie par une contrainte d'exclusion PostgreSQL
   (EXCLUDE USING gist sur unite_id + tstzrange), pas par un verrou applicatif.
   Le temps de remise en état est intégré à l'intervalle d'indisponibilité.
   Toute logique métier, tout calcul fiscal, toute clôture et TOUT CALCUL DE DURÉE
   DE PASSAGE s'appuient exclusivement sur l'horodatage d'autorité serveur, jamais
   sur l'horloge d'un terminal.

5. ARGENT ET FISCALITÉ. Tous les MONTANTS sont des ENTIERS en unités mineures +
   code ISO 4217 porté par l'établissement (XOF, 0 décimale). En revanche toute
   QUANTITÉ — ligne de vente, mouvement de stock — est en NUMERIC, JAMAIS en
   entier : un hôtel vend 1 bière, une quincaillerie vendra 2,3 mètres de fer,
   une boulangerie achètera 47,5 kg de farine. Passer d'entier à décimal après
   mise en production imposerait de migrer toutes les lignes. Les prix sont
   verrouillés à la création de la ligne. AUCUNE règle fiscale ne vit hors du
   trait JurisdictionAdapter — un seul adaptateur au MVP (CoteDIvoire). Chaque
   formule de location porte assujettie_taxe_nuitee et une règle de conversion :
   le traitement fiscal du passage et de la demi-journée est un PARAMÈTRE, jamais
   une constante. Tout calcul fiscal a un test doré sur jeu de cas figés, exécuté
   en CI. Documents opérationnels et documents fiscaux sont deux agrégats
   étanches, avec deux numérotations et deux cycles de vie ; tout document
   opérationnel porte la mention « Document non fiscal — ne tient pas lieu de
   facture ». L'API FNE n'ayant AUCUNE clé d'idempotence, l'état INDETERMINEE
   (timeout) n'est JAMAIS rejoué automatiquement : rapprochement manuel
   obligatoire. Les id d'items retournés par l'API de certification sont
   persistés — sans eux aucun avoir n'est possible.

6. OFFLINE. Chaque entité déclare sa classe A/B/C/D dans
   docs/registre-classes-offline.md. Une opération B, C ou D atteignable depuis un
   chemin de code exécutable hors ligne FAIT ÉCHOUER LE BUILD. Toute écriture
   porte un UUID v7 client ; le serveur déduplique ; le rejeu est idempotent ; le
   serveur fait foi en conflit. La file se vide AU RETOUR AU PREMIER PLAN par
   défaut (une PWA n'a de synchronisation en arrière-plan sur aucune plateforme de
   façon garantie ; Background Sync est une optimisation Chromium, jamais une
   hypothèse). Aucune donnée B, C ou D en cache d'écriture sur un terminal.
   L'interface annonce immédiatement toute action indisponible faute de réseau —
   jamais de grisé silencieux, jamais d'échec après coup, jamais de mise en file
   « au cas où ». CES RÈGLES S'APPLIQUENT DÈS LA PHASE 2, SUR LES DONNÉES
   SIMULÉES : une opération de classe C doit être refusée hors ligne même quand
   rien n'est branché, sinon l'écran ment et le mensonge se découvre en phase 3.

7. APPLICATION UNIQUE — UNE PWA. Une seule application Nuxt 4, installable,
   fonctionnant hors ligne, pour tous les rôles métier et toutes les plateformes
   (Windows, macOS, Linux, Android, iOS). PAS DE COQUILLE NATIVE AU MVP : ni
   Tauri, ni Electron. Capacitor n'entrera que si un besoin natif se manifeste et
   ne peut pas être servi par une API web — décision à prendre sur un cas réel,
   jamais par anticipation. Les rôles sont CUMULABLES : un utilisateur porte N
   rôles, ses permissions sont l'union — c'est la norme, pas l'exception.
   L'accueil est un tableau de bord de tuiles filtrées par permission, jamais un
   menu figé. Chargement paresseux par module. L'interface ne montre JAMAIS un
   module d'activité inactif : pas de grisé, absent. La même règle vaut pour une
   action qu'une permission interdit : absente, jamais grisée.
   TOUTE CAPACITÉ DE PLATEFORME PASSE PAR PlatformAdapter — impression, scan,
   caméra et OCR, stockage sécurisé, notifications, géolocalisation, état réseau.
   Une seule implémentation au MVP (web), une seconde le jour de Capacitor.
   UNE CAPACITÉ ABSENTE SUR UNE PLATEFORME LE DIT EXPLICITEMENT À L'UTILISATEUR
   ET PROPOSE L'ALTERNATIVE : c'est plus important en PWA qu'en natif, car les
   écarts entre navigateurs sont réels et connus (WebUSB et Web Bluetooth
   absents de Safari, notifications web conditionnées à l'installation sur iOS).

8. QUALITÉ ET INTERFACE. Transitions d'état couvertes par des tests d'intégration ;
   requêtes sqlx vérifiées à la compilation (cargo sqlx prepare). AUCUNE chaîne
   utilisateur en dur : clés i18n fr ET en, fr par défaut. MODE SOMBRE dès le
   premier écran, jamais rétrofitté. Aucune couleur ni espacement littéral hors
   des tokens de docs/design/tokens.md. Logs structurés avec corrélation ;
   Sentry ; /health.
   TOUT CYCLE QUI PRODUIT DES ÉCRANS EST VÉRIFIÉ EN NAVIGATEUR RÉEL, sur les deux
   moteurs (Chromium et WebKit) : un test qui monte un composant ne prouve pas
   qu'une page s'atteint. Le cycle livre un index des écrans navigable, pour que
   la revue se fasse À L'ÉCRAN et non dans les documents.

9. SÉCURITÉ. Le verrouillage par adresse MAC est techniquement impossible — il
   n'est jamais implémenté. À la place : enrôlement d'appareil par paire de clés
   non extractibles (WebCrypto, stockage IndexedDB non exportable) signant chaque
   requête, et liste blanche révocable côté serveur. L'attestation d'intégrité
   n'existe pas sur le web : la sécurité repose sur le serveur, jamais sur une
   promesse du client — c'est une différence réelle avec le natif, elle est
   assumée et écrite. Le géorepérage est SOUPLE : 300 m par défaut, alerte au
   gérant, JAMAIS bloquant sur une action critique. Coffre chiffré par tenant
   pour les clés FNE. Journal d'audit immuable sur remise, annulation, avoir,
   ouverture de tiroir, modification de tarif, changement de rôle, écart de caisse
   et rebascule de palier de passage — module de premier plan, pas journal
   technique. La taxonomie des familles tracées est docs/taxonomie-audit.md.

10. PÉRIMÈTRE. « Prêt ≠ construit » : les provisions du cadrage §14 (adaptateurs
    de juridiction supplémentaires, devises actives, modules additionnels, canal
    TERNE, partenaires externes, contrats et cautions, comptes entreprises, IoT)
    sont des choix de modèle de données uniquement — aucune UI, aucune logique au
    MVP. ELLES EXISTENT DONC EN PHASE 1, ET NULLE PART AILLEURS. Toute
    fonctionnalité qui ne contribue pas à faire abandonner le papier au pilote ou
    à garantir la conformité fiscale est refusée. Les priorités
    P0/P1/P2/PROVISION des user stories font foi.

11. VERSIONS. La DERNIÈRE VERSION STABLE de chaque brique, SAUF CONFLIT CONSTATÉ —
    peerDependency non satisfaite, contrainte de crate incompatible, API rompue
    qui échoue à l'exécution. Dans ce cas on descend AU MINIMUM et on écrit la
    contrainte et sa condition de levée. Toute version est VÉRIFIÉE SUR LE
    REGISTRE OFFICIEL avec l'URL et la date citées, puis ÉPINGLÉE EXACTEMENT (pas
    d'intervalle) et figée par lockfile commité. Ne jamais proposer un numéro de
    version de mémoire. AJOUTER ET MONTER SONT LIBRES EN COURS DE CYCLE, la seule
    condition étant que la suite de tests passe après ; l'inscription à
    docs/versions-reference.md se fait DANS LE MÊME CHANGEMENT. AUCUNE REVUE
    PÉRIODIQUE N'EST PROGRAMMÉE : le développeur est seul, et une échéance
    calendaire manquée une fois est une règle morte. Une seule limite au jugement :
    deux dépendances de la même famille fonctionnelle ne cohabitent pas (§3.4 du
    document).

12. RÉFÉRENCE VISUELLE. docs/design/html/{code}-{nom}[-{etat}].html est la
    RÉFÉRENCE NORMATIVE des onze écrans maquettés : valeurs exactes et hiérarchie
    DOM, un fichier par état. Les fondations sont dans docs/design/fondation/, les
    prototypes animés dans docs/design/proto/, les documents imprimés dans
    docs/design/documents/. docs/design/tokens.md contient les valeurs curées et
    PRIME sur tout export en cas de divergence. docs/design/mouvement.md contient
    les durées et courbes.
    UN ÉCRAN SE CODE DANS QUATRE CAS : (a) maquetté — un fichier d'état ; (b)
    dérivé — une ligne de docs/design/derivation.md qui dit de quel motif il
    hérite ; (c) composé — assemblé à partir des seize composants canoniques ;
    (d) DÉCOUVERT À L'IMPLÉMENTATION — un écran que les documents n'avaient pas
    prévu et sans lequel un parcours ne se termine pas. LE QUATRIÈME CAS EST
    AUTORISÉ ET N'ARRÊTE PAS LE CYCLE : l'écran se code avec les composants
    existants, le lexique et les tokens, PUIS S'INSCRIT À docs/design/derivation.md
    dans le même changement, avec la mention « découvert à l'implémentation, à
    valider ». Ce qu'on refuse n'est pas d'inventer un écran, c'est de l'inventer
    EN SILENCE — trente écrans non inscrits finissent par ne plus se ressembler.
    LE HTML DE MAQUETTE N'EST JAMAIS COPIÉ NI DÉPLACÉ VERS app/ — c'est une cible,
    pas une source : il est autonome, non sémantique, sans i18n, sans mode sombre
    câblé, sans RBAC. On lit ses valeurs, on réimplémente. SEULE EXCEPTION :
    docs/design/theme.css, le bloc @theme Tailwind 4, est copié tel quel dans
    app/assets/css/ — c'est lui qui porte les tokens.
    TAILWIND 4 D'ABORD, CSS EN DERNIER RECOURS : tout style s'exprime en
    utilitaires du noyau référençant les tokens de @theme ; le mode sombre passe
    par la variante dark:, jamais par une seconde palette ; aucune classe
    personnalisée ni style en ligne ; le CSS explicite est réservé à ce que
    Tailwind n'exprime pas (@keyframes, impression thermique) et reste regroupé.
    Une seule identité visuelle sur toutes les plateformes.

PORTES DE CI. Chaque règle vérifiable mécaniquement ci-dessus devient une porte
bloquante, numérotée P-01 et suivantes, listée dans une section « Couverture des
portes ». Chaque porte DÉCLARE SON PÉRIMÈTRE INSPECTÉ, VÉRIFIE SA COMPLÉTUDE, NE
MODIFIE PAS CE QU'ELLE INSPECTE, ET PROUVE QUE SA CIBLE N'EST PAS VIDE — une porte
qui ne trouve jamais rien est indistinguable d'une porte qui n'a rien à trouver.
Chaque porte a un test négatif : on la casse volontairement une fois pour vérifier
qu'elle échoue.
```

---

## 2. Prompts communs (identiques à chaque cycle, à coller tels quels)

> **Règle de rédaction de cette section.** Ces cinq prompts sont **universels** : un seul jeu à
> maintenir, collé tel quel du premier cycle au dernier. Ils ne contiennent donc que des
> **invariants** — jamais « crée », « première tâche », ni aucune injonction qui n'a de sens
> qu'une fois. Tout ce qui est propre à un cycle appartient à son prompt `/speckit-specify` du §3.
>
> Corollaire assumé : un cycle de phase 1 recevra les paragraphes sur les écrans sans en avoir
> besoin, et un cycle de phase 2 ceux sur sqlx. **Chaque prompt dit lui-même à quelle phase
> s'applique chaque paragraphe** — c'est du bruit inoffensif, et c'est le prix d'un jeu unique
> plutôt que de trois variantes à faire dériver.

### 2.1 `/speckit-clarify`

```
/speckit-clarify

Avant de me poser une question, vérifie si la réponse est dans docs/cadrage-v1.md
ou docs/user-stories-v1.md et cite la section. Ne me pose que les questions dont
la réponse n'y figure pas.

Toute ambiguïté sur un montant, un seuil, un délai ou un barème se résout par le
« Récapitulatif des paramètres d'établissement » en fin de docs/user-stories-v1.md
(valeur seed, éditable).
Toute ambiguïté sur une TABLE, une COLONNE, un TYPE ou une CONTRAINTE se résout
par docs/modele-donnees/{schema}.sql, qui fait foi dès qu'il existe.
Toute ambiguïté visuelle se résout par docs/design/html/{code}-{nom}[-{etat}].html
(RÉFÉRENCE : valeurs exactes et hiérarchie DOM), docs/design/tokens.md (qui PRIME
en cas de divergence), docs/design/composants.md, docs/design/mouvement.md et la
MATRICE DE DÉRIVATION docs/design/derivation.md.
Toute ambiguïté de VOCABULAIRE UTILISATEUR se résout par le LEXIQUE
docs/design/lexique.md — si le terme n'y figure pas, propose-moi sa formulation
avant de l'écrire en dur.
Toute ambiguïté sur le comportement hors ligne se résout par docs/cadrage-v1.md
§11 et docs/registre-classes-offline.md.

JE SUIS SEUL ET JE N'AURAI PAS LE TEMPS DE TOUT RELIRE. Regroupe tes questions,
propose pour chacune une réponse par défaut argumentée, et n'attends une réponse
que sur celles où te tromper coûterait une migration, une erreur fiscale ou un
écran à refaire. Pour tout le reste : décide, écris ta décision et son motif dans
la spec, et continue.
```

### 2.2 `/speckit-plan`

```
/speckit-plan

VERSIONS : docs/versions-reference.md FAIT FOI, et son §1 tient en une phrase —
LA DERNIÈRE STABLE, SAUF CONFLIT CONSTATÉ.

Reprends les valeurs déjà inscrites sans les revérifier. Pour ce qui manque, tu es
LIBRE d'ajouter, et LIBRE de monter une version existante, en cours de cycle, sans
demander la permission. N'écris pas soixante lignes à la main pour éviter une
bibliothèque. Quatre obligations, aucune n'étant une autorisation à obtenir :
  1. épinglage EXACT et lockfile commité — sans exception ;
  2. version vérifiée sur le registre officiel, URL et date en commentaire
     au-dessus de la ligne du manifeste, avec le rôle. Jamais de mémoire ;
  3. le commentaire dit POURQUOI ce qui est déjà là ne suffit pas ;
  4. après une MONTÉE, la suite de tests passe — c'est la seule condition, et elle
     remplace la revue mensuelle qui n'existe plus.
Puis inscris la ligne au §3.1 ou §3.2 du document DANS LE MÊME CHANGEMENT. Vérifie
le §3.4 avant : deux membres d'une même famille ne cohabitent pas, et une famille
absente de ce tableau est une famille non encore rencontrée — si tu l'ouvres, tu
tranches pour tout le dépôt et tu inscris sa ligne.

Stack imposée (cadrage v1 §13 + docs/versions-reference.md — non négociable) :
- Modèle de données : PostgreSQL, un schéma par module, RLS ENABLE **et** FORCE,
  migrations sqlx versionnées. docs/modele-donnees/{schema}.sql est le miroir du
  schéma réel et se met à jour DANS LE MÊME CHANGEMENT que toute migration.
- Application : Nuxt 4 en SSR désactivé + Tailwind 4, en PWA INSTALLABLE (service
  worker, manifeste, fonctionnement hors ligne) — UNE SEULE application pour tous
  les rôles métier, chargement paresseux par module, PlatformAdapter obligatoire,
  mode sombre et i18n fr/en dès le premier écran. AUCUNE COQUILLE NATIVE : ni
  Tauri ni Electron. Capacitor est une option future, pas une dépendance.
- Surfaces web séparées : page publique de commande par QR (Nuxt SSR), console
  éditeur (ssr:false).
- Backend (phase 3) : Rust, Actix Web, sqlx + PostgreSQL, utoipa +
  utoipa-swagger-ui, Redis (éphémère reconstructible SEULEMENT), Garage (API S3).
- CIBLE DE DÉPLOIEMENT : Docker sur VPS Contabo, linux/amd64 (mode A du cadrage
  §10.1). Le poste de développement est arm64 : les images Postgres, Redis et
  Garage sont multi-architecture, mais LE BINAIRE RUST NE L'EST PAS — la
  construction de production se fait dans Docker pour linux/amd64.
- sqlx est en 0.9 : AssertSqlSafe est exigé sur toute requête non littérale et la
  sortie des macros query!() a changé. Tout extrait visant 0.8.x ne compilera pas.
  Le patron de référence est docs/module-dore.md — aligne-toi dessus plutôt que sur
  un exemple trouvé en ligne.

Respecte la constitution (.specify/memory/constitution.md — la version du dépôt
fait foi, ne cite pas un numéro de mémoire), en particulier :
l'ORDRE DES TROIS PHASES (principe 0) ; l'établissement est l'entité centrale et
aucun crate ne suppose qu'il a de l'hébergement ou un point de vente ; le socle ne
connaît que article_vendable et ressource_reservable ; la disponibilité est un
intervalle horodaté garanti par contrainte d'exclusion GiST ; aucune règle fiscale
hors JurisdictionAdapter ; montants en entiers d'unité mineure ET quantités en
NUMERIC ; chaque entité déclare sa classe dans docs/registre-classes-offline.md ;
les provisions sont des données seulement.

PORTES DE CI : le plan doit dire, pour chaque porte que ce cycle touche, COMMENT
elle est vérifiée et par quel test. Une porte concernée sans mécanisme de
vérification est un trou du plan.

Livrables attendus du plan, SELON LA PHASE :
- Phase 1 : les fichiers de docs/modele-donnees/ créés ou modifiés, table par
  table, avec politiques RLS, privilèges, contraintes, index, et la classe
  hors-ligne de chaque entité.
- Phase 2 : les écrans concernés avec leur référence visuelle, les composants
  employés, les parcours cliquables de bout en bout, le jeu de données simulées
  et sa conformité au modèle de données, les états (vide, chargement, erreur,
  hors ligne) et les tests de navigateur.
- Phase 3 : migrations à créer, endpoints avec annotations utoipa, structures et
  traits exposés aux autres crates, événements outbox émis, tests d'intégration
  dont les tests offline obligatoires, ET LA LISTE DES SIMULATIONS QUE CE CYCLE
  SUPPRIME.
```

### 2.3 `/speckit-tasks`

```
/speckit-tasks

Découpe en tâches d'une demi-journée à une journée maximum, ordonnées par
dépendance.

PHASE 1 — chaque tâche produit ou modifie un fichier de docs/modele-donnees/ et se
termine par : le SQL s'applique sur une base vierge sans erreur, chaque table a sa
politique RLS, chaque entité a sa classe déclarée dans
docs/registre-classes-offline.md.

PHASE 2 — chaque tâche livre un ou plusieurs ÉCRANS ATTEIGNABLES. Une tâche qui
produit un composant sans écran qui l'affiche n'est pas terminée. Chaque tâche se
termine par : l'écran s'ouvre en navigateur, en clair ET en sombre, avec ses états
vide / chargement / erreur / hors ligne.

PHASE 3 — chaque tâche qui touche le schéma COMMENCE par sa migration sqlx,
politiques RLS incluses, ET MET À JOUR docs/modele-donnees/{schema}.sql dans la
même tâche. Chaque tâche qui touche l'API SE TERMINE par la mise à jour des
annotations utoipa + la régénération du client TypeScript + build vert. Chaque
tâche qui met un endpoint en service SUPPRIME la donnée simulée correspondante.

RÉFÉRENCE VISUELLE — SI ce cycle produit des écrans. LE DÉCOMPTE D'ÉCRANS SE LIT
DANS docs/design/derivation.md, JAMAIS ICI : tout nombre recopié dans ce prompt est
faux avant d'être lu. Chaque tâche d'interface cite sa référence, qui est dans l'un
de ces QUATRE cas :
(a) ÉCRAN MAQUETTÉ — un fichier d'état de docs/design/html/, nommage
    {code}-{nom}[-{etat}].html. La référence est le fichier d'état exact.
(b) ÉCRAN DÉRIVÉ — sa ligne de docs/design/derivation.md, qui dit de quel motif il
    hérite et ce qui change. Ouvre la maquette dont il hérite et respecte-la.
(c) ÉCRAN COMPOSÉ — ni maquetté ni dérivé, assemblé UNIQUEMENT à partir des seize
    composants canoniques de docs/design/composants.md. Réservé à la ZONE DE
    CHARME (configuration, référentiels, réglages) : un écran de zone de vitesse
    porte une intention dessinée qu'un assemblage ne retrouvera pas.
(d) ÉCRAN DÉCOUVERT À L'IMPLÉMENTATION — les documents ne l'avaient pas prévu, et
    sans lui un parcours ne se termine pas ou une donnée du modèle n'a aucun
    endroit où vivre. CODE-LE. Ne t'arrête pas, ne me demande pas d'abord.
    Trois obligations, qui tiennent en une tâche :
      · il n'emploie que les composants, tokens et termes du lexique existants ;
      · s'il tombe en ZONE DE VITESSE (utilisateur debout, pressé, client en face,
        argent en jeu — Kaya_Design.md §1), tu le codes quand même mais tu le
        SIGNALES comme « à maquetter avant le pilote » ;
      · il s'inscrit à docs/design/derivation.md DANS LE MÊME CHANGEMENT, avec la
        mention « découvert à l'implémentation, à valider » et la liste des
        composants employés.
    Le risque à écarter n'est pas d'inventer un écran, c'est de l'inventer EN
    SILENCE : trente écrans non inscrits finissent par ne plus se ressembler.
    SI UN COMPOSANT MANQUE À LA BIBLIOTHÈQUE, c'est le seul cas où tu t'arrêtes et
    tu me le signales — un composant nouveau se dessine, il ne s'improvise pas.

LE HTML DE MAQUETTE N'EST JAMAIS COPIÉ NI DÉPLACÉ VERS app/ : on en lit les valeurs
et la structure, on réimplémente en composants Nuxt avec i18n, mode sombre, RBAC et
chargement paresseux — que l'export ne contient pas.

Tout terme technique visible par l'utilisateur passe par le LEXIQUE,
docs/design/lexique.md (« certification FNE » devient « envoi aux impôts », un état
INDETERMINEE devient « nous ne savons pas si les impôts ont reçu cette facture »).
Si le terme n'y figure pas, ajoute-le au lexique dans le même changement et
signale-le-moi — n'écris jamais un terme technique en dur en attendant.

Les tâches P1 sont placées en fin de liste pour être livrables après le cœur P0.
Termine la liste par une tâche « revue Definition of Done »
(docs/user-stories-v1.md §0.4).
```

### 2.4 `/speckit-analyze`

```
/speckit-analyze

Vérifie la cohérence spec ↔ plan ↔ tâches ↔ constitution. Signale :
- toute exigence des stories du périmètre de ce cycle non couverte par une tâche ;
- toute tâche qui déborde du périmètre (P2, PROVISION, hors-périmètre listés dans
  la spec) ;
- TOUTE VIOLATION DE L'ORDRE DES PHASES (principe 0) : un endpoint en phase 2, un
  écran en phase 1, une donnée simulée qui survit à son endpoint en phase 3 ;
- TOUT ÉCART ENTRE LE CODE ET docs/modele-donnees/ : une migration sans mise à jour
  du fichier de schéma, une colonne du code absente du modèle, ou l'inverse ;
- toute violation des principes 2 (schéma par module, pas de jointure inter-
  schémas, outbox), 3 (RLS forcée, tenant_id), 4 (intervalles horodatés, horodatage
  d'autorité), 5 (entiers, adaptateur de juridiction, idempotence FNE), 6 (classes
  offline), 7 (PWA, aucune coquille native, capacité absente annoncée) et 10
  (périmètre) ;
- toute table créée sans politique RLS ;
- toute entité créée sans classe offline déclarée ;
- tout paramètre métier codé en dur qui devrait vivre dans la configuration
  d'établissement ;
- tout écran codé sans référence dans l'un des QUATRE cas, ou codé au titre du
  quatrième cas SANS être inscrit à docs/design/derivation.md ;
- toute porte de la constitution concernée par ce cycle sans mécanisme de
  vérification dans le plan ou les tâches ;
- tout second membre d'une famille exclusive du §3.4 de docs/versions-reference.md ;
- toute dépendance en intervalle, ou absente de docs/versions-reference.md.
```

### 2.5 `/speckit-implement`

```
/speckit-implement

Implémente les tâches dans l'ordre. Après chaque tâche : compile, teste, commite
avec un message conventionnel référençant la story (ex. "feat(hebergement): HEB-04
barème dégressif du passage avec rebascule de palier").

JE VALIDE À L'ÉCRAN, PAS DANS LES DOCUMENTS. Si ce cycle produit des écrans, il
n'est pas fini tant que je ne peux pas voir le résultat en trois clics :
[ ] l'application démarre par une commande unique, documentée dans le README
[ ] chaque écran du cycle s'atteint en navigateur RÉEL, vérifié sur Chromium ET
    WebKit — pas seulement par un test qui monte un composant
[ ] un index des écrans les liste tous avec un lien direct, à jour
[ ] chaque écran est vu en clair ET en sombre
[ ] le parcours complet du cycle se déroule du début à la fin sans blocage
[ ] tu me dis, en trois lignes, CE QUE JE DOIS REGARDER et ce qui reste faux

À la fin, déroule cette checklist et liste ce qui resterait non conforme. Les
lignes marquées [phase N] ne s'appliquent qu'à cette phase-là ; déclare « sans
objet » plutôt que de cocher en silence.

[ ] [phase 1] Chaque table du cycle figure dans docs/modele-donnees/{schema}.sql
[ ] [phase 1] Le SQL s'applique sur une base vierge, sans erreur, dans l'ordre
[ ] [phase 1+3] RLS ENABLE + FORCE sur chaque table ; privilèges reflétant la classe
[ ] [phase 1+3] Classe offline déclarée pour chaque entité dans le registre
[ ] [phase 2] Chaque écran a sa référence : maquette, ligne de dérivation,
    composition, ou inscription « découvert à l'implémentation »
[ ] [phase 2] Aucun bloc de docs/design/html/ copié dans app/ ; valeurs conformes
    à tokens.md
[ ] [phase 2] Styles en utilitaires Tailwind du noyau ; CSS explicite justifié
[ ] [phase 2] Mode sombre par la variante dark:, pas par une palette dupliquée
[ ] [phase 2] Les données simulées ont la FORME du modèle de données : mêmes noms
    de champs, mêmes types, mêmes valeurs d'énumération
[ ] [phase 2] Une opération de classe B/C/D est refusée hors ligne, avec son
    explication, MÊME sur données simulées
[ ] [phase 2] L'application s'installe et se lance hors ligne (manifeste + service
    worker), sur les deux moteurs
[ ] [phase 3] Annotations utoipa à jour ; client TS régénéré, aucun diff
[ ] [phase 3] Migrations sqlx versionnées ; cargo sqlx prepare vert ; seeds à jour
[ ] [phase 3] docs/modele-donnees/ mis à jour dans le même changement que la
    migration ; le test de comparaison schéma ↔ fichiers est vert
[ ] [phase 3] Événements outbox émis pour chaque transition d'état
[ ] [phase 3] Test d'isolation multi-tenant vert sur chaque endpoint
[ ] [phase 3] Tests de classe offline instanciés pour chaque entité
[ ] [phase 3] LES DONNÉES SIMULÉES DES ENDPOINTS LIVRÉS SONT SUPPRIMÉES
[ ] Aucune chaîne en dur : clés i18n fr ET en présentes
[ ] Aucun terme technique exposé sans entrée au lexique docs/design/lexique.md
[ ] Aucun paramètre métier en dur (configuration d'établissement)
[ ] Montants en entiers + devise ; quantités en NUMERIC ; aucune règle fiscale
    hors JurisdictionAdapter
[ ] Aucune capacité de plateforme appelée hors PlatformAdapter
[ ] Rien construit au-delà du périmètre (provisions = données seulement)
[ ] Aucune dépendance en intervalle ; lockfiles commités ; versions inscrites à
    docs/versions-reference.md
[ ] Chaque porte concernée par le cycle est vérifiée par un test qui échoue
    vraiment — testé en le cassant volontairement une fois
```

---

## 3. Les cycles, par phase

> **Comment lire ce chapitre.** Chaque cycle est un prompt `/speckit-specify` à coller tel quel,
> suivi des quatre prompts communs du §2. L'ordre des cycles à l'intérieur d'une phase est celui
> des dépendances ; l'ordre des phases ne se négocie pas.

---

## PHASE 1 — LE MODÈLE DE DONNÉES

**Deux cycles, aucun écran, aucun endpoint.** Le livrable est
`docs/modele-donnees/{schema}.sql` : du SQL lisible, applicable sur une base vierge, qui contient
**tout le MVP, provisions comprises**.

**Pourquoi tout d'un coup plutôt que module par module** : parce que le modèle est ce qu'on ne veut
pas migrer. Une colonne oubliée sur `article` coûte quelques minutes maintenant et une migration de
toutes les lignes de vente dans six mois. Et parce que la phase 2 en a besoin **entier** : les
données simulées prennent la forme des tables, et une table qui n'existe pas encore produit un mock
inventé, donc un branchement à retraduire.

### Cycle D1 — Modèle de données du socle

```
/speckit-specify

Lis, dans cet ordre : docs/cadrage-v1.md (§4 modèle d'entité, §5 hébergement,
§8 caisse, §9 fiscalité, §11 classes hors-ligne, §14 provisions),
docs/user-stories-v1.md (tous les modules — c'est la source des entités),
docs/registre-classes-offline.md (INTÉGRALEMENT : il nomme déjà la plupart des
tables et leur classe), et docs/Kaya_Vision_Plateforme.md §8 et §14.5 (les treize
amendements A1 à A13, qui sont des contraintes de modèle et rien d'autre).

Fonctionnalité : LE MODÈLE DE DONNÉES DU SOCLE, EN SQL, ÉCRIT AVANT TOUT CODE.

CE CYCLE NE PRODUIT NI ÉCRAN, NI ENDPOINT, NI CRATE RUST, NI MIGRATION. Il produit
des fichiers SQL de référence dans docs/modele-donnees/, un par schéma Postgres :
  00-conventions.sql   rôles kaya_owner / kaya_app, extensions (btree_gist,
                       pgcrypto si besoin), patron RLS commenté, types et domaines
                       partagés, conventions de nommage
  etablissements.sql   tenant, etablissement, module_activite, capacite,
                       module_capacite, profil_stock, etablissement_module,
                       point_de_vente, table_pdv, parametre_catalogue,
                       parametre_configuration, branding, note_etablissement
  comptes.sql          personne, compte, methode_authentification, role,
                       permission, role_permission, compte_role, appareil_enrole,
                       journal_audit, employe (PROVISION)
  caisse.sql           caisse, shift, encaissement, sortie_de_caisse, comptage,
                       ecart_de_caisse, cloture_shift, cloture_journaliere,
                       compte_client / encours / condition_reglement (PROVISION)
  fiscalite.sql        parametrage_fiscal, cle_fne (coffre chiffré),
                       document_fiscal, item_certifie, avoir, file_certification,
                       compteur_stickers, etat_reversement_communal,
                       devis / document_commercial (PROVISION), rne_ref (PROVISION)
  documents.sql        document_operationnel, numerotation_document,
                       modele_document
  synchronisation.sql  evenement_outbox, reconciliation_orpheline
  pilotage.sql         alerte_configurable, et ce qui n'est pas dérivé
  editeur.sql          plan, palier, abonnement, unite_facturable,
                       telemetrie_parc, bundle_diagnostic
  metriques.sql        evenement_metrique, agregat_quotidien
  Plus, en PROVISION (tables seulement, aucune logique) : mapping_comptable et
  exercice_comptable ; partenaire (tenant_id NULLABLE), demande_partenaire,
  compte_compensation, mouvement_compensation ; dispositif (contrôle d'accès).

CE QUE CHAQUE FICHIER DOIT CONTENIR, POUR CHAQUE TABLE :
1. CREATE SCHEMA puis CREATE TABLE, colonnes typées, contraintes nommées.
2. tenant_id sur CHAQUE table, plus ENABLE et FORCE ROW LEVEL SECURITY, plus la
   politique isolation_tenant en USING **et** WITH CHECK, avec le second argument
   `true` de current_setting — les trois éléments, aucun optionnel.
3. LES PRIVILÈGES GRANT DISENT LA CLASSE HORS-LIGNE : une entité append-only de
   classe A reçoit SELECT, INSERT et JAMAIS UPDATE ni DELETE ; une provision sans
   logique reçoit SELECT seul, ou rien du tout quand rien n'a de raison de la lire.
   C'est le privilège qui PROUVE la propriété, pas le commentaire.
4. Un commentaire d'en-tête par table : à quoi elle sert, sa CLASSE A/B/C/D avec
   son code de branche (D1/C2/B3/A4), et la story qui l'introduit.
5. Les index nécessaires aux recherches nommées dans les stories (ex. recherche
   client par nom, téléphone ou pièce en moins de 300 ms sur 10 000 fiches).

DIX RÈGLES DE MODÈLE À NE PAS MANQUER — chacune coûte des minutes aujourd'hui et
une migration de toutes les lignes plus tard :
(1) IDENTIFIANT UUID FOURNI PAR LE CLIENT, jamais généré par la base : c'est ce qui
    rend le rejeu inoffensif. UUID v7, donc ordonné dans le temps.
(2) DEUX HORODATAGES DISTINCTS ET JAMAIS FUSIONNÉS : horodatage_client NULLABLE et
    purement indicatif, cree_le NOT NULL DEFAULT now() qui fait AUTORITÉ. Aucune
    règle métier, fiscale, de clôture ou de durée ne s'appuie sur le premier.
(3) AUCUNE CLÉ ÉTRANGÈRE ENTRE DEUX SCHÉMAS DE MODULES DIFFÉRENTS. C'est le point
    le plus contre-intuitif : même quand la table cible existe, une FK joindrait
    deux modules, ce que l'architecture interdit. L'intégrité inter-modules passe
    par un trait exposé, jamais par la base. À l'intérieur d'un même schéma, les FK
    sont normales et souhaitables.
(4) MONTANTS EN ENTIERS d'unité mineure + code ISO 4217 porté par l'établissement.
(5) QUANTITÉS EN NUMERIC, JAMAIS EN ENTIER (amendement A2).
(6) unite_mesure OBLIGATOIRE sur article, défaut 'unite' ; table
    conversion_unite_mesure CRÉÉE et NON EXPLOITÉE (A3).
(7) cout_unitaire NULLABLE sur mouvement_stock, JAMAIS renseigné au MVP (A4).
(8) code_barre et article_parent_id NULLABLES sur article, non utilisés (A5).
(9) MODULE D'ACTIVITÉ ET CAPACITÉ SONT DEUX RÉFÉRENTIELS DISTINCTS, tous deux en
    TABLE, avec profil_stock sur le module (A6, A7).
(10) unite_facturable est une MÉTRIQUE ABSTRAITE définie par la verticale, jamais
     « chambre » en dur (A11).

TROIS PIÈGES DE MIGRATION À CONSIGNER EN COMMENTAIRE, pour la phase 3 :
- Un INSERT ou un UPDATE de migration NE FONCTIONNE PAS sur une table en FORCE ROW
  LEVEL SECURITY, et NE SE PLAINT PAS : la politique s'applique au propriétaire,
  current_setting vaut NULL, aucune ligne n'est touchée, la migration réussit en
  n'écrivant rien. Les trois formes qui marchent : ADD COLUMN ... NOT NULL DEFAULT
  (du DDL, hors politique) ; peupler un référentiel AVANT d'activer la RLS ; ou
  poser dès la création une politique FOR ALL TO kaya_owner.
- Une CONTRAINTE D'EXCLUSION ajoutée sur une table déjà peuplée échoue sur les
  données existantes : elle se pose à la création.
- Une SEQUENCE Postgres n'est pas transactionnelle et laisse des trous. Toute
  numérotation qui doit être CONTINUE (fiche de police, numéro de retrait pressing,
  référence à emporter) est un COMPTEUR EN TABLE avec verrou de ligne, jamais une
  SEQUENCE.

LIVRABLE COMPLÉMENTAIRE : docs/modele-donnees/README.md — l'index des fichiers, le
schéma des relations principales en texte, la liste des tables avec leur classe
hors-ligne, et la RÈGLE DE TENUE : « toute migration de phase 3 met à jour le
fichier de son schéma dans le même changement ; un test compare le schéma réel aux
fichiers et échoue sur tout écart ».

Mets à jour docs/registre-classes-offline.md pour toute entité que tu nommes et
qu'il ne nomme pas encore — c'est le seul document que ce cycle modifie en plus des
siens.

Hors périmètre : le schéma hebergement, ventes, pressing et stocks (cycle D2) ;
toute migration sqlx ; tout code Rust ; tout écran.
Personas : aucun — ce cycle ne produit pas d'interface.
Points d'attention : docs/registre-classes-offline.md nomme déjà la plupart de ces
tables avec leur classe, décidées à froid. HONORE CES LIGNES, ne les réécris pas.
Quand une table y est décrite sans être nommée (« plages de demi-journée »),
c'est toi qui poses le nom, et tu l'inscris au registre.
```

### Cycle D2 — Modèle de données des capacités et des verticales

```
/speckit-specify

Lis docs/cadrage-v1.md §5 (hébergement, formules, disponibilité) et §6 (points de
vente), docs/user-stories-v1.md modules HEB, SEJ, RSV, PDV, QRC, STK, et
docs/registre-classes-offline.md §6, §7 et §8.

Fonctionnalité : LE MODÈLE DE DONNÉES DES CAPACITÉS ET DES VERTICALES, EN SQL.

Mêmes règles, mêmes livrables et mêmes interdits que le cycle D1 — relis-en la
liste, elle s'applique intégralement. Fichiers produits :
  stocks.sql        article_stock, point_de_stock, liaison catalogue → stock,
                    mouvement_stock, inventaire, alerte_seuil
  hebergement.sql   categorie, unite, temps_remise_en_etat, formule,
                    bareme_palier, plage_demi_journee, calendrier_tarifaire,
                    occupation, client, preference_personne, sejour, accompagnant,
                    note_sejour, ligne_sejour, fiche_police,
                    numerotation_fiche_police, taxe_sejour_constat, reservation,
                    arrhes, incident_maintenance, intervention,
                    prestation_incluse (PROVISION), contrat_location / caution /
                    charge_locative / etat_des_lieux (PROVISION)
  ventes.sql        article, categorie_article, destination_preparation, commande,
                    ligne_commande, lot_envoi, remise, part_addition,
                    numerotation_reference, jeton_table
  pressing.sql      bon_depot, piece_deposee, numerotation_retrait

QUATRE POINTS QUI DÉCIDENT DU PRODUIT, ET QU'UN MODÈLE APPROXIMATIF PERD :
(1) L'OCCUPATION EST UN INTERVALLE tstzrange, JAMAIS UNE PAIRE DE DATES, et la
    disponibilité est garantie par
    EXCLUDE USING gist (unite_id WITH =, periode WITH &&) — le chevauchement
    devient impossible AU NIVEAU DE LA BASE. C'est la décision la plus structurante
    et la plus irréversible du produit : le marché pratique massivement le passage
    horaire et la demi-journée. Le TEMPS DE REMISE EN ÉTAT est intégré à
    l'intervalle d'indisponibilité, jamais géré à part.
(2) temps_remise_en_etat EST UNE TABLE, pas une colonne : la durée varie par
    catégorie ET par formule, ce qu'une colonne ne porte pas.
(3) destination_preparation EST UNE TABLE, pas une énumération : « cuisine » et
    « bar » ne sont pas les mêmes chez tous les exploitants, et une valeur en dur
    imposerait une migration au premier client qui a deux cuisines. Elle est
    FACULTATIVE sur l'article : à défaut, l'envoi suit celle du point de vente,
    pour qu'aucun bon ne manque.
(4) lot_envoi EST IMMUABLE PAR PRIVILÈGE — GRANT SELECT, INSERT seuls : un second
    envoi crée un second lot, il ne modifie pas le premier. Même régime pour
    taxe_sejour_constat, qui fige le constat au départ.

DEUX RELATIONS INTER-MODULES À MODÉLISER SANS CLÉ ÉTRANGÈRE, et à commenter comme
telles : une ligne de commande reportée sur la note d'un séjour (ventes →
hebergement) et un bon de dépôt rattaché à un séjour (pressing → hebergement). Ce
sont des SAGAS À COMPENSATION EXPLICITE, dont le cas orphelin — la note est déjà
arrêtée — est le chemin NOMINAL, pas l'exception.

Hors périmètre : les schémas du socle (cycle D1), toute migration, tout code, tout
écran.
Points d'attention : le registre des classes hors-ligne §7 et §8 est déjà écrit et
détaillé. Honore-le. Une même table peut porter DEUX classes selon l'opération —
ligne_commande est A à la saisie et B à l'annulation après envoi — et c'est le cas
normal : le commentaire de table doit le dire, et les privilèges doivent permettre
les deux.
```

---

## PHASE 2 — L'APPLICATION ENTIÈRE, EN DONNÉES SIMULÉES

**Sept cycles, aucun backend.** Le livrable est une PWA Nuxt installable où **tous les parcours du
MVP se déroulent de bout en bout** sur des données simulées conformes au modèle de la phase 1.

**Ce que cette phase achète** : la possibilité de voir l'écart en quelques secondes, sur l'écran,
plutôt que de le chercher dans une spécification. C'est la seule boucle de retour praticable pour
un développeur seul.

**Les trois règles de la donnée simulée :**

1. **Elle a la forme du modèle** — mêmes noms de champs, mêmes types, mêmes valeurs
   d'énumération que `docs/modele-donnees/`. Une simulation qui invente sa forme se retraduit en
   phase 3, et la traduction est exactement le travail qu'on cherche à éviter.
2. **Elle vit dans une seule couche**, `app/core/donnees/`, derrière la même interface que le
   client réel appellera. Aucun composant ne connaît sa provenance.
3. **Elle ment sur la source, jamais sur le comportement** : latences, échecs, refus hors ligne,
   permissions manquantes, états vides sont **simulés pour de vrai**. Un écran qui n'a jamais vu
   d'erreur en phase 2 la découvrira en production.

### Cycle F1 — Fondations de l'application

```
/speckit-specify

Lis docs/Kaya_Design.md (parties I à III), docs/design/tokens.md,
docs/design/composants.md, docs/design/mouvement.md, docs/design/styleguide.html,
docs/design/lexique.md, et docs/user-stories-v1.md TRX-08.

Fonctionnalité : la coquille de l'application — PWA Nuxt 4, design system, thème,
i18n, couche de données simulées.

CE CYCLE NE PRODUIT AUCUN ÉCRAN MÉTIER. Il produit ce sans quoi les six cycles
suivants réinventeraient chacun leur version. Livrables :

1. PROJET NUXT 4 EN SPA (ssr: false) + Tailwind 4. docs/design/theme.css est COPIÉ
   TEL QUEL dans app/assets/css/ — c'est le SEUL fichier de docs/design/ qui se
   copie. Vérifie que le styleguide s'affiche à l'identique dans le projet réel :
   la maquette charge Tailwind par CDN, le build ne compile que ce qu'il trouve, et
   un utilitaire qui venait du CDN manquera en silence.

2. PWA INSTALLABLE : manifeste (nom, icônes, couleur de thème, orientation,
   display standalone), service worker, stratégie de cache. L'application doit
   S'OUVRIR ET S'AFFICHER HORS LIGNE dès ce cycle, même si elle n'a rien à montrer :
   c'est la propriété la plus difficile à rétrofitter. Vérifie l'installation sur
   Chromium ET sur WebKit — iOS impose ses propres règles (installation depuis le
   menu de partage, pas de bannière automatique) et c'est la moitié du parc.

3. LES SEIZE COMPOSANTS CANONIQUES de docs/design/composants.md, dans tous leurs
   états, en clair et en sombre, plus UN STYLEGUIDE INTERNE à l'application qui les
   montre tous. Le styleguide n'est pas un livrable de confort : c'est la page que
   j'ouvre pour voir si le design system tient.

4. THÈME CLAIR ET SOMBRE par la variante dark: UNIQUEMENT, jamais par une seconde
   palette. Les noms de jetons sont identiques dans les deux thèmes et seules les
   valeurs changent. Un script en ligne dans le head applique la classe AVANT le
   premier pixel — sinon l'utilisateur en mode sombre voit un éclair blanc à chaque
   ouverture, et un plugin arrive toujours trop tard.

5. i18n fr et en, fr par défaut, catalogues à parité, AUCUNE chaîne en dur.

6. LE CYCLE DE VIE DE L'APPLICATION, une fois pour toutes : un layout par défaut
   qui porte une racine stable et un seul <main> ; un middleware global qui reprend
   la session à CHAQUE navigation, la première comprise ; un plugin de thème. Une
   page nouvelle en hérite sans rien écrire, et NE PEUT PAS L'OUBLIER. Une page a
   UNE SEULE RACINE et c'est un élément, jamais un v-if/v-else de premier niveau.

7. LA COUCHE DE DONNÉES SIMULÉES, app/core/donnees/ :
   - une interface par domaine, la MÊME que le client généré implémentera en
     phase 3 ; les composants ne connaissent jamais la provenance ;
   - des jeux de données conformes à docs/modele-donnees/ — mêmes noms de champs,
     mêmes types, mêmes énumérations. C'est ce qui rend le branchement mécanique ;
   - LE JEU DE DONNÉES EST CELUI DE DELORIA : 17 unités en 5 catégories aux tarifs
     réels, salle de réunion, barèmes de passage et de demi-journée, une trentaine
     d'articles de catalogue, cinq comptes aux rôles cumulés, plus un second
     établissement « Résidence Test » à 4 unités avec le seul module HEBERGEMENT ;
   - UNE MÉCANIQUE DE SCÉNARIOS : latence réglable, échec réseau, mode hors ligne,
     jeu vide, permissions restreintes. Je dois pouvoir basculer l'application dans
     chacun de ces états DEPUIS L'INTERFACE, sans recompiler — sinon les états
     dégradés ne seront jamais regardés.

8. PlatformAdapter avec sa seule implémentation web, et le principe qui compte :
   UNE CAPACITÉ ABSENTE LE DIT EXPLICITEMENT ET PROPOSE L'ALTERNATIVE. Recense dès
   maintenant, dans le code et dans une note, ce que le web ne sait pas faire par
   moteur : WebUSB et Web Bluetooth absents de Safari (donc pas d'impression
   thermique directe sur iPhone), notifications web conditionnées à l'installation
   sur iOS, pas d'accès au système de fichiers sur iOS. Ce sont des faits à
   afficher à l'utilisateur, pas des bogues à corriger.

9. RBAC côté client : les permissions viennent de la session, et UNE ACTION
   INTERDITE EST ABSENTE DU HTML RENDU, jamais grisée. Le test le vérifie sur le
   HTML, pas sur un attribut disabled.

10. LA FILE HORS-LIGNE ET SON TÉMOIN : file locale persistante, UUID v7 généré côté
    client sur toute écriture, indicateur permanent connecté / dégradé / hors ligne
    avec le nombre d'éléments en attente (composant 10). En phase 2 la file
    n'envoie rien — elle accumule, elle affiche, et elle REFUSE d'accepter une
    opération de classe B, C ou D, avec son explication. Ce refus est la propriété
    qu'on teste, pas l'envoi.

11. UN INDEX DES ÉCRANS à une adresse fixe (par exemple /_ecrans), listant tout
    écran du produit avec son code, son état d'avancement et un lien direct. Tenu à
    jour par CHAQUE cycle de phase 2. C'est par cette page que je regarde le
    produit — sans elle je ne saurais pas ce qui existe.

Hors périmètre : tout écran métier, tout appel réseau réel.
Personas : tous, indirectement.
Points d'attention : une unité écrite n'est ni testée ni branchée par défaut, et il
faut un contrôle pour chacune des deux propriétés. Tiens une liste des points
d'entrée avec deux états, « branché » et « dû », vérifiée dans les DEUX SENS : un
« dû » qui acquiert un appelant fait échouer le build, un « branché » qui le perd
aussi. Sans le second versant, tout déclarer branché rendrait le contrôle muet.
```

### Cycle F2 — Entrée dans l'application : connexion, accueil, contexte

```
/speckit-specify

Lis docs/user-stories-v1.md CPT-01, CPT-02, CPT-03, ETB-06, et
docs/design/html/R1-accueil*.html (quatre variantes), plus les lignes R0, A1, S1 de
docs/design/derivation.md.

Fonctionnalité : connexion, accueil composé, sélecteur de contexte, coquille de
navigation — en données simulées.

R1 EST L'ÉCRAN QUI POSE LE MOTIF DE ONZE AUTRES, et son test de vérité est écrit :
L'ACCUEIL D'UN MAQUIS DOIT AVOIR L'AIR CONÇU POUR LUI, pas d'un hôtel amputé. Les
tuiles sont filtrées par les permissions ET par les modules actifs ; un module
inactif est ABSENT, jamais grisé. Les quatre variantes maquettées (accueil
générique, propriétaire, serveuse, maquis) doivent toutes être atteignables en
basculant de compte et d'établissement depuis l'interface de scénarios du cycle F1.

Le sélecteur de contexte (ETB-06) est PERMANENT : établissement actif, poste actif,
témoin de synchronisation. Bascule d'établissement en DEUX TAPS, sans reconnexion.

La connexion (R0) simule : identifiant téléphone E.164 ou email, mot de passe,
erreur qui ne révèle jamais si un compte existe, et session persistante ou non
selon la capacité du stockage — quand elle ne l'est pas, l'écran LE DIT plutôt que
de laisser découvrir une déconnexion inexpliquée une heure plus tard.

Hors périmètre : toute authentification réelle, tout jeton, tout appel réseau.
Personas : Adjoua (gérante, caissière ET réceptionniste — les rôles cumulés sont la
norme), Yao, Aminata, M. Koffi.
Points d'attention : c'est le premier cycle qui produit des écrans. Prends le temps
de fixer la grammaire — en-tête, navigation, retour, titres, espacements — parce
que les six cycles suivants la reprendront telle quelle.
```

### Cycle F3 — Réception : passage, séjour, planning

```
/speckit-specify

Lis docs/user-stories-v1.md modules HEB et SEJ (HEB-01 à HEB-06, SEJ-01 à SEJ-05),
docs/cadrage-v1.md §5, et les maquettes docs/design/html/R4-passage*.html (cinq
états), R7-note-depart*.html (trois états), V1-planning*.html (deux états), plus
les lignes de docs/design/derivation.md qui en dérivent.

Fonctionnalité : le cœur métier de la réception — en données simulées.

TROIS OBJECTIFS MESURÉS, TRAITÉS COMME DES CRITÈRES D'ACCEPTATION ET NON COMME DES
SOUHAITS. Ils se mesurent DÈS LA PHASE 2, sur données simulées, parce qu'ils
dépendent du nombre de gestes bien plus que du réseau :
  · enregistrer un PASSAGE en moins de 30 secondes — au-delà de 90 s, le personnel
    reviendra au cahier et le produit aura échoué ;
  · enregistrer un client CONNU en moins de 60 secondes ;
  · afficher le TOTAL PROVISOIRE d'une note INSTANTANÉMENT — c'est l'un des cinq
    problèmes explicites du cahier des charges du pilote.
Compte les taps et les frappes de chaque parcours, écris le compte dans la spec, et
dis-moi lesquels dépassent.

R4 (passage) est en ZONE DE VITESSE : durée choisie en UN GESTE, prix visible SUR
le bouton, chambre proposée automatiquement, heure de fin affichée en grand,
identité réduite au strict nécessaire légal. Le parcours du passage est DISTINCT et
ultra-court — ce n'est pas le parcours de nuitée avec des champs en plus.
R7 (note et départ) pose le motif du DOCUMENT À LIGNES dont six écrans héritent :
lignes, sous-totaux, taxes, total, action finale. La taxe de séjour est une LIGNE
DISTINCTE, obligation légale. L'envoi aux impôts prend quelques secondes et peut
échouer PENDANT QUE LE CLIENT EST DEBOUT DEVANT LE COMPTOIR : simule les trois
issues (succès, échec, indéterminé) et montre-les-moi.
V1 (planning) a une GRANULARITÉ HORAIRE — c'est ce qui le distingue de tout planning
hôtelier existant : passages de 1 à 4 h et demi-journées lisibles, pas écrasés dans
une case de journée, et temps de remise en état visibles entre deux occupations.

Simule le refus de disponibilité : deux occupations qui se chevauchent doivent être
IMPOSSIBLES à créer, et le refus doit nommer le conflit. En phase 3 c'est une
contrainte de base qui le garantira ; en phase 2 c'est l'écran qui doit déjà savoir
le dire.

Hors périmètre : réservations (cycle F7), OCR (la saisie manuelle suffit ici),
certification fiscale réelle.
Personas : Yao, Adjoua.
Points d'attention : le check-in est de classe B et le restera. L'écran doit donc
annoncer, AVANT que l'utilisateur tente l'action, qu'elle exige le réseau — jamais
après. Vérifie-le avec le scénario « hors ligne » du cycle F1.
```

### Cycle F4 — Points de vente : commande, addition, pressing, page client

```
/speckit-specify

Lis docs/user-stories-v1.md module PDV (PDV-01 à PDV-08) et module QRC, et les
maquettes docs/design/html/P2-saisie-commande*.html (trois états, dont hors ligne et
desktop), Q1-page-client*.html (trois états), plus les lignes de dérivation
associées.

Fonctionnalité : prise de commande, additions de table, pressing et surface
publique QR — en données simulées.

P2 EST LE CŒUR DU BESOIN HORS-LIGNE, et son état hors ligne est maquetté : ajout
d'un article en DEUX TAPS, quantité modifiée sans modale, total courant toujours
visible, cible de facturation choisie à l'ouverture. La saisie fonctionne
INTÉGRALEMENT sans réseau et le dit sans alarmer — c'est de la classe A, elle
s'accumule dans la file du cycle F1. En revanche l'annulation d'une ligne DÉJÀ
ENVOYÉE et l'application d'une remise sont de classe B : refusées hors ligne, avec
motif obligatoire et permission requise quand elles sont possibles.
Sans module hébergement actif, la cible « chambre » N'EXISTE PAS — vérifie-le avec
l'établissement « Résidence Test » et avec un maquis.

Le pressing n'est PAS une vente immédiate : bon de dépôt, numéro de retrait bien
visible, cycle déposé → en traitement → prêt → retiré.

Q1 est la SEULE SURFACE VUE PAR UN CLIENT FINAL, et ses règles sont entièrement
distinctes du produit interne : pas d'application à installer, pas de compte,
AUCUNE donnée personnelle demandée, ni sélecteur de contexte, ni témoin de
synchronisation, ni navigation composable. Elle vit dans web/qr, pas dans app/.
La commande arrive en état À CONFIRMER et RIEN NE PART EN CUISINE avant qu'un
membre du personnel ait constaté la présence du client — c'est le seul mécanisme
anti-fraude du MVP, et il se voit à l'écran.
PRODUIS AUSSI L'ÉTAT « TABLE FERMÉE OU QR EXPIRÉ » : c'est ce que voit quelqu'un
qui scanne un QR arraché ou photographié. Il n'est pas maquetté ; il entre au
quatrième cas de la doctrine d'écran — code-le et inscris-le à la matrice.

Hors périmètre : impression réelle, encaissement (cycle F5).
Personas : Aminata (Android d'entrée de gamme, debout, à une main, bruit, réseau
instable), Yao, Adjoua, et tout client qui scanne.
Points d'attention : teste P2 sur une fenêtre étroite ET sur desktop — les deux sont
maquettés. La latence de saisie d'une ligne doit rester imperceptible ; c'est le
geste le plus répété du produit après le sélecteur de durée.
```

### Cycle F5 — Caisse, encaissement et clôture

```
/speckit-specify

Lis docs/user-stories-v1.md module CAI (CAI-01 à CAI-06), docs/cadrage-v1.md §8, et
les maquettes docs/design/html/C4-cloture.html, C4-cloture-bloquee.html et
C4-cloture-reussie.html, plus le prototype docs/design/proto/proto-4-cloture-reussie.html.

Fonctionnalité : shifts, encaissements multi-modes, comptage, clôture — en données
simulées.

LA CLÔTURE EST LE SOMMET ÉMOTIONNEL DE LA JOURNÉE D'ADJOUA, et le maquettage en
porte les deux versants :
  · LA CLÔTURE BLOQUÉE est en REGISTRE SOBRE (Kaya_Design.md §11) : quelqu'un est
    fatigué à 22 h devant un blocage, l'enjouement se lirait comme du mépris. Le
    refus est CONSTRUCTIF — ce qui bloque, combien, et l'action possible DEPUIS CET
    ÉCRAN. Les quatre conditions : rien en attente d'envoi, aucune facture en
    attente ou refusée, aucun terminal déconnecté depuis plus de 15 minutes, aucune
    addition ouverte.
  · LA CLÔTURE RÉUSSIE est le moment de plaisir n° 1, et son animation est la plus
    importante du produit — « c'est bouclé, c'est propre, tu peux rentrer chez
    toi ». Elle ne rallonge RIEN : Adjoua peut partir au bout de zéro seconde,
    l'animation continue derrière elle.
OBJECTIF MESURÉ : la clôture se déroule en moins de 15 minutes, contre environ une
heure aujourd'hui sur le cahier. Compte les gestes.

Le règlement FRACTIONNÉ entre plusieurs modes sur une même note est LA NORME en
hôtellerie, pas un cas limite. Espèces, Mobile Money, carte, virement, à crédit.
Montants en entiers de FCFA, alignés en typographie tabulaire.
Le récapitulatif ventile par service, par module d'activité ET PAR FORMULE
D'HÉBERGEMENT — distinguer les recettes de passage des recettes de nuitée est un
besoin réel que le papier ne couvre pas.

Hors périmètre : certification fiscale (cycle F6), impression réelle.
Personas : Adjoua, Yao.
Points d'attention : simule un écart de caisse et montre-moi ce qui se passe. Le
motif est obligatoire, l'écart est tracé, et au-delà du seuil le propriétaire est
notifié — trois comportements à voir à l'écran, pas trois lignes de spécification.
```

### Cycle F6 — Fiscalité, documents et moments difficiles

```
/speckit-specify

Lis docs/user-stories-v1.md modules FIS (FIS-01 à FIS-08), IMP et SYN-03,
docs/cadrage-v1.md §9, et les maquettes docs/design/html/F2-registre-grave.html,
S2-registre-grave.html, plus docs/design/documents/ (D1-D5 tickets thermiques,
D6 note provisoire, D7 facture fiscale).

Fonctionnalité : file de certification, documents, rapprochement manuel et
réconciliation des écritures orphelines — en données simulées.

CE CYCLE PRODUIT LES DEUX ÉCRANS LES PLUS DIFFICILES DU PRODUIT, tous deux en
REGISTRE SOBRE :
  · F2 — DOCUMENT FISCAL INDÉTERMINÉ. Sur un timeout, il est IMPOSSIBLE de savoir
    si la facture a été validée ; la renvoyer produirait une double validation et
    consommerait un jeton payant deux fois. Aucune solution automatique : un humain
    vérifie et tranche. Deux issues bien différenciées, et AUCUN BOUTON
    « RÉESSAYER » ATTEIGNABLE PAR RÉFLEXE.
  · S2 — RÉCONCILIATION D'UNE ÉCRITURE ORPHELINE. Une bière servie hors ligne
    arrive sur un séjour déjà facturé : c'est le conflit le plus fréquent en
    exploitation réelle. Trois issues — avoir et refacturation (l'avoir fiscal se
    fait PAR QUANTITÉ, donc ligne entière annulée), prise en charge par
    l'établissement, rattachement au prochain séjour. L'écran AIDE À DÉCIDER : la
    bonne réponse dépend du montant et de la relation client.
Ces deux écrans ne portent ni illustration amusante, ni personnage désolé. Ils
restent visuellement cohérents avec le reste — même typographie, même palette,
mêmes composants — en changeant seulement de registre. C'est un exercice de
retenue, pas d'appauvrissement.

TOUT TERME FISCAL PASSE PAR LE LEXIQUE : « certification FNE » devient « envoi aux
impôts », l'état INDETERMINEE devient « nous ne savons pas si les impôts ont reçu
cette facture ». Le vocabulaire officiel n'apparaît QUE sur les documents légaux,
jamais dans un bouton ni un message.

DOCUMENTS IMPRIMÉS : reprends les modèles de docs/design/documents/ en composants,
avec un APERÇU à l'écran. La contrainte thermique (80 mm, ~42 caractères par ligne,
pas de couleur, pas de nuance de gris, accents français lisibles) est une contrainte
de mise en page, pas d'impression : elle se vérifie à l'aperçu. Tout document
opérationnel porte la mention « Document non fiscal — ne tient pas lieu de facture »
VISIBLE, jamais en petits caractères en bas de page.

Hors périmètre : tout appel réel à l'API FNE, toute impression matérielle.
Personas : Adjoua, M. Diarra, M. Koffi.
Points d'attention : simule les quatre états de la file (en attente, soumise,
certifiée, échec) PLUS l'indéterminé, et rends-les tous atteignables depuis
l'interface de scénarios. Je veux voir les cinq sans rien recompiler.
```

### Cycle F7 — Direction, configuration, réservations, console

```
/speckit-specify

Lis docs/user-stories-v1.md modules DIR, ETB (ETB-01 à ETB-05), RSV, STK, ADM, et
les maquettes docs/design/html/M4-mes-etablissements*.html (deux états),
G2-offre-hebergement*.html (deux états), plus les lignes de dérivation des écrans de
configuration.

Fonctionnalité : tableaux de bord, configuration d'établissement, réservations,
stocks et console éditeur — en données simulées.

M4 EST LA VITRINE DU PRODUIT (moment de plaisir n° 7) : chiffres qui montent,
indicateurs qui prennent vie, comparaison entre établissements qui s'anime. Lecture
seule, consulté en 20 secondes plusieurs fois par jour, sur un téléphone. C'est la
demande explicite du persona propriétaire.
G2 (formules et barèmes) porte un PARAMÈTRE SENSIBLE : chaque formule porte son
traitement de taxe de séjour, et mal réglé il met le client en infraction. Les
quatre familles : nuitée, passage horaire à paliers dégressifs, demi-journée en
plages fixes, mensuel.

CE CYCLE PORTE LA MAJORITÉ DES ÉCRANS COMPOSÉS ET DÉCOUVERTS — configuration,
référentiels, réglages sont en ZONE DE CHARME, et le troisième cas de la doctrine
d'écran leur est ouvert. Inscris chacun à docs/design/derivation.md dans le même
changement, avec les composants employés et la mention « à valider ».

Le planning des réservations réutilise V1 du cycle F3 : granularité horaire,
arrivées et départs du jour, unités à nettoyer.

Hors périmètre : paiement d'abonnement réel, provisionnement réel de tenant.
Personas : M. Koffi, Adjoua, Admin éditeur.
Points d'attention : à la fin de ce cycle, TOUS LES ÉCRANS DU PRODUIT EXISTENT.
Vérifie l'index /_ecrans contre docs/design/derivation.md et dis-moi ce qui manque
des deux côtés : un écran de la matrice sans page, et une page absente de la
matrice. C'est le moment de la revue visuelle complète — avant d'écrire une ligne de
backend.
```

---

## PHASE 3 — LE BACKEND, QUI REMPLACE LES SIMULATIONS

**Un cycle par module, dans l'ordre des dépendances.** Chaque cycle applique le patron de
`docs/module-dore.md`, met à jour `docs/modele-donnees/` avec ses migrations, et **supprime les
données simulées des endpoints qu'il met en service**.

> **Ce que la phase 2 change pour ces cycles** : ils ne conçoivent plus d'interface. Les écrans
> existent, leurs besoins en données sont connus et visibles dans `app/core/donnees/`. Le travail
> est de **servir ce que l'écran demande déjà**, et le contrat OpenAPI en découle au lieu de le
> précéder. Quand un écran demande une donnée que le modèle n'a pas, c'est une découverte utile :
> elle se règle par une migration **et** une mise à jour de `docs/modele-donnees/`.

| Cycle | Module | Contenu | Ce qu'il débranche |
|---|---|---|---|
| **B1** | TRX | Monorepo backend, contrat OpenAPI + client généré, outbox, RLS forcée, seeds rejouables, CI, **module doré écrit à la main** | rien — il crée le socle |
| **B2** | ETB | Tenants, établissements, modules et capacités, points de vente, configuration héritée, branding | contexte, configuration, référentiels |
| **B3** | CPT | Personne / compte / employé, authentification, rôles cumulables, journal d'audit | connexion, permissions, registre des actions |
| **B4** | HEB | Catégories, unités, formules, barèmes, **disponibilité par contrainte d'exclusion GiST** | planning, disponibilité, tarifs |
| **B5** | SYN | File d'actions, horodatage d'autorité, classes hors-ligne vérifiées par test | file locale, témoin de synchronisation |
| **B6** | SEJ | Clients, check-in, check-out, prolongation, note de séjour, clients extérieurs | réception, séjours, note |
| **B7** | PDV / ventes | Catalogue, tables, commandes, envoi en préparation, division, pressing | points de vente |
| **B8** | CAI | Shifts, encaissements, sorties, comptage, clôtures | caisse |
| **B9** | FIS | Adaptateur de juridiction, moteur de taxes, passerelle FNE, file de certification, avoirs, reversement communal | fiscalité, documents |
| **B10** | IMP | Impression thermique par PlatformAdapter, note provisoire, facture A4 | aperçus de documents |
| **B11** | SYN-2 | Réconciliation des écritures orphelines | écran S2 |
| **B12** | DIR | Tableaux de bord, recettes par service, consultation du journal | direction |
| **B13** | RSV | Réservations, arrhes, annulation, no-show, conversion en séjour | réservations |
| **B14** | QRC | Jeton de table signé, page publique, validation par le personnel, limitation de débit | surface QR |
| **B15** | STK · ADM · MET | Stocks profil SIMPLE, console éditeur et abonnements, métriques | stocks, console |

**Le prompt de chaque cycle de phase 3 suit un patron unique** — à recopier en changeant le module,
son périmètre de stories et ses points d'attention :

```
/speckit-specify

Lis docs/user-stories-v1.md, module {CODE} — {NOM}, et docs/cadrage-v1.md §{N}.
Lis docs/modele-donnees/{schema}.sql : LES TABLES DE CE MODULE Y SONT DÉJÀ
DÉFINIES, avec leurs contraintes, leurs politiques RLS et leurs privilèges. Ta
migration les MATÉRIALISE ; elle ne les réinvente pas. Si tu dois t'en écarter, dis
pourquoi et METS À JOUR LE FICHIER DANS LE MÊME CHANGEMENT.
Lis app/core/donnees/{domaine} : LES ÉCRANS EXISTENT DÉJÀ et consomment ces
données. Le contrat que tu exposes doit servir ce qu'ils demandent — ni plus, ni
moins. Ouvre les écrans concernés avant d'écrire une ligne.
Lis docs/module-dore.md : c'est le patron de tranche verticale, écrit contre
sqlx 0.9. Tout extrait trouvé en ligne vise 0.8.x et ne compilera pas.

Fonctionnalité : {une phrase}.
Périmètre : {stories} — critères tels quels, n'invente pas d'exigences.
{Points propres au module — reprendre ceux de docs/user-stories-v1.md}

CE CYCLE DÉBRANCHE : {liste des simulations supprimées}. Une simulation qui survit
à son endpoint fait échouer le build.

Hors périmètre : {stories P1/P2/PROVISION}.
Personas : {…}.
Points d'attention : {…}.
```

---

## 4. Ordre d'exécution et jalons

| Phase | Cycles | Ce qui est vrai à la fin |
|---|---|---|
| **1 — Modèle** | D1, D2 | `docs/modele-donnees/` contient tout le MVP en SQL applicable, provisions comprises. Chaque table a sa classe hors-ligne. |
| **2 — Écrans** | F1 → F7 | **Tous les parcours du MVP se déroulent de bout en bout**, en clair et en sombre, installables hors ligne, sur données simulées. Je peux montrer le produit à Deloria avant d'avoir écrit un endpoint. |
| **3 — Backend** | B1 → B15 | Chaque endpoint livré remplace sa simulation. À la fin, `app/core/donnees/` ne contient plus que le client réel. |
| **J1** | — | **Deloria abandonne le cahier papier.** Double exploitation de 3 semaines avant bascule. |

> **Le jalon nouveau, et c'est celui qui compte** : à la fin de la phase 2, le produit **se montre**.
> Une démonstration à Abengourou sur données simulées vaut plus qu'une spécification relue, et elle
> arrive des mois plus tôt qu'avec l'ordre d'avant. **Ce qu'elle ne prouve pas** : la conformité
> fiscale, la résistance aux coupures réelles, les performances. Ces trois-là restent de la phase 3,
> et il faut le dire au pilote plutôt que de laisser croire que le produit est prêt.

---

## 5. Règles de conduite du dépôt

- **Un écran se code dans QUATRE cas.** (a) **Maquetté** — un fichier d'état de
  `docs/design/html/`. (b) **Dérivé** — une ligne de `docs/design/derivation.md`. (c) **Composé** —
  assemblé à partir des seize composants canoniques, en zone de charme. (d) **Découvert à
  l'implémentation** — les documents ne l'avaient pas prévu, il se code quand même, avec les
  composants et le lexique existants, **et il s'inscrit à la matrice dans le même changement** avec
  la mention « découvert à l'implémentation, à valider ». **Le cycle ne s'arrête plus.** Ce qu'on
  refuse n'est pas d'inventer un écran, c'est de l'inventer **en silence** : le risque n'est pas la
  laideur, c'est la dérive — trente écrans inventés un par un, chacun avec sa grammaire.
  **Seule exception qui arrête encore** : un **composant** qui manque à la bibliothèque. Un
  composant nouveau se dessine, il ne s'improvise pas dans un écran.
- **`docs/modele-donnees/` se met à jour dans le même changement que la migration.** Jamais après,
  jamais dans un lot de rattrapage. Un test compare le schéma réel aux fichiers.
- **Aucun terme technique visible par l'utilisateur sans entrée au lexique `docs/design/lexique.md`.**
  Si le terme manque, on l'ajoute au lexique **dans le même changement** et on le signale — on
  n'écrit jamais un terme technique en dur en attendant.
- **Une branche par cycle** (`feat/f3-reception`), merge quand la checklist du §2.5 passe.
- **Commits conventionnels référençant les stories** : `feat(hebergement): HEB-02 disponibilité par
  contrainte d'exclusion GiST`.
- **Si une décision produit change** : mettre à jour d'abord `docs/cadrage-v1.md` et
  `docs/user-stories-v1.md` (et `docs/design/` si visuel), puis relancer `/speckit-specify` du
  cycle concerné — jamais l'inverse.
- **La revue se fait à l'écran.** Un cycle de phase 2 ou 3 qui produit des écrans n'est pas fini
  tant que l'index `/_ecrans` ne les montre pas et que je ne les ai pas ouverts. **Je ne relirai
  pas les spécifications** — c'est le postulat de toute cette organisation, et il vaut mieux
  l'écrire que le découvrir.
- **Ne jamais fusionner du code qu'on ne saurait pas déboguer à 2 h du matin pendant une clôture de
  caisse à Abengourou.** C'est la règle qui prime sur toutes les autres en développement solo
  assisté par IA.

---

## 6. Décisions à trancher

| Décision | Bloque | Échéance |
|---|---|---|
| **B-03** — source de revenus de transition | Rien techniquement, tout le reste humainement | **le plus tôt possible** |
| **B-02** — taxe de nuitée sur passage et demi-journée (fiscaliste) | Les valeurs par défaut du cycle **B9 (FIS)**. Le modèle, lui, n'attend pas : le drapeau et la règle de conversion sont des colonnes, posées au cycle **D2** | avant B9 |
| **B-07** — barèmes de passage réels du pilote | Les seeds du cycle **F1** (données simulées) puis **B4** | atelier terrain |
| **B-05 / O-02** — classe hors-ligne du stock (A ou B) | Le cycle **D2** pour les privilèges, **B15** pour la logique. Jusqu'à l'arbitrage, **B s'applique** — la plus stricte | avec le pilote |
| **O-03** — crate d'accueil de la surface QR | Cycle **B14**. Le modèle la range dans `ventes.sql` au cycle D2 ; le crate se décidera après | avant B14 |
| **Mécanique de données simulées** — bibliothèque ou code du dépôt ? | Cycle **F1**, et **pour toute la phase 2** : une seule mécanique, pas une par module | au cycle F1 |
| **Capacitor** — entre-t-il, et quand ? | Rien. **Ne se décide que sur un besoin natif constaté** qu'aucune API web ne sert : impression thermique sur iPhone, notifications sans installation, OCR hors ligne performant | jamais par anticipation |
| **B-06** — nom définitif et marque | Renommage global, trivial tant qu'il est fait tôt | avant le pilote |
| **B-04** — montant des frais d'installation | Cycle B15 (ADM) | avant B15 |

Les décisions **O-xx** sont portées par `docs/registre-classes-offline.md` §12. Jusqu'à leur
arbitrage, **la classe la plus stricte du registre s'applique** — aucun contournement.
