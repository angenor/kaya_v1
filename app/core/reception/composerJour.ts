import type { EtatRubrique } from '~/core/accueil/composerAccueil'
import type { EtatPastille } from '~/core/design-system/etatsPastille'
import type { ResultatDomaine } from '~/core/donnees/contrat'
import { fournisseur } from '~/core/donnees/fournisseur'
import { decale, instantAutorite } from '~/core/donnees/horloge'
import type { Occupation, Unite } from '~/core/donnees/hebergement/types'
import { etablissementDe, useSession } from '~/core/session/useSession'

/**
 * `R2` · LA VUE DU JOUR — **ce qui retient, et rien d'autre**.
 *
 * ⚠️ **LA PAGE N'EST QU'UN ASSEMBLAGE.** Même partage qu'à `R1`, et pour la
 * même raison : ce fichier lit, croise et décide ; la page rend. *Un écran qui
 * décide lui-même n'est pas un motif — c'est un cas particulier que le suivant
 * recopiera de travers.*
 *
 * ⚠️ **AUCUNE HORLOGE N'EST LUE ICI.** L'instant vient de la couture, et la
 * règle ESLint (e) le vérifie. Une vue « du jour » calculée sur l'horloge d'un
 * terminal changerait de jour selon le poste.
 *
 * ⚠️ **ET IL NE SUPPOSE PAS QUE L'ÉTABLISSEMENT A DE L'HÉBERGEMENT.** Sur
 * « Résidence Test », les lectures rendent des listes vides et l'écran montre
 * son état vide — jamais une erreur, jamais un cadre nu.
 */

/** Une chambre, telle que la grille du jour la montre. */
export interface ChambreDuJour {
  readonly unite: Unite
  /** ⚠️ **Dérivé de l'occupation, jamais posé à la main** (HEB-06). */
  readonly libre: boolean
  readonly etat: EtatPastille
  /** L'instant où elle se libère, quand elle est prise. */
  readonly libreA: string | null
}

export interface JourCompose {
  readonly etat: EtatRubrique
  readonly chambres: readonly ChambreDuJour[]
  readonly libres: number
  readonly occupees: number
  /** Les départs attendus d'ici la fin de la journée. */
  readonly departsAttendus: number
}

const JOUR_VIDE: JourCompose = {
  etat: 'chargement',
  chambres: [],
  libres: 0,
  occupees: 0,
  departsAttendus: 0,
}

/**
 * L'état d'une rubrique à partir d'un résultat de domaine.
 *
 * ⚠️ **HORS LIGNE N'EST PAS UNE ERREUR, ET LES CONFONDRE COÛTE LA PHRASE.** Un
 * bandeau rouge ferait croire à une panne du produit là où il n'y a qu'une
 * coupure — et l'exploitant appellerait le support au lieu d'attendre.
 */
function etatDe(resultat: ResultatDomaine<unknown>): EtatRubrique | null {
  if (resultat.ok) return null
  if (resultat.echec.code === 'HORS_LIGNE') return 'horsLigne'
  return 'erreur'
}

/** L'état de pastille d'une chambre — le vocabulaire de formes du composant 04. */
function pastilleDe(occupation: Occupation | null, unite: Unite): EtatPastille {
  if (occupation !== null) return 'enCours'
  // ⚠️ `MAINTENANCE` EST UN ÉTAT DE MÉNAGE, jamais une indisponibilité : celle-ci
  // est une occupation. Les confondre produirait deux mécanismes concurrents.
  if (unite.statutMenage === 'MAINTENANCE') return 'casse'
  if (unite.statutMenage === 'A_NETTOYER') return 'attente'
  return 'libre'
}

export function useJour() {
  const { session } = useSession()
  const jour = useState<JourCompose>('kaya.jour', () => JOUR_VIDE)

  async function composer(): Promise<void> {
    const etablissementId = etablissementDe(session.value)
    if (etablissementId === null) {
      jour.value = { ...JOUR_VIDE, etat: 'absente' }
      return
    }

    jour.value = { ...JOUR_VIDE, etat: 'chargement' }
    const portee = { etablissementId }
    const { hebergement, reception } = fournisseur()

    const [unites, occupations] = await Promise.all([
      hebergement.listerUnites(portee),
      // ⚠️ **LA PÉRIODE VA DE MAINTENANT À LA FIN DU LENDEMAIN**, et non « du
      // jour » : une nuitée arrivée hier occupe la chambre aujourd'hui, et une
      // fenêtre calée sur minuit la ferait disparaître de la grille à
      // l'instant où la réception en a le plus besoin.
      reception.listerOccupations(portee, fenetreDuJour()),
    ])

    const mauvais = etatDe(unites) ?? etatDe(occupations)
    if (mauvais !== null) {
      jour.value = { ...JOUR_VIDE, etat: mauvais }
      return
    }
    if (!unites.ok || !occupations.ok) return

    const maintenant = fenetreDuJour().debut
    const chambres: readonly ChambreDuJour[] = unites.valeur.map((unite) => {
      const occupation =
        occupations.valeur.find(
          (o) =>
            o.uniteId === unite.id &&
            o.statut !== 'ANNULEE' &&
            o.periodeIndisponibilite.debut <= maintenant &&
            o.periodeIndisponibilite.fin > maintenant,
        ) ?? null
      return {
        unite,
        libre: occupation === null,
        etat: pastilleDe(occupation, unite),
        libreA: occupation?.periodeIndisponibilite.fin ?? null,
      }
    })

    const finDuJour = fenetreDuJour().fin
    jour.value = {
      etat: chambres.length === 0 ? 'vide' : 'nominal',
      chambres,
      libres: chambres.filter((c) => c.libre).length,
      occupees: chambres.filter((c) => !c.libre).length,
      departsAttendus: chambres.filter((c) => c.libreA !== null && c.libreA <= finDuJour).length,
    }
  }

  return { jour, composer }
}

/**
 * La fenêtre que la vue du jour lit — **de maintenant à la fin du lendemain**.
 *
 * ⚠️ **DE MAINTENANT, ET NON DE MINUIT.** Une nuitée arrivée hier occupe la
 * chambre aujourd'hui ; une fenêtre calée sur le jour civil la ferait
 * disparaître de la grille à l'instant où la réception en a le plus besoin.
 *
 * ⚠️ **ET ELLE VIT ICI, PAS DANS LA PAGE** : une page n'a pas le droit de lire
 * une horloge, et la règle ESLint (e) le vérifie.
 */
function fenetreDuJour() {
  const debut = instantAutorite()
  return { debut, fin: decale(debut, 36 * 60) }
}
