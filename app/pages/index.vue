<script setup lang="ts">
/**
 * `R1` · L'ACCUEIL — **la racine du produit**, et le motif dont onze écrans
 * hériteront.
 *
 * RÉFÉRENCE VISUELLE : cas (a), MAQUETTÉ — quatre états :
 * `docs/design/html/R1-accueil.html` · `-proprietaire` · `-serveuse` ·
 * `-maquis`. On en lit les valeurs, on ne les copie pas.
 * Composants : **05** tuile · **06** carte de chiffre · **03** bouton discret ·
 * **01** bouton principal · **04** pastille · **11** état vide · **13** squelette.
 *
 * ⚠️ **LES DEUX COLONNES SONT L'OSSATURE, PAS UNE MISE EN FORME.** Les quatre
 * maquettes posent la MÊME : un corps `flex items-stretch min-h-184`, une
 * colonne principale élastique — ce qui attend, ce qui vient ensuite, les
 * activités — et une colonne latérale de `w-84` en `bg-surf` — ce qui est à
 * régler, et les chiffres. Le partage n'est pas décoratif : **à gauche ce qu'on
 * FAIT, à droite ce qu'on SURVEILLE**. Tout empiler en une colonne, comme la
 * première version le faisait, mêle les deux et fait descendre les chiffres du
 * jour sous cinq tuiles de service.
 *
 * ⚠️ **`w-full` SUR LA RACINE, ET CE N'EST PAS REDONDANT.** La page est un
 * enfant flex du `<main>` : sans largeur imposée, un enfant flex se dimensionne
 * sur son CONTENU, et la colonne latérale s'arrête là où le texte s'arrête —
 * au milieu de l'écran, pas au bord. **Constaté sur une capture** : la même
 * page rendait sa colonne à des largeurs différentes selon la variante, parce
 * que la variante décidait de la longueur du contenu. Une barre latérale dont
 * la position dépend du contenu n'est pas une barre latérale.
 *
 * ⚠️ **L'ÉCRAN REMPLIT LA FENÊTRE ET NE LA DÉPASSE PAS** — `h-full` et
 * `overflow-hidden` sur la racine, `overflow-y-auto` sur chaque colonne. C'est
 * ce qui permet aux deux de défiler **chacune de son côté** : à gauche ce qu'on
 * fait, et qui peut être long ; à droite ce qu'on surveille, et qui doit rester
 * sous les yeux **pendant** qu'on travaille à gauche. Tant que le document
 * défilait d'un bloc, descendre dans la salle du maquis faisait sortir de
 * l'écran la caisse du soir et les ardoises. `min-h-0` accompagne chaque
 * colonne : un item flex refuse sinon de descendre sous la hauteur de son
 * contenu, et c'est la page entière qui déborderait.
 *
 * ⚠️ **« VOS ACTIVITÉS » FLOTTE, ELLE NE DÉFILE PLUS.** Elle est posée en
 * position absolue au bas de la colonne principale, sur un dégradé qui monte du
 * fond vers le transparent — le dégradé n'est pas décoratif, il dit que la liste
 * **continue dessous** ; sans lui, la barre coupe net et l'on croit avoir fini.
 * La colonne latérale, elle, garde son ressort `<span class="flex-1" />` : sa
 * note de pied se colle au bas, comme sur les quatre maquettes.
 *
 * ⚠️ ET LA BARRE SE REPLIE — un service en cours prend alors toute la hauteur.
 * Le contenu défilant porte une **réserve** de bas de colonne dont la hauteur
 * suit l'état de la barre : sans elle, la dernière carte finirait dessous, vue
 * et inatteignable.
 *
 * ⚠️ **CETTE PAGE N'EST QU'UN ASSEMBLAGE.** Elle ne filtre pas, ne trie pas, ne
 * décide pas où mène une surface : `composerAccueil` retient, les composants de
 * rubrique rendent, `useEcranCible` navigue ou dit.
 *
 * ⚠️ **IL N'Y A AUCUN `if (variante === …)`.** Les quatre accueils maquettés
 * sont le même code rendant des ensembles de surfaces différents — jusqu'à la
 * ZONE DE MOUVEMENT, qui est déclarée par la surface de tête et non branchée sur
 * un nom de compte.
 *
 * ⚠️ **UNE SEULE RACINE, ET C'EST UN ÉLÉMENT.** Jamais un `v-if`/`v-else` de
 * premier niveau : un fragment dont la branche active devient un composant
 * paresseux non résolu a un `el` nul, et Vue lève `TypeError … parentNode`.
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
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import { useSession } from '~/core/session/useSession'

definePageMeta({ path: '/' })

const { t } = useI18n()
useHead({ title: () => t('accueil.titre') })

const { session } = useSession()
const { accueil, ecranCibleDe, presentationDe, zone, composer } = useAccueil()
const { resoudre } = useEcranCible()

/** L'écran cible touché et pas encore construit — la mention à afficher. */
const mention = ref<{ titre: string; cycle: string } | null>(null)

