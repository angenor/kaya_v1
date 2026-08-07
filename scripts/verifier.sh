#!/usr/bin/env bash
# =============================================================================
# verifier.sh — la commande unique du dépôt
#
# Une seule commande, documentée au README, qui enchaîne tout ce qui doit passer
# et SORT EN ÉCHEC AU PREMIER CONTRÔLE ROUGE. Pas dix scripts qu'on lance de
# mémoire, dont on oublie le troisième.
#
# Le cycle D1 la crée avec deux portes : P-01 et P-02. Le cycle D2 en ajoute
# UNE — P-05, aucune clé étrangère entre deux schémas —, que le plan du D1 avait
# explicitement différée à lui, cible non vide à l'appui. Elle grossira À LA
# DEMANDE ; elle ne se dupliquera pas.
#
# Ce que ce script n'est PAS :
#   — ce n'est pas un installateur : il ne crée aucune base persistante, ne pose
#     aucune migration, ne peuple rien ;
#   — ce n'est pas un formateur : il ne modifie AUCUN fichier du dépôt, jamais,
#     y compris en mode --test-negatif ;
#   — ce n'est pas un workflow d'intégration continue. Il ne suppose ni variable
#     d'environnement de CI, ni chemin absolu, ni jeton : le serveur viendra en
#     phase 3 et le lancera SANS LE MODIFIER.
# =============================================================================

set -euo pipefail

# --- Codes de sortie --------------------------------------------------------
# 0  toutes les portes demandées passent
# 1  une porte a échoué — la sortie nomme la porte, la cause et l'objet fautif
# 2  erreur d'usage — argument inconnu
# 3  prérequis manquant — docker indisponible, base qui ne démarre pas
# 4  UN TEST NÉGATIF N'A PAS ÉCHOUÉ — la porte est aveugle
#
# Le code 4 mérite d'être distinct du 1 : une porte rouge signale un défaut du
# MODÈLE, une porte qui refuse d'être rouge signale un défaut DE LA PORTE, et
# les deux ne se réparent pas au même endroit.
readonly CODE_OK=0
readonly CODE_ROUGE=1
readonly CODE_USAGE=2
readonly CODE_PREREQUIS=3
readonly CODE_AVEUGLE=4

# --- Repères du dépôt -------------------------------------------------------
# Résolu depuis l'emplacement du script : aucun chemin absolu n'est supposé.
RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly RACINE
readonly MODELE_REFERENCE="$RACINE/docs/modele-donnees"
readonly REGISTRE="$RACINE/docs/registre-classes-offline.md"

readonly SERVICE="postgres_verification"
readonly BASE="kaya_verification"
readonly PROPRIETAIRE="kaya_owner"
readonly DELAI_DEMARRAGE=60   # secondes d'attente maximale sur pg_isready

base_demarree=0

# =============================================================================
# Aide et usage
# =============================================================================

aide() {
    cat <<'FIN_AIDE'
verifier.sh — la commande unique de vérification du dépôt Kaya

USAGE
    scripts/verifier.sh                      les préalables PUIS toutes les
                                             portes, dans l'ordre, arrêt au
                                             premier contrôle rouge
    scripts/verifier.sh --sans-conteneur     exécute les préalables, P-03 et
                                             P-04 ; SAUTE ET NOMME P-01, P-02
                                             et P-05 ; imprime « VERT SOUS
                                             RÉSERVE », jamais « TOUT VERT ».
                                             Sans le drapeau et sans démon :
                                             code 3, comme avant.
    scripts/verifier.sh --prealables         lint, types, construction, tests
                                             d'unité — et rien d'autre
    scripts/verifier.sh --porte p01          une porte seule
    scripts/verifier.sh --porte p02
    scripts/verifier.sh --porte p03
    scripts/verifier.sh --porte p05
    scripts/verifier.sh --test-negatif p01   casse P-01 volontairement et EXIGE
                                             qu'elle échoue
    scripts/verifier.sh --test-negatif p02   idem pour P-02
    scripts/verifier.sh --test-negatif p03   idem pour P-03
    scripts/verifier.sh --test-negatif p04   DEUX mutations, une PAR SENS
    scripts/verifier.sh --test-negatif p05   idem pour P-05
    scripts/verifier.sh --test-negatif       les cinq
    scripts/verifier.sh --aide               ce message

    --test-negatif n'est pas un mode de débogage, c'est une PREUVE : une porte
    qui ne trouve jamais rien est indistinguable d'une porte qui n'a rien à
    trouver. Le mode opère sur une COPIE DE TRAVAIL et ne touche jamais
    docs/modele-donnees/ — l'empreinte du répertoire le vérifie.

LES PRÉALABLES — avant les portes, parce qu'ils sont les moins chers
    lint          eslint . — quatre règles opposables, aucune chaîne en dur
    types         nuxt typecheck
    construction  nuxt build, AVEC KAYA_PAGE_TEMOIN=1 : sans le drapeau, les
                  deux pages témoin n'entrent pas au routeur et la suite
                  cycle-de-vie ÉCHOUE — elle échoue, elle ne se saute pas
    tests         vitest run

    Les QUATRE SUITES DE NAVIGATEUR ne sont pas ici : elles s'exécutent DANS
    la porte P-04, qui monte déjà l'application et pilote les deux moteurs.
    Aucune ne reste hors du script — ce qui compte est dedans, ou n'existe pas.

LES PORTES
    P-01   le modèle de docs/modele-donnees/ s'applique dans l'ordre, sans
           erreur, sur une base PostgreSQL VIERGE, et chaque table porte
           ENABLE + FORCE ROW LEVEL SECURITY, sa politique isolation_tenant
           et sa politique administration_editeur.
    P-02   toute table du modèle a une classe hors-ligne déclarée dans
           docs/registre-classes-offline.md. Sens : table → registre. Une
           entité déclarée sans table est normale ; une table non déclarée
           est l'erreur.
    P-03   AUCUNE DÉPENDANCE EN INTERVALLE, lockfile commité et couvrant,
           tags d'image exacts, environnement cohérent en trois écritures,
           et docs/versions-reference.md d'accord avec les manifestes DANS
           LES DEUX SENS. Plus : aucun .github/workflows/ — le serveur
           d'intégration vient en phase 3. Ni conteneur ni réseau.
    P-04   L'APPLICATION DÉMARRE, et chaque écran marqué CONSTRUIT à l'index
           s'atteint — sur Chromium ET WebKit, en clair ET en sombre. Deux
           sens : toute route servie est déclarée à l'index ; toute entrée
           CONSTRUIT est servie. Une entrée « pas commencé » n'est PAS
           exigible. L'inventaire des routes vient DU BUILD, jamais d'une
           liste écrite à la main. C'est ici que les quatre suites de
           navigateur s'exécutent. NI CONTENEUR NI RÉSEAU.
    P-06   TOUT POINT D'ENTRÉE EST « BRANCHÉ » OU « DÛ », et tout branché est
           exercé. Deux sens : un « dû » qui a ACQUIS un appelant rougit, un
           « branché » qui a PERDU le sien rougit. Un export sans référence
           hors registre rougit. La propriété « exercé » se lit à la
           couverture PAR FONCTION. Ni conteneur ni réseau.
    P-05   AUCUNE CLÉ ÉTRANGÈRE ENTRE DEUX SCHÉMAS. Les rattachements
           inter-modules sont des colonnes d'identifiant NUES ; une
           REFERENCES ajoutée de bonne foi ferait échouer en base
           l'écriture orpheline que le produit doit accepter puis
           réconcilier. Elle réutilise la base montée par P-01.

CODES DE SORTIE
    0   toutes les portes demandées passent
    1   une porte a échoué — la sortie nomme la porte, la cause et l'objet
    2   erreur d'usage
    3   prérequis manquant (docker compose, ou base qui ne démarre pas)
    4   un test négatif n'a pas échoué — la porte est aveugle

PRÉREQUIS
    docker et le greffon compose. Rien d'autre : le client psql est celui de
    l'image postgres:18.4, appelé par `docker compose exec`.
FIN_AIDE
}

erreur_usage() {
    printf '\nErreur d'\''usage : %s\n\n' "$1" >&2
    aide >&2
    exit "$CODE_USAGE"
}

# =============================================================================
# Base de vérification — éphémère, détruite QUOI QU'IL ARRIVE
# =============================================================================
#
# Le contrat de porte exige qu'une porte NE MODIFIE PAS ce qu'elle inspecte
# (constitution, principe 13, point 3). Une base survivante entre deux
# exécutions ferait passer P-01 au vert sur un modèle qui ne s'applique plus sur
# une base VIERGE — précisément ce que la porte prétend prouver.

exiger_prerequis() {
    if ! command -v docker >/dev/null 2>&1; then
        printf 'PRÉREQUIS MANQUANT : docker est introuvable.\n' >&2
        exit "$CODE_PREREQUIS"
    fi
    if ! docker compose version >/dev/null 2>&1; then
        printf 'PRÉREQUIS MANQUANT : le greffon « docker compose » est indisponible.\n' >&2
        exit "$CODE_PREREQUIS"
    fi
}

detruire_base() {
    if [ "$base_demarree" -eq 1 ]; then
        base_demarree=0
        (cd "$RACINE" && docker compose down -v >/dev/null 2>&1) || true
    fi
    arreter_serveur
    nettoyer_copies
}

# EXIT couvre la sortie normale ET l'échec ; INT et TERM passent par un exit
# explicite, qui déclenche à son tour le trap EXIT. Aucune des trois voies ne
# laisse un conteneur ou un volume derrière elle.
trap detruire_base EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

demarrer_base() {
    # Une base neuve à chaque appel : on détruit d'abord ce qu'une exécution
    # interrompue aurait pu laisser.
    (cd "$RACINE" && docker compose down -v >/dev/null 2>&1) || true
    base_demarree=1
    if ! (cd "$RACINE" && docker compose up -d "$SERVICE" >/dev/null 2>&1); then
        printf 'PRÉREQUIS : la base de vérification n'\''a pas pu démarrer.\n' >&2
        exit "$CODE_PREREQUIS"
    fi

    # ⚠️ L'attente se fait SUR TCP (-h 127.0.0.1), jamais sur le socket Unix,
    # et le piège vaut d'être écrit : pendant son initialisation, l'entrypoint de
    # l'image postgres lance un serveur TEMPORAIRE avec listen_addresses vide,
    # pour créer la base et l'utilisateur. Ce serveur répond « accepting
    # connections » sur le socket Unix, puis S'ARRÊTE pour laisser place au
    # serveur définitif. Une attente sur le socket rend donc la main trop tôt, et
    # le fichier suivant échoue sur « the database system is shutting down » —
    # une erreur qui accuse le SQL alors que la faute est dans l'attente.
    # Le port TCP, lui, n'est ouvert que par le serveur définitif.
    local attente=0
    while [ "$attente" -lt "$DELAI_DEMARRAGE" ]; do
        if (cd "$RACINE" && docker compose exec -T "$SERVICE" \
                pg_isready -h 127.0.0.1 -U "$PROPRIETAIRE" -d "$BASE" >/dev/null 2>&1) \
           && (cd "$RACINE" && docker compose exec -T "$SERVICE" \
                psql -X -q -t -h 127.0.0.1 -U "$PROPRIETAIRE" -d "$BASE" \
                -c 'SELECT 1' >/dev/null 2>&1); then
            return 0
        fi
        sleep 1
        attente=$((attente + 1))
    done

    printf 'PRÉREQUIS : la base n'\''est pas prête après %d s.\n' "$DELAI_DEMARRAGE" >&2
    exit "$CODE_PREREQUIS"
}

# psql en lecture — rend des tuples nus, sans en-tête ni alignement.
#
# ⚠️ UNE REQUÊTE DE CONTRÔLE QUI ÉCHOUE DOIT ÊTRE ROUGE, JAMAIS VERTE.
# C'était le défaut le plus dangereux du script, et il touchait LES TROIS PORTES.
# Le mécanisme, en trois temps :
#   1. psql écrit ses erreurs sur STDERR et sort en 1 ; la substitution de
#      commande ne capturait que STDOUT, donc le résultat était une chaîne VIDE ;
#   2. `set -e` est NEUTRALISÉ dans le corps d'une fonction appelée en
#      « porte_pXX … || exit », donc rien n'arrêtait le script ;
#   3. une chaîne vide est indiscernable de « aucun objet fautif » — et
#      `rendre_verdict` imprimait « ✓ 118/118 » puis « VERT ».
# Sur un contrôle de plancher, c'était pire encore : `[ "" -lt 90 ]` rend le code
# 2 (« integer expression expected »), donc la branche du `if` N'EST PAS PRISE et
# la porte imprimait « Plancher atteint » sur ZÉRO objet examiné.
#
# La correction tient en trois points, et les trois comptent :
#   — STDERR est capturé ET le statut de psql est relevé ;
#   — un échec rend un statut NON NUL, que chaque appelant transforme en ROUGE
#     par « || return "$CODE_ROUGE" » — sans quoi le statut se perdrait dans la
#     substitution de commande ;
#   — l'erreur de psql est IMPRIMÉE : une porte qui échoue sans dire pourquoi
#     envoie chercher pendant vingt minutes.
interroger() {
    local sortie statut
    sortie="$( (cd "$RACINE" && docker compose exec -T "$SERVICE" \
        psql -X -q -A -t -v ON_ERROR_STOP=1 -U "$PROPRIETAIRE" -d "$BASE" -c "$1") 2>&1 )"
    statut=$?
    if [ "$statut" -ne 0 ]; then
        printf '   ✗ LA REQUÊTE DE CONTRÔLE A ÉCHOUÉ — la porte ne peut RIEN prouver.\n' >&2
        printf '%s\n' "$sortie" | sed 's/^/     /' >&2
        return 1
    fi
    printf '%s' "$sortie"
}

# Interroge et EXIGE un entier. Second garde-fou, distinct du premier : une
# requête peut réussir et rendre autre chose qu'un nombre — un `count(*)` devenu
# `count(*), autre_chose`, une colonne renommée, un tuple vide. Comparer une
# non-valeur avec `-lt` rend le code 2, que le `if` lit comme FAUX : le plancher
# serait alors SAUTÉ au lieu de mordre, ce qui est l'inverse de sa raison d'être.
interroger_nombre() {
    local valeur
    valeur="$(interroger "$1")" || return 1
    if ! printf '%s' "$valeur" | grep -qE '^[0-9]+$'; then
        printf '   ✗ LE CONTRÔLE N'\''A PAS RENDU UN NOMBRE — la porte ne peut RIEN prouver.\n' >&2
        printf '     valeur obtenue : « %s »\n' "$valeur" >&2
        return 1
    fi
    printf '%s' "$valeur"
}

# =============================================================================
# Application du modèle — dans l'ordre, fichier par fichier
# =============================================================================
#
# L'ordre est celui du glob, donc lexicographique, donc celui des préfixes
# numériques. Il n'existe pas de liste d'ordre ailleurs, donc pas de liste qui
# puisse diverger du répertoire.
#
# Un fichier par appel, et non un gros \i : c'est ce qui permet de NOMMER le
# fichier fautif, et le nommer est la moitié de l'intérêt de la porte.

