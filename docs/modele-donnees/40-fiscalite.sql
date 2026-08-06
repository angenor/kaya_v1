-- ============================================================================
-- SCHÉMA fiscalite — crate socle/fiscalite
--
-- CE QU'IL COUVRE : les paramètres fiscaux datés, le coffre des clés FNE, les
-- documents fiscaux certifiés par la DGI, les items qu'ils portent, les avoirs,
-- la file de certification, le compteur de stickers, et l'état de reversement
-- communal.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — LE CALCUL DE LA TAXE. `parametrage_fiscal` porte des PARAMÈTRES DATÉS —
--     taux de TVA, barème de nuitée par classement, taux de taxe touristique —
--     et JAMAIS un calcul. Aucune règle fiscale ne vit hors du trait
--     JurisdictionAdapter (constitution, principe 5). Une base qui calculerait
--     la taxe imposerait une migration au second pays.
--   — le document OPÉRATIONNEL, celui du mode dégradé → socle/documents. Aucun
--     document fiscal n'est jamais généré hors ligne : la coupure produit un
--     document opérationnel portant « Document non fiscal — ne tient pas lieu
--     de facture », et place l'opération en file de régularisation.
--   — ce qui est facturé — séjour, addition — qui vit dans d'autres modules.
-- ============================================================================

CREATE SCHEMA fiscalite;
GRANT USAGE ON SCHEMA fiscalite TO kaya_app;


-- ============================================================================
-- fiscalite.parametrage_fiscal — des paramètres DATÉS, jamais un calcul
-- CLASSE C · branche C2 — référentiel fiscal
-- Story : FIS-03
-- Un taux change à une date ; les documents émis avant gardent l'ancien. C'est
-- pourquoi la table est datée et jamais mise à jour en place : `date_effet` est
-- ce qui rend un contrôle fiscal de l'an dernier reproductible.
-- ============================================================================
CREATE TABLE fiscalite.parametrage_fiscal (
    id               UUID CONSTRAINT pk_parametrage_fiscal PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id UUID        NOT NULL,
    juridiction_code TEXT        NOT NULL,
    cle              TEXT        NOT NULL,
    valeur           JSONB       NOT NULL,
    date_effet       DATE        NOT NULL,
    date_fin         DATE            NULL,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_parametrage_fiscal_effet UNIQUE (etablissement_id, cle, date_effet),
    CONSTRAINT ck_parametrage_fiscal_periode CHECK (
        date_fin IS NULL OR date_fin > date_effet)
);

COMMENT ON COLUMN fiscalite.parametrage_fiscal.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN fiscalite.parametrage_fiscal.valeur IS
    'Une VALEUR de paramètre (taux, barème, seuil). Jamais une formule, jamais un calcul.';

ALTER TABLE fiscalite.parametrage_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.parametrage_fiscal FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.parametrage_fiscal
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.parametrage_fiscal
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON fiscalite.parametrage_fiscal TO kaya_app;

-- Sert : résoudre la valeur en vigueur d'une clé à une date donnée — la
-- requête que fait chaque émission de document (FIS-03)
CREATE INDEX ix_parametrage_fiscal_resolution
    ON fiscalite.parametrage_fiscal (etablissement_id, cle, date_effet DESC);


-- ============================================================================
-- fiscalite.cle_fne — le coffre, chiffré par tenant
-- CLASSE C · branche C2 — explicitement C au cadrage §11.3
-- Story : FIS-04
-- LE CHIFFREMENT EST APPLICATIF (aes-gcm), jamais fait par la base : pgcrypto
-- n'est pas créée, parce qu'une clé qui transite par la base apparaît dans
-- pg_stat_statements. La table ne voit qu'un secret déjà chiffré et son nonce.
-- ============================================================================
CREATE TABLE fiscalite.cle_fne (
    id               UUID CONSTRAINT pk_cle_fne PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id UUID        NOT NULL,
    canal            TEXT        NOT NULL,   -- PARTENAIRE | DIRECT
    ncc              TEXT        NOT NULL,
    secret_chiffre   BYTEA       NOT NULL,
    nonce            BYTEA       NOT NULL,
    version_cle      INTEGER     NOT NULL DEFAULT 1,
    rotee_le         TIMESTAMPTZ     NULL,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cle_fne_etab_canal UNIQUE (etablissement_id, canal)
);

