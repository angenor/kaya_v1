<script setup lang="ts">
import type { ClasseHorsLigne } from '~/core/donnees/contrat'
import { fournisseur } from '~/core/donnees/fournisseur'
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import BoutonSecondaire from '~/core/design-system/BoutonSecondaire.vue'
import ChampSaisie from '~/core/design-system/ChampSaisie.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import LigneListe from '~/core/design-system/LigneListe.vue'
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import TemoinSynchronisation from '~/core/design-system/TemoinSynchronisation.vue'
import { useFile } from '~/core/file/useFile'
import {
  CAS_DU_JEU,
  CLASSES_ESSAI,
  ISSUES_ENVOI,
  type CasDuJeu,
  type IssueEnvoiSimulee,
} from '~/core/scenarios/reglages'
import { useScenarios } from '~/core/scenarios/useScenarios'
import {
  contexteSansEtablissement,
  contexteVueDEnsemble,
  resoudreContexte,
} from '~/core/session/resoudreContexte'
import { etablissementDe, useSession } from '~/core/session/useSession'
import { useCoquille } from '~/core/coquille/useCoquille'
import { useInstallation } from '~/core/coquille/useInstallation'
import { capacitesAbsentes } from '~/core/plateforme/capacites'

/**
 * LE PANNEAU SCÉNARIOS — l'instrument par lequel on met l'application dans les
 * conditions difficiles, DEPUIS L'INTERFACE, sans recompiler.
 *
 * RÉFÉRENCE VISUELLE : cas (c), COMPOSÉ — motif de configuration posé par `G2`,
 * en zone de charme. Composants employés : 16 (latence, et « choix fermé » pour
 * le compte et l'établissement), 12 (les leviers et la classe d'écriture), 02,
 * 07, 10, 08, 11.
 *
 * ⚠️ CE N'EST PAS UN ÉCRAN DU PRODUIT. Sa route porte un trait bas, et il
 * n'entre pas au décompte des 46. Un exploitant ne le voit jamais.
 *
 * ⚠️ ET AUCUN LEVIER N'EST APPLIQUÉ ICI. Cette page ÉCRIT des réglages ; c'est
 * la couche de simulation qui les lit et les applique. Un composant qui saurait
 * appliquer un scénario serait un composant à réécrire en phase 3.
 */
definePageMeta({ path: '/_scenarios' })

const { t } = useI18n()
useHead({ title: () => t('scenarios.titre') })

const { reglages, reprendre, regler, toutRemettre } = useScenarios()
const { elements, enAttente, reprendre: reprendreFile, ecrireOuRefuser, toutVider } = useFile()
const { session, definir } = useSession()

await reprendre()
await reprendreFile()

/** Les quatre leviers booléens · composant 12, variante deux options. */
const OPTIONS_BOOLEEN: readonly OptionSegment[] = [
  { valeur: 'non', libelleCle: 'scenarios.inactif' },
  { valeur: 'oui', libelleCle: 'scenarios.actif' },
]

function levier(cle: 'echecReseau' | 'horsLigne' | 'jeuVide' | 'conflitAuTap') {
  return computed({
    get: () => (reglages.value[cle] ? 'oui' : 'non'),
    set: (valeur: string) => void regler(cle, valeur === 'oui'),
  })
}

const echecReseau = levier('echecReseau')
const horsLigne = levier('horsLigne')
const jeuVide = levier('jeuVide')

/**
 * LES QUATRE LEVIERS DU CYCLE F3.
 *
 * ⚠️ **CE NE SONT PAS DES INTERRUPTEURS D'ÉCRAN.** Ils vivent dans la couche de
 * simulation, qui disparaît au branchement de la phase 3 — et les leviers avec
 * elle. Aucun composant du produit ne les lit ; c'est le panneau qui les écrit,
 * et la simulation seule qui les applique.
 *
 * ⚠️ **`conflitAuTap` EXERCE LE CAS DES DEUX RÉCEPTIONNISTES À LA MÊME
 * SECONDE** : une occupation concurrente apparaît **entre le rendu et le tap**.
 * Sans lui, ce cas limite ne serait exercé par rien — et c'est celui qui décide
 * si le refus arrive avant ou après la clé.
 */
