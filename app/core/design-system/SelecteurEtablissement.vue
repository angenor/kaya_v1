<script setup lang="ts">
/**
 * COMPOSANT 09 · SÉLECTEUR D'ÉTABLISSEMENT
 *
 * Rôle : savoir **où on est** avant de faire quoi que ce soit.
 * États : fermé (un seul — non cliquable) · fermé (plusieurs) · fermé avec
 *         alerte · ouvert (courant / avec alerte / autre).
 *
 * ⚠️ TOUJOURS EN HAUT À GAUCHE, IL NE BOUGE JAMAIS DE PLACE. C'est un repère
 * d'orientation : un repère qui se déplace n'en est plus un.
 *
 * ⚠️ L'INITIALE EST EN OCRE, PAS EN INDIGO. « L'indigo est un signal, pas une
 * décoration : ce qui est indigo se touche. » L'initiale ne se touche pas —
 * c'est le bouton qui l'entoure qui se touche.
 *
 * ⚠️ AVEC UN SEUL ÉTABLISSEMENT, IL PERD SON CHEVRON ET CESSE D'ÊTRE UN BOUTON.
 * Un bouton qui n'ouvre rien apprend à ne plus cliquer.
 *
 * ⚠️ IL REMONTE LES ALERTES DES AUTRES ÉTABLISSEMENTS MAIS NE CHANGE JAMAIS DE
 * CONTEXTE TOUT SEUL. Un changement de contexte non demandé fait saisir une
 * consommation sur le mauvais site.
 */
export interface EtablissementAffichable {
  readonly id: string
  readonly nom: string
  /** Ce qui se lit sous le nom : la commune, le nombre d'unités. */
  readonly detail?: string
  /** Une alerte remontée depuis cet établissement. */
  readonly alerte?: boolean
}

const props = withDefaults(
  defineProps<{
    etablissements?: readonly EtablissementAffichable[]
    actifId?: string | null
  }>(),
  { etablissements: () => [], actifId: null },
)

defineEmits<{ choisir: [id: string] }>()

const ouvert = ref(false)
const actif = computed(
  () => props.etablissements.find((e) => e.id === props.actifId) ?? props.etablissements[0],
)
const plusieurs = computed(() => props.etablissements.length > 1)
const alerteAilleurs = computed(() =>
  props.etablissements.some((e) => e.alerte && e.id !== actif.value?.id),
)
const initiale = computed(() => (actif.value?.nom ?? 'K').trim().charAt(0).toUpperCase())
</script>

<template>
  <div class="relative">
    <component
      :is="plusieurs ? 'button' : 'div'"
      :type="plusieurs ? 'button' : undefined"
      class="inline-flex h-11 items-center gap-2.5 rounded-lg border border-line bg-surf px-3 shadow-basse"
      :class="plusieurs && 'cursor-pointer hover:border-prim'"
      data-composant-09
      :aria-expanded="plusieurs ? ouvert : undefined"
      @click="plusieurs && (ouvert = !ouvert)"
    >
      <span
        class="inline-flex size-7 items-center justify-center rounded-md bg-ocre-soft font-titre text-corps font-bold text-ocre"
        aria-hidden="true"
      >{{ initiale }}</span>
      <span
        v-if="actif"
        class="flex min-w-0 flex-col items-start gap-0.5"
      >
        <span class="truncate font-titre text-corps font-semibold text-ink">{{ actif.nom }}</span>
        <span
          v-if="actif.detail"
          class="truncate text-mini text-ink-3"
        >{{ actif.detail }}</span>
      </span>
      <span
        v-if="alerteAilleurs"
        class="size-2 rounded-pleine bg-alerte"
        aria-hidden="true"
      />
      <i
        v-if="plusieurs"
        class="ph ph-caret-down text-corps text-ink-3"
        aria-hidden="true"
      />
    </component>

    <div
      v-if="ouvert && plusieurs"
      class="absolute top-full left-0 z-30 mt-1.5 flex w-64 flex-col overflow-hidden rounded-2xl border border-line bg-surf shadow-panneau"
    >
      <button
        v-for="etablissement in etablissements"
        :key="etablissement.id"
        type="button"
        class="flex h-11 cursor-pointer items-center gap-2.5 px-3 text-left transition-colors duration-90 hover:bg-prim-soft"
        :class="etablissement.id === actif?.id && 'bg-prim-soft'"
        @click="$emit('choisir', etablissement.id), (ouvert = false)"
      >
        <span
          class="inline-flex size-7 items-center justify-center rounded-md bg-ocre-soft font-titre text-corps font-bold text-ocre"
          aria-hidden="true"
        >{{ etablissement.nom.charAt(0).toUpperCase() }}</span>
        <span class="min-w-0 flex-1 truncate font-titre text-corps font-semibold text-ink">
          {{ etablissement.nom }}
        </span>
        <span
          v-if="etablissement.alerte"
          class="size-2 rounded-pleine bg-alerte"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
