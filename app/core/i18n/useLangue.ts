import {
  CLE_LANGUE,
  ecrirePreference,
  lirePreference,
} from '~/core/plateforme/web/preferenceAppareil'

/**
 * LA LANGUE — français par défaut, anglais en second.
 *
 * ⚠️ AUCUNE DÉTECTION DE LA LANGUE DU NAVIGATEUR. « Français par défaut » est
 * une exigence (principe 8), pas une préférence à deviner : un poste de
 * réception livré en anglais afficherait l'application en anglais à Abengourou.
 * La langue se CHOISIT, et le choix est persisté avec le thème — les deux sont
 * des réglages de l'appareil, et ils vivent au même endroit.
 */

export const LANGUES = ['fr', 'en'] as const
export type Langue = (typeof LANGUES)[number]

export const LANGUE_PAR_DEFAUT: Langue = 'fr'

export function estLangue(valeur: unknown): valeur is Langue {
  return typeof valeur === 'string' && (LANGUES as readonly string[]).includes(valeur)
}

/** Le choix persisté, ou le français quand rien n'a été choisi. */
export function languePersistee(): Langue {
  const brut = lirePreference(CLE_LANGUE)
  return estLangue(brut) ? brut : LANGUE_PAR_DEFAUT
}

export function persisterLangue(langue: Langue): void {
  ecrirePreference(CLE_LANGUE, langue)
}

/**
 * La langue COURANTE, telle que l'interface la rend.
 *
 * ⚠️ ELLE VIENT DE `@nuxtjs/i18n`, PAS DE LA PRÉFÉRENCE PERSISTÉE. Les deux
 * coïncident au démarrage, et divergent dès qu'on bascule la langue sans
 * recharger : lire la préférence ferait écrire une date en français sur une
 * interface passée en anglais. `estLangue` protège le cas où le module rendrait
 * une étiquette que le produit ne sert pas.
 */
export function useLangue() {
  const { locale } = useI18n()
  const langue = computed<Langue>(() =>
    estLangue(locale.value) ? locale.value : LANGUE_PAR_DEFAUT,
  )
  return { langue }
}
