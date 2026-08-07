import { MAGASIN_SESSION, ecrire, lire } from '~/core/stockage/base'

/**
 * LA SESSION — qui agit, et depuis quel établissement.
 *
 * ⚠️ AUCUN ÉCRAN DE CONNEXION DANS CE CYCLE, et ce n'est pas un oubli. La phase
 * 2 n'a pas de serveur : il n'y a rien à authentifier. Le compte actif se
 * choisit au panneau **Scénarios**, qui est un INSTRUMENT et non le produit —
 * `R0` (l'écran de connexion) est l'un des 46 écrans du produit, dérivé de `G2`,
 * et il appartient au cycle qui le construira.
 *
 * ⚠️ AUCUN JETON, AUCUN SECRET. La session ne porte que trois choses : le
 * compte actif, l'établissement actif, et les permissions résolues. Rien de tout
 * cela n'est une preuve d'identité — la sécurité repose sur le serveur, jamais
 * sur une promesse du client (constitution, principe 9).
 *
 * Elle est persistée en IndexedDB et **reprise à chaque navigation, la première
 * comprise** (FR-033) : c'est ce que l'intergiciel global fait.
 */

export interface Session {
  /** Le compte actif, choisi au panneau Scénarios. `null` avant tout choix. */
  readonly compteId: string | null
  /** L'établissement actif. `null` avant tout choix. */
  readonly etablissementId: string | null
  /** L'UNION des permissions des rôles du compte SUR CET ÉTABLISSEMENT. */
  readonly permissions: readonly string[]
}

export const SESSION_VIDE: Session = {
  compteId: null,
  etablissementId: null,
  permissions: [],
}

const CLE_SESSION = 'courante'

export function useSession() {
  const session = useState<Session>('kaya.session', () => SESSION_VIDE)
  const reprise = useState<boolean>('kaya.session.reprise', () => false)

  /**
   * Reprend la session persistée. Appelée par l'intergiciel global à CHAQUE
   * navigation, la première comprise.
   *
   * ⚠️ ELLE EST IDEMPOTENTE ET NE RELIT LE STOCKAGE QU'UNE FOIS. Relire
   * IndexedDB à chaque navigation ajouterait une attente asynchrone sur un
   * chemin fréquent, pour une donnée qui n'a pas changé. Ce qui doit s'exécuter
   * à chaque navigation, c'est la REPRISE — pas la lecture disque.
   */
  async function reprendre(): Promise<Session> {
    if (!reprise.value) {
      session.value = await lire<Session>(MAGASIN_SESSION, CLE_SESSION, SESSION_VIDE)
      reprise.value = true
    }
    return session.value
  }

  /** Remplace la session et la persiste. Employée par le panneau Scénarios. */
  async function definir(nouvelle: Session): Promise<void> {
    session.value = nouvelle
    reprise.value = true
    await ecrire(MAGASIN_SESSION, CLE_SESSION, nouvelle)
  }

  return { session, reprise, reprendre, definir }
}
