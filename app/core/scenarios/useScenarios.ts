import { MAGASIN_SCENARIOS, ecrire, lire } from '~/core/stockage/base'
import {
  REGLAGES_INITIAUX,
  poserReglages,
  reglagesCourants,
  type ReglagesScenario,
} from '~/core/scenarios/reglages'

/**
 * LE PANNEAU SCÉNARIOS — basculer l'application dans un état dégradé, DEPUIS
 * L'INTERFACE, sans recompiler.
 *
 * ⚠️ LES RÉGLAGES SONT PERSISTÉS, ET CE N'EST PAS UN CONFORT. Un réglage qui ne
 * survivrait pas au rechargement se reposerait à chaque essai — et on cesserait
 * de s'en servir au bout de trois fois (FR-045). Or c'est précisément en
 * rechargeant qu'on vérifie que la file a tenu.
 *
 * ⚠️ ET L'ÉTAT VIT DANS UN MODULE, PAS DANS CE COMPOSABLE. La couche de
 * simulation doit le lire, et elle n'est pas un composant Vue. Ce composable
 * enveloppe le module pour l'interface, et rien de plus.
 */

const CLE_REGLAGES = 'courants'

export function useScenarios() {
  const reglages = useState<ReglagesScenario>('kaya.scenarios', () => reglagesCourants())
  const repris = useState<boolean>('kaya.scenarios.repris', () => false)

  /** Reprend les réglages persistés. Appelée une fois, au démarrage. */
  async function reprendre(): Promise<ReglagesScenario> {
    if (!repris.value) {
      const persistes = await lire<ReglagesScenario>(
        MAGASIN_SCENARIOS,
        CLE_REGLAGES,
        REGLAGES_INITIAUX,
      )
      // Les clés inconnues d'une version antérieure sont ignorées ; les clés
      // manquantes reprennent leur valeur initiale. Un réglage persisté ne doit
      // jamais empêcher l'application de démarrer.
      const fusionnes = { ...REGLAGES_INITIAUX, ...persistes }
      reglages.value = fusionnes
      poserReglages(fusionnes)
      repris.value = true
    }
    return reglages.value
  }

  /** Change un levier, et le persiste. */
  async function regler<C extends keyof ReglagesScenario>(
    cle: C,
    valeur: ReglagesScenario[C],
  ): Promise<void> {
    const nouveaux = { ...reglages.value, [cle]: valeur }
    reglages.value = nouveaux
    poserReglages(nouveaux)
    await ecrire(MAGASIN_SCENARIOS, CLE_REGLAGES, nouveaux)
  }

  /** Remet tous les leviers à leur valeur initiale. */
  async function toutRemettre(): Promise<void> {
    reglages.value = REGLAGES_INITIAUX
    poserReglages(REGLAGES_INITIAUX)
    await ecrire(MAGASIN_SCENARIOS, CLE_REGLAGES, REGLAGES_INITIAUX)
  }

  return { reglages, reprendre, regler, toutRemettre }
}
