/**
 * Les préférences qui appartiennent à L'APPAREIL et non à l'établissement : le
 * thème et la langue.
 *
 * ⚠️ POURQUOI CE FICHIER VIT DANS `app/core/plateforme/` ET NULLE PART AILLEURS.
 * Il est le seul du produit à toucher `localStorage`, et la règle de lint (a)
 * l'y confine. Le motif n'est pas cosmétique : `localStorage` est SYNCHRONE, et
 * c'est précisément pour cela qu'il sert ici — le thème doit être posé AVANT LE
 * PREMIER PIXEL, et IndexedDB, qui porte tout le reste, ne rend la main
 * qu'après. Une préférence d'affichage lue de façon asynchrone produit l'éclair
 * clair que FR-009 refuse.
 *
 * ⚠️ ET IL NE PORTE QUE DES PRÉFÉRENCES D'AFFICHAGE. Aucun secret, aucune donnée
 * métier, aucune écriture de file : la file est persistée par `app/core/file/`,
 * en IndexedDB, parce qu'elle ne doit pas bloquer le premier rendu sur un
 * Android d'entrée de gamme.
 *
 * Le pendant Capacitor lira le même contrat depuis les préférences natives ;
 * c'est pour cela que la surface est réduite à trois fonctions.
 */

/** Les clés employées. Elles sont préfixées pour ne jamais entrer en collision
 *  avec ce qu'un autre outil poserait sur la même origine. */
export const CLE_THEME = 'kaya.theme'
export const CLE_LANGUE = 'kaya.langue'
/**
 * ⚠️ « L'invitation à installer a été écartée » EST une préférence d'affichage,
 * et elle appartient à l'appareil. Sur WebKit, aucune bannière ne se déclenche
 * jamais : le bandeau qui explique le menu de partage serait donc permanent, sur
 * chaque écran, pour toujours. Un bandeau permanent cesse d'être lu — et il
 * cesse d'être lu au moment précis où il aurait quelque chose à dire.
 */
export const CLE_INVITATION_ECARTEE = 'kaya.installation.ecartee'

/**
 * ⚠️ TOUT PASSE PAR UN `try` : sur WebKit en navigation privée, l'accès à
 * `localStorage` LÈVE au lieu de rendre `null`. Une préférence illisible n'est
 * pas une panne — c'est un appareil qui repart de la préférence système.
 */
export function lirePreference(cle: string): string | null {
  try {
    return localStorage.getItem(cle)
  } catch {
    return null
  }
}

export function ecrirePreference(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur)
  } catch {
    // Rien à faire, et rien à dire : l'utilisateur n'a pas demandé à persister.
  }
}

export function oublierPreference(cle: string): void {
  try {
    localStorage.removeItem(cle)
  } catch {
    // idem
  }
}

/**
 * La préférence système, quand aucun choix explicite n'a été fait.
 * Rend `null` quand le moteur ne sait pas répondre — auquel cas le clair fait
 * foi, comme le veut la valeur par défaut du thème.
 */
export function prefereLeSombre(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

/**
 * S'abonne aux changements de la préférence système. Rend une fonction de
 * désabonnement — jamais un `EventTarget`, qui ne franchirait pas la frontière
 * native (contracts/platform-adapter.md §1).
 */
export function surChangementDePreferenceSysteme(rappel: (sombre: boolean) => void): () => void {
  try {
    const requete = window.matchMedia('(prefers-color-scheme: dark)')
    const ecouteur = (evenement: MediaQueryListEvent) => rappel(evenement.matches)
    requete.addEventListener('change', ecouteur)
    return () => requete.removeEventListener('change', ecouteur)
  } catch {
    return () => {}
  }
}
