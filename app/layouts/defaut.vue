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
 * ⚠️ **LA FENÊTRE NE DÉFILE PAS, LE CONTENU DÉFILE** — `h-screen` et non
 * `min-h-screen`, `overflow-hidden` sur la racine, et le défilement porté par le
 * `<main>`. La barre du haut est un repère d'orientation : « toujours en haut à
 * gauche, elle ne bouge jamais de place ». Tant que le document entier défilait,
 * elle ne tenait que par un `sticky` — et l'écran à deux colonnes emportait sa
 * colonne latérale avec lui dès qu'on descendait dans la liste, alors que cette
 * colonne porte précisément ce qu'on SURVEILLE pendant qu'on travaille à gauche.
 *
 * ⚠️ LE DÉFILEMENT DESCEND D'UN CRAN, IL NE DISPARAÎT PAS : le `<main>` le porte
 * pour tous les écrans d'une seule colonne — le guide de style, l'index, le
 * panneau. Un écran qui veut découper le sien, comme `R1`, remplit exactement la
 * hauteur et gère ses colonnes lui-même.
 *
 * ⚠️ ET L'EN-TÊTE VIT DANS SON PROPRE FICHIER DEPUIS F2 —
 * `app/core/coquille/EnTeteContexte.vue`. Le gabarit le MONTE, il ne le
 * rédige pas : ce que six cycles vont hériter mérite un fichier qu'on lit, pas
 * un bloc qu'on retrouve.
 */
import BandeauCoquille from '~/core/coquille/BandeauCoquille.vue'
import EnTeteContexte from '~/core/coquille/EnTeteContexte.vue'
import NavigationLaterale from '~/core/coquille/NavigationLaterale.vue'
import { useNavigationMobile } from '~/core/coquille/useNavigationMobile'
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

/**
 * LE TIROIR DE NAVIGATION, SOUS `sm` — **et il se referme tout seul**.
 *
 * ⚠️ **SUR TÉLÉPHONE, LE RAIL EST MASQUÉ** : à 390 px, 15 rem de colonne fixe ne
 * laissent rien à l'écran de travail. Il revient en tiroir, par-dessus, ouvert
 * depuis l'en-tête — le seul coin que l'œil cherche pour sortir d'un écran.
 *
 * ⚠️ **ET IL SE FERME À LA NAVIGATION.** Un tiroir qui reste ouvert sur l'écran
 * qu'on vient d'atteindre cache exactement ce qu'on est venu voir, et fait
 * chercher un second geste pour le ranger.
 */
const { ouverte: navigationOuverte } = useNavigationMobile()
const route = useRoute()
watch(() => route.path, () => { navigationOuverte.value = false })

onNuxtReady(() => {
  void reprendreFile()
})
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-bg font-texte text-ink">
    <EnTeteContexte />

    <!-- ⚠️ LE BANDEAU DE LA COQUILLE EST DANS LE GABARIT, PAS DANS UNE PAGE.
         « Présents partout » ne se délègue pas : une version nouvelle et une
         application non installée concernent l'APPAREIL, quel que soit l'écran
         ouvert. La première page qui oublierait de le poser serait celle où
         l'exploitant passe sa journée. -->
    <BandeauCoquille />

    <!-- ⚠️ `flex` SUR LE `<main>`, ET CE N'EST PAS COSMÉTIQUE. Sans lui, un
         écran à deux colonnes voit sa colonne latérale s'arrêter à la hauteur de
         son contenu, au milieu de l'écran, avec son fond et son filet coupés
         net. Le `flex-1` donne la hauteur au `<main>` ; le `flex` la transmet à
         la page. **Constaté sur une capture de `R1`.**

         ⚠️ `min-h-0` EST OBLIGATOIRE À CÔTÉ DE `flex-1`, et son absence ne se
         voit qu'à l'usage : un item flex a `min-height: auto`, donc il refuse de
         descendre sous la hauteur de son contenu — le `<main>` déborderait de la
         fenêtre au lieu de faire défiler, et la barre du haut sortirait de
         l'écran malgré tout. -->
    <!-- ⚠️ **LA NAVIGATION EST DANS LE GABARIT, PAS DANS UNE PAGE.** « Présent
         partout » ne se délègue pas : la première page qui oublierait de la
         poser serait celle d'où l'on ne pourrait plus sortir — et c'est
         exactement ce qui est arrivé à `/jour` avant qu'elle existe.

         ⚠️ ET ELLE EST **HORS DU `<main>`** : le `<main>` porte le contenu de
         l'écran, la navigation porte le déplacement entre les écrans. Les
         mêler ferait défiler la navigation avec la page. -->
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <NavigationLaterale class="hidden sm:flex" />
      <main class="flex min-h-0 min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- ⚠️ **LE TIROIR DE TÉLÉPHONE — LA MÊME NAVIGATION, PAR-DESSUS.** C'est
         `NavigationLaterale` et rien d'autre : une seconde implémentation « pour
         le mobile » aurait divergé au premier écran ajouté, et l'une des deux
         aurait fini par ne plus montrer ce que l'autre montre.

         ⚠️ **LE VOILE SE TOUCHE, ET IL LE FAUT.** Un tiroir qui ne se ferme
         qu'au bouton oblige à viser un coin ; toucher à côté est le geste que
         tout le monde fait d'abord. -->
    <div
      v-if="navigationOuverte"
      class="fixed inset-0 z-30 flex sm:hidden"
      data-tiroir-navigation
    >
      <NavigationLaterale
        tiroir
        class="flex shadow-panneau"
        @fermer="navigationOuverte = false"
      />
      <button
        type="button"
        class="flex-1 cursor-pointer bg-voile"
        :aria-label="$t('navigation.fermer')"
        data-action="fermer-navigation"
        @click="navigationOuverte = false"
      />
    </div>
  </div>
</template>
