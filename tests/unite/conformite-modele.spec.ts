import { describe, expect, it } from 'vitest'

import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as test from '../../app/core/donnees/jeux/residence-test'
import * as tantieAdjo from '../../app/core/donnees/jeux/tantie-adjo'
import { colonnesDeLaTable, enCamel } from './outils/modele-sql'

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
    // ⚠️ `piece_capturee_le` A QUITTÉ CETTE LISTE AU CYCLE F3, et c'est le
    // service qu'on attend d'elle : elle portait « c'est le cycle SEJ qui la
    // peuple », et le cycle SEJ est arrivé. `Personne.pieceCaptureeLe` existe
    // désormais — sans elle, `R4` ne pourrait pas dire ce qui est déjà connu et
    // ne sera pas redemandé.
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
  { type: 'TablePdv', fichier: '10-etablissements.sql', table: 'table_pdv', exemple: tantieAdjo.tablesPdv[0] },
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
    expect(CORRESPONDANCES.length).toBeGreaterThanOrEqual(19)
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
  it('2 tenants, 3 établissements, 5 modules, 3 points de vente', () => {
    // ⚠️ DEUX TENANTS ET TROIS ÉTABLISSEMENTS, ET L'ÉCART EST LE POINT : un
    // tenant porte PLUSIEURS établissements, et le maquis est le second de
    // `deloria`. C'est ce que le modèle prévoit et ce que la maquette du
    // propriétaire suppose — M. Koffi voit ses deux maisons côte à côte.
    expect([...deloria.tenants, ...test.tenants]).toHaveLength(2)
    expect([
      ...deloria.etablissements,
      ...tantieAdjo.etablissements,
      ...test.etablissements,
    ]).toHaveLength(3)
    expect(deloria.modulesActivite).toHaveLength(5)
    expect(deloria.pointsDeVente).toHaveLength(3)
    // Le pressing est un COMPTOIR : l'absence de tables EST le comptoir.
    expect(deloria.pointsDeVente.find((p) => p.nom === 'Pressing')?.avecTables).toBe(false)
  })

  it('6 personnes, 6 comptes dont UN SUSPENDU, et les rôles cumulés', () => {
    expect(deloria.personnes).toHaveLength(6)
    expect(deloria.comptes).toHaveLength(6)
    // ⚠️ LE COMPTE SUSPENDU EXISTE POUR ÊTRE REFUSÉ (FR-003, cycle F2). Sans
    // lui, la branche « compte non ACTIF » de `identifier` n'était exercée par
    // rien, et la phrase unique n'était vérifiée que sur deux cas au lieu de
    // quatre. Il ne porte AUCUN rôle : rien à résoudre, rien à afficher.
    const nonActifs = deloria.comptes.filter((c) => c.etat !== 'ACTIF')
    expect(nonActifs.map((c) => c.id)).toEqual(['compte-mariam'])
    expect(nonActifs[0]?.etat).toBe('SUSPENDU')
    expect(deloria.compteRoles.filter((r) => r.compteId === 'compte-mariam')).toHaveLength(0)
    const rolesAdjoua = deloria.compteRoles.filter((r) => r.compteId === 'compte-adjoua')
    expect(rolesAdjoua, 'Adjoua porte trois rôles — le cumul est la norme').toHaveLength(3)
    const koffi = deloria.compteRoles.filter((r) => r.compteId === 'compte-koffi')
    expect(koffi, 'M. Koffi est propriétaire sur TROIS établissements').toHaveLength(3)
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
    // ⚠️ SUR LA FORMULE STANDARD : le cycle F3 a étendu le MÊME barème relevé
    // aux cinq catégories (cadrage §5.3, « éditable par catégorie »). Sans ce
    // filtre, le test compterait cinq fois les mêmes quatre paliers.
    const paliers = deloria.baremePaliers.filter(
      (p) => !p.estHeureSupplementaire && p.formuleId === 'deloria-formule-standard-passage',
    )
    expect(paliers.map((p) => [p.dureeMinutes, p.prix])).toEqual([
      [60, 1500],
      [120, 2800],
      [180, 4000],
      [240, 5000],
    ])
    const supplementaire = deloria.baremePaliers.find(
      (p) => p.estHeureSupplementaire && p.formuleId === 'deloria-formule-standard-passage',
    )
    expect([supplementaire?.dureeMinutes, supplementaire?.prix]).toEqual([60, 1200])
    // Aucun palier ne porte les 500 F : le passage n'est pas assujetti.
    for (const palier of deloria.baremePaliers) {
      expect(palier.prix % 100, `${palier.id} n'est pas un tarif à 500 près`).not.toBe(50)
    }
  })

  it('les plages de demi-journée et les temps de remise en état', () => {
    // ⚠️ LES DEUX RÉFÉRENTIELS VALENT POUR LES CINQ CATÉGORIES depuis le cycle
    // F3 : ce sont les VALEURS DISTINCTES qui portent le sens, pas leur nombre
    // de lignes. Et `temps_remise_en_etat` porte désormais SES DEUX
    // rattachements — le SQL les déclare NOT NULL tous les deux, et l'unicité
    // porte sur le couple ; le jeu F1 laissait `categorieId` à null.
    const plages = [
      ...new Set(deloria.plagesDemiJournee.map((p) => `${p.heureDebut}-${p.heureFin}`)),
    ].sort()
    expect(plages).toEqual(['08:00-12:00', '13:00-16:00'])
    expect(
      [...new Set(deloria.tempsRemiseEnEtat.map((t) => t.dureeMinutes))].sort((a, b) => a - b),
    ).toEqual([30, 60, 120])
    for (const ligne of deloria.tempsRemiseEnEtat) {
      expect(ligne.categorieId, `${ligne.id} : categorie_id est NOT NULL`).not.toBeNull()
      expect(ligne.formuleId, `${ligne.id} : formule_id est NOT NULL`).not.toBeNull()
    }
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

  it('Chez Tantie Adjo : UN SEUL module actif, une salle, neuf tables dont le comptoir', () => {
    // ⚠️ C'EST L'UNIQUE LIGNE `etablissement_module` QUI REND SC-003 VÉRIFIABLE.
    // Hébergement, bar, pressing et salle de réunion sont ABSENTS des actifs —
    // et `listerModulesActifs` ne rend que les actifs, jamais un module inactif
    // avec un drapeau. Aucun écran n'a donc à décider d'en griser un.
    expect(tantieAdjo.etablissementModules).toHaveLength(1)
    expect(tantieAdjo.etablissementModules[0]?.moduleActiviteId).toBe('module-restauration')
    expect(tantieAdjo.pointsDeVente).toHaveLength(1)
    expect(tantieAdjo.pointsDeVente[0]?.nom, 'le poste unique de Yao').toBe('La salle')
    expect(tantieAdjo.pointsDeVente[0]?.avecTables).toBe(true)
    // `caisse_id` est une colonne NUE, sans REFERENCES : `socle/caisse` est un
    // autre module, et la simulation ne la remplit pas (principe 2, P-05).
    expect(tantieAdjo.pointsDeVente[0]?.caisseId).toBeNull()

    expect(tantieAdjo.tablesPdv, 'la salle de neuf tables').toHaveLength(9)
    const comptoirs = tantieAdjo.tablesPdv.filter((t) => t.code === 'COMPTOIR')
    expect(comptoirs, 'le comptoir est UNE table_pdv, pas un point de vente séparé').toHaveLength(1)
    // Un libellé partout ferait croire que l'exploitant en a saisi un.
    expect(tantieAdjo.tablesPdv.filter((t) => t.libelle !== null)).toEqual(comptoirs)
  })

  it('le maquis est le SECOND ÉTABLISSEMENT du tenant deloria, jamais un tenant propre', () => {
    // ⚠️ CE TEST FERME LE SEUL RISQUE QU'OUVRE LE SENS D'IMPORT UNIQUE.
    // `tantie-adjo.ts` écrit son tenant plutôt que de l'importer — l'importer
    // formerait un cycle, `deloria.ts` lisant déjà l'identifiant du maquis. La
    // divergence que l'écriture rendrait possible, cette assertion l'interdit.
    for (const ligne of [
      ...tantieAdjo.etablissements,
      ...tantieAdjo.etablissementModules,
      ...tantieAdjo.pointsDeVente,
      ...tantieAdjo.tablesPdv,
    ]) {
      expect(ligne.tenantId, `${ligne.id}`).toBe(deloria.TENANT_DELORIA)
    }
    // Une seule liaison traverse un tenant dans tout le jeu, et elle porte son
    // motif : `cr-koffi-test`, qui éprouve l'agnosticité du socle (ETB-02c).
    const versTest = deloria.compteRoles.filter(
      (r) => r.etablissementId === test.ETABLISSEMENT_TEST,
    )
    expect(versTest.map((r) => r.id)).toEqual(['cr-koffi-test'])
  })

  it('Yao : réceptionniste à Deloria, gérant ET caissier au maquis (FR-027)', () => {
    // La MÊME personne, des rôles différents selon le site. Un droit détenu
    // ailleurs ne suit pas la personne — et c'est ce que le jeu doit rendre
    // observable, pas seulement possible.
    const surDeloria = deloria.compteRoles
      .filter((r) => r.compteId === 'compte-yao' && r.etablissementId === deloria.ETABLISSEMENT_DELORIA)
      .map((r) => r.roleId)
    expect(surDeloria).toEqual(['role-receptionniste'])

    const surMaquis = deloria.compteRoles
      .filter(
        (r) =>
          r.compteId === 'compte-yao' && r.etablissementId === tantieAdjo.ETABLISSEMENT_TANTIE_ADJO,
      )
      .map((r) => r.roleId)
      .sort()
    expect(surMaquis).toEqual(['role-caissier', 'role-gerant'])

    // M. Koffi voit désormais TROIS sites — Deloria, le maquis, Résidence Test.
    expect(deloria.compteRoles.filter((r) => r.compteId === 'compte-koffi')).toHaveLength(3)
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
    const serialise = JSON.stringify({ deloria, test, tantieAdjo })
    for (const mot of ['empreinte', 'motDePasse', 'password', 'token', 'jeton', 'secret']) {
      expect(serialise.toLowerCase()).not.toContain(mot.toLowerCase())
    }
  })
})
