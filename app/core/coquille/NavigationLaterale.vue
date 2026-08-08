<script setup lang="ts">
/**
 * LA NAVIGATION LATÉRALE — **la sortie de secours de tous les écrans**.
 *
 * ⚠️ **ELLE EXISTE PARCE QU'UN ÉCRAN SANS SORTIE EST UN PIÈGE.** *Constaté à
 * l'usage* : arrivé sur `/jour`, on ne pouvait plus revenir à l'accueil — la
 * barre « Vos activités » qui portait ce chemin est propre à `R1` et disparaît
 * avec lui. On quittait l'écran en rechargeant la page.
 *
 * ⚠️ **UNE RUBRIQUE PAR VERTICALE, ET LE POURQUOI EST DANS `rubriques.ts`.**
 * Ici on ne décide rien : on rend ce que le fichier déclare.
 *
 * ⚠️ **LE RAIL EST SOMBRE EN CLAIR COMME EN SOMBRE, ET C'EST LA SEULE SURFACE
 * DU PRODUIT DANS CE CAS.** Ce n'est pas une seconde palette — les jetons
 * `--color-rail*` portent les deux modes sous les mêmes noms. C'est une
 * séparation de fonction : le rail est un **bord d'écran**, pas une carte posée
 * sur la page. Le voir d'un coup d'œil, c'est savoir sans lire où l'on se
 * déplace et où l'on travaille.
 *
 * ⚠️ **LA GOUTTE MARQUE L'ÉCRAN OUVERT, ET ELLE EST FAITE DE LA COULEUR DU
 * CORPS.** L'entrée courante prend `--color-bg` et coule dans la page par deux
 * congés concaves : elle n'est plus posée sur le rail, elle en **sort**. C'est
 * la seule raison pour laquelle du CSS explicite entre ici — Tailwind n'exprime
 * pas un rayon inversé, et aucun utilitaire ne le fera (principe 12).
 *
 * ⚠️ **UN ÉCRAN NON CONSTRUIT RESTE D'APPARENCE NORMALE**, et dit « à venir »
 * au tap — même règle qu'à `R1`, et même code : `useEcranCible`. *Un badge
 * « bientôt » ou une entrée atténuée réintroduirait le grisé par la porte de
 * derrière (SC-014).*
 *
 * ⚠️ **ET ELLE NE FILTRE PAS AUTREMENT QUE L'ACCUEIL** : `useAutorisation
 * .autorise()`, posée au cycle F1, inchangée. Deux mécanismes auraient divergé,
 * et le second aurait montré ce que le premier fait disparaître.
 */
import { useEcranCible } from '~/core/coquille/useEcranCible'
import {
  RUBRIQUES_NAVIGATION,
  actionDe,
  type EntreeNavigation,
  type RubriqueNavigation,
} from '~/core/coquille/rubriques'
import { useAutorisation } from '~/core/session/useAutorisation'

const { t } = useI18n()
const route = useRoute()
const { resoudre } = useEcranCible()
const { autorise } = useAutorisation()

/**
 * DÉPLIÉE PAR DÉFAUT.
 *
 * ⚠️ **L'ÉTAT NE SURVIT PAS AU RECHARGEMENT, délibérément.** Ce n'est pas un
 * réglage d'appareil comme le thème : c'est un geste du moment. Le persister
 * rouvrirait l'application sur un rail replié trois jours plus tard, sans que
 * personne se souvienne l'avoir replié.
 */
const depliee = ref(true)

/** Les rubriques dont au moins une entrée est autorisée ici, pour ce compte. */
const rubriques = computed<RubriqueNavigation[]>(() =>
  RUBRIQUES_NAVIGATION.map((rubrique) => ({
    ...rubrique,
    // ⚠️ L'ACCUEIL N'EXIGE AUCUNE PERMISSION — chaîne vide : il compose ce qu'il
    // a le droit de composer, et sait le dire quand il n'a rien.
    entrees: rubrique.entrees.filter(
      (entree) => entree.permission === '' || autorise(actionDe(rubrique, entree)),
    ),
  })).filter((rubrique) => rubrique.entrees.length > 0),
)

