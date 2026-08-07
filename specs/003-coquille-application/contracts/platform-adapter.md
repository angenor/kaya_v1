# Contrat — `PlatformAdapter`

**Cycle** : F1 · **Exigences** : FR-052 à FR-056, FR-092 · **Story** : PWA-02 *(P0, dû dès la phase 2)*
**Principe** : constitution, principe 7 — *« c'est la règle `PlatformAdapter`, et elle seule, qui rend le changement de coquille mécanique plutôt qu'une réécriture »*

---

## 1. La règle de conception, avant toute signature

> **Une méthode dont la signature ne peut pas être servie par un plugin natif est une méthode mal dessinée.**

Cette phrase a une conséquence technique précise, et c'est elle qui gouverne tout ce contrat : **un plugin Capacitor franchit une frontière native en sérialisant du JSON.** Une signature qui prend ou rend un objet propre au navigateur ne peut donc pas traverser.

**Interdit dans toute signature** — le contrôle est mécanique, c'est une règle de lint :

| Type refusé | Pourquoi il ne traverse pas | Ce qui le remplace |
|---|---|---|
| `File`, `Blob` | non sérialisable | `{ donneesBase64: string, typeMime: string }` |
| `MediaStream`, `ImageBitmap` | poignée sur une ressource du moteur | une **image capturée**, déjà encodée |
| `HTMLElement`, `Node` | n'existe pas côté natif | rien — l'adaptateur ne touche pas au DOM |
| `Promise<void>` **sans résultat d'échec** | une capacité peut être absente | `Promise<Resultat<void>>` — §2 |
| `Error` levée | une absence n'est **pas** une erreur | `Resultat` — §2 |

**Toute méthode est asynchrone**, sans exception — y compris celles que le web sert de façon synchrone. Le natif ne l'est jamais, et changer une signature de synchrone à asynchrone plus tard toucherait chaque appelant.

---

## 2. `Resultat<T>` — l'absence est dans le TYPE, pas dans une convention

FR-055 exige qu'**une capacité absente le dise explicitement et propose l'alternative**. Une convention de code se perd ; un type se vérifie à la compilation.

```ts
export type Resultat<T> =
  | { readonly ok: true;  readonly valeur: T }
  | { readonly ok: false; readonly indisponible: Indisponibilite }

export interface Indisponibilite {
  readonly capacite: CodeCapacite
  readonly moteur: Moteur
  /** Clé i18n — JAMAIS du texte. Dit ce qui manque et pourquoi. */
  readonly motifCle: string
  /**
   * Clé i18n — OBLIGATOIRE, jamais vide, jamais optionnelle.
   * C'est ce champ, et le fait qu'il ne soit pas `?`, qui rend FR-055
   * impossible à oublier : une indisponibilité sans alternative ne compile pas.
   */
  readonly alternativeCle: string
}

export type Moteur = 'CHROMIUM' | 'WEBKIT' | 'AUTRE'
```

> **`alternativeCle` n'est pas optionnel, et c'est le point du contrat.** *« Toute interdiction a un versant positif »* — le lexique en fait une exigence de rédaction ; ce type en fait une exigence de compilation. « Cet appareil ne peut pas imprimer » est vrai et inutile à quelqu'un debout au comptoir.

**Aucune méthode ne lève.** Une capacité absente est un **fait à afficher**, pas un bogue à corriger : en phase 2 ces messages sont fréquents et c'est normal ; Capacitor les fera disparaître.

---

## 3. L'interface complète

```ts
export interface PlatformAdapter {
  readonly moteur: Moteur
  /** Le recensement — interrogeable par l'application, §5. */
  readonly capacites: RegistreCapacites

  readonly impression:       Impression
  readonly scan:             Scan
  readonly camera:           Camera
  readonly stockageSecurise: StockageSecurise
  readonly notifications:    Notifications
  readonly geolocalisation:  Geolocalisation
  readonly reseau:           Reseau
}
```

### 3.1 Impression — *le motif n° 1 de Capacitor*

