import { consignerReprise } from '~/core/session/journal'
import { useSession } from '~/core/session/useSession'

/**
 * REPREND LA SESSION À CHAQUE NAVIGATION, LA PREMIÈRE COMPRISE.
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
  await reprendre()
  consignerReprise(vers.fullPath)
})