COMMENT ON COLUMN fiscalite.cle_fne.secret_chiffre IS
    'Secret DÉJÀ chiffré par l''application (aes-gcm). La base ne chiffre ni ne déchiffre rien.';

ALTER TABLE fiscalite.cle_fne ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.cle_fne FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.cle_fne
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.cle_fne
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON fiscalite.cle_fne TO kaya_app;


-- ============================================================================
-- fiscalite.document_fiscal — la facture certifiée, numérotée par la DGI
-- CLASSE D · branche D1 — numérotation attribuée par la DGI
-- Story : FIS-02, FIS-05
-- ============================================================================
CREATE TABLE fiscalite.document_fiscal (
    id                UUID CONSTRAINT pk_document_fiscal PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID           NOT NULL,
    type              TEXT           NOT NULL,
    numero_normalise  TEXT               NULL,   -- attribué par la DGI
    reference_dgi     TEXT               NULL,
    sceau             TEXT               NULL,
    qr_code_uri       TEXT               NULL,
    total_ht          montant_mineur NOT NULL,
    total_tva         montant_mineur NOT NULL,
    total_taxe_nuitee montant_mineur NOT NULL DEFAULT 0,
    total_ttc         montant_mineur NOT NULL,
    devise            code_devise    NOT NULL,
    emis_le           TIMESTAMPTZ        NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    -- Ce que la DGI émet, pas de la configuration d'établissement : la CHECK
    -- est légitime, et une valeur de plus s'accompagne du code qui la traite.
    CONSTRAINT ck_document_fiscal_type CHECK (type IN ('FACTURE', 'AVOIR')),
    CONSTRAINT uq_document_fiscal_numero UNIQUE (etablissement_id, numero_normalise)
);

COMMENT ON COLUMN fiscalite.document_fiscal.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN fiscalite.document_fiscal.numero_normalise IS
    'Attribué par la DGI, donc NULL tant que la certification n''a pas abouti.';

ALTER TABLE fiscalite.document_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.document_fiscal FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.document_fiscal
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.document_fiscal
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- UPDATE pour la seule inscription du retour de certification (numéro, sceau,
-- référence). Aucun total ne se récrit : une correction est un avoir.
GRANT SELECT, INSERT, UPDATE ON fiscalite.document_fiscal TO kaya_app;

-- Sert : l'état de reversement communal et la réimpression, par établissement
-- et période d'émission (FIS-08, IMP-03)
CREATE INDEX ix_document_fiscal_etab_periode
    ON fiscalite.document_fiscal (etablissement_id, emis_le DESC);