/** La route d'une entrée, quand son écran est construit. */
function routeDe(entree: EntreeNavigation): string | null {
  const cible = resoudre(entree.ecranCible)
  return cible.etat === 'construit' ? cible.route : null
}

/** L'entrée qui correspond à l'écran ouvert — le repère de « où suis-je ». */
function estCourante(entree: EntreeNavigation): boolean {
  const cible = routeDe(entree)
  return cible !== null && route.path === cible
}

/**
 * LES RUBRIQUES REPLIÉES — **tout est ouvert, et ce qu'on retient est la
 * fermeture**.
 *
 * ⚠️ **LA BARRE S'OUVRE ENTIÈREMENT DÉPLIÉE, ET C'EST L'ÉTAT PAR DÉFAUT.** La
 * première version était un accordéon — une seule verticale ouverte à la fois —
 * et elle avait tort deux fois. *Constaté à l'écran, capture à l'appui* : sur
 * l'accueil, qui n'est d'aucune verticale, la barre rendait **deux entrées sur
 * douze**. Et ouvrir « Restaurant » refermait « Hébergement », c'est-à-dire la
 * verticale où l'on travaillait. **Un menu n'a pas à choisir ce qu'on a le droit
 * de voir** : ce que l'exploitant peut faire tient en douze lignes, et douze
 * lignes se lisent d'un regard.
 *
 * ⚠️ **ON MÉMORISE DONC CE QUI EST FERMÉ, PAS CE QUI EST OUVERT.** L'ensemble
 * part vide : toute rubrique — y compris celles d'un module ajouté demain — naît
 * ouverte, sans rien à déclarer. Mémoriser les ouvertes aurait fait naître
 * fermée chaque verticale nouvelle.
 *
 * ⚠️ **ET L'ÉTAT NE SURVIT PAS AU RECHARGEMENT**, comme le repli du rail
 * lui-même : c'est un geste du moment, pas un réglage d'appareil.
 */
const rubriquesRepliees = ref<ReadonlySet<string>>(new Set())

/**
 * La rubrique **nommée** qui contient l'écran ouvert. Un groupe sans intitulé
 * n'en est pas une : il n'a pas de poignée, donc rien à marquer ni à déplier.
 */
const rubriqueDeLEcran = computed<string | null>(
  () =>
    rubriques.value.find(
      (rubrique) =>
        rubrique.titreCle !== null && rubrique.entrees.some((entree) => estCourante(entree)),
    )?.cle ?? null,
)

/**
 * ⚠️ **NAVIGUER ROUVRE LA VERTICALE DE L'ÉCRAN VISÉ.** Sans cela, on arriverait
 * sur `/passage` avec « Hébergement » refermé à la main tout à l'heure : l'écran
 * où l'on est ne serait visible nulle part dans la barre qui sert à s'y repérer.
 */
watch(
  rubriqueDeLEcran,
  (cle) => {
    if (cle === null || !rubriquesRepliees.value.has(cle)) return
    const suivant = new Set(rubriquesRepliees.value)
    suivant.delete(cle)
    rubriquesRepliees.value = suivant
  },
  { immediate: true },
)

function estDepliee(rubrique: RubriqueNavigation): boolean {
  // Un groupe sans intitulé n'a pas de poignée, donc pas d'état replié.
  return rubrique.titreCle === null || !rubriquesRepliees.value.has(rubrique.cle)
}

/**
 * LA MARQUE PORTÉE PAR LA POIGNÉE — **quand l'entrée courante ne se voit pas**.
 *
 * ⚠️ *Constaté sur deux captures, et par deux chemins différents.* Rail replié
 * sur `/jour` : la barre ne disait **nulle part** où l'on était. Rail déplié,
 * mais « Hébergement » refermé à la main pour ouvrir « Restaurant » : même
 * résultat. Dans les deux cas l'entrée courante portait bien sa goutte — elle
 * n'était simplement pas rendue. Une barre de repérage qui cesse de repérer dès
 * qu'on la range ne sert qu'à occuper la largeur qu'on vient de lui reprendre.
 *
 * ⚠️ **LA CONDITION EST DONC « L'ENTRÉE COURANTE EST-ELLE VISIBLE ? », PAS
 * « LE RAIL EST-IL REPLIÉ ? »** — la première version posait la seconde, et
 * laissait passer le cas du repli manuel. Deux gouttes, une sur la poignée et
 * une sur l'entrée, désigneraient deux écrans courants : c'est bien l'une **ou**
 * l'autre.
 */
