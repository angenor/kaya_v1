import { describe, expect, it } from 'vitest'

import en from '../../app/core/i18n/en'
import fr from '../../app/core/i18n/fr'

/**
 * LES DEUX CATALOGUES, À PARITÉ STRICTE — DANS LES DEUX SENS.
 *
 * ⚠️ UNE COMPARAISON À UN SEUL SENS NE SERT À RIEN. Le sens « fr → en » attrape
 * la clé non traduite ; le sens « en → fr » attrape la clé ORPHELINE, restée
 * après un renommage. La seconde est la plus insidieuse : elle ne s'affiche
 * jamais, donc rien ne la signale, et elle finit par faire croire que le
 * catalogue anglais couvre plus qu'il ne couvre.
 */

type Catalogue = Record<string, unknown>

/** Aplatit un catalogue en chemins pointés : `theme.clair`. */
function chemins(objet: Catalogue, prefixe = ''): string[] {
  return Object.entries(objet).flatMap(([cle, valeur]) => {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle
    return valeur !== null && typeof valeur === 'object'
      ? chemins(valeur as Catalogue, chemin)
      : [chemin]
  })
}

/** Toutes les valeurs de texte d'un catalogue. */
function valeurs(objet: Catalogue): string[] {
  return Object.values(objet).flatMap((valeur) =>
    valeur !== null && typeof valeur === 'object'
      ? valeurs(valeur as Catalogue)
      : [String(valeur)],
  )
}

const cheminsFr = chemins(fr as Catalogue)
const cheminsEn = chemins(en as Catalogue)

describe('la parité des catalogues', () => {
  it('inspecte assez de clés pour que son vert veuille dire quelque chose', () => {
    // Un extracteur cassé rendrait deux listes vides, donc deux différences
    // vides, donc un vert qui ne compare plus rien.
    expect(cheminsFr.length).toBeGreaterThanOrEqual(40)
    expect(cheminsEn.length).toBeGreaterThanOrEqual(40)
  })

  it('fr → en : aucune clé française sans traduction', () => {
    const manquantes = cheminsFr.filter((c) => !cheminsEn.includes(c))
    expect(manquantes, `clés absentes de en.ts : ${manquantes.join(', ')}`).toEqual([])
  })

  it('en → fr : aucune clé anglaise orpheline', () => {
    const orphelines = cheminsEn.filter((c) => !cheminsFr.includes(c))
    expect(orphelines, `clés absentes de fr.ts : ${orphelines.join(', ')}`).toEqual([])
  })

  it('aucune valeur vide — une clé vide se lit comme une clé absente', () => {
    for (const catalogue of [fr, en] as Catalogue[]) {
      const vides = valeurs(catalogue).filter((v) => v.trim() === '')
      expect(vides).toEqual([])
    }
  })
})

describe('SC-022 · les trois noms d’état internes n’entrent dans aucun catalogue', () => {
  // ⚠️ LE LEXIQUE DOCUMENTE QUE CE FICHIER A DÉJÀ FAIT CETTE FAUTE EXACTE :
  // « app/core/i18n disait "Connecté", "Hors ligne", "{n} éléments en attente",
  // ce qui décrit le RÉSEAU au lieu de dire ce qui compte pour Aminata : son
  // travail est-il en sécurité ». Le témoin est sur CHAQUE écran du produit —
  // les six cycles suivants auraient hérité des mauvais libellés.
  /**
   * ⚠️ CES MOTS-LÀ SONT PROSCRITS **OÙ QU'ILS SOIENT**, phrase comprise. Le
   * lexique le documente sur un cas réel : « Installée, elle s'ouvre même sans
   * réseau » disait « hors ligne », et c'est ce contrôle qui l'a attrapé dans
   * cette phrase même.
   */
  const PROSCRITS_PARTOUT = ['dégradé', 'dégradée', 'hors ligne', 'offline', 'degraded']

  /**
   * ⚠️ « CONNECTÉ » EST PROSCRIT COMME **LIBELLÉ D'ÉTAT**, ET AUTORISÉ COMME
   * MOT — conflit constaté au cycle F2, tranché par la préséance.
   *
   * Le contrôle interdisait le mot partout, y compris dans une phrase. Or le
   * lexique — qui prime sur tout catalogue et sur ce test — l'emploie deux fois
   * dans le vocabulaire **visible** : « l'utilisateur voit un **appareil
   * connecté** » (entrée Session), et « **Vous resterez connectée sur cet
   * appareil.** » (annonce de persistance de `R0`). Interdire le mot par
   * inclusion aurait forcé `R0` à écrire autre chose que ce que le lexique lui
   * prescrit — c'est-à-dire à faire dériver le produit pour satisfaire un test.
   *
   * Ce qui est proscrit reste ce qu'il a toujours été : « Connecté » **en tant
   * qu'état du témoin**, à côté de « Dégradé » et « Hors ligne ». Le contrôle
   * porte donc sur la valeur ENTIÈRE, ponctuation ôtée.
   */
  const PROSCRITS_COMME_LIBELLE = ['connecté', 'connectée', 'connected']

  for (const [langue, catalogue] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    it(`${langue} : zéro occurrence des mots proscrits`, () => {
      const fautives = valeurs(catalogue as Catalogue).filter((valeur) => {
        const minuscule = valeur.toLowerCase()
        if (PROSCRITS_PARTOUT.some((mot) => minuscule.includes(mot))) return true
        const nue = minuscule.replace(/[.…!?\s]+$/g, '').trim()
        return PROSCRITS_COMME_LIBELLE.includes(nue)
      })
      expect(fautives, `valeurs fautives : ${fautives.join(' · ')}`).toEqual([])
    })
  }

  it('les quatre libellés du témoin sont ceux du lexique, mot pour mot', () => {
    const temoinFr = (fr as Catalogue).temoin as Record<string, string>
    const temoinEn = (en as Catalogue).temoin as Record<string, string>
    expect(temoinFr.enregistre).toBe('Enregistré')
    expect(temoinFr.enAttenteEnvoi).toBe("En attente d'envoi ({n})")
    expect(temoinFr.connexionFaible).toBe('Connexion faible')
    expect(temoinFr.horsConnexion).toBe('Hors connexion')
    expect(temoinEn.enregistre).toBe('Saved')
    expect(temoinEn.enAttenteEnvoi).toBe('Pending send ({n})')
    expect(temoinEn.connexionFaible).toBe('Weak connection')
    expect(temoinEn.horsConnexion).toBe('No connection')
  })
})
