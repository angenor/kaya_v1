import en from '../app/core/i18n/en'
import fr from '../app/core/i18n/fr'

/**
 * ⚠️ CE FICHIER NE PORTE AUCUNE TRADUCTION, ET C'EST VOULU. `@nuxtjs/i18n`
 * cherche sa configuration ici ; les catalogues, eux, vivent dans
 * `app/core/i18n/`, avec le reste du noyau — c'est là que le plan les place et
 * là que le test de parité les lit. Deux emplacements pour un même contenu
 * divergeraient au troisième cycle.
 *
 * `legacy: false` : l'API de composition, la seule que Vue 3 recommande.
 * `fallbackLocale: 'fr'` : le français est la langue par défaut (principe 8) —
 * une clé absente de l'anglais rend le français, jamais la clé brute. Le test de
 * parité fait qu'il n'y en a pas.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr, en },
}))
