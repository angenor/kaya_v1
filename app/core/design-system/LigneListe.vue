<script setup lang="ts">
/**
 * COMPOSANT 08 · LIGNE DE LISTE
 *
 * Rôle : l'unité de tous les registres — séjours, consommations, écritures,
 * chambres.
 * États : repos · survol · sélectionnée (contrefort indigo) · en attente d'envoi
 *         · annulée (barrée, 60 % d'opacité) · ligne de total.
 *
 * ⚠️ NUMÉRO ET MONTANT EN MONO, EN COLONNE DE LARGEUR FIXE, ALIGNÉS À DROITE.
 * C'est ce qui fait que l'œil descend une COLONNE et non un texte. La largeur
 * fixe protège aussi l'alignement quand un séparateur de milliers tombe sur une
 * police de repli — ce qui arrive, U+202F étant absent des deux familles.
 *
 * ⚠️ LES ACTIONS DE BORD N'APPARAISSENT QU'AU SURVOL, et la ligne entière est
 * cliquable. Un îlot de clic à l'intérieur ferait rater la cible une fois sur
 * trois sur un téléphone tenu à une main.
 *
 * ⚠️ LA LIGNE DE TOTAL EST TOUJOURS HORS DÉFILEMENT — c'est au conteneur de la
 * poser, pas à ce composant.
 */
export type EtatLigne = 'repos' | 'selectionnee' | 'enAttente' | 'annulee' | 'total'

withDefaults(
  defineProps<{
    /** Le numéro, la référence, le code — toujours en mono. */
    reference?: string
    libelleCle?: string
    /** Un libellé déjà résolu, pour ce que le catalogue ne porte pas (un nom). */
    libelle?: string
    sousTitreCle?: string
    sousTitre?: string
    /** Le montant DÉJÀ FORMATÉ — voir `app/core/format/montant.ts`. */
    montant?: string
    etat?: EtatLigne
    /** Quand la ligne mène quelque part. */
    vers?: string
  }>(),
  {
    reference: undefined,
    libelleCle: undefined,
    libelle: undefined,
    sousTitreCle: undefined,
    sousTitre: undefined,
    montant: undefined,
    etat: 'repos',
    vers: undefined,
  },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <component
    :is="vers ? 'NuxtLink' : 'div'"
    :to="vers"
    class="flex h-14 items-center gap-3 border-b border-line px-4 transition-colors duration-90"
    :class="[
      etat === 'total'
        ? 'border-t-2 border-t-line-2 font-semibold'
        : 'cursor-pointer hover:bg-prim-soft',
      etat === 'selectionnee' && 'rounded-r-xl border-l-4 border-l-prim bg-prim-soft',
      etat === 'annulee' && 'opacity-60 line-through',
    ]"
    :data-etat="etat"
    @click="$emit('activer')"
  >
    <span
      v-if="reference"
      class="w-9 shrink-0 font-mono text-corps text-ink-3"
    >{{ reference }}</span>

    <span class="flex min-w-0 flex-1 flex-col">
      <span class="truncate font-titre text-action font-semibold text-ink">
        {{ libelleCle ? $t(libelleCle) : libelle }}
      </span>
      <span
        v-if="sousTitreCle || sousTitre"
        class="truncate text-mini text-ink-3"
      >{{ sousTitreCle ? $t(sousTitreCle) : sousTitre }}</span>
    </span>

    <slot name="fin" />

    <span
      v-if="montant"
      class="w-24 shrink-0 text-right font-mono text-corps font-bold whitespace-nowrap text-ink"
    >{{ montant }}</span>
  </component>
</template>
