#!/usr/bin/env node
/**
 * Engendre les icônes du manifeste d'application.
 *
 * POURQUOI UN SCRIPT ET NON DES FICHIERS DESSINÉS. Les icônes doivent exister en
 * trois tailles et deux formes (pleine et masquable), et elles doivent porter la
 * MÊME couleur que le jeton `--color-ocre` de `docs/design/theme.css`. Un fichier
 * binaire dessiné à la main dériverait du jeton sans que rien ne le signale ; ce
 * script LIT la valeur dans le thème, donc l'icône suit la direction visuelle.
 *
 * ⚠️ L'OCRE, PAS L'INDIGO. « L'indigo est un signal, pas une décoration : ce qui
 * est indigo se touche » (tokens.md, règle 1). Une icône d'application ne se
 * touche pas au sens du produit — elle EST le produit. L'initiale est en ocre
 * dans le sélecteur d'établissement, et l'icône reprend la même terre.
 *
 * DÉTERMINISME. Aucune date, aucun aléa : le même thème produit les mêmes
 * octets. `--verifier` le constate par comparaison, et non par lecture.
 *
 * USAGE
 *   node scripts/icones/engendrer-icones.mjs
 *   node scripts/icones/engendrer-icones.mjs --verifier
 */

import { deflateSync } from 'node:zlib'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const THEME = join(RACINE, 'app/assets/css/theme.css')
const SORTIE = join(RACINE, 'public')

const verifier = process.argv.includes('--verifier')

/** Lit une couleur du bloc clair de theme.css. La source de vérité, pas une copie. */
function jetonCouleur(nom) {
  const contenu = readFileSync(THEME, 'utf8')
  const trouve = contenu.match(new RegExp(`--color-${nom}:\\s*(#[0-9a-fA-F]{6})`))
  if (!trouve) throw new Error(`jeton --color-${nom} introuvable dans ${THEME}`)
  const hex = trouve[1]
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

/* ── Encodeur PNG minimal ───────────────────────────────────────────────────
   Zéro dépendance : `zlib` est dans Node. Un encodeur PNG tient en trente
   lignes, et il évite une bibliothèque d'images de plusieurs mégaoctets pour
   quatre carrés de couleur unie. */

function crc32(donnees) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n += 1) {
      let c = n
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let crc = -1
  for (const octet of donnees) crc = (crc >>> 8) ^ table[(crc ^ octet) & 0xff]
  return (crc ^ -1) >>> 0
}

function bloc(type, donnees) {
  const longueur = Buffer.alloc(4)
  longueur.writeUInt32BE(donnees.length)
  const corps = Buffer.concat([Buffer.from(type, 'latin1'), donnees])
  const somme = Buffer.alloc(4)
  somme.writeUInt32BE(crc32(corps))
  return Buffer.concat([longueur, corps, somme])
}

function encoderPng(largeur, hauteur, pixels) {
  const entete = Buffer.alloc(13)
  entete.writeUInt32BE(largeur, 0)
  entete.writeUInt32BE(hauteur, 4)
  entete[8] = 8 // 8 bits par canal
  entete[9] = 6 // RGBA
  const lignes = Buffer.alloc(hauteur * (1 + largeur * 4))
  for (let y = 0; y < hauteur; y += 1) {
    lignes[y * (1 + largeur * 4)] = 0 // filtre « none » : déterministe
    pixels.copy(lignes, y * (1 + largeur * 4) + 1, y * largeur * 4, (y + 1) * largeur * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloc('IHDR', entete),
    bloc('IDAT', deflateSync(lignes, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Dessine l'icône : un fond ocre, et le K de Kaya en contreforts — une barre
 * verticale et deux obliques, le geste Banco. `marge` réserve la zone sûre des
 * icônes masquables : Android peut rogner jusqu'à 20 % de chaque bord.
 */
function dessiner(cote, fond, encre, marge) {
  const pixels = Buffer.alloc(cote * cote * 4)
  const utile = cote * (1 - 2 * marge)
  const origine = cote * marge
  // Proportions du K, en fraction du carré utile.
  const barreX = 0.24
  const barreLargeur = 0.14
  const traitEpaisseur = 0.145

  for (let y = 0; y < cote; y += 1) {
    for (let x = 0; x < cote; x += 1) {
      const u = (x - origine) / utile
      const v = (y - origine) / utile
      let couleur = fond
      if (u >= 0 && u <= 1 && v >= 0.12 && v <= 0.88) {
        const dansBarre = u >= barreX && u <= barreX + barreLargeur
        // L'oblique haute monte de la barre vers le coin supérieur droit ;
        // la basse en descend. Distance au segment, en coordonnées obliques.
        const hauteOk = v <= 0.5 && Math.abs(u - (barreX + barreLargeur) - (0.5 - v) * 1.1) < traitEpaisseur
        const basseOk = v >= 0.5 && Math.abs(u - (barreX + barreLargeur) - (v - 0.5) * 1.1) < traitEpaisseur
        if (dansBarre || hauteOk || basseOk) couleur = encre
      }
      const i = (y * cote + x) * 4
      pixels[i] = couleur[0]
      pixels[i + 1] = couleur[1]
      pixels[i + 2] = couleur[2]
      pixels[i + 3] = 255
    }
  }
  return encoderPng(cote, cote, pixels)
}

function ecrireOuVerifier(nom, contenu) {
  const chemin = join(SORTIE, nom)
  const relatif = relative(RACINE, chemin)
  if (verifier) {
    if (!existsSync(chemin)) {
      console.error(`✗ ${relatif} : ABSENT`)
      return false
    }
    if (!readFileSync(chemin).equals(contenu)) {
      console.error(`✗ ${relatif} : le commité DIFFÈRE de ce que le thème engendre`)
      return false
    }
    console.log(`✓ ${relatif} : identique à l'octet`)
    return true
  }
  mkdirSync(SORTIE, { recursive: true })
  writeFileSync(chemin, contenu)
  console.log(`  écrit ${relatif} — ${contenu.length} o`)
  return true
}

const ocre = jetonCouleur('ocre')
const encre = jetonCouleur('ocre-ink')

// La zone sûre d'une icône masquable est le cercle inscrit à 80 % : Android peut
// rogner jusqu'à 20 % de chaque bord. Une icône pleine n'a pas cette contrainte.
const ICONES = [
  { nom: 'icone-192.png', cote: 192, marge: 0.14 },
  { nom: 'icone-512.png', cote: 512, marge: 0.14 },
  { nom: 'icone-maskable-512.png', cote: 512, marge: 0.26 },
  { nom: 'favicon-64.png', cote: 64, marge: 0.1 },
]

let succes = true
for (const { nom, cote, marge } of ICONES) {
  succes = ecrireOuVerifier(nom, dessiner(cote, ocre, encre, marge)) && succes
}

if (!succes) process.exit(1)
