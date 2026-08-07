/**
 * CATALOGUE FRANÇAIS — la langue par défaut.
 *
 * ⚠️ LE LEXIQUE PRIME SUR CE FICHIER. `docs/design/lexique.md` fait foi sur tout
 * mot visible par l'utilisateur ; un écart se corrige ICI, jamais là-bas. Le
 * lexique documente d'ailleurs que ce fichier avait déjà dérivé une fois, sur
 * les trois libellés du témoin de synchronisation.
 *
 * ⚠️ LES TROIS NOMS D'ÉTAT INTERNES — « connecté », « dégradé », « hors ligne » —
 * N'APPARAISSENT DANS AUCUN CATALOGUE. Ce sont des noms de mécanique. Ce que
 * l'utilisateur lit dit si SON TRAVAIL est en sécurité : « Enregistré »,
 * « En attente d'envoi (n) », « Connexion faible », « Hors connexion ».
 * SC-022 le vérifie par un test.
 *
 * ⚠️ PARITÉ STRICTE AVEC `en.ts`, DANS LES DEUX SENS, DÈS LA PREMIÈRE CLÉ.
 */
export default {
  application: {
    nom: 'Kaya',
  },

  // ── Les réglages de la coquille ────────────────────────────────────────────
  // Ils appartiennent à l'APPAREIL, pas à l'établissement : c'est pourquoi ils
  // vivent dans la barre d'en-tête et non dans la configuration.
  theme: {
    etiquette: 'Thème',
    clair: 'Clair',
    sombre: 'Sombre',
    systeme: "Comme l'appareil",
  },
  langue: {
    etiquette: 'Langue',
    fr: 'Français',
    en: 'English',
  },

  // ── Le témoin de synchronisation · composant 10 ────────────────────────────
  // Libellés repris MOT POUR MOT du lexique, qui fait foi.
  temoin: {
    enregistre: 'Enregistré',
    enAttenteEnvoi: "En attente d'envoi ({n})",
    connexionFaible: 'Connexion faible',
    horsConnexion: 'Hors connexion',
  },

  // ── Les instruments de développement ───────────────────────────────────────
  // Ce ne sont pas des écrans du produit : ils ne portent pas de code de
  // préfixe et n'entrent pas au décompte des 46.
  ecrans: {
    titre: 'Écrans',
  },
  guideDeStyle: {
    titre: 'Guide de style',
  },
  scenarios: {
    titre: 'Scénarios',
  },
} as const
