<script setup lang="ts">
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import BoutonSecondaire from '~/core/design-system/BoutonSecondaire.vue'
import LigneListe from '~/core/design-system/LigneListe.vue'
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import { CHOIX_THEME, useTheme } from '~/core/theme/useTheme'

/**
 * LE GUIDE DE STYLE — la page qu'on ouvre pour voir si le design system tient.
 *
 * RÉFÉRENCE VISUELLE : **instrument de développement** (voir l'amendement de
 * `docs/design/derivation.md`, T049). Assemblé uniquement à partir des seize
 * composants canoniques, en zone de charme. Rendu de référence :
 * `docs/design/styleguide.html` — qui SE LIT et NE SE COPIE PAS : il est
 * autonome, non sémantique, sans i18n, sans mode sombre câblé, sans RBAC.
 *
 * ⚠️ ET C'EST CETTE PAGE QUI « BRANCHE » LE DESIGN SYSTEM. Elle importe les
 * seize composants EXPLICITEMENT, un par un, plutôt que de s'en remettre à
 * l'auto-import de Nuxt. Ce n'est pas une préférence de style : l'auto-import
 * supprime les instructions `import`, et toute analyse statique déclarerait
 * alors morts des composants employés. La porte P-06 repose entièrement sur ces
 * lignes. Un composant que cette page ne montre pas est, à juste titre, « dû ».
 */
definePageMeta({ path: '/_guide-de-style' })

const { t } = useI18n()
useHead({ title: () => t('guideDeStyle.titre') })

/**
 * Les sections livrées, dans l'ordre de `docs/design/composants.md`.
 * ⚠️ LE DÉCOMPTE N'EST ÉCRIT NULLE PART : c'est la longueur de cette liste, et
 * un test la confronte au nombre de sections numérotées du fichier de
 * référence. Un nombre écrit à la main a déjà été faux deux fois.
 */
const SECTIONS = ['01', '02', '03', '04', '08'] as const