```ts
export interface Impression {
  listerImprimantes(): Promise<Resultat<Imprimante[]>>
  /** Le contenu est un document déjà composé — l'adaptateur ne met rien en page. */
  imprimerTicket(ticket: TicketAImprimer): Promise<Resultat<void>>
  ouvrirTiroir(imprimanteId: string): Promise<Resultat<void>>
}

export interface Imprimante {
  readonly id: string
  readonly nom: string
  readonly transport: 'USB' | 'BLUETOOTH' | 'RESEAU' | 'SYSTEME'
  readonly largeurCaracteres: number   // 42 pour un 80 mm
}

export interface TicketAImprimer {
  readonly imprimanteId: string
  /** Lignes déjà composées, largeur respectée. Aucune mise en page ici. */
  readonly lignes: readonly LigneTicket[]
  readonly couperEnFin: boolean
  readonly ouvrirTiroirEnFin: boolean
}

export type LigneTicket =
  | { readonly type: 'TEXTE';    readonly texte: string; readonly gras: boolean; readonly alignement: 'GAUCHE' | 'CENTRE' | 'DROITE' }
  | { readonly type: 'SEPARATEUR' }
  | { readonly type: 'CODE_QR';  readonly donnees: string }
  | { readonly type: 'SAUT';     readonly nombre: number }
```

> **Pourquoi des lignes composées et non un gabarit.** Un plugin natif reçoit des commandes ESC/POS, pas un moteur de rendu. La composition — largeur 80 mm, ~42 caractères, sans couleur — appartient au cycle IMP et vit **au-dessus** de l'adaptateur. C'est ce qui permet à la même structure d'être rendue à l'écran en aperçu (DoD point 10) et sur papier.

### 3.2 Scan · Caméra · OCR

```ts
export interface Scan {
  lireCode(): Promise<Resultat<CodeLu>>
}
export interface CodeLu {
  readonly valeur: string
  readonly format: 'QR' | 'EAN13' | 'CODE128' | 'AUTRE'
}

export interface Camera {
  prendrePhoto(options: OptionsPhoto): Promise<Resultat<ImageCapturee>>
  /** OCR. Prend une image DÉJÀ capturée — jamais un flux. */
  lireTexte(image: ImageCapturee): Promise<Resultat<TexteReconnu>>
}

export interface OptionsPhoto {
  readonly largeurMax: number
  readonly qualite: number          // 0..100
  readonly camera: 'ARRIERE' | 'AVANT'
}

export interface ImageCapturee {
  readonly donneesBase64: string    // ⚠️ jamais un Blob — §1
  readonly typeMime: string
  readonly largeur: number
  readonly hauteur: number
}

export interface TexteReconnu {
  readonly texte: string
  readonly confiance: number        // 0..1
}
```

### 3.3 Stockage sécurisé

```ts
export interface StockageSecurise {
  ecrire(cle: string, valeur: string): Promise<Resultat<void>>
  lire(cle: string): Promise<Resultat<string | null>>
  supprimer(cle: string): Promise<Resultat<void>>
  purger(): Promise<Resultat<void>>
  /** Le navigateur PEUT purger après inactivité prolongée. Le natif, non. */
  estDurable(): Promise<Resultat<boolean>>
}
```

> ⚠️ **Ce cycle livre l'ACCÈS, pas la protection** (FR-092, D-16). Le chiffrement au repos et la purge à la déconnexion relèvent de **PWA-05, tranche T4**. `estDurable()` existe dès maintenant parce que sa réponse change le produit : *« le navigateur peut purger le stockage après une longue inactivité — le ré-enrôlement d'appareil doit être simple, il arrivera. »*

### 3.4 Notifications · Géolocalisation · Réseau

