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
    libelleCle?: string
    /**
     * UN LIBELLÉ **DÉJÀ RÉSOLU**, pour ce que le catalogue ne porte pas : une
     * heure, un nom, un décompte. L'un ou l'autre, **jamais les deux**.
     *
     * ⚠️ **CE N'EST PAS UNE ENTORSE À « AUCUNE CHAÎNE EN DUR ».** La règle vise
     * les chaînes ÉCRITES DANS LE CODE ; une donnée n'en est pas une, et la
     * phrase qui l'entoure reste au catalogue. Les composants **05**, **07** et
     * **08** portaient déjà cette paire depuis le cycle F1 ; le **02** la gagne
     * au cycle F3, quand « Garder pour 18 h 48 » a dû nommer une heure.
     */
    libelle?: string
    /** Classe d'icône Phosphor, sans le préfixe de variante. */
    icone?: string
    /** Quand l'action n'est pas une action de produit — « Plus tard ». */
    neutre?: boolean
    desactive?: boolean
  }>(),
  { libelleCle: undefined, libelle: undefined, icone: undefined, neutre: false, desactive: false },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="desactive"
    data-mouvement="tactile"
    class="inline-flex h-11 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] bg-transparent px-4.5 font-titre text-action font-semibold transition-colors duration-90 ease-entree active:translate-y-0.5"
    :class="neutre ? 'border-line-2 text-ink-2 hover:bg-tile' : 'border-prim text-prim hover:bg-prim-soft'"
    @click="$emit('activer')"
  >
    <i
      v-if="icone"
      :class="['ph', icone, 'text-titre-s']"
      aria-hidden="true"
    />
    {{ libelle ?? (libelleCle ? $t(libelleCle) : '') }}
  </button>
</template>
