<script setup lang="ts">
/**
 * L'EN-TÊTE — **défini une fois dans le dépôt**, monté par le gabarit, jamais
 * écrit par une page.
 *
 * RÉFÉRENCE VISUELLE : cas (a), maquetté — la barre d'en-tête des quatre
 * `docs/design/html/R1-accueil*.html`. On en lit les valeurs, on ne la copie pas.
 *
 * ⚠️ L'ORDRE DES ÉLÉMENTS NE CHANGE JAMAIS (contrat de grammaire §1) :
 *
 *     marque · établissement et poste · témoin d'envoi · heure et date · identité
 *
 * ⚠️ IL Y A EXACTEMENT UN `<header>` DANS LE DÉPÔT, et c'est celui-ci. Une page
 * qui en écrirait un second donnerait deux barres à l'exploitant, dont une qui
 * ment. `tests/unite/entete-unique.spec.ts` le vérifie.
 *
 * ⚠️ LE SECOND SEGMENT PORTE **LA COMMUNE, TOUJOURS** ; le poste est un segment
 * distinct, **affiché seulement s'il est unique**. Jamais « plusieurs postes »,
 * jamais un poste par défaut, jamais une liste : le segment **affirme un fait**,
 * et l'affirmer sans le savoir est un mensonge que six cycles hériteraient.
 *
 * ⚠️ ET IL NE CHANGE **JAMAIS** DE CONTEXTE TOUT SEUL. Une alerte venue d'un
 * autre établissement remonte en pastille sur le sélecteur fermé ; elle ne
 * bascule rien. *Un changement de contexte non demandé fait saisir une
 * consommation sur le mauvais site.*
 */
import IdentitePersonne from '~/core/coquille/IdentitePersonne.vue'
import ReglagesCoquille from '~/core/coquille/ReglagesCoquille.vue'
import { useContexte } from '~/core/coquille/useContexte'
import type { EtablissementAffichable } from '~/core/design-system/SelecteurEtablissement.vue'
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import SelecteurEtablissement from '~/core/design-system/SelecteurEtablissement.vue'
import TemoinSynchronisation from '~/core/design-system/TemoinSynchronisation.vue'
import { CLE_SEUIL_LATENCE_DEGRADEE, lireParametreEntier } from '~/core/configuration/configuration'
import { useFile } from '~/core/file/useFile'
import { formaterDateLongue, formaterHeure } from '~/core/format/instant'
import { useLangue } from '~/core/i18n/useLangue'
import { useScenarios } from '~/core/scenarios/useScenarios'

const {
  session,
  etablissements,
  etablissementActif,
  poste,
  sitesEnAlerte,
  chargerLesEtablissements,
  basculer,
} = useContexte()

watch(() => session.value.compteId, () => void chargerLesEtablissements(), { immediate: true })

/**
 * ⚠️ LA COMMUNE TOUJOURS, LE POSTE SEULEMENT S'IL EST UNIQUE. Les deux formes —
 * « Abobo · La salle » et « Abengourou » — sont celles du contrat, et elles sont
 * obtenues par deux comptes du jeu, sans levier ni réglage à inventer.
 */
const detailDuSite = computed(() => {
  const commune = etablissementActif.value?.commune
  if (commune === undefined) return undefined
  return poste.value === null ? commune : `${commune} · ${poste.value}`
})

/**
 * ⚠️ LE TROISIÈME ÉTAT DU SÉLECTEUR — « Mes N établissements ». Il n'apparaît
 * qu'à qui en a plusieurs : le proposer à quelqu'un qui n'a qu'un site serait
 * une vue d'ensemble sur une seule maison.
 */
const { t } = useI18n()
const PORTEE_TOUS = '__tous__'

