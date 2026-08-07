<script setup lang="ts">
/**
 * LE GABARIT PAR DÉFAUT — la racine que toute page nouvelle hérite sans rien
 * écrire, et qu'elle ne peut pas oublier.
 *
 * RÉFÉRENCE VISUELLE : cas (a), maquetté — la barre d'en-tête de
 * `docs/design/html/R1-accueil.html`. On en lit les valeurs, on ne la copie pas.
 *
 * ⚠️ LA RACINE NE SE DÉMONTE JAMAIS. C'est la propriété de ce fichier, et elle
 * a un coût si on la perd : le témoin de synchronisation et le sélecteur
 * d'établissement sont « présents partout » (docs/Kaya_Design.md §13), donc ils
 * clignoteraient à chaque navigation — et un témoin qui clignote cesse d'être
 * lu.
 *
 * ⚠️ UN SEUL `<main>` DANS LE DOCUMENT. Le gabarit le porte ; une page n'en
 * écrit jamais un second (FR-032).
 */
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-texte text-ink">
    <header
      class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3.5 border-b border-line bg-surf px-5"
    >
      <!-- Emplacement du composant 09 · sélecteur d'établissement.
           « Toujours en haut à gauche, il ne bouge jamais de place. » -->
      <div
        data-emplacement="etablissement"
        class="flex min-w-0 items-center gap-3.5"
      >
        <slot name="etablissement" />
      </div>

      <span class="flex-1" />

      <!-- Emplacement du composant 10 · témoin de synchronisation.
           Le composant le plus important du produit. -->
      <div
        data-emplacement="temoin"
        class="flex items-center"
      >
        <slot name="temoin" />
      </div>

      <!-- Emplacements des deux réglages de la coquille : le thème et la
           langue. Ce ne sont pas des réglages d'établissement — ils vivent sur
           l'appareil, et c'est pourquoi ils sont ici et pas dans G1. -->
      <div
        data-emplacement="reglages"
        class="flex items-center gap-1.5 border-l border-line pl-3.5"
      >
        <slot name="reglages" />
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
