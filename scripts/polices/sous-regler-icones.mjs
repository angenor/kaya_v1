#!/usr/bin/env node
/**
 * Sous-règle la police d'icônes Phosphor sur les SEULS glyphes que l'application
 * emploie, et engendre la feuille de style correspondante.
 *
 * POURQUOI CE SCRIPT EXISTE. `@phosphor-icons/web` pèse 279 ko pour ses deux
 * variantes complètes (147 ko « regular » + 132 ko « fill »). La persona Aminata
 * travaille sur un Android d'entrée de gamme en réseau intermittent : 270 ko
 * d'icônes jamais affichées retardent le premier écran à chaque installation.
 * Le paquet est donc la SOURCE des glyphes ; ce qui part au client est un
 * sous-ensemble produit ici et COMMITÉ (docs/versions-reference.md §3.2).
 *
 * ⚠️ ET LA MAQUETTE CHARGE PHOSPHOR DEPUIS UN CDN. L'application ne le fait
 * jamais : l'ouverture hors ligne l'interdit, et une icône absente le jour de la
 * démonstration serait irrattrapable.
 *
 * DÉTERMINISME. Les noms d'icônes sont triés, les points de code aussi, et
 * `subset-font` (donc harfbuzz, le moteur de mise en forme des navigateurs)
 * reçoit une chaîne identique à chaque exécution. Deux exécutions successives
 * produisent deux fichiers identiques — c'est ce que `--verifier` constate, par
 * comparaison d'octets et non par lecture.
 *
 * USAGE
 *   node scripts/polices/sous-regler-icones.mjs             engendre
 *   node scripts/polices/sous-regler-icones.mjs --verifier  n'écrit rien et
 *                                                           échoue si le
 *                                                           commité diffère
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import subsetFont from 'subset-font'

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const SOURCES = join(RACINE, 'app')
const SORTIE = join(RACINE, 'app/assets/polices')

/**
 * Les deux variantes employées par le produit. `duotone`, `light`, `thin` et
 * `bold` ne sont pas servies : `docs/design/composants.md` n'en emploie aucune,
 * et une variante ajoutée « au cas où » est 130 ko de plus.
 */
const VARIANTES = [
  {
    cle: 'regular',
    famille: 'Phosphor',
    prefixe: 'ph',
    css: 'node_modules/@phosphor-icons/web/src/regular/style.css',
    woff2: 'node_modules/@phosphor-icons/web/src/regular/Phosphor.woff2',
    fichier: 'phosphor-regular.woff2',
  },
  {
    cle: 'fill',
    famille: 'Phosphor-Fill',
    prefixe: 'ph-fill',
    css: 'node_modules/@phosphor-icons/web/src/fill/style.css',
    woff2: 'node_modules/@phosphor-icons/web/src/fill/Phosphor-Fill.woff2',
    fichier: 'phosphor-fill.woff2',
  },
]

const verifier = process.argv.includes('--verifier')

/** Tous les fichiers de `app/` où une classe d'icône peut être écrite. */
function fichiersSources(repertoire) {
  const trouves = []
  for (const entree of readdirSync(repertoire, { withFileTypes: true })) {
    const chemin = join(repertoire, entree.name)
    if (entree.isDirectory()) {
      if (entree.name === 'polices') continue // la sortie de ce script
      trouves.push(...fichiersSources(chemin))
    } else if (/\.(vue|ts|css)$/.test(entree.name)) {
      trouves.push(chemin)
    }
  }
  return trouves
}

/**
 * Les points de code déclarés par la feuille amont, par nom d'icône.
 * Les règles ont toutes la forme `.ph.ph-house:before { content: "\e2c2"; }`.
 */
function pointsDeCode(cheminCss, prefixe) {
  const contenu = readFileSync(join(RACINE, cheminCss), 'utf8')
  const motif = new RegExp(
    `\\.${prefixe.replace('-', '\\-')}\\.(${prefixe}-[a-z0-9-]+):before\\s*\\{\\s*content:\\s*"\\\\([0-9a-f]{4,6})"`,
    'g',
  )
  const table = new Map()
  for (const trouve of contenu.matchAll(motif)) {
    table.set(trouve[1], Number.parseInt(trouve[2], 16))
  }
  return table
}

/**
 * Les classes d'icônes réellement écrites dans `app/`.
 *
 * ⚠️ ON RATISSE LES NOMS, PAS LES PAIRES `ph ph-xxx`. Première version, et elle
 * était fausse : les composants passent l'icône EN PROPRIÉTÉ — `icone="ph-door-
 * open"` d'un côté, `:class="['ph', icone]"` de l'autre. La paire n'apparaît
 * jamais dans le même fichier, donc le ratissage rendait zéro glyphe et
 * l'application affichait des carrés vides sans que rien ne le dise.
 *
 * ⚠️ ET LA VARIANTE SE DÉCLARE PAR LE NOM, `ph-fill-xxx`. C'est une convention
 * de CE dépôt : Phosphor écrit `ph-fill ph-xxx`, mais deux classes ne survivent
 * pas au passage par une propriété. Le composant recompose.
 */
const PREFIXES_DE_VARIANTE = new Set(['ph-fill', 'ph-bold', 'ph-thin', 'ph-light', 'ph-duotone'])

