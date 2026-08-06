-- ============================================================================
-- 00-conventions.sql — ce que toute table du modèle recopie
--
-- Ce fichier ne crée AUCUNE table. Il pose les rôles, l'extension, les trois
-- domaines partagés, et il ÉCRIT UNE FOIS ce que les soixante et onze tables
-- recopient : le tronc commun, le patron RLS, les conventions de nommage.
--
-- Le motif tient en une phrase : sans ce fichier, chaque fichier de schéma
-- redériverait le tronc commun de mémoire — et c'est ainsi qu'une table finit
-- avec DEFAULT gen_random_uuid() sur sa clé primaire, ce qui rend le rejeu
-- DESTRUCTEUR au lieu d'inoffensif.
--
-- Source : docs/module-dore.md « Couche 1 », repris à la lettre. Une
-- reformulation aurait dérivé.
--
-- Ordre d'application : PREMIER. Les domaines sont employés par presque toutes
-- les tables, et les rôles par tous les GRANT.
-- ============================================================================


-- ============================================================================
-- 1 · RÔLES — deux rôles distincts, et la distinction est l'objet
-- ============================================================================
--
-- kaya_owner  possède les tables et exécute les migrations.
-- kaya_app    est le rôle de l'application. Il est DISTINCT du propriétaire :
--             c'est ce qui rend FORCE ROW LEVEL SECURITY signifiant, et c'est
--             sur lui que porte toute la matrice de privilèges du modèle.
--
-- Forme idempotente : ces rôles sont des objets de CLUSTER, pas de base. Le
-- fichier doit s'appliquer aussi bien sur un cluster neuf que sur un cluster
-- où l'image Docker a déjà créé kaya_owner par POSTGRES_USER.
--
-- ⚠️ kaya_owner NE DOIT PAS être superutilisateur en production. Un
-- superutilisateur contourne la RLS quoi qu'il arrive, y compris FORCE : la
-- politique administration_editeur ci-dessous n'aurait alors plus de sens, et
-- surtout l'isolation ne reposerait plus que sur la discipline du code. Dans la
-- base de vérification lancée par compose.yml, kaya_owner EST superutilisateur
-- (l'image le crée ainsi) — la porte P-01 inspecte le catalogue et non le
-- comportement, ce qui rend le point sans effet sur la vérification, mais il
-- est écrit ici parce que c'est le seul endroit où l'exploitation le lira.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaya_owner') THEN
        CREATE ROLE kaya_owner
            NOLOGIN
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaya_app') THEN
        -- NOBYPASSRLS est déclaré explicitement : un rôle applicatif porteur de
        -- BYPASSRLS annulerait d'un coup les soixante et onze politiques du
        -- modèle, sans qu'aucune lecture de fichier SQL ne le montre.
        -- Aucun mot de passe ici : un secret n'entre pas dans un fichier
        -- versionné. Il est posé par l'exploitation, hors du modèle.
        CREATE ROLE kaya_app
            LOGIN
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
END
$$;

COMMENT ON ROLE kaya_owner IS
    'Propriétaire des tables et des migrations. Jamais le rôle de l''application.';
COMMENT ON ROLE kaya_app IS
    'Rôle de l''application. Ses privilèges DISENT la classe hors-ligne de chaque table.';


-- ============================================================================
-- 2 · EXTENSIONS
-- ============================================================================
--
-- btree_gist est posée DÈS MAINTENANT, bien qu'aucune contrainte d'exclusion ne
-- relève du socle. Elle est requise par la contrainte d'exclusion du cycle D2
-- sur hebergement.occupation — (unite_id WITH =, periode WITH &&) — et sans
-- elle, EXCLUDE USING gist refuse une colonne uuid.
--
-- pgcrypto n'est PAS créée, et c'est une décision : le chiffrement du coffre
-- fiscalite.cle_fne est APPLICATIF (aes-gcm). Une clé qui transiterait par la
-- base apparaîtrait dans pg_stat_statements.

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ============================================================================
-- 3 · DOMAINES PARTAGÉS — trois, et aucun n'est décoratif
-- ============================================================================
--
-- Pourquoi un DOMAIN plutôt qu'un type nu : un domaine se cherche par une
-- requête sur pg_type. « Zéro montant en flottant » (SC-010) devient donc
-- vérifiable MÉCANIQUEMENT le jour où on en fait une porte. Un BIGINT nu ne se
-- distingue pas d'un compteur.
--
-- Les domaines vivent dans public, qui est dans le search_path par défaut :
-- toute table de tout schéma les nomme sans qualification.

-- Montant en unité MINEURE, en entier. Jamais un flottant, nulle part.
-- XOF a 0 décimale, mais le domaine ne le suppose pas : il porte des unités
-- mineures, et c'est la juridiction qui dit combien il en faut pour une unité
-- majeure. Un montant voyage TOUJOURS avec son code de devise.
CREATE DOMAIN montant_mineur AS BIGINT;

COMMENT ON DOMAIN montant_mineur IS
    'Montant en unité mineure, entier. Toujours accompagné d''un code_devise. Jamais un flottant.';

-- Code de devise ISO 4217, porté par l'établissement.
CREATE DOMAIN code_devise AS CHAR(3)
    CONSTRAINT ck_code_devise_iso4217 CHECK (VALUE ~ '^[A-Z]{3}$');

COMMENT ON DOMAIN code_devise IS
    'Code ISO 4217 en trois majuscules (XOF au MVP). Porté par l''établissement.';

-- Quantité DÉCIMALE, jamais un entier (amendement A2).
-- Une quincaillerie vendra 2,3 mètres de fer ; une boulangerie achètera 47,5 kg
-- de farine. Passer d'entier à décimal après mise en production imposerait de
-- migrer toutes les lignes de vente et de stock.
--
-- Le socle ne porte aucune quantité au cycle D1 — les lignes de vente et les
-- mouvements de stock sont en D2. Le domaine est déclaré ici quand même, parce
-- que c'est le fichier des conventions et qu'un domaine déclaré tard est un
-- domaine que la moitié des tables n'emploie pas.
CREATE DOMAIN quantite AS NUMERIC;

COMMENT ON DOMAIN quantite IS
    'Quantité décimale (NUMERIC). Jamais un entier — amendement A2.';

-- Le schéma public reste lisible par le rôle applicatif : sans USAGE, la
-- résolution des domaines ci-dessus échouerait à l'écriture.
GRANT USAGE ON SCHEMA public TO kaya_app;


-- ============================================================================
-- 4 · LE TRONC COMMUN — écrit ici une seule fois, recopié par chaque table
-- ============================================================================
--
-- Deux variantes, et le choix entre les deux se fait sur une seule question :
-- « un terminal écrit-il dans cette table ? ».
--
-- ---------------------------------------------------------------------------
-- Variante « écriture » — toute table qu'un terminal alimente (classes A, B, D)
-- ---------------------------------------------------------------------------
--
--     id                UUID PRIMARY KEY,                      -- AUCUN DEFAULT
--     tenant_id         UUID        NOT NULL,
--     horodatage_client TIMESTAMPTZ     NULL,                  -- indicatif
--     cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),    -- AUTORITÉ SERVEUR
--
-- `id` — UUID v7 FOURNI PAR LE CLIENT, jamais généré par la base.
--        C'est ce qui rend le rejeu inoffensif : trois envois de la même
--        écriture entrent en conflit de clé primaire et produisent UN
--        enregistrement. Une clé générée par la base en produirait trois, et le
--        terminal qui vide sa file après une coupure créerait des doublons
--        silencieux — découverts trois mois plus tard, en clôture.
--        ⚠️ DEFAULT gen_random_uuid() EST INTERDIT sur toute clé primaire de ce
--        modèle. La règle n'a pas d'exception, y compris pour les référentiels.
--
-- `tenant_id` — porte l'isolation. Jamais nullable, jamais dérivé, y compris
--        sur la table qui EST le tenant (etablissements.tenant porte alors
--        ck_tenant_auto_reference : tenant_id = id).
--
-- `horodatage_client` — INDICATIF. Aucune règle métier, fiscale, de clôture ou
--        de durée ne s'y appuie. Les horloges des terminaux ne sont pas fiables
--        (registre §12, piège 3), et le calcul de durée de passage est
--        exactement le lieu où cela coûterait de l'argent réel.
--        TROIS EXEMPTIONS, LIMITATIVEMENT ÉNUMÉRÉES — rien d'autre :
--          (1) l'ordre d'AFFICHAGE local, avant remontée ;
--          (2) la détection de DÉRIVE d'horloge (alerte au-delà de 5 minutes) ;
--          (3) le RENDU de l'instant tel que le terminal l'a perçu.
--        La colonne s'écrit, se relit et s'affiche — elle ne décide de rien.
--
-- `cree_le` — AUTORITÉ SERVEUR. Tout s'y appuie : durées, taxes, clôtures, tri,
--        pagination. En mode nœud de site, l'autorité est le nœud ; jamais le
--        terminal.
--
-- ---------------------------------------------------------------------------
-- Variante « référentiel » — toute table de classe C, écrite par le serveur seul
-- ---------------------------------------------------------------------------
--
--     id         UUID PRIMARY KEY,                      -- AUCUN DEFAULT
--     tenant_id  UUID        NOT NULL,
--     cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
--     modifie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
--
-- PAS de horodatage_client : aucun terminal n'écrit un référentiel, et une
-- colonne qu'on n'écrit jamais finit par être écrite.
--
-- ---------------------------------------------------------------------------
-- La règle de tri, qui vaut pour les deux variantes
-- ---------------------------------------------------------------------------
--
--     ORDER BY cree_le DESC, id DESC
--
-- Le départage par `id` n'est pas décoratif : deux lignes créées dans la même
-- transaction partagent la valeur de now(), et sans lui la pagination sauterait
-- ou répéterait des lignes. L'UUID v7 étant ordonné dans le temps, il départage
-- dans le bon sens.