appliquer_modele() {
    local repertoire="$1"
    local fichier nom
    fichiers_appliques=0

    for fichier in "$repertoire"/*.sql; do
        [ -e "$fichier" ] || continue
        nom="$(basename "$fichier")"
        if ! (cd "$RACINE" && docker compose exec -T "$SERVICE" \
                psql -X -q -v ON_ERROR_STOP=1 -U "$PROPRIETAIRE" -d "$BASE") < "$fichier"; then
            printf '   ✗ le modèle ne s'\''applique pas\n'
            printf '     FICHIER FAUTIF : %s\n' "$nom"
            return 1
        fi
        fichiers_appliques=$((fichiers_appliques + 1))
    done

    if [ "$fichiers_appliques" -eq 0 ]; then
        printf '   ✗ aucun fichier .sql trouvé dans %s\n' "$repertoire"
        return 1
    fi
    return 0
}

# =============================================================================
# LES PRÉALABLES — lint, types, construction, tests d'unité
# =============================================================================
#
# Principe 13, et c'est la phrase entière : « aucun contrôle n'est lancé à la
# main EN PLUS du script — ce qui compte est dedans, ou n'existe pas ».
#
# Jusqu'ici, quatre commandes se lançaient séparément : `pnpm lint`,
# `pnpm build`, `pnpm test` et `pnpm test:navigateur`. Elles étaient VERTES — et
# c'est précisément ce qui rendait l'écart dangereux : un contrôle vert qu'on
# lance de mémoire est un contrôle qu'on oubliera un mardi, sans que rien ne le
# dise. Les trois premières entrent ici ; les quatre suites de navigateur
# entrent DANS LA PORTE P-04, qui monte déjà l'application et pilote les deux
# moteurs. Aucune ne reste dehors.
#
# ⚠️ LA CONSTRUCTION SE FAIT AVEC `KAYA_PAGE_TEMOIN=1`, ET CE N'EST PAS UN
# RÉGLAGE DE CONFORT. Sans le drapeau, les deux pages témoin n'entrent pas au
# routeur et `tests/navigateur/cycle-de-vie.spec.ts` ÉCHOUE — il échoue, il ne
# se saute pas : un test silencieusement absent est un test qu'on croit vert.
# `app/core/ecrans/index.ts` lit LE MÊME DRAPEAU, donc les deux côtés de P-04 ne
# peuvent pas diverger.
#
# ⚠️ ET `typecheck` A ÉTÉ CONSTATÉ CASSÉ EN L'Y RATTACHANT. Le script était
# déclaré au manifeste depuis le début du cycle et s'arrêtait en réclamant
# `vue-tsc`, absente. Un script déclaré qui ne peut pas s'exécuter se lit comme
# un contrôle existant : c'est exactement le mode de défaillance que ce
# rattachement ferme. La dépendance est ajoutée et inscrite au §3.2 dans le même
# changement.

# Les repères de coût de SC-017. Le premier n'arrête rien : il DEMANDE qu'on
# consigne le franchissement au rapport de cycle, parce qu'un enchaînement qui
# s'allonge sans que personne l'écrive finit par ne plus être lancé.
readonly REPERE_A_CONSIGNER=180
readonly REPERE_MAXIMUM=300

# pnpm porte les quatre préalables. Son absence est un PRÉREQUIS manquant, pas
# une porte rouge : il n'y a rien à diagnostiquer dans le dépôt.
exiger_pnpm() {
    if ! command -v pnpm >/dev/null 2>&1; then
        printf 'PRÉREQUIS MANQUANT : pnpm est introuvable — les préalables ne peuvent pas être lancés.\n' >&2
        exit "$CODE_PREREQUIS"
    fi
    if [ ! -d "$RACINE/node_modules" ]; then
        printf 'PRÉREQUIS MANQUANT : node_modules/ est absent — lancez « pnpm install --frozen-lockfile ».\n' >&2
        exit "$CODE_PREREQUIS"
    fi
}

# Exécute un préalable, imprime sa durée, et EN CAS D'ÉCHEC IMPRIME SA SORTIE.
# Un contrôle qui échoue sans dire pourquoi envoie chercher pendant vingt
# minutes — le même motif qui fait nommer l'objet fautif dans chaque porte.
executer_prealable() {
    local libelle="$1"
    shift
    local journal debut
    journal="$(mktemp)"
    debut=$SECONDS

    if (cd "$RACINE" && "$@") > "$journal" 2>&1; then
        printf '   ✓ %-26s %3d s\n' "$libelle" "$((SECONDS - debut))"
        rm -f "$journal"
        return 0
    fi

    printf '   ✗ %-26s %3d s\n' "$libelle" "$((SECONDS - debut))"
    printf '     COMMANDE : %s\n' "$*"
    tail -n 40 "$journal" | sed 's/^/     | /'
    rm -f "$journal"
    return "$CODE_ROUGE"
}

# La construction n'a lieu QU'UNE FOIS, comme la base de P-01 : la porte P-04
# la réutilise plutôt que de reconstruire. C'est aussi ce qui permet à
# « --porte p04 » de fonctionner seul — la porte construit alors elle-même.
build_fait=0

construire_application() {
    # ⚠️ L'INVENTAIRE DES ROUTES EST RETIRÉ AVANT, ET CE N'EST PAS UNE PRÉCAUTION
    # THÉORIQUE. `nuxt typecheck` résout les pages lui aussi, donc il déclenche le
    # même crochet — SANS le drapeau de page témoin. Constaté en le lançant :
    # l'inventaire tombait à quatre routes. Le retirer d'abord garantit que P-04
    # lit un inventaire produit par LA construction de cette exécution, et par
    # aucune autre. Un inventaire survivant est exactement le genre de fichier
    # qui rend une porte verte sur un état qui n'existe plus.
    rm -f "$RACINE/.rapports/routes-du-build.json"
    executer_prealable 'construction (témoin)' env KAYA_PAGE_TEMOIN=1 pnpm build || return "$CODE_ROUGE"
    build_fait=1
    return 0
}

assurer_build() {
    [ "$build_fait" -eq 1 ] && return 0
    construire_application
}

controles_prealables() {
    printf '\n── LES PRÉALABLES · lint, types, construction, tests d'\''unité\n'
    exiger_pnpm
    printf '   Périmètre : eslint . · nuxt typecheck · nuxt build (KAYA_PAGE_TEMOIN=1) · vitest run\n'
    printf '   Les quatre suites de navigateur sont dans P-04, jamais hors du script\n'

    executer_prealable 'lint'                pnpm lint || return "$CODE_ROUGE"
    executer_prealable 'types'               pnpm typecheck || return "$CODE_ROUGE"
    construire_application                   || return "$CODE_ROUGE"
    # ⚠️ AVEC LA COUVERTURE, ET EN UNE SEULE EXÉCUTION. La porte P-06 lit le
    # rapport par fonction ; lancer `pnpm test` puis `pnpm test:couverture`
    # exécuterait les mêmes 134 cas deux fois pour le même verdict.
    executer_prealable "tests d'unité"       pnpm test:couverture || return "$CODE_ROUGE"

    printf '   VERT\n'
    return 0
}

# =============================================================================
# P-01 · le modèle s'applique sur une base vierge, et chaque table est isolée
# =============================================================================
#
# Trois contrôles, et le troisième est le moins évident des trois :
#
#   1. tenant_id existe et est NOT NULL — sans elle, la politique compare une
#      colonne absente.
#   2. relrowsecurity ET relforcerowsecurity — sans FORCE, le propriétaire des
#      tables reste hors politique et la première tâche de maintenance voit
#      tous les clients.
#   3. une politique isolation_tenant dont qual ET with_check sont non nuls, et
#      dont les deux expressions portent le SECOND ARGUMENT true de
#      current_setting. pg_policies.with_check vaut NULL quand la politique n'en
#      déclare pas — et une politique sans WITH CHECK laisse un tenant INSÉRER
#      chez un autre, ce qui n'apparaît dans AUCUNE lecture. Vérifier la seule
#      présence de la politique laisserait passer exactement cette faute.

# Périmètre commun aux quatre requêtes : les relations ordinaires des schémas du
# modèle. `public` est exclu — 00-conventions.sql n'y pose que des domaines, et
# le README du modèle le déclare.
readonly PERIMETRE_SQL="c.relkind = 'r'
      AND n.nspname NOT LIKE 'pg\\_%'
      AND n.nspname NOT IN ('information_schema', 'public')"

# Plancher de non-vacuité : une porte qui inspecterait zéro table passerait au
# vert sans rien prouver.
#
# 110 pour 118 tables réelles — valeur DÉFINITIVE du cycle D2, relevée depuis les
# 60 du cycle D1 (qui en comptait 71). UN PLANCHER SE RÈGLE JUSTE SOUS LA VALEUR
# RÉELLE, JAMAIS LOIN EN DESSOUS : à 60, le modèle amputé de ses quarante-sept
# tables de verticales passerait encore, et la porte serait verte en n'inspectant
# plus que le socle — c'est-à-dire en ne prouvant plus rien de ce cycle. La marge
# de huit absorbe le retrait délibéré de quelques tables sans exiger de toucher
# au script, et rien de plus.
readonly PLANCHER_TABLES=110

# Les schémas que le README du modèle DÉCLARE. La comparaison à ceux réellement
# créés est le point 2 du contrat de porte : « vérifie sa complétude ».
schemas_declares() {
    awk '
        /^## Schémas déclarés/ { dans = 1; next }
        /^## /                 { dans = 0 }
        dans && /^- `/         { gsub(/^- `/, ""); gsub(/`.*$/, ""); print }
    ' "$1/README.md" | sort -u
}

# La base n'est démarrée et le modèle appliqué QU'UNE FOIS pour les deux portes :
# P-02 réutilise ce que P-01 a monté plutôt que de lancer une seconde base. C'est
# l'un des deux choix qui tiennent la durée totale sous les deux minutes de
# SC-008 (l'autre est le tmpfs de compose.yml).
modele_applique=0

# ⚠️ LE PRÉREQUIS DE CONTENEUR EST EXIGÉ **ICI**, ET NON DANS main().
#
# Il vivait dans main() : le script s'arrêtait donc en code 3 **avant tout**, y
# compris avant les contrôles qui n'ont besoin d'aucun conteneur — le lint, la
# construction, les tests, P-03 et P-04. Sur le poste d'Abengourou, où l'on
# démontre sans démon, cela revenait à ne rien pouvoir vérifier du tout.
#
# Descendu ici, le prérequis appartient **aux portes qui en ont un**, et à elles
# seules. C'est ce qui rend `--sans-conteneur` possible sans transiger : sans le
# drapeau et sans démon, la sortie reste **code 3**, comme avant.
preparer_base() {
    [ "$modele_applique" -eq 1 ] && return 0
    exiger_prerequis
    demarrer_base
    appliquer_modele "$1" || return 1
    modele_applique=1
    return 0
}

porte_p01() {
    local repertoire="$1"
    local declares trouves manquants total echecs

    printf '\n── P-01 · le modèle s'\''applique sur une base vierge, et chaque table porte ENABLE + FORCE + sa politique\n'

    preparer_base "$repertoire" || return "$CODE_ROUGE"

    # --- Complétude : schémas de la base ↔ schémas déclarés au README --------
    declares="$(schemas_declares "$repertoire")"
    trouves="$(interroger "SELECT n.nspname FROM pg_namespace n
                           WHERE n.nspname NOT LIKE 'pg\\_%'
                             AND n.nspname NOT IN ('information_schema', 'public')
                           ORDER BY 1;")" || { printf '   ROUGE — P-01\n'; return "$CODE_ROUGE"; }

    if [ "$declares" != "$trouves" ]; then
        printf '   ✗ les schémas de la base et ceux déclarés au README du modèle diffèrent\n'
        diff <(printf '%s\n' "$declares" | grep -v '^$' || true) \
             <(printf '%s\n' "$trouves"  | grep -v '^$' || true) \
            | sed -e 's/^< /     DÉCLARÉ SANS ÊTRE CRÉÉ : /' \
                  -e 's/^> /     CRÉÉ SANS ÊTRE DÉCLARÉ : /' \
            | grep -E 'DÉCLARÉ SANS|CRÉÉ SANS' || true
        printf '   ROUGE — P-01\n'
        return "$CODE_ROUGE"
    fi

    total="$(interroger_nombre "SELECT count(*) FROM pg_class c
                         JOIN pg_namespace n ON n.oid = c.relnamespace
                         WHERE $PERIMETRE_SQL;")" || { printf '   ROUGE — P-01\n'; return "$CODE_ROUGE"; }

    printf '   Périmètre : %d fichier(s) appliqué(s) · %d schéma(s) · %d table(s) inspectée(s)\n' \
        "$fichiers_appliques" "$(printf '%s\n' "$trouves" | grep -c . || true)" "$total"

    # --- Non-vacuité --------------------------------------------------------
    if [ "$total" -lt "$PLANCHER_TABLES" ]; then
        printf '   Plancher  : %d table(s) attendue(s) au minimum — NON ATTEINT (%d)\n' \
            "$PLANCHER_TABLES" "$total"
        printf '   ✗ la cible de la porte est vide ou tronquée : un vert ne prouverait rien\n'
        printf '   ROUGE — P-01\n'
        return "$CODE_ROUGE"
    fi
    printf '   Plancher  : %d table(s) attendue(s) au minimum — atteint\n' "$PLANCHER_TABLES"

    echecs=0

    # --- Contrôle 1 : la colonne -------------------------------------------
    manquants="$(interroger "SELECT n.nspname || '.' || c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE $PERIMETRE_SQL
          AND NOT EXISTS (
              SELECT 1 FROM pg_attribute a
              WHERE a.attrelid = c.oid AND a.attname = 'tenant_id'
                AND a.attnum > 0 AND NOT a.attisdropped AND a.attnotnull)
        ORDER BY 1;")" || { printf '   ROUGE — P-01\n'; return "$CODE_ROUGE"; }
    rendre_verdict "tenant_id NOT NULL" "$total" "$manquants" || echecs=1

    # --- Contrôle 2 : l'activation -----------------------------------------
    manquants="$(interroger "SELECT n.nspname || '.' || c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE $PERIMETRE_SQL
          AND NOT (c.relrowsecurity AND c.relforcerowsecurity)
        ORDER BY 1;")" || { printf '   ROUGE — P-01\n'; return "$CODE_ROUGE"; }
    rendre_verdict "ENABLE + FORCE" "$total" "$manquants" || echecs=1

    # --- Contrôle 3 : la politique -----------------------------------------
    manquants="$(interroger "SELECT n.nspname || '.' || c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE $PERIMETRE_SQL
          AND NOT EXISTS (
              SELECT 1 FROM pg_policies p
              WHERE p.schemaname = n.nspname AND p.tablename = c.relname
                AND p.policyname = 'isolation_tenant'
                AND p.qual       IS NOT NULL
                AND p.with_check IS NOT NULL
                AND p.qual       LIKE '%current_setting(''app.current_tenant''::text, true)%'
                AND p.with_check LIKE '%current_setting(''app.current_tenant''::text, true)%')
        ORDER BY 1;")" || { printf '   ROUGE — P-01\n'; return "$CODE_ROUGE"; }
    rendre_verdict "politique isolation_tenant" "$total" "$manquants" \
        "(USING et WITH CHECK non nuls, second argument \`true\` présent)" || echecs=1

    # --- Contrôle 4 : la politique d'administration ------------------------
    #
    # Son absence NE SE VOIT SUR AUCUN ÉCRAN, et fait RÉUSSIR EN N'ÉCRIVANT RIEN
    # toute migration de peuplement de la phase 3 : la politique s'applique au
    # propriétaire sous FORCE, current_setting vaut NULL, aucune ligne n'est
    # touchée, aucune erreur n'est levée. C'est le défaut le plus silencieux du
    # modèle — et il ne se découvre qu'au premier calcul qui lit la colonne vide.
    #
    # Contrôle DISTINCT du 3 plutôt que fondu dedans : en cas d'échec, savoir
    # LAQUELLE des deux politiques manque évite de chercher.
    manquants="$(interroger "SELECT n.nspname || '.' || c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE $PERIMETRE_SQL
          AND NOT EXISTS (
              SELECT 1 FROM pg_policies p
              WHERE p.schemaname = n.nspname AND p.tablename = c.relname
                AND p.policyname = 'administration_editeur'
                AND p.cmd = 'ALL'
                AND p.roles = '{kaya_owner}'::name[]
                AND p.qual       IS NOT NULL
                AND p.with_check IS NOT NULL)
        ORDER BY 1;")" || { printf '   ROUGE — P-01\n'; return "$CODE_ROUGE"; }
    rendre_verdict "politique administration_editeur" "$total" "$manquants" \
        "(FOR ALL TO kaya_owner, posée dès la création)" || echecs=1

    if [ "$echecs" -ne 0 ]; then
        printf '   ROUGE — P-01\n'
        return "$CODE_ROUGE"
    fi
    printf '   VERT\n'
    return "$CODE_OK"
}

# =============================================================================
# P-02 · toute table du modèle a une classe déclarée au registre
# =============================================================================
#
# SENS DE LA COMPARAISON : table → registre, JAMAIS l'inverse. Une entité
# déclarée sans table est NORMALE — le registre §6, §7 et §8 déclare déjà tout
# le cycle D2, et le §10 des provisions que ce cycle ne crée pas. Une table non
# déclarée est l'erreur.
#
# LIMITES ASSUMÉES, et l'arbitrage qui les rend acceptables :
#   — la comparaison porte sur le NOM NU, pas sur schema.table : deux tables
#     homonymes dans deux schémas passeraient avec une seule déclaration ;
#   — une mention en prose entre accents graves peut faire passer une table par
#     accident.
# Un faux négatif ferait DÉSACTIVER la porte sous trois semaines ; un faux
# positif la laisse utile. On tolère le second, jamais le premier.

# Plancher de non-vacuité DES DEUX CÔTÉS. Le second est le plus important : un
# registre devenu illisible pour l'extracteur ferait passer la porte au vert en
# NE COMPARANT RIEN.
#
# POURQUOI PAS UN PLANCHER CONFORTABLE. L'extraction rend 180 entités sur le
# registre au 2026-08-07, après l'ajout de `ligne_inventaire` et
# d'`article_stock_catalogue`. Un plancher confortable — 80, par exemple —
# serait INUTILE : la moitié d'une extraction cassée suffirait encore à couvrir
# les 118 tables, et la porte resterait verte EN NE COMPARANT PLUS RIEN. C'est
# exactement le mode de défaillance qu'un plancher existe pour refuser.
#
# Valeurs DÉFINITIVES du cycle D2, relevées depuis 60 et 140 :
#   — 110 pour 118 tables réelles, comme P-01 ;
#   — 170 pour 180 entités extraites, marge de dix.
readonly PLANCHER_TABLES_P02=110
readonly PLANCHER_ENTITES=170

# L'extraction est robuste parce que la convention d'écriture du registre est
# déjà celle-là : toute entité y est citée entre accents graves. Le filtre final
# écarte ce qui ne peut pas être un identifiant SQL (codes de branche en
# majuscules, expressions, fragments de phrase).
entites_registre() {
    grep -oE '`[^`]+`' "$REGISTRE" \
        | tr -d '`' \
        | cut -d. -f1 \
        | tr 'A-Z' 'a-z' \
        | grep -E '^[a-z_][a-z0-9_]*$' \
        | sort -u
}

porte_p02() {
    local repertoire="$1"
    local declarees tables nb_tables nb_entites non_declarees qualifie nu

    printf '\n── P-02 · toute table du modèle a une classe déclarée au registre\n'

    preparer_base "$repertoire" || return "$CODE_ROUGE"

    declarees="$(entites_registre)"
    nb_entites="$(printf '%s\n' "$declarees" | grep -c . || true)"

    tables="$(interroger "SELECT n.nspname || '.' || c.relname || '|' || c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE $PERIMETRE_SQL
        ORDER BY 1;")" || { printf '   ROUGE — P-02\n'; return "$CODE_ROUGE"; }
    nb_tables="$(printf '%s\n' "$tables" | grep -c . || true)"

    printf '   Périmètre : %d table(s) réelle(s) confrontée(s) à %d entité(s) extraite(s) du registre\n' \
        "$nb_tables" "$nb_entites"
    printf '   Sens      : table → registre (une entité déclarée sans table est normale)\n'

    if [ "$nb_tables" -lt "$PLANCHER_TABLES_P02" ] || [ "$nb_entites" -lt "$PLANCHER_ENTITES" ]; then
        printf '   Plancher  : %d table(s) et %d entité(s) au minimum — NON ATTEINT\n' \
            "$PLANCHER_TABLES_P02" "$PLANCHER_ENTITES"
        printf '   ✗ la porte comparerait trop peu de choses : un vert ne prouverait rien\n'
        printf '   ROUGE — P-02\n'
        return "$CODE_ROUGE"
    fi
    printf '   Plancher  : %d table(s) et %d entité(s) au minimum — atteint\n' \
        "$PLANCHER_TABLES_P02" "$PLANCHER_ENTITES"

    non_declarees=""
    while IFS='|' read -r qualifie nu; do
        [ -z "$nu" ] && continue
        if ! printf '%s\n' "$declarees" | grep -qxF "$nu"; then
            non_declarees="${non_declarees}${qualifie}"$'\n'
        fi
    done <<< "$tables"

    non_declarees="$(printf '%s' "$non_declarees" | grep -v '^$' || true)"

    if [ -n "$non_declarees" ]; then
        # Toutes les tables fautives, jamais seulement la première : corriger
        # une déclaration pour découvrir la suivante au tour d'après est le plus
        # sûr moyen de faire désactiver une porte.
        printf '   ✗ %d table(s) non déclarée(s) au registre\n' \
            "$(printf '%s\n' "$non_declarees" | grep -c .)"
        printf '%s\n' "$non_declarees" | sed 's/^/     /'
        printf '   ROUGE — P-02\n'
        return "$CODE_ROUGE"
    fi

    printf '   VERT\n'
    return "$CODE_OK"
}

# =============================================================================
# P-05 · aucune clé étrangère entre deux schémas
# =============================================================================
#
# Ajoutée par le cycle D2. Le cycle D1 l'avait EXAMINÉE PUIS DIFFÉRÉE À CELUI-CI,
# en écrivant pourquoi : « la tentation n'apparaîtra qu'au cycle D2, où
# ventes → hebergement et pressing → hebergement sont deux rattachements sans
# FK. C'est là qu'elle sera justifiée, avec une cible non vide à inspecter. »
#
# CE QU'ELLE REFUSE, et le coût de son absence :
#   Une clé étrangère sur hebergement.ligne_sejour.ligne_commande_id CASSE LE
#   CHEMIN NOMINAL du conflit le plus fréquent du produit — la consommation
#   prise hors ligne qui arrive sur une note déjà arrêtée. Avec la contrainte,
#   l'écriture orpheline ne part pas en réconciliation : elle ÉCHOUE EN BASE.
#   Le mode de défaillance est SILENCIEUX ET DIFFÉRÉ : un cycle de phase 3 prend
#   l'absence de REFERENCES pour un oubli et l'ajoute DE BONNE FOI ; la migration
#   s'applique, tous les tests passent, et le défaut se voit à la première
#   coupure réseau en exploitation.
#   Jusqu'ici, la seule défense était un commentaire de colonne — et UN
#   COMMENTAIRE NE REFUSE RIEN.
#
# ⚠️ P-05 CHERCHE UNE ABSENCE, et c'est LE PIRE PROFIL DE PORTE QUI SOIT : elle
# est verte quand elle ne trouve rien. Une requête mal écrite, un nom de
# catalogue changé, un filtre trop large — et elle reste verte pour toujours,
# sans que rien ne le signale. C'est pourquoi le point 4 du contrat de porte
# compte ICI PLUS QU'AILLEURS : LE PLANCHER DE CONTRAINTES EXAMINÉES EST CE QUI
# DISTINGUE « RIEN À TROUVER » DE « JE NE CHERCHE PLUS ».

# Plancher de non-vacuité — nombre de contraintes de clé étrangère que la porte
# doit avoir EXAMINÉES pour que son vert veuille dire quelque chose.
#
# Posé PROVISOIREMENT à 1 à la création de la porte, puis porté ici à sa VALEUR
# DÉFINITIVE : 90 pour 98 clés étrangères internes réelles.
#
# ⚠️ CE PLANCHER EST LE PLUS IMPORTANT DES QUATRE, et c'est le profil de la porte
# qui le rend tel. P-01 et P-02 cherchent quelque chose ; P-05 cherche une
# ABSENCE, et est verte quand elle ne trouve rien. Un filtre trop étroit, un nom
# de catalogue changé, une jointure cassée — et elle inspecterait trois
# contraintes en annonçant fièrement « aucune inter-schémas ». Le plancher est ce
# qui distingue « rien à trouver » de « JE NE CHERCHE PLUS ».
#
# ⚠️ MAIS IL NE SUFFIT PAS, ET LE CYCLE L'A CONSTATÉ EN LE VÉRIFIANT : quand le
# prédicat de détection a été saboté délibérément (T016), la porte est restée
# VERTE en annonçant 92 contraintes examinées — le plancher était atteint, la
# cible n'était pas vide, seul le prédicat était faux. SEUL LE TEST NÉGATIF A VU
# LA FAUTE. Plancher et test négatif ne couvrent donc PAS la même défaillance, et
# il en faut deux.
readonly PLANCHER_FK=90

porte_p05() {
    local repertoire="$1"
    local declares trouves nb_schemas total inter

    printf '\n── P-05 · aucune clé étrangère entre deux schémas\n'

    # Réutilise la base que P-01 a montée. Jamais un second conteneur : c'est
    # l'un des choix qui tiennent la durée totale sous les deux minutes.
    preparer_base "$repertoire" || return "$CODE_ROUGE"

    # --- Point 2 du contrat : complétude ------------------------------------
    #
    # LA MÊME LISTE OPPOSABLE QUE P-01, jamais une seconde. Deux listes
    # divergeraient, et la porte inspecterait alors un périmètre que personne
    # n'aurait déclaré.
    declares="$(schemas_declares "$repertoire")"
    trouves="$(interroger "SELECT n.nspname FROM pg_namespace n
                           WHERE n.nspname NOT LIKE 'pg\\_%'
                             AND n.nspname NOT IN ('information_schema', 'public')
                           ORDER BY 1;")" || { printf '   ROUGE — P-05\n'; return "$CODE_ROUGE"; }

    if [ "$declares" != "$trouves" ]; then
        printf '   ✗ les schémas de la base et ceux déclarés au README du modèle diffèrent\n'
        diff <(printf '%s\n' "$declares" | grep -v '^$' || true) \
             <(printf '%s\n' "$trouves"  | grep -v '^$' || true) \
            | sed -e 's/^< /     DÉCLARÉ SANS ÊTRE CRÉÉ : /' \
                  -e 's/^> /     CRÉÉ SANS ÊTRE DÉCLARÉ : /' \
            | grep -E 'DÉCLARÉ SANS|CRÉÉ SANS' || true
        printf '   ROUGE — P-05\n'
        return "$CODE_ROUGE"
    fi
    nb_schemas="$(printf '%s\n' "$trouves" | grep -c . || true)"

    # --- Point 1 du contrat : périmètre inspecté ----------------------------
    #
    # `contype = 'f'` sélectionne les contraintes de clé étrangère. conrelid
    # porte la table PORTEUSE, confrelid la table RÉFÉRENCÉE ; c'est la
    # comparaison de leurs relnamespace qui fait tout le contrôle.
    total="$(interroger_nombre "SELECT count(*)
        FROM pg_constraint k
        JOIN pg_class     cp ON cp.oid = k.conrelid
        JOIN pg_namespace np ON np.oid = cp.relnamespace
        WHERE k.contype = 'f'
          AND np.nspname NOT LIKE 'pg\\_%'
          AND np.nspname NOT IN ('information_schema', 'public');")" || { printf '   ROUGE — P-05\n'; return "$CODE_ROUGE"; }

    printf '   Périmètre : %d schéma(s) · %d contrainte(s) de clé étrangère examinée(s)\n' \
        "$nb_schemas" "$total"

    # --- Point 4 du contrat : non-vacuité -----------------------------------
    if [ "$total" -lt "$PLANCHER_FK" ]; then
        printf '   Plancher  : %d contrainte(s) attendue(s) au minimum — NON ATTEINT (%d)\n' \
            "$PLANCHER_FK" "$total"
        printf '   ✗ la porte n'\''a rien examiné : un vert ne prouverait rien\n'
        printf '     Une porte qui cherche une ABSENCE et ne trouve rien à inspecter\n'
        printf '     est indistinguable d'\''une porte cassée.\n'
        printf '   ROUGE — P-05\n'
        return "$CODE_ROUGE"
    fi
    printf '   Plancher  : %d contrainte(s) attendue(s) au minimum — atteint\n' "$PLANCHER_FK"

    # --- Le contrôle --------------------------------------------------------
    #
    # La sortie NOMME LES TROIS OBJETS — la contrainte, la table portante, la
    # table référencée. « Une clé étrangère inter-schémas existe » envoie
    # chercher ; « fk_ligne_sejour_ligne_commande : hebergement.ligne_sejour →
    # ventes.ligne_commande » envoie à la ligne.
    inter="$(interroger "SELECT k.conname || ' : '
                             || np.nspname || '.' || cp.relname || ' → '
                             || nr.nspname || '.' || cr.relname
        FROM pg_constraint k
        JOIN pg_class     cp ON cp.oid = k.conrelid
        JOIN pg_namespace np ON np.oid = cp.relnamespace
        JOIN pg_class     cr ON cr.oid = k.confrelid
        JOIN pg_namespace nr ON nr.oid = cr.relnamespace
        WHERE k.contype = 'f'
          AND np.nspname NOT LIKE 'pg\\_%'
          AND np.nspname NOT IN ('information_schema', 'public')
          AND np.nspname <> nr.nspname
        ORDER BY 1;")" || { printf '   ROUGE — P-05\n'; return "$CODE_ROUGE"; }

    if [ -n "$inter" ]; then
        printf '   ✗ contrainte(s) inter-schémas trouvée(s) : %d\n' \
            "$(printf '%s\n' "$inter" | grep -c .)"
        printf '%s\n' "$inter" | sed 's/^/     /'
        printf '   ROUGE — P-05\n'
        return "$CODE_ROUGE"
    fi

    printf '   ✓ aucune contrainte inter-schémas\n'
    printf '   VERT\n'
    return "$CODE_OK"
}

# =============================================================================
# P-03 · les dépendances — aucun intervalle, lockfile à jour, versions inscrites
# =============================================================================
#
# Porte NOMMÉE PAR LE NOYAU (constitution, principe 13, « dès qu'un manifeste
# existe »). Le cycle F1 crée le premier manifeste du dépôt, donc c'est lui qui
# crée la porte — et l'écart consigné au rapport du cycle D1 se referme ici :
# « un latest glissé dans compose.yml ne serait vu par aucune porte d'ici au
# cycle qui créera le premier manifeste. »
#
# ⚠️ ELLE NE DEMANDE NI CONTENEUR NI RÉSEAU. Le §4.3 de versions-reference.md le
# motive : « comparer les valeurs aux registres officiels ferait de la
# vérification une dépendance réseau ». La justesse d'une version est établie AU
# MOMENT DE L'AJOUT, par l'URL et la date inscrites ; la porte vérifie la
# COHÉRENCE, pas la fraîcheur.
#
# PÉRIMÈTRE INSPECTÉ (point 1 du contrat de porte)
#   package.json            dependencies · devDependencies · engines.node · packageManager
#   pnpm-lock.yaml          présence, et couverture de CHAQUE dépendance déclarée
#   .nvmrc                  égalité avec engines.node et avec le §3.3 du document
#   compose.yml             tags d'image — la fin de l'écart du cycle D1
#   docs/versions-reference.md   §2 · §3.1 · §3.2 · §3.3 · §4.2, DANS LES DEUX SENS
#
# HORS PÉRIMÈTRE, ET DÉCLARÉ COMME TEL : Cargo.toml, Cargo.lock,
# rust-toolchain.toml. Ils n'existent pas. Le périmètre de la porte est « les
# manifestes PRÉSENTS », pas une liste : la phase 3 les créera et la porte les
# prendra SANS ÊTRE MODIFIÉE.

# Les cinq fichiers du périmètre sont résolus DEPUIS L'ARGUMENT de la porte, et
# non depuis $RACINE : c'est ce qui permet au test négatif de la faire tourner
# sur une COPIE DE TRAVAIL sans toucher au dépôt.

# Une version EXACTE, et rien d'autre. C'est la seule règle du document des
# versions qui ne connaisse aucune exception (§1, règle 3).
readonly MOTIF_VERSION_EXACTE='^[0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.-]+)?$'

# node est employé pour lire le JSON et le YAML du lockfile. Ce n'est pas une
# dépendance nouvelle du script : depuis ce cycle, le dépôt ne se construit pas
# sans lui. Un analyseur JSON écrit en awk serait une seconde source de bogues.
p03_exiger_node() {
    if ! command -v node >/dev/null 2>&1; then
        printf '   ✗ node est introuvable — P-03 lit package.json et pnpm-lock.yaml.\n'
        return 1
    fi
}

# Rend « nom<TAB>version<TAB>champ » pour chaque dépendance déclarée.
p03_deps_declarees() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      for (const champ of ["dependencies", "devDependencies"]) {
        for (const [n, v] of Object.entries(p[champ] || {})) {
          process.stdout.write(n + "\t" + v + "\t" + champ + "\n");
        }
      }
    ' "$1"
}

# Rend la valeur d'un chemin scalaire du manifeste, ou la chaîne vide.
p03_lire_manifeste() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      let v = p;
      for (const cle of process.argv[2].split(".")) v = (v == null ? undefined : v[cle]);
      process.stdout.write(v == null ? "" : String(v));
    ' "$1" "$2"
}

# Rend « nom<TAB>specifier » pour chaque entrée de la section `importers:` du
# lockfile. Analyse par indentation : la forme est régulière et stable depuis
# lockfileVersion 9.0. \x27 est l'apostrophe — écrite ainsi pour ne pas rouvrir
# la citation shell au milieu du programme.
p03_lock_specifiers() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const lignes = fs.readFileSync(process.argv[1], "utf8").split("\n");
      let dans = false, nom = null;
      for (const l of lignes) {
        if (/^importers:/.test(l)) { dans = true; continue; }
        if (/^\S/.test(l)) { dans = false; }
        if (!dans) continue;
        let m = l.match(/^      (\x27?)(.+?)\1:\s*$/);
        if (m) { nom = m[2]; continue; }
        m = l.match(/^        specifier:\s*(.+?)\s*$/);
        if (m && nom !== null) { process.stdout.write(nom + "\t" + m[1] + "\n"); nom = null; }
      }
    ' "$1"
}

# Rend « nom<TAB>version<TAB>section<TAB>exigible » pour chaque ligne de version
# des tableaux §2, §3.1, §3.2 et §4.2 de docs/versions-reference.md.
#
# ⚠️ LES NOMS DU §2 SONT DES NOMS DE BRIQUE, PAS DES NOMS DE PAQUET — « Tailwind
# CSS » et non « tailwindcss ». La normalisation est donc explicite : minuscules,
# espaces retirés. Elle est écrite ici plutôt que devinée ailleurs.
#
# « exigible » vaut 0 quand la ligne ne peut pas correspondre à un manifeste :
#   — le nom est barré (`~~paquet~~`) : la ligne documente un ÉCARTEMENT ;
#   — la cellule de version n'est pas une version exacte (« ÉCARTÉ — … ») ;
#   — la ligne porte la marque « ⏳ phase 3 » : le paquet est inscrit et pas
#     encore installé, et on n'épingle pas dans un manifeste ce qu'on n'installe
#     pas (principe 10, « prêt ≠ construit »).
p03_doc_entrees() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const lignes = fs.readFileSync(process.argv[1], "utf8").split("\n");
      const EXACTE = /^[0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.-]+)?$/;
      const ENTETES = ["paquet", "crate", "brique", "service", ""];
      let section = "";
      for (const l of lignes) {
        const t = l.match(/^#{2,3}\s+(\d+(?:\.\d+)*)\.?\s+/);
        if (t) { section = "§" + t[1]; continue; }
        if (!/^\|/.test(l)) continue;
        if (!["§2", "§3.1", "§3.2"].includes(section)) continue;
        const cellules = l.split("|").slice(1, -1).map((c) => c.trim());
        if (cellules.length < 3) continue;
        const brut = section === "§2" ? cellules[1] : cellules[0];
        const cellVersion = section === "§2" ? cellules[2] : cellules[1];
        if (brut === undefined || /^-+$/.test(brut)) continue;
        const barre = /~~/.test(brut);
        let nom = brut.replace(/~~/g, "").replace(/\*\*/g, "").trim();
        const enCode = nom.match(/^`(.+)`$/);
        if (enCode) nom = enCode[1];
        else if (section === "§2") nom = nom.replace(/\(.*\)/g, "").toLowerCase().replace(/\s+/g, "");
        else continue;
        if (ENTETES.includes(nom.toLowerCase())) continue;
        let version = cellVersion.replace(/\*\*/g, "").replace(/[⚠️⏳]/gu, "").trim();
        const premier = version.split(/\s+/)[0] || "";
        const differee = /phase 3/.test(cellVersion);
        const exigible = !barre && EXACTE.test(premier) && !differee ? 1 : 0;
        process.stdout.write(nom + "\t" + premier + "\t" + section + "\t" + exigible + "\n");
      }
    ' "$1"
}

