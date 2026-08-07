import { SURFACES_ACCUEIL, type FamilleSurface, type SurfaceAccueil } from '~/core/accueil/surfaces'
import type { ResultatDomaine } from '~/core/donnees/contrat'
import { fournisseur } from '~/core/donnees/fournisseur'
import type {
  ActiviteAccueil,
  CarteAReglerAccueil,
  ChiffreAccueil,
  LigneSuiteAccueil,
  TeteAccueil,
} from '~/core/donnees/accueil/types'
import { useAutorisation } from '~/core/session/useAutorisation'
import { etablissementDe, useSession } from '~/core/session/useSession'

/**
 * LE FILTRAGE — **la seule fonction de `R1` qui retient**.
 *
 * ⚠️ ELLE APPELLE `useAutorisation.retenir()` DE F1, **INCHANGÉE**. Elle
 * suffisait déjà, et c'est le meilleur signe que F1 a posé la bonne
 * abstraction : deux conditions cumulées — la permission détenue **sur cet
 * établissement**, et l'activité du module **sur cet établissement**.
 *
 * ⚠️ AVOIR LE DROIT NE SUFFIT PAS SI LE SERVICE N'EXISTE PAS ICI. Adjoua a le
 * droit d'appliquer une remise, et il n'y a pas de restaurant à Résidence Test :
 * la surface est **absente du HTML**, pas grisée.
 *
 * ⚠️ ET IL N'EXISTE **AUCUN** `if (variante === 'maquis')` DANS CE FICHIER. Les
 * quatre accueils maquettés sont le même code rendant des ensembles de surfaces
 * différents. C'est le test de vérité du cycle : si une variante exigeait une
 * branche, l'accueil d'un maquis serait un hôtel amputé.
 */

/**
 * L'état d'une rubrique. Les cinq — parce que « absente » et « vide » ne sont
 * **pas** la même chose, et que les confondre coûte l'une des deux règles.
 *
 * - `absente` : **aucune surface retenue**. La rubrique disparaît **avec son
 *   titre** (FR-015) — un intitulé sans contenu est un reste de mise en page.
 * - `vide` : des surfaces sont retenues, la source ne rend rien. La rubrique
 *   porte son **état vide illustré**, qui dit ce qui viendra s'y loger (FR-021).
 *
 * Sur le maquis, « Vos activités » relève du premier cas ; sur un hôtel qui
 * ouvre, « Ensuite » relève du second. Rendre un cadre vide au premier ferait
 * de l'accueil d'un maquis un hôtel amputé ; effacer la rubrique au second
 * ferait croire que la fonction n'existe pas.
 */
export type EtatRubrique = 'chargement' | 'nominal' | 'vide' | 'absente' | 'erreur' | 'horsLigne'

export interface Rubrique<T> {
  readonly etat: EtatRubrique
  readonly contenu: T
  /** La clé i18n du titre — lue à la surface, jamais écrite dans la page. */
  readonly titreCle: string | null
}

export interface AccueilCompose {
  readonly tete: Rubrique<TeteAccueil | null>
  readonly suite: Rubrique<readonly LigneSuiteAccueil[]>
  readonly aRegler: Rubrique<readonly CarteAReglerAccueil[]>
  readonly activites: Rubrique<readonly ActiviteAccueil[]>
  readonly chiffres: Rubrique<readonly ChiffreAccueil[]>
}

/**
 * ⚠️ DEUX FAMILLES SONT **EXCLUSIVES** : une seule de leurs surfaces est retenue
 * par écran, la première déclarée qui passe le filtrage.
 *
 * Pour `tete`, c'est FR-016 littéralement — **une seule action principale**, et
 * « ajouter trois actions faute d'avoir tranché laquelle compte » est la faute
 * que la règle nomme. Pour `chiffre`, c'est la même chose vue autrement : un
 * écran porte **un** bloc de chiffres — « Aujourd'hui », « Ce soir », « Les deux
 * ensemble » —, jamais deux empilés. Sans cette exclusivité, Adjoua, qui a le
 * pilotage **et** le service, verrait cinq cartes au lieu de trois : le total de
 * ses tables sous la recette de l'hôtel, deux échelles dans une seule rubrique.
 */
const FAMILLES_EXCLUSIVES: readonly FamilleSurface[] = ['tete', 'chiffre']

/**
 * ⚠️ « VOS ACTIVITÉS » DISPARAÎT QUAND ELLE EST VIDE, elle ne montre pas d'état
 * vide. C'est la règle propre de la famille au contrat : *« une liste à un
 * élément qui ne mène nulle part est un reste de mise en page »*. Sur le maquis,
 * c'est exactement ce qui doit se produire — et c'est la différence entre un
 * accueil conçu pour un maquis et un hôtel amputé.
 */
