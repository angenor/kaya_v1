import type {
  CodeCapacite,
  Indisponibilite,
  Moteur,
  RegistreCapacites,
} from '~/core/plateforme/PlatformAdapter'

/**
 * LE RECENSEMENT DES CAPACITÉS, **PAR MOTEUR** — des faits, pas des bogues.
 *
 * ⚠️ IL VIT DANS LE CODE **ET** DANS UNE NOTE LISIBLE, ET LES DEUX DISENT LA
 * MÊME CHOSE (FR-056). Un test le vérifie : les douze codes et les verdicts par
 * moteur doivent coïncider avec
 * `specs/003-coquille-application/contracts/platform-adapter.md` §5.
 *
 * ⚠️ LE REGISTRE EST INTERROGEABLE **AVANT** L'APPEL, et c'est ce qui rend
 * FR-055 tenable : l'interface annonce l'indisponibilité AVANT que l'utilisateur
 * ne tente l'action, jamais après un échec. Une action dont la capacité manque
 * n'est PAS grisée : elle est absente, et un bandeau dit pourquoi avec son
 * alternative.
 */

export const CODES_CAPACITE: readonly CodeCapacite[] = [
  'IMPRESSION_THERMIQUE',
  'TIROIR_CAISSE',
  'SCAN_CODE',
  'CAMERA',
  'OCR',
  'STOCKAGE_SECURISE',
  'STOCKAGE_DURABLE',
  'NOTIFICATIONS',
  'GEOLOCALISATION',
  'ETAT_RESEAU',
  'SYSTEME_DE_FICHIERS',
  'ATTESTATION_INTEGRITE',
]

/** `absente` : le moteur ne la sert pas. `reservee` : elle a une condition. */
type Verdict = 'presente' | 'absente' | 'reservee'

interface Entree {
  readonly chromium: Verdict
  readonly webkit: Verdict
  readonly motifCle: string
  readonly alternativeCle: string
}

/**
 * ⚠️ LES QUATRE FORMULATIONS D'ALTERNATIVE VIENNENT DES STORIES, MOT POUR MOT.
 * Celle de l'impression est reprise de **PWA-04** sans une virgule de plus.
 */
const RECENSEMENT: Readonly<Record<CodeCapacite, Entree>> = {
  IMPRESSION_THERMIQUE: {
    chromium: 'presente',
    webkit: 'absente',
    motifCle: 'capacites.impression.motif',
    alternativeCle: 'capacites.impression.alternative',
  },
  TIROIR_CAISSE: {
    chromium: 'presente',
    webkit: 'absente',
    motifCle: 'capacites.tiroir.motif',
    alternativeCle: 'capacites.tiroir.alternative',
  },
  SCAN_CODE: {
    chromium: 'presente',
    webkit: 'presente',
    motifCle: 'capacites.scan.motif',
    alternativeCle: 'capacites.scan.alternative',
  },
  CAMERA: {
    chromium: 'presente',
    webkit: 'presente',
    motifCle: 'capacites.camera.motif',
    alternativeCle: 'capacites.camera.alternative',
  },
  OCR: {
    chromium: 'reservee',
    webkit: 'reservee',
    motifCle: 'capacites.ocr.motif',
    alternativeCle: 'capacites.ocr.alternative',
  },
  STOCKAGE_SECURISE: {
    chromium: 'presente',
    webkit: 'presente',
    motifCle: 'capacites.stockageSecurise.motif',
    alternativeCle: 'capacites.stockageSecurise.alternative',
  },
  STOCKAGE_DURABLE: {
    chromium: 'reservee',
    webkit: 'reservee',
    motifCle: 'capacites.stockageDurable.motif',
    alternativeCle: 'capacites.stockageDurable.alternative',
  },
  NOTIFICATIONS: {
    chromium: 'presente',
    webkit: 'reservee',
    motifCle: 'capacites.notifications.motif',
    alternativeCle: 'capacites.notifications.alternative',
  },
  GEOLOCALISATION: {
    chromium: 'presente',
    webkit: 'presente',
    motifCle: 'capacites.geolocalisation.motif',
    alternativeCle: 'capacites.geolocalisation.alternative',
  },
  ETAT_RESEAU: {
    chromium: 'presente',
    webkit: 'reservee',
    motifCle: 'capacites.etatReseau.motif',
    alternativeCle: 'capacites.etatReseau.alternative',
  },
  SYSTEME_DE_FICHIERS: {
    chromium: 'presente',
    webkit: 'absente',
    motifCle: 'capacites.fichiers.motif',
    alternativeCle: 'capacites.fichiers.alternative',
  },
  /**
   * ⚠️ ELLE N'EXISTE SUR **AUCUN** MOTEUR WEB, ET SON ALTERNATIVE POINTE VERS
   * UNE PHRASE QUI DIT QU'IL N'Y EN A PAS — pas vers une chaîne vide. « La
   * sécurité repose sur le serveur, jamais sur une promesse du client. C'est une
   * limite ASSUMÉE, pas un défaut à corriger » (principe 9). Le type reste
   * satisfait, et le produit dit la vérité.
   */
  ATTESTATION_INTEGRITE: {
    chromium: 'absente',
    webkit: 'absente',
    motifCle: 'capacites.attestation.motif',
    alternativeCle: 'capacites.attestation.alternative',
  },
}

/**
 * Détecte le moteur.
 *
 * ⚠️ ON RECONNAÎT WEBKIT PAR L'ABSENCE DE CHROME, PAS PAR « Safari » : tous les
 * navigateurs de Chromium mettent « Safari » dans leur chaîne d'agent. Et cette
 * fonction vit dans `app/core/plateforme/`, le seul endroit où `navigator` est
 * permis.
 */
export function detecterMoteur(): Moteur {
  try {
    const agent = navigator.userAgent
    if (/Chrome|Chromium|Edg\//.test(agent)) return 'CHROMIUM'
    if (/AppleWebKit/.test(agent)) return 'WEBKIT'
    return 'AUTRE'
  } catch {
    return 'AUTRE'
  }
}

function verdict(capacite: CodeCapacite, moteur: Moteur): Verdict {
  const entree = RECENSEMENT[capacite]
  if (moteur === 'CHROMIUM') return entree.chromium
  if (moteur === 'WEBKIT') return entree.webkit
  // Un moteur inconnu est traité comme le plus contraint : on préfère annoncer
  // une absence qui n'existe pas plutôt que promettre une capacité qui manque.
  return entree.webkit === 'presente' && entree.chromium === 'presente' ? 'presente' : 'absente'
}

export function registreDesCapacites(moteur: Moteur = detecterMoteur()): RegistreCapacites {
  return {
    disponible(capacite) {
      return verdict(capacite, moteur) === 'presente'
    },
    indisponibilite(capacite) {
      if (verdict(capacite, moteur) === 'presente') return null
      const entree = RECENSEMENT[capacite]
      return {
        capacite,
        moteur,
        motifCle: entree.motifCle,
        alternativeCle: entree.alternativeCle,
      }
    },
    absences() {
      return CODES_CAPACITE.map((capacite) => this.indisponibilite(capacite)).filter(
        (absence): absence is Indisponibilite => absence !== null,
      )
    },
  }
}

/** Les absences du moteur courant — ce que le panneau Scénarios affiche. */
export function capacitesAbsentes(): readonly Indisponibilite[] {
  return registreDesCapacites().absences()
}

/** Le recensement brut — lu par le test qui le confronte à la note. */
export function recensementBrut(): Readonly<Record<CodeCapacite, Entree>> {
  return RECENSEMENT
}
