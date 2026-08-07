<script setup lang="ts">
/**
 * « VOS ACTIVITÉS » — un service par tuile.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « Vos activités » de `R1-accueil.html`.
 * Composant : **05** tuile d'action. **Aucun composant nouveau.**
 *
 * ⚠️ LA GRILLE DE TABLES DES ACCUEILS SERVEUSE ET MAQUIS EST **CE MÊME
 * COMPOSANT EN VARIANTE COMPACTE**, portant une pastille **04** au lieu d'une
 * icône — c'est le seul écart relevé contre `composants.md`, et il est couvert
 * par la variante compacte que le §05 déclare déjà. Inventer un dix-septième
 * composant pour une grille de tables aurait ouvert la porte au dix-huitième.
 *
 * ⚠️ ET UNE TUILE NON AUTORISÉE N'EST PAS RENDUE. Il n'y a **aucun** état
 * désactivé : c'est `composerAccueil` qui retire, et le §05 ne porte plus
 * l'état — retiré au cycle F2, avec son motif écrit.
 */
import TuileAction from '~/core/design-system/TuileAction.vue'
import type { ActiviteAccueil } from '~/core/donnees/accueil/types'

defineProps<{ activites: readonly ActiviteAccueil[] }>()

defineEmits<{ activer: [activite: ActiviteAccueil] }>()
</script>

<template>
  <div
    class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
    data-surface="activite"
  >
    <TuileAction
      v-for="activite in activites"
      :key="activite.surfaceCle"
      :libelle="activite.libelle"
      :detail="activite.detail"
      :icone="activite.icone"
      :data-activite="activite.moduleCode"
      @activer="$emit('activer', activite)"
    />
  </div>
</template>
