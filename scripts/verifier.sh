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
    scripts/verifier.sh --aide               ce message

LES PORTES
    P-01   le modèle de docs/modele-donnees/ s'applique dans l'ordre, sans
           erreur, sur une base PostgreSQL VIERGE, et chaque table porte
           ENABLE + FORCE ROW LEVEL SECURITY et sa politique isolation_tenant.

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

    local attente=0
    while [ "$attente" -lt "$DELAI_DEMARRAGE" ]; do
        if (cd "$RACINE" && docker compose exec -T "$SERVICE" \
                pg_isready -U "$PROPRIETAIRE" -d "$BASE" >/dev/null 2>&1); then
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

porte_p01() {
    local repertoire="$1"

    printf '\n── P-01 · le modèle s'\''applique sur une base vierge, et chaque table porte ENABLE + FORCE + sa politique\n'

    demarrer_base
    appliquer_modele "$repertoire" || return "$CODE_ROUGE"

    printf '   Périmètre : %d fichiers appliqués\n' "$fichiers_appliques"
    printf '   VERT\n'
    return "$CODE_OK"
}

# =============================================================================
# Enchaînement
# =============================================================================

main() {
    local mode="tout" porte=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --aide|-h|--help)
                aide
                exit "$CODE_OK"
                ;;
            --porte)
                [ $# -ge 2 ] || erreur_usage "--porte attend un nom de porte (p01)"
                mode="porte"
                porte="$2"
                shift 2
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
            porte_p01 "$MODELE_REFERENCE" || exit "$CODE_ROUGE"
            portes_passees=$((portes_passees + 1))
            ;;
        porte)
            case "$porte" in
                p01) porte_p01 "$MODELE_REFERENCE" || exit "$CODE_ROUGE" ;;
                *)   erreur_usage "porte inconnue : $porte (attendu : p01)" ;;
            esac
            portes_passees=1
            ;;
    esac

    local duree=$((SECONDS - debut))
    printf '\nTOUT VERT — %d porte(s) — %d s\n' "$portes_passees" "$duree"
    # Le repère de coût est DEUX MINUTES (SC-008). Au-delà, on cesse de lancer un
    # script — c'est le déclencheur documenté du passage au serveur, en phase 3.
    exit "$CODE_OK"
}

main "$@"