const { choix, choisir } = useTheme()
const OPTIONS_THEME: readonly OptionSegment[] = CHOIX_THEME.map((valeur) => ({
  valeur,
  libelleCle: `theme.${valeur}`,
}))
const themeChoisi = computed({
  get: () => choix.value,
  set: (valeur: string) => choisir(valeur as (typeof CHOIX_THEME)[number]),
})
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-6 py-5.5"
    data-ecran="guide-de-style"
    data-zone="charme"
  >
    <header class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="font-titre text-titre-m font-semibold text-ink">
        {{ $t('guideDeStyle.titre') }}
      </h1>
      <SelecteurSegmente
        v-model="themeChoisi"
        :options="OPTIONS_THEME"
        etiquette-cle="theme.etiquette"
        data-reglage="theme-guide"
      />
    </header>

    <!-- Le sommaire · composant 08 -->
    <nav
      class="overflow-hidden rounded-xl border border-line bg-surf shadow-basse"
      :aria-label="$t('guideDeStyle.sommaire')"
      data-bloc="sommaire"
    >
      <LigneListe
        v-for="numero in SECTIONS"
        :key="numero"
        :reference="numero"
        :libelle-cle="`guideDeStyle.composant.${numero}`"
        :vers="`#composant-${numero}`"
        data-sommaire-entree
      />
    </nav>

    <!-- 01 · Bouton principal -->
    <section
      id="composant-01"
      data-composant="01"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">01</span>
        {{ $t('guideDeStyle.composant.01') }}
      </h2>
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surf p-4">
        <BoutonPrincipal libelle-cle="guideDeStyle.demo.encaisserLeDepart" />
        <BoutonPrincipal
          libelle-cle="guideDeStyle.demo.encaisserLeDepart"
          libelle-en-cours-cle="guideDeStyle.demo.envoiEnCours"
          en-cours
        />
        <BoutonPrincipal
          libelle-cle="guideDeStyle.demo.encaisserLeDepart"
          desactive
        />
        <BoutonPrincipal
          libelle-cle="guideDeStyle.demo.supprimer"
          danger
        />
      </div>
      <div class="rounded-xl border border-line bg-surf p-4">
        <BoutonPrincipal
          libelle-cle="guideDeStyle.demo.encaisserLeDepart"
          comptoir
        />
      </div>
    </section>

    <!-- 02 · Bouton secondaire -->
    <section
      id="composant-02"
      data-composant="02"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">02</span>
        {{ $t('guideDeStyle.composant.02') }}
      </h2>
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surf p-4">
        <BoutonSecondaire libelle-cle="guideDeStyle.demo.annuler" />
        <BoutonSecondaire
          libelle-cle="guideDeStyle.demo.plusTard"
          neutre
        />
        <BoutonSecondaire
          libelle-cle="guideDeStyle.demo.annuler"
          desactive
        />
      </div>
    </section>

    <!-- 03 · Bouton discret -->
    <section
      id="composant-03"
      data-composant="03"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">03</span>
        {{ $t('guideDeStyle.composant.03') }}
      </h2>
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surf p-4">
        <BoutonDiscret libelle-cle="guideDeStyle.demo.voirLeDetail" />
        <BoutonDiscret
          libelle-cle="guideDeStyle.demo.filtrer"
          actif
        />
        <BoutonDiscret
          libelle-cle="guideDeStyle.demo.supprimer"
          danger
        />
        <BoutonDiscret
          libelle-cle="guideDeStyle.demo.voirLeDetail"
          desactive
        />
      </div>
    </section>

    <!-- 04 · Pastille d'état -->
    <section
      id="composant-04"
      data-composant="04"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">04</span>
        {{ $t('guideDeStyle.composant.04') }}
      </h2>
      <!-- ⚠️ SIX ÉTATS, SIX FORMES. Le vocabulaire est fixe et vaut pour tout le
           produit : un état n'est jamais porté par la couleur seule. -->
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surf p-4">
        <PastilleEtat
          etat="acquis"
          libelle-cle="guideDeStyle.demo.paye"
        />
        <PastilleEtat
          etat="enCours"
          libelle-cle="guideDeStyle.demo.partiel"
        />
        <PastilleEtat
          etat="libre"
          libelle-cle="guideDeStyle.demo.libre"
        />
        <PastilleEtat
          etat="casse"
          libelle-cle="guideDeStyle.demo.impaye"
        />
        <PastilleEtat
          etat="horsLigne"
          libelle-cle="guideDeStyle.demo.horsService"
        />
        <PastilleEtat
          etat="attente"
          libelle-cle="guideDeStyle.demo.envoiEnAttente"
        />
      </div>
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl bg-tile p-4">
        <PastilleEtat
          etat="acquis"
          libelle-cle="guideDeStyle.demo.paye"
          contour
        />
        <PastilleEtat
          etat="casse"
          libelle-cle="guideDeStyle.demo.impaye"
          contour
        />
      </div>
    </section>

    <!-- 08 · Ligne de liste -->
    <section
      id="composant-08"
      data-composant="08"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">08</span>
        {{ $t('guideDeStyle.composant.08') }}
      </h2>
      <div class="overflow-hidden rounded-xl border border-line bg-surf">
        <LigneListe
          reference="204"
          libelle="M. Traoré"
          sous-titre-cle="guideDeStyle.demo.troisNuits"
          montant="47 500 F"
        />
        <LigneListe
          reference="205"
          libelle="Mme Koné"
          sous-titre-cle="guideDeStyle.demo.troisNuits"
          montant="12 500 F"
          etat="selectionnee"
        />
        <LigneListe
          reference="206"
          libelle="M. Bamba"
          sous-titre-cle="guideDeStyle.demo.envoiEnAttente"
          montant="25 500 F"
          etat="enAttente"
        >
          <template #fin>
            <PastilleEtat
              etat="attente"
              libelle-cle="guideDeStyle.demo.envoiEnAttente"
            />
          </template>
        </LigneListe>
        <LigneListe
          reference="207"
          libelle="M. Yao"
          montant="15 500 F"
          etat="annulee"
        />
        <LigneListe
          libelle-cle="guideDeStyle.demo.total"
          montant="101 000 F"
          etat="total"
        />
      </div>
    </section>
  </div>
</template>
