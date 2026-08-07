<script setup lang="ts">
/**
 * COMPOSANT 13 · SQUELETTE DE CHARGEMENT
 *
 * Rôle : occuper la FORME EXACTE de ce qui arrive, pour que rien ne saute.
 * États : liste · carte chiffre · roue (attente indéterminée).
 *
 * ⚠️ MÊME HAUTEUR DE LIGNE ET MÊME LARGEUR DE COLONNE QUE LE CONTENU RÉEL. Un
 * squelette qui n'a pas la forme du contenu déplace la page à l'arrivée des
 * données — et on reclique au mauvais endroit.
 *
 * ⚠️ LE SCINTILLEMENT EST UNE BANDE TRANSLATÉE (`transform` seul), jamais un
 * dégradé animé : le budget est de 60 images/s sur 2 Go.
 *
 * ⚠️ LA ROUE EST RÉSERVÉE À UNE ATTENTE RÉSEAU DONT ON NE CONNAÎT PAS LA FORME
 * (mouvement.md, patron P7). Employée pour un chargement dont on connaît la
 * forme, elle dit « je ne sais pas » là où on sait.
 */
withDefaults(
  defineProps<{
    variante?: 'liste' | 'carte' | 'roue'
    /** Nombre de lignes pour la variante liste. */
    lignes?: number
  }>(),
  { variante: 'liste', lignes: 3 },
)
</script>

<template>
  <div
    :data-squelette="variante"
    role="status"
    aria-busy="true"
  >
    <div
      v-if="variante === 'liste'"
      class="flex flex-col"
    >
      <div
        v-for="ligne in lignes"
        :key="ligne"
        class="flex h-14 items-center gap-3 border-b border-line px-4"
      >
        <span class="relative h-3 w-9 overflow-hidden rounded-sm bg-tile">
          <span
            class="absolute inset-0 animate-scintillement bg-linear-to-r from-transparent via-brillance to-transparent"
          />
        </span>
        <span class="relative h-3 flex-1 overflow-hidden rounded-sm bg-tile">
          <span
            class="absolute inset-0 animate-scintillement bg-linear-to-r from-transparent via-brillance to-transparent"
          />
        </span>
        <span class="relative h-3 w-24 overflow-hidden rounded-sm bg-tile">
          <span
            class="absolute inset-0 animate-scintillement bg-linear-to-r from-transparent via-brillance to-transparent"
          />
        </span>
      </div>
    </div>

    <div
      v-else-if="variante === 'carte'"
      class="flex flex-col gap-1.5 rounded-xl border border-line bg-surf p-4"
    >
      <span class="relative h-2.5 w-2/5 overflow-hidden rounded-sm bg-tile">
        <span
          class="absolute inset-0 animate-scintillement bg-linear-to-r from-transparent via-brillance to-transparent"
        />
      </span>
      <span class="relative h-8 w-3/5 overflow-hidden rounded-sm bg-tile">
        <span
          class="absolute inset-0 animate-scintillement bg-linear-to-r from-transparent via-brillance to-transparent"
        />
      </span>
    </div>

    <span
      v-else
      class="inline-block size-6 animate-roue rounded-pleine border-2 border-info/30 border-t-info"
    />
  </div>
</template>