const conflitAuTap = levier('conflitAuTap')

const casDuJeu = computed({
  get: () => reglages.value.casDuJeu,
  set: (valeur: string) => void regler('casDuJeu', valeur as CasDuJeu),
})

const issueEnvoiFiscal = computed({
  get: () => reglages.value.issueEnvoiFiscal,
  set: (valeur: string) => void regler('issueEnvoiFiscal', valeur as IssueEnvoiSimulee),
})

const deriveHorloge = computed({
  get: () => String(reglages.value.deriveHorlogeSecondes),
  set: (valeur: string) =>
    void regler('deriveHorlogeSecondes', Number.parseInt(valeur, 10) || 0),
})

const OPTIONS_CAS: readonly OptionSegment[] = CAS_DU_JEU.map((cas) => ({
  valeur: cas,
  libelleCle: `scenarios.cas${cas.charAt(0).toUpperCase()}${cas.slice(1)}`,
}))

const OPTIONS_ISSUE: readonly OptionSegment[] = ISSUES_ENVOI.map((issue) => ({
  valeur: issue,
  libelleCle: `scenarios.issue${issue.charAt(0)}${issue.slice(1).toLowerCase()}`,
}))

const latence = computed({
  get: () => String(reglages.value.latenceMs),
  set: (valeur: string) => void regler('latenceMs', Math.max(0, Number.parseInt(valeur, 10) || 0)),
})

/** Le compte et l'établissement · composant 16, état « choix fermé ». */
const comptesDisponibles = ref<{ valeur: string; libelle: string }[]>([])
const etablissementsDisponibles = ref<{ valeur: string; libelle: string }[]>([])

const resultatComptes = await fournisseur().comptes.listerComptes()
if (resultatComptes.ok) {
  comptesDisponibles.value = resultatComptes.valeur.map((compte) => ({
    valeur: compte.id,
    libelle: compte.identifiant,
  }))
}
/**
 * ⚠️ **ON NE PROPOSE QUE LES SITES OÙ CE COMPTE A DES DROITS** (FR-047, cycle
 * F2). Le panneau listait AUPARAVANT tous les établissements du jeu : on
 * pouvait mettre Adjoua sur « Résidence Test », où elle n'a aucun rôle, et
 * l'écran répondait par un état vide. **Proposer puis refuser est un grisé
 * déguisé** — c'est montrer une porte fermée, ce que le principe 8 interdit
 * partout ailleurs. L'instrument n'y échappe pas : ce qu'il rend possible est
 * ce qu'un relecteur croira possible.
 *
 * ⚠️ ET LA LISTE SUIT LE COMPTE. Changer de compte change les sites proposés ;
 * si le site courant n'est plus atteignable, on bascule sur le premier de la
 * nouvelle liste — sinon le panneau garderait un couple que le produit refuse.
 */
async function chargerLesEtablissements(compteId: string): Promise<void> {
  const resultat = await fournisseur().comptes.etablissementsDe(compteId)
  if (!resultat.ok) return
  etablissementsDisponibles.value = resultat.valeur.map((etablissement) => ({
    valeur: etablissement.id,
    libelle: etablissement.nom,
  }))
}

await chargerLesEtablissements(reglages.value.compteActif)

/**
 * LE TROISIÈME ÉTAT — **la portée « tous »**, choisie ici comme au sélecteur.
 *
 * ⚠️ SANS ELLE, LA QUATRIÈME VARIANTE DE `R1` N'EST PAS ATTEIGNABLE DEPUIS
 * L'INSTRUMENT. Le panneau est ce par quoi un relecteur obtient les quatre
 * accueils sans recompiler : s'il ne propose que des établissements, la vue
 * d'ensemble du propriétaire reste une promesse. **Elle n'apparaît qu'à qui a
 * plusieurs sites** — la proposer sur une seule maison serait une vue
 * d'ensemble sur rien.
 */
