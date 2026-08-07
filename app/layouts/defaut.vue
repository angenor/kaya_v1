<script setup lang="ts">
/**
 * LE GABARIT PAR DÉFAUT — la racine que toute page nouvelle hérite sans rien
 * écrire, et qu'elle ne peut pas oublier.
 *
 * RÉFÉRENCE VISUELLE : cas (a), maquetté — la barre d'en-tête de
 * `docs/design/html/R1-accueil.html`. On en lit les valeurs, on ne la copie pas.
 *
 * ⚠️ LA RACINE NE SE DÉMONTE JAMAIS. C'est la propriété de ce fichier, et elle
 * a un coût si on la perd : le témoin de synchronisation et le sélecteur
 * d'établissement sont « présents partout » (docs/Kaya_Design.md §13), donc ils
 * clignoteraient à chaque navigation — et un témoin qui clignote cesse d'être
 * lu.
 *
 * ⚠️ UN SEUL `<main>` DANS LE DOCUMENT. Le gabarit le porte ; une page n'en
 * écrit jamais un second (FR-032).
 *
 * ⚠️ LES TROIS EMPLACEMENTS SONT REMPLIS PAR LE GABARIT LUI-MÊME, jamais par la
 * page. « Présents partout » ne se délègue pas : si chaque page devait remplir
 * la barre, la première qui oublierait la rendrait vide, et personne ne le
 * verrait avant la démonstration.
 */
import BandeauCoquille from '~/core/coquille/BandeauCoquille.vue'
import ReglagesCoquille from '~/core/coquille/ReglagesCoquille.vue'
import { fournisseur } from '~/core/donnees/fournisseur'
import type { EtablissementAffichable } from '~/core/design-system/SelecteurEtablissement.vue'
import { useSession } from '~/core/session/useSession'
import { CLE_SEUIL_LATENCE_DEGRADEE, lireParametreEntier } from '~/core/configuration/configuration'
import { useFile } from '~/core/file/useFile'
import { useScenarios } from '~/core/scenarios/useScenarios'
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import SelecteurEtablissement from '~/core/design-system/SelecteurEtablissement.vue'
import TemoinSynchronisation from '~/core/design-system/TemoinSynchronisation.vue'

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
// ⚠️ LES RÉGLAGES SONT DÉJÀ REPRIS QUAND CE GABARIT REND. C'est le greffon
// `scenarios.client.ts` qui s'en charge, AVANT le montage : les reprendre ici, à
// `onNuxtReady`, les rendait disponibles APRÈS le `setup()` des pages — donc
// après leur première lecture de données, qui partait alors avec les réglages
// initiaux. La file, elle, n'est lue par aucun `setup()` : `onNuxtReady` suffit,
// et lui épargne une attente sur le chemin du premier écran.
const { reglages } = useScenarios()
const { enAttente, reprendre: reprendreFile } = useFile()

onNuxtReady(() => {
  void reprendreFile()
})

/**
 * LE SÉLECTEUR D'ÉTABLISSEMENT, BRANCHÉ SUR LA SESSION.
 *
 * ⚠️ SANS CELA, LA BARRE AFFICHAIT « K » SUR TOUS LES ÉCRANS — l'initiale de
 * repli du composant, faute de toute donnée. **Constaté en ouvrant
 * l'application**, capture à l'appui : le repère d'orientation le plus important
 * du produit ne disait pas où l'on était. Aucun test ne le regardait, parce
 * qu'aucun ne demandait au composant ce qu'il rendait avec des données.
 *
 * ⚠️ ET IL NE CHANGE JAMAIS DE CONTEXTE TOUT SEUL. Il rend ce que la session
 * porte ; c'est le panneau Scénarios qui décide, et ce sera `R0` en phase 3. Un
 * changement de contexte non demandé fait saisir une consommation sur le mauvais
 * site.
 */
const { session } = useSession()
const etablissements = ref<readonly EtablissementAffichable[]>([])

watch(
  () => session.value.etablissementId,
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

const seuilDegrade = lireParametreEntier(CLE_SEUIL_LATENCE_DEGRADEE, 3000)
const etatReseau = computed(() => {
  if (reglages.value.horsLigne) return 'horsLigne' as const
  if (reglages.value.latenceMs >= seuilDegrade) return 'degrade' as const
  return 'connecte' as const
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg font-texte text-ink">
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
          :actif-id="session.etablissementId"
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

    <!-- ⚠️ LE BANDEAU DE LA COQUILLE EST DANS LE GABARIT, PAS DANS UNE PAGE.
         « Présents partout » ne se délègue pas : une version nouvelle et une
         application non installée concernent l'APPAREIL, quel que soit l'écran
         ouvert. La première page qui oublierait de le poser serait celle où
         l'exploitant passe sa journée. -->
    <BandeauCoquille />

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
