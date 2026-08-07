<script setup lang="ts">
/**
 * LE GABARIT PAR DÉFAUT — la racine que toute page nouvelle hérite sans rien
 * écrire, et qu'elle ne peut pas oublier.
 *
 * ⚠️ LA RACINE NE SE DÉMONTE JAMAIS. C'est la propriété de ce fichier, et elle
 * a un coût si on la perd : le témoin de synchronisation et le sélecteur
 * d'établissement sont « présents partout » (docs/Kaya_Design.md §13), donc ils
 * clignoteraient à chaque navigation — et un témoin qui clignote cesse d'être
 * lu.
 *
 * ⚠️ UN SEUL `<main>` DANS LE DOCUMENT. Le gabarit le porte ; une page n'en
 * écrit jamais un second (FR-032).
 *
 * ⚠️ LES TROIS EMPLACEMENTS SONT REMPLIS PAR LE GABARIT LUI-MÊME, jamais par la
 * page. « Présents partout » ne se délègue pas : si chaque page devait remplir
 * la barre, la première qui oublierait la rendrait vide, et personne ne le
 * verrait avant la démonstration.
 *
 * ⚠️ ET L'EN-TÊTE VIT DANS SON PROPRE FICHIER DEPUIS F2 —
 * `app/core/coquille/EnTeteContexte.vue`. Le gabarit le MONTE, il ne le
 * rédige pas : ce que six cycles vont hériter mérite un fichier qu'on lit, pas
 * un bloc qu'on retrouve.
 */
import BandeauCoquille from '~/core/coquille/BandeauCoquille.vue'
import EnTeteContexte from '~/core/coquille/EnTeteContexte.vue'
import { useFile } from '~/core/file/useFile'
import { useScenarios } from '~/core/scenarios/useScenarios'

// ⚠️ LES RÉGLAGES SONT DÉJÀ REPRIS QUAND CE GABARIT REND. C'est le greffon
// `scenarios.client.ts` qui s'en charge, AVANT le montage : les reprendre ici, à
// `onNuxtReady`, les rendait disponibles APRÈS le `setup()` des pages — donc
// après leur première lecture de données, qui partait alors avec les réglages
// initiaux. La file, elle, n'est lue par aucun `setup()` : `onNuxtReady` suffit,
// et lui épargne une attente sur le chemin du premier écran.
useScenarios()
const { reprendre: reprendreFile } = useFile()

onNuxtReady(() => {
  void reprendreFile()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-texte text-ink">
    <EnTeteContexte />

    <!-- ⚠️ LE BANDEAU DE LA COQUILLE EST DANS LE GABARIT, PAS DANS UNE PAGE.
         « Présents partout » ne se délègue pas : une version nouvelle et une
         application non installée concernent l'APPAREIL, quel que soit l'écran
         ouvert. La première page qui oublierait de le poser serait celle où
         l'exploitant passe sa journée. -->
    <BandeauCoquille />

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
