import type { ModuleActivite } from '~/core/donnees/etablissements/types'
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
  const modulesActifs = useState<readonly ModuleActivite[]>(
    'kaya.autorisation.modulesActifs',
    () => [],
  )

  /** Les modules actifs de l'établissement courant, tels qu'un écran les a lus. */
  function definirModulesActifs(modules: readonly ModuleActivite[]): void {
    modulesActifs.value = modules
  }

  function aLaPermission(code: string): boolean {
    return session.value.permissions.includes(code)
  }

  /**
   * ⚠️ UN MODULE ABSENT DE LA LISTE EST INACTIF, et c'est la bonne lecture.
   * `listerModulesActifs` ne rend QUE les actifs — l'interface de domaine ne
   * rend jamais un module inactif avec un drapeau, précisément pour qu'aucun
   * écran n'ait à décider lui-même, et n'en grise un.
   */
  function serviceEstActif(moduleCode: string | null): boolean {
    if (moduleCode === null) return true
    return modulesActifs.value.some((module) => module.code === moduleCode)
  }

  /** Les deux conditions, cumulées. C'est la seule question qu'un écran pose. */
  function autorise(action: ActionAutorisable): boolean {
    return aLaPermission(action.permission) && serviceEstActif(action.moduleCode)
  }

  /** Ne garde d'une liste que ce qui est autorisé ICI, pour CE compte. */
  function retenir<T extends ActionAutorisable>(actions: readonly T[]): T[] {
    return actions.filter((action) => autorise(action))
  }

  return { modulesActifs, definirModulesActifs, aLaPermission, serviceEstActif, autorise, retenir }
}