-- ============================================================================
-- fiscalite.item_certifie — les lignes du document, et LEURS ID DGI
-- CLASSE D · branche D1 — produit par l'API de certification
-- Story : FIS-06, FIS-10
-- ⚠️ id_item_dgi EST LA COLONNE DONT L'OUBLI SERAIT IRRATTRAPABLE.
-- L'avoir FNE se fait PAR QUANTITÉ et son corps est limité à
-- { id d'item, quantity } : sans les identifiants RETOURNÉS PAR L'API, aucun
-- avoir n'est possible, et AUCUNE REPRISE A POSTERIORI NE LES RECONSTITUE
-- (cadrage §9.4). Ils se persistent à la certification ou jamais.
-- ============================================================================
CREATE TABLE fiscalite.item_certifie (
    id                 UUID CONSTRAINT pk_item_certifie PRIMARY KEY,
    tenant_id          UUID           NOT NULL,
    document_fiscal_id UUID           NOT NULL,
    id_item_dgi        TEXT               NULL,
    designation        TEXT           NOT NULL,
    quantite           quantite       NOT NULL,
    prix_unitaire      montant_mineur NOT NULL,
    taux_tva           NUMERIC        NOT NULL,
    horodatage_client  TIMESTAMPTZ        NULL,
    cree_le            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_item_certifie_document FOREIGN KEY (document_fiscal_id)
        REFERENCES fiscalite.document_fiscal (id),
    CONSTRAINT uq_item_certifie_id_dgi UNIQUE (document_fiscal_id, id_item_dgi)
);

COMMENT ON COLUMN fiscalite.item_certifie.id_item_dgi IS
    'Identifiant RETOURNÉ par l''API DGI. Sans lui, aucun avoir par quantité n''est possible, et rien ne le reconstitue.';
COMMENT ON COLUMN fiscalite.item_certifie.quantite IS
    'Domaine quantite (NUMERIC) : jamais un entier — 2,3 mètres, 47,5 kg.';

ALTER TABLE fiscalite.item_certifie ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.item_certifie FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.item_certifie
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.item_certifie
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON fiscalite.item_certifie TO kaya_app;

-- Sert : relire les items d'un document pour émettre un avoir par quantité (FIS-06)
CREATE INDEX ix_item_certifie_document ON fiscalite.item_certifie (document_fiscal_id);


-- ============================================================================
-- fiscalite.avoir — l'annulation partielle ou totale d'une facture certifiée
-- CLASSE D · branche D1 — API DGI, débit d'un sticker
-- Story : FIS-06
-- ============================================================================
CREATE TABLE fiscalite.avoir (
    id                 UUID CONSTRAINT pk_avoir PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    -- L'avoir ÉMIS — un document fiscal de type AVOIR.
    document_fiscal_id UUID        NOT NULL,
    -- La facture d'origine, celle qu'on annule.
    facture_origine_id UUID        NOT NULL,
    motif              TEXT        NOT NULL,
    reference_dgi      TEXT            NULL,
    horodatage_client  TIMESTAMPTZ     NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_avoir_document FOREIGN KEY (document_fiscal_id)
        REFERENCES fiscalite.document_fiscal (id),
    CONSTRAINT fk_avoir_origine FOREIGN KEY (facture_origine_id)
        REFERENCES fiscalite.document_fiscal (id)
);

ALTER TABLE fiscalite.avoir ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.avoir FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.avoir
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.avoir
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON fiscalite.avoir TO kaya_app;


-- ============================================================================
-- fiscalite.file_certification — l'état durable d'une demande à la DGI
-- CLASSE D · branche D1 — autorité externe
-- Story : FIS-05
-- CINQ ÉTATS, ET « INDETERMINEE » EN FAIT PARTIE. C'est l'état d'une demande
-- dont on ne sait pas si elle a abouti — réseau coupé après l'envoi. Elle n'est
-- JAMAIS REJOUÉE AUTOMATIQUEMENT : rejouer une certification aboutie émettrait
-- une seconde facture pour la même vente. Elle attend un rapprochement humain.
-- ============================================================================
CREATE TABLE fiscalite.file_certification (
    id                    UUID CONSTRAINT pk_file_certification PRIMARY KEY,
    tenant_id             UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module. La colonne
    -- est là pour ix_file_certification_etat, qui sert un tableau de bord par
    -- établissement.
    etablissement_id      UUID        NOT NULL,
    document_fiscal_id    UUID        NOT NULL,
    etat                  TEXT        NOT NULL,
    tentatives            INTEGER     NOT NULL DEFAULT 0,
    derniere_tentative_le TIMESTAMPTZ     NULL,
    prochaine_tentative_le TIMESTAMPTZ    NULL,
    message_erreur        TEXT            NULL,
    -- Qui a rapproché un INDETERMINEE à la main. Pas de REFERENCES : comptes
    -- est un autre module.
    resolu_par_compte_id  UUID            NULL,
    horodatage_client     TIMESTAMPTZ     NULL,
    cree_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_file_certification_document FOREIGN KEY (document_fiscal_id)
        REFERENCES fiscalite.document_fiscal (id),
    -- Protocole externe à cinq états : ni de la configuration, ni négociable.
    CONSTRAINT ck_file_certification_etat CHECK (etat IN (
        'EN_ATTENTE', 'SOUMISE', 'CERTIFIEE', 'ECHEC', 'INDETERMINEE'))
);

COMMENT ON COLUMN fiscalite.file_certification.etat IS
    'INDETERMINEE n''est jamais rejouée automatiquement : un rejeu émettrait une seconde facture.';

ALTER TABLE fiscalite.file_certification ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.file_certification FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.file_certification
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.file_certification
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON fiscalite.file_certification TO kaya_app;

-- Sert : le tableau de bord « documents non certifiés » et la sélection des
-- demandes à réessayer, par établissement et par état (FIS-05)
CREATE INDEX ix_file_certification_etat
    ON fiscalite.file_certification (etablissement_id, etat, prochaine_tentative_le);


-- ============================================================================
-- fiscalite.compteur_stickers — un COMPTEUR EN TABLE, jamais une SEQUENCE
-- CLASSE D · branche D1 — décrément côté DGI
-- Story : FIS-07
-- Le décrément réel se fait chez la DGI ; le stock local est un miroir qui doit
-- être VERROUILLÉ LIGNE À LIGNE pour bloquer préventivement la clôture quand il
-- passe sous le seuil. Une SEQUENCE ne serait pas transactionnelle et ne se
-- verrouillerait pas.
-- ============================================================================
CREATE TABLE fiscalite.compteur_stickers (
    id                UUID CONSTRAINT pk_compteur_stickers PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    restant           INTEGER     NOT NULL,
    seuil_bas         INTEGER     NOT NULL,
    dernier_releve_le TIMESTAMPTZ     NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_compteur_stickers_etab UNIQUE (etablissement_id)
);

ALTER TABLE fiscalite.compteur_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.compteur_stickers FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.compteur_stickers
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.compteur_stickers
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON fiscalite.compteur_stickers TO kaya_app;


-- ============================================================================
-- fiscalite.etat_reversement_communal — ce qui est dû à la commune
-- CLASSE A · branche A4 — rapport dérivé, recalculable
-- Story : FIS-08
-- Append-only bien qu'il s'agisse d'un rapport : un recalcul est UNE NOUVELLE
-- LIGNE, jamais une mise à jour. Ce qui a été déclaré à la commune le mois
-- dernier doit rester lisible tel qu'il a été déclaré.
-- ============================================================================
CREATE TABLE fiscalite.etat_reversement_communal (
    id                  UUID CONSTRAINT pk_etat_reversement_communal PRIMARY KEY,
    tenant_id           UUID           NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id    UUID           NOT NULL,
    commune             TEXT           NOT NULL,
    periode_debut       DATE           NOT NULL,
    periode_fin         DATE           NOT NULL,
    nuitees_assujetties INTEGER        NOT NULL,
    sejours_assujettis  INTEGER        NOT NULL,
    -- Indicatif : la taxe de nuitée ivoirienne se calcule sur les nuitées, pas
    -- sur les personnes. La colonne existe pour la lecture humaine du rapport.
    nombre_personnes    INTEGER            NULL,
    montant_du          montant_mineur NOT NULL,
    devise              code_devise    NOT NULL,
    echeance            DATE               NULL,
    horodatage_client   TIMESTAMPTZ        NULL,
    cree_le             TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT uq_etat_reversement_periode UNIQUE (etablissement_id, commune, periode_debut, periode_fin, cree_le)
);

ALTER TABLE fiscalite.etat_reversement_communal ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscalite.etat_reversement_communal FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON fiscalite.etat_reversement_communal
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON fiscalite.etat_reversement_communal
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON fiscalite.etat_reversement_communal TO kaya_app;

-- Sert : retrouver les états d'une commune sur une période, à la déclaration
-- (FIS-08)
CREATE INDEX ix_etat_reversement_commune_periode
    ON fiscalite.etat_reversement_communal (commune, periode_debut DESC);
