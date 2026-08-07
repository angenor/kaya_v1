/**
 * LE STOCKAGE DURABLE — la seule capacité de plateforme que ce cycle consomme.
 *
 * ⚠️ ELLE VIT ICI PARCE QU'ELLE TOUCHE `navigator`, ET LA RÈGLE DE LINT (a) L'Y
 * CONFINE. Aucun composant n'appelle `navigator.storage` : il demande à
 * l'adaptateur, qui répond un fait. Le jour où Capacitor remplace la PWA, le
 * natif ne purge pas et cette fonction rendra `true` sans qu'un écran bouge.
 *
 * ⚠️ SA RÉPONSE CHANGE CE QUE `R0` DIT AVANT LA SAISIE, et c'est pourquoi elle
 * est interrogée plutôt que supposée : « le navigateur peut purger le stockage
 * après une longue inactivité — le ré-enrôlement d'appareil doit être simple, il
 * arrivera » (principe 9). Découvrir une déconnexion une heure plus tard, devant
 * un écran qu'on n'a pas demandé, est ce que l'annonce ferme.
 *
 * ⚠️ ET ELLE NE LÈVE JAMAIS. Une capacité absente est un **fait à afficher**,
 * pas un bogue à corriger : sur un moteur qui n'expose pas l'API, ou en
 * navigation privée où l'accès lève, la réponse est « non durable » — ce qui est
 * exactement la vérité.
 */

/**
 * Demande — et obtient, ou non — la persistance du stockage de cette origine.
 *
 * ⚠️ `persist()` PEUT OUVRIR UNE INVITE DU NAVIGATEUR, et c'est ce qui interdit
 * de l'appeler à chaque rendu : l'annonce clignoterait, et l'invite reviendrait.
 * L'appelant mémorise le verdict pour la durée de la session.
 */
export async function stockageEstDurable(): Promise<boolean> {
  try {
    const stockage = navigator.storage
    if (stockage === undefined) return false
    // `persisted()` d'abord : si l'origine est DÉJÀ persistante, redemander
    // n'apporte rien et pourrait rouvrir une invite pour une question réglée.
    if (typeof stockage.persisted === 'function' && (await stockage.persisted())) return true
    if (typeof stockage.persist !== 'function') return false
    return await stockage.persist()
  } catch {
    return false
  }
}
