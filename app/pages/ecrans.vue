<script setup lang="ts">
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import LigneListe from '~/core/design-system/LigneListe.vue'
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import SelecteurSegmente, {
  type OptionSegment,
} from '~/core/design-system/SelecteurSegmente.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import TuileAction from '~/core/design-system/TuileAction.vue'
import { fournisseur } from '~/core/donnees/fournisseur'
import { ECRANS_PRODUIT, INSTRUMENTS, type EntreeEcran } from '~/core/ecrans/index'
import { registreDesCapacites } from '~/core/plateforme/capacites'
import { ACTIONS_DE_LA_COQUILLE, type ActionDeLaCoquille } from '~/core/session/actions'
import { useAutorisation } from '~/core/session/useAutorisation'
import { etablissementDe, useSession } from '~/core/session/useSession'

/**
 * L'INDEX DES ÉCRANS — la page par laquelle le produit se regarde.
 *
 * RÉFÉRENCE VISUELLE : cas (c), COMPOSÉ — motif de liste posé par `G5`. Zone de
 * charme. Composants : 08 ligne de liste · 04 pastille d'état · 12 sélecteur
 * segmenté.
 *
 * ⚠️ ELLE REND `app/core/ecrans/index.ts`, ET LA PORTE P-04 LIT LE MÊME MODULE.
 * Une seule source : il n'y a pas de seconde liste, donc rien qui puisse
 * diverger.
 *
 * ⚠️ DEUX SECTIONS, ET ELLES NE SE MÉLANGENT PAS. Les 46 écrans du PRODUIT
 * portent un code ; les instruments n'en portent pas et n'entrent pas au
 * décompte. Confondre les deux ferait croire que le produit a 49 écrans.
 *
 * ⚠️ LE NOM DU FICHIER NE PORTE PAS LE TRAIT BAS, LA ROUTE SI — la route est
 * écrite, donc indépendante de toute sémantique de scanner (research.md §4.2).
 */
definePageMeta({ path: '/_ecrans' })

const { t } = useI18n()
useHead({ title: () => t('ecrans.titre') })

const SECTIONS: readonly OptionSegment[] = [
  { valeur: 'produit', libelleCle: 'ecrans.leProduit', compteur: ECRANS_PRODUIT.length },
  { valeur: 'instruments', libelleCle: 'ecrans.lesInstruments', compteur: INSTRUMENTS.length },
  { valeur: 'actions', libelleCle: 'ecrans.lesActions' },
]
const section = ref('produit')

const entrees = computed<readonly EntreeEcran[]>(() =>
  section.value === 'produit' ? ECRANS_PRODUIT : INSTRUMENTS,
)

/**
 * LA TROISIÈME SECTION — **ce que ce compte peut faire ICI**.
 *
 * ⚠️ C'EST LA SEULE SURFACE DE CE CYCLE QUI LIT DES DONNÉES DE DOMAINE, et c'est
 * pour cela qu'elle porte **les quatre états** : vide, chargement, erreur, hors
 * ligne. Un état qui n'existe sur aucun écran n'est pas un état livré — c'est un
 * composant montré au guide de style.
 *
 * ⚠️ UNE ACTION NON PERMISE N'EST PAS RENDUE. Ni grisée, ni `disabled` : elle
 * n'entre pas dans le HTML. Le test le vérifie sur le rendu, pas sur un attribut.
 *
 * ⚠️ ET UNE ACTION DE SERVICE INACTIF NON PLUS. Sur « Résidence Test », qui n'a
 * que l'hébergement, les actions de restauration disparaissent même pour qui en
 * a le droit — c'est le pendant en phase 2 du test d'agnosticité ETB-02c.
 */
type EtatSurface = 'chargement' | 'pret' | 'vide' | 'horsLigne' | 'erreur'

const { session } = useSession()
const { definirModulesActifs, retenir } = useAutorisation()

const etat = ref<EtatSurface>('chargement')
const actionsAutorisees = ref<readonly ActionDeLaCoquille[]>([])

