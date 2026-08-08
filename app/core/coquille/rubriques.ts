import type { ActionAutorisable } from '~/core/session/useAutorisation'

/**
 * LES RUBRIQUES DE LA NAVIGATION LATÉRALE — **une rubrique par verticale**.
 *
 * ⚠️ **LE CLASSEMENT EST CELUI DES MODULES, PAS CELUI DE LA JOURNÉE — ET C'EST
 * UN CHANGEMENT ASSUMÉ.** La première version rangeait par moment de travail :
 * « Aujourd'hui », « La réception », « Les services ». *Constaté à la
 * relecture* : ces trois mots sont des mots d'**hôtel**. « La réception » n'a
 * aucun sens pour un pressing, et « Les services » désigne, du point de vue de
 * l'hôtel, tout ce qui n'est pas l'hébergement — soit exactement les
 * verticales qu'on rangeait dessous. Le jour où le restaurant devient
 * l'activité principale d'un client, l'arborescence lui dit que son métier est
 * un accessoire du nôtre.
 *
 * ⚠️ **ET CE CLASSEMENT-CI EST DÉJÀ CELUI DU PRODUIT.** Le back-end est un
 * monolithe modulaire à **un schéma PostgreSQL par module**, et le socle ne
 * connaît que `article_vendable` et `ressource_reservable` — jamais « chambre »
 * ni « séjour ». Une navigation par verticale n'ajoute pas une convention : elle
 * rend visible celle qui porte déjà la base et le code.
 *
 * ⚠️ **CONSÉQUENCE DIRECTE : « ABSENT, JAMAIS GRISÉ » DEVIENT STRUCTUREL.** Sur
 * « Tantie Adjo », qui n'a que l'hébergement, les rubriques Restaurant, Bar et
 * Pressing **n'existent pas** — pas une entrée atténuée, pas un intitulé vide :
 * rien. Sous l'ancien classement, la rubrique « Les services » survivait à ses
 * entrées et il fallait la faire disparaître à la main.
 *
 * ⚠️ **LE MODULE EST PORTÉ PAR LA RUBRIQUE, LA PERMISSION PAR L'ENTRÉE.** Une
 * seule déclaration chacun : `actionDe()` recompose l'`ActionAutorisable` que
 * `useAutorisation.autorise()` attend. *Répéter `moduleCode` sur chaque entrée
 * aurait divergé au premier ajout — une entrée d'hébergement marquée
 * `RESTAURATION` resterait visible dans une rubrique disparue.*
 *
 * ⚠️ **LE CODE D'ÉCRAN, JAMAIS UNE ROUTE.** La route vient de l'index des
 * écrans ; deux sources se contrediraient. Un écran non construit reste
 * **visible et d'apparence normale** — il dit « à venir » au tap, exactement
 * comme sur l'accueil. *Un badge « bientôt » réintroduirait le grisé par la
 * porte de derrière (SC-014).*
 *
 * ⚠️ **ET L'ACCUEIL EST HORS RUBRIQUE, EN TÊTE.** *Constaté à l'usage* : arrivé
 * sur `/jour`, on ne pouvait **plus revenir à l'accueil** — la barre « Vos
 * activités » qui portait ce chemin est propre à `R1`, et elle disparaît avec
 * lui. Le ranger sous une verticale le rendrait conditionnel à un module ; il
 * est la sortie de secours, il ne dépend de rien.
 */

export interface EntreeNavigation {
  /** L'identifiant stable de l'entrée — jamais un indice de tableau. */
  readonly cle: string
  /**
   * Le code de permission exigé. **Chaîne vide = aucune permission requise**,
   * et c'est le cas de l'accueil seul : lui en exiger une rendrait la sortie de
   * secours conditionnelle.
   */
  readonly permission: string
  /** Le code de l'écran cible, résolu à l'index. */
  readonly ecranCible: string
  /** Clé i18n du libellé — jamais une chaîne visible. */
  readonly libelleCle: string
  /** Classe d'icône Phosphor. */
  readonly icone: string
}

export interface RubriqueNavigation {
  readonly cle: string
  /**
   * Clé i18n de l'intitulé, ou `null` pour un groupe **sans titre**. Deux
   * groupes sont dans ce cas, et ce ne sont pas des oublis : l'accueil et la
   * caisse ne sont d'aucune verticale — les coiffer d'un intitulé inventé
   * (« Général », « Divers ») nommerait un regroupement qui n'existe pas.
   */
  readonly titreCle: string | null
  /**
   * Le module d'activité de la verticale. `null` pour un groupe transverse —
   * l'accueil, la caisse : ils existent quels que soient les modules ouverts.
   */
  readonly moduleCode: string | null
  /** L'icône qui représente la rubrique quand le rail est replié. */
  readonly icone: string
  readonly entrees: readonly EntreeNavigation[]
}