function poigneeMarquee(rubrique: RubriqueNavigation): boolean {
  if (rubriqueDeLEcran.value !== rubrique.cle) return false
  return !(depliee.value && estDepliee(rubrique))
}

/**
 * L'APPUI SUR UNE RUBRIQUE — déplier, ou **déplier le rail d'abord**.
 *
 * ⚠️ **REPLIÉ, LE RAIL NE PEUT PAS MONTRER UN SOUS-MENU** : il fait 3,5 rem. Le
 * tap sur une icône de rubrique déplie donc le rail ET ouvre la rubrique, en un
 * geste. *Le refermer aussitôt, ou ne rien faire, laisserait l'utilisateur
 * taper une icône qui ne répond pas.*
 */
function basculerRubrique(rubrique: RubriqueNavigation): void {
  const suivant = new Set(rubriquesRepliees.value)
  if (!depliee.value) {
    // Déplier le rail rend visible ce que la rubrique contient : elle s'ouvre.
    depliee.value = true
    suivant.delete(rubrique.cle)
  } else if (suivant.has(rubrique.cle)) {
    suivant.delete(rubrique.cle)
  } else {
    suivant.add(rubrique.cle)
  }
  rubriquesRepliees.value = suivant
}

/**
 * L'APPUI SUR UNE ENTRÉE — naviguer, ou **dire**.
 *
 * ⚠️ **MÊME COMPORTEMENT QUE SUR L'ACCUEIL.** Un écran à venir n'est pas une
 * erreur : c'est une annonce, et elle dit **quel écran** et **quel cycle**.
 */
const mention = ref<{ titre: string; cycle: string } | null>(null)

async function ouvrir(entree: EntreeNavigation): Promise<void> {
  mention.value = null
  const cible = resoudre(entree.ecranCible)
  if (cible.etat === 'construit') {
    await navigateTo(cible.route)
    return
  }
  if (cible.etat === 'aVenir') mention.value = { titre: cible.titre, cycle: cible.cycle }
}
</script>