-- ============================================================================
-- 5 · LE PATRON RLS — quatre instructions, aucune optionnelle
-- ============================================================================
--
--     ALTER TABLE <schema>.<table> ENABLE ROW LEVEL SECURITY;
--     ALTER TABLE <schema>.<table> FORCE  ROW LEVEL SECURITY;
--
--     CREATE POLICY isolation_tenant ON <schema>.<table>
--         USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
--         WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);
--
--     CREATE POLICY administration_editeur ON <schema>.<table>
--         FOR ALL TO kaya_owner USING (true) WITH CHECK (true);
--
-- Ce que coûte l'absence de chacune — quatre motifs, quatre défauts distincts :
--
--   FORCE
--       Le propriétaire des tables reste HORS politique, et la première tâche
--       de maintenance voit tous les clients.
--
--   WITH CHECK
--       Un tenant peut INSÉRER chez un autre. C'est la fuite la moins visible
--       du produit : elle n'apparaît dans AUCUNE lecture. C'est aussi pourquoi
--       P-01 vérifie que with_check est non nul, et pas seulement que la
--       politique existe — pg_policies.with_check vaut NULL quand la politique
--       n'en déclare pas.
--
--   Second argument `true` de current_setting
--       Sans lui, une transaction sans contexte de tenant lève une ERREUR au
--       lieu de ne rien voir. Un résultat vide ne peut se dégrader qu'en
--       résultat vide ; une erreur peut être avalée par un catch mal placé et
--       devenir un accès ouvert.
--
--   administration_editeur, POSÉE DÈS LA CRÉATION
--       Sans elle, toute migration de peuplement de la phase 3 RÉUSSIRAIT EN
--       N'ÉCRIVANT RIEN — sans lever la moindre erreur. Voir le piège (a) du §7.
--
-- AUCUNE VARIANTE D'EXPRESSION N'EST ADMISE. P-01 cherche cette forme, mot pour
-- mot. Une porte qui accepterait deux formes en accepterait trois.
--
-- ⚠️ RÈGLE DE PHASE 3, écrite ici parce que c'est le seul endroit où le premier
-- cycle backend la lira à temps :
--
--     SET LOCAL app.current_tenant = '…'
--
-- se pose DANS CHAQUE TRANSACTION, jamais à l'ouverture de connexion. Avec un
-- pool de connexions, c'est très exactement la différence entre l'isolation et
-- la fuite : la connexion rendue au pool garderait le tenant du précédent.


