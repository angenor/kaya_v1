import { describe, expect, it } from 'vitest'

import {
  ETATS_NOTE,
  ETATS_SEJOUR,
  MOTIFS_OCCUPATION,
  STATUTS_OCCUPATION,
  TYPES_LIGNE_SEJOUR,
  type Accompagnant,
  type Client,
  type FichePolice,
  type Intervalle,
  type LigneSejour,
  type NoteSejour,
  type NumerotationFichePolice,
  type Occupation,
  type Sejour,
  type TaxeSejourConstat,
} from '../../app/core/donnees/hebergement/types'
import { colonnesDeLaTable, enCamel, valeursDuCheck } from './outils/modele-sql'

/**
 * LES NEUF TYPES DE MOUVEMENT ONT LA **FORME** DE `97-hebergement.sql` — champ
 * par champ, valeur d'énumération par valeur d'énumération (Definition of Done,
 * point 12 ; FR-064).
 *
 * ⚠️ **LES TÉMOINS SONT DES CONSTANTES TYPÉES, PAS DES LIGNES DU JEU.** Deux
 * propriétés en dépendent, et aucune n'est accessoire : *(a)* le compilateur
 * refuse un témoin auquel il manque un champ **obligatoire**, donc l'oubli se
 * voit à `pnpm typecheck` avant même le test ; *(b)* le test reste vrai quand le
 * jeu simulé ne porte encore aucune ligne d'une entité — ce qui est le cas de
 * `NumerotationFichePolice`, qu'aucun écran ne liste.
 *
 * ⚠️ **ET IL ÉCHOUE SI UN CHAMP EST RENOMMÉ D'UN SEUL CÔTÉ.** C'est sa raison
 * d'être : un champ mal nommé aujourd'hui coûte trois lignes, le même découvert
 * au branchement de la phase 3 coûte un écran et son test.
 */

const HEBERGEMENT = '97-hebergement.sql'

const intervalleTemoin: Intervalle = { debut: '2026-08-08T14:00:00.000Z', fin: '2026-08-08T16:00:00.000Z' }

