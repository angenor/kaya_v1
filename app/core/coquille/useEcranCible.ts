import { toutesLesEntrees } from '~/core/ecrans/index'

/**
 * D'UN CODE D'ÉCRAN VERS CE QU'ON PEUT EN FAIRE — naviguer, ou le dire.
 *
 * ⚠️ TOUT EST LU À `app/core/ecrans/index.ts`, ET NULLE PART AILLEURS. La
 * route, le titre et le cycle attendu y vivent déjà ; les écrire dans une
 * surface d'accueil les recopierait onze fois, et la onzième serait fausse. La
 * conséquence pratique se mesure : **passer un écran à `CONSTRUIT` à l'index
 * fait disparaître la mention, sans que `R1` soit retouché.**
 *
 * ⚠️ UNE SURFACE NE DÉCIDE DONC RIEN. Elle déclare le CODE qu'elle vise ;
 * savoir si cet écran existe, et quoi dire sinon, est le travail de cette
 * fonction. C'est ce qui rend `R1` héritable : un écran qui décide lui-même
 * n'est pas un motif, c'est un cas particulier que le suivant recopiera de
 * travers.
 */

export type EcranCible =
  /** L'écran existe : on y va. */
  | { readonly etat: 'construit'; readonly route: string }
  /**
   * L'écran est au produit et n'est pas encore construit : l'appui **dit
   * lequel, et quand**. La surface, elle, garde l'apparence exacte d'une
   * surface aboutie — ni atténuation, ni badge, ni `disabled`.
   */
  | { readonly etat: 'aVenir'; readonly titre: string; readonly cycle: string }
  /**
   * Le code n'est pas à l'index.
   *
   * ⚠️ CE CAS N'EST JAMAIS RENDU, et il existe pour cela. Une surface qui
   * viserait un écran inconnu est une faute de saisie, pas un état du produit :
   * la rendre afficherait une mention sur un écran qui n'a jamais été prévu.
   * `composerAccueil` la retire, et un test la refuse.
   */
  | { readonly etat: 'inconnu' }

export function useEcranCible() {
  /**
   * ⚠️ LA RECHERCHE PORTE SUR **TOUTES** LES ENTRÉES, instruments compris, et
   * pas seulement sur les 46 du produit. Une surface ne vise jamais un
   * instrument aujourd'hui ; restreindre la recherche au produit rendrait
   * pourtant `inconnu` pour une route qui existe, et le jour où un cycle
   * pointerait une entrée technique, le défaut serait silencieux.
   */
  function resoudre(code: string): EcranCible {
    const entree = toutesLesEntrees().find((e) => e.code === code)
    if (entree === undefined) return { etat: 'inconnu' }
    if (entree.avancement === 'CONSTRUIT' && entree.route !== null) {
      return { etat: 'construit', route: entree.route }
    }
    // Un écran non construit dont personne n'a inscrit le cycle serait annoncé
    // sans date. On préfère ne rien affirmer : `inconnu` n'est pas rendu, et le
    // manque se voit à l'index plutôt que dans une phrase creuse.
    if (entree.cycle === null) return { etat: 'inconnu' }
    return { etat: 'aVenir', titre: entree.titre, cycle: entree.cycle }
  }

  /**
   * LE RETOUR — **il ramène à l'accueil de l'établissement courant**, jamais à
   * l'entrée précédente de l'historique (FR-036).
   *
   * ⚠️ ET C'EST UNE RÈGLE, PAS UNE COMMODITÉ. L'entrée précédente peut
   * appartenir à un **autre établissement** — M. Koffi vient de basculer. Un
   * retour qui suivrait l'historique rouvrirait un site qu'on venait de
   * quitter, **sans le dire**, et le geste suivant se ferait au mauvais endroit.
   *
   * ⚠️ L'ACCUEIL, LUI, N'A PAS DE RETOUR : c'est la racine du produit. Les
   * écrans de F3 à F7 l'emploieront ; `R1` ne l'appelle pas.
   */
  async function revenir(): Promise<void> {
    await navigateTo('/')
  }

  return { resoudre, revenir }
}
