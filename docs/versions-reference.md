# Kaya — Versions de référence

*Application du principe XI de `.specify/memory/constitution.md` : **la dernière version stable
compatible** de chaque brique, vérifiée sur le registre officiel avec l'URL citée, puis **épinglée
exactement** et figée par lockfile.*

> **C'est une référence, pas un gel** : il dit quelle version est employée et pourquoi, il se met à
> jour **dans le changement qui touche au manifeste**, et **l'agent d'implémentation y écrit
> lui-même**.

⚠️ **Les valeurs ci-dessous sont un point de départ vérifié, pas un état du dépôt** — il ne porte
encore ni `Cargo.toml`, ni `package.json`, ni lockfile. **Elles sont à revérifier au cycle qui les
matérialise**, ce que la règle 1 impose de toute façon.

**Cible de déploiement retenue : Docker sur VPS Contabo** (mode A du cadrage §10.1, SaaS
mutualisé). Toutes les versions ci-dessous sont vérifiées disponibles pour cette cible (§4.2).

---

## 1. Règles d'usage de ce document

**LA RÈGLE EST : LA DERNIÈRE STABLE, SAUF SI ELLE CASSE QUELQUE CHOSE.** Tout le reste en découle.

Ce document est tenu par **une personne seule**, assistée d'un agent. Une règle qui suppose une
revue périodique, un comité ou un second lecteur n'est pas une règle : c'est une dette à venir.
Toutes celles qui suivent sont vérifiables par une machine ou tiennent en une phrase.

1. **Prendre la dernière stable, descendre d'un cran seulement quand elle est en conflit.** Le
   conflit est **constaté**, jamais supposé : une `peerDependency` non satisfaite, une
   contrainte de crate incompatible, une API rompue qui échoue à l'exécution. Dans ce cas on
   descend **au minimum** — la dernière version qui satisfait la contrainte, pas deux majeures en
   arrière — et **on écrit la contrainte et la condition de levée** à côté de la valeur. Les deux
   dérogations connues sont Node (LTS plutôt que la dernière stable, §3.3) et TypeScript
   (contrainte du générateur de client, §3.2).
2. **Aucun numéro de version n'est écrit de mémoire.** Chaque version porte l'URL du registre
   officiel interrogé et sa date de vérification — dans ce fichier pour le §2, **en commentaire du
   manifeste** pour les §3.x. Une version non vérifiée est une version inconnue.
3. **Épinglage exact obligatoire** : `= 4.14.0` ou `4.14.0`, jamais `^4.14`, `~4.14` ni `4.*`.
   La porte **P-03** échoue sur tout intervalle et sur tout lockfile absent ou périmé.
   **Cette règle ne connaît aucune exception, et c'est la seule de ce document dans ce cas** —
   c'est elle qui rend une reconstruction identique à six mois d'écart. Prendre la dernière stable
   et l'épingler exactement ne sont pas contradictoires : le premier dit *quoi choisir*, le second
   *comment l'inscrire*.
4. **AJOUTER une dépendance absente est libre, en cours de cycle, sans autorisation.** Trois
   obligations, aucune n'étant une permission à demander :
   - l'épinglage est exact et le lockfile est commité (règle 3) ;
   - le manifeste porte, **en commentaire au-dessus de la ligne**, le rôle, l'URL du registre
     interrogé et la date ;
   - le commentaire dit **pourquoi les dépendances déjà présentes ne suffisent pas**. Pas pour
     obtenir un accord : pour que la question soit posée.

   **L'inscription aux tableaux §3.x se fait DANS LE CHANGEMENT QUI AJOUTE**, jamais reportée.
   Une échéance sans porte est un rappel, pas un contrôle.
5. **MONTER une version est libre aussi, sous une condition unique : que la suite de tests passe
   après la montée.** C'est un meilleur contrôle qu'une lecture humaine : une montée qui casse
   quelque chose le montre en dix minutes, une revue de calendrier ne montre rien du tout. Trois
   précisions :
   - la montée s'inscrit ici **dans le même changement**, avec l'URL et la date ;
   - une montée **majeure** d'une brique du §2 est signalée dans le rapport de cycle, pas
     interdite : elle est simplement plus susceptible d'échouer, et on veut savoir qu'elle a eu
     lieu ;
   - une montée qui casse et qu'on ne sait pas réparer en une heure se **remet en arrière**, et
     la raison s'écrit au §6. Une montée abandonnée sans trace se retentera dans trois mois.
6. **AUCUNE REVUE PÉRIODIQUE N'EST PROGRAMMÉE.** Les versions se regardent quand un événement les
   appelle : ouverture d'un cycle, ajout d'une dépendance, avis de sécurité, blocage constaté. Le
   développeur est seul ; une échéance calendaire qu'il manque une fois est une règle morte, et
   une règle morte discrédite les autres.
7. **Deux dépendances de la même famille fonctionnelle ne cohabitent pas** — `time` et `chrono`,
   `thiserror` et `anyhow` en bibliothèque, deux clients HTTP, deux moteurs de chiffrement. La
   liberté d'ajouter ne vaut que pour ce qui manque, et la liste des familles exclusives est au
   §3.4. **C'est le seul garde-fou qui demande un jugement**, et c'est pour ça qu'il est court.
8. Reproduire la vérification : les commandes exactes sont au §5.

> **Les tableaux §3.x sont destinés à être GÉNÉRÉS depuis les manifestes**, ce document devenant le
> miroir vérifié du code plutôt qu'un document parallèle qui en dévie. Le contrôle devient alors
> trivial et complet dans les deux sens : *ce fichier est-il celui que les manifestes engendrent ?*
> Tant que le générateur n'existe pas, les tableaux §3.x s'écrivent **dans le même changement que
> le manifeste** — ce que la règle 4 impose déjà. Voir §4.3.

### Pourquoi aucune revue périodique — écrit pour qu'on ne la rétablisse pas par prudence

Une revue périodique obligatoire pour toute montée, étendue aux ajouts, produit trois effets connus
et tous nuisibles : des dépendances déjà dans les manifestes qui **attendent une réunion** pour
être inscrites ; **du code écrit à la main pour éviter d'ouvrir le sujet** — une contrainte de
gouvernance n'a pas à entrer dans un raisonnement de conception ; et une échéance manquée sans
conséquence visible, donc une règle que plus rien ne tient.

**Ce qui est gardé, et pourquoi** : l'épinglage exact (reconstruction reproductible, coût nul),
l'URL datée (empêche d'écrire un numéro de mémoire, coût nul), le lockfile commité (même motif).
**Ce qui n'existe pas** : la revue calendaire, la distinction entre ajouter et monter, la liste de
briques intouchables.

---

## 2. Les neuf briques du principe XI

