# Kaya — Taxonomie du registre des actions

*Source de vérité des types d'action tracés au journal d'audit (`comptes.journal_audit`).
Story **CPT-04**.*

**Douze familles, toutes DUES.** Chacune passe à « branchée » dans le changement qui l'écrit.

> **Le registre des actions a un écran (`G4`) dès la phase 2, et pas encore d'écriture réelle** :
> il se peuple depuis les données simulées. C'est une raison de plus de garder la taxonomie fermée
> dès maintenant — le filtre de l'écran n'a de valeur que si son vocabulaire est arrêté.

---

## À quoi sert ce document

CPT-04 énumère les familles d'actions à tracer. **La plupart n'auront aucun chemin d'écriture
pendant longtemps** : la remise n'existe pas avant le cycle des ventes, l'avoir avant celui de la
fiscalité, le tiroir-caisse avant l'impression. Les inscrire quand même a une raison précise :

> Une liste de choses à faire qui vit dans une spécification se perd. Une liste qui vit dans un
> **harnais de test** ne se perd pas — elle fait échouer le build le jour où quelqu'un branche un
> type sans le déclarer.

Le harnais lit **ce fichier** et le compare au code.

**Terme utilisateur : « Registre des actions »** (`docs/design/lexique.md`). « Journal d'audit » est
le nom technique — table, permission, endpoint — et n'apparaît jamais à l'écran.

---

## Les deux états, et ce qu'ils engagent

| État | Ce qu'il signifie | Ce que le harnais vérifie |
|---|---|---|
| **branché** | Un chemin de code écrit une entrée de ce type | Le chemin **existe** |
| **dû** | La story qui l'apportera est nommée, aucun chemin n'existe | Le chemin **n'existe pas** |

**Les deux sens comptent.** Un type déclaré `dû` qui acquiert un chemin d'écriture fait échouer le
build : c'est ce qui oblige à revenir ici. Un type déclaré `branché` sans chemin fait échouer le
build aussi : sans quoi il suffirait de tout déclarer branché pour rendre le harnais muet.

---

## Les douze familles

| # | Code | Ce que ça trace | État | Story qui la doit |
|---|---|---|---|---|
| 1 | `remise` | Une remise accordée sur une ligne ou une note | **dû** | PDV-03 |
| 2 | `annulation_ligne_envoyee` | L'annulation d'une ligne **déjà partie en cuisine ou au bar** | **dû** | PDV-03 |
| 3 | `avoir` | L'émission d'un avoir sur une facture certifiée | **dû** | FIS-06 |
| 4 | `ouverture_tiroir` | Une ouverture de tiroir-caisse hors encaissement | **dû** | IMP-01 |
| 5 | `modification_tarif` | Le changement du prix d'un article vendable | **dû** | PDV-01 |
| 6 | `suppression` | La mise hors service de ce qui ne se supprime jamais | **dû** | CPT-01 |
| 7 | `changement_role` | Une attribution ou un retrait de rôle | **dû** | CPT-02 |
| 8 | `ecart_caisse` | Un écart constaté au comptage de fin de shift | **dû** | CAI-04 |
| 9 | `rebascule_palier_passage` | Le passage automatique au palier tarifaire supérieur | **dû** | HEB-04 |
| 10 | `forcage_disponibilite` | L'attribution d'une unité que le système déclarait indisponible | **dû** | HEB-06 |
| 11 | `derive_horloge_constatee` | L'heure d'un terminal s'écarte de celle du serveur au-delà du seuil | **dû** | SYN-04 |
| 12 | `consultation_piece_identite` | ★ La **consultation** d'un numéro de pièce d'identité | **dû** | SEJ-01 |

**Les douze sont dues.** Chacune passe à `branché` **dans le changement qui l'écrit**, jamais
avant — c'est ce que le harnais impose, et c'est ce qui oblige à revenir ici.

### Quatre règles d'écriture, valables pour toutes les familles

**1. L'entrée s'écrit dans la MÊME TRANSACTION que l'état qu'elle trace.** Une annulation tracée
après coup peut manquer, et le seul moment où l'on sait qu'elle a eu lieu est celui où on l'écrit.

**2. Une famille se branche là où le premier chemin d'écriture apparaît, pas là où on l'attendait.**
`suppression` sera annoncée pour la désactivation de compte, et c'est probablement la **révocation
de session** qui la branchera la première — les deux sont des mises hors service. Le harnais
signale l'écart au moment exact où le chemin apparaît ; c'est son travail, et c'est ce qui vaut de
l'écrire vert à vide.

