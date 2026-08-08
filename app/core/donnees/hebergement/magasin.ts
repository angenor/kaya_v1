import type {
  Accompagnant,
  FichePolice,
  LigneSejour,
  NoteSejour,
  NumerotationFichePolice,
  Occupation,
  Sejour,
  TaxeSejourConstat,
} from '~/core/donnees/hebergement/types'
import { mouvementDeloria } from '~/core/donnees/jeux/deloria'
import { reglagesCourants } from '~/core/scenarios/reglages'

/**
 * LE MAGASIN DE MOUVEMENT SIMULÉ — **l'état que les écritures modifient**.
 *
 * ⚠️ **IL DISPARAÎT AU BRANCHEMENT DE LA PHASE 3**, avec le reste de la
 * simulation. C'est pour cela qu'il vit ici et non dans un composable : aucun
 * écran ne le connaît, aucun test de composant ne l'importe. On remplace
 * `simulation.ts` par le client généré, et ce fichier part avec.
 *
 * ⚠️ **IL SE RECHARGE QUAND LE CAS DU JEU CHANGE, ET SEULEMENT ALORS.** Le
 * recharger à chaque lecture effacerait les écritures de la démonstration — on
 * donnerait une chambre, et elle serait libre au rendu suivant. Ne jamais le
 * recharger figerait le jeu au premier cas choisi, et basculer sur « tout est
 * pris » ne montrerait rien.
 *
 * ⚠️ **ET IL N'EST PAS UNE BASE DE DONNÉES.** Il ne sérialise rien, ne persiste
 * rien, ne survit pas à un rechargement de page. *La file hors-ligne, elle,
 * persiste — et c'est une autre propriété, portée par un autre fichier.*
 */

export interface EtatMouvement {
  occupations: Occupation[]
  sejours: Sejour[]
  notes: NoteSejour[]
  lignes: LigneSejour[]
  accompagnants: Accompagnant[]
  fichesPolice: FichePolice[]
  numerotations: NumerotationFichePolice[]
  constatsTaxe: TaxeSejourConstat[]
  /**
   * LES IDENTIFIANTS DE DEMANDE DÉJÀ TRAITÉS — **la déduplication**.
   *
   * ⚠️ **ELLE EXISTE DÈS LA PHASE 2, ET CE N'EST PAS DU ZÈLE.** Sans elle, le
   * premier rejeu réel découvrirait un comportement que rien n'aurait exercé :
   * un double tap sur un réseau lent créerait deux occupations, donc deux
   * encaissements, sur une chambre qui n'a été donnée qu'une fois.
   */
  demandesTraitees: Map<string, unknown>
}

let etat: EtatMouvement | null = null
let casCharge: string | null = null

function charger(cas: 'nominal' | 'dense' | 'complet'): EtatMouvement {
  const jeu = mouvementDeloria(cas)
  return {
    occupations: [...jeu.occupations],
    sejours: [...jeu.sejours],
    notes: [...jeu.notes],
    lignes: [...jeu.lignes],
    accompagnants: [...jeu.accompagnants],
    fichesPolice: [...jeu.fichesPolice],
    numerotations: [...jeu.numerotations],
    constatsTaxe: [...jeu.constatsTaxe],
    demandesTraitees: new Map(),
  }
}

/** L'état courant, rechargé si — et seulement si — le cas du jeu a changé. */
export function mouvement(): EtatMouvement {
  const cas = reglagesCourants().casDuJeu
  if (etat === null || casCharge !== cas) {
    etat = charger(cas)
    casCharge = cas
  }
  return etat
}

/**
 * Repose le magasin — **employé par les tests, jamais par le produit**.
 *
 * ⚠️ Sans lui, deux tests d'écriture partageraient leur état, et le second
 * passerait ou échouerait selon l'ordre d'exécution.
 */
export function reposerMouvement(): void {
  etat = null
  casCharge = null
}