<template>
  <nav
    class="relative flex shrink-0 flex-col gap-0.5 overflow-y-auto bg-rail py-3 text-rail-ink transition-[width] duration-160 ease-deplace"
    :class="depliee ? 'w-60' : 'w-14'"
    :data-navigation="depliee ? 'depliee' : 'repliee'"
    :aria-label="t('navigation.titre')"
  >
    <!-- ⚠️ LA POIGNÉE EST EN TÊTE, ET SON ÉTAT EST PORTÉ PAR `aria-expanded` :
         un chevron seul laisse deviner. -->
    <button
      type="button"
      class="mx-2 mb-1 flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-rail-ink-2 transition-colors duration-90 hover:bg-rail-2 hover:text-rail-ink"
      :aria-expanded="depliee"
      data-action="basculer-navigation"
      @click="depliee = !depliee"
    >
      <i
        class="ph shrink-0 text-titre-s"
        :class="depliee ? 'ph-sidebar-simple' : 'ph-list'"
        aria-hidden="true"
      />
      <span
        v-if="depliee"
        class="truncate font-titre text-corps font-medium"
      >{{ t('navigation.replier') }}</span>
      <span
        v-else
        class="sr-only"
      >{{ t('navigation.deplier') }}</span>
    </button>

    <div
      v-for="rubrique in rubriques"
      :key="rubrique.cle"
      class="flex flex-col gap-0.5"
      :data-rubrique-nav="rubrique.cle"
      :data-rubrique-etat="estDepliee(rubrique) ? 'depliee' : 'repliee'"
    >
      <!-- ⚠️ LA POIGNÉE DE RUBRIQUE PORTE L'INTITULÉ **ET** L'ICÔNE DE LA
           VERTICALE : repliée, l'icône seule doit suffire à reconnaître
           « Hébergement » sans le lire. Un groupe sans intitulé — l'accueil, la
           caisse — n'en a pas : il n'y a rien à replier sur une entrée unique,
           et une poignée y serait un geste pour rien. -->
      <button
        v-if="rubrique.titreCle"
        type="button"
        class="relative ml-2 mt-1.5 flex h-11 cursor-pointer items-center gap-2.5 px-2.5 text-left transition-colors duration-90"
        :class="
          poigneeMarquee(rubrique)
            ? 'rounded-l-2xl font-semibold text-prim'
            : 'mr-2 rounded-lg text-rail-ink-2 hover:bg-rail-2 hover:text-rail-ink'
        "
        :aria-expanded="estDepliee(rubrique)"
        :title="depliee ? undefined : t(rubrique.titreCle)"
        :data-poignee-rubrique="rubrique.cle"
        @click="basculerRubrique(rubrique)"
      >
        <!-- LA GOUTTE, PORTÉE PAR LA POIGNÉE — voir `poigneeMarquee`. -->
        <span
          v-if="poigneeMarquee(rubrique)"
          class="goutte"
          aria-hidden="true"
        />
        <i
          class="ph relative shrink-0 text-titre-s"
          :class="rubrique.icone"
          aria-hidden="true"
        />
        <span
          v-if="depliee"
          class="relative min-w-0 flex-1 truncate font-titre text-etiquette uppercase"
        >{{ t(rubrique.titreCle) }}</span>
        <span
          v-else
          class="sr-only"
        >{{ t(rubrique.titreCle) }}</span>
        <i
          v-if="depliee"
          class="ph ph-caret-down shrink-0 text-mini transition-transform duration-160 ease-deplace"
          :class="estDepliee(rubrique) ? '' : '-rotate-90'"
          aria-hidden="true"
        />
      </button>

      <!-- ⚠️ REPLIÉ, LES ENTRÉES D'UNE VERTICALE DISPARAISSENT ; SEULE L'ICÔNE
           DE RUBRIQUE RESTE. Douze entrées empilées sur 3,5 rem de large
           seraient douze icônes indistinctes — et le repli n'existe que pour
           rendre la largeur à `R4`, qui est en zone de vitesse.

           ⚠️ **MAIS UN GROUPE SANS INTITULÉ RESTE VISIBLE REPLIÉ**, et ce n'est
           pas une exception de confort. *Constaté sur une capture* : la
           première version repliait tout ce qui n'avait pas de poignée — donc
           **l'accueil disparaissait du rail replié**. La sortie de secours de
           tous les écrans s'effaçait précisément quand la barre se réduit à
           l'essentiel. Ces groupes n'ont pas de poignée : s'ils ne se montrent
           pas eux-mêmes, rien ne les montre. -->
      <template v-if="rubrique.titreCle === null || (depliee && estDepliee(rubrique))">
        <button
          v-for="entree in rubrique.entrees"
          :key="entree.cle"
          type="button"
          class="relative flex h-11 cursor-pointer items-center gap-2.5 rounded-l-2xl px-2.5 text-left transition-colors duration-90"
          :class="[
            estCourante(entree) ? 'font-semibold text-prim' : 'text-rail-ink hover:bg-rail-2',
            // ⚠️ L'INDENTATION DIT L'APPARTENANCE, ET ELLE NE VAUT QUE DÉPLIÉE.
            // Une entrée décalée sous son intitulé se rattache à lui sans qu'on
            // ait à le relire. Repliée, la barre n'a plus d'intitulés : décaler
            // une icône l'écarterait de la colonne où l'œil les cherche — et les
            // seules entrées rendues à ce moment-là (l'accueil, la caisse) n'ont
            // de toute façon pas de parent.
            rubrique.titreCle !== null && depliee ? 'ml-5' : 'ml-2',
          ]"
          :title="depliee ? undefined : t(entree.libelleCle)"
          :aria-current="estCourante(entree) ? 'page' : undefined"
          :data-entree-nav="entree.cle"
          @click="ouvrir(entree)"
        >
          <!-- LA GOUTTE — voir l'en-tête, et le bloc <style> plus bas. -->
          <span
            v-if="estCourante(entree)"
            class="goutte"
            aria-hidden="true"
          />
          <i
            class="ph relative shrink-0 text-titre-s"
            :class="entree.icone"
            aria-hidden="true"
          />
          <span
            class="relative truncate font-titre text-corps"
            :class="depliee ? '' : 'sr-only'"
          >{{ t(entree.libelleCle) }}</span>
        </button>
      </template>
    </div>

    <!-- ⚠️ LA MENTION D'UN ÉCRAN À VENIR EST UNE ANNONCE, PAS UNE MARQUE SUR
         L'ENTRÉE. Elle dit ce qui manque — de NOTRE côté — et quand cela
         viendra. Portée par l'entrée, elle serait un badge « bientôt ». -->
    <span
      v-if="mention && depliee"
      class="mx-3 mt-3 rounded-lg border border-rail-line px-3 py-2 text-mini text-rail-ink-2"
      data-mention-nav
    >{{ t('accueil.aVenir', { ecran: mention.titre }) }} · {{ t('accueil.aVenirCycle', { cycle: mention.cycle }) }}</span>
  </nav>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   LA GOUTTE — le seul CSS explicite de la coquille.

   ⚠️ POURQUOI IL N'EST PAS EN UTILITAIRES. Il faut un **rayon inversé** : deux
   congés concaves qui raccordent l'entrée courante au corps de la page. Tailwind
   n'a pas d'utilitaire pour cela, et n'en aura pas — `border-radius` ne creuse
   pas. Le principe 12 réserve le CSS explicite « à ce que Tailwind n'exprime
   pas » : c'est exactement ce cas.

   ⚠️ ET AUCUNE VALEUR N'EST LITTÉRALE ICI. Couleur, rayon, durée et courbe
   viennent tous des jetons de @theme — y compris la durée, qui passe par
   `--intensite` pour honorer `data-zone="vitesse"` comme le reste du produit.
   ═══════════════════════════════════════════════════════════════════════════ */

