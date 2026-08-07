import type { CodeCapacite } from '~/core/plateforme/PlatformAdapter'
import type { ActionAutorisable } from '~/core/session/useAutorisation'

/**
 * LE CATALOGUE DES ACTIONS QUE LA COQUILLE SAIT MONTRER.
 *
 * ⚠️ CE NE SONT PAS DES PARAMÈTRES MÉTIER, CE SONT DES IDENTIFIANTS DE CONTRAT.
 * Les codes de permission et les codes de module sont ceux de
 * `docs/modele-donnees/` — `comptes.permission.code` et
 * `etablissements.module_activite.code`. Ils se lisent comme une route se lit :
 * une chaîne stable, partagée entre le client et le serveur. Aucun barème,
 * aucun seuil, aucune valeur qu'un exploitant règle.
 *
 * ⚠️ LE LIBELLÉ EST UNE CLÉ i18n, JAMAIS LE `libelle` DE LA TABLE. La table
 * porte « Arrêter la note et enregistrer le départ », qui est la définition du
 * droit ; l'écran dit « Encaisser le départ », qui est le geste. Et le `libelle`
 * de la table n'existe qu'en français — le rendre casserait la parité.
 *
 * ⚠️ AUCUNE ENTRÉE NE NOMME UN RÔLE. On montre ce qui est possible, pas la
 * mécanique qui l'autorise : les mots « rôle » et « permission » n'atteignent
 * jamais l'écran (lexique).
 */

export interface ActionDeLaCoquille extends ActionAutorisable {
  /** La clé i18n du geste, dans les mots de l'exploitant. */
  readonly libelleCle: string
  /** Classe d'icône Phosphor. */
  readonly icone: string
  /**
   * La capacité de plateforme que le geste sollicite. `null` quand il n'en
   * demande aucune.
   *
   * ⚠️ ELLE EST DÉCLARÉE ICI POUR QUE L'INTERFACE PUISSE L'ANNONCER **AVANT LA
   * TENTATIVE** (FR-055). Une capacité manquante découverte au clic produit un
   * échec ; déclarée, elle produit une phrase et une alternative. ⚠️ **Et elle
   * ne retire PAS l'action** : encaisser reste possible sans imprimante — c'est
   * le TICKET qui part ailleurs. Retirer le geste ferait perdre la vente.
   */
  readonly capaciteRequise: CodeCapacite | null
}

export const ACTIONS_DE_LA_COQUILLE: readonly ActionDeLaCoquille[] = [
  {
    permission: 'hebergement.passage.ouvrir',
    moduleCode: 'HEBERGEMENT',
    libelleCle: 'actions.passageOuvrir',
    icone: 'ph-door-open',
    capaciteRequise: null,
  },
  {
    permission: 'hebergement.sejour.arrivee',
    moduleCode: 'HEBERGEMENT',
    libelleCle: 'actions.arrivee',
    icone: 'ph-sign-in',
    capaciteRequise: 'SCAN_CODE',
  },
  {
    permission: 'hebergement.sejour.depart',
    moduleCode: 'HEBERGEMENT',
    libelleCle: 'actions.depart',
    icone: 'ph-sign-out',
    capaciteRequise: 'IMPRESSION_THERMIQUE',
  },
  {
    permission: 'caisse.encaisser',
    moduleCode: null,
    libelleCle: 'actions.encaisser',
    icone: 'ph-money',
    capaciteRequise: 'IMPRESSION_THERMIQUE',
  },
  {
    permission: 'caisse.cloture',
    moduleCode: null,
    libelleCle: 'actions.cloture',
    icone: 'ph-lock-simple',
    capaciteRequise: 'TIROIR_CAISSE',
  },
  {
    permission: 'ventes.commande.prendre',
    moduleCode: 'RESTAURATION',
    libelleCle: 'actions.commandePrendre',
    icone: 'ph-fork-knife',
    capaciteRequise: null,
  },
  {
    permission: 'ventes.commande.remise',
    moduleCode: 'RESTAURATION',
    libelleCle: 'actions.commandeRemise',
    icone: 'ph-percent',
    capaciteRequise: null,
  },
  {
    permission: 'pilotage.lire',
    moduleCode: null,
    libelleCle: 'actions.pilotage',
    icone: 'ph-chart-line',
    capaciteRequise: null,
  },
  {
    permission: 'etablissement.gerer',
    moduleCode: null,
    libelleCle: 'actions.etablissement',
    icone: 'ph-gear',
    capaciteRequise: null,
  },
]
