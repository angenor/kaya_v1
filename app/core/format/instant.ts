/**
 * LA SEULE FONCTION DU DÉPÔT QUI ÉCRIT UNE HEURE OU UNE DATE.
 *
 * ⚠️ TOUJOURS AU FUSEAU DE L'ÉTABLISSEMENT, jamais à celui de l'appareil. La
 * colonne `etablissement.fuseau_horaire` existe pour cela : un poste dont
 * l'horloge est réglée sur un autre fuseau — ou une horloge simplement fausse,
 * ce qui est le cas ordinaire d'un terminal partagé — afficherait une heure qui
 * n'est celle de personne. Le fuseau est donc un PARAMÈTRE OBLIGATOIRE : aucune
 * signature ne permet de l'oublier.
 *
 * ⚠️ ET CETTE FONCTION NE PORTE AUCUNE RÈGLE. Elle relève de l'exemption
 * « rendu de l'instant perçu » (constitution, principe 4) : elle met en forme un
 * instant pour qu'un humain le lise, et rien d'autre. Aucune durée, aucun
 * montant, aucune disponibilité ne se calcule d'ici — tout cela s'appuie sur
 * `cree_le`, posé par la base, jamais sur l'horloge d'un terminal.
 *
 * ⚠️ AUCUNE DÉPENDANCE. La famille « date et heure (JS) » a été ouverte par ce
 * cycle et tranchée pour tout le dépôt : `Intl` natif, présent dans les deux
 * moteurs de la porte P-04. `date-fns` exigerait un second paquet pour les
 * fuseaux, `dayjs` un greffon, `luxon` ses propres données de locale —
 * redondantes avec `Intl`. Voir `docs/versions-reference.md` §3.4.
 *
 * ⚠️ LE SÉPARATEUR EST REMPLACÉ **ICI, UNE FOIS**, exactement comme
 * `montant.ts` impose son U+202F. `fr-FR` rend `09:40` ; la maquette écrit
 * `09 h 40`. Le faire à l'appel serait le refaire onze fois, et le rater une.
 *
 * ⚠️ ET L'ESPACE D'UNE HEURE EST L'ESPACE **ORDINAIRE**, pas la fine insécable
 * des montants (`tokens.md` §2) : « les heures gardent une espace ordinaire
 * (`17 h 30`) : elles ne se coupent pas, la lettre h les tient ». Employer
 * U+202F ici aurait aligné deux conventions qui n'ont pas la même raison d'être.
 */

/** La langue d'écriture. Le produit n'en sert que deux, fr par défaut. */
export type LangueInstant = 'fr' | 'en'

/**
 * Ce qu'il faut pour écrire un instant : le fuseau, et la langue.
 * `fuseauHoraire` vient de `etablissement.fuseauHoraire`, jamais d'une constante.
 */
export interface ContexteInstant {
  readonly fuseauHoraire: string
  readonly langue: LangueInstant
}

const ETIQUETTE: Readonly<Record<LangueInstant, string>> = { fr: 'fr-FR', en: 'en-GB' }

/**
 * Écrit une heure : `09 h 40` en français, `09:40` en anglais.
 *
 * ⚠️ LA SUBSTITUTION NE S'APPLIQUE QU'AU FRANÇAIS. « 09 h 40 » est une
 * convention française ; l'écrire en anglais produirait une forme qu'aucune des
 * deux langues n'emploie.
 */
export function formaterHeure(instant: Date, contexte: ContexteInstant): string {
  const ecrit = new Intl.DateTimeFormat(ETIQUETTE[contexte.langue], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: contexte.fuseauHoraire,
  }).format(instant)
  return contexte.langue === 'fr' ? ecrit.replace(':', ' h ') : ecrit
}

/**
 * Écrit une date longue sans l'année : `Mardi 14 juillet`.
 *
 * ⚠️ SANS L'ANNÉE, ET C'EST LA MAQUETTE QUI LE DIT. L'en-tête répond à « quel
 * jour sommes-nous », pas à « en quelle année » — l'année y prendrait la place
 * d'une information que personne ne cherche.
 *
 * ⚠️ LA MAJUSCULE INITIALE EST POSÉE ICI. `Intl` rend « mardi 14 juillet » en
 * français ; la maquette écrit « Mardi ». Une capitalisation faite à l'appel
 * serait faite deux fois sur trois.
 */
export function formaterDateLongue(instant: Date, contexte: ContexteInstant): string {
  const ecrit = new Intl.DateTimeFormat(ETIQUETTE[contexte.langue], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: contexte.fuseauHoraire,
  }).format(instant)
  return ecrit.charAt(0).toLocaleUpperCase(ETIQUETTE[contexte.langue]) + ecrit.slice(1)
}