-- ============================================================================
-- 6 · CONVENTIONS DE NOMMAGE — aucune contrainte anonyme
-- ============================================================================
--
--   pk_<table>                      clé primaire
--   fk_<table>_<cible>              clé étrangère (à l'INTÉRIEUR d'un schéma)
--   uq_<table>_<colonnes|regle>     unicité
--   ck_<table>_<regle>              contrainte de contrôle
--   ix_<table>_<usage>              index — <usage> nomme la RECHERCHE, pas les colonnes
--
--   Politiques : isolation_tenant · administration_editeur
--                Deux noms dans tout le modèle, et pas un de plus.
--
-- Une contrainte anonyme porte un nom engendré (`tenant_tenant_id_fkey`) que la
-- migration suivante ne saura pas viser, et qui change si l'ordre des colonnes
-- change. Un message d'erreur de production nommant `ck_shift_etat` envoie à la
-- ligne ; nommant `shift_check1`, il envoie chercher.
--
-- Sur les index : `ix_personne_purge` dit ce qu'il sert. `ix_personne_col3_col7`
-- ne dit rien, et le jour où on se demande si on peut le retirer, personne ne
-- sait. Chaque index de ce modèle porte en outre un COMMENTAIRE nommant la
-- story dont il sert la recherche — un index sans usage nommé n'est pas créé.


