import { fournisseur } from '~/core/donnees/fournisseur'
import type { Etablissement } from '~/core/donnees/etablissements/types'
import { etablissementDe, useSession, type PorteeSession } from '~/core/session/useSession'

/**
 * CHANGER DE SITE — **deux interactions, sans reconnexion** (FR-026, FR-027).
 *
 * ⚠️ LES PERMISSIONS SONT **RECALCULÉES POUR CE SITE**, jamais transportées. Un
 * droit détenu ailleurs ne suit pas la personne : Yao est gérant et caissier au
 * maquis, et **réceptionniste** à Deloria. Garder l'union du site précédent
 * ferait encaisser là où l'on n'y a pas droit — et le défaut ne se verrait qu'au
 * premier écart de caisse.
 *
 * ⚠️ ET LE CONTEXTE NE CHANGE **JAMAIS** TOUT SEUL. Cette fonction n'est appelée
 * que par un geste : une alerte venue d'un autre établissement remonte en
 * pastille sur le sélecteur fermé, elle ne bascule rien. *Un changement de
 * contexte non demandé fait saisir une consommation sur le mauvais site.*
 *
 * ⚠️ LE DERNIER SITE CHOISI EST PERSISTÉ AVEC LA SESSION (FR-032). Rouvrir
 * l'application ramène **là où l'on était**, pas au premier de la liste — sans
 * quoi M. Koffi rouvrirait chaque matin sur la maison qu'il ne visite pas.
 */
export function useContexte() {
  const { session, definir } = useSession()

  /** Les établissements où CE compte a des droits. Rien d'autre n'est proposé. */
  const etablissements = useState<readonly Etablissement[]>('kaya.contexte.etablissements', () => [])
  /** Le poste dérivé — `null` dès qu'il y en a plus d'un. Jamais « plusieurs ». */
  const poste = computed(() => session.value.posteUnique)

  /**
   * LES SITES QUI ONT QUELQUE CHOSE À SIGNALER (FR-029).
   *
   * ⚠️ ILS REMONTENT EN **PASTILLE SUR LE SÉLECTEUR FERMÉ**, et rien d'autre ne
   * se produit. Basculer sur le site en alerte serait « utile » et faux : la
   * personne est en train de faire quelque chose ici.
   */
  const sitesEnAlerte = useState<readonly string[]>('kaya.contexte.alertes', () => [])

  const etablissementActif = computed(() =>
    etablissements.value.find((e) => e.id === etablissementDe(session.value)),
  )

  async function chargerLesEtablissements(): Promise<void> {
    const compteId = session.value.compteId
    if (compteId === null) {
      etablissements.value = []
      return
    }
    const [resultat, alertes] = await Promise.all([
      fournisseur().comptes.etablissementsDe(compteId),
      fournisseur().accueil.sitesAvecAlerte(compteId),
    ])
    // Une lecture qui échoue — hors ligne, panne — ne vide pas la barre : elle
    // la laisse telle quelle. Un repère qui disparaît en coupure n'en est plus un.
    if (resultat.ok) etablissements.value = resultat.valeur
    if (alertes.ok) sitesEnAlerte.value = alertes.valeur
  }

  /**
   * Bascule la portée, recalcule les permissions et le poste, et persiste.
   *
   * ⚠️ **SANS RECONNEXION.** `compteId` ne bouge pas : la personne est la même,
   * c'est le site qui change. Une bascule qui repasserait par `R0` ferait
   * ressaisir un identifiant à quelqu'un qui n'a rien perdu, vingt fois par jour.
   */
  async function basculer(portee: PorteeSession): Promise<void> {
    const compteId = session.value.compteId
    if (compteId === null) return

    if (portee.type === 'tous') {
      // ⚠️ SOUS LA PORTÉE « TOUS », AUCUNE PERMISSION N'EST PORTÉE — donc
      // **aucune surface qui modifie une caisse n'existe** (FR-019). Ce n'est
      // pas une restriction ajoutée à l'écran : c'est l'absence de droits qui la
      // produit, par le même filtrage que partout ailleurs.
      await definir({ ...session.value, portee, permissions: [], posteUnique: null })
      return
    }

    const [resolues, posteUnique] = await Promise.all([
      fournisseur().comptes.resoudrePermissions(compteId, portee.id),
      fournisseur().comptes.posteUniqueSur(compteId, portee.id),
    ])

    await definir({
      compteId,
      portee,
      permissions: resolues.ok ? resolues.valeur : [],
      posteUnique: posteUnique.ok ? posteUnique.valeur : null,
    })
  }

  return {
    session,
    etablissements,
    etablissementActif,
    poste,
    sitesEnAlerte,
    chargerLesEtablissements,
    basculer,
  }
}