const affichables = computed<readonly EtablissementAffichable[]>(() => {
  const sites = etablissements.value.map((etablissement) => ({
    id: etablissement.id,
    nom: etablissement.nom,
    detail: etablissement.commune,
    // ⚠️ L'ALERTE D'UN AUTRE SITE SE VOIT SANS QU'ON Y AILLE, et **rien ne
    // bascule** : le composant 09 rend une pastille sur le sélecteur fermé.
    alerte: sitesEnAlerte.value.includes(etablissement.id),
  }))
  if (sites.length < 2) return sites
  return [
    ...sites,
    { id: PORTEE_TOUS, nom: t('contexte.tousLesSites', { n: sites.length }), detail: undefined },
  ]
})

/** Ce que le sélecteur montre comme actif — la vue d'ensemble a son entrée. */
const actifId = computed(() =>
  session.value.portee?.type === 'tous' ? PORTEE_TOUS : (etablissementActif.value?.id ?? null),
)

const detailAffiche = computed(() =>
  session.value.portee?.type === 'tous' ? t('contexte.vueDEnsemble') : detailDuSite.value,
)

async function choisir(id: string): Promise<void> {
  await basculer(id === PORTEE_TOUS ? { type: 'tous' } : { type: 'etablissement', id })
}

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

/**
 * L'HEURE ET LA DATE — **au fuseau de l'établissement**, par la seule fonction
 * qui écrit une heure.
 *
 * ⚠️ ELLE NE PORTE **AUCUNE RÈGLE** : c'est l'exemption « rendu de l'instant
 * perçu » (constitution, principe 4). Aucune durée, aucun montant, aucune
 * disponibilité ne se calcule d'ici — tout cela s'appuie sur l'horodatage
 * d'autorité, jamais sur l'horloge d'un terminal.
 *
 * ⚠️ ET LE FUSEAU VIENT DE L'ÉTABLISSEMENT, pas de l'appareil. Un poste dont
 * l'horloge est réglée ailleurs — le cas ordinaire d'un terminal partagé —
 * afficherait sinon une heure qui n'est celle de personne.
 */
const { langue } = useLangue()
const maintenant = ref(new Date())
let battement: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Une fois par minute : l'en-tête affiche des minutes, pas des secondes.
  battement = setInterval(() => {
    maintenant.value = new Date()
  }, 60_000)
})
onBeforeUnmount(() => {
  if (battement !== null) clearInterval(battement)
})

const contexteInstant = computed(() => ({
  fuseauHoraire: etablissementActif.value?.fuseauHoraire ?? 'Africa/Abidjan',
  langue: langue.value,
}))

const heure = computed(() => formaterHeure(maintenant.value, contexteInstant.value))
const dateLongue = computed(() => formaterDateLongue(maintenant.value, contexteInstant.value))
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3.5 border-b border-line bg-surf px-5"
  >
    <!-- Composant 09 · sélecteur d'établissement.
         « Toujours en haut à gauche, il ne bouge jamais de place. »
         Sa liste vient des ÉTABLISSEMENTS OÙ CE COMPTE A DES DROITS : avec un
         seul, il perd son chevron et cesse d'être un bouton — un bouton qui
         n'ouvre rien apprend à ne plus cliquer. -->
    <div
      data-emplacement="etablissement"
      class="flex min-w-0 items-center gap-3.5"
    >
      <SelecteurEtablissement
        :etablissements="affichables"
        :actif-id="actifId"
        :detail="detailAffiche"
        @choisir="choisir"
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

    <!-- L'heure et la date, au fuseau de l'établissement. -->
    <div
      data-emplacement="instant"
      class="hidden flex-col items-end sm:flex"
    >
      <span
        class="font-mono text-corps whitespace-nowrap text-ink"
        data-heure
      >{{ heure }}</span>
      <span
        class="text-mini whitespace-nowrap text-ink-3"
        data-date
      >{{ dateLongue }}</span>
    </div>

    <!-- L'identité : qui agit, ce qu'elle fait, et « Passer la main ». -->
    <IdentitePersonne />

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
