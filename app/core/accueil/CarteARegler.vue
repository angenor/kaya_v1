<script setup lang="ts">
/**
 * « À RÉGLER » — ce qui ne va pas, et l'action qui répare.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « À régler » de `R1-accueil.html`, « Avant de
 * fermer » de `-maquis`, « Cette semaine » de `-proprietaire`.
 * Composant : **07** bandeau d'alerte, trois niveaux.
 *
 * ⚠️ **JAMAIS PLUS DE TROIS CARTES**, et la borne est posée dans
 * `composerAccueil` — là où le nombre se décide, pas ici où il se rend. Au-delà
 * de trois, on n'en lit aucune.
 *
 * ⚠️ ET ELLES SONT ORDONNÉES PAR GRAVITÉ — danger, alerte, info. C'est la seule
 * rubrique de l'écran qui le soit, et le motif est l'inverse de celui de
 * « Ensuite » : ici il n'y a pas d'heure, il y a une urgence. Six factures que
 * la DGI peut refuser passent avant un casier de bière.
 */
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import type { CarteAReglerAccueil } from '~/core/donnees/accueil/types'

const props = defineProps<{ cartes: readonly CarteAReglerAccueil[] }>()

defineEmits<{ agir: [carte: CarteAReglerAccueil] }>()

const GRAVITE: Readonly<Record<string, number>> = { danger: 0, alerte: 1, info: 2 }

const ordonnees = computed(() =>
  [...props.cartes].sort((a, b) => (GRAVITE[a.niveau] ?? 9) - (GRAVITE[b.niveau] ?? 9)),
)
</script>

<template>
  <div
    class="flex flex-col gap-3.5"
    data-surface="aRegler"
  >
    <!-- ⚠️ CHAQUE CARTE PORTE SON PROPRE BANDEAU, ET ELLES NE SONT PAS EMPILÉES
         DANS UN SEUL : « jamais deux bandeaux empilés » vise l'annonce
         TRANSVERSE d'un écran — une capacité absente, une coupure —, pas une
         RUBRIQUE dont le contenu est fait de faits distincts. Trois faits
         différents demandent trois phrases ; les fondre en une en ferait lire
         zéro, ce qui est exactement ce que la règle protège. -->
    <BandeauAlerte
      v-for="carte in ordonnees"
      :key="carte.id"
      :ton="carte.niveau"
      :message="carte.libelle"
      :alternative="carte.detail"
      :action-cle="carte.actionCle"
      pleine-largeur
      :data-carte="carte.id"
      @agir="$emit('agir', carte)"
    />
  </div>
</template>
