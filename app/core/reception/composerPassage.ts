import type { EtatRubrique } from '~/core/accueil/composerAccueil'
import type { EtatPastille } from '~/core/design-system/etatsPastille'
import type { EchecDomaine, ResultatDomaine } from '~/core/donnees/contrat'
import { fournisseur } from '~/core/donnees/fournisseur'
import { decale, instantAutorite } from '~/core/donnees/horloge'
import type { BaremePalier, Formule, Unite } from '~/core/donnees/hebergement/types'
import { dureesProposees, prixDeLaDuree } from '~/core/reception/bareme'
import { etablissementDe, useSession } from '~/core/session/useSession'

/**
 * `R4` · LE PASSAGE — **ce que l'écran doit savoir avant le premier tap**.
 *
 * ⚠️ **TOUT EST PRÊT AVANT QUE LA RÉCEPTIONNISTE TOUCHE QUOI QUE CE SOIT.** Les
 * quatre durées, leurs prix, leurs heures de fin et **la chambre proposée** sont
 * calculés au chargement. C'est ce qui rend le parcours à **trois taps**
 * possible : un écran qui demanderait d'abord la chambre, puis la durée, puis
 * une confirmation en coûterait cinq — et le passage serait contourné.
 *
 * ⚠️ **AUCUN MONTANT N'EST ÉCRIT ICI.** Les prix viennent du barème du
 * référentiel, les durées aussi : `R4` affiche quatre boutons parce que Deloria
 * a quatre paliers. *Un établissement qui en déclarerait trois en verrait
 * trois.*
 *
 * ⚠️ **ET AUCUNE HORLOGE N'EST LUE PAR LA PAGE.** L'instant vient de la
 * couture — c'est lui qui décide de l'heure de fin, donc du montant, donc de ce
 * que le client paye.
 */

/** Une durée proposée, avec **tout ce que le bouton affiche**. */
export interface DureeProposee {
  readonly minutes: number
  /** Le montant, entier en unité mineure — formaté par l'écran, jamais ici. */
  readonly montant: number
  readonly codeDevise: string
  /** L'instant de fin, si cette durée est choisie. */
  readonly fin: string
}

/** Une chambre de la grille, et **si elle est réellement touchable**. */
export interface CaseChambre {
  readonly unite: Unite
  /** ⚠️ **Seules les disponibles sont touchables** — jamais grisées : absentes
   *  de la liste des cibles, présentes à l'écran comme information. */
  readonly disponible: boolean
  readonly etat: EtatPastille
  /** L'instant où elle se libère, quand elle est prise. */
  readonly libreA: string | null
  /** Jusqu'à quand elle reste libre, quand une occupation suit. */
  readonly libreJusqua: string | null
}

export interface PassageCompose {
  readonly etat: EtatRubrique
  readonly durees: readonly DureeProposee[]
  readonly chambres: readonly CaseChambre[]
  /**
   * LA CHAMBRE PROPOSÉE — **choisie par le domaine, pas par la réceptionniste**.
   *
   * ⚠️ **C'EST ELLE QUI ÉCONOMISE LE TAP DE LA CHAMBRE.** Sans proposition, le
   * parcours passerait de trois à quatre gestes, et le budget P1 serait
   * dépassé dès le premier écran.
   */
  readonly uniteProposeeId: string | null
  /** Pourquoi cette chambre — clé i18n, ou `null` quand il n'y a pas de motif. */
  readonly motifPropositionCle: string | null
  /** La formule de passage retenue, pour l'écriture. */
  readonly formule: Formule | null
  /** Ce qui a été refusé, s'il y a lieu. Rendu par le composant 07. */
  readonly refus: EchecDomaine | null
}

const PASSAGE_VIDE: PassageCompose = {
  etat: 'chargement',
  durees: [],
  chambres: [],
  uniteProposeeId: null,
  motifPropositionCle: null,
  formule: null,
  refus: null,
}

function etatDe(resultat: ResultatDomaine<unknown>): EtatRubrique | null {
  if (resultat.ok) return null
  if (resultat.echec.code === 'HORS_LIGNE') return 'horsLigne'
  return 'erreur'
}

/**
 * Les durées proposées, **avec leur prix et leur heure de fin**.
 *
 * ⚠️ **L'HEURE DE FIN EST SUR LE BOUTON, ET C'EST LA MAQUETTE QUI LE DIT** :
 * « jusqu'à 16 h 30 ». Une durée seule oblige à faire le calcul de tête devant
 * le client ; l'heure de fin est ce qu'on lui annonce à voix haute.
 */
function proposerDurees(
  bareme: readonly BaremePalier[],
  formule: Formule,
  depuis: string,
): readonly DureeProposee[] {
  return dureesProposees(bareme).flatMap((minutes) => {
    const issue = prixDeLaDuree(bareme, formule, minutes)
    if (issue === null || issue.bascule) return []
    return [
      {
        minutes,
        montant: issue.prix.montant,
        codeDevise: issue.prix.codeDevise,
        fin: decale(depuis, minutes),
      },
    ]
  })
}

