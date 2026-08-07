<script setup lang="ts">
/**
 * La racine de l'application. Elle ne porte AUCUNE logique : le cycle de vie
 * vit dans le gabarit (racine stable, un seul `<main>`), dans l'intergiciel
 * global (reprise de session) et dans le script du `<head>` (thème avant le
 * premier pixel).
 *
 * ⚠️ `defaut` EST LE GABARIT DE REPLI, PAS UN GABARIT IMPOSÉ — et la nuance a
 * coûté un test rouge. `<NuxtLayout name="defaut">` **écrase** ce qu'une page
 * demande par `definePageMeta({ layout })` : `R0` recevait donc l'en-tête de
 * contexte qu'il ne doit pas avoir (FR-009), en silence, alors que la page
 * demandait bien le gabarit `vierge`. **Constaté par la suite de navigateur**,
 * qui comptait un `<header>` là où elle en attendait zéro.
 *
 * ⚠️ ET LE REPLI EST EXPLICITE PARCE QUE NOTRE GABARIT S'APPELLE `defaut`, PAS
 * `default`. Sans `name`, Nuxt chercherait `default`, ne le trouverait pas, et
 * une page qui ne déclare rien se retrouverait sans gabarit — donc sans en-tête
 * et sans `<main>`. Tout le dépôt est en français, y compris ce nom-là.
 */
type NomDeGabarit = 'defaut' | 'vierge'

const route = useRoute()
const gabarit = computed<NomDeGabarit>(
  () => (route.meta.layout as NomDeGabarit | undefined) ?? 'defaut',
)
</script>

<template>
  <NuxtLayout :name="gabarit">
    <NuxtPage />
  </NuxtLayout>
</template>
