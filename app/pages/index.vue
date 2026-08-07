<script setup lang="ts">
/**
 * LA RACINE — une redirection, POUR CE CYCLE SEULEMENT.
 *
 * ⚠️ CE N'EST PAS L'ACCUEIL DU PRODUIT. `R1` — l'accueil composé, le tableau de
 * bord de tuiles filtrées par permission — est l'un des 46 écrans, il est
 * MAQUETTÉ, et c'est le cycle F2 qui le posera ici. Y mettre aujourd'hui une
 * ébauche d'accueil serait construire par anticipation un écran dont la maquette
 * existe déjà : on le referait.
 *
 * En attendant, `/` mène à l'index des écrans — la page par laquelle le produit
 * se regarde.
 */
definePageMeta({ path: '/', redirect: '/_ecrans' })
</script>

<template>
  <div />
</template>