async function chargerLesActions(): Promise<void> {
  // ⚠️ SOUS LA PORTÉE « TOUS », ON NE LIT PAS. Une lecture paramétrée par
  // l'établissement n'a pas de sens sur une vue d'ensemble, et `etablissementDe`
  // rend `null` dans ce cas comme dans celui d'un choix absent : les deux se
  // traitent pareil ICI. Ce qui les distingue — ce que l'en-tête affirme, ce que
  // l'accueil compose — lit `portee` directement.
  const etablissementId = etablissementDe(session.value)
  if (etablissementId === null) {
    etat.value = 'vide'
    actionsAutorisees.value = []
    return
  }

  etat.value = 'chargement'
  const resultat = await fournisseur().etablissements.listerModulesActifs({ etablissementId })

  if (!resultat.ok) {
    // ⚠️ HORS LIGNE ET ÉCHEC RÉSEAU NE SE DISENT PAS PAREIL. Le premier est un
    // fait sur lequel l'utilisateur peut agir — attendre, se déplacer ; le
    // second est une panne qu'on réessaie. Les confondre ferait proposer
    // « Réessayer » à quelqu'un qui n'a pas de réseau.
    etat.value = resultat.echec.code === 'HORS_LIGNE' ? 'horsLigne' : 'erreur'
    actionsAutorisees.value = []
    return
  }

  definirModulesActifs(resultat.valeur)
  actionsAutorisees.value = retenir(ACTIONS_DE_LA_COQUILLE)
  etat.value = actionsAutorisees.value.length === 0 ? 'vide' : 'pret'
}

/**
 * L'ANNONCE D'UNE CAPACITÉ ABSENTE — **AVANT la tentative, jamais après un
 * échec** (FR-055).
 *
 * ⚠️ ELLE NE RETIRE PAS L'ACTION, ET C'EST LA DIFFÉRENCE AVEC LE RBAC. Une
 * action non permise est **interdite** : elle disparaît. Une capacité absente ne
 * rend rien interdit — encaisser reste possible sans imprimante, c'est le
 * TICKET qui part ailleurs. Retirer le geste ferait perdre la vente.
 *
 * ⚠️ UNE SEULE ANNONCE À LA FOIS. `composants.md` §07 : jamais deux bandeaux
 * empilés. Sur WebKit, trois capacités manquent aux actions affichées ; les
 * énumérer ferait lire la première et aucune autre. Le panneau Scénarios porte
 * la liste complète, c'est son rôle d'instrument.
 */
const absenceAAnnoncer = computed(() => {
  if (etat.value !== 'pret') return null
  const registre = registreDesCapacites()
  for (const action of actionsAutorisees.value) {
    if (action.capaciteRequise === null) continue
    const absence = registre.indisponibilite(action.capaciteRequise)
    if (absence !== null) return absence
  }
  return null
})

// Le compte ou l'établissement change au panneau Scénarios : la surface suit,
// sans rechargement. C'est ce qui rend le pas 9 du quickstart observable.
watch(
  () => [session.value.compteId, session.value.portee, session.value.permissions] as const,
  () => void chargerLesActions(),
  { immediate: true, deep: true },
)

const construits = computed(
  () => ECRANS_PRODUIT.filter((e) => e.avancement === 'CONSTRUIT').length,
)

/** Le titre d'un instrument est une clé ; celui d'un écran du produit non. */
function titreDe(entree: EntreeEcran): string {
  return entree.cas === 'instrument' ? t(entree.titre) : entree.titre
}

