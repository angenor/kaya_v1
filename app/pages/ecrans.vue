<script setup lang="ts">
import LigneListe from '~/core/design-system/LigneListe.vue'
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import { ECRANS_PRODUIT, INSTRUMENTS, type EntreeEcran } from '~/core/ecrans/index'

/**
 * L'INDEX DES ÉCRANS — la page par laquelle le produit se regarde.
 *
 * RÉFÉRENCE VISUELLE : cas (c), COMPOSÉ — motif de liste posé par `G5`. Zone de
 * charme. Composants : 08 ligne de liste · 04 pastille d'état · 12 sélecteur
 * segmenté.
 *
 * ⚠️ ELLE REND `app/core/ecrans/index.ts`, ET LA PORTE P-04 LIT LE MÊME MODULE.
 * Une seule source : il n'y a pas de seconde liste, donc rien qui puisse
 * diverger.
 *
 * ⚠️ DEUX SECTIONS, ET ELLES NE SE MÉLANGENT PAS. Les 46 écrans du PRODUIT
 * portent un code ; les instruments n'en portent pas et n'entrent pas au
 * décompte. Confondre les deux ferait croire que le produit a 49 écrans.
 *
 * ⚠️ LE NOM DU FICHIER NE PORTE PAS LE TRAIT BAS, LA ROUTE SI — la route est
 * écrite, donc indépendante de toute sémantique de scanner (research.md §4.2).
 */
definePageMeta({ path: '/_ecrans' })

const { t } = useI18n()
useHead({ title: () => t('ecrans.titre') })

const SECTIONS: readonly OptionSegment[] = [
  { valeur: 'produit', libelleCle: 'ecrans.leProduit', compteur: ECRANS_PRODUIT.length },
  { valeur: 'instruments', libelleCle: 'ecrans.lesInstruments', compteur: INSTRUMENTS.length },
]
const section = ref('produit')

const entrees = computed<readonly EntreeEcran[]>(() =>
  section.value === 'produit' ? ECRANS_PRODUIT : INSTRUMENTS,
)

const construits = computed(
  () => ECRANS_PRODUIT.filter((e) => e.avancement === 'CONSTRUIT').length,
)

/** Le titre d'un instrument est une clé ; celui d'un écran du produit non. */
function titreDe(entree: EntreeEcran): string {
  return entree.cas === 'instrument' ? t(entree.titre) : entree.titre
}

/** ⚠️ LE CODE QUAND IL EXISTE, LA ROUTE SINON. Deux composés n'ont pas de code. */
function referenceDe(entree: EntreeEcran): string {
  return entree.code ?? (entree.route ?? '—')
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-280 flex-col gap-5.5 px-6 py-5.5"
    data-ecran="ecrans"
    data-zone="charme"
  >
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-titre text-titre-m font-semibold text-ink">
          {{ $t('ecrans.titre') }}
        </h1>
        <p class="text-mini text-ink-3">
          {{ $t('ecrans.decompte', { construits, total: ECRANS_PRODUIT.length }) }}
        </p>
      </div>
      <SelecteurSegmente
        v-model="section"
        :options="SECTIONS"
        data-reglage="section"
      />
    </header>

    <div
      class="overflow-hidden rounded-xl border border-line bg-surf shadow-basse"
      data-bloc="index"
    >
      <LigneListe
        v-for="entree in entrees"
        :key="referenceDe(entree)"
        :reference="referenceDe(entree)"
        :libelle="titreDe(entree)"
        :sous-titre="entree.reference"
        :vers="entree.route ?? undefined"
        :data-avancement="entree.avancement"
      >
        <template #fin>
          <!-- ⚠️ L'ÉTAT PORTE UNE FORME, PAS SEULEMENT UNE COULEUR : losange
               pour ce qui est acquis, cercle vide pour ce qui n'est pas
               commencé. En niveaux de gris, les deux restent distincts. -->
          <PastilleEtat
            :etat="entree.avancement === 'CONSTRUIT' ? 'acquis' : 'horsLigne'"
            :libelle-cle="
              entree.avancement === 'CONSTRUIT' ? 'ecrans.construit' : 'ecrans.pasCommence'
            "
          />
        </template>
      </LigneListe>
    </div>
  </div>
</template>
