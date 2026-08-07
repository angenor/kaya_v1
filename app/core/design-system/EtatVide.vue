<script setup lang="ts">
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'

/**
 * COMPOSANT 11 · ÉTAT VIDE ILLUSTRÉ
 *
 * Rôle : dire qu'un vide est NORMAL, et comment commencer.
 * États : vide de départ (motif ocre + action) · vide de résultat (recherche).
 *
 * ⚠️ TROIS ÉLÉMENTS, DANS CET ORDRE : le motif, une phrase qui dit ce qui
 * apparaîtra ici, l'action qui démarre. **Un écran vide sans action est une
 * impasse.**
 *
 * ⚠️ LE MOTIF EST CELUI DES CONTREFORTS, EN OCRE — jamais une illustration de
 * personnage, jamais un dessin de marque. Il est dessiné en utilitaires, à
 * partir des jetons : c'est de la géométrie, pas une image à charger.
 *
 * ⚠️ LE VIDE DE RÉSULTAT N'A PAS DE MOTIF : il a l'icône de la recherche et une
 * PORTE DE SORTIE. Le distinguer compte — un filtre qui ne rend rien n'est pas
 * un registre vide.
 */
withDefaults(
  defineProps<{
    messageCle: string
    actionCle?: string
    /** Vide de RÉSULTAT : une recherche ou un filtre qui ne rend rien. */
    deResultat?: boolean
  }>(),
  { actionCle: undefined, deResultat: false },
)

defineEmits<{ demarrer: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center gap-4 px-6 py-8 text-center"
    data-composant-11
    :data-variante="deResultat ? 'resultat' : 'depart'"
  >
    <!-- Le motif de contreforts : trois blocs de terre, un côté coloré. -->
    <div
      v-if="!deResultat"
      class="flex items-end gap-1.5"
      aria-hidden="true"
    >
      <span class="h-8 w-5 rounded-t-md border-b-4 border-b-ocre bg-ocre-soft" />
      <span class="h-12 w-5 rounded-t-md border-b-4 border-b-ocre bg-ocre-soft" />
      <span class="h-6 w-5 rounded-t-md border-b-4 border-b-ocre bg-ocre-soft" />
    </div>
    <i
      v-else
      class="ph ph-magnifying-glass text-titre-l text-ink-3"
      aria-hidden="true"
    />

    <p class="max-w-96 text-corps text-ink-2">
      {{ $t(messageCle) }}
    </p>

    <BoutonPrincipal
      v-if="actionCle"
      :libelle-cle="actionCle"
      @activer="$emit('demarrer')"
    />
  </div>
</template>
