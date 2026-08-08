import { fournisseur } from '~/core/donnees/fournisseur'
import type { Session } from '~/core/session/useSession'

/**
 * RÉSOUDRE UN CONTEXTE — **ce que la personne peut faire ici, et ce que la
 * maison offre**, en un seul endroit.
 *
 * ⚠️ TROIS CHEMINS POSAIENT LE MÊME CONTEXTE, CHACUN À SA FAÇON : l'entrée
 * (`useEntree`), la bascule de site (`useContexte`) et le panneau Scénarios. Les
 * trois résolvaient les permissions et le poste ; le jour où les **modules
 * actifs** ont rejoint la session, il aurait fallu ajouter la même lecture aux
 * trois — et le troisième l'aurait oubliée. Un contexte résolu à moitié ne se
 * voit pas : l'accueil affiche simplement moins de choses.
 *
 * ⚠️ ET LES TROIS LECTURES PARTENT ENSEMBLE. Elles sont indépendantes ; les
 * enchaîner tripleraient l'attente sur le chemin le plus fréquent du produit —
 * celui qu'on emprunte vingt fois par jour en changeant de site.
 *
 * ⚠️ CE MODULE NE PERSISTE RIEN. Il rend une session ; c'est l'appelant qui la
 * pose — parce que lui seul sait s'il entre, s'il bascule, ou s'il règle un
 * instrument.
 */

/**
 * Le contexte d'un compte SUR UN ÉTABLISSEMENT.
 *
 * ⚠️ UNE LECTURE QUI ÉCHOUE NE FABRIQUE PAS DE DROITS : elle rend l'ensemble
 * vide, et l'écran dira ce qu'il en est. Accorder « par défaut » ce qu'on n'a
 * pas pu vérifier ferait afficher des gestes que le serveur refusera.
 */
export async function resoudreContexte(
  compteId: string,
  etablissementId: string,
): Promise<Session> {
  const [permissions, poste, modules] = await Promise.all([
    fournisseur().comptes.resoudrePermissions(compteId, etablissementId),
    fournisseur().comptes.posteUniqueSur(compteId, etablissementId),
    fournisseur().etablissements.listerModulesActifs({ etablissementId }),
  ])

  return {
    compteId,
    portee: { type: 'etablissement', id: etablissementId },
    permissions: permissions.ok ? permissions.valeur : [],
    // ⚠️ LES **CODES**, PAS LES OBJETS. C'est le code que `serviceEstActif`
    // compare, et c'est lui que le modèle porte (`module_activite.code`) : ranger
    // le libellé et l'identifiant en session ferait persister deux champs qu'un
    // renommage rendrait faux sans que rien ne le dise.
    modulesActifs: modules.ok ? modules.valeur.map((module) => module.code) : [],
    posteUnique: poste.ok ? poste.valeur : null,
  }
}

/**
 * Le contexte de la **vue d'ensemble** — la portée « tous ».
 *
 * ⚠️ AUCUNE PERMISSION, AUCUN MODULE, AUCUN POSTE : sous cette portée, **aucune
 * surface qui modifie une caisse n'existe** (FR-019). Ce n'est pas une
 * restriction ajoutée à l'écran, c'est l'absence de droits — par le même
 * filtrage que partout ailleurs.
 */
export function contexteVueDEnsemble(compteId: string): Session {
  return {
    compteId,
    portee: { type: 'tous' },
    permissions: [],
    modulesActifs: [],
    posteUnique: null,
  }
}

/**
 * Le contexte d'un compte **sans aucun établissement** — l'administrateur
 * éditeur, dont le rattachement est `null` (FR-024).
 *
 * ⚠️ `portee: null` DIT ICI « CE COMPTE N'A AUCUN SITE », et le compte présent
 * suffit à le distinguer de « aucun choix fait » : la session vide n'a pas de
 * `compteId`, et l'intergiciel la renvoie à la connexion avant tout écran. Les
 * deux états restent donc discernables sans troisième valeur de portée.
 */
export function contexteSansEtablissement(compteId: string): Session {
  return {
    compteId,
    portee: null,
    permissions: [],
    modulesActifs: [],
    posteUnique: null,
  }
}