export function usePassage() {
  const { session } = useSession()
  const passage = useState<PassageCompose>('kaya.passage', () => PASSAGE_VIDE)

  async function composer(uniteChoisieId: string | null = null): Promise<void> {
    const etablissementId = etablissementDe(session.value)
    if (etablissementId === null) {
      passage.value = { ...PASSAGE_VIDE, etat: 'absente' }
      return
    }

    passage.value = { ...PASSAGE_VIDE, etat: 'chargement' }
    const portee = { etablissementId }
    const { hebergement, reception } = fournisseur()

    const categories = await hebergement.listerCategories(portee)
    const mauvaisesCategories = etatDe(categories)
    if (mauvaisesCategories !== null) {
      passage.value = { ...PASSAGE_VIDE, etat: mauvaisesCategories }
      return
    }
    if (!categories.ok) return

    // ⚠️ **LA FORMULE DE PASSAGE VIENT DU RÉFÉRENTIEL, jamais d'un identifiant
    // écrit dans l'écran.** Un établissement sans formule de passage n'a rien à
    // montrer ici — et il le dit, au lieu d'afficher quatre boutons muets.
    const formules = await Promise.all(
      categories.valeur.map((categorie) => hebergement.listerFormules(categorie.id)),
    )
    const formule =
      formules
        .flatMap((resultat) => (resultat.ok ? [...resultat.valeur] : []))
        .find((candidate) => candidate.type === 'PASSAGE' && candidate.actif) ?? null
    if (formule === null) {
      passage.value = { ...PASSAGE_VIDE, etat: 'vide' }
      return
    }

    const depuis = instantAutorite()
    const bareme = await hebergement.lireBareme(formule.id)
    if (!bareme.ok) {
      passage.value = { ...PASSAGE_VIDE, etat: etatDe(bareme) ?? 'erreur' }
      return
    }
    const durees = proposerDurees(bareme.valeur, formule, depuis)
    if (durees.length === 0) {
      passage.value = { ...PASSAGE_VIDE, etat: 'vide', formule }
      return
    }

    // ⚠️ **LA DISPONIBILITÉ SE LIT SUR LA PLUS COURTE DURÉE.** Une chambre libre
    // une heure mais pas quatre reste proposable : c'est au tap sur « 4 h »
    // qu'elle sera refusée, avec sa raison. L'inverse — lire sur la plus longue
    // — masquerait des chambres qu'on aurait pu donner.
    const periode = { debut: depuis, fin: durees[0]!.fin }
    const [unites, disponibles] = await Promise.all([
      hebergement.listerUnites(portee),
      reception.listerUnitesDisponibles(portee, formule.id, periode),
    ])
    const mauvais = etatDe(unites) ?? etatDe(disponibles)
    if (mauvais !== null) {
      passage.value = { ...PASSAGE_VIDE, etat: mauvais }
      return
    }
    if (!unites.ok || !disponibles.ok) return

    const parId = new Map(disponibles.valeur.map((d) => [d.unite.id, d]))
    const chambres: readonly CaseChambre[] = unites.valeur
      .filter((unite) => unite.categorieId === formule.categorieId)
      .map((unite) => {
        const libre = parId.get(unite.id)
        return {
          unite,
          disponible: libre !== undefined,
          etat: libre !== undefined ? 'libre' : 'enCours',
          libreA: null,
          libreJusqua: libre?.libreJusqua ?? null,
        }
      })

    // ⚠️ **LA CHAMBRE CHOISIE À LA MAIN PRIME SUR LA PROPOSITION**, et elle ne
    // se perd pas au rechargement : sans cela, changer de chambre puis toucher
    // une durée redonnerait la chambre proposée — c'est-à-dire ferait le
    // contraire de ce qu'on vient de demander.
    const choisie = chambres.find((c) => c.unite.id === uniteChoisieId && c.disponible)
    const proposee = choisie ?? chambres.find((c) => c.disponible) ?? null

    passage.value = {
      etat: chambres.every((c) => !c.disponible) ? 'vide' : 'nominal',
      durees,
      chambres,
      uniteProposeeId: proposee?.unite.id ?? null,
      // ⚠️ **UN MOTIF QUAND IL Y EN A UN, `null` SINON.** Inventer « la
      // première libre » comme motif serait décrire l'algorithme au lieu
      // d'expliquer le choix — et l'utilisateur apprendrait à ne plus lire.
      motifPropositionCle: choisie !== undefined ? 'passage.motifChoisie' : null,
      formule,
      refus: null,
    }
  }

  /** Pose un refus à l'écran, sans recomposer — le composant 07 le rend. */
  function poserRefus(echec: EchecDomaine | null): void {
    passage.value = { ...passage.value, refus: echec }
  }

  return { passage, composer, poserRefus }
}
