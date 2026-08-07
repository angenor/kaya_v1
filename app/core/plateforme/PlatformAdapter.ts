/**
 * L'INTERFACE COMPLÈTE DE LA PLATEFORME — écrite pour DEUX implémentations.
 *
 * ⚠️ UNE MÉTHODE DONT LA SIGNATURE NE PEUT PAS ÊTRE SERVIE PAR UN PLUGIN NATIF
 * EST UNE MÉTHODE MAL DESSINÉE. Un plugin Capacitor franchit une frontière
 * native EN SÉRIALISANT DU JSON : aucune signature ne prend ni ne rend un type
 * propre au navigateur — pas de `File`, `Blob`, `MediaStream`, `HTMLElement`.
 * La règle de lint (b) le vérifie.
 *
 * ⚠️ TOUTE MÉTHODE EST ASYNCHRONE, sans exception — y compris celles que le web
 * sert de façon synchrone. Le natif ne l'est jamais, et changer une signature de
 * synchrone à asynchrone plus tard toucherait chaque appelant.
 *
 * ⚠️ AUCUNE MÉTHODE NE LÈVE. Une capacité absente est un FAIT À AFFICHER, pas un
 * bogue à corriger : en phase 2 ces messages sont fréquents et c'est normal ;
 * Capacitor les fera disparaître.
 */

export type Moteur = 'CHROMIUM' | 'WEBKIT' | 'AUTRE'

/**
 * ⚠️ `alternativeCle` N'EST PAS OPTIONNEL, ET C'EST LE POINT DU CONTRAT. « Toute
 * interdiction a un versant positif » : le lexique en fait une exigence de
 * rédaction, ce type en fait une exigence de COMPILATION. Une indisponibilité
 * sans alternative ne compile pas. « Cet appareil ne peut pas imprimer » est
 * vrai et inutile à quelqu'un debout au comptoir.
 */
export interface Indisponibilite {
  readonly capacite: CodeCapacite
  readonly moteur: Moteur
  /** Clé i18n — JAMAIS du texte. Dit ce qui manque et pourquoi. */
  readonly motifCle: string
  /** Clé i18n — OBLIGATOIRE, jamais vide, jamais optionnelle. */
  readonly alternativeCle: string
}

export type Resultat<T> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly indisponible: Indisponibilite }

export type CodeCapacite =
  | 'IMPRESSION_THERMIQUE'
  | 'TIROIR_CAISSE'
  | 'SCAN_CODE'
  | 'CAMERA'
  | 'OCR'
  | 'STOCKAGE_SECURISE'
  | 'STOCKAGE_DURABLE'
  | 'NOTIFICATIONS'
  | 'GEOLOCALISATION'
  | 'ETAT_RESEAU'
  | 'SYSTEME_DE_FICHIERS'
  | 'ATTESTATION_INTEGRITE'

export interface RegistreCapacites {
  disponible(capacite: CodeCapacite): boolean
  /** Pourquoi elle manque, et ce qu'on peut faire à la place. */
  indisponibilite(capacite: CodeCapacite): Indisponibilite | null
  /** Toutes les absences du moteur courant — ce que l'écran de diagnostic rend. */
  absences(): readonly Indisponibilite[]
}

// ── Impression — le motif n° 1 de Capacitor ────────────────────────────────

export interface Imprimante {
  readonly id: string
  readonly nom: string
  readonly transport: 'USB' | 'BLUETOOTH' | 'RESEAU' | 'SYSTEME'
  /** 42 pour un 80 mm. */
  readonly largeurCaracteres: number
}

export type LigneTicket =
  | {
      readonly type: 'TEXTE'
      readonly texte: string
      readonly gras: boolean
      readonly alignement: 'GAUCHE' | 'CENTRE' | 'DROITE'
    }
  | { readonly type: 'SEPARATEUR' }
  | { readonly type: 'CODE_QR'; readonly donnees: string }
  | { readonly type: 'SAUT'; readonly nombre: number }

export interface TicketAImprimer {
  readonly imprimanteId: string
  /**
   * ⚠️ LIGNES DÉJÀ COMPOSÉES, LARGEUR RESPECTÉE. Un plugin natif reçoit des
   * commandes ESC/POS, pas un moteur de rendu : la composition vit AU-DESSUS de
   * l'adaptateur. C'est ce qui permet à la même structure d'être rendue à
   * l'écran en aperçu et sur papier.
   */
  readonly lignes: readonly LigneTicket[]
  readonly couperEnFin: boolean
  readonly ouvrirTiroirEnFin: boolean
}