const FAMILLES_QUI_DISPARAISSENT_VIDES: readonly FamilleSurface[] = ['activite']

/** ⚠️ JAMAIS PLUS DE TROIS CARTES — règle du composant 07, portée ici. */
const MAXIMUM_A_REGLER = 3

function rubriqueInitiale<T>(contenu: T): Rubrique<T> {
  return { etat: 'chargement', contenu, titreCle: null }
}

function accueilInitial(): AccueilCompose {
  return {
    tete: rubriqueInitiale<TeteAccueil | null>(null),
    suite: rubriqueInitiale<readonly LigneSuiteAccueil[]>([]),
    aRegler: rubriqueInitiale<readonly CarteAReglerAccueil[]>([]),
    activites: rubriqueInitiale<readonly ActiviteAccueil[]>([]),
    chiffres: rubriqueInitiale<readonly ChiffreAccueil[]>([]),
  }
}

export function useAccueil() {
  const { session } = useSession()
  const { definirModulesActifs, retenir } = useAutorisation()

  const accueil = useState<AccueilCompose>('kaya.accueil', accueilInitial)

  /**
   * ⚠️ CE JETON EST CE QUI FERME FR-023. Chaque composition en prend un ; une
   * réponse qui revient alors qu'un autre établissement a été choisi porte un
   * jeton périmé, et **elle est jetée**. Sans lui, Deloria montrerait les
   * chiffres du maquis pendant une seconde — le temps exact où quelqu'un
   * regarde l'écran pour savoir où il en est.
   */
  const jeton = useState<number>('kaya.accueil.jeton', () => 0)

  /** Les surfaces retenues ICI, pour CE compte. */
  const surfacesRetenues = computed<readonly SurfaceAccueil[]>(() => retenir(SURFACES_ACCUEIL))

  /** Les surfaces effectivement rendues, exclusivité appliquée. */
  const surfacesRendues = computed<readonly SurfaceAccueil[]>(() => {
    const vues = new Set<FamilleSurface>()
    return surfacesRetenues.value.filter((surface) => {
      if (!FAMILLES_EXCLUSIVES.includes(surface.famille)) return true
      if (vues.has(surface.famille)) return false
      vues.add(surface.famille)
      return true
    })
  })

  function surfaceRendue(cle: string): boolean {
    return surfacesRendues.value.some((surface) => surface.cle === cle)
  }

  /** Le titre d'une rubrique — `null` quand aucune surface n'est retenue. */
  function titreDe(famille: FamilleSurface): string | null {
    return surfacesRendues.value.find((surface) => surface.famille === famille)?.titreCle ?? null
  }

  /**
   * La présentation d'une rubrique — **déclarée par la surface**, jamais
   * déduite d'une variante. `liste` par défaut : c'est la forme ordinaire, et
   * la grille est ce qu'on demande explicitement.
   */
  function presentationDe(famille: FamilleSurface): 'liste' | 'grille' {
    return (
      surfacesRendues.value.find((surface) => surface.famille === famille)?.presentation ?? 'liste'
    )
  }

  /**
   * L'écran cible d'un contenu — **la surface le déclare, la page ne le sait
   * pas**. C'est ce qui permet à `useEcranCible` de dire l'écran et le cycle
   * sans qu'une seule chaîne soit écrite ici.
   */
  function ecranCibleDe(surfaceCle: string): string | null {
    return SURFACES_ACCUEIL.find((surface) => surface.cle === surfaceCle)?.ecranCible ?? null
  }

  /**
   * Compose une rubrique de liste : lit sa source, filtre, décide de son état.
   *
   * ⚠️ CHAQUE RUBRIQUE EST COMPOSÉE INDÉPENDAMMENT, et c'est FR-022 : **l'échec
   * de l'une n'en emporte pas cinq**. Une lecture unique pour tout l'accueil
   * rendrait l'écran entier vide à la première panne d'un seul chiffre.
   */
  async function composerListe<T extends { surfaceCle: string }>(
    famille: FamilleSurface,
    lire: () => Promise<ResultatDomaine<readonly T[]>>,
    limite = Number.POSITIVE_INFINITY,
  ): Promise<Rubrique<readonly T[]>> {
    const titreCle = titreDe(famille)
    if (titreCle === null) return { etat: 'absente', contenu: [], titreCle: null }

    const resultat = await lire()
    if (!resultat.ok) {
      // ⚠️ HORS LIGNE ET ÉCHEC RÉSEAU NE SE DISENT PAS PAREIL. Le premier est un
      // fait sur lequel on peut agir — attendre, se déplacer ; le second est une
      // panne qu'on réessaie. Les confondre ferait proposer « Réessayer » à
      // quelqu'un qui n'a pas de réseau.
      return {
        etat: resultat.echec.code === 'HORS_LIGNE' ? 'horsLigne' : 'erreur',
        contenu: [],
        titreCle,
      }
    }

    const retenu = resultat.valeur
      .filter((element) => surfaceRendue(element.surfaceCle))
      .slice(0, limite)

    if (retenu.length > 0) return { etat: 'nominal', contenu: retenu, titreCle }
    return FAMILLES_QUI_DISPARAISSENT_VIDES.includes(famille)
      ? { etat: 'absente', contenu: [], titreCle: null }
      : { etat: 'vide', contenu: [], titreCle }
  }

  /**
   * Recompose tout l'accueil pour la portée courante.
   *
   * ⚠️ SOUS LA PORTÉE « TOUS », AUCUNE LECTURE PARAMÉTRÉE PAR L'ÉTABLISSEMENT
   * N'A DE SENS, et **aucune surface qui modifie une caisse n'existe** (FR-019).
   * La vue d'ensemble est un écran à part — `M4`, cycle F7 ; ici, l'accueil dit
   * ce qu'il sait et ne prétend rien de plus.
   */
  async function composer(): Promise<void> {
    const etablissementId = etablissementDe(session.value)
    const monJeton = jeton.value + 1
    jeton.value = monJeton

    if (etablissementId === null) {
      accueil.value = {
        tete: { etat: 'vide', contenu: null, titreCle: titreDe('tete') },
        suite: { etat: 'vide', contenu: [], titreCle: titreDe('suite') },
        aRegler: { etat: 'vide', contenu: [], titreCle: titreDe('aRegler') },
        activites: { etat: 'absente', contenu: [], titreCle: null },
        chiffres: { etat: 'vide', contenu: [], titreCle: titreDe('chiffre') },
      }
      return
    }

    accueil.value = accueilInitial()
    const portee = { etablissementId }
    const source = fournisseur().accueil

    // ⚠️ LES MODULES ACTIFS SONT LUS **AVANT** LE FILTRAGE, ET L'ORDRE DÉCIDE DE
    // TOUT. `serviceEstActif` répond « non » sur une liste vide : filtrer avant
    // de les avoir lus retirerait TOUTE surface portant un module, et l'accueil
    // d'une gérante serait celui d'un compte sans droits — un écran vide, sans
    // erreur, sans rien à comprendre.
    const modules = await fournisseur().etablissements.listerModulesActifs(portee)
    if (jeton.value !== monJeton) return
    if (modules.ok) definirModulesActifs(modules.valeur)

    const [tetes, suite, aRegler, activites, chiffres] = await Promise.all([
      source.listerTetes(portee),
      composerListe('suite', () => source.listerSuite(portee)),
      composerListe('aRegler', () => source.listerARegler(portee), MAXIMUM_A_REGLER),
      composerListe('activite', () => source.listerActivites(portee)),
      composerListe('chiffre', () => source.listerChiffres(portee)),
    ])

    // ⚠️ LA RÉPONSE TARDIVE EST JETÉE ICI, APRÈS L'ATTENTE ET AVANT L'ÉCRITURE.
    if (jeton.value !== monJeton) return

    accueil.value = { tete: composerTete(tetes), suite, aRegler, activites, chiffres }
  }

  /** La tête : **une seule**, la première candidate dont la surface est rendue. */
  function composerTete(resultat: ResultatDomaine<readonly TeteAccueil[]>): Rubrique<TeteAccueil | null> {
    const titreCle = titreDe('tete')
    if (titreCle === null) return { etat: 'absente', contenu: null, titreCle: null }
    if (!resultat.ok) {
      return {
        etat: resultat.echec.code === 'HORS_LIGNE' ? 'horsLigne' : 'erreur',
        contenu: null,
        titreCle,
      }
    }
    const retenue = resultat.valeur.find((tete) => surfaceRendue(tete.surfaceCle)) ?? null
    return { etat: retenue === null ? 'vide' : 'nominal', contenu: retenue, titreCle }
  }

  return {
    accueil,
    surfacesRetenues,
    surfacesRendues,
    titreDe,
    presentationDe,
    ecranCibleDe,
    composer,
  }
}
