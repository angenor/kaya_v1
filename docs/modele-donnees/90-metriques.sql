-- ============================================================================
-- SCHÉMA metriques — crate socle/metriques
--
-- CE QU'IL COUVRE : les événements d'usage remontés par lots depuis les
-- terminaux, et les agrégats quotidiens qu'on en dérive.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — LA TAXONOMIE D'ÉVÉNEMENTS (MET-01). Elle est VERSIONNÉE DANS LE DÉPÔT,
--     pas en table : elle relève du contrat de code, pas de la configuration
--     d'un client (registre §5.9). Une taxonomie en base se mettrait à diverger
--     d'un tenant à l'autre, et deux clients ne compteraient plus la même chose
--     sous le même nom.
--   — les tableaux de bord qui LISENT ces agrégats → pilotage, qui n'a
--     délibérément aucune table pour eux.
-- ============================================================================

CREATE SCHEMA metriques;
GRANT USAGE ON SCHEMA metriques TO kaya_app;


-- ============================================================================
-- metriques.evenement_metrique — un usage constaté, remonté par lots
-- CLASSE A · branche A4 — append-only, IDEMPOTENT PAR UUID
-- Story : MET-02
-- ⚠️ L'IDEMPOTENCE N'A PAS BESOIN D'UNE SECONDE COLONNE.
-- L'identifiant vient du client (tronc commun) : un lot renvoyé trois fois
-- entre trois fois en CONFLIT DE CLÉ PRIMAIRE et produit un enregistrement.
-- C'est la même mécanique que le rejeu de la file hors-ligne, et c'est voulu —
-- une seule mécanique dans le produit, pas deux.
-- ============================================================================
CREATE TABLE metriques.evenement_metrique (
    id                  UUID CONSTRAINT pk_evenement_metrique PRIMARY KEY,
    tenant_id           UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id    UUID        NOT NULL,
    nom                 TEXT        NOT NULL,
    -- Tenant, établissement, module, rôle, version, plateforme. Dénormalisées
    -- exprès : un événement doit rester interprétable quand le rôle qui l'a
    -- produit aura été renommé.
    proprietes          JSONB           NULL,
    -- Horodatage d'AUTORITÉ, posé à la réception du lot. Distinct de
    -- horodatage_client, qui dit quand le terminal a cru que ça se passait.
    horodatage_serveur  TIMESTAMPTZ NOT NULL DEFAULT now(),
    horodatage_client   TIMESTAMPTZ     NULL,
    cree_le             TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON CONSTRAINT pk_evenement_metrique ON metriques.evenement_metrique IS
    'Porte l''idempotence : l''UUID vient du client, un lot renvoyé trois fois entre trois fois en conflit.';
COMMENT ON COLUMN metriques.evenement_metrique.nom IS
    'Nom de la taxonomie versionnée dans le dépôt (MET-01) — jamais une valeur libre de client.';

ALTER TABLE metriques.evenement_metrique ENABLE ROW LEVEL SECURITY;
ALTER TABLE metriques.evenement_metrique FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON metriques.evenement_metrique
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON metriques.evenement_metrique
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON metriques.evenement_metrique TO kaya_app;

-- Sert : le calcul des agrégats quotidiens, par tenant et par jour (MET-03)
CREATE INDEX ix_evenement_metrique_tenant_jour
    ON metriques.evenement_metrique (tenant_id, horodatage_serveur DESC);


-- ============================================================================
-- metriques.agregat_quotidien — un indicateur, un jour, une valeur
-- CLASSE A · branche A4 — dérivé, recalculable
-- Story : MET-03
-- UN RECALCUL EST UNE NOUVELLE LIGNE, jamais une mise à jour. C'est ce qui
-- permet de constater qu'un chiffre a changé entre deux calculs — et de savoir
-- lequel a été affiché la semaine dernière.
-- ============================================================================
CREATE TABLE metriques.agregat_quotidien (
    id                UUID CONSTRAINT pk_agregat_quotidien PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    journee           DATE        NOT NULL,
    indicateur        TEXT        NOT NULL,
    valeur            NUMERIC     NOT NULL,
    calcule_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- calcule_le entre dans la clé : deux calculs du même jour cohabitent, et
    -- c'est le dernier qu'on affiche. Sans lui, un recalcul serait un UPDATE —
    -- donc un privilège de plus, et une classe A qui deviendrait fausse.
    CONSTRAINT uq_agregat_quotidien_indicateur UNIQUE (etablissement_id, journee, indicateur, calcule_le)
);

ALTER TABLE metriques.agregat_quotidien ENABLE ROW LEVEL SECURITY;
ALTER TABLE metriques.agregat_quotidien FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON metriques.agregat_quotidien
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON metriques.agregat_quotidien
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON metriques.agregat_quotidien TO kaya_app;

-- Sert : lire les indicateurs d'un établissement sur une période, du plus
-- récent au plus ancien (MET-03, DIR-01)
CREATE INDEX ix_agregat_quotidien_etab_jour
    ON metriques.agregat_quotidien (etablissement_id, journee DESC);
