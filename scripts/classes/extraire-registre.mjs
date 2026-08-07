#!/usr/bin/env node
/**
 * Extrait de `docs/registre-classes-offline.md` la classe de chaque entité et de
 * chaque opération, et l'écrit en JSON pour que l'application la LISE au lieu de
 * la recopier.
 *
 * ⚠️ LE MARKDOWN FAIT FOI, LE JSON EN EST L'EXTRACTION. Une classe recopiée à la
 * main dans un composant diverge au premier changement, et la divergence ne se
 * voit qu'à la première coupure réseau en exploitation.
 *
 * ⚠️ L'EXTRACTION LIT LES TABLEAUX `| entité | **CLASSE** | branche | réf. |`.
 * Quand une même entité porte DEUX classes selon l'opération — c'est le cas
 * normal, dit le registre —, la PLUS STRICTE l'emporte : « en cas de doute,
 * classer plus strictement ».
 *
 * USAGE : node scripts/classes/extraire-registre.mjs [--verifier]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const SOURCE = `${RACINE}docs/registre-classes-offline.md`
const CIBLE = `${RACINE}app/core/file/registre-classes.json`

const verifier = process.argv.includes('--verifier')
const SEVERITE = { A: 0, B: 1, C: 2, D: 3 }

const lignes = readFileSync(SOURCE, 'utf8').split('\n')
const classes = new Map()

for (const ligne of lignes) {
  if (!ligne.startsWith('|')) continue
  const cellules = ligne.split('|').slice(1, -1).map((c) => c.trim())
  if (cellules.length < 2) continue
  const classe = cellules[1].replace(/\*/g, '').trim()
  if (!['A', 'B', 'C', 'D'].includes(classe)) continue
  // Le nom de l'entité est entre accents graves ; une ligne peut en citer
  // plusieurs — « `role`, `permission`, `role_permission` — référentiels ».
  for (const trouve of cellules[0].matchAll(/`([^`]+)`/g)) {
    const nom = trouve[1].split('.')[0].trim()
    if (!/^[a-z_][a-z0-9_]*$/.test(nom)) continue
    const connue = classes.get(nom)
    if (!connue || SEVERITE[classe] > SEVERITE[connue]) classes.set(nom, classe)
  }
}

const trie = Object.fromEntries([...classes.entries()].sort(([a], [b]) => a.localeCompare(b)))
const contenu = `${JSON.stringify(trie, null, 2)}\n`

if (verifier) {
  if (!existsSync(CIBLE) || readFileSync(CIBLE, 'utf8') !== contenu) {
    console.error(`✗ ${CIBLE} diffère de ce que le registre engendre`)
    process.exit(1)
  }
  console.log(`✓ registre à jour — ${Object.keys(trie).length} entrée(s)`)
} else {
  writeFileSync(CIBLE, contenu)
  console.log(`  écrit ${Object.keys(trie).length} entrée(s) dans ${CIBLE}`)
}
