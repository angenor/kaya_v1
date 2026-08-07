import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * Les polices et les glyphes sont EMBARQUÉS. La maquette les charge depuis un
 * CDN ; l'application ne le fait jamais — l'ouverture hors ligne l'interdit.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))
const POLICES_CSS = join(racine, 'app/assets/css/polices.css')
const ICONES_CSS = join(racine, 'app/assets/polices/icones.css')
const SOURCES = join(racine, 'app')

function fichiersSources(repertoire: string): string[] {
  const trouves: string[] = []
  for (const entree of readdirSync(repertoire, { withFileTypes: true })) {
    const chemin = join(repertoire, entree.name)
    if (entree.isDirectory()) {
      if (entree.name === 'polices') continue
      trouves.push(...fichiersSources(chemin))
    } else if (/\.(vue|ts|css)$/.test(entree.name)) {
      trouves.push(chemin)
    }
  }
  return trouves
}

/**
 * Les classes d'icônes réellement écrites dans `app/`, par variante.
 * ⚠️ MÊME RÈGLE QUE `scripts/polices/sous-regler-icones.mjs`, et c'est
 * volontaire : deux détections différentes se contrediraient, et c'est le test
 * qui aurait tort en silence.
 */
const PREFIXES_DE_VARIANTE = new Set(['ph-fill', 'ph-bold', 'ph-thin', 'ph-light', 'ph-duotone'])

function iconesEmployees() {
  const employees = { regular: new Set<string>(), fill: new Set<string>() }
  for (const fichier of fichiersSources(SOURCES)) {
    const contenu = readFileSync(fichier, 'utf8')
    for (const trouve of contenu.matchAll(/(?<![\w-])ph-[a-z0-9-]+/g)) {
      const nom = trouve[0]
      if (PREFIXES_DE_VARIANTE.has(nom)) continue
      if (nom.startsWith('ph-fill-')) employees.fill.add(nom)
      else employees.regular.add(nom)
    }
  }
  return employees
}

describe('les polices sont embarquées, jamais chargées à distance', () => {
  it("ne déclare aucune source distante dans l'ensemble des feuilles de app/", () => {
    const distantes: string[] = []
    for (const fichier of fichiersSources(SOURCES).filter((f) => f.endsWith('.css'))) {
      const contenu = readFileSync(fichier, 'utf8')
      // On lit les `url(...)` et les `@import` — jamais les commentaires, qui
      // portent des URL de documentation sans provoquer aucune requête.
      const sansCommentaires = contenu.replace(/\/\*[\s\S]*?\*\//g, '')
      for (const trouve of sansCommentaires.matchAll(/url\(\s*['"]?([^'")]+)/g)) {
        if (/^(https?:)?\/\//.test(trouve[1]!)) distantes.push(`${fichier} → ${trouve[1]}`)
      }
      for (const trouve of sansCommentaires.matchAll(/@import\s+['"]([^'"]+)/g)) {
        if (/^(https?:)?\/\//.test(trouve[1]!)) distantes.push(`${fichier} → ${trouve[1]}`)
      }
    }
    expect(distantes, `sources distantes : ${distantes.join(' · ')}`).toEqual([])
  })

  it('déclare les DEUX familles sous les noms que theme.css emploie', () => {
    // Les commentaires sont retirés : ils CITENT les noms amont pour expliquer
    // pourquoi ils ne sont pas employés, et les lire ferait échouer le contrôle
    // sur son propre motif.
    const contenu = readFileSync(POLICES_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(contenu).toContain("font-family: 'Archivo';")
    expect(contenu).toContain("font-family: 'Chivo Mono';")
    // Fontsource nomme ses familles « Archivo Variable » ; theme.css dit
    // « Archivo ». Une déclaration sous le nom amont ne serait jamais employée.
    expect(contenu).not.toContain('Archivo Variable')
    expect(contenu).not.toContain('Chivo Mono Variable')
  })

  it('sert latin ET latin-ext pour chaque famille, jamais latin seul', () => {
    const contenu = readFileSync(POLICES_CSS, 'utf8')
    for (const fichier of [
      'archivo-latin-wght-normal.woff2',
      'archivo-latin-ext-wght-normal.woff2',
      'chivo-mono-latin-wght-normal.woff2',
      'chivo-mono-latin-ext-wght-normal.woff2',
    ]) {
      expect(contenu, `sous-ensemble manquant : ${fichier}`).toContain(fichier)
    }
  })
})

describe('les glyphes sous-réglés couvrent ce que app/ emploie', () => {
  // ⚠️ C'EST LE CONTRÔLE QUI TIENT L'ARTEFACT ENGENDRÉ EN PHASE AVEC LA SOURCE.
  // Le sous-réglage est commité : sans ce test, une icône ajoutée à un composant
  // s'afficherait en carré vide, et rien ne le dirait avant la démonstration.
  const icones = iconesEmployees()
  const css = readFileSync(ICONES_CSS, 'utf8')

  it('déclare une règle pour chaque icône « regular » employée', () => {
    const absentes = [...icones.regular].filter((n) => !css.includes(`.ph.${n}::before`))
    expect(
      absentes,
      `icônes employées sans glyphe sous-réglé : ${absentes.join(', ')} — relancez scripts/polices/sous-regler-icones.mjs`,
    ).toEqual([])
  })

  it('déclare une règle pour chaque icône « fill » employée', () => {
    const absentes = [...icones.fill].filter((n) => !css.includes(`.ph-fill.${n}::before`))
    expect(
      absentes,
      `icônes employées sans glyphe sous-réglé : ${absentes.join(', ')} — relancez scripts/polices/sous-regler-icones.mjs`,
    ).toEqual([])
  })

  it("n'embarque aucun glyphe que app/ n'emploie pas", () => {
    // Le sens inverse compte : 279 ko d'icônes jamais affichées retardent le
    // premier écran à chaque installation, sur l'Android 2 Go d'Aminata.
    const declarees = [...css.matchAll(/\.ph(?:-fill)?\.(ph-[a-z0-9-]+)::before/g)].map(
      (m) => m[1]!,
    )
    const employees = new Set([...icones.regular, ...icones.fill])
    const superflues = declarees.filter((n) => !employees.has(n))
    expect(superflues, `glyphes embarqués sans emploi : ${superflues.join(', ')}`).toEqual([])
  })

  it('sous-règle assez de glyphes pour que son vert veuille dire quelque chose', () => {
    // ⚠️ LE PLANCHER EXISTE PARCE QUE LA PREMIÈRE DÉTECTION ÉTAIT FAUSSE. Elle
    // cherchait la paire « ph ph-xxx », que les composants n'écrivent jamais —
    // ils passent l'icône en propriété. Le ratissage rendait ZÉRO glyphe, les
    // trois contrôles ci-dessus passaient sur des ensembles vides, et
    // l'application affichait des carrés à la place des icônes.
    const declarees = [...css.matchAll(/::before/g)].length
    expect(declarees, 'aucun glyphe déclaré : la détection est probablement cassée').toBeGreaterThanOrEqual(5)
  })
})
