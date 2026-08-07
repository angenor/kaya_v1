import { expect, type Locator, type Page } from '@playwright/test'

/**
 * LES MESURES PARTAGÉES DES SUITES DE NAVIGATEUR.
 *
 * ⚠️ ELLES VIVENT ICI PARCE QUE **DEUX SUITES LES EMPLOIENT**, et qu'une seconde
 * copie divergerait. Le guide de style mesure les seize composants sur un écran ;
 * la matrice de P-04 mesure les mêmes propriétés sur **chaque écran construit**.
 * Le jour où un jeton change, il change à un seul endroit.
 *
 * ⚠️ ET ELLES LISENT DES VALEURS, JAMAIS DES CAPTURES D'ÉCRAN. Une comparaison
 * d'images échoue sur un rendu de police et se désactive en trois semaines.
 */

/** Les valeurs de `docs/design/tokens.md`, reprises telles quelles. */
export const JETONS = {
  couleur: {
    bg: { light: 'rgb(250, 244, 233)', dark: 'rgb(23, 18, 15)' },
    surf: { light: 'rgb(255, 253, 248)', dark: 'rgb(36, 28, 22)' },
    tile: { light: 'rgb(244, 236, 224)', dark: 'rgb(46, 36, 28)' },
    prim: { light: 'rgb(33, 69, 140)', dark: 'rgb(157, 188, 245)' },
    ocreSoft: { light: 'rgb(240, 226, 205)', dark: 'rgb(51, 38, 26)' },
  },
  rayon: { sm: '6px', md: '8px', lg: '10px', xl: '12px', pleine: '999px' },
  hauteur: { touche: 44, comptoir: 48, ligne: 56, discret: 36, segment: 32, pastille: 28 },
  corps: { mini: '12.5px', corps: '13.5px', action: '14.5px', chiffreL: '30px' },
} as const

/** Le plancher tactile de `tokens.md` §3 — « jamais moins ». */
export const PLANCHER_TACTILE = 44

export type Schema = 'light' | 'dark'

export function nomDuTheme(schema: Schema): 'clair' | 'sombre' {
  return schema === 'dark' ? 'sombre' : 'clair'
}

export async function styleCalcule(cible: Locator, propriete: string): Promise<string> {
  return cible.evaluate(
    (element, prop) => getComputedStyle(element).getPropertyValue(prop),
    propriete,
  )
}

export async function hauteur(cible: Locator): Promise<number> {
  const boite = await cible.boundingBox()
  return boite?.height ?? 0
}

export type Rvba = readonly [number, number, number, number]

/**
 * Résout une couleur CSS en sRGB + alpha, DANS LE NAVIGATEUR, par un canevas.
 *
 * ⚠️ ANALYSER LA CHAÎNE À LA MAIN NE MARCHE PAS, ET LE TEST L'A PROUVÉ CONTRE
 * LUI-MÊME. Tailwind 4 rend les couleurs à opacité en `oklab(0.96 0.002 0.015 /
 * 0.6)` : une expression régulière qui prend les trois premiers nombres pour un
 * triplet 0–255 calculait une luminance de zéro, et le test accusait le produit
 * d'un contraste de 1,21:1 sur un bandeau parfaitement lisible. Le canevas, lui,
 * fait ce que fait le moteur de rendu — c'est la seule référence qui vaille.
 */
export async function resoudreCouleur(page: Page, couleur: string): Promise<Rvba> {
  return page.evaluate((valeur) => {
    const canevas = document.createElement('canvas')
    canevas.width = 1
    canevas.height = 1
    const contexte = canevas.getContext('2d')!
    contexte.clearRect(0, 0, 1, 1)
    contexte.fillStyle = valeur
    contexte.fillRect(0, 0, 1, 1)
    const [r, v, b, a] = contexte.getImageData(0, 0, 1, 1).data
    return [r!, v!, b!, a! / 255] as [number, number, number, number]
  }, couleur)
}

/** Compose une couleur semi-transparente sur son fond. */
export function composer(avant: Rvba, arriere: Rvba): Rvba {
  const a = avant[3]
  return [
    avant[0] * a + arriere[0] * (1 - a),
    avant[1] * a + arriere[1] * (1 - a),
    avant[2] * a + arriere[2] * (1 - a),
    1,
  ]
}

/** Luminance relative WCAG. */
export function luminance([r, v, b]: Rvba): number {
  const canal = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b)
}

export function contraste(avant: Rvba, arriere: Rvba): number {
  const a = luminance(avant)
  const b = luminance(arriere)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Le fond effectif d'un élément : on remonte tant qu'il est transparent. */
export async function fondEffectif(page: Page, cible: Locator): Promise<Rvba> {
  const brut = await cible.evaluate((element) => {
    let noeud: Element | null = element
    while (noeud) {
      const fond = getComputedStyle(noeud).backgroundColor
      if (fond && fond !== 'transparent' && !/,\s*0\)$/.test(fond)) return fond
      noeud = noeud.parentElement
    }
    return 'rgb(255, 255, 255)'
  })
  return resoudreCouleur(page, brut)
}

/** Le contraste effectif d'un texte sur son fond, alpha composé. */
export async function contrasteDe(page: Page, cible: Locator): Promise<number> {
  const arriere = await fondEffectif(page, cible)
  const avant = await resoudreCouleur(page, await styleCalcule(cible, 'color'))
  return contraste(composer(avant, arriere), arriere)
}

/**
 * WCAG : 3:1 pour le grand texte (≥ 24 px, ou ≥ 18,66 px gras), 4,5:1 sinon.
 * AAA (FR-095, montants et statuts) : 4,5:1 pour le grand texte, 7:1 sinon.
 */
export function seuilAA(corps: number, gras: boolean): number {
  return corps >= 24 || (corps >= 18.66 && gras) ? 3 : 4.5
}

export function seuilAAA(corps: number): number {
  return corps >= 24 ? 4.5 : 7
}

/**
 * LES TROIS NOMS D'ÉTAT INTERNES (SC-022) — ils ne franchissent JAMAIS le HTML.
 *
 * ⚠️ CE SONT DES NOMS DE MÉCANIQUE, PAS DES LIBELLÉS. L'utilisateur lit « Hors
 * connexion », « Connexion faible » et « En attente d'envoi (n) » ; « connecté »,
 * « dégradé » et « hors ligne » sont ce que le code appelle ces états entre lui
 * et lui. Les laisser sortir apprendrait à l'exploitant un vocabulaire qui n'est
 * pas le sien, et qui changera au premier remaniement.
 */
export const NOMS_ETAT_INTERNES = ['connecté', 'dégradé', 'hors ligne'] as const

export async function exigerAucunNomDetatInterne(page: Page, ou: string): Promise<void> {
  const html = (await page.content()).toLowerCase()
  for (const nom of NOMS_ETAT_INTERNES) {
    expect(html.includes(nom), `« ${nom} » est un nom d'état INTERNE et il est dans le HTML de ${ou} (SC-022)`).toBe(false)
  }
}
