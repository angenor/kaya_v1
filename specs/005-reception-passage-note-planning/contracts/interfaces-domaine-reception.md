# Contrat — la couture de domaine de la réception

**Cycle** : F3 · **Exigences** : FR-063 à FR-069 · **Patron** : `app/core/donnees/contrat.ts`,
quatre règles · **Constitution** : principes 2, 4, 5, 6

> ⚠️ **La couture est l'interface de domaine, jamais la requête HTTP.** Ce fichier décrit les
> opérations que `DonneesHebergement` gagne. En phase 3, une seconde implémentation — le client
> généré — prend la place de la simulation **opération par opération**, et **aucun écran ne s'en
> aperçoit**.

---

## 1. Les quatre règles, appliquées à ce cycle

| Règle du patron | Ce qu'elle donne ici |
|---|---|
| 1 · Toute opération est asynchrone et rend un `ResultatDomaine` | Les onze refus de disponibilité et d'état sont des **valeurs**, jamais des exceptions. Un refus s'affiche ; une exception finit en écran blanc |
| 2 · Toute écriture déclare **sa classe**, lue au registre | Douze écritures, dont **une seule de classe C** (la fiche client) et **trois de classe A** |
| 3 · Toute lecture est paramétrée par l'établissement actif | `PorteeLecture` partout. **Aucune signature ne suppose que l'établissement a de l'hébergement** — c'est « Résidence Test » qui le prouve |
| 4 · Aucune interface ne rend un type propre à la simulation | Les neuf types de `data-model.md` §2 sont **les types du modèle**, pas des vues d'écran |

---

## 2. Les lectures

```ts
export interface DonneesReception {
  /** Les occupations d'une période — la source du planning ET de la grille des chambres. */
  listerOccupations(
    portee: PorteeLecture,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly Occupation[]>>

  /** Ce qui est libre, à un instant, pour une formule donnée. */
  listerUnitesDisponibles(
    portee: PorteeLecture,
    formuleId: string,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly UniteDisponible[]>>

  /** Ce qui se libère, et quand — l'état « tout est pris » en dépend. */
  listerProchainesLiberations(
    portee: PorteeLecture,
    depuis: string,
    limite: number,
  ): Promise<ResultatDomaine<readonly Liberation[]>>

  lireSejour(sejourId: string): Promise<ResultatDomaine<SejourDetaille>>
  lireNote(sejourId: string): Promise<ResultatDomaine<NoteDetaillee>>

  /** Par nom, téléphone ou numéro de pièce. Lit DEUX domaines : client et personne. */
  rechercherClients(
    portee: PorteeLecture,
    critere: string,
  ): Promise<ResultatDomaine<readonly ClientTrouve[]>>

  lireHistoriqueSejours(clientId: string): Promise<ResultatDomaine<readonly SejourResume[]>>
}
```

⚠️ **`listerUnitesDisponibles` prend la formule, pas seulement la période.** Sans elle, elle ne peut
appliquer ni le temps de remise en état — qui varie **par catégorie et par formule** — ni les
contraintes de durée. Une signature sans formule donnerait des chambres « libres » que la création
refuserait ensuite : le pire refus, celui qu'on n'a pas vu venir.

⚠️ **`SejourDetaille`, `NoteDetaillee`, `ClientTrouve` sont des compositions du modèle, pas des vues
d'écran.** Elles assemblent des entités que la règle 4 impose de rendre telles quelles — un séjour
avec son occupation, sa formule et son unité. En phase 3, l'endpoint rendra la même composition ;
c'est ce qui rend le branchement mécanique.

---

## 3. Les écritures, et leur classe