.goutte {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
  border-top-left-radius: var(--radius-2xl);
  border-bottom-left-radius: var(--radius-2xl);
  transform-origin: right center;
  animation: gouttePosee calc(var(--duree-standard) * var(--intensite)) var(--ease-elastique);
}

/* Les deux congés. Chacun est un carré de la couleur du corps, collé au bord
   droit du rail, dont on retire un disque : ce qui reste est le raccord
   concave. Le masque garde ce qui est HORS du disque — d'où `transparent`
   jusqu'au rayon, opaque au-delà. */
.goutte::before,
.goutte::after {
  content: '';
  position: absolute;
  right: 0;
  width: var(--radius-2xl);
  height: var(--radius-2xl);
  background: var(--color-bg);
  pointer-events: none;
}

/* Au-dessus : le disque est centré sur le coin HAUT-GAUCHE du carré, donc la
   matière restante épouse le bord droit et s'évase vers l'entrée. */
.goutte::before {
  bottom: 100%;
  -webkit-mask: radial-gradient(
    circle at 0 0,
    transparent 0 var(--radius-2xl),
    var(--color-ink) var(--radius-2xl)
  );
  mask: radial-gradient(
    circle at 0 0,
    transparent 0 var(--radius-2xl),
    var(--color-ink) var(--radius-2xl)
  );
}

/* En dessous : le même carré, miroir — disque centré sur le coin BAS-GAUCHE. */
.goutte::after {
  top: 100%;
  -webkit-mask: radial-gradient(
    circle at 0 100%,
    transparent 0 var(--radius-2xl),
    var(--color-ink) var(--radius-2xl)
  );
  mask: radial-gradient(
    circle at 0 100%,
    transparent 0 var(--radius-2xl),
    var(--color-ink) var(--radius-2xl)
  );
}

/* ⚠️ LA GOUTTE ENTRE PAR LA DROITE, comme si le corps de la page débordait dans
   le rail. Elle porte le mouvement SEULE — le libellé et l'icône sont au-dessus
   d'elle et ne se déforment pas. *Animer le bouton entier étirait le texte, et
   cela se voyait.* Sous « réduire les animations », `--intensite` tombe à 0 et
   le thème plafonne toute animation : la goutte est là, immobile. */
@keyframes gouttePosee {
  from {
    transform: scaleX(0.35);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}
</style>