const PORTEE_TOUS = '__tous__'

const porteesDisponibles = computed(() =>
  etablissementsDisponibles.value.length > 1
    ? [
        ...etablissementsDisponibles.value,
        { valeur: PORTEE_TOUS, libelle: t('contexte.tousLesSites', { n: etablissementsDisponibles.value.length }) },
      ]
    : etablissementsDisponibles.value,
)

/**
 * ⚠️ SOUS LA PORTÉE « TOUS », AUCUNE PERMISSION N'EST PORTÉE — donc aucune
 * surface qui modifie une caisse n'existe (FR-019). Ce n'est pas une
 * restriction ajoutée : c'est l'absence de droits, par le même filtrage que
 * partout ailleurs.
 */
async function appliquerPorteeTous(compteId: string): Promise<void> {
  await definir(contexteVueDEnsemble(compteId))
}

/**
 * ⚠️ **UN COMPTE SANS AUCUN SITE SE CHOISIT AUSSI** (FR-024). Le panneau
 * laissait AUPARAVANT la session sur le compte précédent : `etablissementsDe`
 * rendant une liste vide, il n'y avait aucune cible, et la fonction rendait la
 * main sans rien poser. On choisissait l'administrateur éditeur, et l'en-tête
 * continuait d'afficher Adjoua — l'instrument mentait sur ce qu'il avait fait.
 */
async function appliquerSansEtablissement(compteId: string): Promise<void> {
  await definir(contexteSansEtablissement(compteId))
}

/**
 * ⚠️ CHANGER LE COMPTE OU L'ÉTABLISSEMENT RECALCULE LES PERMISSIONS. Elles sont
 * l'UNION de celles des rôles du compte SUR CET ÉTABLISSEMENT — jamais une
 * liste figée.
 */
async function appliquerContexte(compteId: string, etablissementId: string): Promise<void> {
  // ⚠️ LE POSTE ET LES MODULES SONT DÉRIVÉS ICI AUSSI, ET PAS SEULEMENT À
  // L'ENTRÉE — par la fonction que les trois chemins partagent. Le panneau est ce
  // par quoi on choisit un contexte en phase 2 : s'il posait un poste nul,
  // l'en-tête n'afficherait jamais sa forme longue depuis l'instrument —
  // c'est-à-dire jamais pendant une démonstration.
  await definir(await resoudreContexte(compteId, etablissementId))
}

/**
 * ⚠️ LE CONTEXTE SE RÉSOUT AU CHARGEMENT, PAS SEULEMENT AU CHANGEMENT — ET CE
 * N'EST PAS UNE PRÉCAUTION. Sur un appareil neuf, les réglages portent déjà un
 * compte et un établissement, alors que la SESSION est vide : les permissions
 * n'étaient donc résolues QUE si l'on changeait le sélecteur. La surface des
 * actions montrait son état vide à une gérante qui a huit droits, et le panneau
 * affichait son nom pendant ce temps. **Constaté en déroulant le pas 9 du
 * quickstart** — aucun test de composant ne l'aurait vu.
 */
if (
  session.value.compteId !== reglages.value.compteActif ||
  etablissementDe(session.value) !== reglages.value.etablissementActif
) {
  if (etablissementsDisponibles.value.length === 0) {
    await appliquerSansEtablissement(reglages.value.compteActif)
  } else if (reglages.value.etablissementActif === PORTEE_TOUS) {
    await appliquerPorteeTous(reglages.value.compteActif)
  } else {
    await appliquerContexte(reglages.value.compteActif, reglages.value.etablissementActif)
  }
}

