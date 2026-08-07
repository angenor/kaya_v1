/**
 * L'ENREGISTREMENT DU SERVICE WORKER — le seul endroit du produit qui touche
 * `navigator.serviceWorker`.
 *
 * ⚠️ IL VIT DANS `app/core/plateforme/` PARCE QUE CAPACITOR NE L'AURA PAS. Un
 * service worker est une capacité du web, et rien d'autre : l'application native
 * embarque ses actifs, donc elle n'a ni installation ni révision à surveiller.
 * L'y confiner est ce qui rendra le passage mécanique — l'implémentation
 * Capacitor rendra simplement « aucune coquille à mettre à jour ».
 *
 * ⚠️ ET RIEN DE MÉTIER N'ENTRE ICI (FR-016). Ce fichier enregistre, écoute, et
 * demande le remplacement quand on le lui dit. Il ne décide de rien.
 */

/** L'état de la coquille, tel que l'interface a besoin de le connaître. */
export interface EtatCoquille {
  /** Le service worker est enregistré et contrôle la page. */
  readonly installee: boolean
  /** Une version nouvelle attend, et l'interface doit PROPOSER de recharger. */
  readonly versionEnAttente: boolean
}

export const COQUILLE_ABSENTE: EtatCoquille = { installee: false, versionEnAttente: false }

const CHEMIN_SERVICE_WORKER = '/sw.js'

/** Le moteur sait-il enregistrer un service worker ? */
export function serviceWorkerDisponible(): boolean {
  try {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  } catch {
    return false
  }
}

/**
 * Enregistre la coquille et prévient quand une version nouvelle attend.
 *
 * ⚠️ AUCUN RECHARGEMENT D'OFFICE. Le service worker est en `registerType:
 * 'prompt'` et `skipWaiting: false` : la version nouvelle ATTEND. Recharger sans
 * demander ferait disparaître une saisie en cours au comptoir ; se taire ferait
 * tourner un correctif de facturation sur un appareil qui ne l'a jamais pris.
 */
export async function enregistrerCoquille(
  surVersionEnAttente: () => void,
): Promise<ServiceWorkerRegistration | null> {
  if (!serviceWorkerDisponible()) return null
  try {
    const enregistrement = await navigator.serviceWorker.register(CHEMIN_SERVICE_WORKER, {
      scope: '/',
      updateViaCache: 'none',
    })

    if (enregistrement.waiting) surVersionEnAttente()

    enregistrement.addEventListener('updatefound', () => {
      const arrivant = enregistrement.installing
      if (!arrivant) return
      arrivant.addEventListener('statechange', () => {
        // « installed » avec un contrôleur déjà en place signifie : une version
        // nouvelle est prête ET une ancienne tourne. C'est le seul cas où l'on
        // propose de recharger — sur une première installation, il n'y a rien à
        // remplacer.
        if (arrivant.state === 'installed' && navigator.serviceWorker.controller) {
          surVersionEnAttente()
        }
      })
    })

    return enregistrement
  } catch {
    // Un enregistrement refusé — origine non sécurisée, navigation privée sur
    // certains moteurs — n'est pas une panne : l'application fonctionne, elle ne
    // s'ouvrira simplement pas hors ligne. C'est un fait à afficher, pas un
    // bogue à corriger.
    return null
  }
}

/** Demande au service worker en attente de prendre la main, puis recharge. */
export async function appliquerNouvelleVersion(): Promise<void> {
  if (!serviceWorkerDisponible()) return
  try {
    const enregistrement = await navigator.serviceWorker.getRegistration('/')
    enregistrement?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    await new Promise<void>((resoudre) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resoudre(), { once: true })
      // Le remplacement peut ne jamais venir — moteur exotique, service worker
      // déjà parti. On ne bloque pas l'utilisateur pour autant.
      setTimeout(resoudre, 3000)
    })
    window.location.reload()
  } catch {
    window.location.reload()
  }
}
