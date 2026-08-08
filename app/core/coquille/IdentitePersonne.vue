<script setup lang="ts">
/**
 * L'IDENTITÉ — qui agit, ce qu'elle fait, et **« Passer la main »**.
 *
 * RÉFÉRENCE VISUELLE : cas (a) — le bloc de droite des quatre `R1-accueil*`.
 * Composant : **03** bouton discret.
 *
 * ⚠️ **« PASSER LA MAIN », JAMAIS « SE DÉCONNECTER »** (lexique). Sur un
 * terminal partagé, l'appareil ne bouge pas : c'est la personne qui change. « Se
 * déconnecter » décrit la rupture d'un lien technique là où le geste réel est de
 * **rendre le poste au suivant** — et le registre des actions devient faux dès
 * que Yao travaille sous le nom d'Aminata.
 *
 * ⚠️ L'EFFET EST ANNONCÉ AVANT LE GESTE : « La personne suivante devra entrer
 * son identifiant. » Jamais « votre session sera fermée », qui emploie deux mots
 * proscrits pour dire moins.
 *
 * ⚠️ ET LE REFUS EST **IMMÉDIAT ET SYNCHRONE** quand la file n'est pas vide.
 * Laisser passer la main puis échouer perdrait le travail de quelqu'un qui est
 * déjà parti — c'est-à-dire au moment où plus personne ne peut le rattraper. La
 * garde lit `useFile().enAttente`, qui est en mémoire : aucune attente, aucune
 * course.
 *
 * ⚠️ **LE BLOC N'EST JAMAIS MASQUÉ EN ENTIER, ET C'EST UNE CORRECTION.** Il
 * portait `hidden md:flex` : sous 768 px, « Passer la main » DISPARAISSAIT — sur
 * un terminal partagé, personne ne pouvait plus rendre le poste au suivant, et
 * le registre des actions devenait faux dès que Yao travaillait sous le nom
 * d'Aminata. Ce qui se range sur un téléphone, c'est le TEXTE et l'initiale ; le
 * geste, lui, reste.
 *
 * ⚠️ **AUCUN PLAFOND DE LARGEUR, ET C'EST UN CONSTAT DE MESURE.** Le bloc portait
 * `max-w-64` puis `max-w-80` : il était donc coupé **à 320 px pendant qu'il
 * restait 124 px libres dans la barre** — « Gérant · Caissier · Réceptionniste »
 * se lisait « Gérant · Caissier · … » sur un écran de 1440 px. Ce que la
 * personne FAIT est la seconde ligne de la maquette ; l'amputer par précaution
 * revient à ne jamais l'afficher. La troncature reste — `min-w-0` et `truncate`
 * la gardent — mais elle survient quand **la place manque vraiment**, jamais
 * avant.
 *
 * ⚠️ CE QUE CE COMPOSANT NE FAIT PAS : nommer un rôle. « Gérante · Caisse » de
 * la maquette est **ce que la personne fait**, pas le nom de ses habilitations —
 * et les mots « rôle » et « permission » n'atteignent jamais l'écran.
 */
import BoutonDiscret from '~/core/design-system/BoutonDiscret.vue'
import { fournisseur } from '~/core/donnees/fournisseur'
import { useFile } from '~/core/file/useFile'
import { etablissementDe, SESSION_VIDE, useSession } from '~/core/session/useSession'

const { session, definir } = useSession()
const { enAttente } = useFile()

