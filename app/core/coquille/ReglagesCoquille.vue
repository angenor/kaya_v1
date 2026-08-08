<script setup lang="ts">
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import { LANGUES, type Langue, persisterLangue } from '~/core/i18n/useLangue'
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
 *
 * ⚠️ **EN VARIANTE COMPACTE DANS LA BARRE, ET C'EST UN CONSTAT DE CAPTURE.**
 * « Clair · Sombre · Comme l'appareil » et « Français · English » occupaient à
 * eux seuls le tiers de l'en-tête : « Passer la main » passait sur DEUX LIGNES
 * et les fonctions de la personne étaient tronquées à trois mots. Un réglage
 * d'appareil ne doit pas écraser le repère d'orientation ni l'identité de qui
 * travaille — c'est l'ordre de la grammaire d'en-tête, pas une question de goût.
 *
 * ⚠️ LES OPTIONS RESTENT **TOUTES VISIBLES**, et les mots restent DANS le
 * document : l'icône porte le sens à l'œil, le libellé le porte au lecteur
 * d'écran et à l'infobulle. Rien n'est caché, tout est raccourci.
 *
 * ⚠️ ET LA LANGUE GARDE SON CODE, PAS UNE ICÔNE. Il n'existe pas d'icône d'une
 * langue : un drapeau désigne un pays, jamais une langue — le français d'Abidjan
 * n'est pas celui de Paris, et l'anglais du Ghana n'est pas celui de Londres.
 * « FR » et « EN » sont les codes que tout le monde lit ; le nom complet, dans sa
 * propre langue, reste en infobulle comme le lexique l'exige.
 */
const { choix, choisir } = useTheme()
const { locale } = useI18n()

/**
 * ⚠️ LES TROIS ICÔNES SONT CELLES QU'ON DEVINE SANS LÉGENDE : le soleil, la
 * lune, et l'appareil pour « comme l'appareil ». Elles sont écrites en toutes
 * lettres, jamais interpolées — Tailwind et le sous-réglage des polices élaguent
 * ce qu'ils ne voient pas, et une icône absente du paquet ne rend rien du tout.
 */
const ICONES_THEME: Readonly<Record<string, string>> = {
  clair: 'ph-sun',
  sombre: 'ph-moon',
  systeme: 'ph-device-mobile',
}

const OPTIONS_THEME: readonly OptionSegment[] = CHOIX_THEME.map((valeur) => ({
  valeur,
  libelleCle: `theme.${valeur}`,
  icone: ICONES_THEME[valeur],
}))

const OPTIONS_LANGUE: readonly OptionSegment[] = LANGUES.map((valeur) => ({
  valeur,
  libelleCle: `langue.${valeur}`,
  abrege: valeur.toUpperCase(),
}))

const themeChoisi = computed({
  get: () => choix.value,
  set: (valeur: string) => choisir(valeur as (typeof CHOIX_THEME)[number]),
})

const langueChoisie = computed({
  get: () => locale.value,
  set: (valeur: string) => {
    locale.value = valeur as typeof locale.value
    persisterLangue(valeur as Langue)
  },
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <SelecteurSegmente
      v-model="themeChoisi"
      :options="OPTIONS_THEME"
      compact
      data-reglage="theme"
    />
    <SelecteurSegmente
      v-model="langueChoisie"
      :options="OPTIONS_LANGUE"
      compact
      data-reglage="langue"
    />
  </div>
</template>