```ts
export interface Notifications {
  etatAutorisation(): Promise<Resultat<'ACCORDEE' | 'REFUSEE' | 'NON_DEMANDEE'>>
  demanderAutorisation(): Promise<Resultat<'ACCORDEE' | 'REFUSEE'>>
  afficher(notification: NotificationLocale): Promise<Resultat<void>>
}
export interface NotificationLocale {
  readonly titreCle: string         // clé i18n — jamais du texte
  readonly corpsCle: string
  readonly parametres: Readonly<Record<string, string | number>>
}

export interface Geolocalisation {
  positionActuelle(): Promise<Resultat<Position>>
}
export interface Position {
  readonly latitude: number
  readonly longitude: number
  readonly precisionMetres: number
}

export interface Reseau {
  etat(): Promise<Resultat<EtatReseau>>
  /** Rend une fonction de désabonnement — pas un EventTarget, qui ne traverse pas. */
  surChangement(rappel: (etat: EtatReseau) => void): () => void
}
export interface EtatReseau {
  readonly enLigne: boolean
  /** `null` quand le moteur ne sait pas la mesurer — WebKit n'expose pas la connexion. */
  readonly latenceMs: number | null
}
```

> **`surChangement` rend une fonction de désabonnement, jamais un `EventTarget`.** Une poignée d'événement du navigateur ne franchit pas la frontière native ; une fonction rendue par l'adaptateur, si — c'est l'adaptateur qui garde le registre de ses abonnés des deux côtés.

> **La géolocalisation n'est JAMAIS bloquante** (constitution, principe 9 ; CPT-06). Le géorepérage est souple — 300 m par défaut, **alerte au gérant, jamais blocage**. L'adaptateur rend une position ; il ne décide rien. *Un caissier qui ne peut pas encaisser parce que le GPS dérive est un client perdu.*

---

## 4. `RegistreCapacites` — le recensement, dans le code

```ts
export type CodeCapacite =
  | 'IMPRESSION_THERMIQUE' | 'TIROIR_CAISSE' | 'SCAN_CODE'
  | 'CAMERA' | 'OCR' | 'STOCKAGE_SECURISE' | 'STOCKAGE_DURABLE'
  | 'NOTIFICATIONS' | 'GEOLOCALISATION' | 'ETAT_RESEAU'
  | 'SYSTEME_DE_FICHIERS' | 'ATTESTATION_INTEGRITE'

export interface RegistreCapacites {
  disponible(capacite: CodeCapacite): boolean
  /** Pourquoi elle manque, et ce qu'on peut faire à la place. */
  indisponibilite(capacite: CodeCapacite): Indisponibilite | null
  /** Toutes les absences du moteur courant — c'est ce que l'écran de diagnostic affiche. */
  absences(): readonly Indisponibilite[]
}
```

**Le registre est interrogeable AVANT l'appel** — c'est ce qui rend FR-055 tenable : l'interface annonce l'indisponibilité **avant que l'utilisateur ne tente l'action**, jamais après un échec. Une action dont la capacité manque **n'est pas grisée** : elle est absente, et un bandeau dit pourquoi avec son alternative.

---

## 5. Le recensement par moteur — des faits, pas des bogues

*Repris de PWA-03, PWA-04, PWA-05, PWA-06 et de la constitution, principe 9. Il vit **dans le code** (`app/core/plateforme/capacites.ts`) **et dans une note** lisible, et les deux disent la même chose (FR-056).*

| Capacité | **Chromium** — Windows, Android, Linux, macOS | **WebKit** — tout iPhone et iPad | **Capacitor** *(production)* |
|---|---|---|---|
| `IMPRESSION_THERMIQUE` | ✅ WebUSB / Web Bluetooth | ❌ **WebUSB et Web Bluetooth absents de Safari** | ✅ plugin Bluetooth natif |
| `TIROIR_CAISSE` | ✅ via l'imprimante | ❌ même motif | ✅ |
| `SCAN_CODE` | ✅ | ✅ | ✅ |
| `CAMERA` | ✅ | ✅ | ✅ |
| `OCR` | ⚠️ selon le moteur | ⚠️ selon le moteur | ✅ natif |
| `STOCKAGE_SECURISE` | ✅ WebCrypto, clés non extractibles en IndexedDB | ✅ idem | ✅ Keystore Android / Keychain iOS |
| `STOCKAGE_DURABLE` | ⚠️ **purgeable** après inactivité | ⚠️ **purge plus agressive** | ✅ adossé au matériel |
| `NOTIFICATIONS` | ✅ Web Push (VAPID) | ⚠️ **iOS 16.4+ ET application installée** | ✅ APNs / FCM, sans condition |
| `GEOLOCALISATION` | ✅ | ✅ | ✅ |
| `ETAT_RESEAU` | ✅ avec latence | ⚠️ **en ligne / hors ligne seulement**, `latenceMs: null` | ✅ |
| `SYSTEME_DE_FICHIERS` | ✅ File System Access | ❌ **absent sur iOS** | ✅ |
| `ATTESTATION_INTEGRITE` | ❌ **n'existe sur AUCUN moteur web** | ❌ | ✅ Play Integrity / App Attest |

