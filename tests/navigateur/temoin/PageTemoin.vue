<script setup lang="ts">
/**
 * LA PAGE TÉMOIN — vide, et c'est tout son intérêt.
 *
 * ⚠️ ELLE N'EST PAS DANS LE PRODUIT. Elle vit sous `tests/`, et elle n'entre au
 * routeur que lorsque `KAYA_PAGE_TEMOIN=1` — un crochet `pages:extend` de
 * `nuxt.config.ts` l'y ajoute. Une construction ordinaire ne la connaît pas.
 *
 * ⚠️ ELLE NE DÉCLARE RIEN, ET C'EST LA PREUVE. Aucun `definePageMeta({ layout })`,
 * aucun import d'intergiciel, aucune ligne de thème, aucun composable. Si elle
 * se rend malgré tout DANS le gabarit par défaut, avec la session reprise et la
 * classe de thème déjà posée, alors une page nouvelle hérite du cycle de vie
 * SANS RIEN ÉCRIRE — et elle ne peut pas l'oublier, puisqu'il n'y a rien à
 * oublier.
 *
 * Toute ligne ajoutée ici affaiblirait le test.
 */
</script>

<template>
  <div data-ecran="temoin-cycle-de-vie" />
</template>
