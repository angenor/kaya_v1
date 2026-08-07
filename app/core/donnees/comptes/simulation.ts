import { echec, reussite, type ResultatDomaine } from '~/core/donnees/contrat'
import type { DonneesComptes, Identification } from '~/core/donnees/comptes/interface'
import type { Compte } from '~/core/donnees/comptes/types'
import type { Etablissement } from '~/core/donnees/etablissements/types'
import { normaliserIdentifiant } from '~/core/identifiant/normaliser'
import * as deloria from '~/core/donnees/jeux/deloria'
import * as residenceTest from '~/core/donnees/jeux/residence-test'
import * as tantieAdjo from '~/core/donnees/jeux/tantie-adjo'
import { lireSimule, lireUnSimule } from '~/core/donnees/simulationCommune'
import { attendreLatence, reglagesCourants } from '~/core/scenarios/reglages'

const TOUS_ETABLISSEMENTS: readonly Etablissement[] = [
  ...deloria.etablissements,
  ...tantieAdjo.etablissements,
  ...residenceTest.etablissements,
]

/** Les établissements où CE compte porte au moins un rôle. */
function etablissementsDuCompte(compteId: string): readonly Etablissement[] {
  const identifiants = new Set(
    deloria.compteRoles
      .filter((liaison) => liaison.compteId === compteId && liaison.etablissementId !== null)
      .map((liaison) => liaison.etablissementId as string),
  )
  return TOUS_ETABLISSEMENTS.filter((etablissement) => identifiants.has(etablissement.id))
}

/** ⚠️ Ce fichier disparaît au branchement de la phase 3. */
export const simulationComptes: DonneesComptes = {
  listerComptes(): Promise<ResultatDomaine<readonly Compte[]>> {
    return lireSimule(() => deloria.comptes, [])
  },

  lireCompte(id: string): Promise<ResultatDomaine<Compte>> {
    return lireUnSimule(() => deloria.comptes.find((c) => c.id === id))
  },

  /**
   * ⚠️ L'ORDRE EST CELUI DE `lireSimule`, ET IL EST LA MÉCANIQUE DE FR-004.
   *
   *     1. hors ligne ?        → échec, AVANT toute tentative
   *     2. échec réseau ?      → échec
   *     3. ATTENDRE la latence ← LES DEUX CHEMINS PASSENT ICI
   *     4. décider du verdict  ← APRÈS l'attente, jamais avant
   *
   * **Le verdict se calcule après l'attente.** Il n'y a donc pas deux chemins à
   * égaliser : il n'y en a qu'un, qui se termine différemment. Un refus en 2 ms
   * sur compte inexistant contre 90 ms sur mot de passe faux publierait la liste
   * des comptes, et aucun message identique ne rattraperait cela.
   *
   * ⚠️ `motDePasse` EST REÇU ET N'EST PAS EMPLOYÉ — voir l'interface. Il n'est
   * ni stocké, ni journalisé, ni comparé : il n'y a RIEN à comparer. La règle de
   * simulation est celle du contrat : **n'importe quel mot de passe non vide
   * entre**, dès lors que l'identifiant correspond à un compte `ACTIF` du jeu.
   * Un mot de passe vide ne fait PAS un cas distinct — il rend
   * `IDENTIFIANTS_INVALIDES`, comme le reste.
   */
  async identifier(
    identifiantSaisi: string,
    motDePasse: string,
  ): Promise<ResultatDomaine<Identification>> {
    const reglages = reglagesCourants()

    // ⚠️ HORS LIGNE SE PRONONCE AVANT TOUTE TENTATIVE, et l'écran l'annonce même
    // avant la saisie (FR-012) : `compte` est de classe C au registre.
    if (reglages.horsLigne) return echec<Identification>('HORS_LIGNE')
    if (reglages.echecReseau) return echec<Identification>('ECHEC_RESEAU')

    // ⚠️ LE CHAMP VIDE SE DÉCIDE AVANT L'ATTENTE, ET C'EST VOULU. Ce n'est pas
    // une tentative de connexion : rien n'a été soumis, rien n'est à protéger,
    // et faire patienter quelqu'un pour lui dire qu'il n'a rien tapé serait une
    // lenteur sans objet. Les chemins à rendre indiscernables sont ceux qui
    // portent un identifiant — et ils passent tous les deux par l'attente.
    const identifiant = normaliserIdentifiant(identifiantSaisi)
    if (identifiant.forme === 'ABSENT') return echec<Identification>('IDENTIFIANT_ABSENT')

    await attendreLatence()

    // ── Le verdict, APRÈS l'attente ────────────────────────────────────────
    const compte = deloria.comptes.find((c) => c.identifiant === identifiant.valeur)

    // Compte inconnu · compte SUSPENDU · compte REVOQUE · mot de passe vide :
    // le MÊME code, donc la MÊME phrase.
    if (compte === undefined) return echec<Identification>('IDENTIFIANTS_INVALIDES')
    if (compte.etat !== 'ACTIF') return echec<Identification>('IDENTIFIANTS_INVALIDES')
    if (motDePasse.length === 0) return echec<Identification>('IDENTIFIANTS_INVALIDES')

    return reussite<Identification>({
      compteId: compte.id,
      etablissements: etablissementsDuCompte(compte.id),
    })
  },

  /**
   * Les établissements où CE compte a des droits — et **rien d'autre n'est
   * proposé**.
   *
   * ⚠️ PROPOSER PUIS REFUSER SERAIT UN GRISÉ DÉGUISÉ. Offrir la liste complète
   * et refuser au choix reviendrait à montrer une porte fermée : l'absence est
   * totale, ici comme partout ailleurs (principe 8).
   */
  etablissementsDe(compteId: string): Promise<ResultatDomaine<readonly Etablissement[]>> {
    return lireSimule(() => etablissementsDuCompte(compteId), [])
  },

  resoudrePermissions(
    compteId: string,
    etablissementId: string,
  ): Promise<ResultatDomaine<readonly string[]>> {
    return lireSimule(() => {
      // ⚠️ L'UNION, et sur CET établissement seulement. Un rôle porté ailleurs
      // ne donne rien ici : c'est ce que la colonne `etablissement_id` de la
      // table de liaison existe pour dire.
      const codesDeRole = deloria.compteRoles
        .filter(
          (liaison) =>
            liaison.compteId === compteId && liaison.etablissementId === etablissementId,
        )
        .map((liaison) => deloria.roles.find((r) => r.id === liaison.roleId)?.code)
        .filter((code): code is string => Boolean(code))

      const union = new Set<string>()
      for (const code of codesDeRole) {
        for (const permission of deloria.permissionsParRole[code] ?? []) union.add(permission)
      }
      return [...union].sort()
    }, [])
  },
}
