<script setup lang="ts">
import { useCoquille } from '~/core/coquille/useCoquille'
import { useInstallation } from '~/core/coquille/useInstallation'
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'

/**
 * LE BANDEAU DE LA COQUILLE — **un seul, jamais deux**.
 *
 * Il porte les deux annonces que la coquille doit faire et que rien d'autre ne
 * ferait : **une version nouvelle attend** (FR-017, T047) et **l'application
 * n'est pas installée** (FR-015, T046).
 *
 * ⚠️ UN SEUL BANDEAU À LA FOIS, ET LE PLUS GRAVE GAGNE. `composants.md` §07 :
 * *« jamais deux bandeaux empilés — deux bandeaux en font lire zéro »*. Une
 * version en attente prime sur une invitation à installer : un correctif de
 * facturation qui ne part pas coûte plus cher qu'une installation remise à
 * demain.
 *
 * ⚠️ ET AUCUN RECHARGEMENT D'OFFICE. L'interface **propose** — ni silence, ni
 * décision prise à la place de l'utilisateur. Recharger sans demander ferait
 * disparaître une saisie en cours au comptoir.
 *
 * ⚠️ SUR WEBKIT, AUCUNE BANNIÈRE NE SE DÉCLENCHERA JAMAIS. Ce n'est pas
 * « pas encore » : `beforeinstallprompt` n'existe sur aucun navigateur d'iOS.
 * L'écran explique donc le **menu de partage**, et dit que **sans installation
 * l'appareil ne recevra pas les alertes**. C'est un fait à afficher, pas un
 * bogue à corriger.
 */

const { versionEnAttente, recharger } = useCoquille()
const { voie, ecartee, surveiller, installer, ecarter } = useInstallation()

let cesser: (() => void) | null = null
onMounted(() => {
  cesser = surveiller()
})
onBeforeUnmount(() => {
  cesser?.()
  cesser = null
})

type Annonce =
  | { quoi: 'version' }
  | { quoi: 'installation'; voie: 'INVITE' | 'MENU_DE_PARTAGE' }
  | null

const annonce = computed<Annonce>(() => {
  if (versionEnAttente.value) return { quoi: 'version' }
  if (ecartee.value) return null
  if (voie.value === 'INVITE') return { quoi: 'installation', voie: 'INVITE' }
  if (voie.value === 'MENU_DE_PARTAGE') return { quoi: 'installation', voie: 'MENU_DE_PARTAGE' }
  return null
})

/**
 * ⚠️ LE MESSAGE EST UNE PHRASE AU PASSÉ QUI DIT CE QUI S'EST PRODUIT, et
 * l'alternative dit ce qui reste à faire. C'est la structure fixe du composant
 * 07, et elle n'est pas décorative : c'est ce qui permet de lire en diagonale.
 */
const CLES = {
  version: {
    message: 'coquille.versionNouvelle',
    alternative: 'coquille.versionNouvelleAide',
    action: 'coquille.recharger',
    ton: 'info',
  },
  INVITE: {
    message: 'coquille.installable',
    alternative: 'coquille.installableAide',
    action: 'coquille.installer',
    ton: 'info',
  },
  MENU_DE_PARTAGE: {
    message: 'coquille.installationManuelle',
    alternative: 'coquille.installationManuelleAide',
    action: 'coquille.compris',
    ton: 'alerte',
  },
} as const

const cles = computed(() => {
  const courante = annonce.value
  if (courante === null) return null
  return courante.quoi === 'version' ? CLES.version : CLES[courante.voie]
})

async function agir(): Promise<void> {
  const courante = annonce.value
  if (courante === null) return
  if (courante.quoi === 'version') {
    await recharger()
    return
  }
  if (courante.voie === 'INVITE') {
    await installer()
    return
  }
  // Le menu de partage ne s'ouvre pas depuis une page : la seule action honnête
  // est d'accuser réception. On range le bandeau, on ne prétend pas installer.
  ecarter()
}
</script>

<template>
  <div
    v-if="cles"
    class="px-6 pt-3.5"
    :data-bandeau-coquille="annonce?.quoi === 'version' ? 'version' : voie"
  >
    <BandeauAlerte
      :message-cle="cles.message"
      :alternative-cle="cles.alternative"
      :action-cle="cles.action"
      :ton="cles.ton"
      pleine-largeur
      @agir="agir()"
    />
  </div>
</template>
