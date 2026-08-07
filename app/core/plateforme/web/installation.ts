/**
 * L'INSTALLATION DE L'APPLICATION — le seul endroit du produit qui connaît
 * `beforeinstallprompt` et le mode autonome.
 *
 * ⚠️ IL VIT DANS `app/core/plateforme/` POUR LA MÊME RAISON QUE LE SERVICE
 * WORKER : **Capacitor ne l'aura pas.** Une application native est installée par
 * définition — il n'y a ni invite à capter, ni menu de partage à expliquer.
 * L'implémentation Capacitor rendra simplement « déjà installée », et aucun
 * écran ne s'en apercevra.
 *
 * ⚠️ ET LE CAS WEBKIT N'EST PAS UN DÉFAUT À CORRIGER, C'EST UN FAIT À AFFICHER.
 * `beforeinstallprompt` n'existe **sur aucun navigateur d'iOS**, et il n'existera
 * pas : Safari installe depuis le menu de partage, et **aucune bannière ne se
 * déclenche jamais**. Attendre l'événement sur WebKit reviendrait à ne rien
 * proposer du tout — c'est-à-dire à laisser l'appareil sans alertes sans que
 * personne sache pourquoi (PWA-01).
 */

import { detecterMoteur } from '~/core/plateforme/capacites'

import type { Moteur } from '~/core/plateforme/PlatformAdapter'

/** Ce que le moteur permet, et par quel chemin. */
export type VoieInstallation =
  /** Le moteur a proposé son invite : un tap suffit. */
  | 'INVITE'
  /** Aucune invite ne viendra : l'écran explique le menu de partage. */
  | 'MENU_DE_PARTAGE'
  /** Déjà installée — il n'y a rien à proposer. */
  | 'DEJA_INSTALLEE'
  /** Le moteur n'installe pas d'application web. */
  | 'IMPOSSIBLE'

export interface EtatInstallation {
  readonly voie: VoieInstallation
  readonly moteur: Moteur
}

/**
 * L'événement du moteur. Il n'est PAS dans la bibliothèque de types standard :
 * c'est une extension propre à Chromium, et l'écrire ici est plus honnête que
 * de l'élargir globalement.
 */
interface EvenementInviteInstallation extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let inviteRetenue: EvenementInviteInstallation | null = null

/** L'application tourne-t-elle déjà en fenêtre autonome ? */
function dejaInstallee(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true
    // ⚠️ LE CAS iOS SE LIT AUTREMENT, ET IL FAUT LE LIRE. WebKit ne rend pas
    // `display-mode: standalone` de façon fiable sur les versions déployées ;
    // il pose `navigator.standalone`, qui n'existe nulle part ailleurs.
    const nav = navigator as Navigator & { standalone?: boolean }
    return nav.standalone === true
  } catch {
    return false
  }
}

/**
 * Commence à écouter l'invite du moteur.
 *
 * ⚠️ `preventDefault()` EST CE QUI RETIENT L'INVITE. Sans lui, Chromium affiche
 * sa propre bannière, où l'on ne peut ni choisir le moment ni dire pourquoi
 * l'installation compte. « Étape guidée du produit, et non un détail » (PWA-01).
 */
export function surInviteInstallation(quandDisponible: () => void): () => void {
  const ecouteur = (evenement: Event) => {
    evenement.preventDefault()
    inviteRetenue = evenement as EvenementInviteInstallation
    quandDisponible()
  }
  const installee = () => {
    inviteRetenue = null
    quandDisponible()
  }
  try {
    window.addEventListener('beforeinstallprompt', ecouteur)
    window.addEventListener('appinstalled', installee)
  } catch {
    return () => {}
  }
  return () => {
    window.removeEventListener('beforeinstallprompt', ecouteur)
    window.removeEventListener('appinstalled', installee)
  }
}

/** L'état de l'installation, tel que l'interface a besoin de le connaître. */
export function etatInstallation(): EtatInstallation {
  const moteur = detecterMoteur()
  if (dejaInstallee()) return { voie: 'DEJA_INSTALLEE', moteur }
  if (inviteRetenue !== null) return { voie: 'INVITE', moteur }
  // WebKit n'émettra jamais l'invite : ce n'est pas « pas encore », c'est
  // « jamais », et l'écran doit le dire plutôt que d'attendre.
  if (moteur === 'WEBKIT') return { voie: 'MENU_DE_PARTAGE', moteur }
  return { voie: 'IMPOSSIBLE', moteur }
}

/** Déclenche l'invite retenue. Rend `true` si l'utilisateur a accepté. */
export async function proposerInstallation(): Promise<boolean> {
  if (inviteRetenue === null) return false
  try {
    await inviteRetenue.prompt()
    const choix = await inviteRetenue.userChoice
    inviteRetenue = null
    return choix.outcome === 'accepted'
  } catch {
    inviteRetenue = null
    return false
  }
}

/**
 * ⚠️ AUCUN POINT D'ENTRÉE DE SIMULATION N'EST EXPOSÉ ICI, ET C'EST DÉLIBÉRÉ.
 * `beforeinstallprompt` est un événement ordinaire du `window` : la suite de
 * navigateur en fabrique un et le distribue **depuis la page**, sans que le
 * produit ait à porter une porte dérobée de test. Un export qui n'aurait que des
 * appelants de test est exactement ce que la porte P-06 doit refuser.
 */