export interface Impression {
  listerImprimantes(): Promise<Resultat<readonly Imprimante[]>>
  imprimerTicket(ticket: TicketAImprimer): Promise<Resultat<void>>
  ouvrirTiroir(imprimanteId: string): Promise<Resultat<void>>
}

// ── Scan · caméra · OCR ────────────────────────────────────────────────────

export interface CodeLu {
  readonly valeur: string
  readonly format: 'QR' | 'EAN13' | 'CODE128' | 'AUTRE'
}

export interface Scan {
  lireCode(): Promise<Resultat<CodeLu>>
}

export interface OptionsPhoto {
  readonly largeurMax: number
  readonly qualite: number
  readonly camera: 'ARRIERE' | 'AVANT'
}

export interface ImageCapturee {
  /** ⚠️ Jamais un `Blob` : il ne franchit pas la frontière native. */
  readonly donneesBase64: string
  readonly typeMime: string
  readonly largeur: number
  readonly hauteur: number
}

export interface TexteReconnu {
  readonly texte: string
  readonly confiance: number
}

export interface Camera {
  prendrePhoto(options: OptionsPhoto): Promise<Resultat<ImageCapturee>>
  /** OCR. Prend une image DÉJÀ capturée — jamais un flux. */
  lireTexte(image: ImageCapturee): Promise<Resultat<TexteReconnu>>
}

// ── Stockage sécurisé ──────────────────────────────────────────────────────

export interface StockageSecurise {
  ecrire(cle: string, valeur: string): Promise<Resultat<void>>
  lire(cle: string): Promise<Resultat<string | null>>
  supprimer(cle: string): Promise<Resultat<void>>
  purger(): Promise<Resultat<void>>
  /**
   * ⚠️ ELLE EXISTE DÈS MAINTENANT PARCE QUE SA RÉPONSE CHANGE LE PRODUIT : « le
   * navigateur peut purger le stockage après une longue inactivité — le
   * ré-enrôlement d'appareil doit être simple, il arrivera. » Le natif, lui, ne
   * purge pas.
   */
  estDurable(): Promise<Resultat<boolean>>
}

// ── Notifications · géolocalisation · réseau ───────────────────────────────

export interface NotificationLocale {
  readonly titreCle: string
  readonly corpsCle: string
  readonly parametres: Readonly<Record<string, string | number>>
}

export interface Notifications {
  etatAutorisation(): Promise<Resultat<'ACCORDEE' | 'REFUSEE' | 'NON_DEMANDEE'>>
  demanderAutorisation(): Promise<Resultat<'ACCORDEE' | 'REFUSEE'>>
  afficher(notification: NotificationLocale): Promise<Resultat<void>>
}

export interface Position {
  readonly latitude: number
  readonly longitude: number
  readonly precisionMetres: number
}

export interface Geolocalisation {
  /**
   * ⚠️ LA GÉOLOCALISATION N'EST JAMAIS BLOQUANTE (principe 9 ; CPT-06). Le
   * géorepérage est SOUPLE — 300 m par défaut, alerte au gérant, jamais
   * blocage. L'adaptateur rend une position ; il ne décide rien. *Un caissier
   * qui ne peut pas encaisser parce que le GPS dérive est un client perdu.*
   */
  positionActuelle(): Promise<Resultat<Position>>
}

export interface EtatReseau {
  readonly enLigne: boolean
  /** `null` quand le moteur ne sait pas la mesurer — WebKit ne l'expose pas. */
  readonly latenceMs: number | null
}

export interface Reseau {
  etat(): Promise<Resultat<EtatReseau>>
  /**
   * ⚠️ REND UNE FONCTION DE DÉSABONNEMENT, JAMAIS UN `EventTarget`. Une poignée
   * d'événement du navigateur ne franchit pas la frontière native ; une fonction
   * rendue par l'adaptateur, si — c'est lui qui garde le registre de ses
   * abonnés des deux côtés.
   */
  surChangement(rappel: (etat: EtatReseau) => void): () => void
}

export interface PlatformAdapter {
  readonly moteur: Moteur
  readonly capacites: RegistreCapacites
  readonly impression: Impression
  readonly scan: Scan
  readonly camera: Camera
  readonly stockageSecurise: StockageSecurise
  readonly notifications: Notifications
  readonly geolocalisation: Geolocalisation
  readonly reseau: Reseau
}