/** ⚠️ LE CODE QUAND IL EXISTE, LA ROUTE SINON. Deux composés n'ont pas de code. */
function referenceDe(entree: EntreeEcran): string {
  return entree.code ?? (entree.route ?? '—')
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-280 flex-col gap-5.5 px-6 py-5.5"
    data-ecran="ecrans"
    data-zone="charme"
  >
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1.5">
        <h1 class="font-titre text-titre-m font-semibold text-ink">
          {{ $t('ecrans.titre') }}
        </h1>
        <p class="text-mini text-ink-3">
          {{ $t('ecrans.decompte', { construits, total: ECRANS_PRODUIT.length }) }}
        </p>
      </div>
      <SelecteurSegmente
        v-model="section"
        :options="SECTIONS"
        data-reglage="section"
      />
    </header>

    <!-- ⚠️ LES QUATRE ÉTATS, SUR UNE SURFACE QUI LIT VRAIMENT DES DONNÉES.
         Ils s'obtiennent depuis le panneau Scénarios : latence → squelette,
         échec réseau → erreur, hors ligne → son propre bandeau, jeu vide ou
         compte sans droit ici → état vide. -->
    <div
      v-if="section === 'actions'"
      class="flex flex-col gap-4"
      data-bloc="actions"
      :data-etat="etat"
    >
      <!-- Chargement · composant 13, À LA FORME DU CONTENU À VENIR. La roue est
           réservée à une attente réseau indéterminée, et ce n'en est pas une. -->
      <Squelette
        v-if="etat === 'chargement'"
        variante="carte"
      />

      <!-- Hors ligne · le refus se dit AVANT, et il porte son versant positif. -->
      <BandeauAlerte
        v-else-if="etat === 'horsLigne'"
        ton="alerte"
        message-cle="ecrans.actionsHorsLigne"
        alternative-cle="ecrans.actionsHorsLigneAlternative"
        pleine-largeur
      />

      <!-- Erreur · ce qui s'est passé, et l'action suivante. Jamais deux
           bandeaux empilés : celui-ci et le précédent s'excluent. -->
      <BandeauAlerte
        v-else-if="etat === 'erreur'"
        ton="danger"
        message-cle="ecrans.actionsErreur"
        alternative-cle="ecrans.actionsErreurAlternative"
        action-cle="ecrans.reessayer"
        pleine-largeur
        @agir="chargerLesActions()"
      />

      <!-- Vide · le motif ocre, la phrase qui dit ce qui apparaîtra, l'action
           qui démarre. Un écran vide sans porte de sortie est une impasse. -->
      <div
        v-else-if="etat === 'vide'"
        class="overflow-hidden rounded-xl border border-line bg-surf"
      >
        <EtatVide
          message-cle="ecrans.actionsVide"
          action-cle="ecrans.actionsVideAction"
          @demarrer="navigateTo('/_scenarios')"
        />
      </div>

      <template v-else>
        <!-- ⚠️ L'ANNONCE VIENT AVANT LES TUILES, ET C'EST L'ORDRE QUI PORTE
             L'EXIGENCE : « l'interface l'annonce AVANT la tentative ». Sous les
             tuiles, elle se lirait après le clic. -->
        <BandeauAlerte
          v-if="absenceAAnnoncer"
          ton="info"
          message-cle="ecrans.capaciteAbsente"
          :alternative-cle="absenceAAnnoncer.alternativeCle"
          pleine-largeur
          :data-capacite-absente="absenceAAnnoncer.capacite"
        />
        <div class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <TuileAction
            v-for="action in actionsAutorisees"
            :key="action.permission"
            :libelle-cle="action.libelleCle"
            :icone="action.icone"
            :data-action="action.permission"
          />
        </div>
      </template>
    </div>

    <div
      v-else
      class="overflow-hidden rounded-xl border border-line bg-surf shadow-basse"
      data-bloc="index"
    >
      <LigneListe
        v-for="entree in entrees"
        :key="referenceDe(entree)"
        :reference="referenceDe(entree)"
        :libelle="titreDe(entree)"
        :sous-titre="entree.reference"
        :vers="entree.route ?? undefined"
        :data-avancement="entree.avancement"
      >
        <template #fin>
          <!-- ⚠️ L'ÉTAT PORTE UNE FORME, PAS SEULEMENT UNE COULEUR : losange
               pour ce qui est acquis, cercle vide pour ce qui n'est pas
               commencé. En niveaux de gris, les deux restent distincts. -->
          <PastilleEtat
            :etat="entree.avancement === 'CONSTRUIT' ? 'acquis' : 'horsLigne'"
            :libelle-cle="
              entree.avancement === 'CONSTRUIT' ? 'ecrans.construit' : 'ecrans.pasCommence'
            "
          />
        </template>
      </LigneListe>
    </div>
  </div>
</template>