# Rend « image:tag » pour chaque service de compose.yml.
p03_images_compose() {
    grep -E '^[[:space:]]*image:[[:space:]]*' "$1" | sed -E 's/^[[:space:]]*image:[[:space:]]*//; s/[[:space:]]*$//'
}

# Rend « nom<TAB>version » pour les briques du §2 qui relèvent d'un manifeste
# ABSENT — celles de l'écosystème Rust. La porte les SAUTE ET LES NOMME plutôt
# que de rougir sur un Cargo.toml que la phase 3 n'a pas encore écrit.
readonly P03_BRIQUES_RUST="rust actixweb sqlx utoipa"
# Les briques du §2 servies par des images : compose.yml ne déclare qu'une base
# de VÉRIFICATION jetable, jamais le déploiement. Le sens document → manifeste y
# est HORS PÉRIMÈTRE, et c'est C3 qui tient le sens manifeste → document.
readonly P03_BRIQUES_IMAGE="postgresql redis garage"

porte_p03() {
    local racine="${1:-$RACINE}"
    local manifeste="$racine/package.json"
    local lockfile="$racine/pnpm-lock.yaml"
    local nvmrc="$racine/.nvmrc"
    local compose="$racine/compose.yml"
    local doc="$racine/docs/versions-reference.md"
    local workflows="$racine/.github/workflows"

    local echecs=0 nb_deps=0
    local deps lock doc_entrees fautifs nom version champ

    printf '\n── P-03 · aucune dépendance en intervalle, lockfile à jour, versions inscrites\n'

    p03_exiger_node || { printf '   ROUGE — P-03\n'; return "$CODE_ROUGE"; }

    # --- Point 2 du contrat : complétude du périmètre -----------------------
    local presents="" absents=""
    [ -f "$manifeste" ] && presents="$presents package.json" || absents="$absents package.json"
    [ -f "$lockfile" ]  && presents="$presents pnpm-lock.yaml" || absents="$absents pnpm-lock.yaml"
    [ -f "$nvmrc" ]     && presents="$presents .nvmrc" || absents="$absents .nvmrc"
    [ -f "$compose" ]   && presents="$presents compose.yml" || absents="$absents compose.yml"
    [ -f "$racine/Cargo.toml" ] && presents="$presents Cargo.toml" || absents="$absents Cargo.toml(phase 3)"

    printf '   Périmètre :%s\n' "$presents"
    printf '               manifeste(s) absent(s), non inspecté(s) :%s\n' "$absents"

    if [ ! -f "$manifeste" ]; then
        printf '   ✗ aucun manifeste JavaScript : la porte n'\''a rien à inspecter\n'
        printf '   ROUGE — P-03\n'
        return "$CODE_ROUGE"
    fi

    deps="$(p03_deps_declarees "$manifeste")" || { printf '   ✗ package.json illisible\n   ROUGE — P-03\n'; return "$CODE_ROUGE"; }
    nb_deps="$(printf '%s\n' "$deps" | grep -c . || true)"

    # --- Point 4 du contrat : non-vacuité, PLANCHER DÉRIVÉ ------------------
    #
    # Le plancher n'est pas une constante : c'est le nombre de dépendances que
    # les manifestes présents déclarent. Un package.json vidé par accident
    # ferait passer une porte à plancher constant bas ; il ne passe pas
    # celle-ci, parce que son plancher tombe à zéro EN MÊME TEMPS que sa cible.
    if [ "$nb_deps" -eq 0 ]; then
        printf '   Plancher  : 0 dépendance(s) inspectée(s) — VIDE\n'
        printf '   ✗ la cible de la porte est vide : un vert ne prouverait rien\n'
        printf '   ROUGE — P-03\n'
        return "$CODE_ROUGE"
    fi
    printf '   Plancher  : %d dépendance(s) inspectée(s) — non vide (dérivé des manifestes)\n' "$nb_deps"

    # === C1 · aucune version en intervalle ==================================
    fautifs=""
    while IFS=$'\t' read -r nom version champ; do
        [ -z "$nom" ] && continue
        if ! printf '%s' "$version" | grep -qE "$MOTIF_VERSION_EXACTE"; then
            fautifs="${fautifs}${nom} : « ${version} » dans ${champ}"$'\n'
        fi
    done <<< "$deps"

    local node_manifeste pm_manifeste pm_version
    node_manifeste="$(p03_lire_manifeste "$manifeste" engines.node)"
    pm_manifeste="$(p03_lire_manifeste "$manifeste" packageManager)"
    pm_version="${pm_manifeste#*@}"
    if ! printf '%s' "$node_manifeste" | grep -qE "$MOTIF_VERSION_EXACTE"; then
        fautifs="${fautifs}engines.node : « ${node_manifeste} »"$'\n'
    fi
    if ! printf '%s' "$pm_version" | grep -qE "$MOTIF_VERSION_EXACTE"; then
        fautifs="${fautifs}packageManager : « ${pm_manifeste} »"$'\n'
    fi
    fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
    rendre_verdict_p03 "aucune version en intervalle" "$((nb_deps + 2))" "$fautifs" || echecs=1

    # === C2 · le lockfile est présent et couvre tout ce qui est déclaré =====
    #
    # LIMITE ASSUMÉE : c'est une comparaison de texte entre deux fichiers du
    # dépôt. Elle ne résout rien et NE TOUCHE PAS LE RÉSEAU. Elle attrape le
    # lockfile absent, celui qui ignore une dépendance ajoutée, et celui dont la
    # version diverge du manifeste — les trois défaillances réelles. Elle
    # n'attrape pas une résolution transitive périmée alors que le sommet
    # coïncide : `--frozen-lockfile` est ce que le serveur d'intégration
    # ajoutera PAR-DESSUS, en phase 3, sans modifier ce script.
    if [ ! -f "$lockfile" ]; then
        printf '   ✗ %-32s pnpm-lock.yaml ABSENT — le lockfile doit être commité\n' "lockfile couvre"
        echecs=1
    else
        lock="$(p03_lock_specifiers "$lockfile")"
        fautifs=""
        while IFS=$'\t' read -r nom version champ; do
            [ -z "$nom" ] && continue
            local specifier
            specifier="$(printf '%s\n' "$lock" | awk -F'\t' -v n="$nom" '$1 == n { print $2; exit }')"
            if [ -z "$specifier" ]; then
                fautifs="${fautifs}${nom} : absente du lockfile"$'\n'
            elif [ "$specifier" != "$version" ]; then
                fautifs="${fautifs}${nom} : manifeste « ${version} », lockfile « ${specifier} »"$'\n'
            fi
        done <<< "$deps"
        fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
        rendre_verdict_p03 "lockfile couvre" "$nb_deps" "$fautifs" || echecs=1
    fi

    # === C3 · aucun tag d'image flottant ====================================
    #
    # Motif — la raison pour laquelle cette porte existait déjà à moitié dans le
    # dépôt : postgres:18.4 est épinglé À LA MAIN depuis le cycle D1, et rien ne
    # le vérifiait.
    if [ ! -f "$compose" ]; then
        printf '   · %-32s compose.yml absent — non inspecté\n' "tags d'image exacts"
    else
        local images nb_images=0
        images="$(p03_images_compose "$compose")"
        nb_images="$(printf '%s\n' "$images" | grep -c . || true)"
        fautifs=""
        local image tag depot
        while IFS= read -r image; do
            [ -z "$image" ] && continue
            case "$image" in
                *:*) tag="${image##*:}"; depot="${image%:*}" ;;
                *)   tag=""; depot="$image" ;;
            esac
            if [ -z "$tag" ]; then
                fautifs="${fautifs}${image} : aucun tag"$'\n'
            elif [ "$tag" = "latest" ] || [ "$tag" = "next" ] || [ "$tag" = "edge" ]; then
                fautifs="${fautifs}${image} : tag flottant « ${tag} »"$'\n'
            elif ! grep -qF "\`$image\`" "$doc"; then
                # Sens manifeste → document : une image servie doit être inscrite.
                fautifs="${fautifs}${image} : absente des tableaux de docs/versions-reference.md"$'\n'
            fi
        done <<< "$images"
        fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
        rendre_verdict_p03 "tags d'image exacts" "$nb_images" "$fautifs" || echecs=1
    fi

    # === C4 · l'environnement d'exécution coïncide ==========================
    #
    # Trois écritures, une seule valeur : .nvmrc, engines.node du manifeste, et
    # le §3.3 du document. Idem pour pnpm.
    local node_nvmrc node_doc pnpm_doc
    node_nvmrc="$( [ -f "$nvmrc" ] && tr -d ' \n\r' < "$nvmrc" || printf '' )"
    node_doc="$(awk -F'|' '/^\|[[:space:]]*\*\*Node\.js\*\*/ { print $3; exit }' "$doc" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
    pnpm_doc="$(awk -F'|' '/^\|[[:space:]]*\*\*pnpm\*\*/ { print $3; exit }' "$doc" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"

    fautifs=""
    [ -n "$node_nvmrc" ] || fautifs="${fautifs}.nvmrc absent ou vide"$'\n'
    [ "$node_nvmrc" = "$node_manifeste" ] || \
        fautifs="${fautifs}Node : .nvmrc « ${node_nvmrc} » ≠ engines.node « ${node_manifeste} »"$'\n'
    [ "$node_manifeste" = "$node_doc" ] || \
        fautifs="${fautifs}Node : engines.node « ${node_manifeste} » ≠ §3.3 « ${node_doc} »"$'\n'
    [ "$pm_version" = "$pnpm_doc" ] || \
        fautifs="${fautifs}pnpm : packageManager « ${pm_version} » ≠ §3.3 « ${pnpm_doc} »"$'\n'
    fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
    rendre_verdict_p03 "environnement cohérent" 4 "$fautifs" "(3 écritures Node, 1 valeur · pnpm)" || echecs=1

    # === C5 · le document et les manifestes disent la même chose, DEUX SENS ==
    #
    # LE SECOND SENS EST CELUI QUI MANQUE PARTOUT AILLEURS, et c'est celui qui a
    # laissé « sept crates absentes du document pendant six semaines » (§4.3).
    # Une comparaison à un seul sens autorise le document à mentir par omission.
    doc_entrees="$(p03_doc_entrees "$doc")"
    local nb_doc
    nb_doc="$(printf '%s\n' "$doc_entrees" | awk -F'\t' '$4 == 1' | grep -c . || true)"

    # -- Sens 1 : manifeste → document --------------------------------------
    #
    # ⚠️ LA RECHERCHE EXCLUT LE §3.1, ET CE N'EST PAS UN DÉTAIL : `uuid` existe
    # des DEUX CÔTÉS — crate Rust en 1.24.0 au §3.1, paquet npm en 14.0.1 au
    # §3.2. Une recherche par nom nu sur tout le document rendrait la première
    # ligne venue et accuserait le manifeste d'une divergence qui n'existe pas.
    # Un paquet npm se cherche au §3.2 ou parmi les briques du §2, jamais
    # ailleurs.
    fautifs=""
    while IFS=$'\t' read -r nom version champ; do
        [ -z "$nom" ] && continue
        local trouvee
        trouvee="$(printf '%s\n' "$doc_entrees" | awk -F'\t' -v n="$nom" '$1 == n && $3 != "§3.1" { print $2 "|" $3; exit }')"
        if [ -z "$trouvee" ]; then
            fautifs="${fautifs}${nom} : déclarée au manifeste, ABSENTE des tableaux §2/§3.x"$'\n'
        elif [ "${trouvee%%|*}" != "$version" ]; then
            fautifs="${fautifs}${nom} : manifeste « ${version} », document « ${trouvee%%|*} » (${trouvee##*|})"$'\n'
        fi
    done <<< "$deps"
    fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
    rendre_verdict_p03 "document ← manifeste" "$nb_deps" "$fautifs" "(premier sens)" || echecs=1

    # -- Sens 2 : document → manifeste --------------------------------------
    #
    # PORTÉE DÉCLARÉE, jamais devinée. Une entrée du document n'est exigible que
    # si le manifeste de sa famille EXISTE :
    #   §3.2 et briques JS du §2  → package.json, PRÉSENT   → exigibles
    #   §3.1 et briques Rust du §2 → Cargo.toml, ABSENT     → sautées et NOMMÉES
    #   briques d'image du §2      → compose.yml est une base de VÉRIFICATION,
    #                                jamais le déploiement : le sens document →
    #                                manifeste y est hors périmètre, et C3 tient
    #                                l'autre sens.
    local sautees=0
    fautifs=""
    local dnom dversion dsection dexigible
    while IFS=$'\t' read -r dnom dversion dsection dexigible; do
        [ -z "$dnom" ] && continue
        [ "$dexigible" = "1" ] || continue
        case " $P03_BRIQUES_RUST " in *" $dnom "*) sautees=$((sautees + 1)); continue ;; esac
        case " $P03_BRIQUES_IMAGE " in *" $dnom "*) sautees=$((sautees + 1)); continue ;; esac
        [ "$dsection" = "§3.1" ] && { sautees=$((sautees + 1)); continue; }
        local declaree
        declaree="$(printf '%s\n' "$deps" | awk -F'\t' -v n="$dnom" '$1 == n { print $2; exit }')"
        if [ -z "$declaree" ]; then
            fautifs="${fautifs}${dnom} (${dsection}) : inscrite au document, ABSENTE des manifestes"$'\n'
        elif [ "$declaree" != "$dversion" ]; then
            fautifs="${fautifs}${dnom} (${dsection}) : document « ${dversion} », manifeste « ${declaree} »"$'\n'
        fi
    done <<< "$doc_entrees"
    fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
    rendre_verdict_p03 "document → manifeste" "$((nb_doc - sautees))" "$fautifs" \
        "(second sens · $sautees ligne(s) sautée(s) : Rust et images, manifeste absent)" || echecs=1

    # === C6 · aucun workflow d'intégration continue =========================
    #
    # « Le serveur de CI vient en phase 3, pas avant » (constitution, principe
    # 13) — et RIEN D'AUTRE DANS LE DÉPÔT NE LE VÉRIFIE. Le contrôle est un test
    # de répertoire : coût nul, et il refuse le workflow que personne n'a encore
    # écrit. FR-073, SC-019.
    if [ -d "$workflows" ]; then
        printf '   ✗ %-32s %s existe\n' "aucun workflow d'intégration" ".github/workflows/"
        printf '     Le serveur d'\''intégration vient en PHASE 3, et il lancera ce script\n'
        printf '     SANS LE MODIFIER. D'\''ici là, un workflow est du périmètre entré par\n'
        printf '     la porte de service.\n'
        echecs=1
    else
        printf '   ✓ %-32s .github/workflows/ absent\n' "aucun workflow d'intégration"
    fi

    # === C7 · chaque dépendance porte sa justification, DEUX SENS ===========
    #
    # ⚠️ CONTRÔLE AJOUTÉ, ET IL EST LE PENDANT D'UN ÉCART DÉCLARÉ. La règle 4 du
    # §1 de versions-reference.md exige un commentaire au-dessus de chaque ligne
    # du manifeste ; LE FORMAT JSON N'ADMET PAS DE COMMENTAIRE. La justification
    # vit donc dans le bloc « versionsJustification » de package.json — et ce
    # contrôle est ce qui empêche l'écart de devenir une perte : un commentaire
    # ne se vérifie pas, ce bloc si, et dans les deux sens.
    local justifiees manquantes orphelines
    justifiees="$(node --input-type=commonjs -e '
      const fs = require("fs");
      const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const j = p.versionsJustification || {};
      for (const [n, e] of Object.entries(j)) {
        const complet = e && e.role && e.registre && e.verifieLe ? "1" : "0";
        process.stdout.write(n + "\t" + complet + "\n");
      }
    ' "$manifeste")"

    fautifs=""
    while IFS=$'\t' read -r nom version champ; do
        [ -z "$nom" ] && continue
        local etat
        etat="$(printf '%s\n' "$justifiees" | awk -F'\t' -v n="$nom" '$1 == n { print $2; exit }')"
        if [ -z "$etat" ]; then
            fautifs="${fautifs}${nom} : aucune entrée dans versionsJustification"$'\n'
        elif [ "$etat" != "1" ]; then
            fautifs="${fautifs}${nom} : justification incomplète (rôle, registre et date sont dus)"$'\n'
        fi
    done <<< "$deps"
    while IFS=$'\t' read -r nom etat; do
        [ -z "$nom" ] && continue
        if ! printf '%s\n' "$deps" | awk -F'\t' -v n="$nom" '$1 == n { trouve = 1 } END { exit !trouve }'; then
            fautifs="${fautifs}${nom} : justifiée sans être déclarée — le bloc est devenu une photo périmée"$'\n'
        fi
    done <<< "$justifiees"
    fautifs="$(printf '%s' "$fautifs" | grep -v '^$' || true)"
    rendre_verdict_p03 "justification, deux sens" "$nb_deps" "$fautifs" || echecs=1

    if [ "$echecs" -ne 0 ]; then
        printf '   ROUGE — P-03\n'
        return "$CODE_ROUGE"
    fi
    printf '   VERT\n'
    return "$CODE_OK"
}