**3. Ne tracer que ce qui change ce que le propriétaire vient chercher.** `modification_tarif`
s'écrit **uniquement si le prix change** : tracer un changement de nom noierait le signal, et un
registre illisible n'est plus lu. Le contexte porte les deux montants — avant et après — avec leur
devise au même niveau.

**4. Interroger le harnais souvent, pas seulement en fin de cycle.** Un chemin d'écriture apparaît
au milieu d'une tâche ; si le test complet n'est relancé qu'au recollement, il reste **rouge dans
l'arbre** entre les deux sans que rien ne le montre. Lancer la suite complète avant chaque commit
de fin de phase est le remède — **ce n'est pas une porte de plus qu'il faut, c'est la fréquence à
laquelle on interroge celle qui existe.**

⚠️ **Le pourcentage figure au contexte de la remise, et c'est là qu'il sert.** Il ne fait autorité
nulle part — le montant est figé à l'octroi —, mais « 10 % » apprend une politique commerciale à
M. Koffi quand « 2 000 F » ne lui apprend rien. C'est le même régime qu'`horodatage_client` : la
valeur existe, elle est écrite, elle n'entre dans aucun calcul.

**`rebascule_palier_passage` mérite sa mention** : le dépassement constaté au départ fait changer
de palier, la différence est ajoutée à la note, et l'entrée porte la durée constatée et les **deux
paliers** — celui qui avait été vendu et celui qui s'applique. Le passage est aujourd'hui
massivement encaissé en espèces sans trace : c'est précisément cette famille qui donne au
propriétaire la visibilité que le cadrage §5.6 lui promet, et c'est aussi la raison pour laquelle
elle rencontrera de la résistance.

### ★ `consultation_piece_identite` — la première famille qui trace une LECTURE

**Elle naît « branchée », avec son chemin de code**, dans le cycle qui la crée. Une famille
déclarée « branchée » sans chemin de code ferait échouer le harnais ; une famille branchée non
déclarée l'échouerait aussi. Les deux sens sont vérifiés par `backend/tests/audit_taxonomie.rs`.

| | |
|---|---|
| Ce qui la déclenche | Toute lecture d'une fiche client dont le numéro de pièce est **déchiffré** — `client_lire`, et le rattachement à une fiche de police |
| Où | `backend/crates/socle/comptes/src/client/service.rs` |
| Cible | `personne` — la personne **consultée**, jamais l'auteur |
| Contexte écrit | `{ motif }` — **aucune clé monétaire**, et surtout **jamais la valeur lue** |
| Ce qu'elle ne fait **jamais** | Refuser la lecture. Le journal surveille, il n'autorise pas — l'autorisation est `sej.client.lire` |

> ⚠️ **Le contexte ne porte JAMAIS le numéro consulté.** Recopier le numéro dans un registre
> **immuable et à rétention illimitée** créerait exactement la fuite que ce journal existe
> pour surveiller, et rendrait inapplicable la rétention de 90 jours de TRX-06 sur la copie : la
> donnée serait purgée d'un côté et conservée pour toujours de l'autre.

> **Pourquoi une famille nouvelle plutôt qu'une existante.** Aucune des onze ne couvre une
> consultation : `suppression` trace une mise hors service, `changement_role` une attribution —
> **toutes tracent un geste qui modifie**. Une lecture n'en est pas un, et la ranger sous une
> famille existante rendrait le registre illisible au propriétaire, qui est son public.

### `forcage_disponibilite` — reste « due », et le dire vaut mieux que la laisser ambiguë

La famille n° 10 décrit *« l'attribution d'une unité que le système déclarait indisponible »*.
**Le cycle des séjours ne livrera aucun forçage** : un changement d'unité vers une chambre occupée
est **refusé**, avec le conflit nommé, et la prolongation qui bute sur une occupation suivante
l'est aussi. La ligne reste donc « due » alors même que ce cycle touche l'attribution d'unités de
bout en bout — le dire évite de croire à un oubli.

### `derive_horloge_constatee` — la première famille qui ne trace aucun geste

Les dix premières familles tracent ce qu'**une personne a fait**. La onzième trace ce qu'un
**appareil est** : son horloge s'écarte de celle du serveur. Elle a sa place ici et non au grand
livre parce que son public est le même que celui des dix autres — Adjoua et M. Koffi, qui doivent
pouvoir constater après coup quel terminal déviait pendant le service, et non une projection.

