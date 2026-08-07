<script setup lang="ts">
/**
 * « ENSUITE » — la liste de ce qui vient, **dans l'ordre de l'heure**.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — « Ensuite, dans l'ordre de l'heure » de
 * `R1-accueil.html`, « Vos tables » de `-serveuse`, « La salle » de `-maquis`.
 * Composants : **08** ligne de liste · **04** pastille d'état.
 *
 * ⚠️ **ORDONNÉE PAR L'HEURE, JAMAIS PAR IMPORTANCE SUPPOSÉE.** Ce qui vient
 * ensuite est ce qui vient ensuite. Classer par gravité ferait remonter en tête
 * ce qui peut attendre — et l'exploitant apprendrait à ne plus lire l'ordre,
 * c'est-à-dire à relire toute la liste à chaque fois.
 *
 * ⚠️ L'ORDRE SE FAIT **ICI**, SUR L'INSTANT, jamais dans la source. Une source
 * qui trierait imposerait son ordre à tous les écrans qui l'emploient, et le
 * suivant aurait un autre besoin.
 *
 * ⚠️ ET LE MONTANT PASSE PAR `format/montant.ts`. Toujours.
 */
import LigneListe from '~/core/design-system/LigneListe.vue'
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import type { LigneSuiteAccueil } from '~/core/donnees/accueil/types'
import { formaterMontant } from '~/core/format/montant'

const props = defineProps<{ lignes: readonly LigneSuiteAccueil[] }>()

defineEmits<{ activer: [ligne: LigneSuiteAccueil] }>()

/** Les six libellés d'état — ceux du vocabulaire de formes, jamais inventés. */
const LIBELLE_ETAT: Readonly<Record<string, string>> = {
  acquis: 'accueil.etat.aJour',
  enCours: 'accueil.etat.enCours',
  libre: 'accueil.etat.libre',
  casse: 'accueil.etat.aRegler',
  horsLigne: 'accueil.etat.sansReseau',
  attente: 'accueil.etat.enAttente',
}

const ordonnees = computed(() =>
  [...props.lignes].sort((a, b) => a.instant.localeCompare(b.instant)),
)

function montantEcrit(ligne: LigneSuiteAccueil): string | undefined {
  return ligne.montant === null
    ? undefined
    : formaterMontant(ligne.montant.montantMineur, ligne.montant.codeDevise)
}
</script>

<template>
  <div
    class="overflow-hidden rounded-xl border border-line bg-surf shadow-basse"
    data-surface="suite"
  >
    <LigneListe
      v-for="ligne in ordonnees"
      :key="ligne.id"
      :libelle="ligne.libelle"
      :sous-titre="ligne.detail"
      :montant="montantEcrit(ligne)"
      :data-ligne="ligne.id"
      @activer="$emit('activer', ligne)"
    >
      <template #fin>
        <!-- ⚠️ L'ÉTAT PORTE UNE FORME, PAS SEULEMENT UNE COULEUR. En niveaux de
             gris comme en plein soleil, les six restent distincts. -->
        <PastilleEtat
          :etat="ligne.etat"
          :libelle-cle="LIBELLE_ETAT[ligne.etat] ?? 'accueil.etat.enCours'"
        />
      </template>
    </LigneListe>
  </div>
</template>
