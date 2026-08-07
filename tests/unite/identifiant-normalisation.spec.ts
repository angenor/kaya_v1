import { describe, expect, it } from 'vitest'

import {
  CLE_INDICATIF_TELEPHONIQUE_DEFAUT,
  lireParametre,
  surchargerParametre,
} from '../../app/core/configuration/configuration'
import { normaliserIdentifiant } from '../../app/core/identifiant/normaliser'

/**
 * LA NORMALISATION DE L'IDENTIFIANT — FR-001, FR-002, FR-005.
 *
 * ⚠️ CE QUE CE TEST PROTÈGE N'EST PAS UNE EXPRESSION RÉGULIÈRE, C'EST UN
 * PARCOURS. Adjoua tape son numéro comme elle le dit — « zéro sept, zéro huit,
 * … » — et le produit doit le reconnaître sans qu'elle ait appris le format
 * international. Un identifiant refusé pour cause de forme est un refus qu'elle
 * lira comme « mot de passe incorrect », et elle cherchera au mauvais endroit.
 */

describe("la forme d'un identifiant saisi", () => {
  it('un numéro national reçoit l’indicatif par défaut, sans qu’on l’ait tapé', () => {
    expect(normaliserIdentifiant('0708091011')).toEqual({
      forme: 'TELEPHONE',
      valeur: '+2250708091011',
    })
  })

  it('les trois écritures d’un même numéro donnent le même E.164', () => {
    // C'est la propriété qui compte : ce que l'exploitant tape varie, ce que le
    // domaine compare ne varie pas.
    const attendu = { forme: 'TELEPHONE', valeur: '+2250708091011' }
    expect(normaliserIdentifiant('+225 07 08 09 10 11')).toEqual(attendu)
    expect(normaliserIdentifiant('07 08 09 10 11')).toEqual(attendu)
    expect(normaliserIdentifiant('+2250708091011')).toEqual(attendu)
  })

  it('une adresse est une adresse, et la casse ne la distingue pas', () => {
    expect(normaliserIdentifiant('adjoua@deloria.ci')).toEqual({
      forme: 'EMAIL',
      valeur: 'adjoua@deloria.ci',
    })
    expect(normaliserIdentifiant('  Admin@Kaya.CI ')).toEqual({
      forme: 'EMAIL',
      valeur: 'admin@kaya.ci',
    })
  })

  it('⚠️ UN « @ » L’EMPORTE, SANS AUTRE EXAMEN — le cas limite de la spec', () => {
    // `0708091011@…` ressemble aux deux. Analyser d'abord comme un numéro
    // rendrait cette adresse INATTEIGNABLE, et son refus serait indistinguable
    // d'un mot de passe faux — la personne chercherait au mauvais endroit.
    expect(normaliserIdentifiant('0708091011@deloria.ci')).toEqual({
      forme: 'EMAIL',
      valeur: '0708091011@deloria.ci',
    })
  })

  it('un champ vide ou blanc est ABSENT, jamais un échec de connexion', () => {
    // FR-005 : un défaut de saisie a sa propre phrase. Le confondre avec
    // l'échec renverrait quelqu'un vérifier un mot de passe qu'il n'a pas tapé.
    expect(normaliserIdentifiant('')).toEqual({ forme: 'ABSENT' })
    expect(normaliserIdentifiant('   ')).toEqual({ forme: 'ABSENT' })
    expect(normaliserIdentifiant('\t\n ')).toEqual({ forme: 'ABSENT' })
  })

  it('une saisie qui n’est ni l’un ni l’autre reste un téléphone — elle échouera comme un inconnu', () => {
    // ⚠️ JAMAIS `ABSENT`. Le rendre ABSENT ferait dire « indiquez un numéro ou
    // une adresse » à quelqu'un qui vient d'en indiquer un : la phrase serait
    // fausse et le renverrait à un champ qu'il croit rempli. C'est la phrase
    // unique d'échec qui répond, comme pour tout identifiant inconnu.
    expect(normaliserIdentifiant('abc')).toEqual({ forme: 'TELEPHONE', valeur: 'abc' })

    // Un numéro trop court est COMPLÉTÉ, pas rejeté — constaté sur la
    // bibliothèque, qui préfixe sans valider. C'est le comportement voulu :
    // valider la longueur ici dirait « ce numéro n'existe pas », ce qui est
    // exactement la distinction que FR-003 interdit de publier.
    expect(normaliserIdentifiant('12')).toEqual({ forme: 'TELEPHONE', valeur: '+22512' })
  })

  it('⚠️ L’INDICATIF VIENT DE LA CONFIGURATION, ET LE CHANGER CHANGE LE RÉSULTAT', () => {
    // C'est la preuve que FR-002 est tenue : un `+225` écrit en dur passerait
    // toutes les assertions ci-dessus et rougirait ici seulement. Le produit
    // vise un second pays — cette ligne est celle qui le dit.
    const initial = lireParametre(CLE_INDICATIF_TELEPHONIQUE_DEFAUT)
    expect(initial, 'la clé du Récapitulatif des paramètres est absente').toBe('+225')
    try {
      surchargerParametre(CLE_INDICATIF_TELEPHONIQUE_DEFAUT, '+221')
      expect(normaliserIdentifiant('770000000')).toEqual({
        forme: 'TELEPHONE',
        valeur: '+221770000000',
      })
    } finally {
      surchargerParametre(CLE_INDICATIF_TELEPHONIQUE_DEFAUT, initial ?? '+225')
    }
  })

  it('les identifiants du jeu se retrouvent depuis leur forme nationale', () => {
    // Le lien avec le produit, et non avec la bibliothèque : les comptes de
    // Deloria portent `+22507000000x`, et c'est `070000000x` qu'on tape.
    for (const rang of ['1', '2', '3', '4']) {
      expect(normaliserIdentifiant(`070000000${rang}`)).toEqual({
        forme: 'TELEPHONE',
        valeur: `+225070000000${rang}`,
      })
    }
  })
})
