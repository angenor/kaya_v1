<script setup lang="ts">
/**
 * La racine de l'application. Elle ne porte AUCUNE logique : le cycle de vie
 * vit dans le gabarit (racine stable, un seul `<main>`), dans l'intergiciel
 * global (reprise de session) et dans le script du `<head>` (thème avant le
 * premier pixel).
 *
 * `name="defaut"` est le gabarit de repli : une page qui n'en déclare aucun le
 * reçoit sans rien écrire — c'est exactement ce que US3 doit prouver.
 */
</script>

<template>
  <NuxtLayout name="defaut">
    <NuxtPage />
  </NuxtLayout>
</template>
