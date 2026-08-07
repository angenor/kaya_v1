# Contrat — L'interface de domaine de `R0`

*La **couture**, au sens de `app/core/donnees/`. Ce que l'écran appelle aujourd'hui contre une
simulation, et qu'il appellera demain contre le serveur **sans changer une ligne**.*

> **La couture est l'interface de domaine, jamais la requête HTTP.** C'est ce qui rend le branchement
> de la phase 3 mécanique — et c'est pourquoi la signature ci-dessous porte un mot de passe que ce
> cycle **n'emploie pas**.

---

## 1. L'interface

```ts
export interface DomaineComptes {
  /** Ce que R0 appelle. Le mot de passe est REÇU et IGNORÉ — voir §3. */
  identifier(
    identifiantSaisi: string,
    motDePasse: string,
  ): Promise<ResultatDomaine<Session>>

  /** Les établissements où CE compte a des droits. Rien d'autre n'est proposé. */
  etablissementsDe(compteId: string): Promise<ResultatDomaine<readonly Etablissement[]>>

  /** Le poste, SI ET SEULEMENT SI il est unique. `null` sinon — jamais « plusieurs ». */
  posteUniqueSur(compteId: string, etablissementId: string): Promise<ResultatDomaine<string | null>>
}
```

> ⚠️ **L'union des permissions ne reçoit PAS de méthode nouvelle.**
> `resoudrePermissions(compteId, etablissementId)` **existe déjà** à
> `app/core/donnees/comptes/interface.ts`, livrée par F1, et fait exactement cela. En déclarer une
> seconde sous un autre nom — `permissionsSur` — mettrait **deux méthodes pour une chose** dans une
> même interface : le défaut que le §3.4 de `versions-reference.md` interdit entre dépendances,
> appliqué au code. **FR-027 s'appuie sur la méthode existante.**

`ResultatDomaine<T>` est celui de `app/core/donnees/contrat.ts`, posé par F1 : `reussite(valeur)` ou
`echec(code)`. **Inchangé.**

---

## 2. Les codes d'échec, et les phrases qu'ils branchent

| Code | Cas qui le produisent | Clé i18n → phrase |
|---|---|---|
| `IDENTIFIANTS_INVALIDES` | identifiant inconnu · mot de passe faux · compte `SUSPENDU` · compte `REVOQUE` | « **Identifiant ou mot de passe incorrect** » |
| `IDENTIFIANT_ABSENT` | champ identifiant vide | « **Indiquez un numéro de téléphone ou une adresse e-mail.** » |
| `HORS_LIGNE` | levier hors ligne du panneau Scénarios | annoncé **avant** la saisie |
| `ECHEC_RESEAU` | levier d'échec | phrase générique de `S3` |

> **Quatre cas, un seul code — c'est la propriété, pas une simplification.** Les distinguer
> publierait la liste des comptes existants. `CPT-01` va plus loin : *« le message identique ne suffit
> pas »*, d'où le §4.

**L'interface branche sa clé i18n sur le `code`, jamais sur un `message`** — qui nommerait des tables
et parlerait anglais technique.

---

## 3. Le mot de passe reçu et ignoré

```ts
async identifier(identifiantSaisi: string, motDePasse: string) {
  // ⚠️ `motDePasse` EST REÇU ET N'EST PAS EMPLOYÉ, ET C'EST DÉLIBÉRÉ.
  // Aucun secret n'est servi au navigateur (CPT-01, cadrage §12.1) et il n'y a
  // pas de serveur en phase 2 : il n'y a RIEN à comparer. Le retirer de la
  // signature ferait de la phase 3 une RUPTURE D'INTERFACE — R0 devrait changer
  // le jour où l'authentification arrive. Le garder rend le branchement
  // mécanique. Il n'est ni stocké, ni journalisé, ni comparé.
}
```

**Règle de simulation** : n'importe quel mot de passe **non vide** entre, dès lors que l'identifiant
correspond à un compte `ACTIF` du jeu. Un mot de passe vide **ne fait pas** un cas distinct : il
rend `IDENTIFIANTS_INVALIDES`, comme le reste.

---

## 4. Le délai indiscernable

`CPT-01` : *« un refus en 2 ms sur compte inexistant contre 90 ms sur mot de passe faux publie la
liste des comptes »*.

**Mécanique** — l'ordre est celui de `lireSimule`, qui l'a déjà posé :

