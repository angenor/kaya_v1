<script setup lang="ts">
/**
 * COMPOSANT 03 · BOUTON DISCRET
 *
 * Rôle : les actions de bord — trier, filtrer, modifier une ligne, ouvrir un
 * détail.
 * États : repos · survol · danger · désactivé · icône seule · lien de retour ·
 *         **variante à contour** (ton variable).
 *
 * ⚠️ SANS FOND NI CONTOUR AU REPOS — C'EST LA FORME DE BASE, ET ELLE NE BOUGE
 * PAS. Il ne quitte jamais son bloc.
 *
 * ⚠️ LA VARIANTE À CONTOUR EST AJOUTÉE AU CYCLE F2, SUR CONSTAT DE MAQUETTE. Les
 * quatre `R1-accueil*.html` posent un contour de 1,5 px sur les actions de bord
 * de « Ensuite » et de « À régler » — `border-[1.5px] border-prim`,
 * `border-danger`, `border-alerte`, `border-info`. Le motif est lisible sur le
 * dessin : ces boutons vivent **à l'intérieur d'une carte déjà bordée**, où un
 * bouton sans contour se confond avec le texte. La forme de base reste celle des
 * actions de bord d'un registre, où la ligne fournit déjà la séparation.
 *
 * ⚠️ ET LE TON N'EST PAS DÉCORATIF : il reprend celui de la carte qui porte le
 * bouton. Un bouton indigo sur une carte de danger dirait que l'action est
 * ordinaire alors que la carte dit l'inverse.
 *
 * ⚠️ EN ICÔNE SEULE, IL PASSE À 44 px MÊME S'IL PARAÎT PLUS PETIT. C'est le
 * plancher tactile de `tokens.md` §3, et il ne connaît pas d'exception : sur un
 * Android tenu à une main, une cible de 36 px se rate une fois sur trois.
 *
 * ⚠️ L'ÉTAT ACTIF D'UN FILTRE EST `bg-prim-soft text-prim` — PAS un fond plein,
 * qui en ferait un bouton principal.
 */
withDefaults(
  defineProps<{
    libelleCle?: string
    icone?: string
    danger?: boolean
    actif?: boolean
    desactive?: boolean
    /** La variante à contour — le ton reprend celui de la carte qui le porte. */
    contour?: 'prim' | 'danger' | 'alerte' | 'info' | 'neutre'
  }>(),
  {
    libelleCle: undefined,
    icone: undefined,
    danger: false,
    actif: false,
    desactive: false,
    contour: undefined,
  },
)

/**
 * ⚠️ LES QUATRE TONS SONT ÉCRITS EN TOUTES LETTRES, jamais interpolés. Tailwind
 * élague ce qu'il ne voit pas : `border-${ton}` produirait une classe absente du
 * paquet, donc un bouton sans bordure — et rien ne le signalerait.
 */
const CONTOURS = {
  /**
   * ⚠️ LE TON NEUTRE EST CELUI DE L'ACTION SECONDAIRE DU BLOC DE TÊTE — `border-line`,
   * `text-ink-2`. Il porte un contour sans porter de couleur : l'action existe,
   * elle est offerte, et elle ne réclame pas le regard que l'indigo réclame. La
   * maquette le pose sous le bouton principal, là où deux indigos superposés
   * auraient annulé la hiérarchie qu'on vient d'établir.
   */
  neutre: 'border border-line text-ink-2 font-medium hover:border-line-2 hover:text-ink',
  prim: 'border-[1.5px] border-prim text-prim hover:bg-prim-soft',
  danger: 'border-[1.5px] border-danger text-danger-fort hover:bg-danger-soft',
  alerte: 'border-[1.5px] border-alerte text-alerte-fort hover:bg-alerte-soft',
  info: 'border-[1.5px] border-info text-info-fort hover:bg-info-soft',
} as const

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="desactive"
    :aria-label="!libelleCle && icone ? icone : undefined"
    data-composant-03
    data-mouvement="tactile"
    class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-titre text-mini font-semibold transition-colors duration-90 active:scale-97"
    :class="[
      libelleCle ? 'h-9 px-3.5' : 'size-11',
      contour
        ? CONTOURS[contour]
        : danger
          ? 'text-danger hover:bg-danger-soft'
          : actif
            ? 'bg-prim-soft text-prim'
            : 'text-ink-2 hover:bg-tile hover:text-ink',
    ]"
    @click="$emit('activer')"
  >
    <i
      v-if="icone"
      :class="['ph', icone, 'text-titre-s']"
      aria-hidden="true"
    />
    <template v-if="libelleCle">
      {{ $t(libelleCle) }}
    </template>
  </button>
</template>