| # | Brique | Version retenue | Publiée le | Registre officiel interrogé |
|---|---|---|---|---|
| 1 | **Rust** (toolchain stable) | **1.97.1** | 2026-07-14 | `https://static.rust-lang.org/dist/channel-rust-stable.toml` — section `[pkg.rust]` |
| 2 | **Actix Web** | **4.14.0** | 2026-06-21 | `https://crates.io/api/v1/crates/actix-web` |
| 3 | **sqlx** | **0.9.0** ⚠️ | 2026-05-21 | `https://crates.io/api/v1/crates/sqlx` |
| 4 | **utoipa** | **5.5.0** | 2026-05-04 | `https://crates.io/api/v1/crates/utoipa` |
| 5 | **Nuxt** | **4.5.1** | — | `https://registry.npmjs.org/nuxt/latest` |
| 6 | **Tailwind CSS** | **4.3.3** | — | `https://registry.npmjs.org/tailwindcss/latest` |
| 7 | **PostgreSQL** | **18.4** | 2026-05-14 | `https://www.postgresql.org/versions.json` |
| 8 | **Redis** | **8.8.1** | 2026-07-23 | `https://api.github.com/repos/redis/redis/releases` |
| 9 | **Garage** | **2.3.0** | 2026-04-16 | `https://git.deuxfleurs.fr/api/v1/repos/Deuxfleurs/garage/releases` |

> ⚠️ **La coquille applicative n'est pas dans ce tableau, et c'est délibéré.** L'application est
> une **PWA en phase 2** (voir `@vite-pwa/nuxt` au §3.2) et **Capacitor en production** (cadrage
> §13.3). **Capacitor entre ici, en dixième brique, au cycle qui l'introduit** — avec sa version
> vérifiée, celle de ses plugins natifs, et les exigences de chaîne de build Android et iOS.

### Arbitrages retenus

Le critère retenu n'est pas l'âge d'une version, c'est **son coût en terrain non défriché pour
un développeur solo**. Une version fraîche est acceptée quand elle ne change rien au code ou
qu'elle apporte quelque chose de nécessaire ; elle est refusée quand elle expose sans gain.

#### sqlx 0.9.0 — retenue, pour deux apports propres au projet

La stable précédente était `0.8.6` (2025-05-19), soit un an d'écart. Deux changements de
`0.9.0` visent directement l'architecture Kaya :

- **`#3918` — type d'erreur dédié à la violation de contrainte d'exclusion.** C'est le cœur de
  HEB-02 : deux attributions concurrentes chevauchantes doivent produire « unité déjà occupée sur
  cet intervalle », pas une erreur SQL brute. En `0.8.6`, il faut inspecter le SQLSTATE `23P01`
  à la main.
- **`sqlx.toml` avec exemple officiel multi-tenant** : renommage de `_sqlx_migrations` et
  **plusieurs schémas** — exactement le « un schéma Postgres par module » du principe II, plus
  les surcharges de types pour les macros.

`PgRange<T>` est présent en `0.9.0` (vérifié sur `docs.rs/sqlx/0.9.0`), donc `tstzrange` reste
mappable.

**Coût assumé** : `#3723` impose `AssertSqlSafe` sur toute requête non littérale, et `#3541`
peut altérer la sortie des macros `query!()`. La documentation, les exemples et les réponses en
ligne visent encore `0.8.x` — **tout extrait trouvé en ligne ne compilera pas**. C'est ce que le
**module doré** (cadrage §13.1) neutralise : il doit être écrit contre `0.9.0` **avant** toute
génération assistée, sinon chaque cycle réintroduira des appels `0.8`.

*Note de gouvernance* : sqlx est passé à l'organisation GitHub `transact-rs` et ne suit plus son
`Cargo.lock`. Transition saine (propriété collective formalisée par les auteurs principaux),
mais liens et outils tiers mettront du temps à s'aligner.

#### Redis — reculé de 8.10.0 à 8.8.1

`8.10.0` est passée en GA le 2026-07-29 après des RC datées du **2026-07-20** : neuf jours de
release candidate pour une mineure qui introduit *compact hashes*, un nouvel encodage de
hachage. Kaya n'en a aucun besoin — sessions, file FNE, verrous, limitation de débit et cache
fonctionnent depuis Redis 6.

**Aucun sacrifice de sécurité** : la salve du 2026-07-23 était un correctif de sécurité sur
**toutes** les branches maintenues (6.2 à 8.8) — use-after-free via payload `RESTORE` de stream,
écriture hors limites dans RedisBloom/TDigest. `8.8.1` porte ces correctifs et sa branche a deux
mois de recul (`8.8.0` du 2026-05-25).

**Toute version retenue doit être ≥ à la salve du 2026-07-23.** Reculer davantage exposerait à
ces failles.

#### PostgreSQL 18.4 — retenue, arbitrage fermé

`18.4` n'est pas une version fraîche : PG 18 est *current* depuis septembre 2025 et un `.4`
signifie trois cycles de correctifs passés. Kaya n'utilise aucune fonctionnalité propre à PG 18
— RLS, `EXCLUDE USING gist`, `tstzrange` et `NUMERIC` existent depuis PG 10 — donc le seul
critère était **où la base tourne**.

**Réponse : Docker sur un VPS Contabo auto-géré.** La version de PostgreSQL est entièrement
maîtrisée, sans plafonnement d'offre managée. `18.4` est donc retenue pour son **EOL au
2030-11-14**, la plus longue durée de vie disponible — ce qui compte pour un produit dont les
documents fiscaux sont conservés 10 ans.

L'alternative `17.10` (22 mois de recul, EOL 2029-11-08) reste valable pour le **paquet
auto-hébergé** (mode B) si un client ne sait administrer que PG 17. Les deux tags existent en
multi-architecture, la bascule est un changement de tag.

---

## 3. Dépendances directes du socle

Épinglées au même titre. Ce ne sont pas des « briques » au sens du principe XI, mais elles
entrent dans le lockfile et la porte **P-03** les couvre.

### 3.1 Écosystème Rust

