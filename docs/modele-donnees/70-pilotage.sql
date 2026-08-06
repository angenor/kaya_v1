-- ============================================================================
-- SCHÉMA pilotage — crate socle/pilotage
--
-- UNE SEULE TABLE, ET CE FICHIER DIT POURQUOI.
--
-- CE QUI N'A DÉLIBÉRÉMENT AUCUNE TABLE, et qu'un cycle ultérieur ne doit pas
-- prendre pour un oubli :
--
--   — les TABLEAUX DE BORD et les KPI (DIR-01, DIR-02) ;
--   — les RECETTES PAR SERVICE et par point de vente ;
--   — les RAPPORTS PÉRIODIQUES (DIR-05) ;
--   — la CONSULTATION DU JOURNAL D'AUDIT (DIR-04).
--
-- Tous les quatre sont DÉRIVÉS : ce sont des lectures recalculables sur les
-- tables des autres modules et sur l'outbox, qui porte une charge utile
-- financièrement complète précisément pour cela. Leur donner une table serait
-- dupliquer une vérité qui existe déjà — et se condamner à la resynchroniser,
-- c'est-à-dire à découvrir un jour que le tableau de bord et la caisse ne
-- disent pas la même chose.
--
-- Le registre §5.7 les classe d'ailleurs tous en A, « lecture dérivée, avec
-- FRAÎCHEUR AFFICHÉE » : ce qu'il faut construire n'est pas une table, c'est
-- l'affichage de la date à laquelle le chiffre a été calculé.
--
-- CE QUI EN A UNE : le PARAMÉTRAGE des alertes. Un seuil est une décision
-- d'exploitant, pas un calcul — il n'existe nulle part ailleurs, donc il a sa
-- table.
-- ============================================================================

CREATE SCHEMA pilotage;
GRANT USAGE ON SCHEMA pilotage TO kaya_app;


-- ============================================================================
-- pilotage.alerte_configurable — à partir de quand on prévient, et qui
-- CLASSE C · branche C2 — paramétrage
-- Story : DIR-04
-- ============================================================================
CREATE TABLE pilotage.alerte_configurable (
    id            UUID CONSTRAINT pk_alerte_configurable PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    portee        TEXT        NOT NULL,   -- TENANT | ETABLISSEMENT
    portee_id     UUID        NOT NULL,
    type          TEXT        NOT NULL,
    -- Le seuil s'interprète selon le type : un montant pour une remise, un
    -- nombre de stickers, des minutes pour un terminal déconnecté. Il est en
    -- NUMERIC parce qu'un seuil n'est ni un montant ni une quantité — c'est un
    -- réglage, et le forcer en entier interdirait « 2,5 % ».
    seuil         NUMERIC         NULL,
    destinataires JSONB           NULL,
    active        BOOLEAN     NOT NULL DEFAULT true,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_alerte_configurable_portee_type UNIQUE (tenant_id, portee, portee_id, type),
    -- Les cinq types d'alerte du MVP. Chacun correspond à un chemin de code qui
    -- déclenche : un sixième type sans code qui l'émet serait un réglage muet.
    CONSTRAINT ck_alerte_configurable_type CHECK (type IN (
        'REMISE',
        'ECART_CAISSE',
        'REBASCULE_PASSAGE',
        'STICKERS_BAS',
        'TERMINAL_DECONNECTE'))
);

ALTER TABLE pilotage.alerte_configurable ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilotage.alerte_configurable FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON pilotage.alerte_configurable
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON pilotage.alerte_configurable
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON pilotage.alerte_configurable TO kaya_app;
