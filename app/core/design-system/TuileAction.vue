<script setup lang="ts">
/**
 * COMPOSANT 05 · TUILE D'ACTION
 *
 * Rôle : la grande cible de l'écran d'accueil — un geste du métier par tuile,
 * quatre à six au total.
 * États : repos · survol · appui · avec compteur · compacte.
 *
 * ⚠️ SURFACE ENTIÈREMENT CLIQUABLE, PAS D'ÎLOT DE CLIC À L'INTÉRIEUR. Sur un
 * téléphone tenu à une main, un îlot de clic se rate.
 *
 * ⚠️ LE COMPTEUR NE S'AFFICHE QUE S'IL Y A DU TRAVAIL EN ATTENTE, JAMAIS À ZÉRO.
 * Un « 0 » permanent apprend à ne plus regarder le compteur.
 *
 * ⚠️ **IL N'Y A PAS D'ÉTAT DÉSACTIVÉ, ET C'EST UNE CORRECTION DU CYCLE F2.** Ce
 * composant portait un `motifIndisponibleCle` qui posait `disabled` et faisait
 * passer la tuile sur `bg-tile` en disant « rôle serveuse ». **Deux violations
 * en une prop** : une tuile dont la permission manque, ou dont le service est
 * inactif ici, **n'est pas rendue** (constitution, principe 8 — griser donne une
 * leçon d'organigramme sur un écran de travail et laisse une cible actionnable
 * autrement) ; et le mot « rôle » n'atteint **jamais** l'écran (lexique). Le
 * §05 de `composants.md` a été corrigé dans le même changement, et un test
 * empêche la phrase d'y revenir — mais le retirer du DOCUMENT sans le retirer
 * du CODE aurait laissé l'état à portée de main du premier écran RBAC du
 * produit, `R1`, dont onze écrans héritent le motif.
 */
withDefaults(
  defineProps<{
    libelleCle?: string
    /** Un libellé DÉJÀ RÉSOLU. L'un ou l'autre, jamais les deux. */
    libelle?: string
    /** Classe d'icône Phosphor. */
    icone: string
    detailCle?: string
    /** Un détail DÉJÀ RÉSOLU — ce que le catalogue ne porte pas : un nom, un
     *  décompte. Les deux ne coexistent pas sur une même tuile. */
    detail?: string
    /** Jamais rendu à zéro — voir la règle ci-dessus. */
    compteur?: number
    compacte?: boolean
  }>(),
  {
    libelleCle: undefined,
    libelle: undefined,
    detailCle: undefined,
    detail: undefined,
    compteur: 0,
    compacte: false,
  },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    data-mouvement="tactile"
    class="flex cursor-pointer flex-col items-start justify-between gap-3.5 rounded-lg border border-line bg-surf p-4 text-left shadow-basse transition-[transform,border-color] duration-90 ease-entree hover:border-prim active:scale-98"
    :class="compacte ? 'min-h-20' : 'min-h-28'"
    @click="$emit('activer')"
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
      <span class="font-titre text-titre-s font-semibold text-ink">{{
        libelleCle ? $t(libelleCle) : libelle
      }}</span>
      <span
        v-if="detailCle"
        class="text-mini text-ink-3"
      >{{ $t(detailCle) }}</span>
      <!-- Un détail déjà résolu — un nom de table, un décompte. Le catalogue ne
           porte pas ce qui vient des données. -->
      <span
        v-if="detail"
        class="text-mini text-ink-3"
      >{{ detail }}</span>
    </span>
  </button>
</template>