| Crate | Version | Rôle | Contrainte vérifiée |
|---|---|---|---|
| `utoipa-swagger-ui` | **9.0.2** | Swagger UI, protégée hors production | dépend de `utoipa ^5` et `actix-web ^4` → **compatible** |
| `utoipa-actix-web` | **0.1.2** | Intégration utoipa ↔ Actix | dépend de `utoipa ^5`, `actix-web ^4` → **compatible** |
| `actix-cors` | **0.7.1** ⚠️ | CORS — l'application est une **PWA servie depuis une autre origine** que l'API | dépend d'`actix-web ^4` → **compatible**. `0.x` assumé : crate officiel de l'écosystème Actix, branche 0.7 stable depuis 2025-03-11 |
| `tokio` | **1.53.1** | Runtime asynchrone | — |
| `serde` | **1.0.229** | Sérialisation | — |
| `uuid` | **1.24.0** | **UUID v7 côté client** (principe VI) | feature `v7` **présente et vérifiée** |
| `rust_decimal` | **1.42.1** | Quantités `NUMERIC` (principe V) | jamais de flottant sur une quantité |
| `redis` | **1.5.0** | Client Redis | — |
| `aws-sdk-s3` | **1.140.0** | Accès Garage **via API S3** (principe II) | — |
| `sentry` | **0.49.0** | Rapport d'erreurs (principe VIII) | — |
| `tracing` | **0.1.44** | Logs structurés corrélés (principe VIII) | — |
| `tracing-subscriber` | **0.3.23** | Souscripteur de logs | — |
| `jsonwebtoken` | **11.0.0** | JWT court + refresh révocable (CPT-01) | — |
| `argon2` | **0.5.3** | Hachage de mot de passe (CPT-01) **et dérivation de la clé de tenant** | — |
| `aes-gcm` | **0.11.0** | **Chiffrement au repos des pièces d'identité clients** (SEJ-01, transfert ARTCI) | RustCrypto, **Rust pur** — aucune chaîne C, comme `argon2`. Vérifiée le 2026-08-03 |
| `serde_json` | **1.0.151** | Charges utiles JSONB — outbox, contexte d'audit | dernière `1.x` de `serde`, alignée sur `serde` 1.0.229 |
| `time` | **0.3.54** | `timestamptz` et `tstzrange` (principe IV, occupations) | features `serde` `macros` `formatting` `parsing` **vérifiées présentes** |
| `thiserror` | **2.0.19** | Types d'erreur de domaine | — |
| `async-trait` | **0.1.91** | Traits d'abstraction asynchrones (principe III) | — |
| `futures` | **0.3.33** | Combinateurs du worker outbox | — |
| `dotenvy` | **0.15.7** | Variables d'environnement en développement | jamais chargé en production — l'image lit l'environnement du conteneur |

> **`uuid` avec la feature `v7` est un prérequis du principe VI**, pas un détail : toute écriture
> porte un UUID v7 généré côté client. La présence de la feature doit être **vérifiée sur l'API
> crates.io**, jamais supposée.

> **`aes-gcm` plutôt que les alternatives, et le motif se garde** : `pgcrypto` est écartée parce
> que la clé voyagerait dans `pg_stat_statements` et les journaux de la base — chiffrer au repos en
> publiant la clé n'est pas chiffrer. `ring` et `aws-lc-rs` sont écartées malgré leur qualité pour
> leur chaîne de construction `cmake`/`nasm` : **une chaîne C de plus est une panne de plus chez un
> client sans administrateur** (cadrage §10.1, mode B). RustCrypto est en Rust pur, comme `argon2`.

### 3.2 Écosystème JavaScript

| Paquet | Version | Rôle |
|---|---|---|
| ~~`@vite-pwa/nuxt`~~ | **ÉCARTÉ — conflit constaté le 2026-08-07** | Voir l'encadré « Coquille PWA » ci-dessous. Remplacé par `vite-plugin-pwa` |
| `vite-plugin-pwa` | **1.3.0** | **Service worker, manifeste d'application, stratégie de cache** — la coquille de la PWA (cadrage §13.3). Branché directement dans `vite.plugins` de `nuxt.config`, **sans l'enveloppe Nuxt**. Embarque `workbox-build` et `workbox-window` en `^7.4.1` : une seule ligne épingle la chaîne. `peerDependencies.vite` couvre `^3` à `^8`, donc satisfaite par le Vite de Nuxt 4.5.1 · `https://registry.npmjs.org/vite-plugin-pwa/latest`, **2026-08-07** |
| `uuid` | **14.0.1** | **UUID v7 généré côté client sur toute écriture** (cadrage §11.5 point 1, constitution principe 6). `crypto.randomUUID()` rend un **v4**, aléatoire et **non ordonnable dans le temps** : rien de présent ne produit un v7. Le paquet expose `dist/v7.js` (vérifié sur `https://data.jsdelivr.com/v1/packages/npm/uuid@14.0.1`) et **n'a aucune dépendance** · `https://registry.npmjs.org/uuid/latest`, **2026-08-07** |
| `idb` | **8.0.3** | **File hors-ligne persistante, session et réglages de scénario** (SYN-02). `localStorage` est **synchrone** et bloquerait le premier rendu sur l'Android 2 Go d'Aminata ; IndexedDB brut est fondé sur des événements. Aucune dépendance. **Même magasin que la clé d'appareil de PWA-05** — choisi une fois · `https://registry.npmjs.org/idb/latest`, **2026-08-07** |
| `knip` | **6.32.0** | **Porte P-06** — exports sans appelant, dans les deux sens. Aucune dépendance présente ne sait répondre à *« ce symbole a-t-il un appelant ? »* : ESLint juge un fichier à la fois, TypeScript compile sans se prononcer. **Seul de sa famille à lire les SFC Vue** ; `ts-prune` et `depcheck` produiraient un faux « dû » sur chaque composant. `engines.node ^20.19.0 \|\| >=22.12.0`, satisfait par Node 24.18.1 · `https://registry.npmjs.org/knip/latest`, **2026-08-07** |
| `@vitest/coverage-v8` | **4.1.10** | **Seconde propriété de P-06** — tout point d'entrée « branché » est **exercé par un test**. `vitest` seul exécute sans dire ce qui a été touché ; le rapport v8 porte la couverture **par fonction**, ce qui distingue « ce fichier est testé » de « cette méthode est appelée ». `peerDependencies.vitest` est **exact et satisfait** : `4.1.10` · `https://registry.npmjs.org/@vitest/coverage-v8/latest`, **2026-08-07** |
| `@intlify/eslint-plugin-vue-i18n` | **4.5.1** | **Aucune chaîne visible en dur** (constitution principe 8, TRX-08) — règle `@intlify/vue-i18n/no-raw-text`, qui échoue **en nommant le fichier et la ligne**. `eslint-plugin-vue 10.10.0` n'a **aucune règle de texte brut**. `peerDependencies.eslint` porte `^10.0.0`, satisfait par eslint 10.8.0 · `https://registry.npmjs.org/@intlify/eslint-plugin-vue-i18n/latest`, **2026-08-07** |
| `@nuxtjs/i18n` | **10.6.0** | i18n fr/en, fr par défaut (principe VIII) |
| `openapi-typescript` | **7.13.0** | **Génère les types TS depuis `openapi.json`** — le seul artefact généré (principe I·a), soumis à la porte du client généré |
| `openapi-fetch` | **0.17.0** | Client fetch typé, ~6 kB — **écrit à la main, jamais généré** |
| `typescript` | **5.9.3** ⚠️ | `peerDependency` de `openapi-typescript` — **dernière 5.x, pas la dernière stable** |
| `vitest` | **4.1.10** | Tests de l'application et des surfaces web |
| `eslint` | **10.8.0** | Lint — porte : aucune API de plateforme appelée hors `PlatformAdapter` |
| `@eslint/js` | **10.0.1** | Configuration de base d'eslint |
| `eslint-plugin-vue` | **10.10.0** | Règles Vue |
| `typescript-eslint` | **8.65.0** | Règles TypeScript |
| `@tailwindcss/vite` | **4.3.3** | Greffon Vite de Tailwind 4 — aligné sur `tailwindcss` |
| `@vue/test-utils` | **2.4.11** | Montage de composants Vue en test — **SC-005** : aucun service inactif dans le HTML rendu |
| `happy-dom` | **20.11.1** | Environnement DOM de Vitest, requis par le montage ci-dessus |
| `@vitejs/plugin-vue` | **6.0.8** | Compile les composants monofichiers pour Vitest **hors Nuxt** — sans lui, `@vue/test-utils` ne peut monter aucun `.vue` |
| `@playwright/test` | **1.62.1** | Harnais **end-to-end** — porte **P-04** : l'application démarre et chaque route s'atteint. Runner, fixtures et `expect` à réessai inclus ; télécharge ses navigateurs sur le poste, **jamais dans le paquet livré** |
| `@types/node` | **24.13.3** ⚠️ | Types du runtime — **dernière `24.x`, alignée sur Node `24.18.1`**, pas la dernière stable |
| `@phosphor-icons/web` | **2.1.2** | **Source des glyphes d'icônes** — sous-réglée à la construction, jamais expédiée telle quelle (porte des ressources embarquées) |
| `subset-font` | **2.5.0** | Sous-règle la police d'icônes ; **contrôle tiers** des polices de texte par harfbuzz — outil de génération, absent du paquet livré |
| `@fontsource-variable/archivo` | **5.3.0** | **Source d'Archivo** — texte et titres, embarquée en local (porte des ressources embarquées) |
| `@fontsource-variable/chivo-mono` | **5.3.0** | **Source de Chivo Mono** — montants, quantités, heures ; le tabulaire qui aligne les colonnes |

