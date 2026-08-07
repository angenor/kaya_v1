<script setup lang="ts">
/**
 * L'EN-TÊTE — **défini une fois dans le dépôt**, monté par le gabarit, jamais
 * écrit par une page.
 *
 * RÉFÉRENCE VISUELLE : cas (a), maquetté — la barre d'en-tête des quatre
 * `docs/design/html/R1-accueil*.html`. On en lit les valeurs, on ne la copie pas.
 *
 * ⚠️ CE FICHIER EST UNE **EXTRACTION**, pas une réécriture. Il portait le même
 * rendu à `app/layouts/defaut.vue` ; le déplacer donne à la grammaire de
 * coquille un lieu, et aux six cycles suivants un fichier à lire plutôt qu'un
 * gabarit à fouiller. Le test de non-régression est que les suites de navigateur
 * existantes restent vertes.
 *
 * ⚠️ IL Y A EXACTEMENT UN `<header>` DANS LE DÉPÔT, et c'est celui-ci. Une page
 * qui en écrirait un second donnerait deux barres à l'exploitant, dont une qui
 * ment. `tests/unite/entete-unique.spec.ts` le vérifie.
 *
 * ⚠️ LA RACINE NE SE DÉMONTE JAMAIS. Le témoin d'envoi et le sélecteur
 * d'établissement sont « présents partout » (docs/Kaya_Design.md §13) : montés
 * par le gabarit, ils ne clignotent pas à la navigation — et un témoin qui
 * clignote cesse d'être lu.
 *
 * ⚠️ ET IL NE CHANGE JAMAIS DE CONTEXTE TOUT SEUL. Il rend ce que la session
 * porte ; c'est l'utilisateur qui décide. *Un changement de contexte non demandé
 * fait saisir une consommation sur le mauvais site.*
 */
import { fournisseur } from '~/core/donnees/fournisseur'
import type { EtablissementAffichable } from '~/core/design-system/SelecteurEtablissement.vue'
import { etablissementDe, useSession } from '~/core/session/useSession'
import { CLE_SEUIL_LATENCE_DEGRADEE, lireParametreEntier } from '~/core/configuration/configuration'
import { useFile } from '~/core/file/useFile'
import { useScenarios } from '~/core/scenarios/useScenarios'
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import ReglagesCoquille from '~/core/coquille/ReglagesCoquille.vue'
import SelecteurEtablissement from '~/core/design-system/SelecteurEtablissement.vue'
import TemoinSynchronisation from '~/core/design-system/TemoinSynchronisation.vue'

/**
 * LE SÉLECTEUR D'ÉTABLISSEMENT, BRANCHÉ SUR LA SESSION.
 *
 * ⚠️ SANS CELA, LA BARRE AFFICHAIT « K » SUR TOUS LES ÉCRANS — l'initiale de
 * repli du composant, faute de toute donnée. **Constaté en ouvrant
 * l'application**, capture à l'appui : le repère d'orientation le plus important
 * du produit ne disait pas où l'on était. Aucun test ne le regardait, parce
 * qu'aucun ne demandait au composant ce qu'il rendait avec des données.
 */
const { session } = useSession()
const etablissements = ref<readonly EtablissementAffichable[]>([])
const etablissementActifId = computed(() => etablissementDe(session.value))

watch(
  () => etablissementDe(session.value),
  async (etablissementId) => {
    if (etablissementId === null) {
      etablissements.value = []
      return
    }
    const resultat = await fournisseur().etablissements.listerEtablissements()
    // Une lecture qui échoue — hors ligne, panne — ne vide pas la barre : elle
    // la laisse telle quelle. Un repère qui disparaît en coupure n'est pas un
    // repère.
    if (!resultat.ok) return
    etablissements.value = resultat.valeur.map((etablissement) => ({
      id: etablissement.id,
      nom: etablissement.nom,
    }))
  },
  { immediate: true },
)

/**
 * LE TÉMOIN DIT LA VÉRITÉ, ET IL LA TIENT DE LA FILE.
 *
 * ⚠️ LE SEUIL QUI SÉPARE « Enregistré » DE « Connexion faible » EST UNE **CLÉ DE
 * CONFIGURATION**, jamais une constante — `sync.latence_degradee_seuil_ms`, de
 * valeur initiale 3 000 ms. La 3G d'Abengourou et la fibre d'Abidjan ne
 * demandent pas le même réglage.
 *
 * ⚠️ ET LES TROIS NOMS D'ÉTAT NE SORTENT PAS D'ICI : ils entrent dans le
 * composant 10, qui les traduit en libellés du lexique et n'en rend AUCUN dans
 * le HTML.
 */
const { reglages } = useScenarios()
const { enAttente } = useFile()

const seuilDegrade = lireParametreEntier(CLE_SEUIL_LATENCE_DEGRADEE, 3000)
const etatReseau = computed(() => {
  if (reglages.value.horsLigne) return 'horsLigne' as const
  if (reglages.value.latenceMs >= seuilDegrade) return 'degrade' as const
  return 'connecte' as const
})
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3.5 border-b border-line bg-surf px-5"
  >
    <!-- Composant 09 · sélecteur d'établissement.
         « Toujours en haut à gauche, il ne bouge jamais de place. »
         Sa liste vient de la SESSION, et son état actif aussi : avec un seul
         établissement il perd son chevron et cesse d'être un bouton — un
         bouton qui n'ouvre rien apprend à ne plus cliquer. -->
    <div
      data-emplacement="etablissement"
      class="flex min-w-0 items-center gap-3.5"
    >
      <SelecteurEtablissement
        :etablissements="etablissements"
        :actif-id="etablissementActifId"
      />
    </div>

    <span class="flex-1" />

    <!-- Emplacement du composant 10 · témoin de synchronisation.
         Le composant le plus important du produit. -->
    <div
      data-emplacement="temoin"
      class="flex items-center"
    >
      <TemoinSynchronisation
        :etat="etatReseau"
        :en-attente="enAttente"
        compact
      />
    </div>

    <!-- Les deux réglages de la coquille : le thème et la langue. Ce ne sont
         pas des réglages d'établissement — ils vivent sur l'appareil, et
         c'est pourquoi ils sont ici et pas dans G1. -->
    <div
      data-emplacement="reglages"
      class="flex items-center gap-1.5 border-l border-line pl-3.5"
    >
      <ReglagesCoquille />
      <!-- ⚠️ L'ACCROCHE DU PANNEAU SCÉNARIOS EST PERMANENTE, ET SANS ELLE ON
           NE BASCULE PAS EN COURS DE PARCOURS. C'est un INSTRUMENT : il porte
           le trait bas de sa route, et un exploitant ne le voit jamais — mais
           il doit être atteignable depuis n'importe quel écran, sinon on
           quitte le parcours pour le régler et on perd ce qu'on testait. -->
      <NuxtLink
        to="/_scenarios"
        data-accroche="scenarios"
      >
        <BoutonDiscret
          icone="ph-sliders-horizontal"
          :libelle-cle="undefined"
        />
      </NuxtLink>
    </div>
  </header>
</template>
