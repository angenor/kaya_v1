import { useSession } from '~/core/session/useSession'

/**
 * L'AUTORISATION — **ce qui est possible**, et rien de plus.
 *
 * ⚠️ UNE ACTION NON PERMISE EST **ABSENTE DU RENDU**. Ni grisée, ni masquée en
 * CSS, ni `disabled`. Griser dit à l'utilisateur que l'action existe et qu'il
 * n'y a pas droit — c'est une leçon d'organigramme sur un écran de travail — et
 * laisse dans le document une cible que rien n'empêche d'actionner autrement.
 * Le test porte donc sur le **HTML rendu**, jamais sur un attribut.
 *
 * ⚠️ ET UNE SURFACE DE SERVICE INACTIF EST ABSENTE AUSSI. Sur « Résidence Test »,
 * qui n'a que l'hébergement, les surfaces des autres services disparaissent. Les
 * deux conditions se cumulent : **avoir le droit ne suffit pas si le service
 * n'existe pas ici** — Adjoua a le droit d'appliquer une remise, et il n'y a pas
 * de restaurant à Résidence Test.
 *
 * ⚠️ LES MOTS « RÔLE » ET « PERMISSION » N'ATTEIGNENT JAMAIS L'ÉCRAN. On montre
 * ce qui est possible, pas la mécanique qui l'autorise (lexique). C'est pourquoi
 * ce composable ne rend aucun libellé : il rend un booléen, et l'écran nomme
 * l'action dans les mots de l'exploitant.
 */

export interface ActionAutorisable {
  /** Le code de permission exigé. */
  readonly permission: string
  /**
   * Le code du module d'activité que l'action suppose. `null` pour une action
   * transverse — encaisser, consulter les chiffres, régler l'établissement.
   */
  readonly moduleCode: string | null
}

export function useAutorisation() {
  const { session } = useSession()

  /** Les modules actifs de la portée courante — **résolus avec le contexte**. */
  const modulesActifs = computed<readonly string[]>(() => session.value.modulesActifs)

  function aLaPermission(code: string): boolean {
    return session.value.permissions.includes(code)
  }

  /**
   * ⚠️ UN MODULE ABSENT DE LA LISTE EST INACTIF, et c'est la bonne lecture.
   * `listerModulesActifs` ne rend QUE les actifs — l'interface de domaine ne
   * rend jamais un module inactif avec un drapeau, précisément pour qu'aucun
   * écran n'ait à décider lui-même, et n'en grise un.
   *
   * ⚠️ ET LA LISTE VIENT DE LA **SESSION**, PLUS D'UNE LECTURE D'ÉCRAN. Elle y
   * est entrée au cycle F2, sur constat : quand la lecture échouait — réseau
   * coupé —, cette fonction répondait « non » à tout, et les rubriques d'un
   * service disparaissaient **sans un mot**, exactement comme si
   * l'établissement ne l'offrait pas. Une panne ne doit pas ressembler à une
   * configuration.
   */
  function serviceEstActif(moduleCode: string | null): boolean {
    if (moduleCode === null) return true
    return session.value.modulesActifs.includes(moduleCode)
  }

  /** Les deux conditions, cumulées. C'est la seule question qu'un écran pose. */
  function autorise(action: ActionAutorisable): boolean {
    return aLaPermission(action.permission) && serviceEstActif(action.moduleCode)
  }

  /** Ne garde d'une liste que ce qui est autorisé ICI, pour CE compte. */
  function retenir<T extends ActionAutorisable>(actions: readonly T[]): T[] {
    return actions.filter((action) => autorise(action))
  }

  /**
   * LA MÊME RÈGLE, SUR UNE LISTE DE MODULES **DONNÉE**.
   *
   * ⚠️ ELLE EXISTE POUR UN SEUL APPELANT — l'inventaire `/_ecrans`, qui LIT les
   * modules pour exercer les quatre états d'une surface qui lit. Sans elle, cet
   * écran filtrerait sur la session pendant qu'il affiche l'état d'une autre
   * lecture : il montrerait des actions sous un jeu vide qui n'en rend aucune.
   *
   * ⚠️ ET C'EST BIEN **UNE SEULE RÈGLE**, écrite une fois : `autorise` reste
   * l'unique endroit où les deux conditions se cumulent. Une seconde
   * implémentation « juste pour cet écran » aurait divergé au premier ajout.
   */
  function retenirAvec<T extends ActionAutorisable>(
    actions: readonly T[],
    modulesCodes: readonly string[],
  ): T[] {
    return actions.filter(
      (action) =>
        aLaPermission(action.permission) &&
        (action.moduleCode === null || modulesCodes.includes(action.moduleCode)),
    )
  }

  return { modulesActifs, aLaPermission, serviceEstActif, autorise, retenir, retenirAvec }
}
