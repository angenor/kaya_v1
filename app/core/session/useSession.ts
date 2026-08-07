import { MAGASIN_SESSION, ecrire, lire } from '~/core/stockage/base'

/**
 * LA SESSION — qui agit, et depuis où.
 *
 * ⚠️ AUCUN JETON, AUCUN SECRET. La session ne porte que ce que l'en-tête
 * affirme : le compte actif, la portée, les permissions résolues et le poste
 * quand il est dérivable. Rien de tout cela n'est une preuve d'identité — la
 * sécurité repose sur le serveur, jamais sur une promesse du client
 * (constitution, principe 9).
 *
 * Elle est persistée en IndexedDB et **reprise à chaque navigation, la première
 * comprise** (FR-033) : c'est ce que l'intergiciel global fait.
 */

/**
 * LA PORTÉE — l'établissement courant, **ou la vue d'ensemble**.
 *
 * ⚠️ LE TROISIÈME ÉTAT DU SÉLECTEUR EST UNE STRUCTURE, PAS UN `null`. La
 * session de F1 portait `etablissementId: string | null`, où `null` signifiait
 * **« aucun choix fait »** — c'est cette valeur qui déclenche la reprise.
 * Réutiliser le même `null` pour « tous les sites » rendrait les deux états
 * **indiscernables**, et l'accueil d'un compte fraîchement connecté afficherait
 * la vue d'ensemble d'un propriétaire. Le bogue serait silencieux et arriverait
 * au pire moment : à la première ouverture, devant quelqu'un qui découvre le
 * produit.
 *
 * `portee` vaut donc `null` tant que rien n'a été choisi, et **jamais** pour
 * dire « tous ».
 */
export type PorteeSession =
  | { readonly type: 'etablissement'; readonly id: string }
  | { readonly type: 'tous' }

export interface Session {
  /** Le compte actif. `null` avant toute entrée. */
  readonly compteId: string | null
  /** L'établissement courant, la vue d'ensemble, ou `null` : aucun choix fait. */
  readonly portee: PorteeSession | null
  /** L'UNION des permissions des rôles du compte SUR CETTE PORTÉE. */
  readonly permissions: readonly string[]
  /**
   * Le nom du poste, **ou `null`**.
   *
   * ⚠️ JAMAIS « PLUSIEURS ». Le modèle ne porte aucun lien
   * `compte → point_de_vente` : le poste est un **calcul**, et il ne rend un
   * résultat que lorsqu'il est sans ambiguïté. Le second segment de l'en-tête
   * **affirme un fait** ; l'affirmer sans le savoir est un mensonge que six
   * cycles hériteraient.
   */
  readonly posteUnique: string | null
}

export const SESSION_VIDE: Session = {
  compteId: null,
  portee: null,
  permissions: [],
  posteUnique: null,
}

/**
 * L'établissement de la portée, ou `null` — pour la vue d'ensemble **comme**
 * pour l'absence de choix.
 *
 * ⚠️ ELLE EXISTE POUR QUE LES APPELANTS N'AIENT PAS À DISTINGUER CE QUI NE LES
 * REGARDE PAS. Une lecture paramétrée par l'établissement n'a rien à faire sous
 * la portée « tous » : les deux cas se traitent pareil — on ne lit pas. Ce qui
 * doit distinguer les deux, c'est l'en-tête et la composition de l'accueil, et
 * eux lisent `portee` directement.
 */
export function etablissementDe(session: Session): string | null {
  return session.portee?.type === 'etablissement' ? session.portee.id : null
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
      const persistee = await lire<Session>(MAGASIN_SESSION, CLE_SESSION, SESSION_VIDE)
      // Les clés manquantes d'une version antérieure reprennent leur valeur
      // initiale : une session persistée ne doit jamais empêcher l'application
      // de démarrer. C'est le même traitement que les réglages de scénario.
      session.value = { ...SESSION_VIDE, ...persistee }
      reprise.value = true
    }
    return session.value
  }

  /** Remplace la session et la persiste. */
  async function definir(nouvelle: Session): Promise<void> {
    session.value = nouvelle
    reprise.value = true
    await ecrire(MAGASIN_SESSION, CLE_SESSION, nouvelle)
  }

  return { session, reprise, reprendre, definir }
}
