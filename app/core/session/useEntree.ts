import { fournisseur } from '~/core/donnees/fournisseur'
import { accepteHorsLigne, classeOuDefautStrict } from '~/core/file/classes'
import { reglagesCourants } from '~/core/scenarios/reglages'
import { useSession, type Session } from '~/core/session/useSession'

/**
 * ENTRER DANS L'APPLICATION — **la fonction d'appel**, et c'est elle qui porte
 * la garde hors ligne.
 *
 * ⚠️ LA GARDE VIT ICI, PAS DANS LE COMPOSANT (constitution, principe 6). Un
 * composant qui déciderait lui-même serait un composant à réécrire au premier
 * écran qui refait le même geste, et le second oublierait la garde. Ici, tout
 * appelant l'obtient sans y penser — et il n'y a qu'un endroit à relire pour
 * savoir si elle tient.
 *
 * ⚠️ `compte` EST DE CLASSE **C** AU REGISTRE, et la classe est **lue**, jamais
 * recopiée. Hors ligne, l'entrée n'est pas mise en file « au cas où » : elle est
 * **refusée**, et l'écran l'annonce AVANT la saisie (FR-012). Une entrée mise en
 * file donnerait une session que le serveur n'a jamais accordée.
 *
 * ⚠️ ET LE MOT DE PASSE NE SORT PAS D'ICI. Il traverse cette fonction, entre
 * dans l'interface de domaine, et n'est ni stocké, ni journalisé, ni comparé.
 * Aucune trace n'en subsiste après le retour.
 */

/** L'opération, telle que le registre la nomme. */
const OPERATION_ENTREE = 'compte'

export type ResultatEntree =
  | { readonly entre: true }
  /**
   * ⚠️ `motifCle` EST UNE CLÉ, JAMAIS UNE PHRASE, et elle est branchée sur le
   * **code** d'échec — jamais sur un `message`, qui nommerait des tables et
   * parlerait anglais technique.
   */
  | { readonly entre: false; readonly motifCle: string }

/** Les phrases du lexique, par code. Deux codes, deux phrases, quatre cas. */
const PHRASE_PAR_CODE: Readonly<Record<string, string>> = {
  IDENTIFIANTS_INVALIDES: 'connexion.identifiantsInvalides',
  IDENTIFIANT_ABSENT: 'connexion.identifiantAbsent',
  HORS_LIGNE: 'connexion.horsLigne',
  ECHEC_RESEAU: 'connexion.echecReseau',
}

export function useEntree() {
  const { session, definir } = useSession()

  /**
   * ⚠️ CE N'EST PAS UN DÉTAIL D'AFFICHAGE : c'est la garde elle-même, rendue
   * lisible à l'écran. Le composant ne décide pas, il LIT — et ce qu'il lit,
   * c'est le registre des classes confronté à l'état du réseau.
   */
  const entreePossible = computed(
    () => !reglagesCourants().horsLigne || accepteHorsLigne(classeOuDefautStrict(OPERATION_ENTREE)),
  )

  async function entrer(identifiantSaisi: string, motDePasse: string): Promise<ResultatEntree> {
    // La garde, AVANT toute tentative. Le domaine refuserait aussi — et c'est
    // volontairement redondant : la couche de simulation disparaît en phase 3,
    // cette garde-ci reste.
    if (!entreePossible.value) return { entre: false, motifCle: PHRASE_PAR_CODE.HORS_LIGNE! }

    const resultat = await fournisseur().comptes.identifier(identifiantSaisi, motDePasse)
    if (!resultat.ok) {
      return {
        entre: false,
        motifCle: PHRASE_PAR_CODE[resultat.echec.code] ?? PHRASE_PAR_CODE.ECHEC_RESEAU!,
      }
    }

    /**
     * ⚠️ LA PORTÉE INITIALE EST LE **PREMIER SITE**, ET RIEN D'AUTRE — pas la
     * vue d'ensemble, même pour un propriétaire qui en a trois. La vue
     * d'ensemble est un choix qu'on fait au sélecteur ; l'imposer à l'entrée
     * ferait ouvrir le produit sur un écran d'où **aucune caisse ne se touche**,
     * à quelqu'un qui vient peut-être encaisser. La reprise du dernier site
     * choisi, elle, appartient au sélecteur (FR-032).
     */
    const premier = resultat.valeur.etablissements[0]
    const portee: Session['portee'] =
      premier === undefined ? null : { type: 'etablissement', id: premier.id }

    // ⚠️ LES PERMISSIONS SONT RÉSOLUES POUR **CE SITE**, jamais héritées d'un
    // autre : `resoudrePermissions` est la méthode de F1, inchangée — un droit
    // détenu ailleurs ne suit pas la personne (FR-027). Le poste, lui, est
    // DÉRIVÉ, et il vaut `null` dès qu'il y en a plus d'un.
    let permissions: readonly string[] = []
    let posteUnique: string | null = null
    if (premier !== undefined) {
      const [resolues, poste] = await Promise.all([
        fournisseur().comptes.resoudrePermissions(resultat.valeur.compteId, premier.id),
        fournisseur().comptes.posteUniqueSur(resultat.valeur.compteId, premier.id),
      ])
      if (resolues.ok) permissions = resolues.valeur
      if (poste.ok) posteUnique = poste.valeur
    }

    await definir({ compteId: resultat.valeur.compteId, portee, permissions, posteUnique })
    return { entre: true }
  }

  return { session, entrer, entreePossible }
}
