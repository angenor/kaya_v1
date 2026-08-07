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

  return { disponible, versionEnAttente, installer, recharger }
}
