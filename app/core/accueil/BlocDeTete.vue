<script setup lang="ts">
/**
 * LE BLOC DE TÊTE — **ce qui attend maintenant**, et une seule action pour y
 * répondre.
 *
 * RÉFÉRENCE VISUELLE : cas (a), maquetté — « À faire maintenant » de
 * `R1-accueil.html`, « Votre service » de `-serveuse`, « Le service » de
 * `-maquis`, « La seule chose qui vous attend » de `-proprietaire`.
 * Composants : **01** bouton principal · **03** bouton discret.
 *
 * ⚠️ **UNE SEULE ACTION PRINCIPALE PAR ÉCRAN** (FR-016). Ce composant n'en rend
 * qu'une, et `composerAccueil` n'en retient qu'une : ajouter trois actions faute
 * d'avoir tranché laquelle compte est la faute exacte que la règle nomme —
 * l'écran cesse alors de dire ce qui attend, et se contente de tout proposer.
 *
 * ⚠️ LE MONTANT PASSE PAR `format/montant.ts`, LA SEULE FONCTION QUI ÉCRIT UN
 * MONTANT. `R1` en affiche huit ou plus selon la variante ; un seul écrit à la
 * main et l'alignement tabulaire tombe.
 */
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import type { TeteAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

const props = defineProps<{ tete: TeteAccueil }>()

defineEmits<{ principale: []; secondaire: [] }>()

const montantEcrit = computed(() =>
  props.tete.montant === null
    ? null
    : formaterMontant(props.tete.montant.montantMineur, props.tete.montant.codeDevise),
)
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-xl border border-line bg-surf p-5 shadow-basse md:flex-row md:items-center"
    data-surface="tete"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="font-titre text-titre-s font-semibold text-ink">{{ tete.libelle }}</span>
      <span class="text-mini text-ink-3">
        {{ tete.detail }}
        <template v-if="montantEcrit">
          ·
          <span
            class="font-mono whitespace-nowrap text-ink-2"
            data-montant
          >{{ montantEcrit }}</span>
        </template>
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-3.5">
      <BoutonDiscret
        v-if="tete.actionSecondaireCle"
        :libelle-cle="tete.actionSecondaireCle"
        data-action="secondaire"
        @activer="$emit('secondaire')"
      />
      <BoutonPrincipal
        :libelle-cle="tete.actionCle"
        data-action="principale"
        @activer="$emit('principale')"
      />
    </div>
  </div>
</template>
