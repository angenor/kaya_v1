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
