<script setup lang="ts">
/**
 * LES CHIFFRES — « Aujourd'hui », « Ce soir », « Votre service ».
 *
 * RÉFÉRENCE VISUELLE : cas (a) — la rangée de cartes des quatre `R1-accueil*`.
 * Composant : **06** carte de chiffre.
 *
 * ⚠️ **TOUT MONTANT PASSE PAR `format/montant.ts`**, la seule fonction du dépôt
 * qui écrit un montant (FR-020, constitution principe 5). `R1` en affiche huit
 * ou plus selon la variante : un seul écrit à la main et l'alignement tabulaire
 * tombe — c'est-à-dire que deux cartes côte à côte cessent d'aligner leurs
 * unités, ce qu'on ne voit qu'en regardant l'écran fini.
 *
 * ⚠️ ET UN DÉCOMPTE N'EST PAS UN MONTANT. « 12 / 20 » n'a pas de devise et ne
 * se met pas en forme : le type porte l'un **ou** l'autre, et cette distinction
 * est ce qui empêche `formaterMontant` d'être appelé sur une chaîne.
 */
import CarteChiffre from '~/core/design-system/CarteChiffre.vue'
import type { ChiffreAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

defineProps<{ chiffres: readonly ChiffreAccueil[] }>()

/**
 * ⚠️ UN ÉCART SE RECONNAÎT À SON SIGNE, ET C'EST LA DONNÉE QUI LE PORTE. « + 18 %
 * par rapport à hier même heure » est une variation — triangle et ton ; « 3
 * arrivées attendues cet après-midi » n'en est pas une. Poser le triangle sur
 * les deux apprendrait à ne plus le lire.
 */
function estUnEcart(chiffre: ChiffreAccueil): boolean {
  return chiffre.comparaison.startsWith('+') || chiffre.comparaison.startsWith('−')
}

function valeurEcrite(chiffre: ChiffreAccueil): string {
  return chiffre.montant === null
    ? (chiffre.valeur ?? '')
    : formaterMontant(chiffre.montant.montantMineur, chiffre.montant.codeDevise)
}
</script>

<template>
  <div
    class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
    data-surface="chiffre"
  >
    <CarteChiffre
      v-for="chiffre in chiffres"
      :key="chiffre.id"
      :etiquette-cle="chiffre.etiquetteCle"
      :valeur="valeurEcrite(chiffre)"
      :delta="estUnEcart(chiffre) ? chiffre.comparaison : undefined"
      :delta-positif="chiffre.comparaison.startsWith('+')"
      :note="estUnEcart(chiffre) ? undefined : chiffre.comparaison"
      :data-chiffre="chiffre.id"
    />
  </div>
</template>
