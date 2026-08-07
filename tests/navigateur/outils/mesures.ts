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

type Rvba = readonly [number, number, number, number]

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
async function resoudreCouleur(page: Page, couleur: string): Promise<Rvba> {
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
function composer(avant: Rvba, arriere: Rvba): Rvba {
  const a = avant[3]
  return [
    avant[0] * a + arriere[0] * (1 - a),
    avant[1] * a + arriere[1] * (1 - a),
    avant[2] * a + arriere[2] * (1 - a),
    1,
  ]
}

/** Luminance relative WCAG. */
function luminance([r, v, b]: Rvba): number {
  const canal = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b)
}

function contraste(avant: Rvba, arriere: Rvba): number {
  const a = luminance(avant)
  const b = luminance(arriere)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Le fond effectif d'un élément : on remonte tant qu'il est transparent. */
async function fondEffectif(page: Page, cible: Locator): Promise<Rvba> {
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
 * LES MESURES EN **UN SEUL ALLER-RETOUR**, calculées DANS la page.
 *
 * ⚠️ CE N'EST PAS UNE OPTIMISATION DE CONFORT, ET LE CONSTAT L'A IMPOSÉ. Une
 * mesure par élément, c'est un aller-retour de protocole par élément et par
 * propriété : sur le guide de style, plus de cinq cents pour un seul passage.
 * Sur un poste chargé — c'est-à-dire le poste réel —, **WebKit dépassait les
 * trente secondes et la porte rougissait sans qu'aucun défaut n'existe**. Une
 * porte qui rougit selon la charge de la machine est désactivée sous trois
 * semaines, et elle a raison de l'être.
 *
 * Tout est donc calculé **dans la page**, en une fois : le style, la géométrie,
 * la résolution des couleurs par canevas, la composition alpha et le rapport de
 * contraste. Les mêmes formules, au même endroit qu'avant — c'est le nombre de
 * traversées qui change, pas la mesure.
 */

export interface MesureTexte {
  readonly texte: string
  readonly corps: number
  readonly gras: boolean
  readonly attenue: boolean
  readonly rapport: number
}

export interface MesureCible {
  readonly texte: string
  readonly hauteur: number
  readonly rayon: string
  readonly corps: string
  readonly exemption: string | null
  readonly hauteurAttendue: number | null
}

/**
 * Mesure le contraste de tous les textes d'un sélecteur, EN UNE FOIS.
 *
 * ⚠️ LES FORMULES SONT RECOPIÉES DANS LA FONCTION PASSÉE À LA PAGE, et ce n'est
 * pas un oubli de factorisation : le corps envoyé au navigateur est sérialisé,
 * donc il ne peut RIEN capturer de la portée du test. Recopier est la seule
 * façon de les exécuter là où sont les éléments. Les versions de ce fichier —
 * `luminance`, `composer`, `contraste` — restent la référence, et le cas
 * « les DEUX mesures de contraste rendent le MÊME nombre » de
 * `ecrans-atteignables.spec.ts` vérifie que les deux s'accordent, sur un
 * élément réel, dans le navigateur réel.
 */
export async function mesurerTextes(page: Page, selecteur: string): Promise<MesureTexte[]> {
  return page.evaluate((sel) => {
    const canevas = document.createElement('canvas')
    canevas.width = 1
    canevas.height = 1
    const contexte = canevas.getContext('2d')!

    const resoudre = (couleur: string): number[] => {
      contexte.clearRect(0, 0, 1, 1)
      contexte.fillStyle = couleur
      contexte.fillRect(0, 0, 1, 1)
      const d = contexte.getImageData(0, 0, 1, 1).data
      return [d[0]!, d[1]!, d[2]!, d[3]! / 255]
    }
    const luminance = (c: number[]): number => {
      const canal = (v: number) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * canal(c[0]!) + 0.7152 * canal(c[1]!) + 0.0722 * canal(c[2]!)
    }
    const composer = (avant: number[], arriere: number[]): number[] => {
      const a = avant[3]!
      return [
        avant[0]! * a + arriere[0]! * (1 - a),
        avant[1]! * a + arriere[1]! * (1 - a),
        avant[2]! * a + arriere[2]! * (1 - a),
        1,
      ]
    }
    const fondEffectif = (element: Element): number[] => {
      let noeud: Element | null = element
      while (noeud) {
        const fond = getComputedStyle(noeud).backgroundColor
        if (fond && fond !== 'transparent' && !/,\s*0\)$/.test(fond)) return resoudre(fond)
        noeud = noeud.parentElement
      }
      return resoudre('rgb(255, 255, 255)')
    }

    const mesures = []
    for (const element of Array.from(document.querySelectorAll(sel))) {
      const boite = element.getBoundingClientRect()
      if (boite.width === 0 && boite.height === 0) continue
      const texte = (element.textContent ?? '').trim()
      if (texte === '') continue
      const style = getComputedStyle(element)
      const arriere = fondEffectif(element)
      const la = luminance(composer(resoudre(style.color), arriere))
      const lb = luminance(arriere)
      mesures.push({
        texte: texte.slice(0, 32),
        corps: Number.parseFloat(style.fontSize),
        gras: Number(style.fontWeight) >= 700,
        attenue:
          Boolean(element.closest('[disabled]')) || element.hasAttribute('disabled'),
        rapport: (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05),
      })
    }
    return mesures
  }, selecteur)
}

/** Mesure hauteur, rayon et corps de toutes les cibles cliquables, en une fois. */
export async function mesurerCibles(
  page: Page,
  selecteur: string,
  exemptions: readonly { selecteur: string; hauteur: number; nom: string }[],
): Promise<MesureCible[]> {
  return page.evaluate(
    ([sel, exs]) => {
      const mesures: MesureCible[] = []
      for (const element of Array.from(document.querySelectorAll(sel!))) {
        const boite = element.getBoundingClientRect()
        if (boite.height === 0) continue
        const style = getComputedStyle(element)
        const exemption = exs!.find((e) => element.closest(e.selecteur) !== null) ?? null
        mesures.push({
          texte: (element.textContent ?? '').trim().slice(0, 24) || '(sans texte)',
          hauteur: Math.round(boite.height),
          rayon: style.borderTopLeftRadius,
          corps: style.fontSize,
          exemption: exemption?.nom ?? null,
          hauteurAttendue: exemption?.hauteur ?? null,
        })
      }
      return mesures
    },
    [selecteur, exemptions] as const,
  )
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
const NOMS_ETAT_INTERNES = ['connecté', 'dégradé', 'hors ligne'] as const

export async function exigerAucunNomDetatInterne(page: Page, ou: string): Promise<void> {
  const html = (await page.content()).toLowerCase()
  for (const nom of NOMS_ETAT_INTERNES) {
    expect(html.includes(nom), `« ${nom} » est un nom d'état INTERNE et il est dans le HTML de ${ou} (SC-022)`).toBe(false)
  }
}
