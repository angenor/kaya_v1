<script setup lang="ts">
/**
 * « ENSUITE » — ce qui vient, **dans l'ordre de l'heure**.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « Ensuite, dans l'ordre de l'heure » de
 * `R1-accueil.html`. Composants : **03** bouton discret à contour · **04**
 * pastille d'état (non employée ici — voir plus bas).
 *
 * ⚠️ **CE SONT DES CARTES INDÉPENDANTES, PAS UN REGISTRE.** La maquette pose
 * trois blocs `rounded-xl border border-line bg-surf` espacés de `gap-2.5`, et
 * non des lignes accolées dans un cadre unique. La différence n'est pas
 * cosmétique : un registre se lit de haut en bas comme une liste homogène —
 * trois cartes se lisent comme **trois choses à faire**, qui n'ont rien à voir
 * entre elles.
 *
 * ⚠️ **CHAQUE CARTE PORTE UNE ICÔNE MÉTIER DANS UN CARRÉ TEINTÉ** — `size-9.5
 * rounded-lg bg-prim-soft / bg-alerte-soft / bg-ocre-soft`. C'est le repère qui
 * permet de reconnaître la nature du fait sans lire son libellé, et il vient de
 * la DONNÉE : une arrivée n'a pas la même icône qu'un ménage.
 *
 * ⚠️ **ET L'ACTION EST UN BOUTON, PAS UNE PASTILLE.** La version précédente
 * posait une pastille d'état à la place — elle disait ce que la chose EST, là où
 * la maquette propose ce qu'on peut EN FAIRE. Sur un écran dont le rôle est de
 * dire quoi faire ensuite, c'est l'inverse de ce qu'il faut.
 */
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import type { LigneSuiteAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

const props = defineProps<{ lignes: readonly LigneSuiteAccueil[] }>()

defineEmits<{ activer: [ligne: LigneSuiteAccueil] }>()

/**
 * ⚠️ ORDONNÉES PAR **L'HEURE**, JAMAIS PAR IMPORTANCE SUPPOSÉE. Ce qui vient
 * ensuite est ce qui vient ensuite. Classer par gravité ferait remonter en tête
 * ce qui peut attendre — et l'exploitant apprendrait à ne plus lire l'ordre,
 * c'est-à-dire à relire toute la liste à chaque fois.
 */
const ordonnees = computed(() =>
  [...props.lignes].sort((a, b) => a.instant.localeCompare(b.instant)),
)

/** Les quatre teintes de carré d'icône, écrites en toutes lettres. */
const TEINTES = {
  prim: 'bg-prim-soft text-prim',
  alerte: 'bg-alerte-soft text-alerte',
  ocre: 'bg-ocre-soft text-ocre',
  info: 'bg-info-soft text-info',
} as const

function montantEcrit(ligne: LigneSuiteAccueil): string | null {
  return ligne.montant === null
    ? null
    : formaterMontant(ligne.montant.montantMineur, ligne.montant.codeDevise)
}
</script>

<template>
  <div
    class="flex flex-col gap-2.5"
    data-surface="suite"
  >
    <div
      v-for="ligne in ordonnees"
      :key="ligne.id"
      class="flex items-center gap-3.5 rounded-xl border border-line bg-surf px-4 py-3.5 transition-[transform,border-color] duration-90 ease-entree hover:border-line-2"
      :data-ligne="ligne.id"
    >
      <span
        class="inline-flex size-9.5 shrink-0 items-center justify-center rounded-lg"
        :class="TEINTES[ligne.teinte]"
        aria-hidden="true"
      >
        <i :class="['ph', ligne.icone, 'text-titre-m']" />
      </span>

      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="font-titre text-action font-semibold text-ink">{{ ligne.libelle }}</span>
        <span class="text-mini text-ink-3">{{ ligne.detail }}</span>
      </span>

      <span
        v-if="montantEcrit(ligne)"
        class="font-mono text-lead whitespace-nowrap text-ink-2"
        data-montant
      >{{ montantEcrit(ligne) }}</span>

      <BoutonDiscret
        :libelle-cle="ligne.actionCle"
        contour="prim"
        data-action="ligne"
        @activer="$emit('activer', ligne)"
      />
    </div>
  </div>
</template>