/**
 * L'ACTION AUTORISABLE D'UNE ENTRÉE — **les deux conditions, recomposées**.
 *
 * ⚠️ Elle est ici et nulle part ailleurs : c'est le seul endroit où la
 * permission de l'entrée et le module de sa rubrique se rejoignent, et c'est ce
 * qui garantit qu'ils ne peuvent pas se contredire.
 */
export function actionDe(
  rubrique: RubriqueNavigation,
  entree: EntreeNavigation,
): ActionAutorisable {
  return { permission: entree.permission, moduleCode: rubrique.moduleCode }
}

/**
 * ⚠️ **L'ORDRE DES VERTICALES EST CELUI DU PRODUIT, PAS DE L'ALPHABET** :
 * l'hébergement est la verticale du MVP, les trois autres viennent aux cycles
 * F4 et suivants. Un classement alphabétique aurait mis le bar en tête d'une
 * liste dont il est, aujourd'hui, la partie la moins construite.
 */
export const RUBRIQUES_NAVIGATION: readonly RubriqueNavigation[] = [
  {
    cle: 'nav.entree',
    titreCle: null,
    moduleCode: null,
    icone: 'ph-house',
    entrees: [
      { cle: 'nav.accueil', permission: '', ecranCible: 'R1', libelleCle: 'navigation.accueil', icone: 'ph-house' },
    ],
  },
  {
    cle: 'nav.hebergement',
    titreCle: 'navigation.hebergement',
    moduleCode: 'HEBERGEMENT',
    icone: 'ph-bed',
    entrees: [
      { cle: 'nav.heb.jour', permission: 'hebergement.passage.ouvrir', ecranCible: 'R2', libelleCle: 'navigation.jour', icone: 'ph-bed' },
      { cle: 'nav.heb.passage', permission: 'hebergement.passage.ouvrir', ecranCible: 'R4', libelleCle: 'navigation.passage', icone: 'ph-key' },
      { cle: 'nav.heb.arrivee', permission: 'hebergement.sejour.arrivee', ecranCible: 'R3', libelleCle: 'navigation.arrivee', icone: 'ph-user-plus' },
      { cle: 'nav.heb.depart', permission: 'hebergement.sejour.depart', ecranCible: 'R7', libelleCle: 'navigation.depart', icone: 'ph-door-open' },
      { cle: 'nav.heb.planning', permission: 'hebergement.passage.ouvrir', ecranCible: 'V1', libelleCle: 'navigation.planning', icone: 'ph-calendar-blank' },
      { cle: 'nav.heb.clients', permission: 'hebergement.sejour.arrivee', ecranCible: 'R5', libelleCle: 'navigation.clients', icone: 'ph-users-three' },
    ],
  },
  {
    cle: 'nav.restaurant',
    titreCle: 'navigation.restaurant',
    moduleCode: 'RESTAURATION',
    icone: 'ph-fork-knife',
    entrees: [
      { cle: 'nav.res.salle', permission: 'ventes.commande.prendre', ecranCible: 'P1', libelleCle: 'navigation.salle', icone: 'ph-fork-knife' },
      { cle: 'nav.res.commandes', permission: 'ventes.commande.prendre', ecranCible: 'P2', libelleCle: 'navigation.commandes', icone: 'ph-notepad' },
    ],
  },
  {
    // ⚠️ LE BAR EST UNE VERTICALE À PART ENTIÈRE, et pas une entrée du
    // restaurant : c'est un module distinct, une permission distincte, et un
    // hôtel peut tenir un bar sans servir un seul couvert.
    cle: 'nav.bar',
    titreCle: 'navigation.bar',
    moduleCode: 'BAR',
    icone: 'ph-beer-stein',
    entrees: [
      { cle: 'nav.bar.comptoir', permission: 'ventes.commande.prendre.bar', ecranCible: 'P2', libelleCle: 'navigation.comptoir', icone: 'ph-beer-stein' },
    ],
  },
  {
    cle: 'nav.pressing',
    titreCle: 'navigation.pressing',
    moduleCode: 'PRESSING',
    icone: 'ph-t-shirt',
    entrees: [
      { cle: 'nav.pre.depots', permission: 'ventes.commande.prendre.pressing', ecranCible: 'P4', libelleCle: 'navigation.depots', icone: 'ph-t-shirt' },
    ],
  },
  {
    // ⚠️ LA CAISSE N'EST D'AUCUNE VERTICALE, et la ranger sous l'une d'elles
    // serait une erreur de modèle : on encaisse une nuit, un plat et un
    // pressing dans le MÊME tiroir. Elle est au socle — d'où `moduleCode: null`.
    cle: 'nav.tresorerie',
    titreCle: null,
    moduleCode: null,
    icone: 'ph-cash-register',
    entrees: [
      { cle: 'nav.caisse', permission: 'caisse.cloture', ecranCible: 'C4', libelleCle: 'navigation.caisse', icone: 'ph-cash-register' },
    ],
  },
]