#### Coquille PWA — pourquoi `vite-plugin-pwa` et non `@vite-pwa/nuxt`

Le §3.2 portait `@vite-pwa/nuxt` avec la mention « **à vérifier au cycle qui l'ajoute** ». **Le cycle F1 est ce cycle, la vérification est faite, et elle est négative.**

| Interrogé le **2026-08-07** | `https://registry.npmjs.org/@vite-pwa/nuxt` |
|---|---|
| `dist-tags.latest` | **1.1.1** |
| `description` | « Zero-config PWA for **Nuxt 3** » |
| `dependencies["@nuxt/kit"]` | **`^3.9.0`** |
| Portée du constat | Les **huit dernières versions publiées** portent **toutes** `@nuxt/kit ^3.9.0` |

`^3.9.0` **ne satisfait pas** le `@nuxt/kit` 4.x de Nuxt 4.5.1 : le module installerait un **second `@nuxt/kit`** en 3.x dans le même arbre — deux membres d'une même famille, ce que la règle 7 du §1 refuse. Et un module qui annonce « Nuxt 3 » sur sa dernière version est du **terrain non défriché pour un développeur seul**, ce qui est le critère d'arbitrage du §2.

**C'est l'application littérale de la règle 1** : la dernière stable, **sauf conflit constaté**. Le conflit est constaté, pas supposé — on descend donc à la brique que l'enveloppe enveloppait.

**Ce qu'on perd, et pourquoi ça ne coûte rien** : l'enveloppe apporte des auto-imports (`$pwa`) et une intégration aux devtools. La coquille **n'expose aucune de ses fonctions aux composants** — tout passe par `PlatformAdapter` (constitution, principe 7). Il n'y a rien à auto-importer. Et la spécification du cycle demande explicitement une coquille « **mince et remplaçable**, rien de métier dans le service worker » : une enveloppe de cadriciel autour d'une enveloppe de cadriciel va dans l'autre sens, et **Capacitor la rendra caduque**.

**Condition de levée** : `@vite-pwa/nuxt` publie une version dont `@nuxt/kit` accepte `^4`. À vérifier **sur ses `dependencies`**, pas sur son numéro de version, qui peut monter sans changer sa contrainte. *Même précaution que pour `openapi-typescript` ↔ `typescript` ci-dessous.*

#### Génération du client TypeScript — pourquoi ces deux paquets et pas un générateur de SDK

**Le choix repose sur une séparation, pas sur un outil** : `openapi-typescript` produit
**uniquement un fichier de types**, dérivé mécaniquement du contrat ; `openapi-fetch` est une
bibliothèque runtime **installée, jamais générée**. L'unique artefact soumis à cette porte est
donc un fichier de types, sans code d'exécution — ce qui réduit la surface de diff au strict dérivé
du contrat. Un générateur de SDK complet (`@hey-api/openapi-ts`, `orval`, `oazapfts`) produirait
des fichiers de client à chaque exécution, multipliant les occasions de faux positif. Ils sont tous
viables ; **le critère retenu est la taille de la sortie générée**.

`openapi-fetch` pèse ~6 kB, ce qui compte : la persona Aminata travaille sur un Android d'entrée de
gamme en réseau intermittent.

**Deux exigences que l'outil doit satisfaire, à valider au cycle qui l'introduit :**

1. **Déterminisme d'octet.** Deux exécutions successives sur le même `openapi.json` DOIVENT
   produire deux fichiers identiques. À vérifier par `cmp`, pas par lecture. Sans cette propriété,
   la porte échoue au hasard et sera désactivée sous trois semaines.
2. **Ordre stable des membres**, indépendant de l'ordre de découverte des routes par utoipa. À
   vérifier en ajoutant un endpoint en fin de fichier Rust et en constatant que le diff reste local.

> ⚠️ **TypeScript est en `5.9.3` et NON en `7.x`, et c'est un conflit constaté, pas une préférence.**
> `openapi-typescript` déclare `peerDependencies: { typescript: "^5.x" }`, et TypeScript 7 — la
> réimplémentation native — a modifié l'API `ts.factory` sur laquelle le générateur s'appuie.
> L'exécution échoue immédiatement :
>
> ```
> TypeError: Cannot read properties of undefined (reading 'createKeywordTypeNode')
>     at openapi-typescript/dist/lib/ts.mjs:11:28
> ```
>
> **C'est l'application littérale de la règle 1** : la dernière stable, sauf conflit constaté ; on
> descend **au minimum** — la dernière `5.x` — et on écrit la condition de levée.
> **Condition de levée** : `openapi-typescript` publie une version déclarant `typescript ^7`. À
> vérifier sur ses `peerDependencies`, pas sur son numéro de version, qui peut monter sans changer
> sa contrainte.
>
> **La leçon générale** : « dernière version stable » suppose que les versions sont compatibles
> entre elles. **Vérifier les `peerDependencies` d'un paquet, pas seulement son numéro** — c'est le
> contrôle que le §4.3 doit automatiser.

