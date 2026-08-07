<script setup lang="ts">
import { ETATS_PASTILLE, type EtatPastille } from '~/core/design-system/etatsPastille'

/**
 * COMPOSANT 04 · PASTILLE D'ÉTAT
 *
 * Rôle : dire l'état d'une chose en un coup d'œil, à distance, en plein soleil.
 *
 * ⚠️ FORME **PLUS** COULEUR, JAMAIS LA COULEUR SEULE. Le vocabulaire de formes
 * vit dans `etatsPastille.ts` : on choisit un ÉTAT, la forme et le ton en
 * découlent. Les découpler laisserait un écran associer un losange au danger.
 *
 * ⚠️ LA PASTILLE N'EST PAS CLIQUABLE. Si elle doit l'être, elle devient un
 * bouton discret — et elle passe alors à 44 px.
 *
 * ⚠️ LE NOM DE L'ÉTAT N'EST PAS RENDU DANS LE HTML, ET C'EST UNE CORRECTION.
 * Une première version portait `data-etat="horsLigne"` : constaté en cherchant
 * les mots proscrits dans le document rendu, c'était le NOM INTERNE d'un état
 * qui atteignait l'écran — au sens de SC-022, qui inspecte le HTML et non ce
 * qu'un œil y lit. Seule la FORME est exposée, parce qu'un test doit pouvoir
 * vérifier qu'un état n'est pas porté par la couleur seule.
 */
const props = withDefaults(
  defineProps<{
    etat: EtatPastille
    libelleCle: string
    /** Variante contour, à poser sur un fond `bg-tile`. */
    contour?: boolean
  }>(),
  { contour: false },
)

const apparence = computed(() => ETATS_PASTILLE[props.etat])
</script>

<template>
  <span
    class="inline-flex h-7 items-center gap-1.5 rounded-pleine pr-2.5 pl-2 text-mini font-semibold"
    :class="[
      apparence.encre,
      contour ? ['border', apparence.bord, 'bg-transparent'] : apparence.fond,
    ]"
    :data-forme="apparence.forme"
  >
    <span
      :class="apparence.marque"
      aria-hidden="true"
    />
    {{ $t(libelleCle) }}
  </span>
</template>
