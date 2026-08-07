<script setup lang="ts">
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import BandeauAnnulation from '~/core/design-system/BandeauAnnulation.vue'
import BarreProportion from '~/core/design-system/BarreProportion.vue'
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import BoutonSecondaire from '~/core/design-system/BoutonSecondaire.vue'
import CarteChiffre from '~/core/design-system/CarteChiffre.vue'
import ChampSaisie from '~/core/design-system/ChampSaisie.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import LigneListe from '~/core/design-system/LigneListe.vue'
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import SelecteurEtablissement from '~/core/design-system/SelecteurEtablissement.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import TemoinSynchronisation from '~/core/design-system/TemoinSynchronisation.vue'
import TuileAction from '~/core/design-system/TuileAction.vue'
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import { formaterEcart, formaterMontant } from '~/core/format/montant'
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
const SECTIONS = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
] as const

/** Deux établissements : c'est ce qui fait exister l'état « plusieurs ». */
const ETABLISSEMENTS_DEMO = [
  {
    id: 'deloria',
    nom: t('guideDeStyle.demo.deloria'),
    detail: t('guideDeStyle.demo.deloriaDetail'),
  },
  {
    id: 'residence-test',
    nom: t('guideDeStyle.demo.residenceTest'),
    detail: t('guideDeStyle.demo.residenceTestDetail'),
    alerte: true,
  },
]

const OPTIONS_SEGMENT_DEMO: readonly OptionSegment[] = [
  { valeur: 'toutes', libelleCle: 'guideDeStyle.demo.toutes' },
  { valeur: 'impayees', libelleCle: 'guideDeStyle.demo.impayees', compteur: 3 },
]
const segmentDemo = ref('toutes')
const saisieDemo = ref('')

/** La devise de Deloria. Elle vient de l'établissement, jamais d'une constante
 *  — ici c'est une démonstration, et le jeu simulé la portera (T027). */
const DEVISE_DEMO = 'XOF'

/**
 * ⚠️ LA ZONE SE POSE SUR LE CONTENEUR D'ÉCRAN, JAMAIS SUR UN COMPOSANT
 * (mouvement.md §4). « Un même composant se comporte différemment selon l'écran
 * qui l'accueille : c'est voulu. » La bascule est ici pour qu'on puisse le VOIR,
 * et le test le vérifie.
 */