# Verdict d'un contrôle de P-03. Distinct de `rendre_verdict`, qui préfixe les
# objets fautifs par « MANQUANTE : » — un mot juste pour une politique absente,
# faux pour un intervalle de version, qui est présent et mauvais.
rendre_verdict_p03() {
    local libelle="$1" total="$2" fautifs="$3" precision="${4:-}"
    local nombre=0

    [ -n "$fautifs" ] && nombre="$(printf '%s\n' "$fautifs" | grep -c . || true)"

    if [ "$nombre" -eq 0 ]; then
        printf '   ✓ %-32s %d/%d %s\n' "$libelle" "$total" "$total" "$precision"
        return 0
    fi

    printf '   ✗ %-32s %d/%d %s\n' "$libelle" "$((total - nombre))" "$total" "$precision"
    printf '%s\n' "$fautifs" | sed 's/^/     FAUTIF : /'
    return 1
}

# =============================================================================
# P-04 · l'application démarre et chaque écran construit s'atteint
# =============================================================================
#
# LA FAMILLE DE DÉFAUTS LA PLUS COÛTEUSE DE LA PHASE 2 : un écran inatteignable
# pendant que tous les tests sont verts. Un test qui monte un composant contourne
# le routeur, la suspension, les gabarits et les greffons — c'est-à-dire
# exactement les quatre mécanismes que cette phase doit prouver.
#
# PÉRIMÈTRE INSPECTÉ (point 1 du contrat de porte)
#   .rapports/routes-du-build.json   l'inventaire des routes RÉELLEMENT servies,
#                                    écrit par le crochet `pages:resolved` de
#                                    nuxt.config.ts. ⚠️ JAMAIS UNE LISTE ÉCRITE À
#                                    LA MAIN : une liste vidée par accident ferait
#                                    inspecter zéro route à la porte, qui
#                                    resterait verte.
#   app/core/ecrans/index.ts         les entrées de l'index et leur avancement.
#                                    ⚠️ LA PAGE /_ecrans REND CE MODULE ET LA
#                                    PORTE LIT CE MODULE : une seule source, donc
#                                    rien qui puisse diverger.
#
# ⚠️ AUCUN CONTENEUR. La porte construit l'application et la sert localement avec
# node. C'est ce qui la rend exécutable sur le poste d'Abengourou, où P-01, P-02
# et P-05 ne le sont pas.

readonly INVENTAIRE_ROUTES="$RACINE/.rapports/routes-du-build.json"
readonly INDEX_ECRANS="app/core/ecrans/index.ts"

# Un port à part, et le motif est prosaïque : `pnpm dev` occupe le 3000 sur le
# poste de développement, et une porte qui échoue parce qu'on avait laissé un
# serveur ouvert est une porte qu'on cesse de croire.
readonly PORT_P04=4173
readonly DELAI_SERVEUR=60

serveur_pid=""

arreter_serveur() {
    [ -n "$serveur_pid" ] || return 0
    kill "$serveur_pid" >/dev/null 2>&1 || true
    wait "$serveur_pid" 2>/dev/null || true
    serveur_pid=""
}

# Répond-il ? Par node, jamais par curl : node est déjà exigé par P-03 et par la
# construction, curl serait un prérequis de plus pour un aller-retour HTTP.
p04_repond() {
    node --input-type=module -e '
      const url = process.argv[1]
      try {
        const r = await fetch(url, { redirect: "manual" })
        process.exit(r.status >= 200 && r.status < 400 ? 0 : 1)
      } catch { process.exit(1) }
    ' "http://127.0.0.1:$PORT_P04/" >/dev/null 2>&1
}

# Rend « route » par ligne, depuis l'inventaire écrit par la construction.
p04_routes_du_build() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const inv = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      for (const route of inv.routes || []) process.stdout.write(route + "\n");
    ' "$1"
}

# Le drapeau de la page témoin, tel que LA CONSTRUCTION l'a vu.
p04_drapeau_temoin() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const inv = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      process.stdout.write(inv.pageTemoin ? "1" : "0");
    ' "$1"
}