/**
 * LA BARRE « VOS ACTIVITÉS » EST-ELLE DÉPLIÉE.
 *
 * ⚠️ **DÉPLIÉE PAR DÉFAUT, ET REPLIABLE À LA MAIN.** Les activités sont ce par
 * quoi on change de service : les cacher d'entrée obligerait à découvrir un
 * bouton pour retrouver le pressing. Ce qu'on offre, c'est de **rendre l'écran
 * quand on travaille dans la liste** — un service en cours prend toute la
 * hauteur, et la barre s'efface le temps qu'il faut.
 *
 * ⚠️ ET L'ÉTAT NE SURVIT PAS AU RECHARGEMENT, délibérément : ce n'est pas un
 * réglage d'appareil comme le thème, c'est un geste du moment. Le persister
 * ferait rouvrir l'application sur des activités repliées trois jours plus tard,
 * sans que personne se souvienne les avoir repliées.
 */
const activitesOuvertes = ref(true)

/**
 * L'APPUI D'UNE SURFACE — naviguer, ou **dire**.
 *
 * ⚠️ LA SURFACE GARDE L'APPARENCE EXACTE D'UNE SURFACE ABOUTIE : ni
 * atténuation, ni badge, ni `disabled`, ni classe distinctive (SC-014). Un
 * badge « bientôt » réintroduirait le grisé par la porte de derrière.
 *
 * ⚠️ ET LE TITRE COMME LE CYCLE SONT LUS **À L'INDEX DES ÉCRANS**, jamais
 * écrits ici. Passer un écran à `CONSTRUIT` là-bas fait disparaître la mention
 * **sans que cette page soit retouchée**.
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
    class="flex h-full w-full items-stretch overflow-hidden"
    data-ecran="R1"
    :data-zone="zone"
    :data-repli="accueil.repli ?? undefined"
  >
    <!-- ⚠️ **UN COMPTE SANS AUCUN ÉTABLISSEMENT VOIT UN ACCUEIL QUI LE DIT**
         (FR-024) — jamais un écran vide, jamais une erreur. Il n'y a rien à
         composer : aucun site sur lequel lire. Cinq cadres vides se liraient
         comme une panne de chargement, et un bandeau rouge comme un défaut ;
         ce qui manque est un RATTACHEMENT, et la phrase le dit.
         ⚠️ ET L'ÉCRAN N'A PAS DEUX COLONNES ICI : une colonne latérale sans
         rien à surveiller est un reste de mise en page. Ce qui a un sens sans
         site reste atteignable — l'en-tête porte l'identité, « Passer la
         main », le thème et la langue. -->
    <div
      v-if="accueil.repli === 'sansEtablissement'"
      class="flex min-w-0 flex-1 flex-col justify-center px-6 py-5.5"
      data-bloc="sansEtablissement"
    >
      <h1 class="sr-only">
        {{ $t('accueil.titre') }}
      </h1>
      <div class="mx-auto w-full max-w-140 overflow-hidden rounded-xl border border-line bg-surf">
        <EtatVide message-cle="accueil.sansEtablissement" />
      </div>
    </div>

    <!-- ── LA COLONNE PRINCIPALE · ce qu'on FAIT ─────────────────────────── -->
    <!-- ⚠️ DEUX NIVEAUX, ET C'EST CE QUI PERMET À LA BARRE DE FLOTTER : le
         conteneur tient la hauteur et ne défile pas ; l'enfant défile ; la barre
         « Vos activités » se pose PAR-DESSUS, en position absolue. -->
    <div
      v-else
      class="relative flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5.5">
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

        <!-- ── Ce qui attend maintenant ───────────────────────────────────── -->
        <section
          v-if="seRend(accueil.tete.etat)"
          class="flex shrink-0 flex-col"
          data-rubrique="tete"
          :data-etat="accueil.tete.etat"
        >
          <!-- ⚠️ LE TITRE DE L'ÉCRAN EST DANS LE BLOC DE TÊTE, en étiquette. Le
             `<h1>` reste dû à l'accessibilité — il est ici, hors flux visuel,
             et porte le nom de l'écran, pas celui de la rubrique. -->
          <h1 class="sr-only">
            {{ $t('accueil.titre') }}
          </h1>
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
            :titre-cle="accueil.tete.titreCle"
            @principale="ouvrir(ecranCibleDe(accueil.tete.contenu.surfaceCle))"
            @secondaire="ouvrir(ecranCibleDe(accueil.tete.contenu.surfaceCle))"
          />
        </section>

        <!-- ── Ensuite, dans l'ordre de l'heure ───────────────────────────── -->
        <section
          v-if="seRend(accueil.suite.etat)"
          class="flex shrink-0 flex-col gap-2.5"
          data-rubrique="suite"
          :data-etat="accueil.suite.etat"
        >
          <span
            v-if="accueil.suite.titreCle"
            class="text-etiquette uppercase text-ink-3"
          >{{ $t(accueil.suite.titreCle) }}</span>
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
             carte à icône. Le même code sert les quatre accueils. -->
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

        <!-- ⚠️ LA RÉSERVE DE BAS DE COLONNE — un espace vide, et il est
             nécessaire : la barre « Vos activités » flotte AU-DESSUS du contenu,
             donc la dernière carte de la liste finirait sous elle, atteignable
             par personne. Sa hauteur suit l'état de la barre, et elle n'est PAS
             animée : ce qui bouge ici est de la mise en page. -->
        <span
          v-if="seRend(accueil.activites.etat)"
          class="shrink-0"
          :class="activitesOuvertes ? 'h-44' : 'h-16'"
          aria-hidden="true"
        />
      </div>

      <!-- ── Vos activités · LA BARRE FLOTTANTE ────────────────────────────
           ⚠️ **DISPARAÎT AVEC SON TITRE** quand l'établissement n'a qu'une
           activité — c'est la règle de la famille, et elle passe avant la
           barre : au maquis, il n'y a rien à poser en bas de l'écran.

           ⚠️ **LE DÉGRADÉ N'EST PAS UNE DÉCORATION.** Il dit que quelque chose
           continue dessous : sans lui, la barre coupe la liste net et l'on croit
           l'avoir finie. Il monte du fond de page vers le transparent, sur les
           JETONS — jamais une couleur littérale.

           ⚠️ **ET LA ZONE DU DÉGRADÉ NE PREND PAS LES CLICS** : `pointer-events`
           est rendu à la seule partie utile. Une bande transparente qui avale
           les appuis rend inatteignable ce qu'on voit à travers elle. -->
      <section
        v-if="seRend(accueil.activites.etat)"
        class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
        data-rubrique="activite"
        :data-etat="accueil.activites.etat"
        :data-ouvert="activitesOuvertes ? 'oui' : 'non'"
      >
        <!-- ⚠️ **LE VOILE EST UN BLOC À PART, ET IL LE FAUT.** Posé en fond de la
             barre elle-même, sa moitié transparente passait DERRIÈRE le titre :
             « Vos activités » se lisait par-dessus « 5 chambres à nettoyer », et
             les deux devenaient illisibles. **Constaté sur une capture en 560 px
             de haut.** Le voile occupe donc sa propre bande, au-dessus du bloc
             opaque, et rien ne s'écrit dedans. -->
        <span
          class="h-10 shrink-0 bg-linear-to-t from-bg to-transparent"
          aria-hidden="true"
        />
        <div class="pointer-events-auto flex flex-col gap-2.5 bg-bg px-6 pb-5.5">
          <div class="flex items-center justify-between gap-3.5">
            <span
              v-if="accueil.activites.titreCle"
              class="text-etiquette uppercase text-ink-3"
            >{{ $t(accueil.activites.titreCle) }}</span>
            <!-- ⚠️ L'ACTION DIT CE QU'ELLE FAIT, et son état est porté par
                 `aria-expanded` : un chevron seul laisse deviner. -->
            <BoutonDiscret
              :libelle-cle="activitesOuvertes ? 'accueil.activitesReduire' : 'accueil.activitesAfficher'"
              :icone="activitesOuvertes ? 'ph-caret-down' : 'ph-caret-up'"
              :aria-expanded="activitesOuvertes"
              data-action="basculer-activites"
              @activer="activitesOuvertes = !activitesOuvertes"
            />
          </div>
          <template v-if="activitesOuvertes">
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
          </template>
        </div>
      </section>
    </div>

    <!-- ── LA COLONNE LATÉRALE · ce qu'on SURVEILLE ──────────────────────── -->
    <!-- ⚠️ ELLE NE DÉFILE **QU'À SON PROPRE COMPTE**, et jamais avec la colonne
         principale : trois cartes de chiffre et deux cartes « À régler » tiennent
         dans la fenêtre, mais une sixième ne doit pas rendre la colonne
         inatteignable pour autant. -->
    <div
      v-if="accueil.repli === null"
      class="flex min-h-0 w-84 shrink-0 flex-col gap-5.5 overflow-y-auto border-l border-line bg-surf px-5 py-5.5"
      data-colonne="laterale"
    >
      <!-- ── À régler ──────────────────────────────────────────────────── -->
      <section
        v-if="seRend(accueil.aRegler.etat)"
        class="flex shrink-0 flex-col gap-2.5"
        data-rubrique="aRegler"
        :data-etat="accueil.aRegler.etat"
      >
        <span
          v-if="accueil.aRegler.titreCle"
          class="text-etiquette uppercase text-ink-3"
        >{{ $t(accueil.aRegler.titreCle) }}</span>
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
          class="overflow-hidden rounded-xl border border-line bg-tile"
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

      <!-- ── Les chiffres ──────────────────────────────────────────────── -->
      <section
        v-if="seRend(accueil.chiffres.etat)"
        class="flex shrink-0 flex-col gap-2.5"
        data-rubrique="chiffre"
        :data-etat="accueil.chiffres.etat"
      >
        <span
          v-if="accueil.chiffres.titreCle"
          class="text-etiquette uppercase text-ink-3"
        >{{ $t(accueil.chiffres.titreCle) }}</span>
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
          class="overflow-hidden rounded-xl border border-line bg-tile"
        >
          <EtatVide message-cle="accueil.chiffresVide" />
        </div>
        <CarteChiffreAccueil
          v-else
          :chiffres="accueil.chiffres.contenu"
        />
      </section>

      <span class="flex-1" />

      <!-- ⚠️ LA NOTE DE PIED DIT LA PORTÉE DE CE QU'ON VIENT DE LIRE, et elle
           n'est pas décorative : « vous ne voyez que vos tables » explique une
           ABSENCE que l'écran ne peut pas montrer. Sans elle, une serveuse
           croirait l'application incomplète plutôt que restreinte. -->
      <div
        v-if="accueil.noteCle"
        class="border-t border-line pt-4"
        data-note-de-pied
      >
        <span class="text-mini text-ink-3">{{ $t(accueil.noteCle) }}</span>
      </div>
    </div>
  </div>
</template>
