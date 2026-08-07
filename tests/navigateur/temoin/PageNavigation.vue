<script setup lang="ts">
/**
 * LE POINT DE DÉPART DE LA NAVIGATION INTERNE — page de test, jamais du produit.
 *
 * ⚠️ POURQUOI ELLE EXISTE. Prouver que « la racine du gabarit ne se démonte pas
 * à la navigation » demande une navigation INTERNE — celle que le routeur fait
 * sans recharger le document. Un `goto` de Playwright recharge toujours : il
 * prouverait seulement que le gabarit se reconstruit à l'identique, ce qui n'est
 * pas la même chose.
 *
 * Il faut donc un lien à cliquer. Le poser dans une page du produit reviendrait
 * à écrire du produit pour un test ; l'index des écrans en portera de vrais, et
 * il les portera pour l'exploitant, pas pour la suite.
 */
</script>

<template>
  <div data-ecran="temoin-navigation">
    <NuxtLink
      to="/_temoin-cycle-de-vie"
      data-lien="temoin"
    >
      {{ $t('ecrans.titre') }}
    </NuxtLink>
  </div>
</template>