```ts
export interface EcrituresReception {
  /** ⚠️ UN SEUL GESTE : occupation + séjour + note ouverte PUIS arrêtée + encaissement
   *  espèces + fiche de police à compléter. Classe B. */
  enregistrerPassage(demande: DemandePassage): Promise<ResultatDomaine<PassageEnregistre>>

  /** Défait les CINQ effets ci-dessus. Classe B. Bornée par la fenêtre d'annulation. */
  annulerPassage(occupationId: string): Promise<ResultatDomaine<void>>

  /** Le parcours long. Classe B. N'encaisse rien : le règlement est au départ. */
  enregistrerArrivee(demande: DemandeArrivee): Promise<ResultatDomaine<SejourDetaille>>

  /** Occupation de motif RESERVATION, bornée, relâchée automatiquement. Classe B. */
  garderChambre(demande: DemandeGarde): Promise<ResultatDomaine<Occupation>>

  porterLigne(noteSejourId: string, ligne: NouvelleLigne): Promise<ResultatDomaine<LigneSejour>>
  prolongerSejour(sejourId: string, nouvelleFin: string): Promise<ResultatDomaine<SejourDetaille>>
  changerUnite(sejourId: string, uniteCibleId: string): Promise<ResultatDomaine<SejourDetaille>>

  /** Fige la taxe, arrête la note, encaisse, libère la chambre. Classe B. */
  enregistrerDepart(demande: DemandeDepart): Promise<ResultatDomaine<DepartEnregistre>>

  /** Classe D — SIMULÉE. Trois issues, pilotées par le panneau de scénarios. */
  envoyerDocumentFiscal(documentId: string): Promise<ResultatDomaine<IssueEnvoi>>

  /** Classe C — refusée hors ligne pour un motif QUI N'EST PAS celui des classes B. */
  creerFicheClient(portee: PorteeLecture, fiche: NouvelleFiche): Promise<ResultatDomaine<Client>>

  /** Classe A — possible hors ligne, entre dans la file. */
  ajouterAccompagnant(sejourId: string, a: NouvelAccompagnant): Promise<ResultatDomaine<Accompagnant>>
  changerStatutMenage(uniteId: string, statut: StatutMenage): Promise<ResultatDomaine<Unite>>
  ecrireNoteInterne(clientId: string, texte: string): Promise<ResultatDomaine<void>>
}
```

⚠️ **Toute demande porte son `id` — un UUID v7 généré côté client** (`uuid.v7()`, jamais
`crypto.randomUUID()` qui rend un v4 non ordonnable). Le serveur dédupliquera, le rejeu rendra
`200`, **le serveur fera foi**. En phase 2, la simulation **déduplique déjà** : sans cela, le premier
rejeu réel découvrirait un comportement que rien n'avait exercé.

⚠️ **La garde hors-ligne vit ICI, dans la fonction d'appel, pas dans le composant.** C'est le point 6
du patron d'écriture front (`docs/module-dore.md`) : *« un second appelant oublierait de la reposer,
et la faute ne se verrait qu'en clientèle »*. Chaque écriture de classe B, C ou D commence par la
même garde, et rend `HORS_LIGNE` **sans avoir rien tenté**.

⚠️ **`navigator.onLine` ne suffit pas** — il dit qu'une interface réseau est active, pas que le
serveur répond. La garde évite l'attente inutile ; **elle ne remplace pas le traitement d'erreur**.

---

## 4. Ce que `enregistrerPassage` fait, dans l'ordre

L'ordre n'est pas indifférent : il décide de ce qui reste si une étape échoue.

```text
1. valider la formule contre la catégorie de l'unité      → FORMULE_HORS_CATEGORIE
2. calculer periode ET periodeIndisponibilite             → INTERVALLE_INVALIDE, DUREE_HORS_CONTRAINTE
3. vérifier le chevauchement sur periodeIndisponibilite   → UNITE_DEJA_OCCUPEE  ⚠️ AVANT toute écriture
4. créer l'occupation (ACTIVE)
5. créer le séjour (EN_COURS, clientId éventuellement nul)
6. ouvrir la note, y porter la ligne HEBERGEMENT au prix du palier
7. encaisser en espèces le total de la note
8. arrêter la note (ARRETEE)
9. émettre la fiche de police (complete: false), numéro pris au compteur
10. rendre PassageEnregistre { unite, finPrevue, montant, fenetreAnnulationSecondes: 8 }
```

