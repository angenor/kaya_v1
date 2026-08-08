import type { Formule, Intervalle } from '~/core/donnees/hebergement/types'

/**
 * LA TAXE DE SÉJOUR — nuitées assujetties, montant, **règle appliquée**.
 *
 * ⚠️ **CE FICHIER EST L'ANCÊTRE FRONT DU `JurisdictionAdapter`, ET IL SERA
 * SUPPRIMÉ.** La constitution est formelle (principe 5) : *aucune règle fiscale
 * hors adaptateur*. En phase 2, il n'y a pas de serveur, et un écran qui
 * afficherait un total sans taxe mentirait sur ce que le client doit. Ce
 * fichier tient donc la place — **et il la rend** : au cycle qui livre
 * l'adaptateur, il est **supprimé**, jamais dupliqué. *Une règle fiscale à deux
 * endroits est une règle fiscale fausse à un endroit.*
 *
 * ⚠️ **AUCUNE VALEUR FISCALE N'Y EST ÉCRITE.** Le montant unitaire vient du
 * paramétrage de l'établissement, l'assujettissement de `formule
 * .assujettieTaxeNuitee`, la conversion de `formule.regleConversionTaxe`. *Un
 * taux écrit dans le code se découvre le jour où la commune le change, et le
 * produit facture l'ancien pendant un trimestre.*
 *
 * ⚠️ **LA TAXE SE COMPTE PAR NUITÉE ET PAR SÉJOUR, JAMAIS PAR PERSONNE**
 * (décision B-10, close ; cadrage §9.6). La maquette `R7-note-depart.html`
 * affiche « 4 000 F » et « par personne et par nuit » : **elle est antérieure à
 * la clôture de la décision**, et le test doré refuse sa valeur. Elle reste la
 * référence pour le **dessin** de la ligne, pas pour le montant.
 */

/** Ce qu'un séjour doit à la commune, et **pourquoi**. */
export interface ConstatTaxe {
  /** Les nuitées réellement assujetties. **Zéro est une réponse**, pas un vide. */
  readonly nuiteesAssujetties: number
  /** Entier en unité mineure, lu au paramétrage. */
  readonly montantUnitaire: number
  readonly montantTotal: number
  readonly codeDevise: string
  /**
   * ⚠️ **CE QUI PERMET DE RELIRE POURQUOI CE MONTANT** sans rejouer un calcul
   * dont les paramètres ont changé. `'non_assujettie'` quand la formule ne l'est
   * pas — un constat sans règle serait un constat qu'on ne sait pas expliquer.
   */
  readonly regleAppliquee: string
}

/** Le nombre de nuits entre deux instants, arrondi **au supérieur**. */
function nuitsDe(periode: Intervalle): number {
  const millisecondes = Date.parse(periode.fin) - Date.parse(periode.debut)
  if (millisecondes <= 0) return 0
  return Math.ceil(millisecondes / 86_400_000)
}

/**
 * Le constat de taxe d'un séjour.
 *
 * ⚠️ **IL EST APPELÉ MÊME QUAND RIEN N'EST DÛ, ET C'EST DÉLIBÉRÉ.** Un passage
 * n'est pas assujetti : la fonction rend **zéro nuitée** plutôt que rien. Sauter
 * l'appel ferait disparaître le cas de la couverture, et la première formule de
 * passage assujettie — une autre commune, un autre pays — arriverait sur du code
 * que rien n'a jamais exercé.
 *
 * @param nombrePersonnes **indicatif** : documenté au constat, il n'entre dans
 *        aucun calcul. C'est la forme, dans le code, de la décision B-10.
 */
export function constaterTaxeSejour(
  formule: Formule,
  periode: Intervalle,
  montantUnitaire: number,
  codeDevise: string,
  nombrePersonnes: number,
): ConstatTaxe {
  void nombrePersonnes

  if (!formule.assujettieTaxeNuitee || formule.regleConversionTaxe === null) {
    return {
      nuiteesAssujetties: 0,
      montantUnitaire,
      montantTotal: 0,
      codeDevise,
      regleAppliquee: 'non_assujettie',
    }
  }

  const nuits = nuitsDe(periode)
  // ⚠️ LES DEUX RÈGLES SONT DES ENTRÉES DE DONNÉE, pas deux branches inventées
  // ici : `regle_conversion_taxe` est une colonne, et elle peut différer par
  // commune (cadrage §5.5, B-02).
  const nuiteesAssujetties =
    formule.regleConversionTaxe === 'une_nuitee_par_occupation' ? Math.min(nuits, 1) : nuits

  return {
    nuiteesAssujetties,
    montantUnitaire,
    montantTotal: nuiteesAssujetties * montantUnitaire,
    codeDevise,
    regleAppliquee: formule.regleConversionTaxe,
  }
}
