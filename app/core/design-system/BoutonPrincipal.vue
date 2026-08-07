<script setup lang="ts">
/**
 * COMPOSANT 01 · BOUTON PRINCIPAL
 *
 * Rôle : l'action qui fait avancer la journée. UN SEUL PAR ÉCRAN.
 * États : repos · survol · appui · focus clavier · en cours · désactivé ·
 *         pleine largeur · variante danger.
 *
 * ⚠️ L'OMBRE PLEINE DE 2 px TOMBE À L'APPUI — seul relief du système, et SEUL
 * MOUVEMENT JAMAIS RÉDUIT (mouvement.md, patron P5). Sous « réduire les
 * animations » il garde ses 90 ms, parce qu'il ne raconte rien : il confirme
 * que le doigt a été vu.
 *
 * ⚠️ EN COURS, LA ROUE NE REMPLACE RIEN — ELLE S'AJOUTE, et le libellé change.
 * Un bouton dont le texte disparaît laisse l'utilisateur sans repère sur ce
 * qu'il vient de déclencher.
 *
 * ⚠️ LA VARIANTE DANGER N'APPARAÎT QUE POUR UNE ACTION IRRÉVERSIBLE. Tout le
 * reste s'annule par le composant 14, qui laisse huit secondes.
 */
withDefaults(
  defineProps<{
    /** Clé i18n — jamais du texte. */
    libelleCle: string
    /** Clé i18n du libellé « en cours » — « Envoi… ». */
    libelleEnCoursCle?: string
    enCours?: boolean
    desactive?: boolean
    danger?: boolean
    /** `h-12 w-full` : téléphone et comptoir. */
    comptoir?: boolean
  }>(),
  {
    libelleEnCoursCle: undefined,
    enCours: false,
    desactive: false,
    danger: false,
    comptoir: false,
  },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="desactive || enCours"
    class="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-lg px-5 font-titre text-action font-semibold transition-[transform,box-shadow,background-color] duration-90 ease-entree active:translate-y-0.5"
    :class="[
      comptoir ? 'h-12 w-full' : 'h-11 min-w-42',
      danger
        ? 'bg-danger text-prim-ink shadow-bouton-danger hover:brightness-110'
        : 'bg-prim text-prim-ink shadow-bouton hover:bg-prim-dk',
      'active:shadow-bouton-appui',
    ]"
    @click="$emit('activer')"
  >
    <span
      v-if="enCours"
      class="size-3 animate-roue rounded-pleine border-2 border-prim-ink/30 border-t-prim-ink"
      aria-hidden="true"
    />
    {{ enCours && libelleEnCoursCle ? $t(libelleEnCoursCle) : $t(libelleCle) }}
  </button>
</template>
