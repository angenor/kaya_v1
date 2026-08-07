import { stockageEstDurable } from '~/core/plateforme/web/stockageDurable'

/**
 * CE QUE `R0` ANNONCE **AVANT TOUTE SAISIE** — FR-006, FR-007.
 *
 * ⚠️ TROIS ÉTATS, ET LE TROISIÈME N'EST PAS UN TROISIÈME CAS SILENCIEUX.
 * `inconnue` ne dure que le temps de la réponse ; l'écran ne rend **aucun
 * champ** tant qu'il y est. Rendre le formulaire d'abord et l'annonce après
 * ferait taper l'identifiant avant de savoir ce qu'il en adviendra — c'est
 * exactement ce que l'exigence ferme.
 *
 * ⚠️ INTERROGÉE **UNE FOIS**, ET LE VERDICT EST MÉMORISÉ POUR LA SESSION.
 * `navigator.storage.persist()` est asynchrone et **peut ouvrir une invite du
 * navigateur** : la rappeler à chaque rendu ferait clignoter l'annonce et
 * reviendrait déranger l'utilisateur pour une question déjà réglée.
 *
 * ⚠️ ET LES DEUX PHRASES DISENT CE QUI SE PASSERA, jamais un avertissement
 * technique. « Cet appareil peut vous redemander votre identifiant » est un fait
 * d'usage ; « stockage non persistant » est un constat d'ingénieur qui n'apprend
 * rien à quelqu'un debout à la réception.
 */
export type Persistance = 'inconnue' | 'durable' | 'fragile'

export function usePersistanceAnnoncee() {
  const persistance = useState<Persistance>('kaya.persistance', () => 'inconnue')
  const demandee = useState<boolean>('kaya.persistance.demandee', () => false)

  async function annoncer(): Promise<Persistance> {
    if (!demandee.value) {
      demandee.value = true
      persistance.value = (await stockageEstDurable()) ? 'durable' : 'fragile'
    }
    return persistance.value
  }

  return { persistance, annoncer }
}
