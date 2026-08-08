<script setup lang="ts">
/**
 * COMPOSANT 01 · BOUTON PRINCIPAL
 *
 * Rôle : l'action qui fait avancer la journée. UN SEUL PAR ÉCRAN.
 * États : repos · survol · appui · focus clavier · en cours · désactivé ·
 *         pleine largeur · variante danger · **variante accueil**.
 *
 * ⚠️ LA VARIANTE ACCUEIL EST AJOUTÉE AU CYCLE F2, SUR CONSTAT DE MAQUETTE :
 * `h-15` et `shadow-bouton-grand` sur les quatre `R1-accueil*.html`. Ce n'est
 * pas un bouton plus gros pour faire joli — c'est **le seul geste que l'accueil
 * propose**, et il doit se trouver sans lire, à un mètre, sur un écran qu'on
 * consulte debout. Le `h-11` ordinaire le rendait équivalent au bouton discret
 * posé juste en dessous.
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
    /** `h-15` + relief accentué : l'action unique de l'accueil. */
    accueil?: boolean
  }>(),
  {
    libelleEnCoursCle: undefined,
    enCours: false,
    desactive: false,
    danger: false,
    comptoir: false,
    accueil: false,
  },
)

defineEmits<{ activer: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="desactive || enCours"
    data-mouvement="tactile"
    class="inline-flex cursor-pointer items-center justify-center gap-2.5 px-5 font-titre font-semibold transition-[transform,box-shadow,background-color] duration-90 ease-entree active:translate-y-0.5"
    :class="[
      comptoir ? 'h-12 w-full' : accueil ? 'h-15 w-full px-6' : 'h-11 min-w-42',
      accueil ? 'rounded-xl text-titre-s' : 'rounded-lg text-action',
      danger
        ? 'bg-danger text-prim-ink shadow-bouton-danger hover:brightness-110'
        : accueil
          ? 'bg-prim text-prim-ink shadow-bouton-grand hover:brightness-105'
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
