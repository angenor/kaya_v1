import { v7 as uuidV7 } from 'uuid'

import type { ClasseHorsLigne } from '~/core/donnees/contrat'
import { accepteHorsLigne, classeOuDefautStrict } from '~/core/file/classes'
import { reglagesCourants } from '~/core/scenarios/reglages'
import { MAGASIN_FILE, ecrire, lireTout, supprimer, viderMagasin } from '~/core/stockage/base'

/**
 * LA FILE HORS-LIGNE — elle accumule, elle affiche, et **elle refuse**.
 *
 * ⚠️ EN PHASE 2, LA FILE N'ENVOIE RIEN. **Le refus est la propriété qu'on teste,
 * pas l'envoi.** Un écran qui accepterait ici ce que le serveur refusera en
 * phase 3 est un écran à refaire, et le mensonge ne se découvrirait qu'au
 * branchement.
 *
 * ⚠️ AUCUNE DONNÉE DE CLASSE B, C OU D N'ENTRE EN CACHE D'ÉCRITURE (cadrage
 * §11.5 point 4). Le refus est prononcé **AVANT** la tentative — jamais après un
 * échec, jamais « mise en file au cas où ».
 *
 * ⚠️ CHAQUE ÉLÉMENT PORTE UN **UUID v7 GÉNÉRÉ CÔTÉ CLIENT**. Pas un v4 :
 * `crypto.randomUUID()` rend un identifiant aléatoire, NON ORDONNABLE dans le
 * temps. Les 48 bits de tête d'un v7 portent l'horodatage — c'est ce qui rend la
 * file rejouable dans l'ordre et le dédoublonnage serveur inoffensif.
 */

export interface ElementFile {
  /** UUID v7 — l'ordre du temps est dans l'identifiant. */
  readonly id: string
  /** Horodatage LOCAL, indicatif : il sert l'affichage, jamais un calcul. */
  readonly horodatageClient: string
  readonly classe: ClasseHorsLigne
  readonly operation: string
  readonly charge: unknown
  /** ⚠️ UNE SEULE VALEUR EN PHASE 2 : la file n'envoie rien (FR-061). */
  readonly etat: 'EN_ATTENTE'
}

/** Ce qu'une tentative d'écriture rend. */
export type ResultatEcriture =
  | { readonly accepte: true; readonly element: ElementFile }
  | {
      readonly accepte: false
      /** Clé i18n du refus — jamais du texte. */
      readonly motifCle: string
      /**
       * ⚠️ CE QUI RESTE POSSIBLE, ET CE CHAMP N'EST PAS OPTIONNEL. « Toute
       * interdiction a un versant positif » : « Cette action nécessite
       * internet » est vrai et inutile à quelqu'un debout au comptoir.
       */
      readonly alternativeCle: string
    }

export function useFile() {
  const elements = useState<readonly ElementFile[]>('kaya.file', () => [])
  const repris = useState<boolean>('kaya.file.repris', () => false)

  async function reprendre(): Promise<readonly ElementFile[]> {
    if (!repris.value) {
      const persistes = await lireTout<ElementFile>(MAGASIN_FILE)
      // L'ordre est celui des UUID v7, donc celui du temps. C'est la propriété
      // qui rend le rejeu correct — un tri par date locale ne la donnerait pas,
      // l'horloge d'un terminal se règle à la main.
      elements.value = [...persistes].sort((a, b) => a.id.localeCompare(b.id))
      repris.value = true
    }
    return elements.value
  }

  /**
   * Tente une écriture.
   *
   * ⚠️ LA CLASSE EST LUE DEPUIS LE REGISTRE, ET LE REFUS EST PRONONCÉ AVANT
   * TOUTE TENTATIVE. C'est la règle du cadrage §11.1, et elle s'applique DÈS LA
   * PHASE 2, sur données simulées : « une opération de classe C doit être
   * refusée hors ligne même quand rien n'est branché ».
   */
  async function ecrireOuRefuser(
    operation: string,
    charge: unknown = null,
  ): Promise<ResultatEcriture> {
    const classe = classeOuDefautStrict(operation)
    const horsLigne = reglagesCourants().horsLigne

    if (horsLigne && !accepteHorsLigne(classe)) {
      return {
        accepte: false,
        motifCle: 'file.refusHorsLigne',
        alternativeCle: 'file.refusHorsLigneAlternative',
      }
    }

    const element: ElementFile = {
      id: uuidV7(),
      horodatageClient: new Date().toISOString(),
      classe,
      operation,
      charge,
      etat: 'EN_ATTENTE',
    }
    await ecrire(MAGASIN_FILE, element.id, element)
    elements.value = [...elements.value, element]
    return { accepte: true, element }
  }

  /** Retire un élément — employé par l'instrument, jamais par le produit. */
  async function retirer(id: string): Promise<void> {
    await supprimer(MAGASIN_FILE, id)
    elements.value = elements.value.filter((e) => e.id !== id)
  }

  async function toutVider(): Promise<void> {
    await viderMagasin(MAGASIN_FILE)
    elements.value = []
  }

  /** Le décompte EXACT. Jamais un pourcentage (composant 10). */
  const enAttente = computed(() => elements.value.length)

  return { elements, enAttente, reprendre, ecrireOuRefuser, retirer, toutVider }
}