-- ============================================================================
-- 7 · TROIS PIÈGES DE MIGRATION — pour celui qui écrira la première migration
-- ============================================================================
--
-- Ils ne concernent PAS ce cycle. Ils sont ici parce que c'est le seul fichier
-- que le cycle de la première migration ouvrira à coup sûr.
--
-- (a) UN INSERT OU UN UPDATE DE MIGRATION SOUS « FORCE ROW LEVEL SECURITY »
--     NE FONCTIONNE PAS, ET NE SE PLAINT PAS.
--     La politique s'applique au propriétaire, current_setting('app.current_tenant', true)
--     vaut NULL, aucune ligne n'est touchée, aucune erreur n'est levée : la
--     migration passe au vert en n'écrivant rien. C'est le défaut le plus
--     silencieux du modèle.
--     Les TROIS formes qui marchent :
--       1. ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT …  (du DDL, hors politique) ;
--       2. peupler un référentiel AVANT d'activer ENABLE/FORCE ;
--       3. s'appuyer sur la politique administration_editeur FOR ALL TO kaya_owner,
--          POSÉE DÈS LA CRÉATION de chaque table — c'est sa raison d'être.
--
-- (b) UNE CONTRAINTE D'EXCLUSION AJOUTÉE APRÈS COUP ÉCHOUE SUR LES DONNÉES
--     EXISTANTES. Elle se pose À LA CRÉATION de la table.
--     Aucune contrainte d'exclusion ne relève du socle — elles arrivent avec
--     hebergement.occupation au cycle D2 —, mais btree_gist est posée d'avance
--     (§2) précisément pour que ce jour-là il ne reste rien à décider.
--
-- (c) UNE SEQUENCE POSTGRESQL N'EST PAS TRANSACTIONNELLE : chaque transaction
--     annulée laisse un trou. Pour une numérotation OPPOSABLE — document
--     interne, fiche de police, numéro de retrait pressing, référence à
--     emporter —, un trou est une pièce dont personne ne sait si elle a existé.
--     TOUTE NUMÉROTATION CONTINUE EST UN COMPTEUR EN TABLE, à une ligne par
--     portée, verrouillé ligne à ligne (SELECT … FOR UPDATE) par le service.
--     ⚠️ AUCUNE SEQUENCE N'EST CRÉÉE DANS CE MODÈLE. Corollaire pratique :
--     aucune colonne n'est déclarée en SERIAL, BIGSERIAL ou GENERATED … AS
--     IDENTITY, qui créent une séquence sans le dire.


-- ============================================================================
-- 8 · TROIS CONVENTIONS OPPOSABLES AU CYCLE D2
-- ============================================================================
--
-- Elles portent sur des tables que le socle ne possède pas — elles vivront dans
-- `ventes` et `stocks`. Elles sont écrites ici parce que c'est LE FICHIER DES
-- CONVENTIONS, et qu'une règle écrite dans le fichier qu'on n'ouvre pas n'est
-- pas une règle.
--
--   A3 — ventes.article.unite_mesure est OBLIGATOIRE, avec le défaut 'unite'.
--        La table stocks.conversion_unite_mesure est CRÉÉE ET NON EXPLOITÉE,
--        SANS AUCUN GRANT à kaya_app, pas même SELECT : rien du produit n'a de
--        raison de la lire, et c'est cette absence qui la prouve provision.
--
--   A4 — stocks.mouvement_stock.cout_unitaire est NULLABLE et JAMAIS RENSEIGNÉ
--        AU MVP. Sans la colonne, aucune valorisation rétroactive ne serait
--        possible ; avec une valeur, on croirait le stock valorisé.
--
--   A5 — ventes.article.code_barre et ventes.article.article_parent_id sont
--        NULLABLES et non utilisés au MVP.
--
-- ============================================================================
-- FIN — 00-conventions.sql
-- ============================================================================
