import { v7 as uuidV7 } from 'uuid'

import type { EtatRubrique } from '~/core/accueil/composerAccueil'
import { CLE_DUREE_GARDE_COMPTOIR, lireParametreEntier } from '~/core/configuration/configuration'
import type { EtatPastille } from '~/core/design-system/etatsPastille'
import type { EchecDomaine, ResultatDomaine } from '~/core/donnees/contrat'
import { fournisseur } from '~/core/donnees/fournisseur'
import { decale, instantAutorite, maintenantAppareil } from '~/core/donnees/horloge'
import type { PassageEnregistre } from '~/core/donnees/hebergement/interface'
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

/** Ce qui se libère, et quand — l'état « tout est pris » en dépend. */
export interface LiberationAffichee {
  readonly codeUnite: string
  readonly uniteId: string
  readonly libreA: string
  /** ⚠️ La garde déjà posée sur cette chambre, s'il y en a une. */
  readonly tenueJusqua: string | null
}

export interface PassageCompose {
  readonly etat: EtatRubrique
  /**
   * CE QUI SE LIBÈRE — **et c'est ce qui distingue « tout est pris » d'un état
   * vide**. La maison est pleine ; ce n'est pas une panne, et l'écran doit dire
   * quoi faire : attendre telle heure, ou garder la chambre pour le client qui
   * est là.
   */
  readonly liberations: readonly LiberationAffichee[]
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
  liberations: [],
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

/** La garde déjà posée sur une chambre, telle que l'écran la retient. */
function gardeEnCours(compose: PassageCompose, uniteId: string): string | null {
  return compose.liberations.find((l) => l.uniteId === uniteId)?.tenueJusqua ?? null
}

export function usePassage() {
  const { session } = useSession()
  const passage = useState<PassageCompose>('kaya.passage', () => PASSAGE_VIDE)
  const compose = passage

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

    // ⚠️ **UNE FORMULE DE PASSAGE PAR CATÉGORIE, ET LA GRILLE LES MONTRE
    // TOUTES.** Une première version ne retenait qu'une formule et n'affichait
    // donc que les chambres d'une seule catégorie — trois sur dix-sept.
    // **Constaté sur une capture** : la maquette en dessine douze, et une
    // réceptionniste à qui l'on refuserait quatorze chambres sur dix-sept
    // reprendrait son cahier. C'est **la chambre qui décide de la formule**,
    // jamais l'inverse : on choisit une chambre, et son type de chambre porte
    // son tarif de passage.
    const formules = (
      await Promise.all(categories.valeur.map((categorie) => hebergement.listerFormules(categorie.id)))
    )
      .flatMap((resultat) => (resultat.ok ? [...resultat.valeur] : []))
      .filter((candidate) => candidate.type === 'PASSAGE' && candidate.actif)
    if (formules.length === 0) {
      passage.value = { ...PASSAGE_VIDE, etat: 'vide' }
      return
    }

    const depuis = instantAutorite()

    // ⚠️ **LA DISPONIBILITÉ SE LIT SUR LA PLUS COURTE DURÉE DU BARÈME.** Une
    // chambre libre une heure mais pas quatre reste proposable : c'est au tap
    // sur « 4 h » qu'elle sera refusée, avec sa raison. L'inverse — lire sur la
    // plus longue — masquerait des chambres qu'on aurait pu donner.
    const unites = await hebergement.listerUnites(portee)
    const mauvaisesUnites = etatDe(unites)
    if (mauvaisesUnites !== null) {
      passage.value = { ...PASSAGE_VIDE, etat: mauvaisesUnites }
      return
    }
    if (!unites.ok) return

    const chambres: CaseChambre[] = []
    const baremeParFormule = new Map<string, readonly BaremePalier[]>()
    for (const formuleCandidate of formules) {
      const bareme = await hebergement.lireBareme(formuleCandidate.id)
      if (!bareme.ok) continue
      baremeParFormule.set(formuleCandidate.id, bareme.valeur)
      const duree = dureesProposees(bareme.valeur)[0]
      if (duree === undefined) continue
      const periode = { debut: depuis, fin: decale(depuis, duree) }
      const disponibles = await reception.listerUnitesDisponibles(
        portee,
        formuleCandidate.id,
        periode,
      )
      if (!disponibles.ok) continue
      const parId = new Map(disponibles.valeur.map((d) => [d.unite.id, d]))
      for (const unite of unites.valeur) {
        if (unite.categorieId !== formuleCandidate.categorieId) continue
        const libre = parId.get(unite.id)
        chambres.push({
          unite,
          disponible: libre !== undefined,
          etat: libre !== undefined ? 'libre' : 'enCours',
          libreA: null,
          libreJusqua: libre?.libreJusqua ?? null,
        })
      }
    }

    if (chambres.length === 0) {
      passage.value = { ...PASSAGE_VIDE, etat: 'vide' }
      return
    }

    // ⚠️ **ON NE LIT « CE QUI SE LIBÈRE » QUE QUAND TOUT EST PRIS.** Le lire
    // toujours coûterait une lecture à chaque ouverture de l'écran le plus
    // sensible du produit, pour une information que personne ne regarde tant
    // qu'il reste une chambre.
    const toutEstPris = chambres.every((c) => !c.disponible)
    const liberations: LiberationAffichee[] = []
    if (toutEstPris) {
      const prochaines = await reception.listerProchainesLiberations(portee, depuis, 6)
      if (prochaines.ok) {
        for (const liberation of prochaines.valeur) {
          liberations.push({
            codeUnite: liberation.codeUnite,
            uniteId: liberation.uniteId,
            libreA: liberation.libreA,
            tenueJusqua: gardeEnCours(compose.value, liberation.uniteId),
          })
        }
      }
    }

    // ⚠️ **LA CHAMBRE CHOISIE À LA MAIN PRIME SUR LA PROPOSITION**, et elle ne
    // se perd pas au rechargement : sans cela, changer de chambre puis toucher
    // une durée redonnerait la chambre proposée — c'est-à-dire ferait le
    // contraire de ce qu'on vient de demander.
    const choisie = chambres.find((c) => c.unite.id === uniteChoisieId && c.disponible)
    const proposee = choisie ?? chambres.find((c) => c.disponible) ?? null

    // ⚠️ **LE TARIF SUIT LA CHAMBRE.** Les quatre boutons portent le barème de
    // la catégorie de la chambre retenue : changer de chambre peut donc changer
    // les prix, et c'est le comportement juste — une Supérieure B ne se loue pas
    // au tarif d'une Standard.
    const formule =
      formules.find((f) => f.categorieId === proposee?.unite.categorieId) ?? formules[0]!
    const bareme = baremeParFormule.get(formule.id) ?? []
    const durees = proposerDurees(bareme, formule, depuis)

    passage.value = {
      etat: durees.length === 0 || toutEstPris ? 'vide' : 'nominal',
      liberations,
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

  /**
   * DONNER LA CHAMBRE — **le dernier geste, et il enregistre**.
   *
   * ⚠️ **AUCUNE CONFIRMATION.** Ce tap crée l'occupation, ouvre et arrête la
   * note, encaisse et émet la fiche. Ce qui protège n'est pas une question
   * posée avant, c'est **la fenêtre d'annulation de huit secondes** posée
   * après : *demander « êtes-vous sûre ? » vingt fois par jour n'apprend qu'à
   * répondre oui sans lire.*
   *
   * ⚠️ **LE REFUS SE DÉCIDE AU MOMENT DU TAP, JAMAIS AU MOMENT DE
   * L'AFFICHAGE.** La grille montre l'état d'il y a quelques secondes ; entre
   * les deux, un autre poste a pu donner la chambre. C'est la couture qui
   * tranche, à cet instant-là.
   */
  async function donnerLaChambre(dureeMinutes: number): Promise<PassageEnregistre | null> {
    const compose = passage.value
    const etablissementId = etablissementDe(session.value)
    if (compose.formule === null || compose.uniteProposeeId === null || etablissementId === null) {
      return null
    }

    const resultat = await fournisseur().ecrituresReception.enregistrerPassage({
      // ⚠️ UUID **v7**, jamais v4 : les 48 bits de tête portent l'horodatage, et
      // c'est ce qui rend le rejeu ordonnable et le dédoublonnage inoffensif.
      id: uuidV7(),
      etablissementId,
      uniteId: compose.uniteProposeeId,
      formuleId: compose.formule.id,
      dureeMinutes,
      clientId: null,
      horodatageClient: maintenantAppareil().toISOString(),
    })

    if (!resultat.ok) {
      poserRefus(resultat.echec)
      // On recompose : la chambre qui vient d'être prise par un autre poste doit
      // disparaître des cibles **maintenant**, pas au rechargement suivant.
      await composer(compose.uniteProposeeId)
      poserRefus(resultat.echec)
      return null
    }
    poserRefus(null)
    return resultat.valeur
  }

  /** Défait les cinq effets — bornée par la fenêtre d'annulation. */
  async function annuler(occupationId: string): Promise<boolean> {
    const resultat = await fournisseur().ecrituresReception.annulerPassage(occupationId)
    if (!resultat.ok) {
      poserRefus(resultat.echec)
      return false
    }
    await composer(null)
    return true
  }

  /**
   * GARDER LA CHAMBRE — **quinze minutes, lues au catalogue**.
   *
   * ⚠️ **JAMAIS « RÉSERVER ».** Le mot promettrait un engagement que quinze
   * minutes ne portent pas, et il collerait à `RSV`, qui est un autre produit.
   *
   * ⚠️ **ET LA DURÉE NE S'ÉCRIT PAS ICI** : elle vient de
   * `heb.duree_garde_comptoir_minutes`. *Un délai décidé dans un composant
   * serait devenu une constante que personne ne rouvre.*
   */
  async function garderLaChambre(uniteId: string): Promise<string | null> {
    const etablissementId = etablissementDe(session.value)
    const liberation = passage.value.liberations.find((l) => l.uniteId === uniteId)
    if (etablissementId === null || liberation === undefined) return null

    const resultat = await fournisseur().ecrituresReception.garderChambre({
      id: uuidV7(),
      etablissementId,
      uniteId,
      // ⚠️ **À PARTIR DE LA LIBÉRATION, jamais de maintenant** : c'est la
      // chambre qui va se libérer qu'on tient pour le client qui attend.
      aPartirDe: liberation.libreA,
      dureeMinutes: lireParametreEntier(CLE_DUREE_GARDE_COMPTOIR, 15),
      horodatageClient: maintenantAppareil().toISOString(),
    })
    if (!resultat.ok) {
      poserRefus(resultat.echec)
      return null
    }
    const tenueJusqua = resultat.valeur.periode.fin
    passage.value = {
      ...passage.value,
      refus: null,
      liberations: passage.value.liberations.map((liberation) =>
        liberation.uniteId === uniteId ? { ...liberation, tenueJusqua } : liberation,
      ),
    }
    return tenueJusqua
  }

  return { passage, composer, poserRefus, donnerLaChambre, annuler, garderLaChambre }
}