#### Playwright — deux moteurs, et la révision de navigateur n'est pas épinglable

`@playwright/test` est le harnais **end-to-end** : il vérifie que l'application démarre et que
chaque route s'atteint. C'est ce qu'aucun test de composant ne prouve — monter un composant avec
`@vue/test-utils` contourne le routeur, `<Suspense>`, les layouts et les plugins.

**Une seule ligne épingle toute la chaîne** : `@playwright/test` dépend de `playwright` en version
**exacte**, qui dépend de `playwright-core` en version exacte. C'est `@playwright/test` et non
`playwright` parce que le premier **embarque le runner** — `test`, les fixtures, `expect` à
réessai, les reporters.

⚠️ **La porte exerce `chromium` ET `webkit`, et ce n'est pas négociable** : une PWA s'exécute dans
le navigateur réel de l'utilisateur — Chromium sur Android et sur les postes Windows, **WebKit sur
tout iPhone et iPad, sans exception possible** (iOS impose WebKit à tous les navigateurs). Tester
sur Chromium seul, c'est ne pas tester la moitié du parc, et la moitié la plus contrainte.
La porte doit **compter les cas par projet et refuser si un moteur n'en a aucun**, plutôt que de
passer au vert sur un seul.

⚠️ **La révision de navigateur n'est pas épinglable séparément** : elle est figée dans le
`browsers.json` de `playwright-core`, et **le cache du poste ne sert que si les révisions
coïncident**. WebKit pèse environ trois fois Chromium (≈ 294 Mio contre ≈ 95). **Le jour où un
serveur d'intégration lance la vérification (phase 3), prévoir le
cache explicitement sur les deux révisions**, ou employer une image Playwright — sinon chaque
exécution repart du réseau.

**Hors périmètre de la porte des ressources embarquées, et ce n'est pas une dérogation** :
Playwright télécharge des navigateurs mais ne s'exécute **jamais** dans le produit. Cette porte ne
porte que sur ce que l'**application** charge
à l'exécution. Même raison pour la licence : elle n'entre pas à
`docs/conformite/licences-tierces.md`, qui inventorie les œuvres **embarquées**.

**Déclaré à la RACINE, pas dans `app/`** — même motif qu'ESLint : la porte exerce les trois
surfaces servies, `app/` d'abord, `web/qr` et `web/console` dès qu'elles auront des écrans.

#### Les polices sont embarquées, jamais chargées depuis un CDN

`docs/design/theme.css` prescrit de les servir en local (`woff2`, `font-display: swap`) « parce que
le produit tourne sur des liaisons lentes et doit s'afficher hors ligne ». Ce n'est pas cosmétique :
`tokens.md` §2 fait de **Chivo Mono tabulaire** la condition de l'alignement des colonnes de
montants — sur une police système de repli, un écran de caisse affiche des montants désalignés.

**Variable plutôt que statique, sur mesure** : quatre fichiers variables (deux familles × `latin`
et `latin-ext`, axe `wght` 100→900) pèsent **114 ko** ; l'équivalent statique demande **douze**
fichiers pour **153 ko**. Le produit emploie quatre graisses d'Archivo et deux de Chivo Mono.

**Aucun sous-réglage de caractères, contrairement aux icônes** : le texte est dynamique — noms de
clients, communes, libellés saisis. Un sous-réglage produirait un caractère manquant sur un nom
propre ivoirien, constaté en production. On se limite aux **sous-ensembles de script** : `latin`
**et** `latin-ext`, jamais `latin` seul, qui ne porte ni Ÿ ni les latines étendues.

> ⚠️ **U+202F n'existe ni dans Archivo ni dans Chivo Mono, et il faut l'ajouter.** `tokens.md` §2
> impose l'espace fine insécable **U+202F** entre les groupes de milliers et avant le F
> (`12 500 F`). **Le caractère est absent des `woff2` de Fontsource ET des `ttf` amont de Google
> Fonts** — ce que seule la lecture de la table `cmap` révèle, la `unicode-range` déclarée
> annonçant pourtant `U+2000-206F`. Sans correction, chaque montant fait tomber son séparateur sur
> une police de repli, de chasse inconnue : **les colonnes ne s'alignent plus**, la propriété même
> que Chivo Mono doit garantir.
>
> **Le remède** : ajouter à la `cmap` l'association **U+202F → dessin de U+2009** (THIN SPACE),
> présent dans les deux familles. Aucun glyphe n'est créé. Les chasses sont mesurées et le
> choix tient : en Archivo, U+2009 vaut 193 pour 1000 contre 209 pour l'espace mot — la fine
> attendue ; en Chivo Mono, 600 comme tout autre caractère — **la cellule pleine, donc l'alignement
> tabulaire tenu**. L'insécabilité vient du caractère U+202F lui-même, de catégorie Unicode `Zs`
> non sécable : on lui donne un dessin, on ne le substitue pas.
>
> **Deux propriétés à vérifier** : le **déterminisme à l'octet** (condition d'un mode `--verifier`
> — Brotli est déterministe à paramètres fixés, encore faut-il les poser explicitement) et la
> **validité par un tiers** — `subset-font`, donc harfbuzz, le moteur de mise en forme des
> navigateurs, doit ouvrir les fichiers et retenir U+202F en sous-réglant sur « 12 500 F ». Ce
> contrôle n'est pas décoratif : un décodeur écrit pour l'occasion relit sans rien voir des
> fichiers auxquels manque le **complément d'alignement sur quatre octets** que le décodeur de
> référence exige.

#### La police d'icônes est sous-réglée, jamais embarquée entière

`@phosphor-icons/web` est la **source** des glyphes ; ce qui part au client est un sous-ensemble
produit par `subset-font` et commité. **279 ko pour les deux variantes complètes, contre ≈ 9 ko
pour les glyphes réellement employés** : la persona Aminata travaille sur un Android d'entrée de
gamme en réseau intermittent, et 270 ko d'icônes jamais affichées retardent le premier écran à
chaque installation.

⚠️ **La version doit être ALIGNÉE sur celle des maquettes** — deux versions différentes donnent
deux dessins d'icône, écart qu'aucune porte ne verrait. Et la maquette charge Phosphor depuis un
CDN : **l'application ne le fait jamais**, ce que la porte des ressources embarquées refuse.

#### `@types/node` suit la ligne majeure du runtime, pas la dernière stable

Node est en LTS `24.x` (§3.3) : la dernière `24.x` des types est la seule valeur cohérente.
**Condition de suivi** : toute montée de Node impose de remonter ce paquet à la même majeure.

