<script setup lang="ts">
/**
 * COMPOSANT 15 · BARRE DE PROPORTION
 *
 * Rôle : montrer une part — taux d'occupation, avancement d'une clôture.
 *
 * ⚠️ ELLE PORTE TOUJOURS SON CHIFFRE À CÔTÉ D'ELLE. **Une barre seule ne se lit
 * pas** : à trois mètres, 70 % et 80 % ont la même longueur.
 *
 * ⚠️ LA LARGEUR EST LE SEUL ENDROIT DU PRODUIT OÙ UNE VALEUR CALCULÉE ENTRE EN
 * STYLE. Ce n'est pas une valeur de jeton — c'est une PROPORTION, donc une
 * donnée. La règle de lint (c) refuse le style en ligne STATIQUE et laisse
 * passer la liaison, pour cette raison exactement.
 *
 * ⚠️ ELLE ENTRE AU CANON PAR CE CYCLE. `composants.md` la portait « hors série,
 * à valider » ; la rendre dans tous ses états tranche la décision, et le fichier
 * est mis à jour DANS LE MÊME CHANGEMENT.
 */
const props = withDefaults(
  defineProps<{
    /** La part atteinte, de 0 à 100. */
    part: number
    /** Le chiffre à lire — déjà formaté. Jamais omis. */
    valeur: string
    etiquetteCle?: string
    ton?: 'principale' | 'secondaire' | 'atteinte'
  }>(),
  { etiquetteCle: undefined, ton: 'principale' },
)

const TONS = {
  principale: 'bg-prim',
  secondaire: 'bg-ocre',
  atteinte: 'bg-succes',
} as const

const largeur = computed(() => `${Math.min(100, Math.max(0, props.part))}%`)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span
      v-if="etiquetteCle"
      class="text-etiquette uppercase text-ink-3"
    >{{ $t(etiquetteCle) }}</span>
    <div class="flex items-center gap-3">
      <span
        class="h-2 flex-1 overflow-hidden rounded-pleine bg-tile"
        role="img"
        :aria-label="valeur"
      >
        <span
          class="block h-full rounded-pleine transition-[width] duration-240 ease-deplace"
          :class="TONS[ton]"
          :style="{ width: largeur }"
        />
      </span>
      <span class="font-mono text-corps font-bold whitespace-nowrap text-ink">{{ valeur }}</span>
    </div>
  </div>
</template>
