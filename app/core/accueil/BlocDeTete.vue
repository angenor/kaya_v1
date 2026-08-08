<script setup lang="ts">
/**
 * LE BLOC DE TÊTE — **ce qui attend maintenant**, et une seule action pour y
 * répondre.
 *
 * RÉFÉRENCE VISUELLE : cas (a), maquetté — « À faire maintenant » de
 * `R1-accueil.html`, « Votre service » de `-serveuse`, « Le service » de
 * `-maquis`, « La seule chose qui vous attend » de `-proprietaire`. Les quatre
 * posent la MÊME forme.
 * Composants : **01** bouton principal · **03** bouton discret.
 *
 * ⚠️ **LE LISERÉ GAUCHE INDIGO ET LES COINS ASYMÉTRIQUES NE SONT PAS UNE
 * DÉCORATION** — `rounded-l-xs rounded-r-2xl border-l-4 border-l-prim`. C'est ce
 * qui distingue ce bloc de tout le reste de l'écran : l'œil qui arrive sur
 * l'accueil doit trouver **une** chose, et la trouver sans lire. Une carte
 * ordinaire de plus l'aurait noyée dans la liste.
 *
 * ⚠️ **L'ÉTIQUETTE DE RUBRIQUE EST À L'INTÉRIEUR DU BLOC**, première ligne, en
 * `text-etiquette uppercase text-ink-3`. Sortie en titre au-dessus, elle
 * devenait un titre de page — et le bloc perdait ce qui le nommait.
 *
 * ⚠️ **LES DEUX ACTIONS SONT EMPILÉES DANS UNE COLONNE `w-67`**, principale en
 * haut (`h-15`, relief `shadow-bouton-grand`), discrète en dessous. Côte à côte,
 * elles se lisent comme deux options équivalentes — or il y en a une qui compte.
 *
 * ⚠️ ET LE MONTANT PASSE PAR `format/montant.ts`, LA SEULE FONCTION QUI ÉCRIT UN
 * MONTANT. `R1` en affiche huit ou plus selon la variante ; un seul écrit à la
 * main et l'alignement tabulaire tombe.
 */
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import type { TeteAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

const props = defineProps<{ tete: TeteAccueil; titreCle: string | null }>()

defineEmits<{ principale: []; secondaire: [] }>()

const montantEcrit = computed(() =>
  props.tete.montant === null
    ? null
    : formaterMontant(props.tete.montant.montantMineur, props.tete.montant.codeDevise),
)
</script>

<template>
  <div
    class="flex items-center gap-6 rounded-l-xs rounded-r-2xl border border-line border-l-4 border-l-prim bg-surf px-6 py-5.5 shadow-basse"
    data-surface="tete"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <span
        v-if="titreCle"
        class="text-etiquette uppercase text-ink-3"
        data-etiquette
      >{{ $t(titreCle) }}</span>
      <span class="font-titre text-chiffre-l font-semibold text-ink">{{ tete.libelle }}</span>
      <span class="text-action text-ink-2">
        {{ tete.detail }}
        <template v-if="montantEcrit">
          ·
          <span
            class="font-mono whitespace-nowrap"
            data-montant
          >{{ montantEcrit }}</span>
        </template>
      </span>
    </div>

    <!-- ⚠️ COLONNE DE LARGEUR FIXE : les deux actions s'alignent d'un bloc de
         tête à l'autre, quelle que soit la longueur du fait à leur gauche. -->
    <div class="flex w-67 shrink-0 flex-col gap-2.5">
      <BoutonPrincipal
        :libelle-cle="tete.actionCle"
        accueil
        data-action="principale"
        @activer="$emit('principale')"
      />
      <BoutonDiscret
        v-if="tete.actionSecondaireCle"
        :libelle-cle="tete.actionSecondaireCle"
        contour="neutre"
        data-action="secondaire"
        @activer="$emit('secondaire')"
      />
    </div>
  </div>
</template>
