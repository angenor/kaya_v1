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
      :data-activite="activite.moduleCode"
      @activer="$emit('activer', activite)"
    />
  </div>
</template>