# Rend « route<TAB>avancement » pour chaque entrée d'index qui porte une route.
#
# ⚠️ LE DRAPEAU VIENT DE L'INVENTAIRE, PAS DE L'ENVIRONNEMENT DU SCRIPT. C'est ce
# qui rend impossible la divergence : la porte lit l'index dans l'état où la
# construction l'a lu, quel que soit l'état du drapeau au moment où on la lance.
p04_entrees_index() {
    KAYA_PAGE_TEMOIN="$2" node --input-type=module -e '
      const { pathToFileURL } = await import("node:url")
      const module_ = await import(pathToFileURL(process.argv[1]).href)
      for (const entree of module_.toutesLesEntrees()) {
        if (entree.route === null) continue
        process.stdout.write(entree.route + "\t" + entree.avancement + "\n")
      }
    ' "$1"
}

# Empreinte de ce que P-04 INSPECTE. L'inventaire des routes n'y est pas, et le
# motif est écrit : il est PRODUIT par la construction que la porte lance, donc
# le relever reviendrait à accuser la porte d'avoir fabriqué sa propre entrée.
empreinte_p04() {
    { cksum < "$RACINE/$INDEX_ECRANS"
      find "$RACINE/tests/navigateur" -type f | LC_ALL=C sort | xargs cksum; } | cksum
}

# porte_p04 <racine des sources> <inventaire des routes> <matrice: oui|non>
porte_p04() {
    local racine="${1:-$RACINE}"
    local inventaire="${2:-$INVENTAIRE_ROUTES}"
    local matrice="${3:-oui}"
    local index="$racine/$INDEX_ECRANS"

    local echecs=0

    printf '\n── P-04 · l'\''application démarre et chaque écran construit s'\''atteint\n'

    # --- Point 2 du contrat : complétude du périmètre -----------------------
    if [ ! -f "$index" ]; then
        printf '   ✗ l'\''index des écrans est introuvable : %s\n' "$index"
        printf '   ROUGE — P-04\n'
        return "$CODE_ROUGE"
    fi

    # --- C1 · l'application démarre -----------------------------------------
    # Un échec ici ARRÊTE LA PORTE : inspecter des routes sur une application qui
    # ne démarre pas donnerait un second message sans second diagnostic.
    if [ "$matrice" = "oui" ]; then
        assurer_build || { printf '   ✗ C1 — la construction a échoué\n   ROUGE — P-04\n'; return "$CODE_ROUGE"; }
    fi

    if [ ! -f "$inventaire" ]; then
        printf '   ✗ l'\''inventaire des routes est introuvable : %s\n' "$inventaire"
        printf '     Il est écrit par le crochet « pages:resolved » de nuxt.config.ts, à la construction.\n'
        printf '   ROUGE — P-04\n'
        return "$CODE_ROUGE"
    fi

    local drapeau routes entrees
    drapeau="$(p04_drapeau_temoin "$inventaire")"
    routes="$(p04_routes_du_build "$inventaire")"
    entrees="$(p04_entrees_index "$index" "$drapeau")" || {
        printf '   ✗ l'\''index des écrans n'\''est pas lisible sous node\n'
        printf '   ROUGE — P-04\n'
        return "$CODE_ROUGE"
    }

    local nb_routes nb_entrees construits nb_construits pas_commences nb_pas_commences
    nb_routes="$(printf '%s\n' "$routes" | grep -c . || true)"
    nb_entrees="$(printf '%s\n' "$entrees" | grep -c . || true)"
    construits="$(printf '%s\n' "$entrees" | awk -F'\t' '$2 == "CONSTRUIT" { print $1 }' | LC_ALL=C sort -u)"
    nb_construits="$(printf '%s\n' "$construits" | grep -c . || true)"
    pas_commences="$(printf '%s\n' "$entrees" | awk -F'\t' '$2 != "CONSTRUIT" { print $1 }' | LC_ALL=C sort -u)"
    nb_pas_commences="$(printf '%s\n' "$pas_commences" | grep -c . || true)"

    printf '   Périmètre : %d route(s) au routeur · %d entrée(s) d'\''index à route\n' \
        "$nb_routes" "$nb_entrees"
    printf '               dont %d CONSTRUIT — %d « pas commencé », NON EXIGIBLES\n' \
        "$nb_construits" "$nb_pas_commences"
    printf '               page témoin à la construction : %s\n' \
        "$([ "$drapeau" = "1" ] && printf 'oui' || printf 'non')"

    # --- Non-vacuité · le plancher est DÉRIVÉ DU ROUTEUR --------------------
    # ⚠️ C'EST UN MEILLEUR PLANCHER QUE CEUX DE P-01, P-02 ET P-05, ET IL VAUT
    # D'ÊTRE DIT. Les trois autres portent une CONSTANTE qu'un cycle doit penser
    # à relever — le cycle D2 a dû relever les trois. Celui-ci CROÎT TOUT SEUL
    # avec l'application, parce que sa source est le routeur. Le seul cas qu'il
    # ne couvre pas est celui d'un routeur vide, et c'est exactement ce que la
    # non-vacuité attrape.
    if [ "$nb_routes" -eq 0 ]; then
        printf '   ✗ Plancher : le routeur est VIDE — la porte n'\''inspecterait rien\n'
        printf '   ROUGE — P-04\n'
        return "$CODE_ROUGE"
    fi
    if [ "$nb_construits" -eq 0 ]; then
        printf '   ✗ Plancher : aucune entrée CONSTRUIT — la matrice serait vide\n'
        printf '   ROUGE — P-04\n'
        return "$CODE_ROUGE"
    fi
    printf '   Plancher  : routeur non vide · au moins un écran construit — atteint\n'
    printf '   Passages  : %d × 2 thèmes × 2 moteurs = %d\n' \
        "$nb_construits" "$((nb_construits * 4))"

    # --- C1 (suite) · le serveur local répond -------------------------------
    if [ "$matrice" = "oui" ]; then
        arreter_serveur
        # ⚠️ `exec` N'EST PAS DÉCORATIF ICI, ET LE CONSTAT L'A IMPOSÉ. Sans lui,
        # `$!` est le PID du SOUS-SHELL, pas celui de node : `kill` tuait le
        # sous-shell et LAISSAIT LE SERVEUR VIVANT sur le port. La porte suivante
        # trouvait un serveur qu'elle croyait avoir monté, servant un build
        # PRÉCÉDENT — un vert qui n'aurait rien prouvé de la construction du
        # jour. Constaté en relevant les processus après une exécution.
        (cd "$RACINE" && exec env PORT="$PORT_P04" NITRO_PORT="$PORT_P04" HOST=127.0.0.1 \
            node .output/server/index.mjs >/dev/null 2>&1) &
        serveur_pid=$!
        local attente=0
        while [ "$attente" -lt "$DELAI_SERVEUR" ]; do
            p04_repond && break
            sleep 1
            attente=$((attente + 1))
        done
        if ! p04_repond; then
            printf '   ✗ C1 — le serveur local ne répond pas après %d s sur le port %d\n' \
                "$DELAI_SERVEUR" "$PORT_P04"
            arreter_serveur
            printf '   ROUGE — P-04\n'
            return "$CODE_ROUGE"
        fi
        printf '   ✓ %-34s port %d\n' 'C1 · l'\''application démarre' "$PORT_P04"
    fi

    # --- C2 · toute route atteignable est déclarée — PREMIER SENS -----------
    # C'est le sens qui empêche un écran d'exister sans que personne le sache —
    # la dérive que l'index existe pour refuser.
    local index_routes orphelines nb_orphelines
    index_routes="$(printf '%s\n' "$entrees" | cut -f1 | LC_ALL=C sort -u)"
    orphelines="$(LC_ALL=C comm -23 <(printf '%s\n' "$routes" | LC_ALL=C sort -u) <(printf '%s\n' "$index_routes"))"
    nb_orphelines="$(printf '%s\n' "$orphelines" | grep -c . || true)"
    if [ "$nb_orphelines" -eq 0 ]; then
        printf '   ✓ %-34s %d/%d (premier sens)\n' 'routes ⊆ index' "$nb_routes" "$nb_routes"
    else
        printf '   ✗ %-34s %d/%d (PREMIER SENS — route atteignable NON DÉCLARÉE)\n' \
            'routes ⊆ index' "$((nb_routes - nb_orphelines))" "$nb_routes"
        printf '%s\n' "$orphelines" | sed 's/^/     NON DÉCLARÉE À L'\''INDEX : /'
        echecs=$((echecs + 1))
    fi

    # --- C3 · toute entrée CONSTRUIT est atteignable — SECOND SENS, BORNÉ ---
    # ⚠️ LA BORNE EST LE POINT DU CONTRAT. L'index porte 46 écrans du produit
    # dont 43 « pas commencé » : exiger l'atteignabilité de TOUTES les entrées
    # rendrait la porte rouge dès son premier jour, et on la désactiverait sous
    # trois semaines. Seul l'état CONSTRUIT est exigible — et c'est ce qui fait
    # de l'index un plan de charge autant qu'un contrôle.
    local inatteignables nb_inatteignables
    inatteignables="$(LC_ALL=C comm -23 <(printf '%s\n' "$construits") <(printf '%s\n' "$routes" | LC_ALL=C sort -u))"
    nb_inatteignables="$(printf '%s\n' "$inatteignables" | grep -c . || true)"
    if [ "$nb_inatteignables" -eq 0 ]; then
        printf '   ✓ %-34s %d/%d (second sens)\n' 'index[CONSTRUIT] ⊆ routes' \
            "$nb_construits" "$nb_construits"
    else
        printf '   ✗ %-34s %d/%d (SECOND SENS — entrée CONSTRUIT INATTEIGNABLE)\n' \
            'index[CONSTRUIT] ⊆ routes' "$((nb_construits - nb_inatteignables))" "$nb_construits"
        printf '%s\n' "$inatteignables" | sed 's/^/     CONSTRUIT MAIS INATTEIGNABLE : /'
        echecs=$((echecs + 1))
    fi

    # Le troisième constat, qui n'est pas un contrôle : une entrée « pas
    # commencé » et inatteignable NE DOIT PAS faire rougir. On l'imprime pour
    # qu'on voie que la borne mord vraiment, et sur combien d'entrées.
    local dormantes nb_dormantes
    dormantes="$(LC_ALL=C comm -23 <(printf '%s\n' "$pas_commences") <(printf '%s\n' "$routes" | LC_ALL=C sort -u))"
    nb_dormantes="$(printf '%s\n' "$dormantes" | grep -c . || true)"
    printf '   · %d entrée(s) « pas commencé » et inatteignable(s) — non exigibles, la borne les couvre\n' \
        "$nb_dormantes"

    # Un échec de C2 ou C3 arrête ici : lancer la matrice sur un index
    # incohérent donnerait un second message sans second diagnostic.
    if [ "$echecs" -gt 0 ]; then
        arreter_serveur
        printf '   ROUGE — P-04\n'
        return "$CODE_ROUGE"
    fi

    # --- C4 · la matrice, et les QUATRE SUITES DE NAVIGATEUR ---------------
    # ⚠️ C'EST ICI QUE LES SUITES ENTRENT DANS LE SCRIPT, ET PAS AILLEURS. La
    # porte monte déjà l'application et pilote les deux moteurs : les lancer
    # séparément serait quatre contrôles de plus qu'on lancerait de mémoire.
    if [ "$matrice" = "oui" ]; then
        if ! (cd "$RACINE" && KAYA_PAGE_TEMOIN="$drapeau" KAYA_PORT="$PORT_P04" \
                pnpm test:navigateur) > "$RACINE/.rapports/p04-navigateur.log" 2>&1; then
            printf '   ✗ %-34s la matrice a rougi\n' 'rendu, thème, jetons, contraste'
            tail -n 60 "$RACINE/.rapports/p04-navigateur.log" | sed 's/^/     | /'
            arreter_serveur
            printf '   ROUGE — P-04\n'
            return "$CODE_ROUGE"
        fi
        local resume
        resume="$(grep -E '^ *[0-9]+ (passed|flaky)' "$RACINE/.rapports/p04-navigateur.log" | tail -n 1 | sed 's/^ *//')"
        printf '   ✓ %-34s %s\n' 'les suites de navigateur' "${resume:-vertes}"
        arreter_serveur
    else
        printf '   · matrice non exécutée (mode « les deux sens » du test négatif)\n'
    fi

    printf '   VERT\n'
    return "$CODE_OK"
}

# =============================================================================
# P-06 · tout point d'entrée est branché ou dû, et tout branché est exercé
# =============================================================================
#
# L'ERREUR RÉELLE EST DOCUMENTÉE DANS LE DÉPÔT, et c'est ce qui autorise la
# porte (principe 13) : `docs/design/lexique.md` version 1.3.0 — « fermerSession()
# existait depuis le cycle CPT SANS AUCUN APPELANT — il n'y avait,
# littéralement, aucun moyen de sortir de sa session ». Une fonction écrite,
# compilée, passant le lint et les tests, et que rien n'appelait.
#
# ⚠️ DEUX ÉTATS, ET NON UN. Un contrôle « aucun export sans appelant » rendrait
# rouge toute méthode légitimement en attente de la phase 3 — et ce cycle en
# livre une trentaine. C'est « dû » qui rend la porte tenable, et c'est le SECOND
# SENS qui l'empêche d'être muette : sans lui, tout déclarer « branché »
# suffirait à la faire taire pour toujours.
#
# PÉRIMÈTRE INSPECTÉ (point 1 du contrat de porte)
#   docs/points-entree.md          le registre — l'INTENTION, déclarée à la main
#   la sortie JSON de `knip`       le FAIT — les exports sans référence
#   .rapports/couverture/          la couverture PAR FONCTION, pour « exercé »
#
# ⚠️ CE QUI REND LA PORTE FIABLE N'EST PAS KNIP, C'EST UNE DÉCISION DE
# CONCEPTION. L'auto-import de Nuxt supprime les instructions `import` : un
# composant employé dans un gabarit ne serait référencé nulle part, et toute
# analyse statique le déclarerait mort. La parade est structurelle — LE GUIDE DE
# STYLE IMPORTE LES SEIZE COMPOSANTS EXPLICITEMENT, un par un —, et la porte le
# vérifie plutôt que de l'espérer.

readonly REGISTRE_POINTS="docs/points-entree.md"
readonly COUVERTURE_JSON=".rapports/couverture/coverage-final.json"

# Planchers, posés JUSTE SOUS LE RÉEL à la clôture du cycle : 121 entrées, 30
# « dû », 9 « unité ». Un plancher se règle juste sous la valeur réelle, jamais
# loin en dessous — sinon il cesse de mordre au premier retrait.
readonly PLANCHER_ENTREES=110
readonly PLANCHER_DUS=25
readonly PLANCHER_UNITE=8
readonly COMPOSANTS_CANONIQUES=16

# Rend « chemin#nom<TAB>etat<TAB>exerce » pour chaque ligne du registre.
p06_registre() {
    awk -F'|' '
        /^\| `[^`]+` \| (branché|dû) \|/ {
            cle = $2; etat = $3; exerce = $4
            gsub(/[` ]/, "", cle); gsub(/^ +| +$/, "", etat); gsub(/^ +| +$/, "", exerce)
            print cle "\t" etat "\t" exerce
        }
    ' "$1"
}

# Rend « chemin#nom » pour chaque export SANS RÉFÉRENCE que knip rapporte.
#
# ⚠️ KNIP SORT EN CODE 1 DÈS QU'IL TROUVE QUELQUE CHOSE, ET C'EST SON MODE
# NORMAL ICI : le dépôt porte trente entrées « dû », donc knip a toujours
# quelque chose à dire. Traiter son code de sortie comme un échec ferait rougir
# la porte sur le cas nominal ; c'est la SORTIE qu'on lit, pas le statut. En
# revanche, une sortie qui ne contient pas de JSON est une vraie panne, et la
# porte la distingue.
p06_sans_reference() {
    local sortie
    sortie="$( (cd "$RACINE" && pnpm knip) 2>/dev/null )" || true
    printf '%s' "$sortie" | node --input-type=commonjs -e '
      let brut = "";
      process.stdin.on("data", (d) => (brut += d));
      process.stdin.on("end", () => {
        const i = brut.indexOf("{\"issues\"");
        if (i < 0) { process.exit(2); }
        const j = JSON.parse(brut.slice(i, brut.lastIndexOf("}") + 1));
        // Le jeu de donnees est HORS PERIMETRE, et declare comme tel dans le
        // registre : app/core/donnees/jeux/ DISPARAIT au branchement de la
        // phase 3. Y tenir un registre reviendrait a tenir la comptabilite de
        // ce que le cycle suivant supprimera.
        // (Sans accent ni apostrophe : ce programme vit dans une chaine shell.)
        const horsPerimetre = (chemin) => chemin.includes("/donnees/jeux/");
        for (const it of j.issues) {
          if (horsPerimetre(it.file)) continue;
          for (const e of it.exports || []) process.stdout.write(it.file + "#" + e.name + "\n");
          // Un FICHIER inutilise sort sous sa cle de registre — le chemin nu,
          // sans « # » : c est ainsi qu un composant est inscrit, et les deux
          // ensembles doivent parler la meme langue pour etre comparables.
          for (const f of it.files || []) {
            if (!horsPerimetre(f.name)) process.stdout.write(f.name + "\n");
          }
        }
      });
    '
}

# Rend « chemin#nom » pour chaque fonction du rapport de couverture ayant AU
# MOINS UN PASSAGE. Par FONCTION, jamais par fichier : « ce fichier est testé »
# et « cette méthode est appelée par un test » ne sont pas la même affirmation.
p06_fonctions_exercees() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const rapport = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      // Le rapport porte des chemins ABSOLUS, ceux de la machine qui a lance
      // les tests. On relativise sur le segment app/ plutot que sur la racine
      // passee : le test negatif fait tourner la porte depuis une COPIE, et une
      // relativisation sur la racine y rendrait alors ZERO fonction exercee —
      // la porte aurait rougi sur une copie intacte, en accusant le produit.
      for (const [absolu, d] of Object.entries(rapport)) {
        const i = absolu.lastIndexOf("/app/");
        const rel = i >= 0 ? absolu.slice(i + 1) : absolu;
        for (const [k, fn] of Object.entries(d.fnMap || {})) {
          if ((d.f || {})[k] > 0) process.stdout.write(rel + "#" + fn.name + "\n");
        }
      }
    ' "$1"
}