### 3.3 Environnement d'exécution

Absent de la liste du principe XI, mais Nuxt ne s'exécute pas sans. Inscrit ici pour que la
reconstruction soit reproductible.

| Brique | Version | Publiée le | Registre |
|---|---|---|---|
| **Node.js** | **24.18.1** (LTS « Krypton ») | 2026-07-28 | `https://nodejs.org/dist/index.json` |
| **pnpm** | **11.18.0** | — | `https://registry.npmjs.org/pnpm/latest` |

> **LTS, pas la dernière stable.** Node 26.5.1 existe (2026-07-28) mais n'est pas LTS. Pour une
> chaîne de build qui doit tenir 15 mois sans surprise, la LTS est le bon choix ; c'est une
> dérogation raisonnée au « dernière stable » du principe XI, consignée ici comme telle.
> À figer par `.nvmrc` **et** par le champ `engines` du `package.json`.

### 3.4 Familles exclusives — le seul garde-fou de la liberté d'ajouter

La règle 4 du §1 rend l'ajout libre. Son unique limite : **une famille, une implémentation.** Deux
dépendances qui font la même chose ne cohabitent pas — c'est ce qui produit deux formats de date
dans un même dépôt, ou deux moteurs de chiffrement dont un seul est audité.

| Famille | Retenu | Écartés — ne pas introduire |
|---|---|---|
| Date et heure (Rust) | `time` | `chrono` |
| Erreurs de bibliothèque (Rust) | `thiserror` | `anyhow`, `eyre` — acceptables dans un **binaire**, jamais dans un crate de `crates/` |
| Chiffrement symétrique | `aes-gcm` (RustCrypto) | `ring`, `aws-lc-rs`, `openssl`, `pgcrypto` — motif au §6 |
| Dérivation de clé et hachage | `argon2` | `bcrypt`, `scrypt`, `pbkdf2` |
| Décimales exactes | `rust_decimal` | `bigdecimal`, et **tout flottant** sur une quantité (principe V) |
| Client HTTP sortant | *aucun encore* | dès qu'un cycle en a besoin, **il tranche pour tout le dépôt** et l'inscrit ici |
| Sérialisation | `serde` / `serde_json` | — |
| Accès base | `sqlx` | `diesel`, `sea-orm` — brique du §2 |
| **Données simulées du front** *(phase 2)* | **AUCUNE BIBLIOTHÈQUE** — la couche de simulation **implémente les interfaces de domaine**, en mémoire, sans HTTP. *Tranché par le cycle **F1**, 2026-08-07* | **MSW** — occuperait le **seul emplacement de service worker**, que la coquille PWA détient déjà : conflit d'enregistrement, et le service worker ne doit **rien porter de métier**. **MirageJS** — un second modèle de données à tenir en regard de `docs/modele-donnees/`, donc deux vérités. **json-server** — un **service distant**, ce que la phase 2 interdit. Motif complet : `specs/003-coquille-application/research.md` §2.1 |
| **Outillage de coquille PWA** *(nouveau — cycle F1)* | **`vite-plugin-pwa`** | `@vite-pwa/nuxt` — **conflit `@nuxt/kit ^3.9.0` constaté le 2026-08-07**, encadré du §3.2 ; et tout service worker écrit à la main |
| **Stockage local persistant du front** *(nouveau — cycle F1)* | **`idb`** | `dexie`, `localforage`, et **`localStorage` brut** pour toute donnée de file — il est synchrone et bloque le premier rendu sur un Android 2 Go |
| **Identifiants générés côté client** *(nouveau — cycle F1)* | **`uuid`** (fonction `v7`) | `nanoid`, `ulid`, `cuid`, et **toute implémentation maison** — RFC 9562 exige la monotonicité intra-milliseconde, qu'une implémentation maison rate en silence, et le défaut ne se voit qu'au rejeu |
| **État partagé du front** *(nouveau — cycle F1)* | **`useState` de Nuxt + composables** — *intégré, aucune dépendance* | **Pinia**, Vuex, et tout magasin tiers. Écarté par la **règle 4 du §1 elle-même** : les dépendances présentes suffisent. La marche arrière est mécanique — un composable se transpose en magasin sans toucher un appelant ; l'inverse serait coûteux |
| **Analyse des exports sans appelant** *(nouveau — cycle F1)* | **`knip`** | `ts-prune`, `depcheck`, `unimported` — aucun ne lit les SFC Vue, donc tous produiraient un **faux « dû »** sur chaque composant, ce qui ferait désactiver la porte P-06 en trois semaines |
| **Coquille native** *(différée)* | *aucune — l'application est une PWA* | Tauri, Electron, React Native. Le jour où le besoin natif se manifeste, c'est **Capacitor** qui entre (cadrage §13.3), et il entre au §2 |

**Une famille absente de ce tableau n'est pas une famille libre : c'est une famille non encore
rencontrée.** Le cycle qui l'ouvre choisit pour tout le dépôt et inscrit sa ligne — c'est le
moment où le choix coûte le moins, et le seul où il est encore réversible.

**Ce tableau se tient à la main, et c'est assumé** : il porte des arbitrages, pas des versions.
Aucun générateur ne peut décider que `chrono` est écarté.

---

## 4. Où l'épinglage est matérialisé

### 4.1 Fichiers du dépôt

| Fichier | Porte | Contenu attendu |
|---|---|---|
| `rust-toolchain.toml` | P-03 | `channel = "1.97.1"` — jamais `stable` |
| `Cargo.toml` (workspace) | P-03 | `[workspace.dependencies]` en versions exactes, héritées par tous les crates |
| `Cargo.lock` | P-03 | **Commité**, y compris pour les binaires |
| `package.json` | P-03 | Versions exactes, sans `^` ni `~` ; `engines.node` |
| `pnpm-lock.yaml` | P-03 | **Commité** |
| `.nvmrc` | P-03 | `24.18.1` |
| `compose.yml` | P-03 | Tags d'image exacts du §4.2 — **jamais `latest`** — **existe depuis le cycle D1** |

> ⚠️ **Aucun de ces fichiers n'existe encore dans ce dépôt, à l'exception de `compose.yml`**, créé
> par le cycle D1 avec le seul service `postgres_verification` sur le tag exact `postgres:18.4`.
> Pour les autres lignes, le tableau dit ce que le cycle de démarrage doit produire, pas ce qu'il
> trouvera. **Les valeurs du §2 et du §3 sont à revérifier à ce moment-là** : elles datent du
> 2026-08-04 et le régime du §1 demande la dernière stable compatible, pas la dernière connue.

