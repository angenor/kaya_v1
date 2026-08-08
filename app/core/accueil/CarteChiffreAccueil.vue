<script setup lang="ts">
/**
 * LES CHIFFRES — « Aujourd'hui », « Ce soir », « Votre service », « Les deux
 * ensemble ».
 *
 * RÉFÉRENCE VISUELLE : cas (a) — la pile de cartes du bas de colonne latérale
 * des quatre `R1-accueil*`. Composant : **06** carte de chiffre, variante creux.
 *
 * ⚠️ **UNE PILE VERTICALE, PAS UNE GRILLE.** Ces cartes vivent dans une colonne
 * de `w-84` : une grille de trois y écraserait trois montants côte à côte sur
 * 336 px, et les chiffres tabulaires — dont tout l'intérêt est de s'aligner —
 * cesseraient de s'aligner sur quoi que ce soit.
 *
 * ⚠️ **ET LA VARIANTE EST « CREUX »** : `bg-tile` sans ombre. La colonne est
 * déjà en `bg-surf` ; une carte de surface sur une surface se voit comme un
 * empilement d'ombres. Le creux inverse le rapport — la carte est en retrait, la
 * colonne la porte.
 *
 * ⚠️ **TOUT MONTANT PASSE PAR `format/montant.ts`**, la seule fonction du dépôt
 * qui écrit un montant (FR-020, principe 5). `R1` en affiche huit ou plus selon
 * la variante : un seul écrit à la main et l'alignement tabulaire tombe.
 *
 * ⚠️ ET UN DÉCOMPTE N'EST PAS UN MONTANT. « 12 / 20 » n'a pas de devise et ne se
 * met pas en forme : le type porte l'un **ou** l'autre, et cette distinction est
 * ce qui empêche `formaterMontant` d'être appelé sur une chaîne.
 */
import CarteChiffre from '~/core/design-system/CarteChiffre.vue'
import type { ChiffreAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

defineProps<{ chiffres: readonly ChiffreAccueil[] }>()

/**
 * ⚠️ UN ÉCART SE RECONNAÎT À SON SIGNE, ET C'EST LA DONNÉE QUI LE PORTE. « + 18 %
 * par rapport à hier même heure » est une variation ; « 3 arrivées attendues cet
 * après-midi » n'en est pas une. Le triangle du composant 06 ne se pose que sur
 * la première — sur la seconde, il indiquerait une direction qui n'existe pas.
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
    class="flex flex-col gap-2.5"
    data-surface="chiffre"
  >
    <CarteChiffre
      v-for="chiffre in chiffres"
      :key="chiffre.id"
      creux
      :etiquette-cle="chiffre.etiquetteCle"
      :valeur="valeurEcrite(chiffre)"
      :delta="estUnEcart(chiffre) ? chiffre.comparaison : undefined"
      :delta-positif="chiffre.comparaison.startsWith('+')"
      :note="estUnEcart(chiffre) ? undefined : chiffre.comparaison"
      :ton-note="chiffre.tonComparaison"
      :data-chiffre="chiffre.id"
    />
  </div>
</template>
