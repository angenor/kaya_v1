/**
 * LE VOCABULAIRE DE FORMES DU COMPOSANT 04 — fixe, et valable pour TOUT le
 * produit (`docs/design/composants.md` §04).
 *
 * ⚠️ LA FORME ET LA COULEUR SONT LIÉES ICI, ET NON PASSÉES SÉPARÉMENT. « Un état
 * n'est jamais porté par la couleur seule » : les découpler laisserait un écran
 * associer un losange au danger, et le vocabulaire cesserait d'être un
 * vocabulaire. On choisit un ÉTAT ; la forme et le ton en découlent.
 *
 * Deux motifs, et ils se cumulent : sur un 1366 × 768 délavé par le soleil, une
 * nuance ne se distingue pas ; pour un daltonien, elle ne se distingue jamais.
 *
 * ⚠️ IL VIT DANS SON PROPRE MODULE PARCE QU'UN `<script setup>` NE PEUT RIEN
 * EXPORTER. Ce n'est pas un contournement : le vocabulaire est employé par les
 * tests et par d'autres composants, donc il n'appartient à aucun d'eux.
 */
export interface ApparencePastille {
  /** Le nom de la forme, tel que `composants.md` §04 le donne. */
  readonly forme: 'losange' | 'rond' | 'carre' | 'triangle' | 'cercle-vide' | 'roue'
  /** Les utilitaires de la marque — jamais une valeur littérale. */
  readonly marque: string
  readonly fond: string
  readonly encre: string
  readonly bord: string
}

export const ETATS_PASTILLE = {
  acquis: {
    forme: 'losange',
    marque: 'size-2 rotate-45 bg-succes',
    fond: 'bg-succes-soft',
    encre: 'text-succes-fort',
    bord: 'border-succes',
  },
  enCours: {
    forme: 'rond',
    marque: 'size-2 rounded-pleine bg-alerte',
    fond: 'bg-alerte-soft',
    encre: 'text-alerte-fort',
    bord: 'border-alerte',
  },
  libre: {
    forme: 'carre',
    marque: 'size-2 rounded-xs bg-succes',
    fond: 'bg-succes-soft',
    encre: 'text-succes-fort',
    bord: 'border-succes',
  },
  casse: {
    forme: 'triangle',
    marque: 'size-2 bg-danger [clip-path:polygon(50%_0,100%_100%,0_100%)]',
    fond: 'bg-danger-soft',
    encre: 'text-danger-fort',
    bord: 'border-danger',
  },
  horsLigne: {
    forme: 'cercle-vide',
    marque: 'size-2 rounded-pleine border-2 border-ink-3',
    fond: 'bg-tile',
    encre: 'text-ink-3',
    bord: 'border-line-2',
  },
  attente: {
    forme: 'roue',
    marque: 'size-3 animate-roue rounded-pleine border-2 border-info/30 border-t-info',
    fond: 'bg-info-soft',
    encre: 'text-info-fort',
    bord: 'border-info',
  },
} as const satisfies Record<string, ApparencePastille>

export type EtatPastille = keyof typeof ETATS_PASTILLE

/** Les six états, dans l'ordre du vocabulaire. Employé par le guide de style. */
export const ETATS_PASTILLE_ORDONNES = Object.keys(ETATS_PASTILLE) as readonly EtatPastille[]
