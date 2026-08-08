<script setup lang="ts">
/**
 * LA GRILLE DE TABLES — « touchez une table pour ajouter ou encaisser ».
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « La salle » de `R1-accueil-maquis.html`,
 * « Vos tables » de `-serveuse`. **Zone de vitesse** sur les deux.
 *
 * ⚠️ **AUCUN COMPOSANT NOUVEAU.** C'est la **tuile d'action 05 en variante
 * compacte**, portant une **pastille 04** au lieu d'une icône — vérifié
 * composant par composant contre `composants.md`. Inventer un dix-septième
 * composant pour une grille de tables aurait ouvert la porte au dix-huitième,
 * et la bibliothèque aurait cessé d'être une bibliothèque.
 *
 * ⚠️ ET CE N'EST PAS UNE VARIANTE D'ÉCRAN : c'est la **présentation déclarée par
 * la surface**. Une table se touche — c'est une cible, et une cible se pose en
 * grille ; une arrivée se lit — c'est une ligne. Aucun `if (variante === …)`.
 *
 * ⚠️ ORDONNÉE PAR L'HEURE, comme la liste. La grille change la forme, jamais
 * l'ordre : ce qui vient ensuite reste ce qui vient ensuite.
 *
 * ⚠️ **UN FLUX QUI S'ENROULE, PAS UNE GRILLE À COLONNES FIXES** — même motif que
 * « Vos activités ». Le nombre de tables dépend de l'établissement : neuf au
 * maquis, une seule ligne agrégée à Deloria. Une grille à quatre colonnes
 * écrasait la tuile unique sur un quart de la largeur, ce qui la rendait
 * illisible pour la seule variante qui n'a pas de tables au jeu.
 *
 * ⚠️ ET LA TUILE EST **BORNÉE DES DEUX CÔTÉS**, ce qu'un flux enroulé ne fait
 * pas tout seul — constaté en déroulant `quickstart.md` §2.2. Sans plancher,
 * « Table 6 » se coupait en deux dès que sa pastille portait « À régler » ;
 * sans plafond, la neuvième table, seule sur sa rangée, s'étirait sur toute la
 * largeur de l'écran et ne ressemblait plus aux huit autres. Une salle se lit
 * parce que ses tables se ressemblent.
 *
 * ⚠️ ET UNE TABLE LIBRE PASSE SUR `bg-tile`, SANS OMBRE. La maquette la pose en
 * retrait : ce qui est libre n'appelle pas le regard, ce qui est occupé si.
 * C'est le fond qui le dit, en plus de la pastille — jamais la couleur seule.
 */
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import type { LigneSuiteAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

const props = defineProps<{ lignes: readonly LigneSuiteAccueil[] }>()

defineEmits<{ activer: [ligne: LigneSuiteAccueil] }>()

/** Les six libellés d'état — ceux du vocabulaire de formes, jamais inventés. */
const LIBELLE_ETAT: Readonly<Record<string, string>> = {
  acquis: 'accueil.etat.aJour',
  enCours: 'accueil.etat.enCours',
  libre: 'accueil.etat.libre',
  casse: 'accueil.etat.aRegler',
  horsLigne: 'accueil.etat.sansReseau',
  attente: 'accueil.etat.enAttente',
}

const ordonnees = computed(() =>
  [...props.lignes].sort((a, b) => a.instant.localeCompare(b.instant)),
)

function montantEcrit(ligne: LigneSuiteAccueil): string | null {
  return ligne.montant === null
    ? null
    : formaterMontant(ligne.montant.montantMineur, ligne.montant.codeDevise)
}
</script>

<template>
  <div
    class="flex flex-wrap gap-2.5"
    data-surface="suite"
    data-presentation="grille"
  >
    <button
      v-for="ligne in ordonnees"
      :key="ligne.id"
      type="button"
      data-mouvement="tactile"
      class="flex min-h-20 min-w-52 max-w-80 flex-1 cursor-pointer flex-col items-start justify-between gap-2.5 rounded-xl border border-line px-4 py-3.5 text-left transition-[transform,border-color] duration-90 ease-entree hover:border-prim active:scale-98"
      :class="ligne.montant === null ? 'bg-tile' : 'bg-surf'"
      :data-table="ligne.id"
      @click="$emit('activer', ligne)"
    >
      <span class="flex w-full items-start justify-between gap-3">
        <!-- ⚠️ **LE NOM DE LA TABLE NE SE COUPE PAS**, et c'est un constat de
             capture : à `min-w-38`, « Table 6 » passait sur deux lignes dès que
             sa pastille portait « À régler ». Un repère qui se casse en deux
             cesse d'être lu d'un coup d'œil — or c'est tout ce qu'on demande à
             une grille de salle : reconnaître la table sans lire. -->
        <span class="font-titre text-titre-s font-semibold whitespace-nowrap text-ink">{{
          ligne.libelle
        }}</span>
        <!-- ⚠️ LA PASTILLE REMPLACE L'ICÔNE, et elle porte une FORME autant
             qu'une couleur : en niveaux de gris comme en plein soleil, les six
             états restent distincts. -->
        <PastilleEtat
          :etat="ligne.etat"
          :libelle-cle="LIBELLE_ETAT[ligne.etat] ?? 'accueil.etat.enCours'"
        />
      </span>
      <span class="flex w-full flex-col gap-0.5">
        <span
          v-if="montantEcrit(ligne)"
          class="font-mono text-titre-s font-bold whitespace-nowrap text-ink"
          data-montant
        >{{ montantEcrit(ligne) }}</span>
        <!-- ⚠️ PAS DE DÉTAIL VIDE. Une table libre n'a rien à dire de plus que
             sa pastille ; répéter « Libre » sous « Libre » fait lire deux fois
             la même chose et laisse croire qu'on a raté une information. -->
        <span
          v-if="ligne.detail"
          class="text-mini text-ink-3"
        >{{ ligne.detail }}</span>
      </span>
    </button>
  </div>
</template>
