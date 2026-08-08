<script setup lang="ts">
/**
 * LA NAVIGATION LATÉRALE — **la sortie de secours de tous les écrans**.
 *
 * ⚠️ **ELLE EXISTE PARCE QU'UN ÉCRAN SANS SORTIE EST UN PIÈGE.** *Constaté à
 * l'usage* : arrivé sur `/jour`, on ne pouvait plus revenir à l'accueil — la
 * barre « Vos activités » qui portait ce chemin est propre à `R1` et disparaît
 * avec lui. On quittait l'écran en rechargeant la page.
 *
 * ⚠️ **ELLE SE REPLIE EN ICÔNES, ET C'EST UNE CONTRAINTE D'ÉCRAN, PAS UN
 * GOÛT.** Le poste de comptoir fait 1 366 × 768 : une colonne fixe de 14 rem
 * mange 16 % de la largeur de `R4`, qui est **en zone de vitesse** et dont la
 * grille des chambres a besoin de place. Repliée, elle garde ses cibles de 44 px
 * et son repérage ; dépliée, elle nomme tout.
 *
 * ⚠️ **UN ÉCRAN NON CONSTRUIT RESTE D'APPARENCE NORMALE**, et dit « à venir »
 * au tap — même règle qu'à `R1`, et même code : `useEcranCible`. *Un badge
 * « bientôt » ou une entrée atténuée réintroduirait le grisé par la porte de
 * derrière (SC-014).*
 *
 * ⚠️ **ET ELLE NE FILTRE PAS AUTREMENT QUE L'ACCUEIL** : `useAutorisation
 * .retenir()`, posée au cycle F1, inchangée. Deux mécanismes auraient divergé,
 * et le second aurait montré ce que le premier fait disparaître.
 */
import { useEcranCible } from '~/core/coquille/useEcranCible'
import { RUBRIQUES_NAVIGATION, type EntreeNavigation } from '~/core/coquille/rubriques'
import { useAutorisation } from '~/core/session/useAutorisation'

const { t } = useI18n()
const route = useRoute()
const { resoudre } = useEcranCible()
const { retenir, autorise } = useAutorisation()

/**
 * DÉPLIÉE PAR DÉFAUT SUR GRAND ÉCRAN, REPLIÉE SOUS `lg`.
 *
 * ⚠️ **L'ÉTAT NE SURVIT PAS AU RECHARGEMENT, délibérément.** Ce n'est pas un
 * réglage d'appareil comme le thème : c'est un geste du moment. Le persister
 * rouvrirait l'application sur une barre repliée trois jours plus tard, sans
 * que personne se souvienne l'avoir repliée.
 */
const depliee = ref(true)

/** Les rubriques dont au moins une entrée est autorisée ici, pour ce compte. */
const rubriques = computed(() =>
  RUBRIQUES_NAVIGATION.map((rubrique) => ({
    ...rubrique,
    // ⚠️ L'ACCUEIL N'EXIGE AUCUNE PERMISSION — chaîne vide : il compose ce qu'il
    // a le droit de composer, et sait le dire quand il n'a rien.
    entrees: rubrique.entrees.filter(
      (entree) => entree.permission === '' || autorise(entree),
    ),
  })).filter((rubrique) => rubrique.entrees.length > 0),
)

void retenir

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
 * L'APPUI — naviguer, ou **dire**.
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
    class="flex shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-surf py-3 transition-[width] duration-160 ease-deplace"
    :class="depliee ? 'w-60' : 'w-14'"
    :data-navigation="depliee ? 'depliee' : 'repliee'"
    :aria-label="t('navigation.titre')"
  >
    <!-- ⚠️ LA POIGNÉE EST EN TÊTE, ET SON ÉTAT EST PORTÉ PAR `aria-expanded` :
         un chevron seul laisse deviner. -->
    <button
      type="button"
      class="mx-2 flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-ink-2 transition-colors duration-90 hover:bg-tile hover:text-ink"
      :aria-expanded="depliee"
      data-action="basculer-navigation"
      @click="depliee = !depliee"
    >
      <i
        class="ph shrink-0 text-titre-s"
        :class="depliee ? 'ph-sliders-horizontal' : 'ph-funnel'"
        aria-hidden="true"
      />
      <span
        v-if="depliee"
        class="truncate font-titre text-corps font-medium"
      >{{ t('navigation.replier') }}</span>
    </button>

    <div
      v-for="rubrique in rubriques"
      :key="rubrique.cle"
      class="flex flex-col gap-0.5"
      :data-rubrique-nav="rubrique.cle"
    >
      <!-- ⚠️ LE TITRE DISPARAÎT AVEC SA RUBRIQUE, jamais seul : un intitulé sans
           contenu est un reste de mise en page (FR-015). Replié, il laisse la
           place à un filet — le regroupement reste lisible sans être nommé. -->
      <span
        v-if="depliee"
        class="mt-2.5 px-4 text-etiquette uppercase text-ink-3"
      >{{ t(rubrique.titreCle) }}</span>
      <span
        v-else
        class="mx-3 mt-2.5 border-t border-line"
        aria-hidden="true"
      />

      <button
        v-for="entree in rubrique.entrees"
        :key="entree.cle"
        type="button"
        class="mx-2 flex h-11 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left transition-colors duration-90"
        :class="
          estCourante(entree)
            ? 'bg-prim-soft font-semibold text-prim'
            : 'text-ink-2 hover:bg-tile hover:text-ink'
        "
        :title="depliee ? undefined : t(entree.libelleCle)"
        :aria-current="estCourante(entree) ? 'page' : undefined"
        :data-entree-nav="entree.cle"
        @click="ouvrir(entree)"
      >
        <i
          class="ph shrink-0 text-titre-s"
          :class="entree.icone"
          aria-hidden="true"
        />
        <span
          v-if="depliee"
          class="truncate font-titre text-corps"
        >{{ t(entree.libelleCle) }}</span>
        <span
          v-else
          class="sr-only"
        >{{ t(entree.libelleCle) }}</span>
      </button>
    </div>

    <!-- ⚠️ LA MENTION D'UN ÉCRAN À VENIR EST UNE ANNONCE, PAS UNE MARQUE SUR
         L'ENTRÉE. Elle dit ce qui manque — de NOTRE côté — et quand cela
         viendra. Portée par l'entrée, elle serait un badge « bientôt ». -->
    <span
      v-if="mention && depliee"
      class="mx-3 mt-3 rounded-md border border-line bg-tile px-3 py-2 text-mini text-ink-3"
      data-mention-nav
    >{{ t('accueil.aVenir', { ecran: mention.titre }) }} · {{ t('accueil.aVenirCycle', { cycle: mention.cycle }) }}</span>
  </nav>
</template>
