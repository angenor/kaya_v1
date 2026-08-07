import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * `docs/design/theme.css` est le SEUL fichier de `docs/design/` qui se copie
 * dans `app/` (constitution, principe 12). Deux tests le gardent, et ils ne
 * prouvent pas la même chose — c'est tout l'intérêt d'en avoir deux.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))
const CHEMIN_SOURCE = `${racine}docs/design/theme.css`
const CHEMIN_COPIE = `${racine}app/assets/css/theme.css`

const lire = (chemin: string) => readFileSync(chemin, 'utf8')
const empreinte = (contenu: string) => createHash('sha256').update(contenu).digest('hex')

/** Les déclarations `--nom: valeur` d'un bloc, dans l'ordre du fichier. */
function jetonsDuBloc(contenu: string, ouverture: string): Map<string, string> {
  const debut = contenu.indexOf(ouverture)
  if (debut === -1) throw new Error(`bloc introuvable : ${ouverture}`)

  // Comptage d'accolades : le bloc `@theme static` contient des `var(...)` et
  // des `rgb(... / ...)`, jamais d'accolade imbriquée — mais compter reste plus
  // sûr que chercher la première `}`, qu'un ajout futur déplacerait.
  let profondeur = 0
  let fin = debut
  for (let i = debut + ouverture.length - 1; i < contenu.length; i += 1) {
    if (contenu[i] === '{') profondeur += 1
    else if (contenu[i] === '}') {
      profondeur -= 1
      if (profondeur === 0) {
        fin = i
        break
      }
    }
  }

  const corps = contenu.slice(debut, fin)
  const jetons = new Map<string, string>()
  for (const ligne of corps.split('\n')) {
    const declaration = ligne.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.+?)\s*;/)
    if (declaration) jetons.set(declaration[1]!, declaration[2]!)
  }
  return jetons
}

describe('theme.css — la copie est conforme à sa source', () => {
  it('porte la MÊME EMPREINTE que docs/design/theme.css', () => {
    const source = lire(CHEMIN_SOURCE)
    const copie = lire(CHEMIN_COPIE)

    expect(empreinte(copie)).toBe(empreinte(source))
    expect(copie.length).toBe(source.length)
  })

  it('déclare @theme static — sans quoi Tailwind élaguerait les jetons inutilisés', () => {
    // Le commentaire du fichier le dit : « sans lui, Tailwind 4 élague toute
    // variable de @theme qu'aucun utilitaire n'emploie dans le fichier
    // compilé ». --color-voile, --ease-elastique et les durées disparaîtraient.
    expect(lire(CHEMIN_COPIE)).toContain('@theme static {')
  })
})

describe('theme.css — la SYMÉTRIE des jetons de mode', () => {
  // ⚠️ CE TEST NE FAIT PAS DOUBLON AVEC L'EMPREINTE, et c'est le point.
  // L'empreinte prouve l'égalité à la source ; elle ne dit RIEN de la symétrie.
  // Un jeton défini en clair et oublié en sombre rend un composant illisible sur
  // la moitié du parc SANS LEVER AUCUNE ERREUR — et les deux fichiers seraient
  // pourtant identiques (FR-008).

  const contenu = lire(CHEMIN_COPIE)
  const clair = jetonsDuBloc(contenu, '@theme static {')
  const sombre = jetonsDuBloc(contenu, '.dark {')

  const couleursClair = [...clair.keys()].filter((n) => n.startsWith('--color-'))
  const couleursSombre = [...sombre.keys()].filter((n) => n.startsWith('--color-'))

  it('déclare sous .dark CHAQUE couleur du bloc clair', () => {
    const oubliees = couleursClair.filter((n) => !sombre.has(n))
    expect(oubliees, `couleurs sans valeur sombre : ${oubliees.join(', ')}`).toEqual([])
  })

  it('ne déclare sous .dark AUCUNE couleur absente du bloc clair', () => {
    // Le sens inverse compte autant : une couleur qui n'existerait qu'en sombre
    // serait une seconde palette, ce que le principe 12 refuse.
    const orphelines = couleursSombre.filter((n) => !clair.has(n))
    expect(orphelines, `couleurs sans valeur claire : ${orphelines.join(', ')}`).toEqual([])
  })

  it('inspecte assez de couleurs pour que son vert veuille dire quelque chose', () => {
    // Un extracteur cassé rendrait deux ensembles vides, donc deux différences
    // vides, donc un vert qui ne compare plus rien.
    expect(couleursClair.length).toBeGreaterThanOrEqual(30)
    expect(couleursSombre.length).toBeGreaterThanOrEqual(30)
  })

  it("n'exempte une ombre du mode sombre que si elle est écrite en var(--color-…)", () => {
    // Les ombres ne sont pas toutes redéclarées sous .dark, et c'est correct :
    // --shadow-bouton vaut `0 2px 0 var(--color-prim-dk)`, donc elle SUIT le
    // mode par sa couleur. L'exemption est vérifiée au lieu d'être supposée.
    const ombresClair = [...clair.entries()].filter(([n]) => n.startsWith('--shadow-'))
    const fautives = ombresClair
      .filter(([n]) => !sombre.has(n))
      .filter(([, valeur]) => !valeur.includes('var(--color-'))
      .map(([n]) => n)

    expect(
      fautives,
      `ombres sans valeur sombre ET sans couleur qui suive le mode : ${fautives.join(', ')}`,
    ).toEqual([])
    expect(ombresClair.length).toBeGreaterThanOrEqual(5)
  })
})