# porte_p06 <racine des sources> [fichier de rapport knip]
#
# ⚠️ LE SECOND ARGUMENT EXISTE POUR LES TESTS NÉGATIFS, ET IL EST DÉCLARÉ ICI
# PLUTÔT QUE CACHÉ. `knip` analyse LE DÉPÔT, pas une copie de travail : sans lui,
# aucune mutation ne pourrait produire « ce point d'entrée a acquis un appelant »
# sans écrire dans le dépôt — ce qu'une porte ne fait jamais. La mutation porte
# donc sur L'ENTRÉE de la porte, ce qui est exactement ce qu'on veut éprouver :
# la porte confronte deux ensembles, et on lui en donne un faux.
porte_p06() {
    local racine="${1:-$RACINE}"
    local rapport_knip="${2:-}"
    local registre="$racine/$REGISTRE_POINTS"
    local guide="$racine/app/pages/guide-de-style.vue"
    local echecs=0

    printf '\n── P-06 · tout point d'\''entrée est branché ou dû, et tout branché est exercé\n'

    if [ ! -f "$registre" ]; then
        printf '   ✗ le registre est introuvable : %s\n' "$registre"
        printf '   ROUGE — P-06\n'
        return "$CODE_ROUGE"
    fi

    local entrees sans_ref nb_entrees nb_sans_ref
    entrees="$(p06_registre "$registre")"
    if [ -n "$rapport_knip" ]; then
        sans_ref="$(cat "$rapport_knip")"
        printf '   Source : rapport fourni (%s) — mode test négatif\n' "$(basename "$rapport_knip")"
    elif ! sans_ref="$(p06_sans_reference)"; then
        printf '   ✗ la sortie de knip ne contient aucun JSON — la porte ne peut RIEN prouver.\n'
        printf '     Un rapport illisible rendrait tout « dû » faux et tout « branché » vrai.\n'
        printf '   ROUGE — P-06\n'
        return "$CODE_ROUGE"
    fi

    nb_entrees="$(printf '%s\n' "$entrees" | grep -c . || true)"
    nb_sans_ref="$(printf '%s\n' "$sans_ref" | grep -c . || true)"

    local dus branches unite
    dus="$(printf '%s\n' "$entrees" | awk -F'\t' '$2 == "dû" { print $1 }' | LC_ALL=C sort -u)"
    branches="$(printf '%s\n' "$entrees" | awk -F'\t' '$2 == "branché" { print $1 }' | LC_ALL=C sort -u)"
    unite="$(printf '%s\n' "$entrees" | awk -F'\t' '$3 == "unité" { print $1 }' | LC_ALL=C sort -u)"

    local nb_dus nb_branches nb_unite
    nb_dus="$(printf '%s\n' "$dus" | grep -c . || true)"
    nb_branches="$(printf '%s\n' "$branches" | grep -c . || true)"
    nb_unite="$(printf '%s\n' "$unite" | grep -c . || true)"

    printf '   Périmètre : %d entrée(s) au registre · %d export(s) sans référence chez knip\n' \
        "$nb_entrees" "$nb_sans_ref"
    printf '               %d « branché » · %d « dû » · %d exercé(s) par les tests d'\''unité\n' \
        "$nb_branches" "$nb_dus" "$nb_unite"

    # --- Non-vacuité · TROIS planchers, des deux côtés ----------------------
    # ⚠️ LE PLUS IMPORTANT EST CELUI DES « DÛ ». Un rapport knip devenu vide —
    # configuration cassée, chemin changé — rendrait TOUT « dû » faux et TOUT
    # « branché » vrai, et la porte passerait au vert EN NE COMPARANT PLUS RIEN.
    # C'est exactement le mode de défaillance qu'un plancher existe pour refuser.
    local plancher_rouge=0
    [ "$nb_entrees" -lt "$PLANCHER_ENTREES" ] && plancher_rouge=1
    [ "$nb_dus" -lt "$PLANCHER_DUS" ] && plancher_rouge=1
    [ "$nb_unite" -lt "$PLANCHER_UNITE" ] && plancher_rouge=1
    if [ "$plancher_rouge" -eq 1 ]; then
        printf '   ✗ Plancher : %d entrée(s) (min %d) · %d « dû » (min %d) · %d unité (min %d)\n' \
            "$nb_entrees" "$PLANCHER_ENTREES" "$nb_dus" "$PLANCHER_DUS" "$nb_unite" "$PLANCHER_UNITE"
        printf '   ROUGE — P-06\n'
        return "$CODE_ROUGE"
    fi
    printf '   Planchers : %d/%d entrée(s) · %d/%d « dû » · %d/%d unité — atteints des trois côtés\n' \
        "$nb_entrees" "$PLANCHER_ENTREES" "$nb_dus" "$PLANCHER_DUS" "$nb_unite" "$PLANCHER_UNITE"

    # --- C0 · le guide de style importe les SEIZE composants EXPLICITEMENT --
    # Sans cette condition, l'analyse reposerait sur une heuristique d'auto-
    # import et déclarerait mort tout le design system.
    # ⚠️ ON COMPTE LES CHEMINS IMPORTÉS, PAS LES LIGNES `import`, et le constat
    # l'a imposé : le seizième composant est importé avec un type nommé, donc
    # sur TROIS lignes. Un motif ancré sur « ^import … from » en trouvait quinze
    # et faisait rougir la porte sur un guide parfaitement conforme.
    local imports_explicites
    imports_explicites="$(grep -oE "from '~/core/design-system/[A-Za-z]+\.vue'" "$guide" \
        | LC_ALL=C sort -u | grep -c . || true)"
    if [ "$imports_explicites" -lt "$COMPOSANTS_CANONIQUES" ]; then
        printf '   ✗ %-38s %d/%d\n' 'le guide importe explicitement' "$imports_explicites" "$COMPOSANTS_CANONIQUES"
        printf '     Sans les imports explicites, knip déclarerait mort TOUT le design system.\n'
        echecs=$((echecs + 1))
    else
        printf '   ✓ %-38s %d/%d (ce qui rend l'\''analyse fiable)\n' \
            'le guide importe explicitement' "$imports_explicites" "$COMPOSANTS_CANONIQUES"
    fi

    # --- C1 · un « dû » DOIT être sans référence — PREMIER SENS -------------
    local acquis nb_acquis
    acquis="$(LC_ALL=C comm -23 <(printf '%s\n' "$dus") <(printf '%s\n' "$sans_ref" | LC_ALL=C sort -u))"
    nb_acquis="$(printf '%s\n' "$acquis" | grep -c . || true)"
    if [ "$nb_acquis" -eq 0 ]; then
        printf '   ✓ %-38s %d/%d (premier sens)\n' '« dû » sans appelant' "$nb_dus" "$nb_dus"
    else
        printf '   ✗ %-38s %d/%d (PREMIER SENS — a ACQUIS un appelant)\n' \
            '« dû » sans appelant' "$((nb_dus - nb_acquis))" "$nb_dus"
        printf '%s\n' "$acquis" | sed 's/^/     A ACQUIS UN APPELANT : /'
        printf '     L'\''état passe à « branché » dans le même changement.\n'
        echecs=$((echecs + 1))
    fi

    # --- C2 · un « branché » NE DOIT PAS être sans référence — SECOND SENS --
    # ⚠️ C'EST LE SENS QUI COMPTE LE PLUS, et c'est celui qu'on oublie d'écrire.
    local perdus nb_perdus
    perdus="$(LC_ALL=C comm -12 <(printf '%s\n' "$branches") <(printf '%s\n' "$sans_ref" | LC_ALL=C sort -u))"
    nb_perdus="$(printf '%s\n' "$perdus" | grep -c . || true)"
    if [ "$nb_perdus" -eq 0 ]; then
        printf '   ✓ %-38s %d/%d (second sens)\n' '« branché » avec appelant' "$nb_branches" "$nb_branches"
    else
        printf '   ✗ %-38s %d/%d (SECOND SENS — a PERDU son dernier appelant)\n' \
            '« branché » avec appelant' "$((nb_branches - nb_perdus))" "$nb_branches"
        printf '%s\n' "$perdus" | sed 's/^/     A PERDU SON DERNIER APPELANT : /'
        echecs=$((echecs + 1))
    fi

    # --- C3 · aucun export sans référence HORS REGISTRE ---------------------
    # Une unité hors registre échappe aux deux sens : elle ne peut ni acquérir
    # ni perdre, puisque personne n'a déclaré ce qu'elle devait être.
    local hors nb_hors toutes_cles
    toutes_cles="$(printf '%s\n' "$entrees" | cut -f1 | LC_ALL=C sort -u)"
    hors="$(LC_ALL=C comm -23 <(printf '%s\n' "$sans_ref" | LC_ALL=C sort -u) <(printf '%s\n' "$toutes_cles"))"
    nb_hors="$(printf '%s\n' "$hors" | grep -c . || true)"
    if [ "$nb_hors" -eq 0 ]; then
        printf '   ✓ %-38s %d/%d\n' 'aucun export hors registre' "$nb_sans_ref" "$nb_sans_ref"
    else
        printf '   ✗ %-38s %d/%d\n' 'aucun export hors registre' "$((nb_sans_ref - nb_hors))" "$nb_sans_ref"
        printf '%s\n' "$hors" | sed 's/^/     HORS REGISTRE : /'
        echecs=$((echecs + 1))
    fi

    # --- C4 · tout « exercé par : unité » porte au moins un passage ---------
    if [ ! -f "$racine/$COUVERTURE_JSON" ]; then
        printf '   ✗ le rapport de couverture est absent : %s\n' "$COUVERTURE_JSON"
        printf '     Lancez « pnpm test:couverture » — la porte le fait elle-même en mode complet.\n'
        echecs=$((echecs + 1))
    else
        local exercees non_exercees nb_non_exercees
        exercees="$(p06_fonctions_exercees "$racine/$COUVERTURE_JSON" | LC_ALL=C sort -u)"
        non_exercees="$(LC_ALL=C comm -23 <(printf '%s\n' "$unite") <(printf '%s\n' "$exercees"))"
        nb_non_exercees="$(printf '%s\n' "$non_exercees" | grep -c . || true)"
        if [ "$nb_non_exercees" -eq 0 ]; then
            printf '   ✓ %-38s %d/%d (couverture PAR FONCTION)\n' \
                '« unité » exercé par un test' "$nb_unite" "$nb_unite"
        else
            printf '   ✗ %-38s %d/%d (couverture PAR FONCTION)\n' \
                '« unité » exercé par un test' "$((nb_unite - nb_non_exercees))" "$nb_unite"
            printf '%s\n' "$non_exercees" | sed 's/^/     ZÉRO PASSAGE : /'
            echecs=$((echecs + 1))
        fi
        printf '   · %d entrée(s) « navigateur » — leur preuve est P-04, dans la même commande\n' \
            "$((nb_branches - nb_unite))"
    fi

    if [ "$echecs" -gt 0 ]; then
        printf '   ROUGE — P-06\n'
        return "$CODE_ROUGE"
    fi
    printf '   VERT\n'
    return "$CODE_OK"
}

# =============================================================================
# Tests négatifs — la preuve qu'une porte SAIT échouer
# =============================================================================
#
# « --test-negatif » n'est pas un mode de débogage, c'est une PREUVE :
# une porte qui ne trouve jamais rien est indistinguable d'une porte qui n'a
# rien à trouver.
#
# Le mode opère sur une COPIE DE TRAVAIL du modèle dans un répertoire
# temporaire. Il ne touche JAMAIS docs/modele-donnees/ — et ce n'est pas une
# promesse : l'empreinte du répertoire est relevée avant et après, et une
# différence fait échouer le test.

# La table sur laquelle porte la mutation de P-01. Une table nommée en dur
# plutôt que tirée au sort : un test négatif doit rendre le MÊME diagnostic à
# chaque exécution, sinon on ne sait pas ce qu'on a prouvé.
readonly CIBLE_P01="caisse.coupure_comptee"
readonly CIBLE_P01_FICHIER="30-caisse.sql"
readonly TABLE_BIDON="zzz_table_non_declaree"

# La cible de P-05. LE CHOIX N'EST PAS INDIFFÉRENT : c'est PRÉCISÉMENT la colonne
# qu'un cycle de phase 3 serait tenté de « réparer », de bonne foi, en croyant
# corriger un oubli. Le test négatif rejoue donc L'ERREUR RÉELLE qu'on cherche à
# prévenir, pas une erreur de laboratoire.
readonly CIBLE_P05_FICHIER="97-hebergement.sql"
readonly CIBLE_P05_CONTRAINTE="fk_ligne_sejour_ligne_commande"
readonly CIBLE_P05_PORTANTE="hebergement.ligne_sejour"
readonly CIBLE_P05_REFERENCEE="ventes.ligne_commande"

copies_de_travail=""

nettoyer_copies() {
    local copie
    for copie in $copies_de_travail; do
        [ -d "$copie" ] && rm -rf "$copie"
    done
    copies_de_travail=""
}

# Empreinte de TOUT CE QUE LES PORTES INSPECTENT : le répertoire du modèle et le
# registre. C'est elle qui prouve le point 3 du contrat de porte — « ne modifie
# pas ce qu'elle inspecte ». Elle est relevée en mode normal comme en mode test
# négatif : une porte qui reformaterait ce qu'elle lit finirait par le réparer
# au lieu de le signaler.
empreinte_modele() {
    { find "$MODELE_REFERENCE" -type f | LC_ALL=C sort | xargs cksum; cksum < "$REGISTRE"; } | cksum
}

copier_modele() {
    local copie
    copie="$(mktemp -d)"
    cp -R "$MODELE_REFERENCE"/. "$copie"/
    copies_de_travail="$copies_de_travail $copie"
    printf '%s' "$copie"
}

# Retire les trois lignes de la politique isolation_tenant d'une table donnée.
# En awk, et non en `sed -i`, parce que la forme `adresse,+N` de sed n'est pas
# portable : le script doit tourner tel quel sur le poste et sur le serveur.
retirer_politique() {
    local fichier="$1" table="$2" tampon
    tampon="$(mktemp)"
    awk -v cible="CREATE POLICY isolation_tenant ON $table" '
        index($0, cible) == 1 { saut = 3 }
        saut > 0              { saut--; next }
                              { print }
    ' "$fichier" > "$tampon"
    mv "$tampon" "$fichier"
}

test_negatif_p01() {
    local copie journal empreinte_avant empreinte_apres

    printf '\n── TEST NÉGATIF P-01 · politique retirée sur %s (copie de travail)\n' "$CIBLE_P01"

    empreinte_avant="$(empreinte_modele)"
    copie="$(copier_modele)"
    journal="$copie/.sortie-porte"

    retirer_politique "$copie/$CIBLE_P01_FICHIER" "$CIBLE_P01"

    # La base est remontée pour la copie : le drapeau est remis à zéro, sinon la
    # porte inspecterait la base du modèle SAIN et le test ne prouverait rien.
    modele_applique=0
    if porte_p01 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ LA PORTE EST PASSÉE AU VERT sur un modèle amputé de sa politique.\n'
        printf '     P-01 est AVEUGLE : un vert de cette porte ne veut rien dire.\n'
        return "$CODE_AVEUGLE"
    fi

    # Échouer ne suffit pas : il faut avoir échoué POUR LA BONNE RAISON, et
    # avoir NOMMÉ la table. Une porte qui sort rouge sur une erreur de connexion
    # passerait ce test sans rien prouver.
    if ! grep -q "MANQUANTE : $CIBLE_P01" "$journal"; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ la porte a échoué, mais SANS NOMMER %s.\n' "$CIBLE_P01"
        printf '     Un échec qui ne nomme pas son objet envoie chercher pendant vingt minutes.\n'
        return "$CODE_AVEUGLE"
    fi

    grep -E '✗|MANQUANTE' "$journal" | sed 's/^ *//' | sed 's/^/   /'

    empreinte_apres="$(empreinte_modele)"
    if [ "$empreinte_avant" != "$empreinte_apres" ]; then
        printf '   ✗ docs/modele-donnees/ A ÉTÉ MODIFIÉ par le test négatif.\n'
        return "$CODE_AVEUGLE"
    fi

    printf '   La porte a échoué comme attendu — TEST NÉGATIF VERT\n'
    printf '   docs/modele-donnees/ inchangé (empreinte identique avant et après)\n'
    return "$CODE_OK"
}

# Ajoute à la copie de travail une table non déclarée au registre, PORTANT SON
# TRONC COMMUN ET SA RLS COMPLÈTE.
#
# ⚠️ La RLS complète est le point du test, et c'est la faute type d'un test
# négatif écrit vite : une table sans politique échouerait D'ABORD sur P-01, et
# l'on croirait avoir prouvé P-02 alors qu'on aurait prouvé P-01 une seconde
# fois. Ici, P-01 doit rester VERTE et P-02 seule doit rougir.
ajouter_table_bidon() {
    local fichier="$1"
    cat >> "$fichier" <<FIN_TABLE_BIDON


-- Table ajoutée par --test-negatif p02, dans une COPIE DE TRAVAIL seulement.
CREATE TABLE etablissements.$TABLE_BIDON (
    id                UUID CONSTRAINT pk_$TABLE_BIDON PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE etablissements.$TABLE_BIDON ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.$TABLE_BIDON FORCE  ROW LEVEL SECURITY;
CREATE POLICY isolation_tenant ON etablissements.$TABLE_BIDON
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);
CREATE POLICY administration_editeur ON etablissements.$TABLE_BIDON
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);
GRANT SELECT ON etablissements.$TABLE_BIDON TO kaya_app;
FIN_TABLE_BIDON
}

test_negatif_p02() {
    local copie journal empreinte_avant empreinte_apres

    printf '\n── TEST NÉGATIF P-02 · table %s ajoutée (copie de travail)\n' "$TABLE_BIDON"

    empreinte_avant="$(empreinte_modele)"
    copie="$(copier_modele)"
    journal="$copie/.sortie-porte"

    ajouter_table_bidon "$copie/10-etablissements.sql"

    modele_applique=0

    # Premier temps : P-01 DOIT rester verte. Si elle rougit, la table du test
    # est mal formée et le reste ne prouverait rien.
    if ! porte_p01 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ P-01 a rougi sur la table du test : elle est mal formée.\n'
        printf '     Le test aurait prouvé P-01 une seconde fois, pas P-02.\n'
        return "$CODE_AVEUGLE"
    fi
    printf '   P-01 reste VERTE sur la table ajoutée — l'\''échec qui suit est bien celui de P-02\n'

    # Second temps : P-02 doit rougir, et nommer la table.
    if porte_p02 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ LA PORTE EST PASSÉE AU VERT sur une table non déclarée au registre.\n'
        printf '     P-02 est AVEUGLE : un vert de cette porte ne veut rien dire.\n'
        return "$CODE_AVEUGLE"
    fi

    if ! grep -q "$TABLE_BIDON" "$journal"; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ la porte a échoué, mais SANS NOMMER %s.\n' "$TABLE_BIDON"
        return "$CODE_AVEUGLE"
    fi

    grep -E '✗|etablissements\.' "$journal" | sed 's/^ *//' | sed 's/^/   /'

    empreinte_apres="$(empreinte_modele)"
    if [ "$empreinte_avant" != "$empreinte_apres" ]; then
        printf '   ✗ docs/modele-donnees/ A ÉTÉ MODIFIÉ par le test négatif.\n'
        return "$CODE_AVEUGLE"
    fi

    printf '   La porte a échoué comme attendu — TEST NÉGATIF VERT\n'
    printf '   docs/modele-donnees/ inchangé (empreinte identique avant et après)\n'
    return "$CODE_OK"
}