/** Le nom de la personne — lu au domaine, jamais deviné de l'identifiant. */
const nom = ref<string | null>(null)
const initiales = computed(() =>
  (nom.value ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join(''),
)

/**
 * CE QUE LA PERSONNE FAIT — « Gérant · Caisse », comme les quatre maquettes.
 *
 * ⚠️ CE SONT LES LIBELLÉS DES FONCTIONS, PAS LE MOT « RÔLE ». Le lexique
 * proscrit la MÉCANIQUE du visible, pas la fonction : « Gérante · Caisse ·
 * Réception » dit ce qu'Adjoua fait, « trois rôles » dirait comment le système
 * le sait.
 */
const fonctions = ref<readonly string[]>([])

watch(
  () => [session.value.compteId, session.value.portee] as const,
  async ([compteId]) => {
    if (compteId === null) {
      nom.value = null
      fonctions.value = []
      return
    }
    const etablissementId = etablissementDe(session.value)
    if (etablissementId === null) fonctions.value = []
    else {
      const resultat = await fournisseur().comptes.fonctionsSur(compteId, etablissementId)
      if (resultat.ok) fonctions.value = resultat.valeur
    }
    const resultat = await fournisseur().comptes.lireCompte(compteId)
    if (!resultat.ok) return
    // ⚠️ LE NOM VIENT DE LA **PERSONNE**, jamais du compte : `compte` porte un
    // identifiant d'authentification, `personne` porte l'identité civile. Les
    // confondre afficherait un numéro de téléphone en haut à droite.
    const personne = await fournisseur().comptes.lirePersonne(resultat.valeur.personneId)
    if (personne.ok) {
      nom.value = [personne.valeur.prenoms, personne.valeur.nom].filter(Boolean).join(' ')
    }
  },
  { immediate: true, deep: true },
)

/**
 * ⚠️ LE REFUS SE CALCULE **AVANT** LE CLIC, ET IL EST SYNCHRONE. C'est ce qui
 * fait la différence entre « on vous prévient » et « on constate après coup ».
 */
const fileNonVide = computed(() => enAttente.value > 0)

const refus = ref(false)

async function passerLaMain(): Promise<void> {
  if (fileNonVide.value) {
    refus.value = true
    return
  }
  refus.value = false
  await definir(SESSION_VIDE)
  await navigateTo('/connexion')
}
</script>

<template>
  <div
    v-if="session.compteId"
    class="flex min-w-0 items-center gap-2.5 lg:border-l lg:border-line lg:pl-3.5"
    data-emplacement="identite"
  >
    <span
      class="hidden size-7 shrink-0 items-center justify-center rounded-pleine bg-prim-soft font-titre text-mini font-bold text-prim md:inline-flex"
      aria-hidden="true"
    >{{ initiales }}</span>
    <!-- ⚠️ **SOUS 1024 px, LE TEXTE SE RANGE — IL NE SE COUPE PAS.** Tronqué, il
         rendait « A » et « G » : deux lettres qui n'apprennent rien et qui font
         croire à un défaut. L'initiale de l'avatar dit déjà qui travaille, et
         « Passer la main » reste atteignable. Ce qui disparaît est ce qui se
         relit ailleurs, jamais ce qui se touche. -->
    <span class="hidden min-w-0 flex-col lg:flex">
      <span
        class="truncate font-titre text-corps font-semibold text-ink"
        data-nom
      >{{ nom }}</span>
      <!-- ⚠️ LE REFUS EST RENDU **À CÔTÉ DU GESTE**, pas en bandeau de page : il
           répond à un appui précis, et une alerte transverse ferait chercher
           ailleurs ce qui vient de se passer ici. -->
      <span
        v-if="refus"
        class="truncate text-mini text-danger-fort"
        data-refus="passer-la-main"
      >{{ $t('contexte.passerLaMainRefus') }}</span>
      <!-- Ce que la personne FAIT — le second segment des quatre maquettes. -->
      <span
        v-else
        class="truncate text-mini text-ink-3"
        data-fonctions
      >{{ fonctions.join(' · ') }}</span>
    </span>
    <!-- ⚠️ L'EFFET EST EN INFOBULLE, PAS EN PERMANENCE SOUS LE NOM. Le lexique
         le dit ainsi — « l'infobulle dit l'effet » —, et la maquette réserve
         cette ligne à ce que la personne fait. Une phrase de dix mots y serait
         tronquée à chaque rendu, donc illisible, donc inutile. -->
    <!-- ⚠️ **LE MOT CÈDE, JAMAIS LE GESTE.** Sur un téléphone, « Passer la
         main » se réduit à son icône — le libellé reste en infobulle et en nom
         accessible. Sur un terminal partagé, rendre le poste au suivant doit
         être atteignable partout : c'est ce qui garde le registre des actions
         juste. -->
    <span
      :title="$t('contexte.passerLaMainEffet')"
      class="hidden lg:inline-flex"
    >
      <BoutonDiscret
        libelle-cle="contexte.passerLaMain"
        icone="ph-sign-out"
        data-action="passer-la-main"
        @activer="passerLaMain()"
      />
    </span>
    <span
      :title="$t('contexte.passerLaMain')"
      class="inline-flex lg:hidden"
    >
      <BoutonDiscret
        icone="ph-sign-out"
        :libelle-cle="undefined"
        :aria-label="$t('contexte.passerLaMain')"
        data-action="passer-la-main"
        @activer="passerLaMain()"
      />
    </span>
  </div>
</template>
