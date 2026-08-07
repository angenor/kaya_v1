import { languePersistee } from '~/core/i18n/useLangue'

/**
 * Applique la langue persistée AVANT le premier rendu.
 *
 * ⚠️ UN GREFFON SUFFIT ICI, LÀ OÙ LE THÈME EXIGEAIT UN SCRIPT DE TÊTE, et la
 * différence vaut d'être dite : les greffons Nuxt s'exécutent avant le montage
 * de l'application, donc avant que le premier texte ne soit peint. Le thème,
 * lui, est porté par le FOND DU DOCUMENT, que le navigateur peint dès qu'il a le
 * CSS — c'est-à-dire avant tout JavaScript. C'est la seule raison pour laquelle
 * l'un est en ligne dans le `<head>` et l'autre non.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: { value: string } } | undefined
  if (!i18n) return
  const langue = languePersistee()
  if (i18n.locale.value !== langue) i18n.locale.value = langue
})
