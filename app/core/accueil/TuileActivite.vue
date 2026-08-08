<script setup lang="ts">
/**
 * « VOS ACTIVITÉS » — un service par tuile.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « Vos activités » de `R1-accueil.html`.
 * Composant : **05** tuile d'action. **Aucun composant nouveau.**
 *
 * ⚠️ **UN FLUX QUI S'ENROULE, PAS UNE GRILLE À COLONNES FIXES.** La maquette
 * pose `flex flex-wrap gap-2.5` avec des tuiles `flex-1 min-w-38` : elles se
 * partagent la largeur disponible et passent à la ligne quand il n'y en a plus.
 * Une grille à trois colonnes laisse un trou quand il y a cinq services, et
 * écrase les tuiles quand il y en a deux — or le nombre de services dépend de
 * l'établissement, et il n'est jamais le même.
 *
 * ⚠️ **LE COMPTEUR DU §05 EST ENFIN ALIMENTÉ.** Le composant le portait depuis
 * F1 — « il ne s'affiche que s'il y a du travail en attente, jamais à zéro » —
 * et rien ne le remplissait. Ce qu'il compte est **dérivé de l'écran lui-même** :
 * les cartes « À régler » retenues qui relèvent de ce service.
 *
 * ⚠️ ET UNE TUILE NON AUTORISÉE N'EST PAS RENDUE. Il n'y a **aucun** état
 * désactivé : c'est `composerAccueil` qui retire, et le §05 ne porte plus
 * l'état — retiré au cycle F2, avec son motif écrit.
 */
import TuileAction from '~/core/design-system/TuileAction.vue'
import type { ActiviteComposee } from '~/core/accueil/composerAccueil'

defineProps<{ activites: readonly ActiviteComposee[] }>()

defineEmits<{ activer: [activite: ActiviteComposee] }>()
</script>

<template>
  <div
    class="flex flex-wrap gap-2.5"
    data-surface="activite"
  >
    <TuileAction
      v-for="activite in activites"
      :key="activite.surfaceCle"
      class="min-w-38 flex-1"
      :libelle="activite.libelle"
      :detail="activite.detail"
      :icone="activite.icone"
      :compteur="activite.aSignaler"
      :data-activite="activite.moduleCode"
      :data-a-signaler="activite.aSignaler"
      @activer="$emit('activer', activite)"
    />
  </div>
</template>
