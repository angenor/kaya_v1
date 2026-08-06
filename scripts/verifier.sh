#!/usr/bin/env bash
# =============================================================================
# verifier.sh — la commande unique du dépôt
#
# Une seule commande, documentée au README, qui enchaîne tout ce qui doit passer
# et SORT EN ÉCHEC AU PREMIER CONTRÔLE ROUGE. Pas dix scripts qu'on lance de
# mémoire, dont on oublie le troisième.
#
# Ce cycle (D1) la crée avec deux portes : P-01 et P-02. Elle grossira ; elle ne
# se dupliquera pas.
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
    scripts/verifier.sh                      toutes les portes, dans l'ordre,
                                             arrêt au premier échec
    scripts/verifier.sh --porte p01          une porte seule
    scripts/verifier.sh --porte p02
    scripts/verifier.sh --aide               ce message

LES PORTES
    P-01   le modèle de docs/modele-donnees/ s'applique dans l'ordre, sans
           erreur, sur une base PostgreSQL VIERGE, et chaque table porte
           ENABLE + FORCE ROW LEVEL SECURITY, sa politique isolation_tenant
           et sa politique administration_editeur.
    P-02   toute table du modèle a une classe hors-ligne déclarée dans
           docs/registre-classes-offline.md. Sens : table → registre. Une
           entité déclarée sans table est normale ; une table non déclarée
           est l'erreur.

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
interroger() {
    (cd "$RACINE" && docker compose exec -T "$SERVICE" \
        psql -X -q -A -t -v ON_ERROR_STOP=1 -U "$PROPRIETAIRE" -d "$BASE" -c "$1")
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
# vert sans rien prouver. Valeur PROVISOIRE tant que le modèle est incomplet ;
# elle est portée à sa valeur définitive quand les onze fichiers existent.
readonly PLANCHER_TABLES=1

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

preparer_base() {
    [ "$modele_applique" -eq 1 ] && return 0
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
                           ORDER BY 1;")"

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

    total="$(interroger "SELECT count(*) FROM pg_class c
                         JOIN pg_namespace n ON n.oid = c.relnamespace
                         WHERE $PERIMETRE_SQL;")"

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
        ORDER BY 1;")"
    rendre_verdict "tenant_id NOT NULL" "$total" "$manquants" || echecs=1

    # --- Contrôle 2 : l'activation -----------------------------------------
    manquants="$(interroger "SELECT n.nspname || '.' || c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE $PERIMETRE_SQL
          AND NOT (c.relrowsecurity AND c.relforcerowsecurity)
        ORDER BY 1;")"
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
        ORDER BY 1;")"
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
        ORDER BY 1;")"
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
# ne comparant RIEN. Valeurs PROVISOIRES tant que le modèle est incomplet.
readonly PLANCHER_TABLES_P02=1
readonly PLANCHER_ENTITES=1

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
        ORDER BY 1;")"
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

copies_de_travail=""

nettoyer_copies() {
    local copie
    for copie in $copies_de_travail; do
        [ -d "$copie" ] && rm -rf "$copie"
    done
    copies_de_travail=""
}

# Empreinte du répertoire de référence : noms et contenus. C'est elle qui prouve
# le point 3 du contrat de porte — « ne modifie pas ce qu'elle inspecte ».
empreinte_modele() {
    find "$MODELE_REFERENCE" -type f | LC_ALL=C sort | xargs cksum | cksum
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

# =============================================================================
# Enchaînement
# =============================================================================

main() {
    local mode="tout" porte="" cible_negatif="tous"

    while [ $# -gt 0 ]; do
        case "$1" in
            --aide|-h|--help)
                aide
                exit "$CODE_OK"
                ;;
            --porte)
                [ $# -ge 2 ] || erreur_usage "--porte attend un nom de porte (p01 ou p02)"
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

    exiger_prerequis

    local debut=$SECONDS
    local portes_passees=0

    case "$mode" in
        tout)
            # Arrêt au PREMIER contrôle rouge : P-02 ne s'exécute pas si P-01
            # a échoué. Inspecter des classes sur un modèle qui ne s'applique
            # pas donnerait un second message d'erreur sans second diagnostic.
            porte_p01 "$MODELE_REFERENCE" || exit "$CODE_ROUGE"
            portes_passees=$((portes_passees + 1))
            porte_p02 "$MODELE_REFERENCE" || exit "$CODE_ROUGE"
            portes_passees=$((portes_passees + 1))
            ;;
        porte)
            case "$porte" in
                p01) porte_p01 "$MODELE_REFERENCE" || exit "$CODE_ROUGE" ;;
                p02) porte_p02 "$MODELE_REFERENCE" || exit "$CODE_ROUGE" ;;
                *)   erreur_usage "porte inconnue : $porte (attendu : p01 ou p02)" ;;
            esac
            portes_passees=1
            ;;
        test-negatif)
            case "$cible_negatif" in
                p01)
                    test_negatif_p01 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                tous)
                    test_negatif_p01 || exit "$CODE_AVEUGLE"
                    portes_passees=1
                    ;;
                *)
                    erreur_usage "test négatif inconnu : $cible_negatif (attendu : p01)"
                    ;;
            esac
            local duree_n=$((SECONDS - debut))
            printf '\nTESTS NÉGATIFS VERTS — %d — %d s\n' "$portes_passees" "$duree_n"
            exit "$CODE_OK"
            ;;
    esac

    local duree=$((SECONDS - debut))
    printf '\nTOUT VERT — %d porte(s) — %d s\n' "$portes_passees" "$duree"
    # Le repère de coût est DEUX MINUTES (SC-008). Au-delà, on cesse de lancer un
    # script — c'est le déclencheur documenté du passage au serveur, en phase 3.
    exit "$CODE_OK"
}

main "$@"
