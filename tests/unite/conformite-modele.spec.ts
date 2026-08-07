import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as test from '../../app/core/donnees/jeux/residence-test'

/**
 * LE JEU SIMULÉ A LA **FORME** DU MODÈLE : mêmes noms de champs, mêmes types,
 * mêmes valeurs d'énumération (constitution, principe 0 ; FR-040).
 *
 * ⚠️ CE TEST **LIT LES FICHIERS `.sql`**. Il n'y a donc pas de seconde liste à
 * tenir, et elle ne peut pas diverger. Une liste de colonnes recopiée ici serait
 * juste le jour où on l'écrit et fausse au premier `ALTER TABLE`.
 *
 * ⚠️ ET C'EST CE TEST QUI REND LE BRANCHEMENT DE LA PHASE 3 MÉCANIQUE. Un champ
 * mal nommé aujourd'hui coûte une correction de trois lignes ; le même champ
 * découvert au branchement coûte un écran et son test.
 */

const racine = fileURLToPath(new URL('../..', import.meta.url))
const MODELE = join(racine, 'docs/modele-donnees')

/** `snake_case` → `camelCase`. LE SEUL écart autorisé, et il est mécanique. */
function enCamel(nom: string): string {
  return nom.replace(/_([a-z0-9])/g, (_, lettre: string) => lettre.toUpperCase())
}

