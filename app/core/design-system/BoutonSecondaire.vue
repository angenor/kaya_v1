<script setup lang="ts">
/**
 * COMPOSANT 02 · BOUTON SECONDAIRE
 *
 * Rôle : l'issue à côté du bouton principal — annuler, remettre à plus tard,
 * revenir.
 * États : repos · survol · appui · désactivé · avec icône · neutre.
 *
 * ⚠️ JAMAIS DEUX SECONDAIRES CÔTE À CÔTE. Si deux sorties existent, l'une est un
 * bouton discret : deux contours identiques ne disent pas laquelle compte.
 *
 * ⚠️ L'ÉPAISSEUR DE 1,5 px EST UNE VALEUR ARBITRAIRE ASSUMÉE — Tailwind 4 n'a
 * pas d'espace de nom pour les épaisseurs de bordure. C'est la décision n° 1 de
 * `docs/design/README.md`, et la règle de lint (c) l'exempte nommément.
 */
withDefaults(
  defineProps<{
    libelleCle: string
    /** Classe d'icône Phosphor, sans le préfixe de variante. */
    icone?: string
    /** Quand l'action n'est pas une action de produit — « Plus tard ». */
    neutre?: boolean
    desactive?: boolean
  }>(),
  { icone: undefined, neutre: false, desactive: false },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="desactive"
    class="inline-flex h-11 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] bg-transparent px-4.5 font-titre text-action font-semibold transition-colors duration-90 ease-entree active:translate-y-0.5"
    :class="neutre ? 'border-line-2 text-ink-2 hover:bg-tile' : 'border-prim text-prim hover:bg-prim-soft'"
    @click="$emit('activer')"
  >
    <i
      v-if="icone"
      :class="['ph', icone, 'text-titre-s']"
      aria-hidden="true"
    />
    {{ $t(libelleCle) }}
  </button>
</template>
