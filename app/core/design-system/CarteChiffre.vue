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
 *
 * ⚠️ LA VARIANTE **CREUX** EST AJOUTÉE AU CYCLE F2, SUR CONSTAT DE MAQUETTE.
 * Posées dans la colonne latérale des quatre `R1-accueil*.html`, les cartes de
 * chiffre passent sur `bg-tile` **sans ombre** : la colonne est déjà en `bg-surf`,
 * et une carte de surface sur une surface se voit comme un empilement d'ombres.
 * Le creux inverse le rapport — la carte est en retrait, la colonne la porte.
 *
 * ⚠️ ET LA COMPARAISON A DEUX FORMES, PAS UNE. Un ÉCART se lit avec son triangle
 * et son ton (`+ 18 %`) ; une NOTE est une phrase qui n'indique aucune direction
 * (« 3 arrivées attendues »), et elle porte son propre ton — neutre, alerte ou
 * succès selon le fait. Les maquettes emploient les deux dans la même rangée :
 * les fondre ferait poser un repère de direction sur une phrase qui n'en indique
 * pas, ce qui apprend à ne plus le lire.
 */
withDefaults(
  defineProps<{
    etiquetteCle: string
    /** La valeur DÉJÀ FORMATÉE — voir `app/core/format/montant.ts`. */
    valeur?: string
    /** L'écart, déjà formaté. Le signe décide de la forme et du ton. */
    delta?: string
    deltaPositif?: boolean
    /**
     * ⚠️ LA COMPARAISON QUI N'EST PAS UN ÉCART — « 3 arrivées attendues cet
     * après-midi », « la plus ancienne depuis 1 h 05 ». Les maquettes en
     * portent autant que de deltas, et lui donner le triangle du delta
     * signalerait une variation là où il n'y en a aucune : un repère de
     * direction sur une phrase qui n'en indique pas apprend à ne plus le lire.
     */
    note?: string
    /** Le contrefort Banco : un seul côté porte 4 px de couleur. */
    contrefort?: boolean
    /** La variante creux : `bg-tile` sans ombre, pour une colonne en `bg-surf`. */
    creux?: boolean
    /** Le ton de la note — le fait décide, jamais la mise en page. */
    tonNote?: 'neutre' | 'succes' | 'alerte'
    enChargement?: boolean
  }>(),
  {
    valeur: undefined,
    delta: undefined,
    deltaPositif: true,
    note: undefined,
    contrefort: false,
    creux: false,
    tonNote: 'neutre',
    enChargement: false,
  },
)

/** Écrits en toutes lettres : Tailwind élague ce qu'il ne voit pas. */
const TONS_NOTE = {
  neutre: 'text-ink-3',
  succes: 'text-succes-fort',
  alerte: 'text-alerte-fort',
} as const
</script>

<template>
  <div
    class="flex flex-col border border-line"
    :class="[
      contrefort ? 'rounded-r-xl rounded-l-xs border-l-4 border-l-prim' : 'rounded-xl',
      creux ? 'gap-1 bg-tile px-4 py-3.5' : 'gap-1.5 bg-surf p-4 shadow-basse',
    ]"
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
      class="font-mono font-bold whitespace-nowrap text-ink"
      :class="creux ? 'text-chiffre' : 'text-chiffre-l'"
      data-valeur
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

    <span
      v-if="note && !enChargement"
      class="text-mini"
      :class="TONS_NOTE[tonNote]"
      data-note
    >{{ note }}</span>
  </div>
</template>