const zone = ref<'charme' | 'vitesse'>('charme')
const OPTIONS_ZONE: readonly OptionSegment[] = [
  { valeur: 'charme', libelleCle: 'guideDeStyle.demo.charme' },
  { valeur: 'vitesse', libelleCle: 'guideDeStyle.demo.vitesse' },
]
const choixDemo = ref('standard')
const OPTIONS_CHOIX_DEMO = [
  { valeur: 'standard', libelle: t('guideDeStyle.demo.standard') },
  { valeur: 'classique', libelle: t('guideDeStyle.demo.classique') },
  { valeur: 'superieure', libelle: t('guideDeStyle.demo.superieure') },
]

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
    class="mx-auto flex w-full max-w-280 flex-col gap-8 px-6 py-5.5"
    data-ecran="guide-de-style"
    :data-zone="zone"
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
      <SelecteurSegmente
        v-model="zone"
        :options="OPTIONS_ZONE"
        etiquette-cle="guideDeStyle.demo.zone"
        data-reglage="zone"
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

    <!-- 05 · Tuile d'action -->
    <section
      id="composant-05"
      data-composant="05"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">05</span>
        {{ $t('guideDeStyle.composant.05') }}
      </h2>
      <div class="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <TuileAction
          libelle-cle="guideDeStyle.demo.passage"
          icone="ph-door-open"
          detail-cle="guideDeStyle.demo.chambresLibres"
        />
        <TuileAction
          libelle-cle="guideDeStyle.demo.arrivee"
          icone="ph-user-plus"
          detail-cle="guideDeStyle.demo.deuxArrivees"
          :compteur="2"
        />
        <TuileAction
          libelle-cle="guideDeStyle.demo.encaissement"
          icone="ph-cash-register"
          compacte
        />
        <TuileAction
          libelle-cle="guideDeStyle.demo.filtrer"
          icone="ph-funnel"
          compacte
        />
      </div>
    </section>

    <!-- 06 · Carte chiffre -->
    <section
      id="composant-06"
      data-composant="06"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">06</span>
        {{ $t('guideDeStyle.composant.06') }}
      </h2>
      <div class="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <CarteChiffre
          etiquette-cle="guideDeStyle.demo.recetteDuJour"
          :valeur="formaterMontant(184000, DEVISE_DEMO)"
          :delta="formaterEcart(12500, DEVISE_DEMO)"
        />
        <CarteChiffre
          etiquette-cle="guideDeStyle.demo.recetteDuJour"
          :valeur="formaterMontant(97500, DEVISE_DEMO)"
          :delta="formaterEcart(-8000, DEVISE_DEMO)"
          :delta-positif="false"
        />
        <CarteChiffre
          etiquette-cle="guideDeStyle.demo.chambresLibres"
          valeur="7"
          contrefort
        />
        <CarteChiffre
          etiquette-cle="guideDeStyle.demo.recetteDuJour"
          en-chargement
        />
      </div>
    </section>

    <!-- 07 · Bandeau d'alerte -->
    <section
      id="composant-07"
      data-composant="07"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">07</span>
        {{ $t('guideDeStyle.composant.07') }}
      </h2>
      <!-- ⚠️ JAMAIS DEUX BANDEAUX EMPILÉS DANS UN ÉCRAN. Ils sont ici côte à
           côte parce que c'est un guide de style : on les MONTRE, on ne les
           empile pas dans un parcours. -->
      <div class="flex flex-col gap-3.5">
        <BandeauAlerte
          ton="info"
          message-cle="guideDeStyle.demo.noteArretee"
        />
        <BandeauAlerte
          ton="succes"
          message-cle="guideDeStyle.demo.envoiReussi"
        />
        <BandeauAlerte
          ton="alerte"
          message-cle="guideDeStyle.demo.consommationSupprimee"
          action-cle="guideDeStyle.demo.retablir"
        />
        <BandeauAlerte
          ton="danger"
          message-cle="guideDeStyle.demo.connexionPerdue"
          alternative-cle="guideDeStyle.demo.saisirAuComptoir"
          action-cle="guideDeStyle.demo.reessayer"
          pleine-largeur
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
          :montant="formaterMontant(47500, DEVISE_DEMO)"
        />
        <LigneListe
          reference="205"
          libelle="Mme Koné"
          sous-titre-cle="guideDeStyle.demo.troisNuits"
          :montant="formaterMontant(12500, DEVISE_DEMO)"
          etat="selectionnee"
        />
        <LigneListe
          reference="206"
          libelle="M. Bamba"
          sous-titre-cle="guideDeStyle.demo.envoiEnAttente"
          :montant="formaterMontant(25500, DEVISE_DEMO)"
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
          :montant="formaterMontant(15500, DEVISE_DEMO)"
          etat="annulee"
        />
        <LigneListe
          libelle-cle="guideDeStyle.demo.total"
          :montant="formaterMontant(101000, DEVISE_DEMO)"
          etat="total"
        />
      </div>
    </section>

    <!-- 09 · Sélecteur d'établissement -->
    <section
      id="composant-09"
      data-composant="09"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">09</span>
        {{ $t('guideDeStyle.composant.09') }}
      </h2>
      <div class="flex flex-wrap items-start gap-6 rounded-xl border border-line bg-surf p-4">
        <!-- Un seul établissement : il perd son chevron et cesse d'être un
             bouton. Un bouton qui n'ouvre rien apprend à ne plus cliquer. -->
        <SelecteurEtablissement
          :etablissements="[ETABLISSEMENTS_DEMO[0]!]"
          actif-id="deloria"
        />
        <!-- Plusieurs, dont un qui remonte une alerte. -->
        <SelecteurEtablissement
          :etablissements="ETABLISSEMENTS_DEMO"
          actif-id="deloria"
        />
      </div>
    </section>

    <!-- 10 · Témoin de synchronisation -->
    <section
      id="composant-10"
      data-composant="10"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">10</span>
        {{ $t('guideDeStyle.composant.10') }}
      </h2>
      <!-- ⚠️ QUATRE LIBELLÉS, ET AUCUN NE NOMME LE RÉSEAU. « Connecté »,
           « dégradé » et « hors ligne » sont des mots d'ingénieur : ce que
           l'utilisateur lit dit si SON TRAVAIL est en sécurité. -->
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surf p-4">
        <TemoinSynchronisation etat="connecte" />
        <TemoinSynchronisation
          etat="connecte"
          :en-attente="4"
        />
        <TemoinSynchronisation etat="degrade" />
        <TemoinSynchronisation etat="horsLigne" />
        <TemoinSynchronisation
          etat="connecte"
          compact
        />
      </div>
    </section>

    <!-- 11 · État vide illustré -->
    <section
      id="composant-11"
      data-composant="11"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">11</span>
        {{ $t('guideDeStyle.composant.11') }}
      </h2>
      <div class="grid gap-3.5 md:grid-cols-2">
        <div class="rounded-xl border border-line bg-surf">
          <EtatVide
            message-cle="guideDeStyle.demo.aucunSejour"
            action-cle="guideDeStyle.demo.commencerUnPassage"
          />
        </div>
        <div class="rounded-xl border border-line bg-surf">
          <EtatVide
            message-cle="guideDeStyle.demo.aucunResultat"
            de-resultat
          />
        </div>
      </div>
    </section>

    <!-- 12 · Sélecteur segmenté -->
    <section
      id="composant-12"
      data-composant="12"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">12</span>
        {{ $t('guideDeStyle.composant.12') }}
      </h2>
      <div class="flex flex-wrap items-end gap-6 rounded-xl border border-line bg-surf p-4">
        <SelecteurSegmente
          v-model="segmentDemo"
          :options="OPTIONS_SEGMENT_DEMO"
        />
        <!-- La variante tactile : `h-12`, `text-lead`. C'est elle qu'on emploie
             debout, au comptoir. -->
        <SelecteurSegmente
          v-model="segmentDemo"
          :options="OPTIONS_SEGMENT_DEMO"
          taille="comptoir"
        />
      </div>
    </section>

    <!-- 13 · Squelette de chargement -->
    <section
      id="composant-13"
      data-composant="13"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">13</span>
        {{ $t('guideDeStyle.composant.13') }}
      </h2>
      <div class="grid items-start gap-3.5 md:grid-cols-3">
        <div class="overflow-hidden rounded-xl border border-line bg-surf">
          <Squelette variante="liste" />
        </div>
        <Squelette variante="carte" />
        <!-- ⚠️ La roue est réservée à une attente réseau dont on ne connaît pas
             la forme. Employée ailleurs, elle dit « je ne sais pas » là où on
             sait. -->
        <div class="flex justify-center rounded-xl border border-line bg-surf p-4">
          <Squelette variante="roue" />
        </div>
      </div>
    </section>

    <!-- 14 · Bandeau d'annulation -->
    <section
      id="composant-14"
      data-composant="14"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">14</span>
        {{ $t('guideDeStyle.composant.14') }}
      </h2>
      <div class="flex flex-wrap items-center gap-3.5 rounded-xl border border-line bg-surf p-4">
        <BandeauAnnulation
          message-cle="guideDeStyle.demo.consommationSupprimee"
          action-cle="guideDeStyle.demo.annuler"
          :secondes="8"
        />
        <BandeauAnnulation
          message-cle="guideDeStyle.demo.consommationSupprimee"
          action-cle="guideDeStyle.demo.annuler"
          :secondes="3"
        />
        <BandeauAnnulation
          message-cle="guideDeStyle.demo.envoiReussi"
          non-annulable
        />
      </div>
    </section>

    <!-- 15 · Barre de proportion -->
    <section
      id="composant-15"
      data-composant="15"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">15</span>
        {{ $t('guideDeStyle.composant.15') }}
      </h2>
      <!-- ⚠️ Elle porte TOUJOURS son chiffre : à trois mètres, 70 % et 80 % ont
           la même longueur. -->
      <div class="flex flex-col gap-4 rounded-xl border border-line bg-surf p-4">
        <BarreProportion
          :part="72"
          valeur="72 %"
          etiquette-cle="guideDeStyle.demo.tauxOccupation"
        />
        <BarreProportion
          :part="34"
          valeur="34 %"
          ton="secondaire"
        />
        <BarreProportion
          :part="100"
          valeur="100 %"
          ton="atteinte"
        />
      </div>
    </section>

    <!-- 16 · Champ de saisie -->
    <section
      id="composant-16"
      data-composant="16"
      class="flex flex-col gap-3.5"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        <span class="font-mono text-ink-3">16</span>
        {{ $t('guideDeStyle.composant.16') }}
      </h2>
      <div class="grid gap-4 rounded-xl border border-line bg-surf p-4 md:grid-cols-3">
        <ChampSaisie
          v-model="saisieDemo"
          etiquette-cle="guideDeStyle.demo.nomDuClient"
          aide-cle="guideDeStyle.demo.nomDuClientAide"
        />
        <!-- ⚠️ Trois signaux à l'erreur : bordure, message, icône. Une bordure
             rouge seule ne se voit pas en plein soleil, et pas du tout pour un
             daltonien. -->
        <ChampSaisie
          v-model="saisieDemo"
          etiquette-cle="guideDeStyle.demo.nomDuClient"
          aide-cle="guideDeStyle.demo.nomDuClientAide"
          erreur-cle="guideDeStyle.demo.identifiantRefuse"
        />
        <ChampSaisie
          v-model="choixDemo"
          etiquette-cle="guideDeStyle.demo.typeDeChambre"
          :options="OPTIONS_CHOIX_DEMO"
        />
        <ChampSaisie
          v-model="saisieDemo"
          etiquette-cle="guideDeStyle.demo.numeroDeChambre"
          desactive
        />
        <!-- Lecture seule ≠ désactivé : elle se sélectionne et se copie. -->
        <ChampSaisie
          v-model="saisieDemo"
          etiquette-cle="guideDeStyle.demo.numeroDeChambre"
          lecture-seule
        />
        <ChampSaisie
          v-model="saisieDemo"
          etiquette-cle="guideDeStyle.demo.nomDuClient"
          comptoir
        />
      </div>
    </section>
  </div>
</template>