```
1. hors ligne ?          → echec, avant toute tentative
2. échec réseau ?        → echec
3. ATTENDRE la latence   ← les DEUX chemins passent ici
4. décider du verdict    ← après l'attente, jamais avant
```

**Le verdict est calculé après l'attente.** Il n'y a donc pas deux chemins à égaliser : il n'y en a
qu'un, qui se termine différemment.

**Ce que le test mesure** : médiane de vingt tentatives par chemin, écart **< 10 %** (SC-005). Test
d'**unité**, pas de navigateur — le bruit d'un moteur réel dépasserait l'écart cherché. L'attente est
**déterministe** : c'est le levier de latence, pas une horloge.

---

## 5. La normalisation de l'identifiant

`app/core/identifiant/normaliser.ts` — **une seule fonction**, avant tout appel au domaine.

```ts
type IdentifiantNormalise =
  | { forme: 'EMAIL'; valeur: string }
  | { forme: 'TELEPHONE'; valeur: string }   // E.164, ex. +2250708091011
  | { forme: 'ABSENT' }
```

| Règle | Motif |
|---|---|
| **Un `@` ⇒ e-mail**, sans autre examen | Cas limite de la spec : `0708091011@…` ressemble aux deux ; la forme e-mail l'emporte |
| Sinon, analyse comme téléphone avec **l'indicatif par défaut de l'établissement** | `indicatif_telephonique_defaut`, `+225` — **lu de la configuration, jamais en dur** |
| Vide ou blanc ⇒ `ABSENT` | Rend `IDENTIFIANT_ABSENT`, pas `IDENTIFIANTS_INVALIDES` |

**Outil** : `libphonenumber-js/min` **1.13.10**. Motif de l'ajout et écartés : `research.md` §1.1.

**`TYPES_IDENTIFIANT`** (`'TELEPHONE' | 'EMAIL' | 'CODE'`) est lu ici. Il était déclaré **« dû ·
cycle CPT »** au registre des points d'entrée ; ce cycle le **branche**. `'CODE'` reste **dû** — il
n'est employé par aucun compte du jeu.

---

## 6. La persistance annoncée

**Avant tout affichage de champ**, `R0` interroge `PlatformAdapter` sur `STOCKAGE_DURABLE` —
**`reservee` sur les deux moteurs web**, donc conditionnelle, ni présente ni absente.

| Verdict | Phrase, avant toute saisie |
|---|---|
| accordé | « **Vous resterez connectée sur cet appareil.** » |
| refusé ou indisponible | « **Cet appareil peut vous redemander votre identifiant.** » + ce qui reste possible |

**Appelé une fois**, au premier affichage ; le verdict est mémorisé pour la durée de la session.
`navigator.storage.persist()` est asynchrone et peut ouvrir une invite du navigateur — le rappeler à
chaque rendu ferait clignoter l'annonce.

> **Ce que cela ferme** : découvrir une déconnexion une heure plus tard, devant un écran qu'on n'a pas
> demandé.

---

## 7. Ce que ce contrat n'expose pas

- **Aucun jeton** — ni accès, ni rafraîchissement, ni révocation. Phase 3.
- **Aucune limitation de débit** — les paramètres de `CPT-01` (fenêtre glissante 300 s, 10 tentatives
  par identifiant, 60 par origine) sont **serveur**. Un compteur côté client ne protégerait rien.
- **Aucune liste d'appareils connectés** — sans serveur, il n'y a pas d'appareil à lister.
- **Aucune création ni récupération de compte** — `CPT-01` ne les demande pas au MVP ; un exploitant
  reçoit son accès de son gérant.
- **`OTP_SMS`** — au référentiel, **non servi**. Si un compte le portait : « **Ce compte se connecte
  autrement.** » Aucun compte du jeu ne le porte.

---

## 8. Ce que la phase 3 remplacera

| Aujourd'hui | Demain |
|---|---|
| `simulationComptes.identifier` | `POST /api/v1/session` — le serveur fait foi |
| Le mot de passe ignoré | Argon2 côté serveur, **plus un hachage factice sur le chemin « compte inconnu »** |
| Le délai de scénario | Le délai réel, dont le test compare les **médianes** |
| `resoudrePermissions` en mémoire | `role_permission` lue en base, sous RLS |

**L'écran `R0` ne change pas.** C'est la mesure de la réussite de cette couture.
