import {
  appliquerNouvelleVersion,
  enregistrerCoquille,
  serviceWorkerDisponible,
} from '~/core/plateforme/web/serviceWorker'

/**
 * L'ÉTAT DE LA COQUILLE, tel que l'interface le lit.
 *
 * ⚠️ CE COMPOSABLE NE SAIT PAS CE QU'EST UN SERVICE WORKER, et c'est voulu : il
 * parle d'une COQUILLE, d'une VERSION NOUVELLE et d'un RECHARGEMENT. Le jour où
 * Capacitor remplace la PWA, l'implémentation change dessous et aucun écran ne
 * s'en aperçoit.
 */
export function useCoquille() {
  const disponible = useState<boolean>('kaya.coquille.disponible', () => false)
  const versionEnAttente = useState<boolean>('kaya.coquille.versionEnAttente', () => false)

  async function installer(): Promise<void> {
    disponible.value = serviceWorkerDisponible()
    if (!disponible.value) return
    await enregistrerCoquille(() => {
      versionEnAttente.value = true
    })
  }

  async function recharger(): Promise<void> {
    await appliquerNouvelleVersion()
  }

  /**
   * ⚠️ LE PANNEAU SCÉNARIOS APPELLE CECI, ET C'EST SA RAISON D'ÊTRE. Une version
   * nouvelle n'arrive qu'après un déploiement : sans levier, l'invite de FR-017
   * ne s'exercerait **sur aucun moteur**, ni à la démonstration ni au test.
   * L'instrument met l'application dans une condition qu'on ne sait pas produire
   * autrement — c'est exactement ce à quoi il sert.
   *
   * ⚠️ ET IL N'INVENTE RIEN : il pose le MÊME drapeau que le service worker, et
   * l'interface répond de la même façon. Ce qui est simulé, c'est l'arrivée de
   * la version — pas la réponse du produit.
   */
  function annoncerVersionEnAttente(enAttente: boolean): void {
    versionEnAttente.value = enAttente
  }

  return { disponible, versionEnAttente, installer, recharger, annoncerVersionEnAttente }
}
