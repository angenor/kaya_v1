import { useScenarios } from '~/core/scenarios/useScenarios'

/**
 * REPREND LES RÉGLAGES DE SCÉNARIO **AVANT LE PREMIER RENDU**.
 *
 * ⚠️ CE GREFFON EXISTE PARCE QUE LE CONTRAIRE A ÉTÉ CONSTATÉ, ET LE DÉFAUT ÉTAIT
 * SILENCIEUX. Les réglages étaient repris par le gabarit, à `onNuxtReady` —
 * c'est-à-dire **après** le `setup()` des pages. Une page qui lit ses données au
 * montage les lisait donc avec les réglages INITIAUX : latence nulle, aucun
 * échec, aucun hors-ligne. **Les leviers n'avaient aucun effet au premier
 * chargement d'un écran**, et n'en prenaient qu'à la seconde lecture. On
 * l'aurait pris pour une lenteur de l'application, jamais pour un ordre
 * d'exécution.
 *
 * ⚠️ ET IL EST `await`é, DONC NUXT MONTE APRÈS LUI. C'est ce qui fait la
 * différence : `onNuxtReady` promet « quand tout est prêt », un greffon
 * asynchrone promet « avant que quoi que ce soit ne rende ».
 *
 * ⚠️ IL N'EST PAS DU PRODUIT, ET IL DISPARAÎTRA AVEC LA SIMULATION. Aucun écran
 * ne l'appelle et aucun ne le connaît : c'est le cycle de vie qui le porte, dans
 * `plugins/`, comme le thème et la langue.
 */
export default defineNuxtPlugin(async () => {
  const { reprendre } = useScenarios()
  await reprendre()
})
