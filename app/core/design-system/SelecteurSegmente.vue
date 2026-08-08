<script setup lang="ts">
/**
 * COMPOSANT 12 · SÉLECTEUR SEGMENTÉ
 *
 * Rôle : deux à quatre options courtes, TOUTES VISIBLES.
 * États : deux options · trois options avec compteur · variante tactile (h-12).
 *
 * ⚠️ AU-DELÀ DE QUATRE OPTIONS, C'EST UNE LISTE, PAS UN SEGMENT
 * (`docs/design/composants.md` §12). La règle est vérifiée à l'exécution en
 * développement plutôt que laissée à la relecture : c'est la faute qu'on
 * commet en ajoutant une cinquième option « juste cette fois ».
 *
 * ⚠️ IL REÇOIT DES CLÉS i18n, JAMAIS DU TEXTE. Une chaîne en dur passée en
 * propriété afficherait la clé brute au premier rendu, au lieu d'attendre qu'un
 * anglophone ouvre l'application.
 *
 * ⚠️ LA BASCULE SE FAIT EN COURBE **DÉPLACEMENT**, jamais en élastique : la
 * marque de sélection reste à l'écran et change de place — c'est la définition
 * même de cette courbe (`docs/design/mouvement.md` §2).
 *
 * La hauteur de 32 px du segment n'est PAS une entorse au plancher tactile de
 * 44 px : `docs/design/tokens.md` §3 porte les deux lignes, « Touche · h-11 ·
 * plancher tactile » ET « Segment · h-8 · dans une piste h-10 ». La variante
 * `comptoir` monte à 48 px, et c'est elle qu'on emploie debout.
 */
export interface OptionSegment {
  readonly valeur: string
  /** Clé i18n — jamais du texte. */
  readonly libelleCle: string
  /** Compteur facultatif, affiché à droite du libellé. Jamais à zéro. */
  readonly compteur?: number
  /**
   * Classe d'icône Phosphor, pour la variante `iconeSeule`.
   *
   * ⚠️ ELLE NE REMPLACE PAS LE LIBELLÉ, ELLE LE MET DE CÔTÉ : le mot reste dans
   * le document — lisible par un lecteur d'écran, rendu en infobulle. Une icône
   * dont le sens ne se lit nulle part est une devinette.
   */
  readonly icone?: string
  /** Deux ou trois lettres, quand le mot entier ne tient pas — « FR », « EN ». */
  readonly abrege?: string
}

const props = withDefaults(
  defineProps<{
    options: readonly OptionSegment[]
    etiquetteCle?: string
    taille?: 'normal' | 'comptoir'
    /**
     * ⚠️ **LA VARIANTE COMPACTE DE LA BARRE D'EN-TÊTE** — ajoutée au cycle F2 sur
     * constat de capture. Trois libellés de thème et deux de langue occupaient à
     * eux seuls le tiers de la barre : « Passer la main » passait sur deux
     * lignes et les fonctions de la personne étaient tronquées à trois mots. Un
     * réglage d'appareil ne doit pas écraser le repère d'orientation ni
     * l'identité de qui travaille.
     *
     * ⚠️ ET LES OPTIONS RESTENT **TOUTES VISIBLES** — c'est la règle du §12, et
     * elle tient : ce qui change est leur forme, pas leur nombre. Le mot demeure
     * dans le document, en libellé accessible et en infobulle.
     */
    compact?: boolean
  }>(),
  { etiquetteCle: undefined, taille: 'normal', compact: false },
)

const valeur = defineModel<string>({ required: true })

if (import.meta.dev && props.options.length > 4) {
  console.warn(
    `[composant 12] ${props.options.length} options : au-delà de quatre, c'est une liste, pas un segment.`,
  )
}
</script>

<template>
  <div class="inline-flex flex-col gap-1.5">
    <span
      v-if="etiquetteCle"
      class="text-etiquette uppercase text-ink-3"
    >{{ $t(etiquetteCle) }}</span>

    <div
      class="inline-flex gap-1 rounded-lg bg-tile p-1"
      :class="taille === 'comptoir' ? 'h-14' : 'h-10'"
      role="radiogroup"
      :aria-label="etiquetteCle ? $t(etiquetteCle) : undefined"
    >
      <button
        v-for="option in options"
        :key="option.valeur"
        type="button"
        role="radio"
        :aria-checked="valeur === option.valeur"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-md font-titre font-semibold whitespace-nowrap transition-colors duration-160 ease-deplace"
        :class="[
          taille === 'comptoir' ? 'h-12 px-5 text-lead' : 'h-8 text-mini',
          taille === 'comptoir' ? '' : compact ? 'px-2.5' : 'px-4.5',
          valeur === option.valeur
            ? 'bg-prim text-prim-ink'
            : 'text-ink-2 hover:text-ink',
        ]"
        :title="compact ? $t(option.libelleCle) : undefined"
        @click="valeur = option.valeur"
      >
        <!-- ⚠️ EN COMPACT, LE MOT NE DISPARAÎT PAS : il passe en libellé
             accessible et en infobulle. Une icône seule dans le document serait
             muette pour un lecteur d'écran, et devinée par tout le monde. -->
        <i
          v-if="compact && option.icone"
          :class="['ph', option.icone, 'text-corps']"
          aria-hidden="true"
        />
        <span
          v-if="compact && option.abrege"
          aria-hidden="true"
        >{{ option.abrege }}</span>
        <span :class="compact && (option.icone || option.abrege) ? 'sr-only' : undefined">{{
          $t(option.libelleCle)
        }}</span>
        <span
          v-if="option.compteur"
          class="font-mono text-mini"
        >{{ option.compteur }}</span>
      </button>
    </div>
  </div>
</template>