> **`compose.yml` existe, et P-03 n'existe pas encore : l'écart est écrit plutôt que tu.** Le cycle
> D1 crée le fichier sans créer la porte — sa spécification approuvée dit « deux portes et rien de
> plus », et ce `compose.yml` ne déclare aucune dépendance du produit, seulement une base de
> vérification jetable. **L'exposition résiduelle est d'une ligne** : un `latest` glissé dans ce
> fichier ne serait vu par aucune porte d'ici au cycle qui créera le premier manifeste. Ce qui la
> couvre en attendant est un **constat humain daté**, consigné au rapport du cycle D1
> (`specs/001-modele-donnees-socle/rapport-de-cycle.md`), et sa fin est connue : le cycle qui crée
> `Cargo.toml` crée P-03, qui absorbe `compose.yml` avec le reste.

> **`Cargo.lock` est commité même pour un binaire** : c'est ce qui rend la reconstruction
> identique à six mois d'écart, condition du support à distance du parc auto-hébergé
> (cadrage §10.2).

### 4.2 Images Docker — disponibilité vérifiée le 2026-07-30

| Service | Tag exact | Publié le | Architectures |
|---|---|---|---|
| PostgreSQL | `postgres:18.4` | 2026-07-19 | 386, **amd64**, arm, **arm64**, ppc64le, riscv64, s390x |
| Redis | `redis:8.8.1` | 2026-07-25 | 386, **amd64**, arm, **arm64**, ppc64le, riscv64, s390x |
| Garage | `dxflrs/garage:v2.3.0` | 2026-04-16 | 386, **amd64**, arm, **arm64** |

Les trois images sont **multi-architecture**, donc le même `compose.yml` fonctionne en
développement sur poste Apple Silicon (`arm64`) et en production sur VPS Contabo (`amd64`).

> **Piège de `dxflrs/garage` à connaître** : le dépôt publie en continu des tags de **hash de
> commit**, qui noient les tags sémantiques dans tout listing trié par date. Toujours interroger
> par nom (`?name=v2.3.0`), jamais lire la première page de tags.

> **Le binaire Rust, lui, n'est pas multi-architecture.** Un `cargo build` sur poste Apple
> Silicon produit un binaire `aarch64-apple-darwin` non déployable sur le VPS. La construction de
> production se fait **dans Docker pour `linux/amd64`** (build multi-étapes), jamais par copie
> d'un binaire construit localement. Corollaire : les mesures de performance faites sur le poste
> de développement ne prédisent pas celles de la production.

---

### 4.3 Ce que la porte P-03 ne vérifie pas — complément à écrire

La porte **P-03** vérifie la **forme** : aucun intervalle, aucun `latest`, des
lockfiles suffisants. Il le documente lui-même et le motive bien — comparer les **valeurs** aux
registres officiels ferait de la vérification une dépendance réseau.

**Mais ce fichier est un fichier du dépôt.** Comparer les manifestes à `docs/versions-reference.md`
ne demande aucun réseau, et comble le trou qui a laissé passer `typescript 7.0.2` puis sa
correction silencieuse en `5.9.3`, puis sept crates absentes du document pendant six semaines.

**Le complément est un MIROIR, en un seul régime.** L'ancien en distinguait deux — un tableau
« opposable » tenu à la main et un tableau « miroir » engendré — parce qu'il fallait protéger des
briques que la revue seule pouvait toucher. Cette distinction tombe avec la revue :

| | Ce que le générateur fait | Ce qu'il ne fait pas |
|---|---|---|
| §2, §3.1, §3.2, §3.3, §4.2 | lit les manifestes, réécrit les tableaux, **refuse si le commité diffère** | choisir une version |
| §3.4 familles exclusives | vérifie qu'aucun couple exclu ne cohabite | décider qu'une famille est exclue |
| Commentaires de justification | vérifie leur **présence** au-dessus de chaque ligne | juger si le motif est bon |

Une seule question suffit — *ce fichier est-il celui que les manifestes engendrent ?* — et un seul
mode de réparation : relancer le générateur. Par construction, il ne peut ni omettre une
dépendance du code, ni en inventer une que le code n'a pas.

Ce qui reste à vérifier au-delà de la simple égalité :

- **les `peerDependencies` de chaque paquet**, ce qui aurait attrapé la contradiction
  `openapi-typescript ^5.x` ↔ `typescript 7.0.2` à la source. C'est le contrôle qui **matérialise
  la règle 1** : la dernière stable est prise sauf conflit constaté, et un conflit se constate là ;
- **les familles exclusives du §3.4** — deux membres d'une même famille dans les manifestes est un
  échec, et c'est le seul garde-fou de la liberté d'ajouter ;
- **la présence du commentaire de justification** au-dessus de chaque ligne ajoutée (§1, règle 4).
  Un ajout sans motif écrit passe la porte de la forme et perd celui de l'intention.

Sans ce complément, ce fichier est un document que rien n'oppose au code — et c'est d'autant plus
grave qu'il n'y a plus de revue humaine derrière. *Un test négatif prouve qu'une porte sait
échouer, il ne prouve pas qu'elle regarde tout* ; *une échéance sans porte est un rappel, pas un
contrôle*. Ces deux leçons sont les seules choses que l'ancien régime laisse en héritage, et elles
valent toujours.

## 5. Reproduire la vérification

À rejouer **quand un événement appelle une vérification** — ouverture d'un cycle, ajout d'une
dépendance, avis de sécurité, blocage constaté (§1, règle 6). Aucune de ces commandes ne dépend
d'un cache.

