<script setup lang="ts">
/**
 * COMPOSANT 05 · TUILE D'ACTION
 *
 * Rôle : la grande cible de l'écran d'accueil — un geste du métier par tuile,
 * quatre à six au total.
 * États : repos · survol · appui · avec compteur · désactivée (rôle) · compacte.
 *
 * ⚠️ SURFACE ENTIÈREMENT CLIQUABLE, PAS D'ÎLOT DE CLIC À L'INTÉRIEUR. Sur un
 * téléphone tenu à une main, un îlot de clic se rate.
 *
 * ⚠️ LE COMPTEUR NE S'AFFICHE QUE S'IL Y A DU TRAVAIL EN ATTENTE, JAMAIS À ZÉRO.
 * Un « 0 » permanent apprend à ne plus regarder le compteur.
 *
 * ⚠️ DÉSACTIVÉE, ELLE DIT **POURQUOI**. « Rôle serveuse » se comprend ; une
 * tuile grise sans phrase se prend pour une panne. ⚠️ Et une action qu'une
 * PERMISSION interdit n'est pas désactivée : elle est ABSENTE (principe 7). Cet
 * état-ci sert aux cas où l'action existe et attend autre chose.
 */
withDefaults(
  defineProps<{
    libelleCle: string
    /** Classe d'icône Phosphor. */
    icone: string
    detailCle?: string
    /** Jamais rendu à zéro — voir la règle ci-dessus. */
    compteur?: number
    motifIndisponibleCle?: string
    compacte?: boolean
  }>(),
  {
    detailCle: undefined,
    compteur: 0,
    motifIndisponibleCle: undefined,
    compacte: false,
  },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="Boolean(motifIndisponibleCle)"
    data-mouvement="tactile"
    class="flex flex-col items-start justify-between gap-3.5 rounded-lg border p-4 text-left shadow-basse transition-[transform,border-color] duration-90 ease-entree active:scale-98"
    :class="[
      compacte ? 'min-h-20' : 'min-h-28',
      motifIndisponibleCle
        ? 'cursor-not-allowed border-line bg-tile'
        : 'cursor-pointer border-line bg-surf hover:border-prim',
    ]"
  >
    <span class="flex w-full items-start justify-between gap-3">
      <i
        :class="['ph', icone, 'text-titre-l text-prim']"
        aria-hidden="true"
      />
      <span
        v-if="compteur > 0"
        class="inline-flex h-7 min-w-7 items-center justify-center rounded-pleine bg-alerte px-2 font-mono text-mini font-bold text-ocre-ink"
      >{{ compteur }}</span>
    </span>
    <span class="flex flex-col gap-0.5">
      <span class="font-titre text-titre-s font-semibold text-ink">{{ $t(libelleCle) }}</span>
      <span
        v-if="detailCle && !motifIndisponibleCle"
        class="text-mini text-ink-3"
      >{{ $t(detailCle) }}</span>
      <span
        v-if="motifIndisponibleCle"
        class="text-mini text-ink-3"
      >{{ $t(motifIndisponibleCle) }}</span>
    </span>
  </button>
</template>
