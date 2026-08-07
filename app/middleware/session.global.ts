import { consignerReprise } from '~/core/session/journal'
import { exigeUneSession } from '~/core/session/routesPubliques'
import { useSession } from '~/core/session/useSession'

/**
 * REPREND LA SESSION À CHAQUE NAVIGATION, LA PREMIÈRE COMPRISE — **et conduit à
 * la connexion quand il n'y en a pas**.
 *
 * ⚠️ C'EST LE LIVRABLE DONT LES SIX CYCLES SUIVANTS HÉRITENT SANS Y PENSER. Une
 * page nouvelle ne l'écrit pas, ne l'importe pas, et ne peut pas l'oublier :
 * elle en hérite par le seul fait d'exister sous `app/pages/`.
 *
 * ⚠️ « LA PREMIÈRE COMPRISE » N'EST PAS UNE FORMULE. Sur une application rendue
 * côté serveur, l'intergiciel est sauté au premier affichage parce que le
 * serveur l'a déjà exécuté. Ici il n'y a pas de serveur : la première
 * navigation EST une navigation client, et elle doit reprendre la session comme
 * les autres. Le journal le prouve plutôt que de le promettre — deux attributs
 * sur la racine du document, lisibles à l'inspecteur comme au test.
 */

export default defineNuxtRouteMiddleware(async (vers) => {
  const { reprendre } = useSession()
  const session = await reprendre()
  consignerReprise(vers.fullPath)

  if (session.compteId !== null || !exigeUneSession(vers.path)) return

  /**
   * ⚠️ `navigateTo`, JAMAIS `abortNavigation()` NI `return false`. Sur la
   * navigation INITIALE d'une application à page unique, interrompre ne renvoie
   * pas à l'écran précédent — il n'y en a pas : le routeur reste sur une route
   * non résolue et Nuxt rend « Page Not Found ». Quelqu'un qui ouvre
   * l'application sur un téléphone neuf verrait donc une page d'erreur au lieu
   * de la connexion.
   *
   * ⚠️ ET L'ADRESSE DEMANDÉE EST RETENUE (FR-010), en paramètre plutôt qu'en
   * mémoire : un rechargement de la page de connexion ne doit pas la perdre.
   * `R0` n'y revient que si elle commence par « / » — une adresse absolue
   * transformerait la connexion en tremplin vers un site tiers.
   */
  return navigateTo({ path: '/connexion', query: { vers: vers.fullPath } })
})
