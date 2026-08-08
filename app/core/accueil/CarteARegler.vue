<script setup lang="ts">
/**
 * « À RÉGLER » — ce qui ne va pas, et l'action qui répare.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « À régler » de `R1-accueil.html`, « Avant de
 * fermer » de `-maquis`, « Cette semaine » de `-proprietaire`. Composants :
 * **03** bouton discret à contour.
 *
 * ⚠️ **CE SONT DES CARTES `bg-tile` BORDÉES, EMPILÉES EN COLONNE**, portant un
 * liseré gauche de 4 px du ton — `rounded-l-xs rounded-r-xl border border-line
 * border-l-4 border-l-danger`. Ce n'est PAS le bandeau d'alerte pleine largeur :
 * ces cartes vivent dans la colonne latérale, sur `bg-surf`, et un bandeau
 * teinté pleine surface y ferait trois aplats de couleur côte à côte — trois
 * alertes qui crient également, donc aucune qu'on lit.
 *
 * ⚠️ **L'ICÔNE VIENT DU FAIT, PAS DU TON.** Une facture non transmise porte
 * `ph-file-x`, un écart de caisse `ph-scales`, un réapprovisionnement
 * `ph-package`. Déduire l'icône du niveau donnerait trois fois le même
 * pictogramme d'avertissement — et l'icône cesserait d'informer.
 *
 * ⚠️ **ET LE BOUTON EST EN BAS À GAUCHE, BORDÉ DU TON DE LA CARTE.** À droite du
 * texte, il entrait en concurrence avec le titre ; en bas, il se lit après le
 * fait, ce qui est l'ordre dans lequel on décide.
 *
 * ⚠️ **JAMAIS PLUS DE TROIS**, et la borne est posée dans `composerAccueil` — là
 * où le nombre se décide, pas ici où il se rend.
 */
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import type { CarteAReglerAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

const props = defineProps<{ cartes: readonly CarteAReglerAccueil[] }>()

defineEmits<{ agir: [carte: CarteAReglerAccueil] }>()

/**
 * ⚠️ ORDONNÉES PAR GRAVITÉ — danger, alerte, info. C'est la seule rubrique de
 * l'écran qui le soit, et le motif est l'inverse de celui de « Ensuite » : ici
 * il n'y a pas d'heure, il y a une urgence. Six factures que la DGI peut
 * refuser passent avant un casier de bière.
 */
const GRAVITE: Readonly<Record<string, number>> = { danger: 0, alerte: 1, info: 2 }

const ordonnees = computed(() =>
  [...props.cartes].sort((a, b) => (GRAVITE[a.niveau] ?? 9) - (GRAVITE[b.niveau] ?? 9)),
)

/** Les trois tons, écrits en toutes lettres : Tailwind élague ce qu'il ne voit pas. */
const LISERES = {
  danger: 'border-l-danger',
  alerte: 'border-l-alerte',
  info: 'border-l-info',
} as const

const ENCRES = {
  danger: 'text-danger',
  alerte: 'text-alerte',
  info: 'text-info',
} as const

function montantEcrit(carte: CarteAReglerAccueil): string | null {
  return carte.montant === null
    ? null
    : formaterMontant(carte.montant.montantMineur, carte.montant.codeDevise)
}
</script>

<template>
  <div
    class="flex flex-col gap-2.5"
    data-surface="aRegler"
  >
    <div
      v-for="carte in ordonnees"
      :key="carte.id"
      class="flex flex-col gap-2 rounded-l-xs rounded-r-xl border border-line border-l-4 bg-tile px-4 py-3.5"
      :class="LISERES[carte.niveau]"
      :data-carte="carte.id"
      :data-niveau="carte.niveau"
    >
      <span class="flex items-center gap-2">
        <i
          :class="['ph', carte.icone, 'text-titre-s', ENCRES[carte.niveau]]"
          aria-hidden="true"
        />
        <span class="font-titre text-corps font-semibold text-ink">{{ carte.libelle }}</span>
        <span
          v-if="montantEcrit(carte)"
          class="ml-auto font-mono text-corps whitespace-nowrap text-ink-2"
          data-montant
        >{{ montantEcrit(carte) }}</span>
      </span>
      <span class="text-mini text-ink-2">{{ carte.detail }}</span>
      <BoutonDiscret
        class="self-start"
        :libelle-cle="carte.actionCle"
        :contour="carte.niveau"
        data-action="regler"
        @activer="$emit('agir', carte)"
      />
    </div>
  </div>
</template>
