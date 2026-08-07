<script setup lang="ts">
/**
 * `R1` · L'ACCUEIL — **la racine du produit**, et le motif dont onze écrans
 * hériteront.
 *
 * RÉFÉRENCE VISUELLE : cas (a), MAQUETTÉ — quatre états :
 * `docs/design/html/R1-accueil.html` · `-proprietaire` · `-serveuse` ·
 * `-maquis`. On en lit les valeurs, on ne les copie pas.
 * Composants : **05** tuile · **06** carte de chiffre · **07** bandeau ·
 * **08** ligne de liste · **01 · 02 · 03** actions · **04** pastille ·
 * **11** état vide · **13** squelette.
 *
 * ⚠️ **CETTE PAGE N'EST QU'UN ASSEMBLAGE.** Elle ne filtre pas, ne trie pas, ne
 * décide pas où mène une surface : `composerAccueil` retient, les composants de
 * rubrique rendent, `useEcranCible` navigue ou dit. C'est ce qui rend `R1`
 * héritable — un écran qui déciderait lui-même serait un cas particulier que le
 * suivant recopierait de travers.
 *
 * ⚠️ **IL N'Y A AUCUN `if (variante === …)`.** Les quatre accueils maquettés
 * sont le même code rendant des ensembles de surfaces différents. C'est le test
 * de vérité du cycle.
 *
 * ⚠️ **UNE SEULE RACINE, ET C'EST UN ÉLÉMENT.** Jamais un `v-if`/`v-else` de
 * premier niveau : un fragment dont la branche active devient un composant
 * paresseux non résolu a un `el` nul, et Vue lève `TypeError … parentNode` au
 * rendu suivant.
 *
 * ⚠️ **LA REDIRECTION VERS `/_ecrans` A DISPARU.** F1 l'avait posée en disant
 * explicitement « F2 y posera `R1` ». C'est fait : la racine SERT l'accueil.
 */
import BlocDeTete from '~/core/accueil/BlocDeTete.vue'
import CarteARegler from '~/core/accueil/CarteARegler.vue'
import CarteChiffreAccueil from '~/core/accueil/CarteChiffreAccueil.vue'
import GrilleTables from '~/core/accueil/GrilleTables.vue'
import LigneSuite from '~/core/accueil/LigneSuite.vue'
import TuileActivite from '~/core/accueil/TuileActivite.vue'
import { useAccueil, type EtatRubrique } from '~/core/accueil/composerAccueil'
import { useEcranCible } from '~/core/coquille/useEcranCible'
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import { useSession } from '~/core/session/useSession'

definePageMeta({ path: '/' })

const { t } = useI18n()
useHead({ title: () => t('accueil.titre') })

const { session } = useSession()
const { accueil, ecranCibleDe, presentationDe, composer } = useAccueil()
const { resoudre } = useEcranCible()

/** L'écran cible touché et pas encore construit — la mention à afficher. */
const mention = ref<{ titre: string; cycle: string } | null>(null)

/**
 * L'APPUI D'UNE SURFACE — naviguer, ou **dire**.
 *
 * ⚠️ LA SURFACE GARDE L'APPARENCE EXACTE D'UNE SURFACE ABOUTIE : ni
 * atténuation, ni badge, ni `disabled`, ni classe distinctive (SC-014). Un
 * badge « bientôt » réintroduirait le grisé par la porte de derrière.
 *
 * ⚠️ ET LE TITRE COMME LE CYCLE SONT LUS **À L'INDEX DES ÉCRANS**, jamais
 * écrits ici. Passer un écran à `CONSTRUIT` là-bas fait disparaître la mention
 * **sans que cette page soit retouchée** — c'est la propriété qu'on veut, et
 * elle se vérifie.
 */
async function ouvrir(codeEcran: string | null): Promise<void> {
  mention.value = null
  if (codeEcran === null) return
  const cible = resoudre(codeEcran)
  if (cible.etat === 'construit') {
    await navigateTo(cible.route)
    return
  }
  if (cible.etat === 'aVenir') mention.value = { titre: cible.titre, cycle: cible.cycle }
}

/** Les rubriques qui se rendent : tout sauf « absente ». */
function seRend(etat: EtatRubrique): boolean {
  return etat !== 'absente'
}

/**
 * ⚠️ L'ACCUEIL SE RECOMPOSE À CHAQUE CHANGEMENT DE CONTEXTE, ET LES PERMISSIONS
 * EN FONT PARTIE. Regarder le seul établissement laisserait l'écran figé quand
 * on change de compte au panneau Scénarios — et c'est ce qu'on fait vingt fois
 * dans une démonstration.
 */