**Les alternatives, telles qu'elles s'affichent** :

| Absence | Ce que l'écran dit | Source de la formulation |
|---|---|---|
| Impression thermique sur WebKit | « **cet appareil ne peut pas imprimer directement — le ticket part sur l'imprimante de la réception** » | **PWA-04**, mot pour mot (D-09) |
| Notifications sur WebKit non installé | « Sans installation, cet appareil ne recevra pas les alertes. » + l'invite d'installation | PWA-03 → PWA-01 |
| Stockage non durable | « Cet appareil peut être amené à se reconnecter. » | PWA-05 |
| Attestation d'intégrité | **Aucune alternative n'est proposée**, et c'est délibéré : *« la sécurité repose sur le serveur, jamais sur une promesse du client. C'est une limite assumée, pas un défaut à corriger. »* | constitution, principe 9 |

> ⚠️ **`ATTESTATION_INTEGRITE` est le seul cas où `alternativeCle` pointe vers une phrase qui dit qu'il n'y a pas d'alternative** — pas vers une chaîne vide. Le type reste satisfait, et le produit dit la vérité.

---

## 6. Comment le contrat est vérifié

| Exigence | Mécanisme | Où |
|---|---|---|
| **FR-054** — aucun composant n'appelle une API de plateforme directement | Règle **ESLint** : `navigator.*`, `window.print`, `Notification`, `USBDevice`, `BluetoothDevice`, `localStorage`, `indexedDB` sont **interdits hors de `app/core/plateforme/` et `app/core/file/`**. Échoue **en nommant le fichier** | étape **lint** |
| **FR-053** — signature servable par un plugin natif | Règle **ESLint** : aucun `File`, `Blob`, `MediaStream`, `HTMLElement` dans une signature de `PlatformAdapter.ts` | étape **lint** |
| **FR-055** — l'absence dit et propose | **Le type** : `alternativeCle` n'est pas optionnel. Plus un test d'unité : pour **chaque** `CodeCapacite` absente du moteur simulé, `indisponibilite()` rend un objet dont les deux clés **existent dans les deux catalogues** | compilation + **tests d'unité** |
| **FR-056** — recensement dans le code et dans une note | Test d'unité : la table de la note et `capacites.ts` portent **les mêmes 12 codes** et les mêmes verdicts par moteur | **tests d'unité** |
| **FR-055** vu de l'écran | Playwright : sur **WebKit**, la demande d'impression affiche la phrase de PWA-04 ; sur **Chromium**, elle ne l'affiche pas | **P-04** |
| **FR-092** — le chiffrement est hors périmètre | Aucun test — c'est une **absence déclarée**, inscrite au rapport de cycle | — |

---

## 7. L'implémentation `capacitor` — prévue, pas livrée

Elle n'existe pas dans ce cycle et **aucune ligne n'est écrite pour elle**. Ce qui est acquis :

1. **Aucune signature ne la bloque** — c'est ce que la règle du §1 garantit, et le lint le vérifie ;
2. **Le point de liaison existe** : `fournirPlatformAdapter()` rend l'implémentation selon la coquille ; en changer est une ligne ;
3. **Chaque méthode `web` sait déjà rendre une indisponibilité** — l'implémentation `capacitor` en rendra simplement beaucoup moins.

> **Capacitor entre au §2 de `docs/versions-reference.md` en dixième brique, au cycle qui l'introduit** — avec sa version vérifiée, celle de ses plugins, et les exigences de chaîne de build Android et iOS. **Ce cycle ne l'inscrit pas** : on n'épingle pas une version qu'on n'installe pas.
