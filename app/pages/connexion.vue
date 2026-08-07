<script setup lang="ts">
/**
 * `R0` · LA CONNEXION — le premier écran du produit, et le seul sans en-tête.
 *
 * RÉFÉRENCE VISUELLE : cas (b), DÉRIVÉ — motif de formulaire de
 * `docs/design/html/G2-offre-hebergement.html`, états d'erreur et vides de `S3`.
 * Composants : **16** champ de saisie · **01** bouton principal · **07** bandeau
 * d'alerte. Zone de **charme**.
 *
 * ⚠️ PAS D'EN-TÊTE DE CONTEXTE, ET CE N'EST PAS UN OUBLI (FR-009). Avant
 * l'entrée il n'y a ni établissement, ni poste, ni personne : un sélecteur vide
 * en haut à gauche serait un mensonge, et le témoin d'envoi n'aurait rien à
 * dire. Le gabarit `vierge` existe pour cet écran.
 *
 * ⚠️ UNE SEULE RACINE, ET C'EST UN ÉLÉMENT. Jamais un `v-if`/`v-else` de premier
 * niveau : un fragment dont la branche active devient un composant paresseux non
 * résolu a un `el` nul, et Vue appelle `hostParentNode(prevTree.el)` au rendu
 * suivant → `TypeError … parentNode`.
 *
 * ⚠️ L'ANNONCE DE PERSISTANCE EST LUE **AVANT TOUT CHAMP** (FR-006). Tant que le
 * verdict n'est pas rendu, le formulaire n'existe pas : rendre les champs
 * d'abord ferait taper l'identifiant avant de savoir ce qu'il en adviendra.
 *
 * ⚠️ ET LE MOT DE PASSE NE SURVIT PAS À CET ÉCRAN. Il n'est ni stocké, ni
 * journalisé, ni comparé — il traverse la fonction d'appel et disparaît.
 */
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import ChampSaisie from '~/core/design-system/ChampSaisie.vue'
import { usePersistanceAnnoncee } from '~/core/coquille/usePersistanceAnnoncee'
import { useEntree } from '~/core/session/useEntree'

definePageMeta({ path: '/connexion', layout: 'vierge' })

const { t } = useI18n()
useHead({ title: () => t('connexion.titre') })

const { entrer, entreePossible } = useEntree()
const { persistance, annoncer } = usePersistanceAnnoncee()

/**
 * ⚠️ APPELÉE **UNE FOIS**, au premier affichage, et le verdict est mémorisé pour
 * la session. `navigator.storage.persist()` est asynchrone et peut ouvrir une
 * invite du navigateur : la rappeler à chaque rendu ferait clignoter l'annonce.
 */
await annoncer()

const identifiant = ref('')
const motDePasse = ref('')
const enCours = ref(false)
/** La clé de la phrase d'échec — jamais la phrase, jamais un `message`. */
const echecCle = ref<string | null>(null)

async function soumettre(): Promise<void> {
  if (enCours.value) return
  enCours.value = true
  echecCle.value = null
  try {
    const resultat = await entrer(identifiant.value, motDePasse.value)
    if (!resultat.entre) {
      echecCle.value = resultat.motifCle
      return
    }
    // ⚠️ ON REVIENT À L'ADRESSE DEMANDÉE, jamais systématiquement à l'accueil
    // (FR-010). Quelqu'un qui a ouvert un lien vers un écran précis y retourne ;
    // le renvoyer à la racine lui ferait refaire le chemin.
    const demandee = useRoute().query.vers
    await navigateTo(typeof demandee === 'string' && demandee.startsWith('/') ? demandee : '/')
  } finally {
    enCours.value = false
  }
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-120 flex-col gap-6 px-6 py-12"
    data-ecran="R0"
    data-zone="charme"
  >
    <div class="flex flex-col gap-1.5">
      <h1 class="font-titre text-titre-m font-semibold text-ink">
        {{ $t('connexion.titre') }}
      </h1>
      <p class="text-corps text-ink-2">
        {{ $t('connexion.intro') }}
      </p>
    </div>

    <!-- ⚠️ L'ANNONCE VIENT AVANT LES CHAMPS, ET C'EST L'ORDRE QUI PORTE
         L'EXIGENCE. Sous le formulaire, elle se lirait après la saisie. -->
    <BandeauAlerte
      v-if="persistance === 'durable'"
      ton="info"
      message-cle="connexion.resteraConnecte"
      pleine-largeur
      data-annonce="persistance"
      data-persistance="durable"
    />
    <BandeauAlerte
      v-else
      ton="alerte"
      message-cle="connexion.peutRedemander"
      alternative-cle="connexion.peutRedemanderAlternative"
      pleine-largeur
      data-annonce="persistance"
      data-persistance="fragile"
    />

    <!-- ⚠️ HORS LIGNE, L'ACTION DISPARAÎT — elle n'est ni grisée, ni mise en
         file « au cas où » —, et le bandeau dit pourquoi AVANT la saisie
         (FR-012). `compte` est de classe C au registre. -->
    <BandeauAlerte
      v-if="!entreePossible"
      ton="danger"
      message-cle="connexion.horsLigne"
      alternative-cle="connexion.horsLigneAlternative"
      pleine-largeur
      data-refus="hors-ligne"
    />

    <form
      class="flex flex-col gap-5"
      data-bloc="formulaire"
      @submit.prevent="soumettre()"
    >
      <ChampSaisie
        v-model="identifiant"
        etiquette-cle="connexion.identifiant"
        aide-cle="connexion.identifiantAide"
        type="text"
        data-champ="identifiant"
      />
      <ChampSaisie
        v-model="motDePasse"
        etiquette-cle="connexion.motDePasse"
        type="password"
        data-champ="mot-de-passe"
      />

      <!-- Le bandeau d'échec porte LA phrase unique. Quatre cas, deux phrases :
           l'une pour l'échec de connexion, l'autre pour le défaut de saisie. -->
      <BandeauAlerte
        v-if="echecCle"
        ton="danger"
        :message-cle="echecCle"
        pleine-largeur
        data-echec
      />

      <BoutonPrincipal
        v-if="entreePossible"
        libelle-cle="connexion.entrer"
        libelle-en-cours-cle="connexion.entrerEnCours"
        :en-cours="enCours"
        comptoir
        data-action="entrer"
        @activer="soumettre()"
      />
    </form>
  </div>
</template>
