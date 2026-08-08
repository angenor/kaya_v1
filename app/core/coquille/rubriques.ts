import type { ActionAutorisable } from '~/core/session/useAutorisation'

/**
 * LES RUBRIQUES DE LA NAVIGATION LATÉRALE — **déclarées, jamais décidées**.
 *
 * ⚠️ **MÊME PATRON QUE `SURFACES_ACCUEIL`, ET C'EST DÉLIBÉRÉ.** Une entrée
 * déclare ce qu'elle **suppose** — une permission, un service — et **rien
 * d'autre** : ni si elle sera rendue, ni où elle mène, ni ce qu'il faut dire
 * quand l'écran n'existe pas encore. Trois fonctions le savent à sa place, et
 * ce sont **les mêmes que pour `R1`** : `useAutorisation.retenir()`,
 * `useEcranCible.resoudre()`. *Deux mécanismes de navigation auraient divergé au
 * troisième cycle, et le second aurait grisé ce que le premier fait disparaître.*
 *
 * ⚠️ **LE CODE D'ÉCRAN, JAMAIS UNE ROUTE.** La route vient de l'index des
 * écrans ; deux sources se contrediraient. Un écran non construit reste
 * **visible et d'apparence normale** — il dit « à venir » au tap, exactement
 * comme sur l'accueil. *Un badge « bientôt » réintroduirait le grisé par la
 * porte de derrière (SC-014).*
 *
 * ⚠️ **ET L'ACCUEIL EN FAIT PARTIE.** *Constaté à l'usage* : arrivé sur `/jour`,
 * on ne pouvait **plus revenir à l'accueil** — la barre « Vos activités » qui
 * portait ce chemin est propre à `R1`, et elle disparaît avec lui. Un produit
 * dont on ne peut pas sortir d'un écran est un produit qu'on quitte en
 * rechargeant la page.
 */

export interface EntreeNavigation extends ActionAutorisable {
  /** L'identifiant stable de l'entrée — jamais un indice de tableau. */
  readonly cle: string
  /** Le code de l'écran cible, résolu à l'index. */
  readonly ecranCible: string
  /** Clé i18n du libellé — jamais une chaîne visible. */
  readonly libelleCle: string
  /** Classe d'icône Phosphor. */
  readonly icone: string
}

export interface RubriqueNavigation {
  readonly cle: string
  readonly titreCle: string
  readonly icone: string
  readonly entrees: readonly EntreeNavigation[]
}

/**
 * ⚠️ **TROIS RUBRIQUES, ET LEUR ORDRE EST CELUI DE LA JOURNÉE**, pas celui du
 * modèle de données : on entre par l'accueil, on travaille à la réception, on
 * consulte ensuite. Un classement par module aurait mis « Hébergement » en tête
 * d'une liste que personne ne lit dans cet ordre.
 */
export const RUBRIQUES_NAVIGATION: readonly RubriqueNavigation[] = [
  {
    cle: 'nav.aujourdhui',
    titreCle: 'navigation.aujourdhui',
    icone: 'ph-sun',
    entrees: [
      // ⚠️ L'ACCUEIL N'EXIGE AUCUNE PERMISSION : il compose ce qu'il a le droit
      // de composer, et il sait le dire quand il n'a rien. Lui en exiger une
      // rendrait la sortie de secours conditionnelle.
      { cle: 'nav.accueil', permission: '', moduleCode: null, ecranCible: 'R1', libelleCle: 'navigation.accueil', icone: 'ph-house' },
      { cle: 'nav.jour', permission: 'hebergement.passage.ouvrir', moduleCode: 'HEBERGEMENT', ecranCible: 'R2', libelleCle: 'navigation.jour', icone: 'ph-bed' },
      { cle: 'nav.planning', permission: 'hebergement.passage.ouvrir', moduleCode: 'HEBERGEMENT', ecranCible: 'V1', libelleCle: 'navigation.planning', icone: 'ph-calendar-blank' },
    ],
  },
  {
    cle: 'nav.reception',
    titreCle: 'navigation.reception',
    icone: 'ph-key',
    entrees: [
      { cle: 'nav.passage', permission: 'hebergement.passage.ouvrir', moduleCode: 'HEBERGEMENT', ecranCible: 'R4', libelleCle: 'navigation.passage', icone: 'ph-key' },
      { cle: 'nav.arrivee', permission: 'hebergement.sejour.arrivee', moduleCode: 'HEBERGEMENT', ecranCible: 'R3', libelleCle: 'navigation.arrivee', icone: 'ph-user-plus' },
      { cle: 'nav.depart', permission: 'hebergement.sejour.depart', moduleCode: 'HEBERGEMENT', ecranCible: 'R7', libelleCle: 'navigation.depart', icone: 'ph-door-open' },
      { cle: 'nav.clients', permission: 'hebergement.sejour.arrivee', moduleCode: 'HEBERGEMENT', ecranCible: 'R5', libelleCle: 'navigation.clients', icone: 'ph-users-three' },
    ],
  },
  {
    cle: 'nav.services',
    titreCle: 'navigation.services',
    icone: 'ph-fork-knife',
    entrees: [
      { cle: 'nav.salle', permission: 'ventes.commande.prendre', moduleCode: 'RESTAURATION', ecranCible: 'P1', libelleCle: 'navigation.salle', icone: 'ph-fork-knife' },
      { cle: 'nav.bar', permission: 'ventes.commande.prendre.bar', moduleCode: 'BAR', ecranCible: 'P2', libelleCle: 'navigation.bar', icone: 'ph-beer-stein' },
      { cle: 'nav.pressing', permission: 'ventes.commande.prendre', moduleCode: 'PRESSING', ecranCible: 'P4', libelleCle: 'navigation.pressing', icone: 'ph-t-shirt' },
      { cle: 'nav.caisse', permission: 'caisse.cloture', moduleCode: null, ecranCible: 'C4', libelleCle: 'navigation.caisse', icone: 'ph-cash-register' },
    ],
  },
]
