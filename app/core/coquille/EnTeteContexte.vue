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
 * ⚠️ **SUR UN TÉLÉPHONE, LE NOM DU SITE CÈDE EN DERNIER RECOURS.** À 390 px, il
 * ne reste plus rien d'autre à comprimer : la marque, l'heure, le texte de
 * l'identité et l'accroche des instruments se sont déjà rangés. Le sélecteur
 * garde alors son initiale et tronque le nom — on sait toujours qu'on EST
 * quelque part, et un appui le dit en entier.
 *
 * ⚠️ **L'ORDRE DE DÉGRADATION EST DÉCIDÉ, PAS SUBI.** Quand la barre se
 * resserre, ce qui cède le fait dans cet ordre : d'abord **l'heure et la date**
 * (masquées sous `lg`), puis **ce que la personne fait** (tronqué), et **jamais
 * le sélecteur d'établissement ni le témoin d'envoi** — l'un est le repère
 * d'orientation, l'autre dit si le travail est en sécurité. Sans cet ordre, une
 * fenêtre de 940 px écrasait le sélecteur à zéro : on ne savait plus **où l'on
 * était**, ce qui est exactement ce que la barre existe pour empêcher.
 *
 * ⚠️ ET IL NE CHANGE **JAMAIS** DE CONTEXTE TOUT SEUL. Une alerte venue d'un
 * autre établissement remonte en pastille sur le sélecteur fermé ; elle ne
 * bascule rien. *Un changement de contexte non demandé fait saisir une
 * consommation sur le mauvais site.*
 */
import IdentitePersonne from '~/core/coquille/IdentitePersonne.vue'
import ReglagesCoquille from '~/core/coquille/ReglagesCoquille.vue'
import { useContexte } from '~/core/coquille/useContexte'
import { useNavigationMobile } from '~/core/coquille/useNavigationMobile'
import type { EtablissementAffichable } from '~/core/design-system/SelecteurEtablissement.vue'
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import SelecteurEtablissement from '~/core/design-system/SelecteurEtablissement.vue'
import TemoinSynchronisation from '~/core/design-system/TemoinSynchronisation.vue'
import { CLE_SEUIL_LATENCE_DEGRADEE, lireParametreEntier } from '~/core/configuration/configuration'
import { useFile } from '~/core/file/useFile'
import { formaterDateLongue, formaterHeure } from '~/core/format/instant'
import { maintenantAutorite } from '~/core/donnees/horloge'
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

const { ouverte: navigationOuverte } = useNavigationMobile()

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

/**
 * ⚠️ UN COMPTE SANS AUCUN ÉTABLISSEMENT, LU SUR LA **PORTÉE** ET NON SUR LA
 * LISTE. La liste arrive après une lecture ; la portée est connue dès la
 * reprise. Attendre la liste ferait apparaître le sélecteur une fraction de
 * seconde après le reste de la barre, à chaque navigation.
 */
const sansEtablissement = computed(
  () => session.value.compteId !== null && session.value.portee === null,
)

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
 *
 * ⚠️ **L'INSTANT VIENT DE LA COUTURE, ET NON PLUS DE `new Date()`.** Corrigé au
 * cycle F3, où la règle ESLint (e) l'a signalé : l'en-tête affichait l'heure de
 * l'APPAREIL, c'est-à-dire celle qu'un membre du personnel peut changer. Elle
 * affiche désormais **l'heure d'autorité** — la même que celle qui facture —, et
 * l'écart entre les deux devient un fait que l'écran peut annoncer au lieu d'un
 * fait que personne ne voit.
 */
const { langue } = useLangue()
const maintenant = ref(maintenantAutorite())
let battement: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Une fois par minute : l'en-tête affiche des minutes, pas des secondes.
  battement = setInterval(() => {
    maintenant.value = maintenantAutorite()
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
    class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-line bg-surf px-3 lg:gap-3.5 lg:px-5"
  >
    <!-- ⚠️ **L'OUVERTURE DE LA NAVIGATION, ET ELLE N'EXISTE QUE SOUS `sm`.**
         *Constaté à l'usage* : sur un téléphone, le rail latéral est masqué —
         il prendrait la moitié de l'écran — et **rien ne permettait de
         l'ouvrir**. Un produit dont on ne peut pas changer d'écran sur le
         terminal que le personnel a dans la poche est un produit qu'on quitte.
         Au-delà de `sm`, le rail est là : un second chemin vers lui serait un
         bouton qui double une barre déjà visible.

         ⚠️ ET ELLE PREND LA PLACE DE LA MARQUE. Le « K » ocre occupait ce coin
         depuis le cycle F2 ; il a été **retiré au cycle F3**. Il n'apprenait
         rien — on sait quel logiciel on ouvre —, il n'était atteignable par
         aucun geste, et il tenait la seule position que l'œil cherche quand il
         veut sortir de l'écran. -->
    <BoutonDiscret
      icone="ph-list"
      :libelle-cle="undefined"
      :aria-label="t('navigation.ouvrir')"
      :aria-expanded="navigationOuverte"
      class="sm:hidden"
      data-action="ouvrir-navigation"
      @activer="navigationOuverte = true"
    />

    <!-- Composant 09 · sélecteur d'établissement.
         « Toujours en haut à gauche, il ne bouge jamais de place. »
         Sa liste vient des ÉTABLISSEMENTS OÙ CE COMPTE A DES DROITS : avec un
         seul, il perd son chevron et cesse d'être un bouton — un bouton qui
         n'ouvre rien apprend à ne plus cliquer. -->
    <!-- ⚠️ **SANS RATTACHEMENT, PAS DE SÉLECTEUR** (FR-024). Un compte sans
         aucun établissement — l'administrateur éditeur — n'a pas de site à
         afficher : le composant 09 rendrait alors une initiale sans nom, c'est-
         à-dire un repère qui ne repère rien. La portée le dit **sans attendre
         aucune lecture** : `null` avec un compte présent, c'est l'absence de
         rattachement ; le sélecteur ne clignote donc pas au chargement. -->
    <div
      v-if="!sansEtablissement"
      data-emplacement="etablissement"
      class="flex min-w-0 max-w-48 items-center gap-3.5 lg:max-w-none lg:shrink-0"
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
      class="flex shrink-0 items-center"
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
      class="hidden shrink-0 flex-col items-end lg:flex"
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
      class="flex shrink-0 items-center gap-1.5 lg:border-l lg:border-line lg:pl-3.5"
    >
      <ReglagesCoquille />
      <!-- ⚠️ L'ACCROCHE DU PANNEAU SCÉNARIOS EST PERMANENTE, ET SANS ELLE ON
           NE BASCULE PAS EN COURS DE PARCOURS. C'est un INSTRUMENT : il porte
           le trait bas de sa route, et un exploitant ne le voit jamais — mais
           il doit être atteignable depuis n'importe quel écran, sinon on
           quitte le parcours pour le régler et on perd ce qu'on testait. -->
      <NuxtLink
        to="/_scenarios"
        class="hidden lg:block"
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
