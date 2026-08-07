<script setup lang="ts">
/**
 * COMPOSANT 06 · CARTE CHIFFRE
 *
 * Rôle : un chiffre, son étiquette, sa comparaison.
 * États : delta positif · delta négatif · sans comparaison · en chargement ·
 *         variante contrefort.
 *
 * ⚠️ LE MONTANT EST TOUJOURS EN `font-mono` ET EN `whitespace-nowrap`. Deux
 * cartes côte à côte alignent alors leurs unités sans réglage, et aucun montant
 * ne se coupe en fin de ligne.
 *
 * ⚠️ LE DELTA EST UN TRIANGLE **PLUS** UNE COULEUR, jamais une couleur seule —
 * même règle que la pastille d'état. Et il DISPARAÎT en zone de vitesse
 * (mouvement.md, patron P4) : au comptoir, la valeur est déjà juste quand l'œil
 * arrive, la comparaison est du bruit.
 */
withDefaults(
  defineProps<{
    etiquetteCle: string
    /** La valeur DÉJÀ FORMATÉE — voir `app/core/format/montant.ts`. */
    valeur?: string
    /** L'écart, déjà formaté. Le signe décide de la forme et du ton. */
    delta?: string
    deltaPositif?: boolean
    /** Le contrefort Banco : un seul côté porte 4 px de couleur. */
    contrefort?: boolean
    enChargement?: boolean
  }>(),
  {
    valeur: undefined,
    delta: undefined,
    deltaPositif: true,
    contrefort: false,
    enChargement: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col gap-1.5 border border-line bg-surf p-4 shadow-basse"
    :class="contrefort ? 'rounded-r-xl rounded-l-xs border-l-4 border-l-prim' : 'rounded-xl'"
  >
    <span class="text-etiquette uppercase text-ink-3">{{ $t(etiquetteCle) }}</span>

    <span
      v-if="enChargement"
      class="relative h-8 w-3/5 overflow-hidden rounded-sm bg-tile"
      aria-hidden="true"
    >
      <span
        class="absolute inset-0 animate-scintillement bg-linear-to-r from-transparent via-brillance to-transparent"
      />
    </span>
    <span
      v-else
      class="font-mono text-chiffre-l font-bold whitespace-nowrap text-ink"
    >{{ valeur }}</span>

    <span
      v-if="delta && !enChargement"
      class="inline-flex items-center gap-1.5 text-mini font-semibold"
      :class="deltaPositif ? 'text-succes-fort' : 'text-danger-fort'"
      data-delta
    >
      <span
        class="size-2"
        :class="
          deltaPositif
            ? 'bg-succes [clip-path:polygon(50%_0,100%_100%,0_100%)]'
            : 'bg-danger [clip-path:polygon(0_0,100%_0,50%_100%)]'
        "
        aria-hidden="true"
      />
      {{ delta }}
    </span>
  </div>
</template>
