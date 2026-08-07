# Registre des points d'entrée

*Une ligne par **surface publique** de la coquille. La porte **P-06** le lit et le confronte à
`knip` **dans les deux sens** ; c'est ce fichier qui déclare l'INTENTION, et `knip` qui dit le
FAIT.*

---

## Pourquoi ce registre existe — l'erreur réelle, citée

Le principe 13 n'autorise l'ajout d'une porte que sur **une erreur réelle**. Celle-ci est
documentée dans le dépôt, à [`docs/design/lexique.md`](design/lexique.md) version 1.3.0 :

> *« `fermerSession()` existait depuis le cycle CPT **sans aucun appelant** — il n'y avait,
> littéralement, **aucun moyen de sortir de sa session**. »*

Une fonction écrite, compilée, passant le lint et les tests, **et que rien n'appelait**. Le défaut
ne s'est pas vu à la compilation ; il s'est vu quand quelqu'un a cherché comment passer la main sur
un terminal partagé.

**Et ce cycle aggrave le risque** : `PlatformAdapter` livre une vingtaine de méthodes dont la
moitié n'aura d'appelant qu'en phase 3. Sans registre, cette moitié est indistinguable de code
mort — **et personne ne saurait laquelle**.

## Les deux états, et pourquoi il en faut deux

| État | Ce qu'il affirme | Ce qui le fait rougir |
|---|---|---|
| **branché** | quelque chose l'appelle **aujourd'hui** | il a **perdu son dernier appelant** |
| **dû** | rien ne l'appelle, et c'est **normal** — un cycle à venir l'attend | il a **acquis** un appelant sans qu'on l'ait dit |

> **Un contrôle « aucun export sans appelant » rendrait rouge toute méthode légitimement en
> attente.** C'est **« dû »** qui rend la porte tenable — et c'est le **second sens** qui l'empêche
> d'être muette : *sans lui, tout déclarer « branché » suffirait à la faire taire.*

## La colonne « exercé par »

| Valeur | Ce que la porte vérifie |
|---|---|
| **unité** | la fonction porte **au moins un passage** au rapport de couverture v8, **par fonction** |
| **navigateur** | rien à la couverture — l'entrée est exercée par **P-04**, en navigateur réel, sur les deux moteurs |
| **—** | l'entrée est « dû » : rien ne l'appelle, donc aucun test ne l'exerce. **C'est normal** |

> ⚠️ **« navigateur » n'est pas une dispense, et il faut dire pourquoi elle n'en est pas une.**
> `@vitest/coverage-v8` ne mesure que ce que **Vitest** exécute : un composant rendu par Chromium
> et par WebKit y porterait **zéro passage** tout en étant vérifié quatre fois par écran. Exiger la
> couverture d'unité sur les composants aurait rendu la porte rouge sur **tout le design system**,
> et on l'aurait désactivée. La preuve existe — elle est **ailleurs**, dans une porte qui tourne
> dans la même commande. ⚠️ **Et le plancher l'empêche d'être une échappatoire** : P-06 exige un
> nombre minimal d'entrées réellement couvertes par les tests d'unité.

## Le périmètre — plus large que le contrat, et c'est écrit

[`contracts/verifier-p06.md`](../specs/003-coquille-application/contracts/verifier-p06.md) §2 excluait
les **constantes** au même titre que les types. **Ce registre les inclut**, et le motif est
opposable : `knip` ne distingue pas une constante d'une fonction dans son rapport, donc un
périmètre qui les exclurait **ne serait pas calculable par la porte** — il dériverait au premier
export ajouté, sans que rien ne le dise. Les **types** restent exclus : `knip` les rend dans un
champ séparé, donc l'exclusion, elle, se calcule.