| Ce qui la déclenche | Écart **absolu** entre `horodatage_client` et l'horodatage d'autorité supérieur à `sync.derive_horloge_seuil_secondes` (défaut 300) |
|---|---|
| Contexte écrit | `{ ecart_secondes, seuil_secondes, sens }` — **aucune clé monétaire**, ce qu'une porte doit vérifier jusque dans le JSONB |
| Ce qu'elle ne fait **jamais** | Refuser l'écriture. La dérive est signalée, pas opposée (FR-036) |
| Fréquence | **Une entrée par épisode, pas une par écriture.** Deux cents saisies pendant un service produiraient deux cents entrées identiques et le registre deviendrait illisible, donc inutilisé. Le débrayage passe par une clé Redis à durée de vie portant `(tenant, compte, appareil)` — **éphémère reconstructible** au sens du principe II : la perdre produit une entrée de plus, jamais une donnée manquante |

**Le mot « dérive » n'atteint jamais l'écran.** L'utilisateur lit « L'heure de cet appareil retarde
de {n} minutes », ou « avance », suivi de la phrase qui le rassure sur ce qui va bien —
`docs/design/lexique.md` fait foi, et les **deux sens** sont dus puisque la détection porte sur la
valeur absolue.

### Ce que `suppression` recouvre — et pourquoi le mot est faux mais gardé

**Rien ne se supprime jamais dans Kaya** (FR-014, principe VI). Un compte se désactive, un service
se retire, une ligne s'annule par une contre-ligne. Le type garde pourtant le nom `suppression`
parce que c'est **le geste que l'utilisateur croit faire**, et que le registre est lu par un
propriétaire qui cherche « qui a supprimé ça ». Le lexique traduit ; la taxonomie nomme l'intention.

`suppression` trace **trois gestes** dès le cycle des comptes, tous des mises hors service :

| Geste | Cible |
|---|---|
| Révoquer une session — « Déconnecter cet appareil » | `session` |
| Révoquer une famille de jetons sur **réutilisation détectée** | `session` |
| Désactiver un compte | `compte` |

`cible_type` les distingue — `session` ou `compte` —, ce qui permet au filtre de `G4` de les
séparer sans multiplier les familles. **Une famille par geste ferait une taxonomie de trente
entrées dont personne ne connaîtrait la moitié**, et le filtre d'un registre ne vaut que si son
vocabulaire tient dans une liste déroulante.

Les cycles suivants y logeront le retrait d'un article du catalogue et la mise hors service d'une
unité.

---

## Ce que la taxonomie n'est pas

**Ce n'est pas la liste des événements outbox.** Les deux registres sont distincts :

| | Journal d'audit | Grand livre (outbox) |
|---|---|---|
| Public | Le **propriétaire**, dans l'interface | Les **projections**, en interne |
| Contenu | Ce qu'une personne a fait | Une transition d'état |
| Classe | **A** — l'entrée s'écrit hors ligne avec l'action qu'elle trace | Celle de l'opération tracée |
| Granularité | **Douze familles**, stables sur la vie du produit | **Un type par transition d'état** — plusieurs dizaines |

Une attribution de rôle produit **les deux** : l'événement `role.attribue` et l'entrée d'audit
`changement_role`, dans la même transaction. Ce n'est pas une redondance — l'un alimente les
projections, l'autre est un produit que M. Koffi achète.

**Ce n'est pas non plus la liste des actions journalisées techniquement.** Une connexion, un
rafraîchissement de session et un échec d'authentification vont aux **journaux applicatifs**, jamais
ici. Le registre est permanent et à rétention illimitée : y écrire les connexions y
écrirait la liste horodatée des présences du personnel.

---

## Ajouter une famille

Une **treizième** famille se justifie par une story, pas par une intuition. Le cas normal est
l'inverse : faire passer une famille de `dû` à `branché`, dans le **même changement** que le code
qui l'écrit.

1. Le type est ajouté à l'**énumération fermée** des types d'action — jamais un `String` : un
   `String` laisserait un cycle inventer `remise_appliquee` à côté de `remise`, et le filtre de
   l'écran `G4` cesserait de trouver la moitié des entrées sans que rien n'échoue.
2. Sa ligne passe à **branché** ici.
3. Le test de taxonomie constate l'accord.

## Voir aussi

- `docs/registre-classes-offline.md` — `journal_audit` en classe **A**
- `docs/design/lexique.md` — « Registre des actions », et les mots qui n'atteignent jamais l'écran
