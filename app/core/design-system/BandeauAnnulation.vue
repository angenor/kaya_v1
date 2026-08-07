<script setup lang="ts">
/**
 * COMPOSANT 14 · BANDEAU D'ANNULATION
 *
 * Rôle : répondre à « et si je me trompe ? » SANS COÛTER UN GESTE À CHAQUE
 * ACTION.
 * États : compte à rebours chiffré · barre · confirmation de rétablissement ·
 *         cas non annulable.
 *
 * ⚠️ TOUTE ACTION DESTRUCTRICE S'EXÉCUTE IMMÉDIATEMENT ET LAISSE 8 SECONDES POUR
 * REVENIR. Pas de fenêtre de confirmation : une confirmation coûte un geste à
 * chaque fois pour un regret qui arrive une fois sur cinquante. Le compte à
 * rebours est VISIBLE — sans lui, on ne sait pas combien de temps il reste.
 *
 * ⚠️ UNE SEULE ACTION DANS LE BANDEAU. Deux issues dans un bandeau qui disparaît
 * en huit secondes, c'est une décision qu'on n'a pas le temps de prendre.
 *
 * ⚠️ EXCEPTION : CE QUI EST FISCALEMENT IRRÉVERSIBLE. Une facture émise demande
 * une confirmation explicite et se contre-passe par un avoir — jamais par cette
 * annulation-ci.
 *
 * ⚠️ LE BOUTON FAIT 44 px, LÀ OÙ `composants.md` §14 ÉCRIVAIT `h-9` (36 px).
 * Divergence CONSTATÉE par le contrôle de zone de touche, et tranchée en faveur
 * de `tokens.md`, qui prime sur tout export : « plancher tactile, JAMAIS MOINS,
 * y compris pour une icône seule ». Et c'est la cible où l'écart coûte le plus
 * cher — on a HUIT SECONDES pour l'atteindre, une fois, et si on la rate le
 * geste est perdu. 44 px entrent exactement dans la barre de 48 px avec ses
 * 2 px de marge. `composants.md` est mis à jour dans le même changement.
 */
const props = withDefaults(
  defineProps<{
    messageCle: string
    /** Le compte à rebours restant, en secondes. */
    secondes?: number
    /** La durée totale, pour la barre. */
    secondesTotal?: number
    actionCle?: string
    /** Le cas non annulable : confirmation explicite, pas de rebours. */
    nonAnnulable?: boolean
  }>(),
  { secondes: 8, secondesTotal: 8, actionCle: undefined, nonAnnulable: false },
)

defineEmits<{ annuler: [] }>()

const partRestante = computed(
  () => `${Math.min(100, Math.max(0, (props.secondes / props.secondesTotal) * 100))}%`,
)
</script>

<template>
  <div
    class="inline-flex h-12 items-center gap-3 rounded-lg bg-ink pr-2 pl-4 shadow-panneau"
    data-composant-14
    role="status"
  >
    <span class="flex-1 text-corps font-semibold whitespace-nowrap text-bg">
      {{ $t(messageCle) }}
    </span>

    <template v-if="!nonAnnulable">
      <span class="font-mono text-mini text-bg/60">{{ secondes }}</span>
      <span class="h-1 w-12 overflow-hidden rounded-pleine bg-bg/20">
        <span
          class="block h-full rounded-pleine bg-bg/70 transition-[width] duration-160 ease-deplace"
          :style="{ width: partRestante }"
        />
      </span>
    </template>

    <button
      v-if="actionCle"
      type="button"
      class="inline-flex h-11 cursor-pointer items-center rounded-md border border-bg/30 px-3.5 font-titre text-mini font-semibold text-bg transition-colors duration-90 hover:bg-bg/10"
      @click="$emit('annuler')"
    >
      {{ $t(actionCle) }}
    </button>
  </div>
</template>