/** Les colonnes déclarées par une table du modèle, dans l'ordre du fichier. */
function colonnesDeLaTable(fichier: string, table: string): string[] {
  const contenu = readFileSync(join(MODELE, fichier), 'utf8')
  const bloc = contenu.match(
    new RegExp(`CREATE TABLE [a-z_]+\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, 'm'),
  )
  if (!bloc) throw new Error(`table introuvable dans ${fichier} : ${table}`)
  return [
    ...new Set(
      bloc[1]!
        .split('\n')
        .map((ligne) => ligne.trim())
        .filter((ligne) => /^[a-z_]+\s+[A-Za-z]/.test(ligne))
        .filter((ligne) => !/^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|EXCLUDE)\b/.test(ligne))
        .map((ligne) => ligne.split(/\s+/)[0]!),
    ),
  ]
}

/**
 * LES COLONNES DÉLIBÉRÉMENT NON REPRISES, AVEC LEUR MOTIF.
 *
 * ⚠️ CHACUNE EST ÉCRITE ICI, ET LE TEST EXIGE QU'ELLE LE SOIT. Sans cette
 * liste, « le type ne porte pas ce champ » serait indistinguable de « on l'a
 * oublié » — et c'est exactement la différence qui compte.
 */
const NON_REPRISES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  '*': {
    cree_le:
      "horodatage d'autorité : posé par la BASE, jamais par le client. Le principe 4 est formel — toute logique s'appuie sur l'heure du serveur, jamais sur l'horloge d'un terminal",
    modifie_le:
      "même motif que cree_le : c'est la base qui l'écrit, et un jeu simulé qui le porterait ferait croire qu'un client peut le fixer",
  },
  compte: {
    empreinte_mot_de_passe:
      'AUCUN SECRET DANS LE PAQUET SERVI AU NAVIGATEUR (cadrage §12.1, FR-094). La colonne réapparaîtra côté serveur en phase 3, et jamais dans une réponse',
  },
  personne: {
    piece_capturee_le:
      "donnée de MOUVEMENT : la pièce se capture à l'arrivée, et c'est le cycle SEJ qui la peuple. Ce cycle porte le référentiel",
    consentement_le:
      'même motif : le consentement se recueille devant le client, au moment du séjour, pas au référentiel',
  },
}

/** Les types simulés, avec la table dont ils prennent la forme. */
const CORRESPONDANCES = [
  { type: 'Tenant', fichier: '10-etablissements.sql', table: 'tenant', exemple: deloria.tenants[0] },
  { type: 'Etablissement', fichier: '10-etablissements.sql', table: 'etablissement', exemple: deloria.etablissements[0] },
  { type: 'ModuleActivite', fichier: '10-etablissements.sql', table: 'module_activite', exemple: deloria.modulesActivite[0] },
  { type: 'EtablissementModule', fichier: '10-etablissements.sql', table: 'etablissement_module', exemple: deloria.etablissementModules[0] },
  { type: 'PointDeVente', fichier: '10-etablissements.sql', table: 'point_de_vente', exemple: deloria.pointsDeVente[0] },
  { type: 'Personne', fichier: '20-comptes.sql', table: 'personne', exemple: deloria.personnes[0] },
  { type: 'Compte', fichier: '20-comptes.sql', table: 'compte', exemple: deloria.comptes[0] },
  { type: 'Role', fichier: '20-comptes.sql', table: 'role', exemple: deloria.roles[0] },
  { type: 'CompteRole', fichier: '20-comptes.sql', table: 'compte_role', exemple: deloria.compteRoles[0] },
  { type: 'Permission', fichier: '20-comptes.sql', table: 'permission', exemple: deloria.permissions[0] },
  { type: 'Categorie', fichier: '97-hebergement.sql', table: 'categorie', exemple: deloria.categories[0] },
  { type: 'Unite', fichier: '97-hebergement.sql', table: 'unite', exemple: deloria.unites[0] },
  { type: 'Formule', fichier: '97-hebergement.sql', table: 'formule', exemple: deloria.formules[0] },
  { type: 'BaremePalier', fichier: '97-hebergement.sql', table: 'bareme_palier', exemple: deloria.baremePaliers[0] },
  { type: 'PlageDemiJournee', fichier: '97-hebergement.sql', table: 'plage_demi_journee', exemple: deloria.plagesDemiJournee[0] },
  { type: 'TempsRemiseEnEtat', fichier: '97-hebergement.sql', table: 'temps_remise_en_etat', exemple: deloria.tempsRemiseEnEtat[0] },
  { type: 'CategorieArticle', fichier: '55-ventes.sql', table: 'categorie_article', exemple: deloria.categoriesArticle[0] },
  { type: 'Article', fichier: '55-ventes.sql', table: 'article', exemple: deloria.articles[0] },
] as const

describe('le jeu simulé a la forme du modèle SQL', () => {
  it('inspecte assez de tables pour que son vert veuille dire quelque chose', () => {
    // Un extracteur cassé rendrait des listes vides, donc zéro écart, donc un
    // vert qui ne compare plus rien.
    expect(CORRESPONDANCES.length).toBeGreaterThanOrEqual(18)
    for (const { fichier, table } of CORRESPONDANCES) {
      expect(colonnesDeLaTable(fichier, table).length, `${table}`).toBeGreaterThan(3)
    }
  })

  for (const { type, fichier, table, exemple } of CORRESPONDANCES) {
    describe(`${type} ← ${table}`, () => {
      const colonnes = colonnesDeLaTable(fichier, table)
      const champs = Object.keys(exemple as object)
      const exemptions = { ...NON_REPRISES['*'], ...(NON_REPRISES[table] ?? {}) }

      it('ne manque aucune colonne, hors celles dont le motif est écrit', () => {
        const manquantes = colonnes
          .filter((colonne) => !champs.includes(enCamel(colonne)))
          .filter((colonne) => !(colonne in exemptions))
        expect(
          manquantes,
          `colonnes de ${table} absentes du type, et sans motif écrit : ${manquantes.join(', ')}`,
        ).toEqual([])
      })

      it("ne porte aucun champ que la table n'a pas", () => {
        // Le sens inverse compte autant : un champ inventé ici deviendrait une
        // colonne attendue en phase 3, et personne ne l'écrirait.
        const enTrop = champs.filter((champ) => !colonnes.map(enCamel).includes(champ))
        expect(enTrop, `champs de ${type} absents de ${table} : ${enTrop.join(', ')}`).toEqual([])
      })

      it('chaque exemption porte un motif non vide', () => {
        for (const [colonne, motif] of Object.entries(exemptions)) {
          if (!colonnes.includes(colonne)) continue
          expect(motif.length, `motif de ${table}.${colonne}`).toBeGreaterThan(20)
        }
      })
    })
  }
})

describe('les décomptes du jeu de Deloria', () => {
  it('2 tenants, 2 établissements, 5 modules, 3 points de vente', () => {
    expect([...deloria.tenants, ...test.tenants]).toHaveLength(2)
    expect([...deloria.etablissements, ...test.etablissements]).toHaveLength(2)
    expect(deloria.modulesActivite).toHaveLength(5)
    expect(deloria.pointsDeVente).toHaveLength(3)
    // Le pressing est un COMPTOIR : l'absence de tables EST le comptoir.
    expect(deloria.pointsDeVente.find((p) => p.nom === 'Pressing')?.avecTables).toBe(false)
  })

  it('5 personnes, 5 comptes, et les rôles cumulés', () => {
    expect(deloria.personnes).toHaveLength(5)
    expect(deloria.comptes).toHaveLength(5)
    const rolesAdjoua = deloria.compteRoles.filter((r) => r.compteId === 'compte-adjoua')
    expect(rolesAdjoua, 'Adjoua porte trois rôles — le cumul est la norme').toHaveLength(3)
    const koffi = deloria.compteRoles.filter((r) => r.compteId === 'compte-koffi')
    expect(koffi, 'M. Koffi est propriétaire sur DEUX établissements').toHaveLength(2)
  })

  it('17 unités en 5 catégories, plus la salle de réunion', () => {
    const categoriesChambres = deloria.categories.filter((c) => c.nom !== 'Salle de réunion')
    expect(categoriesChambres).toHaveLength(5)
    const chambres = deloria.unites.filter((u) => u.code !== 'SR1')
    expect(chambres, 'les 17 chambres de Deloria').toHaveLength(17)
    expect(chambres.map((u) => u.code).sort()).toEqual(
      ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'E1', 'E2', 'E3'].sort(),
    )
    expect(deloria.unites.find((u) => u.code === 'SR1')).toBeDefined()
  })

  it('⚠️ prix_base porte le tarif HORS taxe de séjour', () => {
    // Le cadrage §2.1 : les tarifs affichés incluent 500 F de taxe communale,
    // ce qui place l'établissement EN INFRACTION. Le jeu encode la forme
    // CONFORME — sinon la taxe serait comptée DEUX FOIS au premier cycle qui
    // calcule, et le défaut passerait pour un défaut de calcul.
    const nuitees = deloria.formules.filter((f) => f.type === 'NUITEE')
    expect(nuitees.map((f) => f.prixBase).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      12000, 15000, 17000, 20000, 25000,
    ])
    expect(deloria.TAXE_NUITEE_MINEUR).toBe(500)
    for (const formule of nuitees) {
      expect(formule.assujettieTaxeNuitee).toBe(true)
      expect(formule.regleConversionTaxe).toBe('une_nuitee_par_occupation')
    }
  })

  it('le passage et la demi-journée ne sont PAS assujettis — tranché au terrain', () => {
    for (const formule of deloria.formules) {
      if (formule.type === 'PASSAGE' || formule.type === 'DEMI_JOURNEE') {
        expect(formule.assujettieTaxeNuitee, `${formule.id}`).toBe(false)
      }
    }
  })

  it('le barème de passage, à paliers dégressifs', () => {
    const paliers = deloria.baremePaliers.filter((p) => !p.estHeureSupplementaire)
    expect(paliers.map((p) => [p.dureeMinutes, p.prix])).toEqual([
      [60, 1500],
      [120, 2800],
      [180, 4000],
      [240, 5000],
    ])
    const supplementaire = deloria.baremePaliers.find((p) => p.estHeureSupplementaire)
    expect([supplementaire?.dureeMinutes, supplementaire?.prix]).toEqual([60, 1200])
    // Aucun palier ne porte les 500 F : le passage n'est pas assujetti.
    for (const palier of deloria.baremePaliers) {
      expect(palier.prix % 100, `${palier.id} n'est pas un tarif à 500 près`).not.toBe(50)
    }
  })

  it('les plages de demi-journée et les temps de remise en état', () => {
    expect(deloria.plagesDemiJournee.map((p) => [p.heureDebut, p.heureFin])).toEqual([
      ['08:00', '12:00'],
      ['13:00', '16:00'],
    ])
    expect(deloria.tempsRemiseEnEtat.map((t) => t.dureeMinutes).sort((a, b) => a - b)).toEqual([
      30, 60, 120,
    ])
  })

  it('au moins 30 articles, et taux_tva en CHAÎNE décimale (SC-011)', () => {
    expect(deloria.articles.length).toBeGreaterThanOrEqual(30)
    for (const article of deloria.articles) {
      expect(typeof article.tauxTva, `${article.nom} : taux_tva est un NUMERIC`).toBe('string')
      expect(Number.isInteger(article.prix), `${article.nom} : prix entier en unité mineure`).toBe(
        true,
      )
    }
    // Les trois points de vente sont couverts.
    for (const pdv of deloria.pointsDeVente) {
      expect(
        deloria.articles.filter((a) => a.pointDeVenteId === pdv.id).length,
        `${pdv.nom} n'a aucun article`,
      ).toBeGreaterThan(0)
    }
  })

  it('Résidence Test : 4 unités, une catégorie, UN SEUL module, aucun point de vente', () => {
    expect(test.unites).toHaveLength(4)
    expect(test.categories).toHaveLength(1)
    expect(test.etablissementModules).toHaveLength(1)
    expect(test.etablissementModules[0]?.moduleActiviteId).toBe('module-hebergement')
    // ⚠️ AUCUN point de vente, AUCUN article, AUCUNE formule — et c'est le
    // point : toute surface qui supposerait une chambre, un article ou un tarif
    // se casse ICI, au moment le moins cher.
    expect(
      deloria.pointsDeVente.filter((p) => p.etablissementId === test.ETABLISSEMENT_TEST),
    ).toHaveLength(0)
  })

  it("aucun secret dans le jeu — ni empreinte, ni jeton", () => {
    const serialise = JSON.stringify({ deloria, test })
    for (const mot of ['empreinte', 'motDePasse', 'password', 'token', 'jeton', 'secret']) {
      expect(serialise.toLowerCase()).not.toContain(mot.toLowerCase())
    }
  })
})