```sh
# Rust — canal stable officiel
curl -sS https://static.rust-lang.org/dist/channel-rust-stable.toml \
  | grep -A2 '^\[pkg\.rust\]'

# Crates Rust — crates.io exige un User-Agent
UA="kaya-version-check (angenor99@gmail.com)"
for c in actix-web sqlx utoipa utoipa-swagger-ui utoipa-actix-web actix-cors \
         tokio serde uuid redis aws-sdk-s3 sentry tracing tracing-subscriber \
         jsonwebtoken argon2 rust_decimal aes-gcm serde_json time thiserror; do
  printf "%-22s " "$c"
  curl -sS -H "User-Agent: $UA" "https://crates.io/api/v1/crates/$c" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['crate']['max_stable_version'])"
done

# Paquets npm
for p in nuxt tailwindcss @vite-pwa/nuxt @nuxtjs/i18n pnpm \
         openapi-typescript openapi-fetch typescript \
         @phosphor-icons/web subset-font \
         @fontsource-variable/archivo @fontsource-variable/chivo-mono \
         @playwright/test; do
  printf "%-22s " "$p"
  curl -sS "https://registry.npmjs.org/$(echo $p | sed 's|/|%2F|')/latest" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['version'])"
done

# Playwright — la révision de navigateur, que le numéro npm ne donne PAS.
# `browsers.json` de playwright-core fait foi ; la révision n'est pas épinglable séparément, et
# un écart avec le cache du poste = un navigateur de ~95 Mio à retélécharger.
PW=$(curl -sS https://registry.npmjs.org/@playwright%2Ftest/latest \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['version'])")
echo "@playwright/test $PW"
curl -sS "https://cdn.jsdelivr.net/npm/playwright-core@$PW/browsers.json" \
  | python3 -c "
import sys, json
# Les DEUX moteurs de P-04 : chromium couvre Windows et Android, webkit couvre macOS, iOS et
# Linux. N'en relever qu'un rendrait la vérification aveugle sur trois cibles du produit.
for e in json.load(sys.stdin)['browsers']:
    if e['name'] in ('chromium', 'webkit'):
        print(' ', e['name'], 'rev', e['revision'], '| version', e.get('browserVersion'))
"
ls -1 "${PLAYWRIGHT_BROWSERS_PATH:-$HOME/Library/Caches/ms-playwright}" 2>/dev/null \
  | grep -E '^(chromium|webkit)-' || echo "  (aucun navigateur en cache)"

# PostgreSQL — la version « current » est celle à retenir
curl -sS https://www.postgresql.org/versions.json \
  | python3 -c "import sys,json;[print(v['major']+'.'+v['latestMinor'],'EOL',v['eolDate']) for v in json.load(sys.stdin) if v['current']]"

# Redis
curl -sS https://api.github.com/repos/redis/redis/releases \
  | python3 -c "import sys,json;[print(r['tag_name'],r['published_at'][:10]) for r in json.load(sys.stdin)[:3] if not r['prerelease']]"

# Garage
curl -sS "https://git.deuxfleurs.fr/api/v1/repos/Deuxfleurs/garage/releases?limit=3" \
  | python3 -c "import sys,json;[print(r['tag_name'],r['published_at'][:10]) for r in json.load(sys.stdin) if not r['prerelease']]"

# Node.js — LTS, pas la dernière stable
curl -sS https://nodejs.org/dist/index.json \
  | python3 -c "import sys,json;v=[x for x in json.load(sys.stdin) if x['lts']][0];print(v['version'],v['lts'],v['date'])"

# Images Docker — TOUJOURS interroger par nom, jamais lire la 1re page de tags
for pair in "library/postgres:18.4" "library/redis:8.8.1" "dxflrs/garage:v2.3.0"; do
  repo="${pair%:*}"; tag="${pair#*:}"
  curl -sS "https://registry.hub.docker.com/v2/repositories/$repo/tags?name=$tag&page_size=5" \
    | python3 -c "
import sys,json
for t in json.load(sys.stdin)['results']:
    if t['name']=='$tag':
        a=sorted({i['architecture'] for i in (t.get('images') or []) if i.get('architecture')})
        print('$repo:$tag', t['last_updated'][:10], '|', ','.join(a)); break
else: print('$repo:$tag INTROUVABLE')"
done
```

**Compatibilité inter-crates** — à rejouer si `utoipa` monte de version majeure :

```sh
UA="kaya-version-check (angenor99@gmail.com)"
curl -sS -H "User-Agent: $UA" \
  "https://crates.io/api/v1/crates/utoipa-actix-web/0.1.2/dependencies" \
  | python3 -c "import sys,json;[print(d['crate_id'],d['req']) for d in json.load(sys.stdin)['dependencies'] if d['kind']=='normal']"
```

---

## 6. Journal des versions

*Une ligne par changement de version, avec sa date et son motif. Le journal se remplit au fil des
changements ; il n'a pas d'entrée avant la première inscription réelle d'un manifeste.*

| Version | Date | Modification |
|---|---|---|
| `postgres:18.4` | 2026-08-06 | **Première matérialisation.** Cycle D1 — le tag exact du §4.2 entre dans `compose.yml`, service `postgres_verification`. Valeur **reprise du §2 sans revérification**, sur instruction explicite du cycle : elle a été vérifiée le 2026-07-30 et ce cycle n'ouvre aucune famille nouvelle. Aucune montée, aucune dépendance ajoutée. |
| **6 ajouts · 1 écartement · 6 familles** | 2026-08-07 | **Cycle F1 — la planification.** Premier cycle de phase 2, donc **premier manifeste JavaScript du dépôt**. ⚠️ **`@vite-pwa/nuxt` est ÉCARTÉ sur conflit constaté** — `@nuxt/kit ^3.9.0` sur ses huit dernières versions, contre Nuxt 4.5.1 — et remplacé par **`vite-plugin-pwa 1.3.0`** ; c'est la levée de la mention « à vérifier au cycle qui l'ajoute » que le §3.2 portait depuis le 2026-08-04. **Cinq autres ajouts** : `uuid 14.0.1` (UUID v7 client — `crypto.randomUUID()` rend un v4), `idb 8.0.3` (file persistante — `localStorage` est synchrone), `knip 6.32.0` et `@vitest/coverage-v8 4.1.10` (les **deux propriétés** de la porte P-06), `@intlify/eslint-plugin-vue-i18n 4.5.1` (aucune chaîne en dur). **Toutes interrogées sur leur registre officiel le 2026-08-07**, jamais de mémoire. **Six familles du §3.4 tranchées**, dont **« Données simulées du front », que le tableau adressait explicitement au « premier cycle d'écran »** : aucune bibliothèque, la couture est l'interface de domaine — MSW est écarté parce qu'il occuperait le seul emplacement de service worker, que la coquille détient. **Pinia est écarté** au titre de la règle 4 : `useState` de Nuxt suffit. ⚠️ **Aucune de ces lignes n'est encore dans un manifeste** : `package.json` est créé par l'implémentation, et **P-03 — que ce cycle crée aussi — comparera les deux sens** dès qu'il existera. |
| *(aucune)* | 2026-08-07 | **Cycle D2 — aucune dépendance introduite, aucune montée, aucune famille du §3.4 ouverte.** Le cycle ajoute 47 tables SQL, une porte en Bash et de la documentation : ni `Cargo.toml`, ni `package.json`, ni `rust-toolchain.toml`, ni `.nvmrc`, et **aucun service ajouté à `compose.yml`**. L'unique outil employé — `psql` — est embarqué dans l'image `postgres:18.4` déjà inscrite, et n'est donc pas une dépendance du dépôt. L'extension **`btree_gist`**, exercée pour la première fois par la contrainte d'exclusion de `hebergement.occupation`, est **livrée avec PostgreSQL** et n'a aucune version à épingler ; elle était déjà posée par `00-conventions.sql` depuis le cycle D1, explicitement pour ce jour. **L'exposition résiduelle de P-03 est inchangée** : une ligne, `postgres:18.4`, dans un fichier que ce cycle ne touche pas. *Cette ligne existe parce qu'un journal muet sur un cycle laisse croire qu'on a oublié de l'y écrire.* |
