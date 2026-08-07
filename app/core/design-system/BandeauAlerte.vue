<script setup lang="ts">
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'

/**
 * COMPOSANT 07 · BANDEAU D'ALERTE
 *
 * Rôle : dire ce qui s'est passé et, si besoin, offrir l'action qui répare.
 * États : info · succès · alerte · danger · pleine largeur.
 *
 * ⚠️ STRUCTURE FIXE : une icône, UNE PHRASE AU PASSÉ qui dit ce qui s'est
 * produit, l'action à droite. L'ordre n'est pas décoratif — c'est ce qui permet
 * de lire le bandeau en diagonale.
 *
 * ⚠️ JAMAIS DEUX BANDEAUX EMPILÉS. Le plus grave gagne, l'autre attend. Deux
 * bandeaux en font lire zéro.
 *
 * ⚠️ ET UNE INTERDICTION PORTE SON VERSANT POSITIF. `refusCle` existe pour cela :
 * « Cette action nécessite internet » est vrai et inutile seul. C'est une
 * exigence de rédaction du lexique, portée ici par le type.
 */
withDefaults(
  defineProps<{
    /** La phrase au passé — clé i18n. */
    messageCle: string
    /** Ce qui reste possible. Obligatoire dès qu'on refuse quelque chose. */
    alternativeCle?: string
    ton?: 'info' | 'succes' | 'alerte' | 'danger'
    actionCle?: string
    pleineLargeur?: boolean
  }>(),
  { alternativeCle: undefined, ton: 'info', actionCle: undefined, pleineLargeur: false },
)

defineEmits<{ agir: [] }>()

const TONS = {
  info: { bord: 'border-l-info', fond: 'bg-info-soft', encre: 'text-info-fort', icone: 'ph-info' },
  succes: {
    bord: 'border-l-succes',
    fond: 'bg-succes-soft',
    encre: 'text-succes-fort',
    icone: 'ph-check-circle',
  },
  alerte: {
    bord: 'border-l-alerte',
    fond: 'bg-alerte-soft',
    encre: 'text-alerte-fort',
    icone: 'ph-warning',
  },
  danger: {
    bord: 'border-l-danger',
    fond: 'bg-danger-soft',
    encre: 'text-danger-fort',
    icone: 'ph-warning-circle',
  },
} as const
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-r-lg border-l-4 p-3.5"
    :class="[TONS[ton].bord, TONS[ton].fond, pleineLargeur && 'w-full']"
    :data-ton="ton"
    role="status"
  >
    <i
      :class="['ph', TONS[ton].icone, 'text-titre-s', TONS[ton].encre]"
      aria-hidden="true"
    />
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span
        class="text-corps font-semibold"
        :class="TONS[ton].encre"
      >{{ $t(messageCle) }}</span>
      <span
        v-if="alternativeCle"
        class="text-mini text-ink-2"
      >{{ $t(alternativeCle) }}</span>
    </span>
    <BoutonDiscret
      v-if="actionCle"
      :libelle-cle="actionCle"
      @activer="$emit('agir')"
    />
  </div>
</template>