# Ajoute à la copie de travail une CLÉ ÉTRANGÈRE INTER-SCHÉMAS sur la colonne nue
# hebergement.ligne_sejour.ligne_commande_id.
#
# ⚠️ Par ALTER en fin de fichier, et non en modifiant la déclaration de la table :
# `ventes.ligne_commande` est appliquée AVANT `97-hebergement.sql`, donc la cible
# existe — mais poser la contrainte dans le CREATE TABLE demanderait de réécrire
# le corps de la table, ce qu'un awk ferait mal. L'ALTER produit EXACTEMENT le
# même objet de catalogue, qui est ce que P-05 inspecte.
#
# ⚠️ La table conserve sa RLS complète et sa classe déclarée : elle DOIT passer
# P-01 et P-02 et n'échouer que sur P-05. Sans cette précaution, on croirait
# avoir prouvé P-05 alors qu'on aurait prouvé P-01 une troisième fois — c'est
# pourquoi le test se déroule en DEUX TEMPS, comme celui de P-02.
ajouter_fk_inter_schemas() {
    local fichier="$1"
    cat >> "$fichier" <<FIN_FK_INTER

-- Contrainte ajoutée par --test-negatif p05, dans une COPIE DE TRAVAIL seulement.
-- Elle rejoue L'ERREUR RÉELLE : un cycle de phase 3 prend l'absence de
-- REFERENCES pour un oubli et l'ajoute de bonne foi.
ALTER TABLE $CIBLE_P05_PORTANTE
    ADD CONSTRAINT $CIBLE_P05_CONTRAINTE FOREIGN KEY (ligne_commande_id)
        REFERENCES $CIBLE_P05_REFERENCEE (id);
FIN_FK_INTER
}

test_negatif_p05() {
    local copie journal empreinte_avant empreinte_apres

    printf '\n── TEST NÉGATIF P-05 · %s transformée en clé étrangère vers %s (copie de travail)\n' \
        "$CIBLE_P05_PORTANTE.ligne_commande_id" "$CIBLE_P05_REFERENCEE"

    empreinte_avant="$(empreinte_modele)"
    copie="$(copier_modele)"
    journal="$copie/.sortie-porte"

    ajouter_fk_inter_schemas "$copie/$CIBLE_P05_FICHIER"

    modele_applique=0

    # Premier temps : P-01 DOIT rester verte. Si elle rougit, la mutation est mal
    # formée et le reste ne prouverait rien.
    if ! porte_p01 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ P-01 a rougi sur la mutation du test : elle est mal formée.\n'
        printf '     Le test aurait prouvé P-01 une troisième fois, pas P-05.\n'
        return "$CODE_AVEUGLE"
    fi
    printf '   P-01 reste VERTE sur la contrainte ajoutée\n'

    # Second temps, et il compte autant : P-02 doit rester verte elle aussi. La
    # mutation n'ajoute aucune table, donc aucune classe ne manque.
    if ! porte_p02 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ P-02 a rougi sur la mutation du test : elle est mal formée.\n'
        return "$CODE_AVEUGLE"
    fi
    printf '   P-02 reste VERTE — l'\''échec qui suit est bien celui de P-05\n'

    # Troisième temps : P-05 doit rougir.
    if porte_p05 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ LA PORTE EST PASSÉE AU VERT sur une clé étrangère inter-schémas.\n'
        printf '     P-05 est AVEUGLE : un vert de cette porte ne veut rien dire —\n'
        printf '     et c'\''est le pire cas, puisqu'\''elle cherche une ABSENCE.\n'
        return "$CODE_AVEUGLE"
    fi

    # Échouer ne suffit pas : il faut avoir nommé LES TROIS OBJETS. Une porte qui
    # dit « une contrainte inter-schémas existe » envoie chercher ; une porte qui
    # nomme la contrainte, la table portante et la table référencée envoie à la
    # ligne.
    local objet manquants=""
    for objet in "$CIBLE_P05_CONTRAINTE" "$CIBLE_P05_PORTANTE" "$CIBLE_P05_REFERENCEE"; do
        grep -q "$objet" "$journal" || manquants="$manquants $objet"
    done
    if [ -n "$manquants" ]; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ la porte a échoué, mais SANS NOMMER :%s\n' "$manquants"
        printf '     Un échec qui ne nomme pas ses objets envoie chercher pendant vingt minutes.\n'
        return "$CODE_AVEUGLE"
    fi

    grep -E '✗|→' "$journal" | sed 's/^ *//' | sed 's/^/   /'

    empreinte_apres="$(empreinte_modele)"
    if [ "$empreinte_avant" != "$empreinte_apres" ]; then
        printf '   ✗ docs/modele-donnees/ A ÉTÉ MODIFIÉ par le test négatif.\n'
        return "$CODE_AVEUGLE"
    fi

    printf '   La porte a échoué comme attendu, EN NOMMANT LES TROIS OBJETS — TEST NÉGATIF VERT\n'
    printf '   docs/modele-donnees/ inchangé (empreinte identique avant et après)\n'
    return "$CODE_OK"
}

# --- Test négatif de P-03 ---------------------------------------------------
#
# MUTATION : dans une COPIE DE TRAVAIL de package.json, la version de
# @nuxtjs/i18n passe de 10.6.0 à ^10.6.0.
#
# POURQUOI CE PAQUET ET PAS UN AUTRE : @nuxtjs/i18n est une dépendance DÉJÀ
# INSCRITE au §3.2 et RÉELLEMENT INSTALLÉE. La mutation rejoue donc l'erreur
# ordinaire — un `^` laissé par un outil ou par une habitude — sur un objet
# réel, pas sur un paquet de laboratoire.
readonly CIBLE_P03_PAQUET="@nuxtjs/i18n"
readonly CIBLE_P03_AVANT="10.6.0"
readonly CIBLE_P03_APRES="^10.6.0"

# Empreinte de TOUT CE QUE P-03 INSPECTE. Elle prouve le point 3 du contrat de
# porte — « ne modifie pas ce qu'elle inspecte » — au lieu de le promettre.
empreinte_p03() {
    { cksum < "$RACINE/package.json"
      cksum < "$RACINE/pnpm-lock.yaml"
      cksum < "$RACINE/.nvmrc"
      cksum < "$RACINE/compose.yml"
      cksum < "$RACINE/docs/versions-reference.md"; } | cksum
}

# Copie les cinq fichiers du périmètre dans une racine de travail. Rien d'autre
# n'est copié : la porte n'inspecte rien d'autre, et copier le dépôt entier
# rendrait le test lent sans le rendre plus vrai.
copier_perimetre_p03() {
    local copie
    copie="$(mktemp -d)"
    mkdir -p "$copie/docs"
    cp "$RACINE/package.json"                "$copie/package.json"
    cp "$RACINE/pnpm-lock.yaml"              "$copie/pnpm-lock.yaml"
    cp "$RACINE/.nvmrc"                      "$copie/.nvmrc"
    cp "$RACINE/compose.yml"                 "$copie/compose.yml"
    cp "$RACINE/docs/versions-reference.md"  "$copie/docs/versions-reference.md"
    copies_de_travail="$copies_de_travail $copie"
    printf '%s' "$copie"
}

# La mutation passe par node plutôt que par sed : elle doit produire un JSON
# VALIDE, sinon la porte échouerait sur « package.json illisible » et l'on
# croirait avoir prouvé C1 alors qu'on aurait prouvé qu'un fichier cassé casse.
introduire_intervalle() {
    node --input-type=commonjs -e '
      const fs = require("fs");
      const chemin = process.argv[1];
      const p = JSON.parse(fs.readFileSync(chemin, "utf8"));
      p.dependencies[process.argv[2]] = process.argv[3];
      fs.writeFileSync(chemin, JSON.stringify(p, null, 2) + "\n");
    ' "$1" "$CIBLE_P03_PAQUET" "$CIBLE_P03_APRES"
}

test_negatif_p03() {
    local copie journal empreinte_avant empreinte_apres

    printf '\n── TEST NÉGATIF P-03 · %s passe de %s à %s (copie de travail)\n' \
        "$CIBLE_P03_PAQUET" "$CIBLE_P03_AVANT" "$CIBLE_P03_APRES"

    empreinte_avant="$(empreinte_p03)"
    copie="$(copier_perimetre_p03)"
    journal="$copie/.sortie-porte"

    # Premier temps : la porte DOIT être verte sur la copie intacte. Sans ce
    # constat, une copie mal formée ferait rougir la porte pour une autre raison
    # et l'on croirait avoir prouvé C1.
    if ! porte_p03 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ P-03 a rougi sur la copie INTACTE : la copie est mal formée.\n'
        printf '     Le test aurait prouvé qu'\''une copie cassée casse, pas que C1 mord.\n'
        return "$CODE_AVEUGLE"
    fi
    printf '   P-03 est VERTE sur la copie intacte — l'\''échec qui suit vient bien de la mutation\n'

    introduire_intervalle "$copie/package.json"

    if porte_p03 "$copie" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ LA PORTE EST PASSÉE AU VERT sur une version en intervalle.\n'
        printf '     P-03 est AVEUGLE : un vert de cette porte ne veut rien dire.\n'
        return "$CODE_AVEUGLE"
    fi

    # Échouer ne suffit pas : il faut avoir NOMMÉ le paquet ET la valeur. Un
    # échec qui ne nomme pas son objet envoie chercher pendant vingt minutes.
    local objet manquants=""
    for objet in "$CIBLE_P03_PAQUET" "$CIBLE_P03_APRES"; do
        grep -qF "$objet" "$journal" || manquants="$manquants $objet"
    done
    if [ -n "$manquants" ]; then
        sed 's/^/   | /' "$journal"
        printf '   ✗ la porte a échoué, mais SANS NOMMER :%s\n' "$manquants"
        return "$CODE_AVEUGLE"
    fi

    grep -E '✗|FAUTIF' "$journal" | sed 's/^ *//' | sed 's/^/   /'

    empreinte_apres="$(empreinte_p03)"
    if [ "$empreinte_avant" != "$empreinte_apres" ]; then
        printf '   ✗ LE PÉRIMÈTRE DE P-03 A ÉTÉ MODIFIÉ par le test négatif.\n'
        return "$CODE_AVEUGLE"
    fi

    printf '   La porte a échoué comme attendu, EN NOMMANT LE PAQUET ET LA VALEUR — TEST NÉGATIF VERT\n'
    printf '   package.json, pnpm-lock.yaml, .nvmrc, compose.yml et versions-reference.md inchangés\n'
    return "$CODE_OK"
}

# --- Tests négatifs de P-04 — DEUX, UN PAR SENS ------------------------------
#
# ⚠️ UNE SEULE MUTATION NE PROUVERAIT QU'UNE MOITIÉ DE LA PORTE, et c'est
# précisément la moitié manquante qui rendrait le contrôle muet.
#
#   A · premier sens  — /_scenarios RETIRÉE DE L'INDEX, la route restant servie.
#   B · second sens   — /_guide-de-style rendue INATTEIGNABLE, son entrée restant
#                       marquée CONSTRUIT.
#
# ⚠️ ET UN TROISIÈME CONSTAT, QUI N'EST PAS UNE MUTATION : une entrée « pas
# commencé » et inatteignable NE DOIT PAS faire rougir. Sans lui, on aurait
# prouvé que la porte échoue — pas qu'elle échoue AU BON ENDROIT.
#
# ⚠️ LA MATRICE N'EST PAS REJOUÉE DANS CE MODE, et le motif est écrit plutôt que
# tu : les deux mutations portent sur les DEUX COMPARAISONS D'ENSEMBLES, que la
# porte évalue avant la matrice et sur lesquelles elle s'arrête. Rejouer
# cinquante secondes de navigateur sur un index dont on sait qu'il est incohérent
# n'ajouterait aucune preuve — et un test négatif qu'on ne lance plus parce qu'il
# dure trois minutes ne prouve rien du tout.
readonly CIBLE_P04_A="/_scenarios"
readonly CIBLE_P04_B="/_guide-de-style"

# Copie l'index des écrans dans une racine de travail, à sa place exacte.
copier_index_p04() {
    local copie
    copie="$(mktemp -d)"
    mkdir -p "$copie/$(dirname "$INDEX_ECRANS")"
    cp "$RACINE/$INDEX_ECRANS" "$copie/$INDEX_ECRANS"
    copies_de_travail="$copies_de_travail $copie"
    printf '%s' "$copie"
}

# Retire de l'index l'entrée qui porte une route donnée.
retirer_entree_index() {
    local fichier="$1" route="$2" tampon
    tampon="$(mktemp)"
    awk -v motif="route: '$route'" 'index($0, motif) == 0 { print }' "$fichier" > "$tampon"
    mv "$tampon" "$fichier"
}

# Retire une route de l'inventaire, dans une COPIE — c'est ainsi qu'une page
# devient inatteignable : le routeur ne la sert plus.
copier_inventaire_sans() {
    local route="$1" copie
    copie="$(mktemp -d)"
    node --input-type=commonjs -e '
      const fs = require("fs");
      const inv = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      inv.routes = (inv.routes || []).filter((r) => r !== process.argv[3]);
      fs.writeFileSync(process.argv[2], JSON.stringify(inv, null, 2) + "\n");
    ' "$INVENTAIRE_ROUTES" "$copie/routes.json" "$route"
    copies_de_travail="$copies_de_travail $copie"
    printf '%s' "$copie/routes.json"
}

# Un sens : la porte doit rougir, NOMMER l'objet, et DIRE DE QUEL SENS il s'agit.
p04_exiger_rouge() {
    local libelle="$1" racine="$2" inventaire="$3" objet="$4" marque="$5"
    local journal
    journal="$(mktemp)"

    if porte_p04 "$racine" "$inventaire" non > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        rm -f "$journal"
        printf '   ✗ LA PORTE EST PASSÉE AU VERT sur %s.\n' "$libelle"
        printf '     P-04 est AVEUGLE dans ce sens : un vert de cette porte ne veut rien dire.\n'
        return "$CODE_AVEUGLE"
    fi

    local manquants=""
    grep -qF "$objet" "$journal" || manquants="$manquants $objet"
    grep -qF "$marque" "$journal" || manquants="$manquants « $marque »"
    if [ -n "$manquants" ]; then
        sed 's/^/   | /' "$journal"
        rm -f "$journal"
        printf '   ✗ la porte a échoué, mais SANS NOMMER :%s\n' "$manquants"
        return "$CODE_AVEUGLE"
    fi

    grep -E '✗|INATTEIGNABLE|NON DÉCLARÉE' "$journal" | sed 's/^ *//' | sed 's/^/   /'
    rm -f "$journal"
    return "$CODE_OK"
}

# La porte doit être VERTE sur la copie intacte. Sans ce constat, une copie mal
# formée ferait rougir la porte pour une autre raison, et l'on croirait avoir
# prouvé le sens qu'on visait.
p04_exiger_vert_intact() {
    local racine="$1" inventaire="$2" journal
    journal="$(mktemp)"
    if ! porte_p04 "$racine" "$inventaire" non > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        rm -f "$journal"
        printf '   ✗ P-04 a rougi sur la copie INTACTE : la copie est mal formée.\n'
        return "$CODE_AVEUGLE"
    fi
    # Le troisième constat se lit ICI, sur la copie intacte : des entrées « pas
    # commencé » sont inatteignables, ET LA PORTE EST VERTE.
    local dormantes
    dormantes="$(grep -oE '· [0-9]+ entrée\(s\) « pas commencé » et inatteignable' "$journal" | grep -oE '[0-9]+' | head -n 1)"
    rm -f "$journal"
    if [ -z "$dormantes" ] || [ "$dormantes" -eq 0 ]; then
        printf '   ✗ AUCUNE entrée « pas commencé » inatteignable : le troisième constat\n'
        printf '     ne prouve rien — la borne du second sens n'\''est pas exercée.\n'
        return "$CODE_AVEUGLE"
    fi
    printf '   P-04 est VERTE sur la copie intacte, AVEC %s entrée(s) « pas commencé »\n' "$dormantes"
    printf '   inatteignable(s) — la borne du second sens est exercée, et elle ne rougit pas\n'
    return "$CODE_OK"
}

test_negatif_p04() {
    local copie inventaire empreinte_avant empreinte_apres statut

    printf '\n── TEST NÉGATIF P-04 · DEUX mutations, une par sens (copies de travail)\n'

    empreinte_avant="$(empreinte_p04)"

    # La porte a besoin de l'inventaire ET du build pour son C1 ; le mode « non »
    # ne monte pas de serveur, mais l'inventaire doit exister.
    if [ ! -f "$INVENTAIRE_ROUTES" ]; then
        assurer_build || return "$CODE_ROUGE"
    fi

    # ── Le premier temps, commun aux deux sens ──────────────────────────────
    p04_exiger_vert_intact "$RACINE" "$INVENTAIRE_ROUTES" || return "$CODE_AVEUGLE"

    # ── A · premier sens ────────────────────────────────────────────────────
    printf '\n   A · %s retirée de l'\''index, la route restant servie\n' "$CIBLE_P04_A"
    copie="$(copier_index_p04)"
    retirer_entree_index "$copie/$INDEX_ECRANS" "$CIBLE_P04_A"
    p04_exiger_rouge "une route atteignable non déclarée" \
        "$copie" "$INVENTAIRE_ROUTES" "$CIBLE_P04_A" "PREMIER SENS"
    statut=$?
    [ "$statut" -eq 0 ] || return "$statut"

    # ── B · second sens ─────────────────────────────────────────────────────
    printf '\n   B · %s rendue inatteignable, son entrée restant CONSTRUIT\n' "$CIBLE_P04_B"
    inventaire="$(copier_inventaire_sans "$CIBLE_P04_B")"
    p04_exiger_rouge "une entrée construite inatteignable" \
        "$RACINE" "$inventaire" "$CIBLE_P04_B" "SECOND SENS"
    statut=$?
    [ "$statut" -eq 0 ] || return "$statut"

    empreinte_apres="$(empreinte_p04)"
    if [ "$empreinte_avant" != "$empreinte_apres" ]; then
        printf '   ✗ LE PÉRIMÈTRE DE P-04 A ÉTÉ MODIFIÉ par le test négatif.\n'
        return "$CODE_AVEUGLE"
    fi

    printf '\n   Les DEUX sens rougissent, chacun EN NOMMANT SON OBJET — TEST NÉGATIF VERT\n'
    printf '   app/core/ecrans/index.ts et tests/navigateur/ inchangés\n'
    return "$CODE_OK"
}

