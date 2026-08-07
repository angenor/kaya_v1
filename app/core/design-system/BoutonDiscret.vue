<script setup lang="ts">
/**
 * COMPOSANT 03 · BOUTON DISCRET
 *
 * Rôle : les actions de bord — trier, filtrer, modifier une ligne, ouvrir un
 * détail.
 * États : repos · survol · danger · désactivé · icône seule · lien de retour.
 *
 * ⚠️ SANS FOND NI CONTOUR AU REPOS, ET IL NE QUITTE JAMAIS SON BLOC.
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
  }>(),
  { libelleCle: undefined, icone: undefined, danger: false, actif: false, desactive: false },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="desactive"
    :aria-label="!libelleCle && icone ? icone : undefined"
    class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-titre text-mini font-semibold transition-colors duration-90 active:scale-97"
    :class="[
      libelleCle ? 'h-9 px-3.5' : 'size-11',
      danger ? 'text-danger hover:bg-danger-soft' : actif ? 'bg-prim-soft text-prim' : 'text-ink-2 hover:bg-tile hover:text-ink',
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