⚠️ **L'étape 3 précède toute écriture, et elle porte sur `periodeIndisponibilite`.** Vérifier sur
`periode` laisserait passer une occupation qui mord sur le ménage de la précédente — la chambre
serait donnée, et le refus se découvrirait avec le client dans le couloir.

⚠️ **Aucune ligne de taxe de séjour n'est portée** : le passage n'y est pas assujetti. Le calcul est
appelé quand même et rend zéro nuitée assujettie — il ne se saute pas. *Sauter l'appel ferait
disparaître le cas de la couverture, et la première formule assujettie au passage arriverait sur du
code jamais exercé.*

---

## 5. Les trois issues de l'envoi fiscal

```ts
export type IssueEnvoi =
  | { readonly etat: 'CERTIFIEE'; readonly numeroOfficiel: string }
  | { readonly etat: 'ECHEC'; readonly motifCle: string; readonly detail: string }
  | { readonly etat: 'INDETERMINEE' }
```

| Issue | Ce que la couture garantit |
|---|---|
| `CERTIFIEE` | Le numéro officiel est rendu ; la mention « document non fiscal » disparaît de l'écran |
| `ECHEC` | **`motifCle` prime sur le code** — elle enseigne là où le code constate. `detail` est affiché **en second plan**, jamais comme phrase principale |
| `INDETERMINEE` | ⚠️ **Aucun renvoi automatique n'est possible depuis cette interface.** Il n'existe **pas** de méthode « réessayer » : l'absence est le contrat. *Un second envoi créerait une seconde facture réelle chez l'administration, et elle ne s'annule pas côté client* |

⚠️ **`envoyerDocumentFiscal` est de classe D et n'est pas atteignable hors ligne** — mais le départ
lui-même l'est encore moins : il est de classe B. **L'écran refuse donc au départ, pas à l'envoi**,
et c'est ce qui évite d'arrêter une note qu'on ne pourrait pas facturer.

---

## 6. Ce que la simulation doit reproduire, et pas seulement satisfaire

*« Une simulation doit savoir échouer aussi bien que réussir »* (cadrage §13.0 ter).

| Comportement | Pourquoi la simulation doit l'avoir |
|---|---|
| **Déduplication par UUID v7** | Sinon le premier rejeu réel découvre un comportement jamais exercé |
| **Refus de chevauchement** | C'est la contrainte GiST de demain. Un écran qui accepte aujourd'hui ce que la base refusera demain est un écran à refaire |
| **Compteur de fiche sans trou** | Un trou est une fiche dont personne ne sait si elle a existé |
| **Constat de taxe immuable** | Le privilège `SELECT, INSERT` de la base a un pendant : la simulation **refuse** l'écriture, elle ne l'ignore pas |
| **Total recalculé, jamais incrémenté** | Un cache incrémenté dérive en silence |
| **Latence réglable et échec réseau** | Leviers déjà posés au cycle F1 ; les nouvelles opérations les honorent **sans code propre** |

---

## 7. Ce que ce contrat ne dit pas

- **Aucun chemin HTTP, aucun verbe, aucun code de statut.** Ils viendront avec le contrat OpenAPI de
  la phase 3, et c'est le client généré qui les portera — jamais un `fetch` écrit à la main.
- **Aucune règle fiscale.** `taxe-sejour.ts` est l'**ancêtre front** du `JurisdictionAdapter` ; il
  sera **supprimé** au cycle qui livre l'adaptateur, jamais dupliqué.
- **Aucune opération de réservation.** `garderChambre` crée une occupation de motif `RESERVATION` et
  s'arrête là : ni arrhes, ni statuts, ni expiration paramétrable, ni politique d'annulation.
