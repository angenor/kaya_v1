-- ============================================================================
-- SCHÉMA comptabilite — aucun crate, et c'est délibéré
--
-- ⚠️ C'EST LE SEUL ÉCART À LA LISTE DE FICHIERS DE L'ENTRÉE DU CYCLE, et il est
-- assumé. L'entrée énumère dix fichiers, puis ajoute `mapping_comptable` et
-- `exercice_comptable` « en provision » SANS LEUR ASSIGNER DE FICHIER.
--
-- POURQUOI UN ONZIÈME FICHIER PLUTÔT QUE DE LES LOGER AILLEURS :
-- un schéma par module est la règle (constitution, principe 2). Il n'existe pas
-- encore de crate comptable, mais il en existera un — la provision est faite
-- pour ça. Les mettre dans `synchronisation` les coupleraient à un module
-- qu'ils ne servent pas, et la règle « aucune clé étrangère entre schémas de
-- modules » interdirait de toute façon de les y rattacher.
-- UN FICHIER AUJOURD'HUI CONTRE UN DÉPLACEMENT INTER-SCHÉMA DEMAIN — et un
-- déplacement inter-schéma se paie en migration de données, pas en `git mv`.
--
-- Écarté : `synchronisation.sql`, parce que ces deux tables CONSOMMENT l'outbox.
-- Mais consommer n'est pas appartenir : les métriques aussi consomment l'outbox,
-- et elles ont leur schéma.
--
-- CE QU'IL NE COUVRE PAS : toute écriture comptable. Il n'y a ni journal, ni
-- écriture, ni balance — seulement DE QUOI LES ACCUEILLIR le jour venu.
-- ============================================================================

CREATE SCHEMA comptabilite;
GRANT USAGE ON SCHEMA comptabilite TO kaya_app;


-- ============================================================================
-- comptabilite.mapping_comptable — quel événement donne quelle écriture
-- CLASSE C · branche C2 — référentiel comptable du tenant
-- Story : TRX-02b
-- PROVISION — tables seulement, aucune logique au MVP
--
-- La table dit, pour un type d'événement de l'outbox, quels comptes débiter et
-- créditer, et dans quel journal. C'est un RÉFÉRENTIEL de correspondance, pas un
-- moteur : rien ici ne calcule, ne totalise, ni ne valide un équilibre.
-- ============================================================================
CREATE TABLE comptabilite.mapping_comptable (
    id             UUID CONSTRAINT pk_mapping_comptable PRIMARY KEY,
    tenant_id      UUID        NOT NULL,
    -- Le type d'événement de synchronisation.evenement_outbox. Colonne de CODE,
    -- sans REFERENCES : synchronisation est un autre module, et un type
    -- d'événement se compare sans jointure.
    type_evenement TEXT        NOT NULL,
    compte_debit   TEXT        NOT NULL,
    compte_credit  TEXT        NOT NULL,
    journal        TEXT        NOT NULL,
    cree_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mapping_comptable_type UNIQUE (tenant_id, type_evenement)
);

COMMENT ON COLUMN comptabilite.mapping_comptable.type_evenement IS
    'Rattachement inter-modules vers synchronisation.evenement_outbox.type_evenement — nu.';

ALTER TABLE comptabilite.mapping_comptable ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite.mapping_comptable FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptabilite.mapping_comptable
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptabilite.mapping_comptable
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON comptabilite.mapping_comptable TO kaya_app;


-- ============================================================================
-- comptabilite.exercice_comptable — une période, ouverte ou close
-- CLASSE C · branche C2 — référentiel comptable du tenant
-- Story : TRX-02b
-- PROVISION — tables seulement, aucune logique au MVP
--
-- « UNE PÉRIODE CLOSE N'ACCEPTE PLUS D'ÉCRITURE » est une contrainte DISTINCTE
-- de la clôture journalière (caisse.cloture_journaliere) et de la certification
-- fiscale : les trois se ressemblent et ne se recouvrent pas. Elle interagira
-- avec la réconciliation des écritures orphelines (SYN-03) — une orpheline qui
-- arrive sur un exercice clos ne peut pas s'y imputer.
-- AUCUNE LOGIQUE AU MVP : la table existe pour que la contrainte ait OÙ VIVRE le
-- jour venu, et pour que le cycle qui l'écrira n'ait pas à choisir où la mettre.
-- ============================================================================
CREATE TABLE comptabilite.exercice_comptable (
    id         UUID CONSTRAINT pk_exercice_comptable PRIMARY KEY,
    tenant_id  UUID        NOT NULL,
    debut      DATE        NOT NULL,
    fin        DATE        NOT NULL,
    statut     TEXT        NOT NULL,
    cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exercice_comptable_periode UNIQUE (tenant_id, debut, fin),
    CONSTRAINT ck_exercice_comptable_bornes CHECK (fin > debut)
);

COMMENT ON COLUMN comptabilite.exercice_comptable.statut IS
    'OUVERT | CLOS. Aucune logique n''oppose encore le statut CLOS à une écriture.';

ALTER TABLE comptabilite.exercice_comptable ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptabilite.exercice_comptable FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptabilite.exercice_comptable
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptabilite.exercice_comptable
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT ON comptabilite.exercice_comptable TO kaya_app;
