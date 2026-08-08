# Notes — comptes de test

*Phase 2 : tout est simulé. Le mot de passe est **reçu et ignoré** — n'importe quelle valeur non
vide entre. Un champ vide, lui, rend « Indiquez un numéro de téléphone ou une adresse e-mail. »*

| Identifiant à taper | Qui | Ce qu'on voit |
|---|---|---|
| `0700000001` | Adjoua, Deloria | l'accueil générique — départ chambre 204, cinq activités |
| `0700000003` | Aminata, Deloria | l'accueil serveuse — ses tables, aucun chiffre d'hôtel |
| `0700000002` | Yao | réceptionniste à Deloria **et** gérant du maquis — la bascule en deux taps |
| `0700000004` | M. Koffi | propriétaire, trois sites, lecture seule |
| `admin@kaya.ci` | administrateur éditeur | l'accueil « aucun établissement ne vous est rattaché » |
| `0700000005` | Mariam, compte **suspendu** | refusé — avec *exactement* la même phrase qu'un compte inconnu |

Le numéro se tape **sans indicatif** : `+225` est ajouté par la normalisation
(`app/core/identifiant/normaliser.ts`). Un `@` fait basculer en e-mail avant tout examen de numéro.

## Lancer

```sh
pnpm dev
```

⚠️ Le port 3000 est souvent pris par un autre projet Nuxt sur ce poste — Nuxt bascule alors sur
3001. Lire l'URL qu'il imprime.

## Changer de contexte sans repasser par la connexion

**`/_scenarios`** — le panneau pose le compte et l'établissement, et porte les quatre leviers :
latence, échec réseau, hors connexion, jeu vide. C'est par là que les quatre accueils s'atteignent
sans recompiler.

Le parcours complet, pas à pas : [specs/004-entree-accueil/quickstart.md](specs/004-entree-accueil/quickstart.md) §2.
