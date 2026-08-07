<script setup lang="ts">
/**
 * COMPOSANT 10 · TÉMOIN DE SYNCHRONISATION
 *
 * Rôle : dire si le travail est en sécurité. **Le composant le plus important
 * du produit**, et il est présent sur chaque écran.
 *
 * ⚠️ LES TROIS NOMS D'ÉTAT INTERNES N'ATTEIGNENT JAMAIS L'ÉCRAN. « Connecté »,
 * « dégradé » et « hors ligne » sont des mots d'ingénieur qui décrivent LE
 * RÉSEAU ; ce que l'utilisateur doit lire, c'est si SON TRAVAIL est en sécurité.
 * Le lexique documente que `app/core/i18n` avait déjà dérivé sur exactement ces
 * trois libellés, et qu'il a fallu le corriger. SC-022 le vérifie sur le HTML
 * rendu — c'est pourquoi ce composant n'écrit AUCUN attribut portant l'état
 * interne : une marque de données est du HTML rendu.
 *
 * Les quatre libellés font foi, mot pour mot (`docs/design/lexique.md`) :
 *   « Enregistré » · « En attente d'envoi (n) » · « Connexion faible » ·
 *   « Hors connexion »
 *
 * ⚠️ JAMAIS DE POURCENTAGE — un DÉCOMPTE EXACT. « 47 % synchronisé » ne dit rien
 * à Aminata ; « 12 en attente d'envoi » lui dit combien de gestes ne sont pas
 * encore partis.
 *
 * ⚠️ LE PASSAGE HORS CONNEXION EST INSTANTANÉ, SANS TRANSITION. « Un état grave
 * n'a pas de transition — il est déjà là » (`mouvement.md` §6). Le pouls, lui,
 * est lent (2,4 s) : il rassure, il n'alerte pas.
 */

/** Les trois états internes. Ils ne sortent JAMAIS de ce fichier. */
export type EtatReseauTemoin = 'connecte' | 'degrade' | 'horsLigne'

const props = withDefaults(
  defineProps<{
    etat?: EtatReseauTemoin
    /** Le décompte EXACT d'écritures en attente. Jamais un pourcentage. */
    enAttente?: number
    /** Variante compacte, pour la barre d'en-tête. */
    compact?: boolean
  }>(),
  { etat: 'connecte', enAttente: 0, compact: false },
)

/**
 * ⚠️ LA FILE PRIME SUR L'ÉTAT DU RÉSEAU. Ce qui compte pour Aminata n'est pas si
 * le réseau va bien, c'est s'il reste des gestes qui ne sont pas partis. Un
 * témoin « Enregistré » avec douze écritures en attente serait un mensonge.
 */
const libelle = computed(() => {
  if (props.enAttente > 0) return { cle: 'temoin.enAttenteEnvoi', n: props.enAttente }
  if (props.etat === 'horsLigne') return { cle: 'temoin.horsConnexion', n: 0 }
  if (props.etat === 'degrade') return { cle: 'temoin.connexionFaible', n: 0 }
  return { cle: 'temoin.enregistre', n: 0 }
})

/** La marque : forme ET couleur, jamais la couleur seule (composant 04). */
const marque = computed(() => {
  if (props.etat === 'horsLigne') return { pastille: 'border-2 border-ink-3', pouls: false, encre: 'text-ink-3' }
  if (props.etat === 'degrade') return { pastille: 'bg-alerte', pouls: false, encre: 'text-alerte-fort' }
  if (props.enAttente > 0) return { pastille: 'bg-info', pouls: true, encre: 'text-info-fort' }
  return { pastille: 'bg-succes', pouls: true, encre: 'text-succes-fort' }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-pleine border border-line bg-tile"
    :class="compact ? 'h-8 px-3' : 'h-9 px-3.5'"
    role="status"
    aria-live="polite"
  >
    <span
      class="relative inline-block size-2.5"
      aria-hidden="true"
    >
      <span
        class="absolute inset-0 rounded-pleine"
        :class="marque.pastille"
      />
      <!-- Le pouls ne joue QUE quand tout va bien : un état grave n'attire pas
           l'œil par le mouvement, il est déjà lisible. -->
      <span
        v-if="marque.pouls"
        class="absolute inset-0 animate-pulse-reseau rounded-pleine"
        :class="marque.pastille"
      />
    </span>
    <span
      class="font-titre text-mini font-semibold whitespace-nowrap"
      :class="marque.encre"
    >{{ $t(libelle.cle, { n: libelle.n }) }}</span>
  </span>
</template>