| Inclus | Exclu, et pourquoi |
|---|---|
| composables et fonctions exportées de `app/` | **les types et les interfaces** — un type n'a pas d'appelant, et `knip` les sépare |
| constantes exportées de `app/` | **les fonctions internes** non exportées — elles ne sont la surface de personne |
| composants du design system et de la coquille | **`app/core/donnees/jeux/`** — le jeu de données disparaît au branchement de la phase 3 |
| gabarits, pages, intergiciels, greffons | |

> Les pages, gabarits et greffons n'ont **aucun import** qui les désigne : c'est **Nuxt qui les
> branche par convention**, et `knip` le sait par sa configuration d'entrées. Leur colonne dit donc
> qui les monte, pas qui les importe.

---

## Le registre

| Point d'entrée | État | Exercé par | Qui l'appelle / qui l'attend |
|---|---|---|---|
| `app/app.vue` | branché | navigateur | Nuxt — racine de l’application |
| `app/core/configuration/configuration.ts#lireParametre` | branché | unité | `identifiant/normaliser.ts` — l'indicatif téléphonique par défaut est une CHAÎNE, pas un entier : c'est le premier appelant du cas général, et il est arrivé au cycle **F2** |
| `app/core/configuration/configuration.ts#lireParametreEntier` | branché | navigateur | layouts/defaut.vue |
| `app/core/configuration/configuration.ts#surchargerParametre` | branché | unité | `tests/unite/identifiant-normalisation.spec.ts` — ⚠️ **son seul appelant est un test, et c'est légitime** : le test prouve que l'indicatif VIENT de la configuration en le changeant, ce qu'un `+225` écrit en dur ne permettrait pas. L'écran de réglage reste dû au cycle **G1** |
| `app/core/configuration/configuration.ts#clesConnues` | dû | — | cycle **E5** — le registre des paramètres, qui les énumère |
| `app/core/configuration/configuration.ts#CLE_SEUIL_LATENCE_DEGRADEE` | branché | navigateur | layouts/defaut.vue |
| `app/core/coquille/BandeauCoquille.vue` | branché | navigateur | layouts/defaut.vue |
| `app/core/coquille/ReglagesCoquille.vue` | branché | navigateur | layouts/defaut.vue |
| `app/core/coquille/useCoquille.ts#useCoquille` | branché | navigateur | core/coquille/BandeauCoquille.vue · pages/scenarios.vue · plugins/coquille.client.ts |
| `app/core/coquille/useInstallation.ts#useInstallation` | branché | navigateur | core/coquille/BandeauCoquille.vue · pages/scenarios.vue |
| `app/core/design-system/BandeauAlerte.vue` | branché | navigateur | core/coquille/BandeauCoquille.vue · pages/ecrans.vue · pages/guide-de-style.vue |
| `app/core/design-system/BandeauAnnulation.vue` | branché | navigateur | pages/guide-de-style.vue |
| `app/core/design-system/BarreProportion.vue` | branché | navigateur | pages/guide-de-style.vue |
| `app/core/design-system/BoutonDiscret.vue` | branché | navigateur | core/design-system/BandeauAlerte.vue · layouts/defaut.vue · pages/guide-de-style.vue |
| `app/core/design-system/BoutonPrincipal.vue` | branché | navigateur | core/design-system/EtatVide.vue · pages/guide-de-style.vue · pages/scenarios.vue |
| `app/core/design-system/BoutonSecondaire.vue` | branché | navigateur | pages/guide-de-style.vue · pages/scenarios.vue |
| `app/core/design-system/CarteChiffre.vue` | branché | navigateur | pages/guide-de-style.vue |
| `app/core/design-system/ChampSaisie.vue` | branché | navigateur | pages/guide-de-style.vue · pages/scenarios.vue |
| `app/core/design-system/EtatVide.vue` | branché | navigateur | pages/ecrans.vue · pages/guide-de-style.vue · pages/scenarios.vue |
| `app/core/design-system/LigneListe.vue` | branché | navigateur | pages/ecrans.vue · pages/guide-de-style.vue · pages/scenarios.vue |
| `app/core/design-system/PastilleEtat.vue` | branché | navigateur | pages/ecrans.vue · pages/guide-de-style.vue |
| `app/core/design-system/SelecteurEtablissement.vue` | branché | navigateur | layouts/defaut.vue · pages/guide-de-style.vue |
| `app/core/design-system/SelecteurSegmente.vue` | branché | navigateur | core/coquille/ReglagesCoquille.vue · pages/ecrans.vue · pages/guide-de-style.vue |
| `app/core/design-system/Squelette.vue` | branché | navigateur | pages/ecrans.vue · pages/guide-de-style.vue |
| `app/core/design-system/TemoinSynchronisation.vue` | branché | navigateur | layouts/defaut.vue · pages/guide-de-style.vue · pages/scenarios.vue |
| `app/core/design-system/TuileAction.vue` | branché | navigateur | pages/ecrans.vue · pages/guide-de-style.vue |
| `app/core/design-system/etatsPastille.ts#ETATS_PASTILLE` | branché | navigateur | core/design-system/PastilleEtat.vue |
| `app/core/design-system/etatsPastille.ts#ETATS_PASTILLE_ORDONNES` | dû | — | cycle **F2** — la légende ordonnée d'un écran de registre |
| `app/core/donnees/comptes/simulation.ts#simulationComptes` | branché | navigateur | core/donnees/fournisseur.ts |
| `app/core/donnees/comptes/types.ts#TYPES_IDENTIFIANT` | dû | — | cycle **CPT** — l'écran de connexion `R0` et la création de compte |
| `app/core/donnees/comptes/types.ts#ETATS_COMPTE` | dû | — | cycle **G3** — utilisateurs et rôles |
| `app/core/donnees/contrat.ts#reussite` | branché | navigateur | core/donnees/simulationCommune.ts |
| `app/core/donnees/contrat.ts#echec` | branché | navigateur | core/donnees/simulationCommune.ts |
| `app/core/donnees/etablissements/simulation.ts#simulationEtablissements` | branché | navigateur | core/donnees/fournisseur.ts |
| `app/core/donnees/etablissements/types.ts#CLASSEMENTS_CI` | dû | — | cycle **G1** — le classement de l'établissement, à l'écran |
| `app/core/donnees/fournisseur.ts#fournisseur` | branché | navigateur | pages/ecrans.vue · pages/scenarios.vue · tests/unite/regles-opposables.spec.ts |
| `app/core/donnees/hebergement/simulation.ts#simulationHebergement` | branché | navigateur | core/donnees/fournisseur.ts |
| `app/core/donnees/hebergement/types.ts#STATUTS_MENAGE` | dû | — | cycle **F3** — le planning et la remise en état |
| `app/core/donnees/hebergement/types.ts#TYPES_FORMULE` | dû | — | cycle **F3** — l'offre d'hébergement `G2` |
| `app/core/donnees/hebergement/types.ts#REGLES_CONVERSION_TAXE` | dû | — | cycle **fiscal F6** — le `JurisdictionAdapter` |
| `app/core/donnees/simulationCommune.ts#lireSimule` | branché | navigateur | core/donnees/comptes/simulation.ts · core/donnees/etablissements/simulation.ts · core/donnees/hebergement/simulation.ts |
| `app/core/donnees/simulationCommune.ts#lireUnSimule` | branché | navigateur | core/donnees/comptes/simulation.ts · core/donnees/etablissements/simulation.ts |
| `app/core/donnees/ventes/simulation.ts#simulationVentes` | branché | navigateur | core/donnees/fournisseur.ts |
| `app/core/ecrans/index.ts#toutesLesEntrees` | branché | unité | `coquille/useEcranCible.ts` — la résolution d'un code d'écran vers sa route ou sa mention. Elle est **aussi** appelée par la porte P-04 sous Node, ce que `knip` ne voit pas ; depuis le cycle **F2**, elle a un appelant dans l'application |
| `app/core/ecrans/index.ts#entreesConstruites` | branché | navigateur | tests/navigateur/ecrans-atteignables.spec.ts |
| `app/core/ecrans/index.ts#ECRANS_PRODUIT` | branché | navigateur | pages/ecrans.vue · tests/navigateur/parcours.spec.ts |
| `app/core/ecrans/index.ts#INSTRUMENTS` | branché | navigateur | pages/ecrans.vue · tests/navigateur/parcours.spec.ts |
| `app/core/ecrans/index.ts#ROUTES_TECHNIQUES` | dû | — | `toutesLesEntrees`, en interne — aucun appelant externe, et c'est voulu |
| `app/core/ecrans/index.ts#PAGES_TEMOIN` | dû | — | idem, et seulement sous `KAYA_PAGE_TEMOIN=1` |
| `app/core/file/classes.ts#classeDe` | dû | — | cycle **SYN** — l'écran `S1`, qui montrera la classe d'une écriture au développeur |
| `app/core/file/classes.ts#classeOuDefautStrict` | branché | navigateur | core/file/useFile.ts |
| `app/core/file/classes.ts#accepteHorsLigne` | branché | navigateur | core/file/useFile.ts |
| `app/core/file/classes.ts#tailleDuRegistre` | dû | — | **le plancher de non-vacuité** d'un test de registre à venir |
| `app/core/file/useFile.ts#useFile` | branché | navigateur | layouts/defaut.vue · pages/scenarios.vue |
| `app/core/format/montant.ts#deviseConnue` | dû | — | `formaterMontant`, en interne. Aucun appelant EXTERNE — `knip` mesure les références externes, la couverture mesure les passages : les deux disent vrai |
| `app/core/format/montant.ts#formaterMontant` | branché | unité | pages/guide-de-style.vue · tests/unite/montant.spec.ts |
| `app/core/format/montant.ts#formaterEcart` | branché | unité | pages/guide-de-style.vue · tests/unite/montant.spec.ts |
| `app/core/format/montant.ts#FINE_INSECABLE` | branché | navigateur | tests/unite/montant.spec.ts |
| `app/core/format/instant.ts` | branché | navigateur | `coquille/EnTeteContexte.vue` — l'heure et la date, **au fuseau de l'établissement**. C'est la seule fonction du dépôt qui écrit une heure, et elle ne porte **aucune règle** : exemption « rendu de l'instant perçu » (principe 4) |
| `app/core/session/routesPubliques.ts#ROUTES_SANS_SESSION` | dû | — | cycle **F2** — la liste que l'intergiciel consulte via `exigeUneSession` ; aucun appelant direct, et c'est voulu : on interroge la RÈGLE, pas la liste |
| `app/core/session/routesPubliques.ts#ROUTES_SANS_ENTETE` | dû | — | même motif — `porteLEnTete` l'interroge. ⚠️ **Deux listes plutôt qu'une, et la confusion a coûté un test rouge** : les instruments n'exigent aucune session et portent pourtant l'en-tête |
| `app/core/i18n/useLangue.ts#estLangue` | dû | — | cycle **CPT** — la langue portée par le compte et non par l'appareil |
| `app/core/i18n/useLangue.ts#languePersistee` | branché | navigateur | plugins/langue.client.ts |
| `app/core/i18n/useLangue.ts#persisterLangue` | branché | navigateur | core/coquille/ReglagesCoquille.vue |
| `app/core/i18n/useLangue.ts#LANGUES` | branché | navigateur | core/coquille/ReglagesCoquille.vue |
| `app/core/i18n/useLangue.ts#LANGUE_PAR_DEFAUT` | dû | — | idem |
| `app/core/plateforme/capacites.ts#detecterMoteur` | branché | navigateur | core/plateforme/web/installation.ts |
| `app/core/plateforme/capacites.ts#registreDesCapacites` | branché | navigateur | pages/ecrans.vue |
| `app/core/plateforme/capacites.ts#capacitesAbsentes` | branché | navigateur | pages/scenarios.vue |
| `app/core/plateforme/capacites.ts#recensementBrut` | dû | — | `tests/unite/` — le test qui confronte la note lisible au code. **Il le lit par le disque, pas par un import** |
| `app/core/plateforme/capacites.ts#CODES_CAPACITE` | dû | — | cycle **T4** — l'écran de diagnostic d'appareil `E4` |
| `app/core/plateforme/web/installation.ts#surInviteInstallation` | branché | navigateur | core/coquille/useInstallation.ts |
| `app/core/plateforme/web/installation.ts#etatInstallation` | branché | navigateur | core/coquille/useInstallation.ts |
| `app/core/plateforme/web/installation.ts#proposerInstallation` | branché | navigateur | core/coquille/useInstallation.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#lirePreference` | branché | unité | core/coquille/useInstallation.ts · core/i18n/useLangue.ts · core/theme/useTheme.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#ecrirePreference` | branché | unité | core/coquille/useInstallation.ts · core/i18n/useLangue.ts · core/theme/useTheme.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#oublierPreference` | branché | unité | core/theme/useTheme.ts · tests/unite/theme.spec.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#prefereLeSombre` | branché | navigateur | core/theme/useTheme.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#surChangementDePreferenceSysteme` | branché | navigateur | core/theme/useTheme.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#CLE_THEME` | branché | navigateur | core/theme/useTheme.ts · tests/unite/theme.spec.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#CLE_LANGUE` | branché | navigateur | core/i18n/useLangue.ts |
| `app/core/plateforme/web/preferenceAppareil.ts#CLE_INVITATION_ECARTEE` | branché | navigateur | core/coquille/useInstallation.ts |
| `app/core/plateforme/web/serviceWorker.ts#serviceWorkerDisponible` | branché | navigateur | core/coquille/useCoquille.ts |
| `app/core/plateforme/web/serviceWorker.ts#enregistrerCoquille` | branché | navigateur | core/coquille/useCoquille.ts |
| `app/core/plateforme/web/serviceWorker.ts#appliquerNouvelleVersion` | branché | navigateur | core/coquille/useCoquille.ts |
| `app/core/plateforme/web/serviceWorker.ts#COQUILLE_ABSENTE` | dû | — | l'implémentation **Capacitor** de la coquille, qui rendra « aucune coquille à mettre à jour » |
| `app/core/scenarios/reglages.ts#reglagesCourants` | branché | navigateur | core/donnees/simulationCommune.ts · core/file/useFile.ts · core/scenarios/useScenarios.ts |
| `app/core/scenarios/reglages.ts#poserReglages` | branché | navigateur | core/scenarios/useScenarios.ts |
| `app/core/scenarios/reglages.ts#attendreLatence` | branché | navigateur | core/donnees/simulationCommune.ts |
| `app/core/scenarios/reglages.ts#REGLAGES_INITIAUX` | branché | navigateur | core/scenarios/useScenarios.ts |
| `app/core/scenarios/reglages.ts#CLASSES_ESSAI` | branché | navigateur | pages/scenarios.vue |
| `app/core/scenarios/useScenarios.ts#useScenarios` | branché | navigateur | layouts/defaut.vue · pages/scenarios.vue · plugins/scenarios.client.ts |
| `app/core/session/actions.ts#ACTIONS_DE_LA_COQUILLE` | branché | navigateur | pages/ecrans.vue · tests/unite/rbac-absence-html.spec.ts |
| `app/core/session/journal.ts#consignerReprise` | branché | navigateur | middleware/session.global.ts |
| `app/core/session/journal.ts#repriseDecompte` | dû | — | les suites de navigateur, qui le lisent **par le DOM** — `data-reprise-session` — et non par un import |
| `app/core/session/journal.ts#repriseDernierChemin` | dû | — | idem |
| `app/core/session/journal.ts#MARQUE_DECOMPTE` | dû | — | idem — la marque est écrite ici et lue par le navigateur |
| `app/core/session/journal.ts#MARQUE_DERNIER_CHEMIN` | dû | — | idem |
| `app/core/session/useAutorisation.ts#useAutorisation` | branché | navigateur | pages/ecrans.vue · tests/unite/rbac-absence-html.spec.ts |
| `app/core/session/useSession.ts#useSession` | branché | navigateur | core/session/useAutorisation.ts · middleware/session.global.ts · pages/ecrans.vue |
| `app/core/session/useSession.ts#SESSION_VIDE` | branché | navigateur | `coquille/IdentitePersonne.vue` — **« Passer la main »** la repose. ⚠️ Elle est restée « due » depuis le cycle CPT, en attendant l'écran qui rend le poste au suivant : c'est exactement ce que l'état « dû » sert à dire, et le registre l'a porté jusqu'au cycle qui l'a construit |
| `app/core/stockage/base.ts#ouvrirBase` | dû | — | les cinq fonctions du même fichier, en interne. Exportée pour le cycle qui aura besoin d'un magasin nouveau |
| `app/core/stockage/base.ts#lire` | branché | navigateur | core/session/useSession.ts · core/scenarios/useScenarios.ts · core/file/useFile.ts |
| `app/core/stockage/base.ts#ecrire` | branché | navigateur | core/session/useSession.ts · core/scenarios/useScenarios.ts · core/file/useFile.ts |
| `app/core/stockage/base.ts#supprimer` | branché | navigateur | core/file/useFile.ts |
| `app/core/stockage/base.ts#lireTout` | branché | navigateur | core/file/useFile.ts |
| `app/core/stockage/base.ts#viderMagasin` | branché | navigateur | core/file/useFile.ts |
| `app/core/stockage/base.ts#NOM_BASE` | dû | — | cycle **PWA-05** — le chiffrement au repos, qui ouvrira la base autrement |
| `app/core/stockage/base.ts#VERSION_BASE` | dû | — | idem — la migration de schéma IndexedDB |
| `app/core/stockage/base.ts#MAGASIN_SESSION` | branché | navigateur | core/session/useSession.ts |
| `app/core/stockage/base.ts#MAGASIN_FILE` | branché | navigateur | core/file/useFile.ts |
| `app/core/stockage/base.ts#MAGASIN_SCENARIOS` | branché | navigateur | core/scenarios/useScenarios.ts |
| `app/core/stockage/base.ts#MAGASINS` | dû | — | idem |
| `app/core/theme/useTheme.ts#estChoixTheme` | branché | unité | tests/unite/theme.spec.ts |
| `app/core/theme/useTheme.ts#choixPersiste` | branché | unité | tests/unite/theme.spec.ts |
| `app/core/theme/useTheme.ts#resoudreTheme` | branché | unité | tests/unite/theme.spec.ts |
| `app/core/theme/useTheme.ts#appliquerTheme` | branché | unité | tests/unite/theme.spec.ts |
| `app/core/theme/useTheme.ts#useTheme` | branché | navigateur | core/coquille/ReglagesCoquille.vue · pages/guide-de-style.vue · plugins/theme.client.ts |
| `app/core/theme/useTheme.ts#CHOIX_THEME` | branché | navigateur | core/coquille/ReglagesCoquille.vue · pages/guide-de-style.vue · tests/unite/theme.spec.ts |
| `app/layouts/defaut.vue` | branché | navigateur | Nuxt — gabarit par défaut de toute page |
| `app/pages/ecrans.vue` | branché | navigateur | le routeur — `/_ecrans` |
| `app/pages/guide-de-style.vue` | branché | navigateur | le routeur — `/_guide-de-style` |
| `app/pages/index.vue` | branché | navigateur | le routeur — `/` |
| `app/pages/scenarios.vue` | branché | navigateur | le routeur — `/_scenarios` |
