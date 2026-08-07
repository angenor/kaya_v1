# Contrat — les deux sagas inter-modules, et pourquoi leur cas orphelin est le chemin nominal

*Opposable à la phase 3. Ce document existe pour une raison précise : **le commentaire de colonne, seul, ne suffit pas**. Il dit qu'il n'y a pas de clé étrangère ; il ne dit pas ce que le service doit faire quand la cible est close. C'est ici.*

---

## 1 · Les deux, en une ligne chacune

| Saga | Colonne porteuse | Sens | Story |
|---|---|---|---|
| **Report d'une consommation sur la note d'un séjour** | `hebergement.ligne_sejour.ligne_commande_id` | `ventes` → `hebergement` | PDV-02, SEJ-03 |
| **Bon de dépôt d'un client logé** | `pressing.bon_depot.sejour_id` | `pressing` → `hebergement` | PDV-06 |

Les deux colonnes sont **nues** — aucun `REFERENCES` —, **nullables**, et portent un commentaire qui renvoie ici.

**Une troisième colonne suit le même régime sans être une saga** : `hebergement.ligne_sejour.bon_depot_id`, le report d'un bon de pressing sur la note. Elle est la trace, côté note, de la seconde saga.

---

## 2 · Pourquoi aucune clé étrangère — deux raisons, et la seconde est la vraie

**La raison d'architecture** : la constitution (principe 2) interdit qu'une transaction couvre deux modules ; les opérations inter-modules sont des **sagas simples avec compensation explicite**, et aucune requête ne joint deux schémas de modules. C'est vrai, et ce n'est pas la raison qui compte.

**La raison de produit** : une clé étrangère **ferait échouer en base l'écriture que le produit doit accepter**.

Le scénario, tel qu'il se produit à Abengourou :

1. Aminata prend une commande au bar, **hors réseau**. La commande est de classe A : elle fonctionne intégralement hors ligne.
2. Le client règle sa note à la réception et part. La note est **arrêtée**, le document fiscal est **certifié**.
3. Le terminal d'Aminata retrouve le réseau et vide sa file. La consommation arrive **sur une note qui n'existe plus comme cible ouverte**.

**Avec une clé étrangère, l'insertion échouerait** — ou pire, réussirait en rattachant une charge à une note close et facturée, ce que l'avoir FNE par quantité rend très coûteux à défaire. **Sans elle, l'écriture est acceptée, constatée, et part en réconciliation.**

> **C'est le conflit le plus fréquent du produit** (registre §12, cas piège 2), et l'écran qui le traite est le premier à tester.

---

## 3 · La compensation — une seule file, au socle

**La compensation est l'écriture d'une ligne dans `synchronisation.reconciliation_orpheline`**, créée au cycle D1, en `SELECT, INSERT` seuls.

| Champ de la ligne de réconciliation | Ce qu'il porte, pour la saga « report sur la note » |
|---|---|
| `origine_type`, `origine_id` | `LIGNE_COMMANDE` et son identifiant |
| `cible_type`, `cible_id` | `NOTE_SEJOUR` et son identifiant |
| `constat` (`JSONB`) | Ce que l'écriture voulait faire : montant, quantité, libellé, horodatage d'autorité, état de la note au moment du constat |
| `etat` | Créé — **la résolution est de classe B et n'est pas implémentée au MVP, et le privilège absent est ce qui le prouve** |

**Aucune table de réconciliation nouvelle n'est créée par ce cycle.** Il n'y en a qu'une, elle est au socle, et les deux sagas y renvoient. Deux files seraient deux écrans, deux traitements, et un jour une file que plus personne ne relève.

**Trois interdits, écrits une fois pour les deux sagas** (cadrage §11.4) :

- **Jamais de rejet silencieux.** Une consommation qui disparaît est une perte sèche pour l'exploitant, et il ne la découvre pas.
- **Jamais d'ajout d'office sur une note close.** Elle est facturée ; y ajouter une ligne after coup désaccorde la note et le document fiscal.
- **Jamais de rejeu automatique.** La résolution est **humaine**, comme pour l'état `INDETERMINEE` de la file FNE.

---

## 4 · Ce que la phase 3 doit implémenter, saga par saga

### 4.1 · Report d'une consommation sur la note d'un séjour

| Étape | Module | Ce qui se passe |
|---|---|---|
| 1 | `ventes` | La commande porte `cible_type = 'SEJOUR'` et `cible_id`. **`ventes` ne nomme jamais « séjour » ailleurs** — c'est une valeur opaque, résolue par un trait exposé |
| 2 | `ventes` | Transaction : la commande est fermée, un **événement outbox** est écrit dans la même transaction |
| 3 | `hebergement` | Le consommateur de l'événement tente d'écrire une `ligne_sejour` portant `ligne_commande_id` |
| 4a | `hebergement` | **La note est ouverte** → la ligne est écrite. Fin. |
| 4b | `hebergement` | **La note est arrêtée** → une ligne de réconciliation est écrite. **C'est le chemin nominal, pas l'exception.** |

