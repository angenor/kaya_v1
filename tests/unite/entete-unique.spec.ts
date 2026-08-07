import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * **IL Y A EXACTEMENT UN `<header>` DANS LE DÉPÔT** — contrat de grammaire §1.
 *
 * ⚠️ CE N'EST PAS UNE RÈGLE DE STYLE, C'EST CE QUI REND LA GRAMMAIRE
 * TRANSMISSIBLE. Six cycles vont poser onze écrans ; si chacun écrit son
 * en-tête, l'exploitant en apprendra onze — et le onzième aura un sélecteur
 * ailleurs, un témoin absent, une heure au fuseau de l'appareil. Le défaut ne se
 * verrait qu'à l'usage, chez quelqu'un qui n'a pas le vocabulaire pour le dire.
 *
 * ⚠️ ET LE CONTRÔLE PORTE SUR LE **SOURCE**, pas sur un rendu. Un `<header>`
 * ajouté à une page qu'aucun test de navigateur ne visite passerait inaperçu
 * jusqu'au cycle qui la construit. Ici, il rougit à l'écriture.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))
const APP = join(racine, 'app')

/** Le fichier qui a le droit d'en porter un — et lui seul. */
const PORTEUR = 'core/coquille/EnTeteContexte.vue'

/**
 * ⚠️ LES **INSTRUMENTS** SONT EXEMPTÉS DE LA RÈGLE D'EMPRUNT, ET L'EXEMPTION EST
 * CALCULÉE, PAS ÉNUMÉRÉE — une route à trait bas, qu'un exploitant ne voit
 * jamais.
 *
 * Le guide de style monte **tous** les composants, en-tête compris : c'est sa
 * raison d'être. Le panneau Scénarios monte le témoin d'envoi pour qu'on VOIE
 * l'effet du levier qu'on vient d'actionner — sans lui, on réglerait la latence
 * sans jamais constater ce qu'elle produit. Aucun des deux ne reconstruit une
 * barre de contexte : ils rendent un composant à côté d'un réglage.
 *
 * ⚠️ ET L'EXEMPTION SE LIT DANS LE FICHIER LUI-MÊME. Une liste de noms écrite
 * ici s'allongerait d'une ligne à chaque instrument, et personne ne relirait
 * pourquoi. La route décide : `/_` est un instrument, tout le reste est du
 * produit.
 */
function estUnInstrument(contenu: string): boolean {
  return /definePageMeta\(\{[^}]*path:\s*'\/_/.test(contenu)
}

/**
 * Le bloc `<template>` seul, commentaires ôtés.
 *
 * ⚠️ SANS CELA, LE TEST ROUGIT SUR SES PROPRES EXPLICATIONS. Chaque docbloc de
 * ce dépôt cite `<header>` pour dire la règle — le gabarit `vierge` écrit
 * « ne porte aucun second `<header>` », et c'est précisément ce qu'on veut lire.
 * **Constaté en écrivant ce test** : il accusait le fichier qui documente
 * l'interdiction de la violer.
 */
function gabarit(contenu: string): string {
  const bloc = contenu.match(/<template>([\s\S]*)<\/template>/)
  return (bloc?.[1] ?? '').replace(/<!--[\s\S]*?-->/g, '')
}

function fichiersVue(dossier: string, prefixe = ''): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    const relatif = prefixe === '' ? nom : `${prefixe}/${nom}`
    if (statSync(chemin).isDirectory()) return fichiersVue(chemin, relatif)
    return nom.endsWith('.vue') ? [relatif] : []
  })
}

describe('l’en-tête est défini UNE FOIS, et aucun écran ne le recopie', () => {
  const fichiers = fichiersVue(APP)

  it('inspecte assez de fichiers pour que son vert veuille dire quelque chose', () => {
    // Un ratissage cassé rendrait zéro fichier, donc zéro `<header>`, donc un
    // vert qui ne compare plus rien.
    expect(fichiers.length, `fichiers trouvés : ${fichiers.length}`).toBeGreaterThan(20)
    expect(fichiers).toContain(PORTEUR)
  })

  it('⚠️ EXACTEMENT UN `<header>` DANS TOUT `app/`', () => {
    const porteurs = fichiers.filter((relatif) =>
      /<header[\s>]/.test(gabarit(readFileSync(join(APP, relatif), 'utf8'))),
    )
    expect(
      porteurs,
      `un second en-tête est apparu : ${porteurs.join(', ')} — l'exploitant en apprendrait deux`,
    ).toEqual([PORTEUR])
  })

  it('aucune PAGE n’écrit d’en-tête, même sous un autre nom', () => {
    // ⚠️ LE CONTRÔLE VA AU-DELÀ DE LA BALISE. Une page qui poserait son propre
    // sélecteur d'établissement ou son propre témoin reconstruirait l'en-tête
    // sans écrire `<header>` — et l'exploitant verrait deux repères qui se
    // contredisent.
    const pages = fichiers.filter((relatif) => relatif.startsWith('pages/'))
    expect(pages.length, 'aucune page trouvée').toBeGreaterThan(2)
    let inspectees = 0
    for (const page of pages) {
      const source = readFileSync(join(APP, page), 'utf8')
      if (estUnInstrument(source)) continue
      inspectees += 1
      const contenu = gabarit(source)
      for (const emprunt of ['SelecteurEtablissement', 'TemoinSynchronisation']) {
        expect(
          contenu.includes(emprunt),
          `${page} monte ${emprunt} : c'est l'en-tête reconstruit dans un écran`,
        ).toBe(false)
      }
    }
    // ⚠️ LE PLANCHER : si l'exemption avalait toutes les pages, le contrôle
    // serait vert en n'inspectant rien.
    expect(inspectees, 'aucun écran du produit inspecté — le contrôle serait vide').toBeGreaterThan(1)
  })

  it('le gabarit MONTE l’en-tête, il ne le rédige pas', () => {
    const defaut = readFileSync(join(APP, 'layouts/defaut.vue'), 'utf8')
    expect(defaut).toContain('EnTeteContexte')
    expect(gabarit(defaut), 'le gabarit a repris la rédaction de l’en-tête').not.toMatch(
      /<header[\s>]/,
    )
  })

  it('⚠️ `R0` EMPLOIE LE GABARIT SANS EN-TÊTE, et c’est écrit dans la page', () => {
    // FR-009 : avant l'entrée il n'y a ni établissement, ni poste, ni personne.
    // Le gabarit `vierge` existe pour cela, et la page le DEMANDE — sans quoi
    // `app.vue` lui donnerait celui par défaut, en silence.
    const connexion = readFileSync(join(APP, 'pages/connexion.vue'), 'utf8')
    expect(connexion).toContain("layout: 'vierge'")
    const vierge = gabarit(readFileSync(join(APP, 'layouts/vierge.vue'), 'utf8'))
    expect(vierge, 'le gabarit vierge porte un en-tête : R0 en aurait un').not.toMatch(/<header[\s>]/)
    expect(vierge, 'le gabarit vierge doit porter le <main> unique').toContain('<main')
  })
})
