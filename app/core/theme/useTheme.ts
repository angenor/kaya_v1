import {
  CLE_THEME,
  ecrirePreference,
  lirePreference,
  oublierPreference,
  prefereLeSombre,
  surChangementDePreferenceSysteme,
} from '~/core/plateforme/web/preferenceAppareil'

/**
 * LE THÈME — clair, sombre, ou comme l'appareil.
 *
 * ⚠️ CE COMPOSABLE N'APPLIQUE RIEN AU DÉMARRAGE, et c'est le point. La classe
 * est déjà posée quand il s'exécute : c'est le script en ligne du `<head>`
 * (voir `nuxt.config.ts`) qui l'a mise, AVANT LE PREMIER PIXEL. Un composable
 * arrive après l'hydratation, donc après le premier rendu — appliquer le thème
 * ici produirait l'éclair clair que FR-009 refuse, et il ne se verrait qu'à la
 * démonstration.
 *
 * Ce que ce fichier fait : il LIT ce qui est déjà là, il tient l'état réactif en
 * phase, et il applique les changements QUI VIENNENT ENSUITE — la bascule de
 * l'utilisateur, et le basculement de la préférence système quand le choix est
 * « comme l'appareil ».
 */

export const CHOIX_THEME = ['clair', 'sombre', 'systeme'] as const
export type ChoixTheme = (typeof CHOIX_THEME)[number]

/** Ce qui est réellement affiché, une fois le choix résolu. */
export type ThemeRendu = 'clair' | 'sombre'

export function estChoixTheme(valeur: unknown): valeur is ChoixTheme {
  return typeof valeur === 'string' && (CHOIX_THEME as readonly string[]).includes(valeur)
}

/** Le choix persisté, ou « systeme » quand rien n'a été choisi. */
export function choixPersiste(): ChoixTheme {
  const brut = lirePreference(CLE_THEME)
  return estChoixTheme(brut) ? brut : 'systeme'
}

/** Résout un choix en ce qui s'affiche. */
export function resoudreTheme(choix: ChoixTheme): ThemeRendu {
  if (choix === 'clair' || choix === 'sombre') return choix
  return prefereLeSombre() ? 'sombre' : 'clair'
}

/** Pose la classe sur la racine du document. Le seul endroit qui l'écrit. */
export function appliquerTheme(theme: ThemeRendu): void {
  const racine = document.documentElement
  racine.classList.toggle('dark', theme === 'sombre')
  // `color-scheme` fait suivre les contrôles natifs — barres de défilement,
  // sélecteurs de date. Sans lui, un champ de saisie reste blanc dans le bar,
  // le soir, alors que tout le reste a basculé.
  racine.style.colorScheme = theme === 'sombre' ? 'dark' : 'light'
  racine.dataset.theme = theme
}

export function useTheme() {
  const choix = useState<ChoixTheme>('kaya.theme.choix', () => 'systeme')
  const rendu = useState<ThemeRendu>('kaya.theme.rendu', () => 'clair')

  /** Reprend ce que le script du `<head>` a déjà posé. N'applique rien. */
  function reprendre(): void {
    choix.value = choixPersiste()
    rendu.value = document.documentElement.classList.contains('dark') ? 'sombre' : 'clair'
  }

  function choisir(nouveau: ChoixTheme): void {
    choix.value = nouveau
    if (nouveau === 'systeme') oublierPreference(CLE_THEME)
    else ecrirePreference(CLE_THEME, nouveau)
    rendu.value = resoudreTheme(nouveau)
    appliquerTheme(rendu.value)
  }

  /** Suit la préférence système tant que le choix est « comme l'appareil ». */
  function suivreLAppareil(): () => void {
    return surChangementDePreferenceSysteme((sombre) => {
      if (choix.value !== 'systeme') return
      rendu.value = sombre ? 'sombre' : 'clair'
      appliquerTheme(rendu.value)
    })
  }

  return { choix, rendu, reprendre, choisir, suivreLAppareil }
}