# --- Tests négatifs de P-06 — DEUX, UN PAR SENS ------------------------------
#
#   A · premier sens  — un « dû » ACQUIERT un appelant. La mutation change l'état
#                       déclaré d'une entrée réellement sans appelant : le
#                       registre annonce alors « branché » ce que knip voit sans
#                       référence, et c'est exactement l'erreur qu'on commet en
#                       oubliant de mettre le registre à jour.
#   B · second sens   — un « branché » PERD son dernier appelant. La mutation
#                       retire l'import explicite d'un composant du guide de
#                       style, son entrée restant « branché ».
#
# ⚠️ LE NÉGATIF B EST CELUI QUI COMPTE LE PLUS, et il faut dire pourquoi : c'est
# le versant qu'on oublie d'écrire. SANS LUI, TOUT DÉCLARER « BRANCHÉ » RENDRAIT
# LE CONTRÔLE MUET — la porte resterait verte pour toujours sur un registre
# entièrement faux.
#
# ⚠️ ET LE TROISIÈME CONSTAT N'EST PAS UNE MUTATION : un « dû » sans appelant NE
# DOIT PAS faire rougir. C'est ce qui distingue P-06 d'un contrôle « aucun code
# mort », qui serait rouge dès la première méthode en attente de la phase 3.
readonly CIBLE_P06_A="app/core/session/useSession.ts#SESSION_VIDE"
readonly CIBLE_P06_B="app/core/design-system/TuileAction.vue"

# La copie de travail de P-06 : le registre, le guide de style, la couverture, et
# LE RAPPORT KNIP — c'est ce dernier que les deux mutations altèrent.
copier_perimetre_p06() {
    local copie
    copie="$(mktemp -d)"
    mkdir -p "$copie/docs" "$copie/app/pages" "$copie/.rapports/couverture"
    cp "$RACINE/$REGISTRE_POINTS"   "$copie/$REGISTRE_POINTS"
    cp "$RACINE/app/pages/guide-de-style.vue" "$copie/app/pages/guide-de-style.vue"
    cp "$RACINE/$COUVERTURE_JSON"   "$copie/$COUVERTURE_JSON"
    p06_sans_reference > "$copie/knip.txt"
    copies_de_travail="$copies_de_travail $copie"
    printf '%s' "$copie"
}

empreinte_p06() {
    { cksum < "$RACINE/$REGISTRE_POINTS"
      cksum < "$RACINE/app/pages/guide-de-style.vue"; } | cksum
}

# Retire l'import explicite d'un composant du guide de style.
retirer_import_du_guide() {
    local fichier="$1" composant="$2" tampon
    tampon="$(mktemp)"
    grep -v "from '~/core/design-system/$composant.vue'" "$fichier" > "$tampon"
    mv "$tampon" "$fichier"
}

p06_exiger_rouge() {
    local libelle="$1" racine="$2" objet="$3" marque="$4"
    local journal
    journal="$(mktemp)"

    if porte_p06 "$racine" "$racine/knip.txt" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        rm -f "$journal"
        printf '   ✗ LA PORTE EST PASSÉE AU VERT sur %s.\n' "$libelle"
        printf '     P-06 est AVEUGLE dans ce sens : un vert de cette porte ne veut rien dire.\n'
        return "$CODE_AVEUGLE"
    fi

    local manquants=""
    grep -qF "$objet" "$journal" || manquants="$manquants $objet"
    grep -qF "$marque" "$journal" || manquants="$manquants « $marque »"
    if [ -n "$manquants" ]; then
        sed 's/^/   | /' "$journal"
        rm -f "$journal"
        printf '   ✗ la porte a échoué, mais SANS NOMMER :%s\n' "$manquants"
        return "$CODE_AVEUGLE"
    fi

    grep -E '✗|A PERDU|A ACQUIS|HORS REGISTRE' "$journal" | sed 's/^ *//' | sed 's/^/   /'
    rm -f "$journal"
    return "$CODE_OK"
}

test_negatif_p06() {
    local copie empreinte_avant empreinte_apres statut journal

    printf '\n── TEST NÉGATIF P-06 · DEUX mutations, une par sens (copies de travail)\n'

    empreinte_avant="$(empreinte_p06)"

    if [ ! -f "$RACINE/$COUVERTURE_JSON" ]; then
        executer_prealable 'couverture (pour P-06)' pnpm test:couverture || return "$CODE_ROUGE"
    fi

    # ── Le premier temps, et le TROISIÈME CONSTAT ───────────────────────────
    copie="$(copier_perimetre_p06)"
    journal="$(mktemp)"
    if ! porte_p06 "$copie" "$copie/knip.txt" > "$journal" 2>&1; then
        sed 's/^/   | /' "$journal"
        rm -f "$journal"
        printf '   ✗ P-06 a rougi sur la copie INTACTE : la copie est mal formée.\n'
        return "$CODE_AVEUGLE"
    fi
    local nb_dus
    nb_dus="$(grep -oE '· [0-9]+ « dû »' "$journal" | grep -oE '[0-9]+' | head -n 1)"
    rm -f "$journal"
    if [ -z "$nb_dus" ] || [ "$nb_dus" -eq 0 ]; then
        printf '   ✗ AUCUNE entrée « dû » : le troisième constat ne prouve rien.\n'
        return "$CODE_AVEUGLE"
    fi
    printf '   P-06 est VERTE sur la copie intacte, AVEC %s entrée(s) « dû » sans appelant —\n' "$nb_dus"
    printf '   le troisième constat tient : un « dû » sans appelant NE FAIT PAS rougir\n'

    # ── A · premier sens — un « dû » ACQUIERT un appelant ───────────────────
    # La mutation retire l'entrée de l'ensemble « sans référence » : c'est
    # EXACTEMENT ce que knip rapporterait le jour où quelqu'un l'appelle, sans
    # penser à changer son état au registre.
    printf '\n   A · %s acquiert un appelant, son entrée restant « dû »\n' "$CIBLE_P06_A"
    copie="$(copier_perimetre_p06)"
    grep -vF "$CIBLE_P06_A" "$copie/knip.txt" > "$copie/knip.tmp" && mv "$copie/knip.tmp" "$copie/knip.txt"
    p06_exiger_rouge "un « dû » qui a acquis un appelant" "$copie" "$CIBLE_P06_A" "PREMIER SENS"
    statut=$?
    [ "$statut" -eq 0 ] || return "$statut"

    # ── B · second sens — un « branché » PERD son dernier appelant ──────────
    # ⚠️ LA MUTATION FAIT LES DEUX GESTES QUE LA RÉALITÉ FAIT ENSEMBLE : l'import
    # explicite disparaît du guide de style, ET knip signale le composant comme
    # inutilisé. C'est le versant qu'on oublie d'écrire — sans lui, tout déclarer
    # « branché » rendrait le contrôle muet.
    printf '\n   B · l'\''import de %s retiré du guide, son entrée restant « branché »\n' "$CIBLE_P06_B"
    copie="$(copier_perimetre_p06)"
    retirer_import_du_guide "$copie/app/pages/guide-de-style.vue" "TuileAction"
    printf '%s\n' "$CIBLE_P06_B" >> "$copie/knip.txt"
    p06_exiger_rouge "un composant sans import explicite" "$copie" "$CIBLE_P06_B" "SECOND SENS"
    statut=$?
    [ "$statut" -eq 0 ] || return "$statut"

    empreinte_apres="$(empreinte_p06)"
    if [ "$empreinte_avant" != "$empreinte_apres" ]; then
        printf '   ✗ LE PÉRIMÈTRE DE P-06 A ÉTÉ MODIFIÉ par le test négatif.\n'
        return "$CODE_AVEUGLE"
    fi

    printf '\n   Les DEUX sens rougissent, chacun EN NOMMANT SON OBJET — TEST NÉGATIF VERT\n'
    printf '   docs/points-entree.md et app/pages/guide-de-style.vue inchangés\n'
    return "$CODE_OK"
}

# Imprime le verdict d'un contrôle et NOMME les objets fautifs.
# « Une table n'a pas de politique » envoie chercher pendant vingt minutes ;
# « caisse.coupure_comptee » envoie à la ligne.
rendre_verdict() {
    local libelle="$1" total="$2" manquants="$3" precision="${4:-}"
    local nombre=0

    [ -n "$manquants" ] && nombre="$(printf '%s\n' "$manquants" | grep -c . || true)"

    if [ "$nombre" -eq 0 ]; then
        printf '   ✓ %-32s %d/%d %s\n' "$libelle" "$total" "$total" "$precision"
        return 0
    fi

    printf '   ✗ %-32s %d/%d\n' "$libelle" "$((total - nombre))" "$total"
    printf '%s\n' "$manquants" | sed 's/^/     MANQUANTE : /'
    return 1
}

# Les trois portes qui demandent un démon de conteneurs. Elles sont NOMMÉES, et
# ce n'est pas une politesse : « trois portes sautées » ne dit pas lesquelles, et
# c'est en ne sachant pas lesquelles qu'on prend un vert partiel pour un vert.
readonly PORTES_CONTENEUR="P-01, P-02 et P-05"

# Le saut est une INTENTION DÉCLARÉE, jamais un repli automatique.
#
# ⚠️ SANS LE DRAPEAU ET SANS DÉMON, LA SORTIE RESTE LE CODE 3. Un poste de
# développement sans conteneur est une anomalie, pas un mode : si le script
# sautait tout seul, un vert partiel finirait par se lire comme un vert — et
# personne ne saurait quel jour le modèle a cessé d'être vérifié.
annoncer_portes_sautees() {
    printf '\n── %s · SAUTÉES sur demande (--sans-conteneur)\n' "$PORTES_CONTENEUR"
    printf '   Ce qu'\''elles auraient prouvé et que RIEN d'\''autre ne prouve :\n'
    printf '   · P-01 — le modèle s'\''applique sur une base vierge, et chaque table est isolée\n'
    printf '   · P-02 — toute table du modèle a une classe hors-ligne au registre\n'
    printf '   · P-05 — aucune clé étrangère entre deux schémas\n'
    printf '   Le drapeau ne les rend pas facultatives : il déclare qu'\''on ne les lance PAS ICI.\n'
}

# Le coût de l'enchaînement, dit à voix haute (SC-017).
#
# ⚠️ CE N'EST PAS UNE PORTE, ET CE NE DOIT PAS EN DEVENIR UNE. Faire rougir le
# script parce qu'il a mis quatre minutes punirait le cycle qui ajoute un
# contrôle utile, et l'on retirerait le contrôle plutôt que la lenteur. Le
# franchissement des trois minutes DEMANDE une ligne au rapport de cycle ; le
# franchissement des cinq minutes dit que le déclencheur du serveur d'intégration
# de la phase 3 est atteint. Les deux se constatent, aucun n'arrête.
annoncer_duree() {
    local duree="$1"
    if [ "$duree" -ge "$REPERE_MAXIMUM" ]; then
        printf '⚠️  %d s — le repère de %d s est FRANCHI. C'\''est le déclencheur écrit du\n' \
            "$duree" "$REPERE_MAXIMUM"
        printf '    passage au serveur d'\''intégration, en phase 3. À consigner au rapport de cycle.\n'
    elif [ "$duree" -ge "$REPERE_A_CONSIGNER" ]; then
        printf '⚠️  %d s — au-delà du repère de %d s. À CONSIGNER au rapport de cycle (SC-017).\n' \
            "$duree" "$REPERE_A_CONSIGNER"
    fi
}

# =============================================================================
# Enchaînement
# =============================================================================

main() {
    local mode="tout" porte="" cible_negatif="tous" sans_conteneur=0

    while [ $# -gt 0 ]; do
        case "$1" in
            --sans-conteneur)
                sans_conteneur=1
                shift
                ;;
            --aide|-h|--help)
                aide
                exit "$CODE_OK"
                ;;
            --prealables)
                mode="prealables"
                shift
                ;;
            --porte)
                [ $# -ge 2 ] || erreur_usage "--porte attend un nom de porte (p01, p02, p03 ou p05)"
                mode="porte"
                porte="$2"
                shift 2
                ;;
            --test-negatif)
                mode="test-negatif"
                if [ $# -ge 2 ] && [ "${2#--}" = "$2" ]; then
                    cible_negatif="$2"
                    shift 2
                else
                    shift
                fi
                ;;
            *)
                erreur_usage "argument inconnu : $1"
                ;;
        esac
    done

    local debut=$SECONDS
    local portes_passees=0
    # Point 3 du contrat de porte, relevé AVANT toute exécution.
    local empreinte_avant
    empreinte_avant="$(empreinte_modele)"

    case "$mode" in
        tout)
            # Arrêt au PREMIER contrôle rouge : P-02 ne s'exécute pas si P-01
            # a échoué. Inspecter des classes sur un modèle qui ne s'applique
            # pas donnerait un second message d'erreur sans second diagnostic.
            #
            # Les préalables VIENNENT AVANT LES PORTES, et l'ordre a un motif :
            # ils sont les moins chers et les plus souvent rouges. Monter une
            # base PostgreSQL pour découvrir ensuite que le lint échoue coûte
            # huit secondes à chaque fois, et l'on finit par sauter le script.
            controles_prealables || exit "$CODE_ROUGE"
            if [ "$sans_conteneur" -eq 1 ]; then
                annoncer_portes_sautees
            else
                porte_p01 "$MODELE_REFERENCE" || exit "$CODE_ROUGE"
                portes_passees=$((portes_passees + 1))
                porte_p02 "$MODELE_REFERENCE" || exit "$CODE_ROUGE"
                portes_passees=$((portes_passees + 1))
                porte_p05 "$MODELE_REFERENCE" || exit "$CODE_ROUGE"
                portes_passees=$((portes_passees + 1))
            fi
            porte_p03 "$RACINE" || exit "$CODE_ROUGE"
            portes_passees=$((portes_passees + 1))
            porte_p04 "$RACINE" "$INVENTAIRE_ROUTES" oui || exit "$CODE_ROUGE"
            portes_passees=$((portes_passees + 1))
            porte_p06 "$RACINE" || exit "$CODE_ROUGE"
            portes_passees=$((portes_passees + 1))
            ;;
        prealables)
            controles_prealables || exit "$CODE_ROUGE"
            local duree_p=$((SECONDS - debut))
            printf '\nPRÉALABLES VERTS — %d s\n' "$duree_p"
            annoncer_duree "$duree_p"
            exit "$CODE_OK"
            ;;
        porte)
            case "$porte" in
                p01) porte_p01 "$MODELE_REFERENCE" || exit "$CODE_ROUGE" ;;
                p02) porte_p02 "$MODELE_REFERENCE" || exit "$CODE_ROUGE" ;;
                p03) porte_p03 "$RACINE"           || exit "$CODE_ROUGE" ;;
                p04) porte_p04 "$RACINE" "$INVENTAIRE_ROUTES" oui || exit "$CODE_ROUGE" ;;
                p05) porte_p05 "$MODELE_REFERENCE" || exit "$CODE_ROUGE" ;;
                p06) porte_p06 "$RACINE"           || exit "$CODE_ROUGE" ;;
                *)   erreur_usage "porte inconnue : $porte (attendu : p01, p02, p03, p04, p05 ou p06)" ;;
            esac
            portes_passees=1
            ;;
        test-negatif)
            case "$cible_negatif" in
                p01)
                    test_negatif_p01 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                p02)
                    test_negatif_p02 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                p03)
                    test_negatif_p03 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                p04)
                    test_negatif_p04 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                p06)
                    test_negatif_p06 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                p05)
                    test_negatif_p05 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                tous)
                    test_negatif_p01 || exit "$CODE_AVEUGLE"
                    test_negatif_p02 || exit "$CODE_AVEUGLE"
                    test_negatif_p05 || exit "$CODE_AVEUGLE"
                    test_negatif_p03 || exit "$CODE_AVEUGLE"
                    test_negatif_p04 || exit "$CODE_AVEUGLE"
                    test_negatif_p06 || exit "$CODE_AVEUGLE"
                    portes_passees=6
                    ;;
                *)
                    erreur_usage "test négatif inconnu : $cible_negatif (attendu : p01, p02, p03, p04, p05 ou p06)"
                    ;;
            esac
            local duree_n=$((SECONDS - debut))
            printf '\nTESTS NÉGATIFS VERTS — %d — %d s\n' "$portes_passees" "$duree_n"
            exit "$CODE_OK"
            ;;
    esac

    # Point 3 du contrat de porte, constaté APRÈS. Une porte qui a modifié ce
    # qu'elle inspecte n'a rien prouvé sur ce qui était là avant elle.
    if [ "$empreinte_avant" != "$(empreinte_modele)" ]; then
        printf '\n✗ CE QUI EST INSPECTÉ A ÉTÉ MODIFIÉ pendant l'\''exécution.\n'
        printf '  docs/modele-donnees/ ou le registre a changé — la vérification ne prouve rien.\n'
        exit "$CODE_ROUGE"
    fi

    local duree=$((SECONDS - debut))
    local mot="portes"
    [ "$portes_passees" -le 1 ] && mot="porte"
    if [ "$sans_conteneur" -eq 1 ]; then
        # ⚠️ JAMAIS « TOUT VERT ». Un vert partiel qui se lit comme un vert est
        # pire qu'un rouge : il fait croire que le modèle est vérifié alors
        # qu'aucune ligne de SQL n'a été appliquée.
        printf '\nVERT SOUS RÉSERVE — %d %s — %d s\n' "$portes_passees" "$mot" "$duree"
        printf '   %s N'\''ONT PAS ÉTÉ EXÉCUTÉES — le modèle de données n'\''est PAS vérifié.\n' \
            "$PORTES_CONTENEUR"
    else
        printf '\nTOUT VERT — %d %s — %d s\n' "$portes_passees" "$mot" "$duree"
    fi
    annoncer_duree "$duree"
    exit "$CODE_OK"
}

main "$@"