const compteActif = computed({
  get: () => reglages.value.compteActif,
  set: (valeur: string) => {
    void regler('compteActif', valeur)
    void (async () => {
      await chargerLesEtablissements(valeur)
      // Le site courant peut ne plus être atteignable par ce compte : on prend
      // le premier qu'il peut voir, plutôt que de garder un couple impossible.
      const courant = etablissementsDisponibles.value.find(
        (e) => e.valeur === reglages.value.etablissementActif,
      )
      const cible = courant?.valeur ?? etablissementsDisponibles.value[0]?.valeur
      // ⚠️ AUCUN SITE N'EST UN CAS DU MODÈLE, PAS UNE IMPASSE (FR-024) : le
      // contexte se pose quand même, sans établissement, et `R1` dit ce qui
      // manque. Rendre la main ici laissait la session sur le compte précédent.
      if (cible === undefined) {
        await appliquerSansEtablissement(valeur)
        return
      }
      if (cible !== reglages.value.etablissementActif) await regler('etablissementActif', cible)
      await appliquerContexte(valeur, cible)
    })()
  },
})

const etablissementActif = computed({
  get: () => reglages.value.etablissementActif,
  set: (valeur: string) => {
    void regler('etablissementActif', valeur)
    if (valeur === PORTEE_TOUS) void appliquerPorteeTous(reglages.value.compteActif)
    else void appliquerContexte(reglages.value.compteActif, valeur)
  },
})

/** Le levier d'essai d'écriture · composant 12, quatre classes. */
const OPERATIONS_ESSAI: Readonly<Record<ClasseHorsLigne, string>> = {
  A: 'note_etablissement',
  B: 'encaissement_especes',
  C: 'etablissement',
  D: 'certification_fne',
}
/**
 * ⚠️ LES OPTIONS NOMMENT L'OPÉRATION, JAMAIS LA CLASSE. La lettre A/B/C/D est
 * une mécanique interne — le lexique la proscrit du visible (D-04). On choisit
 * « une note interne » ou « un encaissement », pas « une classe B ».
 */
const LIBELLES_ESSAI: Readonly<Record<ClasseHorsLigne, string>> = {
  A: 'essai.noteInterne',
  B: 'essai.encaissement',
  C: 'essai.reglage',
  D: 'essai.impots',
}
const OPTIONS_CLASSE: readonly OptionSegment[] = CLASSES_ESSAI.map((classe) => ({
  valeur: classe,
  libelleCle: LIBELLES_ESSAI[classe],
}))
const classeEssai = ref<string>('A')

const refus = ref<{ motifCle: string; alternativeCle: string } | null>(null)
const acceptation = ref<boolean>(false)

async function lancerEssai(): Promise<void> {
  refus.value = null
  acceptation.value = false
  const resultat = await ecrireOuRefuser(OPERATIONS_ESSAI[classeEssai.value as ClasseHorsLigne])
  if (resultat.accepte) acceptation.value = true
  else refus.value = { motifCle: resultat.motifCle, alternativeCle: resultat.alternativeCle }
}

const absences = capacitesAbsentes()

/**
 * LE LEVIER DE VERSION NOUVELLE — le septième, et le seul moyen d'exercer
 * FR-017 sans déployer.
 *
 * ⚠️ LA VOIE D'INSTALLATION EST AFFICHÉE, JAMAIS RÉGLÉE. Elle vient du moteur :
 * la simuler laisserait croire qu'on a vérifié le parcours de WebKit depuis
 * Chromium, ce qui est faux. On la LIT, et le bandeau du gabarit la rend.
 */
const { versionEnAttente, annoncerVersionEnAttente } = useCoquille()
const { voie: voieInstallation } = useInstallation()

const versionNouvelle = computed({
  get: () => (versionEnAttente.value ? 'oui' : 'non'),
  set: (valeur: string) => annoncerVersionEnAttente(valeur === 'oui'),
})

const VOIES: Readonly<Record<string, string>> = {
  INVITE: 'scenarios.voieInvite',
  MENU_DE_PARTAGE: 'scenarios.voieMenuDePartage',
  DEJA_INSTALLEE: 'scenarios.voieDejaInstallee',
  IMPOSSIBLE: 'scenarios.voieImpossible',
}