watch(
  () => [session.value.compteId, session.value.portee, session.value.permissions] as const,
  () => void composer(),
  { immediate: true, deep: true },
)
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-280 flex-col gap-6 px-6 py-5.5"
    data-ecran="R1"
    data-zone="charme"
  >
    <!-- ⚠️ LA MENTION D'UN ÉCRAN À VENIR EST UNE ANNONCE TRANSVERSE, pas une
         marque sur la surface. Elle dit ce qui manque — de NOTRE côté — et
         quand cela viendra. -->
    <BandeauAlerte
      v-if="mention"
      ton="info"
      :message="t('accueil.aVenir', { ecran: mention.titre })"
      :alternative="t('accueil.aVenirCycle', { cycle: mention.cycle })"
      pleine-largeur
      data-mention
    />

    <!-- ── Ce qui attend maintenant ─────────────────────────────────────── -->
    <section
      v-if="seRend(accueil.tete.etat)"
      class="flex flex-col gap-3.5"
      data-rubrique="tete"
      :data-etat="accueil.tete.etat"
    >
      <h1 class="font-titre text-titre-m font-semibold text-ink">
        {{ accueil.tete.titreCle ? $t(accueil.tete.titreCle) : $t('accueil.titre') }}
      </h1>

      <!-- Chargement · composant 13, À LA PLACE ET À LA TAILLE du contenu à
           venir. Un vide qui fait sauter la mise en page est pire qu'une
           attente : l'œil repart de zéro quand le contenu arrive. -->
      <Squelette
        v-if="accueil.tete.etat === 'chargement'"
        variante="carte"
      />
      <BandeauAlerte
        v-else-if="accueil.tete.etat === 'horsLigne'"
        ton="alerte"
        message-cle="accueil.horsLigne"
        alternative-cle="accueil.horsLigneAlternative"
        pleine-largeur
      />
      <BandeauAlerte
        v-else-if="accueil.tete.etat === 'erreur'"
        ton="danger"
        message-cle="accueil.erreur"
        alternative-cle="accueil.erreurAlternative"
        action-cle="accueil.reessayer"
        pleine-largeur
        @agir="composer()"
      />
      <div
        v-else-if="accueil.tete.contenu === null"
        class="overflow-hidden rounded-xl border border-line bg-surf"
      >
        <EtatVide message-cle="accueil.teteVide" />
      </div>
      <BlocDeTete
        v-else
        :tete="accueil.tete.contenu"
        @principale="ouvrir(ecranCibleDe(accueil.tete.contenu.surfaceCle))"
        @secondaire="ouvrir(ecranCibleDe(accueil.tete.contenu.surfaceCle))"
      />
    </section>

    <!-- ── Ensuite, dans l'ordre de l'heure ─────────────────────────────── -->
    <section
      v-if="seRend(accueil.suite.etat)"
      class="flex flex-col gap-3.5"
      data-rubrique="suite"
      :data-etat="accueil.suite.etat"
    >
      <!-- Pas de titre, pas de balise : une rubrique sans surface retenue
           disparaît AVEC son titre, et un `<h2>` vide en serait le reste. -->
      <h2
        v-if="accueil.suite.titreCle"
        class="font-titre text-titre-s font-semibold text-ink"
      >
        {{ $t(accueil.suite.titreCle) }}
      </h2>
      <Squelette
        v-if="accueil.suite.etat === 'chargement'"
        variante="liste"
      />
      <BandeauAlerte
        v-else-if="accueil.suite.etat === 'horsLigne'"
        ton="alerte"
        message-cle="accueil.horsLigne"
        alternative-cle="accueil.horsLigneAlternative"
        pleine-largeur
      />
      <BandeauAlerte
        v-else-if="accueil.suite.etat === 'erreur'"
        ton="danger"
        message-cle="accueil.erreur"
        alternative-cle="accueil.erreurAlternative"
        action-cle="accueil.reessayer"
        pleine-largeur
        @agir="composer()"
      />
      <div
        v-else-if="accueil.suite.etat === 'vide'"
        class="overflow-hidden rounded-xl border border-line bg-surf"
      >
        <EtatVide message-cle="accueil.suiteVide" />
      </div>
      <!-- ⚠️ LA FORME VIENT DE LA SURFACE, PAS D'UNE VARIANTE D'ÉCRAN. Une
           table se touche — grille de tuiles compactes ; une arrivée se lit —
           ligne de liste. Le même code sert les quatre accueils. -->
      <GrilleTables
        v-else-if="presentationDe('suite') === 'grille'"
        :lignes="accueil.suite.contenu"
        @activer="(ligne) => ouvrir(ecranCibleDe(ligne.surfaceCle))"
      />
      <LigneSuite
        v-else
        :lignes="accueil.suite.contenu"
        @activer="(ligne) => ouvrir(ecranCibleDe(ligne.surfaceCle))"
      />
    </section>

    <!-- ── Vos activités · DISPARAÎT AVEC SON TITRE quand il n'y en a qu'une - -->
    <section
      v-if="seRend(accueil.activites.etat)"
      class="flex flex-col gap-3.5"
      data-rubrique="activite"
      :data-etat="accueil.activites.etat"
    >
      <!-- Pas de titre, pas de balise : une rubrique sans surface retenue
           disparaît AVEC son titre, et un `<h2>` vide en serait le reste. -->
      <h2
        v-if="accueil.activites.titreCle"
        class="font-titre text-titre-s font-semibold text-ink"
      >
        {{ $t(accueil.activites.titreCle) }}
      </h2>
      <Squelette
        v-if="accueil.activites.etat === 'chargement'"
        variante="carte"
      />
      <BandeauAlerte
        v-else-if="accueil.activites.etat === 'horsLigne'"
        ton="alerte"
        message-cle="accueil.horsLigne"
        alternative-cle="accueil.horsLigneAlternative"
        pleine-largeur
      />
      <BandeauAlerte
        v-else-if="accueil.activites.etat === 'erreur'"
        ton="danger"
        message-cle="accueil.erreur"
        alternative-cle="accueil.erreurAlternative"
        action-cle="accueil.reessayer"
        pleine-largeur
        @agir="composer()"
      />
      <TuileActivite
        v-else
        :activites="accueil.activites.contenu"
        @activer="(activite) => ouvrir(ecranCibleDe(activite.surfaceCle))"
      />
    </section>

    <!-- ── À régler ─────────────────────────────────────────────────────── -->
    <section
      v-if="seRend(accueil.aRegler.etat)"
      class="flex flex-col gap-3.5"
      data-rubrique="aRegler"
      :data-etat="accueil.aRegler.etat"
    >
      <!-- Pas de titre, pas de balise : une rubrique sans surface retenue
           disparaît AVEC son titre, et un `<h2>` vide en serait le reste. -->
      <h2
        v-if="accueil.aRegler.titreCle"
        class="font-titre text-titre-s font-semibold text-ink"
      >
        {{ $t(accueil.aRegler.titreCle) }}
      </h2>
      <Squelette
        v-if="accueil.aRegler.etat === 'chargement'"
        variante="liste"
      />
      <BandeauAlerte
        v-else-if="accueil.aRegler.etat === 'horsLigne'"
        ton="alerte"
        message-cle="accueil.horsLigne"
        alternative-cle="accueil.horsLigneAlternative"
        pleine-largeur
      />
      <BandeauAlerte
        v-else-if="accueil.aRegler.etat === 'erreur'"
        ton="danger"
        message-cle="accueil.erreur"
        alternative-cle="accueil.erreurAlternative"
        action-cle="accueil.reessayer"
        pleine-largeur
        @agir="composer()"
      />
      <div
        v-else-if="accueil.aRegler.etat === 'vide'"
        class="overflow-hidden rounded-xl border border-line bg-surf"
      >
        <!-- Rien à régler est une BONNE nouvelle, et l'écran le dit — un cadre
             nu se lirait comme une panne de chargement. -->
        <EtatVide message-cle="accueil.aReglerVide" />
      </div>
      <CarteARegler
        v-else
        :cartes="accueil.aRegler.contenu"
        @agir="(carte) => ouvrir(ecranCibleDe(carte.surfaceCle))"
      />
    </section>

    <!-- ── Les chiffres ─────────────────────────────────────────────────── -->
    <section
      v-if="seRend(accueil.chiffres.etat)"
      class="flex flex-col gap-3.5"
      data-rubrique="chiffre"
      :data-etat="accueil.chiffres.etat"
    >
      <!-- Pas de titre, pas de balise : une rubrique sans surface retenue
           disparaît AVEC son titre, et un `<h2>` vide en serait le reste. -->
      <h2
        v-if="accueil.chiffres.titreCle"
        class="font-titre text-titre-s font-semibold text-ink"
      >
        {{ $t(accueil.chiffres.titreCle) }}
      </h2>
      <Squelette
        v-if="accueil.chiffres.etat === 'chargement'"
        variante="carte"
      />
      <BandeauAlerte
        v-else-if="accueil.chiffres.etat === 'horsLigne'"
        ton="alerte"
        message-cle="accueil.horsLigne"
        alternative-cle="accueil.horsLigneAlternative"
        pleine-largeur
      />
      <BandeauAlerte
        v-else-if="accueil.chiffres.etat === 'erreur'"
        ton="danger"
        message-cle="accueil.erreur"
        alternative-cle="accueil.erreurAlternative"
        action-cle="accueil.reessayer"
        pleine-largeur
        @agir="composer()"
      />
      <div
        v-else-if="accueil.chiffres.etat === 'vide'"
        class="overflow-hidden rounded-xl border border-line bg-surf"
      >
        <EtatVide message-cle="accueil.chiffresVide" />
      </div>
      <CarteChiffreAccueil
        v-else
        :chiffres="accueil.chiffres.contenu"
      />
    </section>
  </div>
</template>
