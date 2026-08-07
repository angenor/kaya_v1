import { describe, expect, it } from 'vitest'

import { simulationComptes } from '../../app/core/donnees/comptes/simulation'
import * as deloria from '../../app/core/donnees/jeux/deloria'
import * as tantieAdjo from '../../app/core/donnees/jeux/tantie-adjo'

/**
 * LE POSTE — **DÉRIVÉ, JAMAIS STOCKÉ**, et affiché SEULEMENT s'il est unique.
 * FR-030, FR-030c, SC-013.
 *
 * ⚠️ **LE FAIT QUI DÉCIDE DE TOUT** : `20-comptes.sql` ne contient aucune
 * référence à `point_de_vente`. Il n'existe, dans tout le modèle de phase 1,
 * aucun lien `compte → point_de_vente`. Le poste n'est donc pas une donnée
 * qu'on lit — c'est un calcul qu'on fait, et qui n'a de réponse que lorsqu'elle
 * est sans ambiguïté.
 *
 * ⚠️ ET LES **DEUX FORMES D'EN-TÊTE** SONT COUVERTES ICI, chacune par un compte
 * du jeu — Yao pour la forme longue, Adjoua pour la courte. Ne tester que la
 * forme longue laisserait passer un poste inventé par défaut, qui est
 * précisément le défaut qu'on veut interdire : **le second segment affirme un
 * fait, et l'affirmer sans le savoir est un mensonge que six cycles
 * hériteraient**.
 */

const DELORIA = deloria.ETABLISSEMENT_DELORIA
const MAQUIS = tantieAdjo.ETABLISSEMENT_TANTIE_ADJO

async function posteDe(compteId: string, etablissementId: string): Promise<string | null> {
  const resultat = await simulationComptes.posteUniqueSur(compteId, etablissementId)
  expect(resultat.ok, `${compteId} · ${etablissementId} : la lecture a échoué`).toBe(true)
  return resultat.ok ? resultat.valeur : null
}

describe('le modèle ne porte aucun lien compte → point de vente', () => {
  it('⚠️ LE CONSTAT EST VÉRIFIÉ SUR LE JEU, PAS SEULEMENT ÉCRIT', () => {
    // Si une colonne de rattachement apparaissait un jour, ce test rougirait —
    // et c'est exactement quand il faudrait rouvrir la question.
    for (const liaison of deloria.compteRoles) {
      expect(
        Object.keys(liaison),
        'compte_role porte un champ de point de vente : le poste cesserait d’être un calcul',
      ).toEqual(['id', 'tenantId', 'compteId', 'roleId', 'etablissementId'])
    }
  })
})

describe('le poste est rendu SEULEMENT quand il est unique', () => {
  it('Yao au maquis → « La salle » — un seul poste dérivable', async () => {
    // Yao est gérant et caissier du maquis ; le maquis n'a qu'un module actif,
    // donc qu'un point de vente atteignable. Le calcul a une réponse.
    expect(await posteDe('compte-yao', MAQUIS)).toBe('La salle')
  })

  it('Adjoua à Deloria → RIEN — quatre postes, et le système ne choisit pas', async () => {
    // ⚠️ C'EST LA MOITIÉ QUI COMPTE. Adjoua atteint l'hébergement, la
    // restauration et le bar ; trois points de vente répondent. Choisir le
    // premier afficherait un fait qu'on ne sait pas, en permanence, sur un
    // repère d'orientation.
    expect(await posteDe('compte-adjoua', DELORIA)).toBeNull()
  })

  it('Aminata à Deloria → RIEN — restaurant ET bar répondent tous les deux', async () => {
    // Une seule permission, `ventes.commande.prendre`, et elle atteint DEUX
    // points de vente. Une permission unique ne fait pas un poste unique.
    expect(await posteDe('compte-aminata', DELORIA)).toBeNull()
  })

  it('M. Koffi → RIEN — il n’a que des permissions transverses', async () => {
    // `pilotage.lire` et `etablissement.gerer` ne portent aucun module :
    // consulter les chiffres n'est pas un poste, et régler l'établissement non
    // plus. Zéro candidat, donc rien à afficher.
    expect(await posteDe('compte-koffi', DELORIA)).toBeNull()
    expect(await posteDe('compte-koffi', MAQUIS)).toBeNull()
  })

  it('Yao à DELORIA → RIEN — le même compte, un autre site, un autre verdict', async () => {
    // ⚠️ LE POSTE SUIT LE SITE, PAS LA PERSONNE. Yao est réceptionniste à
    // Deloria : l'hébergement n'a aucun point de vente, donc aucun candidat.
    // Le poste calculé au maquis ne le suit pas ici — et c'est FR-027 vu du
    // côté de l'affichage.
    expect(await posteDe('compte-yao', DELORIA)).toBeNull()
  })
})

describe('les deux formes d’en-tête sont obtenues par le jeu, sans levier', () => {
  it('⚠️ « Abobo · La salle » ET « Abengourou » — les deux, par deux comptes', async () => {
    // FR-030c exige que les DEUX formes soient atteignables. Sans ce contrôle,
    // on pourrait livrer un produit où la forme courte n'existe jamais — et le
    // manque ne se verrait qu'au premier compte multi-postes en exploitation.
    const maquis = tantieAdjo.etablissements[0]
    const abengourou = deloria.etablissements[0]

    const posteYao = await posteDe('compte-yao', MAQUIS)
    expect([maquis?.commune, posteYao].join(' · '), 'la forme LONGUE').toBe('Abobo · La salle')

    const posteAdjoua = await posteDe('compte-adjoua', DELORIA)
    expect(posteAdjoua, 'la forme COURTE : rien de plus que la commune').toBeNull()
    expect(abengourou?.commune).toBe('Abengourou')
  })

  it('la commune est TOUJOURS là — c’est le poste qui est conditionnel', () => {
    // Le détail du composant 09 porte la commune, toujours. Un établissement
    // sans commune rendrait le premier segment vide, ce que le modèle interdit
    // (`commune TEXT NOT NULL`).
    for (const etablissement of [...deloria.etablissements, ...tantieAdjo.etablissements]) {
      expect(etablissement.commune.length, `${etablissement.nom} n'a pas de commune`).toBeGreaterThan(0)
    }
  })
})