function iconesEmployees(fichiers) {
  const employees = { regular: new Set(), fill: new Set() }
  for (const fichier of fichiers) {
    const contenu = readFileSync(fichier, 'utf8')
    for (const trouve of contenu.matchAll(/(?<![\w-])ph-[a-z0-9-]+/g)) {
      const nom = trouve[0]
      if (PREFIXES_DE_VARIANTE.has(nom)) continue
      if (nom.startsWith('ph-fill-')) employees.fill.add(nom.replace('ph-fill-', 'ph-'))
      else employees.regular.add(nom)
    }
  }
  return employees
}

function ecrireOuVerifier(chemin, contenu) {
  const relatif = relative(RACINE, chemin)
  if (verifier) {
    if (!existsSync(chemin)) {
      console.error(`✗ ${relatif} : ABSENT — relancez le script sans --verifier`)
      return false
    }
    const commite = readFileSync(chemin)
    const attendu = Buffer.isBuffer(contenu) ? contenu : Buffer.from(contenu, 'utf8')
    if (!commite.equals(attendu)) {
      console.error(`✗ ${relatif} : le commité DIFFÈRE de ce que la source engendre`)
      return false
    }
    console.log(`✓ ${relatif} : identique à l'octet`)
    return true
  }
  mkdirSync(dirname(chemin), { recursive: true })
  writeFileSync(chemin, contenu)
  const taille = Buffer.isBuffer(contenu) ? contenu.length : Buffer.byteLength(contenu)
  console.log(`  écrit ${relatif} — ${taille} o`)
  return true
}

const employees = iconesEmployees(fichiersSources(SOURCES))
const lignesCss = [
  '/* ═══════════════════════════════════════════════════════════════════════',
  '   ENGENDRÉ PAR scripts/polices/sous-regler-icones.mjs — NE PAS ÉDITER.',
  '',
  '   Les glyphes réellement employés par app/, et rien de plus. La source est',
  '   @phosphor-icons/web ; ce fichier et les .woff2 à côté sont ce qui part au',
  '   client. Aucun chargement depuis un service distant : l\'ouverture hors',
  '   ligne l\'interdit.',
  '',
  '   Pour régénérer : node scripts/polices/sous-regler-icones.mjs',
  '   Pour vérifier  : node scripts/polices/sous-regler-icones.mjs --verifier',
  '   ═══════════════════════════════════════════════════════════════════════ */',
  '',
]

let succes = true
let totalGlyphes = 0

for (const variante of VARIANTES) {
  const table = pointsDeCode(variante.css, variante.prefixe)
  const noms = [...employees[variante.cle]].sort()
  const inconnues = noms.filter((n) => !table.has(n))
  if (inconnues.length > 0) {
    console.error(`✗ ${variante.cle} : icône(s) inconnue(s) de la source : ${inconnues.join(', ')}`)
    succes = false
    continue
  }

  const codes = noms.map((n) => table.get(n)).sort((a, b) => a - b)
  const texte = codes.map((c) => String.fromCodePoint(c)).join('')
  totalGlyphes += codes.length

  const source = readFileSync(join(RACINE, variante.woff2))
  // Une chaîne vide ferait produire à harfbuzz une police sans aucun glyphe :
  // on saute plutôt que d'expédier un fichier qui ne sert à rien.
  const sousRegle =
    texte.length > 0 ? await subsetFont(source, texte, { targetFormat: 'woff2' }) : Buffer.alloc(0)

  if (texte.length > 0) {
    succes = ecrireOuVerifier(join(SORTIE, variante.fichier), sousRegle) && succes
    lignesCss.push(
      '@font-face {',
      `  font-family: "${variante.famille}";`,
      `  src: url("./${variante.fichier}") format("woff2");`,
      '  font-weight: normal;',
      '  font-style: normal;',
      // `block` et non `swap` : une icône remplacée par un carré pendant le
      // chargement dit quelque chose de faux ; une icône absente ne dit rien.
      '  font-display: block;',
      '}',
      '',
    )
  }

  // Une variante sans glyphe n'écrit RIEN : un sélecteur qui pointerait vers une
  // famille non déclarée est une règle morte, et une règle morte se lit comme
  // une règle vivante.
  if (noms.length === 0) {
    console.log(`  ${variante.cle} : aucun glyphe — variante non déclarée`)
    continue
  }

  const selecteur = variante.cle === 'fill' ? '.ph-fill' : '.ph'
  const prefixeClasse = variante.cle === 'fill' ? 'ph-fill-' : ''
  lignesCss.push(
    `${selecteur} {`,
    `  font-family: "${variante.famille}";`,
    '  font-style: normal;',
    '  font-weight: normal;',
    '  font-variant: normal;',
    '  line-height: 1;',
    '  text-transform: none;',
    '  display: inline-block;',
    '  speak: never;',
    '  -webkit-font-smoothing: antialiased;',
    '  -moz-osx-font-smoothing: grayscale;',
    '}',
    '',
  )

  for (const nom of noms) {
    const code = table.get(nom).toString(16)
    const classe = prefixeClasse ? nom.replace(/^ph-/, prefixeClasse) : nom
    lignesCss.push(`${selecteur}.${classe}::before { content: "\\${code}"; }`)
  }
  if (noms.length > 0) lignesCss.push('')

  console.log(`  ${variante.cle} : ${noms.length} glyphe(s) — ${noms.join(', ') || '(aucun)'}`)
}

succes = ecrireOuVerifier(join(SORTIE, 'icones.css'), lignesCss.join('\n')) && succes

console.log(`\n${totalGlyphes} glyphe(s) sous-réglé(s) au total.`)
if (!succes) process.exit(1)
