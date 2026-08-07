<script setup lang="ts">
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import { CHOIX_THEME, useTheme } from '~/core/theme/useTheme'

/**
 * LES DEUX RÉGLAGES DE LA COQUILLE — le thème et la langue.
 *
 * ⚠️ CE NE SONT PAS DES PARAMÈTRES D'ÉTABLISSEMENT. Ils appartiennent à
 * L'APPAREIL : le poste de réception passe en sombre au coucher du soleil, et le
 * téléphone du propriétaire garde le clair. Les mettre dans la configuration
 * d'établissement les rendrait communs à toute l'équipe — ce qui serait faux.
 * C'est pourquoi ils vivent dans la barre d'en-tête et non dans `G1`.
 *
 * Tous deux emploient le COMPOSANT 12 : « deux à quatre options courtes, toutes
 * visibles ». Trois pour le thème, deux pour la langue — la règle tient.
 */
const { choix, choisir } = useTheme()
const { locale } = useI18n()

const OPTIONS_THEME: readonly OptionSegment[] = CHOIX_THEME.map((valeur) => ({
  valeur,
  libelleCle: `theme.${valeur}`,
}))

const OPTIONS_LANGUE: readonly OptionSegment[] = [
  { valeur: 'fr', libelleCle: 'langue.fr' },
  { valeur: 'en', libelleCle: 'langue.en' },
]

const themeChoisi = computed({
  get: () => choix.value,
  set: (valeur: string) => choisir(valeur as (typeof CHOIX_THEME)[number]),
})

const langueChoisie = computed({
  get: () => locale.value,
  set: (valeur: string) => {
    locale.value = valeur as typeof locale.value
  },
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <SelecteurSegmente
      v-model="themeChoisi"
      :options="OPTIONS_THEME"
      data-reglage="theme"
    />
    <SelecteurSegmente
      v-model="langueChoisie"
      :options="OPTIONS_LANGUE"
      data-reglage="langue"
    />
  </div>
</template>
