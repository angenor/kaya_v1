<script setup lang="ts">
/**
 * LE GABARIT SANS EN-TÊTE — celui de `R0`, et de lui seul aujourd'hui.
 *
 * ⚠️ IL EXISTE PARCE QUE FR-009 ET FR-025 SERAIENT AUTREMENT CONTRADICTOIRES.
 * L'en-tête permanent est dû sur tous les écrans du produit **atteints avec une
 * session** ; `R0` est un écran du produit, et il n'a pas de session — il n'y a
 * ni établissement, ni poste, ni personne à afficher. Sans ce gabarit, c'est la
 * plus faible des deux exigences qui aurait cédé à l'implémentation, en silence.
 *
 * ⚠️ IL NE PORTE NI SÉLECTEUR, NI TÉMOIN, NI RÉGLAGES — et surtout **aucun
 * second `<header>`**. Le dépôt en contient exactement un, dans
 * `EnTeteContexte.vue`, et un test le vérifie.
 *
 * ⚠️ MAIS IL PORTE LE `<main>` ET LE BANDEAU DE LA COQUILLE. Une version
 * nouvelle et une application non installée concernent **l'appareil** : elles
 * n'attendent pas qu'on soit entré. Quelqu'un qui ouvre l'application sur un
 * téléphone neuf est exactement la personne à qui l'installation doit être
 * proposée.
 */
import BandeauCoquille from '~/core/coquille/BandeauCoquille.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-texte text-ink">
    <BandeauCoquille />

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