**L'idempotence est portée par `uq_ligne_sejour_ligne_commande`**, index **UNIQUE** partiel sur la colonne non nulle. Le consommateur **insère et traite le conflit `23505`** — il ne lit **jamais** avant d'écrire, exactement comme pour la contrainte d'exclusion de `occupation` ([disponibilite.md](./disponibilite.md) §2). Lire puis insérer laisse entre les deux un intervalle de temps pendant lequel un second consommateur peut écrire, et deux lignes apparaissent sur la note.

> **Un index ordinaire ne suffirait pas, et la nuance décide d'une double facturation.** Il *retrouverait* le doublon ; il ne le **refuserait** pas. La forme est celle que le socle a déjà posée : *« l'idempotence est portée par une contrainte, pas par du code »* (`uq_evenement_metrique_id`, cycle D1). **C'est la même mécanique que le rejeu de la file hors-ligne** — une seule mécanique, pas deux.

**La classe de la `ligne_sejour` issue d'une consommation est celle de la ligne d'origine** (registre §7.3), pas B. Une consommation saisie hors ligne en classe A reste une écriture de classe A une fois reportée : c'est ce qui rend le report possible depuis un terminal déconnecté.

### 4.2 · Bon de dépôt d'un client logé

| Étape | Module | Ce qui se passe |
|---|---|---|
| 1 | `pressing` | Le bon est créé avec `sejour_id` renseigné — le client s'est déclaré logé |
| 2 | `pressing` | Au retrait, si `moment_reglement` vaut « au retrait », la charge doit être portée sur la note |
| 3 | `hebergement` | Le consommateur tente d'écrire une `ligne_sejour` portant `bon_depot_id` — idempotence par **`uq_ligne_sejour_bon_depot`**, même forme que ci-dessus |
| 4a/4b | `hebergement` | Même bifurcation, même compensation |

> **Le sens de la dépendance de crate, écrit pour qu'il ne soit pas redécouvert.** `hebergement` et `pressing` sont **deux verticales**, et la hiérarchie de la constitution (principe 2) interdit qu'une verticale dépende d'une autre. Le consommateur ne dépend donc **pas** du crate `pressing` : il consomme un **événement outbox dont la charge utile est financièrement complète et dénormalisée** — montant, quantité, libellé, référence — et dont le type est déclaré au **socle**. C'est la règle du grand livre permanent (cadrage §14.7), et c'est elle qui rend ce rattachement possible sans dépendance de compilation. **Un test structurel doit échouer si `verticales/hebergement` déclare `verticales/pressing` dans son manifeste**, et réciproquement.

**Le cas orphelin est ici plus fréquent qu'ailleurs**, et c'est structurel : un bon de pressing a un **délai** — dépôt, traitement, retrait. Le client peut partir entre le dépôt et le retrait. **Un bon dont le séjour est clos est un cas courant, pas une anomalie**, et le modèle doit le porter sans rien perdre : le bon existe, la pièce existe, le montant existe, et c'est la réconciliation qui décide qui paie.

**`moment_reglement` est figé à la création du bon.** Changer le paramètre du point de vente ne déplace pas l'exigibilité d'un bon déjà pris — sans quoi un bon déposé « payable au retrait » deviendrait « payable d'avance » sans que personne ne l'ait décidé pour lui.

---

## 5 · Ce que la porte P-05 vérifie, et ce qu'elle ne vérifie pas

**P-05 vérifie** qu'aucune contrainte de clé étrangère ne joint deux schémas. C'est mécanique, c'est complet, et cela ferme définitivement le mode de défaillance décrit ci-dessous.

**Le mode de défaillance qu'elle ferme** : un cycle de phase 3 relit `97-hebergement.sql`, voit `ligne_commande_id UUID` sans `REFERENCES`, **prend l'absence pour un oubli** et l'ajoute — de bonne foi, en croyant réparer. La migration s'applique, tous les tests passent, et le défaut ne se voit qu'à la première coupure réseau en exploitation.

**P-05 ne vérifie pas** que la compensation soit **écrite** — qu'un service traite réellement le cas orphelin plutôt que d'avaler l'erreur. Cela demande un test d'intégration, et le registre §11 le nomme : **« toute entité rattachée à un séjour : test du scénario orphelin (SYN-03) »**. Ce test appartient au cycle de phase 3 qui livre le report ; il est nommé ici pour qu'il ne soit pas redécouvert.