/** L'état interne du témoin — il ne sort pas d'ici. */
const etatTemoin = computed(() => {
  if (reglages.value.horsLigne) return 'horsLigne' as const
  if (reglages.value.latenceMs >= 3000) return 'degrade' as const
  return 'connecte' as const
})
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-280 flex-col gap-6 px-6 py-5.5"
    data-ecran="scenarios"
    data-zone="charme"
  >
    <div class="flex flex-col gap-1.5">
      <h1 class="font-titre text-titre-m font-semibold text-ink">
        {{ $t('scenarios.titre') }}
      </h1>
      <p class="max-w-[80ch] text-corps text-ink-2">
        {{ $t('scenarios.intro') }}
      </p>
    </div>

    <!-- Les cinq leviers -->
    <section class="grid gap-5 rounded-xl border border-line bg-surf p-4 md:grid-cols-2">
      <ChampSaisie
        v-model="latence"
        etiquette-cle="scenarios.latence"
        aide-cle="scenarios.latenceAide"
        type="number"
        data-levier="latence"
      />
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">{{ $t('scenarios.echecReseau') }}</span>
        <SelecteurSegmente
          v-model="echecReseau"
          :options="OPTIONS_BOOLEEN"
          data-levier="echec-reseau"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">{{ $t('scenarios.horsLigne') }}</span>
        <SelecteurSegmente
          v-model="horsLigne"
          :options="OPTIONS_BOOLEEN"
          data-levier="hors-ligne"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">{{ $t('scenarios.jeuVide') }}</span>
        <SelecteurSegmente
          v-model="jeuVide"
          :options="OPTIONS_BOOLEEN"
          data-levier="jeu-vide"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">{{ $t('scenarios.casDuJeu') }}</span>
        <SelecteurSegmente
          v-model="casDuJeu"
          :options="OPTIONS_CAS"
          data-levier="cas-du-jeu"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">{{ $t('scenarios.conflitAuTap') }}</span>
        <SelecteurSegmente
          v-model="conflitAuTap"
          :options="OPTIONS_BOOLEEN"
          data-levier="conflit-au-tap"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">{{ $t('scenarios.issueEnvoiFiscal') }}</span>
        <SelecteurSegmente
          v-model="issueEnvoiFiscal"
          :options="OPTIONS_ISSUE"
          data-levier="issue-envoi"
        />
      </div>
      <ChampSaisie
        v-model="deriveHorloge"
        etiquette-cle="scenarios.deriveHorloge"
        aide-cle="scenarios.deriveHorlogeAide"
        type="number"
        data-levier="derive-horloge"
      />
      <ChampSaisie
        v-model="compteActif"
        etiquette-cle="scenarios.compteActif"
        :options="comptesDisponibles"
        data-levier="compte"
      />
      <!-- ⚠️ **ABSENT, JAMAIS UNE LISTE VIDE.** Un compte sans aucun site —
           l'administrateur éditeur — n'a rien à choisir : un sélecteur vide
           serait une porte fermée, et le principe 8 les interdit partout
           ailleurs. À sa place, la phrase qui dit ce qu'il en est. -->
      <ChampSaisie
        v-if="porteesDisponibles.length > 0"
        v-model="etablissementActif"
        etiquette-cle="scenarios.etablissementActif"
        :options="porteesDisponibles"
        data-levier="etablissement"
      />
      <div
        v-else
        class="flex flex-col gap-1.5"
        data-sans-etablissement
      >
        <span class="text-etiquette uppercase text-ink-3">
          {{ $t('scenarios.etablissementActif') }}
        </span>
        <p class="text-corps text-ink-2">
          {{ $t('scenarios.aucunEtablissement') }}
        </p>
      </div>
      <div class="flex items-end gap-3.5 md:col-span-2">
        <TemoinSynchronisation
          :etat="etatTemoin"
          :en-attente="enAttente"
        />
        <span class="flex-1" />
        <BoutonSecondaire
          libelle-cle="scenarios.remettre"
          neutre
          @activer="toutRemettre()"
        />
      </div>
    </section>

    <!-- Le levier d'essai d'écriture -->
    <section
      class="flex flex-col gap-4 rounded-xl border border-line bg-surf p-4"
      data-bloc="essai"
    >
      <div class="flex flex-col gap-1.5">
        <h2 class="font-titre text-titre-s font-semibold text-ink">
          {{ $t('scenarios.essaiEcriture') }}
        </h2>
        <p class="max-w-[80ch] text-mini text-ink-3">
          {{ $t('scenarios.essaiEcritureAide') }}
        </p>
      </div>
      <div class="flex flex-wrap items-end gap-3.5">
        <SelecteurSegmente
          v-model="classeEssai"
          :options="OPTIONS_CLASSE"
          etiquette-cle="scenarios.classe"
          data-levier="classe"
        />
        <BoutonPrincipal
          libelle-cle="scenarios.lancer"
          @activer="lancerEssai()"
        />
      </div>

      <!-- ⚠️ LE REFUS PORTE SON VERSANT POSITIF. « Cette action nécessite
           internet » est vrai et inutile seul. Et la LETTRE de la classe
           n'apparaît nulle part. -->
      <BandeauAlerte
        v-if="refus"
        ton="danger"
        :message-cle="refus.motifCle"
        :alternative-cle="refus.alternativeCle"
        data-refus
      />
      <BandeauAlerte
        v-else-if="acceptation"
        ton="succes"
        message-cle="file.acceptee"
        data-acceptation
      />
    </section>

    <!-- La file -->
    <section
      class="flex flex-col gap-3.5"
      data-bloc="file"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        {{ $t('scenarios.fileTitre') }}
      </h2>
      <div class="overflow-hidden rounded-xl border border-line bg-surf">
        <EtatVide
          v-if="elements.length === 0"
          message-cle="scenarios.fileVide"
        />
        <LigneListe
          v-for="element in elements"
          :key="element.id"
          :reference="element.id.slice(0, 8)"
          :libelle="element.operation"
          :sous-titre="element.horodatageClient"
          etat="enAttente"
        />
      </div>
      <div
        v-if="elements.length > 0"
        class="flex justify-end"
      >
        <BoutonSecondaire
          libelle-cle="scenarios.remettre"
          neutre
          @activer="toutVider()"
        />
      </div>
    </section>

    <!-- La coquille : version nouvelle et voie d'installation -->
    <section
      class="grid gap-5 rounded-xl border border-line bg-surf p-4 md:grid-cols-2"
      data-bloc="coquille"
    >
      <div class="flex flex-col gap-1.5 md:col-span-2">
        <h2 class="font-titre text-titre-s font-semibold text-ink">
          {{ $t('scenarios.coquille') }}
        </h2>
        <p class="max-w-[80ch] text-mini text-ink-3">
          {{ $t('scenarios.coquilleAide') }}
        </p>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">
          {{ $t('scenarios.versionNouvelle') }}
        </span>
        <SelecteurSegmente
          v-model="versionNouvelle"
          :options="OPTIONS_BOOLEEN"
          data-levier="version-nouvelle"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-etiquette uppercase text-ink-3">
          {{ $t('scenarios.voieInstallation') }}
        </span>
        <p
          class="text-corps text-ink-2"
          data-voie-installation
        >
          {{ $t(VOIES[voieInstallation] ?? 'scenarios.voieImpossible') }}
        </p>
      </div>
    </section>

    <!-- Les absences de capacité du moteur courant -->
    <section
      class="flex flex-col gap-3.5"
      data-bloc="capacites"
    >
      <h2 class="font-titre text-titre-s font-semibold text-ink">
        {{ $t('scenarios.capacites') }}
      </h2>
      <div class="overflow-hidden rounded-xl border border-line bg-surf">
        <EtatVide
          v-if="absences.length === 0"
          message-cle="scenarios.capacitesAucune"
        />
        <LigneListe
          v-for="absence in absences"
          :key="absence.capacite"
          :reference="absence.moteur.slice(0, 3)"
          :libelle-cle="absence.motifCle"
          :sous-titre-cle="absence.alternativeCle"
        />
      </div>
    </section>

    <p class="text-mini text-ink-3">
      {{ session.compteId }} · {{ session.permissions.length }}
    </p>
  </div>
</template>