const occupationTemoin: Occupation = {
  id: 'occupation-temoin',
  tenantId: 'deloria',
  uniteId: 'deloria-unite-a1',
  motif: 'SEJOUR',
  periode: intervalleTemoin,
  periodeIndisponibilite: intervalleTemoin,
  statut: 'ACTIVE',
  origineType: 'sejour',
  origineId: 'sejour-temoin',
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const sejourTemoin: Sejour = {
  id: 'sejour-temoin',
  tenantId: 'deloria',
  etablissementId: 'deloria-etablissement',
  clientId: null,
  uniteId: 'deloria-unite-a1',
  formuleId: 'deloria-formule-standard-passage',
  occupationId: 'occupation-temoin',
  reservationId: null,
  etat: 'EN_COURS',
  arriveLe: '2026-08-08T14:00:00.000Z',
  partiLe: null,
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const noteTemoin: NoteSejour = {
  id: 'note-temoin',
  tenantId: 'deloria',
  sejourId: 'sejour-temoin',
  etat: 'OUVERTE',
  arreteeLe: null,
  totalProvisoire: 2800,
  codeDevise: 'XOF',
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const ligneTemoin: LigneSejour = {
  id: 'ligne-temoin',
  tenantId: 'deloria',
  noteSejourId: 'note-temoin',
  type: 'HEBERGEMENT',
  libelle: 'Passage 2 h',
  quantite: 1,
  prixUnitaire: 2800,
  codeDevise: 'XOF',
  tauxTva: '18',
  ligneCommandeId: null,
  sejourOrigineId: null,
  bonDepotId: null,
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const clientTemoin: Client = {
  id: 'client-temoin',
  tenantId: 'deloria',
  personneId: 'personne-temoin',
  nationalite: null,
  adresse: null,
  categorieCommerciale: null,
  noteInterne: null,
  creeLe: '2026-08-08T14:00:00.000Z',
  modifieLe: '2026-08-08T14:00:00.000Z',
}

const accompagnantTemoin: Accompagnant = {
  id: 'accompagnant-temoin',
  tenantId: 'deloria',
  sejourId: 'sejour-temoin',
  nom: 'Kouamé',
  prenoms: null,
  typePiece: null,
  numeroPiece: null,
  estMineur: false,
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const fichePoliceTemoin: FichePolice = {
  id: 'fiche-temoin',
  tenantId: 'deloria',
  sejourId: 'sejour-temoin',
  etablissementId: 'deloria-etablissement',
  numero: '1',
  annee: 2026,
  complete: false,
  emiseLe: '2026-08-08T14:00:00.000Z',
  contenu: {},
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const numerotationTemoin: NumerotationFichePolice = {
  id: 'numerotation-temoin',
  tenantId: 'deloria',
  etablissementId: 'deloria-etablissement',
  annee: 2026,
  dernierNumero: 0,
  horodatageClient: null,
  creeLe: '2026-08-08T14:00:00.000Z',
}

const constatTemoin: TaxeSejourConstat = {
  id: 'constat-temoin',
  tenantId: 'deloria',
  sejourId: 'sejour-temoin',
  nuiteesAssujetties: 4,
  nombrePersonnes: 2,
  montantUnitaire: 500,
  montantTotal: 500,
  codeDevise: 'XOF',
  regleAppliquee: 'une_nuitee_par_occupation',
  constateLe: '2026-08-12T10:00:00.000Z',
  horodatageClient: null,
  creeLe: '2026-08-12T10:00:00.000Z',
}

/**
 * LES COLONNES DÉLIBÉRÉMENT NON REPRISES, AVEC LEUR MOTIF.
 *
 * ⚠️ Sans cette liste, « le type ne porte pas ce champ » serait indistinguable
 * de « on l'a oublié » — et c'est exactement la différence qui compte.
 */
const NON_REPRISES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  '*': {
    modifie_le:
      "c'est la BASE qui l'écrit, et un type qui le porterait ferait croire qu'un client peut le fixer. `client` fait exception : sa fiche s'édite, et l'écran affiche « modifiée le »",
  },
}

const CORRESPONDANCES = [
  { type: 'Occupation', table: 'occupation', temoin: occupationTemoin },
  { type: 'Sejour', table: 'sejour', temoin: sejourTemoin },
  { type: 'NoteSejour', table: 'note_sejour', temoin: noteTemoin },
  { type: 'LigneSejour', table: 'ligne_sejour', temoin: ligneTemoin },
  { type: 'Client', table: 'client', temoin: clientTemoin },
  { type: 'Accompagnant', table: 'accompagnant', temoin: accompagnantTemoin },
  { type: 'FichePolice', table: 'fiche_police', temoin: fichePoliceTemoin },
  { type: 'NumerotationFichePolice', table: 'numerotation_fiche_police', temoin: numerotationTemoin },
  { type: 'TaxeSejourConstat', table: 'taxe_sejour_constat', temoin: constatTemoin },
] as const

describe('les neuf types de mouvement ont la forme du modèle SQL', () => {
  it('inspecte les neuf tables, et chacune porte assez de colonnes pour compter', () => {
    // Un extracteur cassé rendrait des listes vides, donc zéro écart, donc un
    // vert qui ne compare plus rien.
    expect(CORRESPONDANCES).toHaveLength(9)
    for (const { table } of CORRESPONDANCES) {
      expect(colonnesDeLaTable(HEBERGEMENT, table).length, table).toBeGreaterThan(3)
    }
  })

  for (const { type, table, temoin } of CORRESPONDANCES) {
    describe(`${type} ← hebergement.${table}`, () => {
      const colonnes = colonnesDeLaTable(HEBERGEMENT, table)
      const champs = Object.keys(temoin as object)
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
        const enTrop = champs.filter((champ) => !colonnes.map(enCamel).includes(champ))
        expect(enTrop, `champs de ${type} absents de ${table} : ${enTrop.join(', ')}`).toEqual([])
      })
    })
  }
})

describe('les énumérations portent les valeurs EXACTES du SQL', () => {
  it('occupation : quatre motifs, trois statuts', () => {
    expect([...MOTIFS_OCCUPATION].sort()).toEqual(
      valeursDuCheck(HEBERGEMENT, 'ck_occupation_motif').sort(),
    )
    expect([...STATUTS_OCCUPATION].sort()).toEqual(
      valeursDuCheck(HEBERGEMENT, 'ck_occupation_statut').sort(),
    )
  })

  it('sejour : trois états', () => {
    expect([...ETATS_SEJOUR].sort()).toEqual(valeursDuCheck(HEBERGEMENT, 'ck_sejour_etat').sort())
  })

  it('note_sejour : deux états, et ARRETEE est irréversible', () => {
    expect([...ETATS_NOTE].sort()).toEqual(
      valeursDuCheck(HEBERGEMENT, 'ck_note_sejour_etat').sort(),
    )
  })

  it('ligne_sejour : cinq types, dont TAXE — la taxe est une LIGNE', () => {
    expect([...TYPES_LIGNE_SEJOUR].sort()).toEqual(
      valeursDuCheck(HEBERGEMENT, 'ck_ligne_sejour_type').sort(),
    )
    // ⚠️ La fondre dans le prix demanderait de la faire disparaître de cette
    // énumération — ce qui se verrait. Cette assertion est ce « se verrait ».
    expect(TYPES_LIGNE_SEJOUR).toContain('TAXE')
  })
})

describe('les invariantes que le type seul ne dit pas', () => {
  it('quantite est décimale, prixUnitaire est ENTIER en unité mineure', () => {
    // Les deux règles sont dans la même phrase de la constitution et portent sur
    // des grandeurs différentes. Toutes les quantités de ce cycle valent 1 — ce
    // qui rend le type facile à écrire faux sans que rien ne le dise.
    expect(Number.isInteger(ligneTemoin.prixUnitaire)).toBe(true)
    expect(typeof ligneTemoin.quantite).toBe('number')
  })

  it('tauxTva est une CHAÎNE décimale, jamais un flottant (SC-011)', () => {
    // ⚠️ `data-model.md` §2.4 l'écrivait `number` ; le conflit est tranché en
    // faveur de la règle du dépôt — `Article.tauxTva` la porte depuis F1 — et le
    // document perdant a été corrigé dans le même changement.
    expect(typeof ligneTemoin.tauxTva).toBe('string')
  })

  it("periodeIndisponibilite contient periode, égalité comprise", () => {
    // La base le garantit par `ck_occupation_periode_incluse` ; ici, c'est le
    // témoin qui le montre — une occupation sans remise en état est licite.
    expect(occupationTemoin.periodeIndisponibilite.debut <= occupationTemoin.periode.debut).toBe(true)
    expect(occupationTemoin.periodeIndisponibilite.fin >= occupationTemoin.periode.fin).toBe(true)
  })

  it('le séjour admet un client NUL — le passage anonyme est représentable', () => {
    expect(sejourTemoin.clientId).toBeNull()
  })

  it('nombrePersonnes est indicatif : 4 nuitées à 2 personnes valent UNE nuitée taxée', () => {
    // ⚠️ La forme, dans la donnée, de la décision B-10 : la taxe se compte par
    // nuitée et par séjour, JAMAIS par personne.
    expect(constatTemoin.montantTotal).toBe(constatTemoin.montantUnitaire)
    expect(constatTemoin.nombrePersonnes).toBeGreaterThan(1)
  })
})
