-- ============================================================================
-- SCHÉMA documents — crate socle/documents
--
-- CE QU'IL COUVRE : les documents NON FISCAUX — ticket de commande, bon de
-- préparation, reçu, note provisoire —, leur numérotation interne, et les
-- gabarits d'impression.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — la facture certifiée → socle/fiscalite. La distinction est la raison
--     d'être de ce schéma : AUCUN DOCUMENT FISCAL N'EST JAMAIS GÉNÉRÉ HORS
--     LIGNE. Le mode dégradé produit un document OPÉRATIONNEL portant la
--     mention « Document non fiscal — ne tient pas lieu de facture », et place
--     l'opération en file de régularisation.
--   — la file d'impression elle-même, qui est de l'infrastructure de terminal.
--
-- ⚠️ TOUT DOCUMENT OPÉRATIONNEL PORTE LA MENTION « Document non fiscal — ne
-- tient pas lieu de facture ». C'est une propriété du GABARIT
-- (modele_document.mentions), pas une colonne du document — mais elle est
-- OBLIGATOIRE, et elle est énoncée ici pour que le cycle IMP ne la découvre pas.
-- ============================================================================

CREATE SCHEMA documents;
GRANT USAGE ON SCHEMA documents TO kaya_app;


-- ============================================================================
-- documents.document_operationnel — ce qu'on imprime quand ce n'est pas fiscal
-- CLASSE A · branche A4 — en BROUILLON : sans unicité, sans effet
-- CLASSE B · branche B3 — à L'ÉMISSION AVEC NUMÉRO INTERNE : numérotation,
--                          explicitement B au cadrage §11.3
-- Story : FIS-02, IMP-02
-- DEUX CLASSES SUR UNE TABLE, et c'est le numéro qui fait basculer de l'une à
-- l'autre : tant qu'il est nul, le document est un brouillon local qu'on peut
-- écrire hors ligne ; dès qu'il est alloué, il consomme une ressource unique
-- par établissement. UPDATE n'est accordé QUE pour cette allocation.
-- ============================================================================
CREATE TABLE documents.document_operationnel (
    id                UUID CONSTRAINT pk_document_operationnel PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    type              TEXT        NOT NULL,
    -- Nul tant que brouillon. Alloué par numerotation_document à l'émission.
    numero_interne    TEXT            NULL,
    -- Ce que le document représente : une commande, un séjour, un bon de dépôt.
    -- Colonnes NUES — ces agrégats vivent dans d'autres modules.
    cible_type        TEXT        NOT NULL,
    cible_id          UUID            NULL,
    -- Contenu DÉNORMALISÉ au moment de l'émission : un document réimprimé six
    -- mois plus tard doit rendre ce qui a été remis au client, pas ce que les
    -- référentiels disent aujourd'hui.
    contenu           JSONB       NOT NULL,
    emis_le           TIMESTAMPTZ     NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Les types portés par du code d'impression : un type de plus s'accompagne
    -- d'un gabarit et d'un chemin de rendu, jamais d'une simple configuration.
    CONSTRAINT ck_document_operationnel_type CHECK (type IN (
        'TICKET_COMMANDE', 'BON_PREPARATION', 'RECU', 'NOTE_PROVISOIRE'))
);

COMMENT ON COLUMN documents.document_operationnel.cible_id IS
    'Rattachement inter-modules (commande, séjour, bon de dépôt) — nu, sans REFERENCES.';
COMMENT ON COLUMN documents.document_operationnel.numero_interne IS
    'Nul en brouillon (classe A) ; alloué à l''émission (classe B). C''est lui qui fait basculer la classe.';

ALTER TABLE documents.document_operationnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.document_operationnel FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON documents.document_operationnel
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON documents.document_operationnel
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON documents.document_operationnel TO kaya_app;

-- Unicité PARTIELLE : elle ne porte que sur les documents émis. Une contrainte
-- ordinaire laisserait passer autant de brouillons que voulu — ce qui est
-- souhaité — mais seulement grâce au comportement des NULL ; l'index partiel
-- le dit explicitement.
CREATE UNIQUE INDEX uq_document_operationnel_numero
    ON documents.document_operationnel (etablissement_id, type, numero_interne)
    WHERE numero_interne IS NOT NULL;

-- Sert : retrouver les documents d'un établissement, du plus récent au plus
-- ancien, pour la réimpression (IMP-02, IMP-03)
CREATE INDEX ix_document_operationnel_etab_date
    ON documents.document_operationnel (etablissement_id, cree_le DESC, id DESC);


-- ============================================================================
-- documents.numerotation_document — UN COMPTEUR EN TABLE, JAMAIS UNE SEQUENCE
-- CLASSE B · branche B3 — ressource unique par établissement
-- Story : FIS-02, cadrage §11.3
-- ⚠️ UNE SEQUENCE POSTGRESQL N'EST PAS TRANSACTIONNELLE : chaque transaction
-- annulée laisse un trou, et un trou dans une numérotation de documents est une
-- pièce dont personne ne sait si elle a existé. La forme est une ligne par
-- portée, verrouillée par SELECT … FOR UPDATE au moment d'allouer.
-- ============================================================================
CREATE TABLE documents.numerotation_document (
    id               UUID CONSTRAINT pk_numerotation_document PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id UUID        NOT NULL,
    type_document    TEXT        NOT NULL,
    exercice         INTEGER     NOT NULL,
    prochain_numero  BIGINT      NOT NULL DEFAULT 1,
    horodatage_client TIMESTAMPTZ    NULL,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_numerotation_document_portee UNIQUE (etablissement_id, type_document, exercice)
);

COMMENT ON TABLE documents.numerotation_document IS
    'Compteur en table à verrou de ligne. Aucune SEQUENCE n''est créée dans ce modèle.';

ALTER TABLE documents.numerotation_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.numerotation_document FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON documents.numerotation_document
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON documents.numerotation_document
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON documents.numerotation_document TO kaya_app;


-- ============================================================================
-- documents.modele_document — en-tête, pied, mentions, gabarit
-- CLASSE C · branche C2 — référentiel de branding
-- Story : IMP-04
-- C'est ici que vit la mention obligatoire « Document non fiscal — ne tient pas
-- lieu de facture » : dans le gabarit, où elle se relit, plutôt que dans le
-- code, où elle s'oublie.
-- ============================================================================
CREATE TABLE documents.modele_document (
    id            UUID CONSTRAINT pk_modele_document PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    portee        TEXT        NOT NULL,   -- TENANT | ETABLISSEMENT
    portee_id     UUID        NOT NULL,
    type_document TEXT        NOT NULL,
    entete        TEXT            NULL,
    pied          TEXT            NULL,
    mentions      TEXT            NULL,
    gabarit       JSONB           NULL,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_modele_document_portee_type UNIQUE (tenant_id, portee, portee_id, type_document)
);

ALTER TABLE documents.modele_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.modele_document FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON documents.modele_document
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON documents.modele_document
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON documents.modele_document TO kaya_app;
