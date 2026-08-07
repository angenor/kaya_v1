import {
  etatInstallation,
  proposerInstallation,
  surInviteInstallation,
  type VoieInstallation,
} from '~/core/plateforme/web/installation'
import {
  CLE_INVITATION_ECARTEE,
  ecrirePreference,
  lirePreference,
} from '~/core/plateforme/web/preferenceAppareil'

/**
 * L'INSTALLATION, TELLE QUE L'INTERFACE LA LIT.
 *
 * ⚠️ CE COMPOSABLE NE SAIT PAS CE QU'EST UN `beforeinstallprompt`, et c'est
 * voulu : il parle d'une **voie** — l'invite du moteur, le menu de partage, ou
 * rien. Le jour où Capacitor remplace la PWA, l'implémentation change dessous et
 * aucun écran ne s'en aperçoit.
 */
export function useInstallation() {
  const voie = useState<VoieInstallation>('kaya.installation.voie', () => 'IMPOSSIBLE')
  const ecartee = useState<boolean>('kaya.installation.ecartee', () => false)

  function relire(): void {
    voie.value = etatInstallation().voie
    ecartee.value = lirePreference(CLE_INVITATION_ECARTEE) === 'oui'
  }

  /** Commence à écouter. Rend de quoi cesser — le gabarit s'en sert au démontage. */
  function surveiller(): () => void {
    relire()
    return surInviteInstallation(relire)
  }

  async function installer(): Promise<void> {
    await proposerInstallation()
    relire()
  }

  /**
   * ⚠️ L'INVITATION SE RANGE POUR DE BON, SUR CET APPAREIL. Sur WebKit aucune
   * bannière ne se déclenche jamais : sans cela, le bandeau serait permanent sur
   * chaque écran — et un bandeau permanent cesse d'être lu.
   */
  function ecarter(): void {
    ecrirePreference(CLE_INVITATION_ECARTEE, 'oui')
    ecartee.value = true
  }

  return { voie, ecartee, surveiller, installer, ecarter }
}
