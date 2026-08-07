import { useTheme } from '~/core/theme/useTheme'

/**
 * ASSURE LA SUITE, ET N'APPLIQUE RIEN.
 *
 * ⚠️ UN GREFFON ARRIVE TOUJOURS TROP TARD. Le thème est posé par le script en
 * ligne du `<head>` (voir `nuxt.config.ts`), avant que le navigateur n'ait
 * peint quoi que ce soit. Ce fichier ne fait donc que deux choses, et aucune
 * n'est « appliquer le thème au démarrage » :
 *
 *   1. il REPREND l'état déjà posé, pour que l'interface sache quoi cocher ;
 *   2. il s'abonne au basculement de la préférence système, qui arrive PENDANT
 *      la session — le poste de réception passe en sombre au coucher du soleil,
 *      et l'écran doit suivre sans qu'on le lui demande.
 */
export default defineNuxtPlugin(() => {
  const { reprendre, suivreLAppareil } = useTheme()
  reprendre()
  const desabonner = suivreLAppareil()

  // Le désabonnement n'a de sens qu'au rechargement à chaud : en production, le
  // greffon vit aussi longtemps que le document. Sans lui, chaque rechargement
  // de module empilerait un écouteur de plus, et le décompte deviendrait faux.
  import.meta.hot?.dispose(desabonner)
})
