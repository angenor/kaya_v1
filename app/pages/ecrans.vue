<script setup lang="ts">
/**
 * L'INDEX DES ÉCRANS — la page par laquelle le produit se regarde.
 *
 * RÉFÉRENCE VISUELLE : cas (c), COMPOSÉ — motif de liste posé par `G5`
 * (`docs/design/derivation.md`). Assemblé uniquement à partir des seize
 * composants canoniques, en zone de charme.
 *
 * ⚠️ LE NOM DU FICHIER NE PORTE PAS LE TRAIT BAS, ET LA ROUTE SI. La question
 * — « un fichier `_ecrans.vue` produit-il la route `/_ecrans` ou le scanner
 * l'ignore-t-il ? » — dépend d'une convention de découverte, et une supposition
 * ici produirait trois écrans introuvables. `definePageMeta({ path })` supprime
 * la question au lieu d'y répondre : la route est écrite, donc indépendante de
 * toute sémantique de scanner (research.md §4.2).
 *
 * ⚠️ ET LE TRAIT BAS N'EST PAS DÉCORATIF : il marque les INSTRUMENTS. Les 46
 * écrans du produit n'en portent pas — `/passage`, `/arrivee`, `/articles`. Un
 * exploitant qui verrait `/_ecrans` dans sa barre d'adresse saurait qu'il n'est
 * pas au bon endroit.
 *
 * Ce squelette est complété à T048 : les 46 entrées du produit et les trois
 * instruments.
 */
definePageMeta({ path: '/_ecrans' })

const { t } = useI18n()
useHead({ title: () => t('ecrans.titre') })
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[1120px] flex-col gap-5.5 px-6 py-5.5"
    data-ecran="ecrans"
  >
    <h1 class="font-titre text-titre-m font-semibold text-ink">
      {{ $t('ecrans.titre') }}
    </h1>
  </div>
</template>
