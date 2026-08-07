# Contrat — porte **P-03** · les dépendances

**Cycle** : F1 · **Exigences** : FR-068, FR-071, FR-072 · **Constitution** : principe 13, porte nommée par le noyau, *« dès qu'un manifeste existe »*

> **C'est ce cycle qui crée le premier manifeste**, donc c'est lui qui crée la porte. Le cycle D1 avait consigné l'écart plutôt que de le taire : *« un `latest` glissé dans ce fichier ne serait vu par aucune porte d'ici au cycle qui créera le premier manifeste. »* **P-03 absorbe `compose.yml` avec le reste, et l'écart se referme ici.**

---

## 1. Périmètre inspecté *(point 1 du contrat de porte)*

| Fichier | Ce qui y est inspecté |
|---|---|
| `package.json` | `dependencies`, `devDependencies`, `engines.node`, `packageManager` |
| `pnpm-lock.yaml` | présence, et couverture de **chaque** dépendance déclarée |
| `.nvmrc` | égalité avec `engines.node` et avec `docs/versions-reference.md` §3.3 |
| `compose.yml` | **tags d'image** — la fin de l'écart du cycle D1 |
| `docs/versions-reference.md` | §2, §3.1, §3.2, §3.3, §4.2 — **dans les deux sens** |

**Hors périmètre, et déclaré comme tel** : `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`. Ils n'existent pas — la phase 3 les créera, et **la porte les prendra sans être modifiée** parce que son périmètre est « les manifestes présents », pas une liste.

---

## 2. Les cinq contrôles

### C1 · Aucune version en intervalle

Refuse dans toute valeur de version : `^` · `~` · `*` · `x` · `>` · `<` · `||` · `latest` · `next` · une plage vide.

**Accepte uniquement** une version exacte : `4.5.1`, `1.62.1`. *C'est la seule règle du document des versions qui ne connaît aucune exception (§1, règle 3) — c'est elle qui rend une reconstruction identique à six mois d'écart.*

**Sortie en cas d'échec** : le **paquet**, le **champ** et la **valeur fautive**. « Une version en intervalle existe » envoie chercher ; `@nuxtjs/i18n: "^10.6.0" dans dependencies` envoie à la ligne.

### C2 · Le lockfile est présent et couvre tout ce qui est déclaré

`pnpm-lock.yaml` doit exister, être commité, et **porter une entrée d'importation pour chaque dépendance déclarée**, à la version exacte du manifeste.

> **Limites assumées, et l'arbitrage qui les rend acceptables.** Le contrôle est une **comparaison de texte entre deux fichiers du dépôt** : il ne résout rien et **ne touche pas le réseau**. Il attrape le lockfile absent, le lockfile qui ignore une dépendance ajoutée, et le lockfile dont la version diverge du manifeste — les trois défaillances réelles. Il **n'attrape pas** une résolution transitive périmée alors que le sommet coïncide.
>
> C'est le même arbitrage que P-02 : *un contrôle qui exigerait le réseau serait désactivé le premier jour où Abengourou n'en a pas.* La résolution complète (`--frozen-lockfile`) est ce que le serveur d'intégration ajoutera **par-dessus**, en phase 3, sans modifier ce script.

### C3 · Aucun tag d'image flottant

Dans `compose.yml`, toute `image:` porte un tag **exact**. Refuse `latest` et l'absence de tag.

*Motif — la raison pour laquelle cette porte existe déjà à moitié dans le dépôt : `postgres:18.4`, `redis:8.8.1` et `dxflrs/garage:v2.3.0` sont épinglés à la main depuis le cycle D1, et rien ne le vérifiait.*

### C4 · L'environnement d'exécution coïncide

`.nvmrc` = `engines.node` du `package.json` = §3.3 de `docs/versions-reference.md` — **trois écritures, une seule valeur**. Idem pour `packageManager` et la version de pnpm.

### C5 · Le document et les manifestes disent la même chose — **dans les deux sens**

| Sens | Constat | Verdict |
|---|---|---|
| **manifeste → document** | une dépendance déclarée, absente des tableaux §3.x | **ROUGE** — l'inscription se fait *dans le changement qui ajoute*, jamais reportée |
| **document → manifeste** | une ligne des tableaux §3.x qu'aucun manifeste ne porte | **ROUGE** — le document est devenu une photo périmée |

**Le second sens est celui qui manque partout ailleurs**, et c'est celui qui a laissé « sept crates absentes du document pendant six semaines » (§4.3). Une comparaison à un seul sens autorise le document à mentir par omission.

> **Ce que C5 ne fait pas, et pourquoi** : il ne compare **aucune valeur à un registre distant**. §4.3 le motive — *« comparer les valeurs aux registres officiels ferait de la vérification une dépendance réseau »*. La justesse d'une version est établie **au moment de l'ajout**, par l'URL et la date en commentaire ; la porte vérifie la **cohérence**, pas la fraîcheur.

---

## 3. Complétude et non-vacuité *(points 2 et 4 du contrat de porte)*

**Complétude** : la porte déclare quels manifestes elle a trouvés et lesquels elle a ignorés faute d'existence. Un manifeste présent et non inspecté serait un trou silencieux.

**Non-vacuité — le plancher est DÉRIVÉ, pas constant** :

```
plancher = nombre de dépendances déclarées dans les manifestes présents
```

La porte échoue si ce nombre est **zéro**, et imprime toujours le nombre inspecté. *Un `package.json` vidé par accident ferait passer une porte à plancher constant bas ; il ne passe pas celle-ci.*

**Sortie type** :

```
── P-03 · aucune dépendance en intervalle, lockfile à jour, versions inscrites
   Périmètre : package.json · pnpm-lock.yaml · .nvmrc · compose.yml
               (Cargo.toml absent — phase 3)
   Plancher  : 27 dépendance(s) inspectée(s) — non vide
   ✓ aucune version en intervalle       27/27
   ✓ lockfile couvre                    27/27
   ✓ tags d'image exacts                 1/1
   ✓ environnement cohérent          3 écritures, 1 valeur
   ✓ document ↔ manifestes           27 ↔ 27, deux sens
   VERT
```

---

## 4. Le test négatif *(point 5 — sans lui, la porte est une décoration)*

```sh
scripts/verifier.sh --test-negatif p03
```

**Mutation** : dans une **copie de travail** de `package.json`, la version de `@nuxtjs/i18n` passe de `10.6.0` à `^10.6.0`.

**Exigences du test** — les trois comptent :

1. **P-03 doit rougir.** Si elle reste verte, sortie en code **4 — porte aveugle**, distinct du code 1.
2. **Elle doit NOMMER `@nuxtjs/i18n` et la valeur `^10.6.0`.** Un échec qui ne nomme pas son objet envoie chercher pendant vingt minutes.
3. **L'empreinte des fichiers du dépôt est relevée avant et après**, et doit être identique — *point 3 du contrat de porte : une porte ne modifie pas ce qu'elle inspecte.*

**Pourquoi ce paquet et pas un autre** : `@nuxtjs/i18n` est une dépendance **déjà inscrite** au §3.2 et **réellement installée**. La mutation rejoue donc l'erreur ordinaire — un `^` laissé par un outil ou par une habitude — sur un objet réel, pas sur un paquet de laboratoire.
