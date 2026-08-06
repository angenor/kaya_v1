-- ============================================================================
-- SCHÉMA etablissements — crate socle/etablissements
--
-- CE QU'IL COUVRE : le tenant et ses établissements, les référentiels qui
-- disent CE QUE FAIT un établissement (modules d'activité), CE DONT IL A BESOIN
-- pour le faire (capacités), où il vend (points de vente, tables), comment il
-- est paramétré (catalogue de clés, valeurs par portée), et sous quelle image
-- il édite ses documents.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — les comptes, les rôles et les personnes → socle/comptes. Un établissement
--     ne connaît pas ses utilisateurs : il connaît ses points de vente.
--   — les caisses → socle/caisse, bien que point_de_vente porte un caisse_id.
--     La colonne est un rattachement NU, sans REFERENCES : caisse est un autre
--     module (constitution, principe 2).
--   — les chambres, les articles, les séjours → cycle D2. Le socle est
--     AGNOSTIQUE : il ne connaît ni chambre ni couvert, seulement des modules
--     et des capacités qu'il ne sait pas interpréter.
--
-- SUR LA CLÉ ÉTRANGÈRE VERS tenant, qui n'est posée qu'une fois.
-- fk_etablissement_tenant existe parce que la conception la nomme. Les autres
-- tables portent tenant_id SANS REFERENCES, et ce n'est pas un oubli : neuf des
-- dix schémas du modèle ne PEUVENT pas la poser (tenant vit dans un autre
-- module), et une garantie qui n'existerait que dans un schéma sur dix invite à
-- s'y fier partout. tenant_id est la colonne d'ISOLATION, tenue par la
-- politique RLS — pas un rattachement métier.
-- ============================================================================

CREATE SCHEMA etablissements;
GRANT USAGE ON SCHEMA etablissements TO kaya_app;


-- ============================================================================
-- etablissements.tenant — le client de l'éditeur, racine de toute isolation
-- CLASSE C · branche C2 — relation éditeur–client
-- Story : ETB-01
-- ============================================================================
CREATE TABLE etablissements.tenant (
    id             UUID CONSTRAINT pk_tenant PRIMARY KEY,   -- UUID v7 client, AUCUN DEFAULT
    -- La règle « chaque table porte tenant_id » ne souffre aucune exception, y
    -- compris pour la table qui EST le tenant. ck_tenant_auto_reference le rend
    -- explicite plutôt que conventionnel : sans elle, un jour, une ligne
    -- porterait le tenant d'un autre.
    tenant_id      UUID        NOT NULL,
    code           TEXT        NOT NULL,
    raison_sociale TEXT        NOT NULL,
    statut         TEXT        NOT NULL,
    est_editeur    BOOLEAN     NOT NULL DEFAULT false,
    cree_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_tenant_auto_reference CHECK (tenant_id = id),
    CONSTRAINT uq_tenant_code UNIQUE (code)
);

ALTER TABLE etablissements.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.tenant FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.tenant
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.tenant
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.tenant TO kaya_app;


-- ============================================================================
-- etablissements.etablissement — un lieu d'exploitation, unité fiscale
-- CLASSE C · branche C2 — référentiel partagé entre établissements
-- Story : ETB-01
-- ============================================================================
CREATE TABLE etablissements.etablissement (
    id               UUID CONSTRAINT pk_etablissement PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    code             TEXT        NOT NULL,
    nom              TEXT        NOT NULL,
    -- La juridiction dit quel JurisdictionAdapter s'applique. Aucune règle
    -- fiscale ne vit dans cette base (constitution, principe 5).
    juridiction_code TEXT        NOT NULL,
    -- AUCUNE contrainte d'énumération sur `classement` : les valeurs (sans
    -- étoile, 1★ … résidence meublée) sont propres à la juridiction ivoirienne,
    -- et les figer imposerait une migration de schéma au second pays pour un
    -- simple barème. La validation appartient à l'adaptateur, qui connaît le
    -- pays ; la base ne le connaît pas.
    classement       TEXT            NULL,
    commune          TEXT        NOT NULL,
    fuseau_horaire   TEXT        NOT NULL,
    devise           code_devise NOT NULL,
    adresse          TEXT            NULL,
    ncc              TEXT            NULL,   -- numéro de compte contribuable
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_etablissement_tenant FOREIGN KEY (tenant_id)
        REFERENCES etablissements.tenant (id),
    CONSTRAINT uq_etablissement_code UNIQUE (tenant_id, code)
);

ALTER TABLE etablissements.etablissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.etablissement FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.etablissement
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.etablissement
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.etablissement TO kaya_app;

-- Sert : lister les établissements d'un tenant au sélecteur d'établissement (ETB-06)
CREATE INDEX ix_etablissement_tenant ON etablissements.etablissement (tenant_id);


-- ============================================================================
-- etablissements.module_activite — LA VERTICALE : ce que fait l'établissement
-- CLASSE C · branche C2 — référentiel partagé
-- Story : ETB-02, ETB-08
-- Module et capacité sont DEUX tables, jamais une (amendements A6 et A7).
-- ============================================================================
CREATE TABLE etablissements.module_activite (
    id                UUID CONSTRAINT pk_module_activite PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    code              TEXT        NOT NULL,
    libelle           TEXT        NOT NULL,
    -- `implemente_au_mvp` est une DONNÉE, donc modifiable : c'est ce qui rend
    -- vraie la promesse d'ETB-08 — ajouter SPA ou BOULANGERIE au référentiel
    -- est de la configuration, pas une migration. Une CHECK sur les valeurs
    -- rendrait la suivante impossible sans migrer TOUTES les bases du parc.
    implemente_au_mvp BOOLEAN     NOT NULL DEFAULT false,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_module_activite_code UNIQUE (tenant_id, code)
);

ALTER TABLE etablissements.module_activite ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.module_activite FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.module_activite
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.module_activite
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.module_activite TO kaya_app;


-- ============================================================================
-- etablissements.capacite — LE TRANSVERSE : ce dont il a besoin pour le faire
-- CLASSE C · branche C2 — référentiel partagé
-- Story : ETB-02b
-- ============================================================================
CREATE TABLE etablissements.capacite (
    id                 UUID CONSTRAINT pk_capacite PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    code               TEXT        NOT NULL,
    libelle            TEXT        NOT NULL,
    -- Les capacités non implémentées (LIVRAISON, PRODUCTION, FIDELITE…) existent
    -- au référentiel et sont REFUSÉES EXPLICITEMENT, jamais ignorées.
    implementee_au_mvp BOOLEAN     NOT NULL DEFAULT false,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_capacite_code UNIQUE (tenant_id, code)
);

ALTER TABLE etablissements.capacite ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.capacite FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.capacite
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.capacite
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.capacite TO kaya_app;


-- ============================================================================
-- etablissements.profil_stock — AUCUN · SIMPLE · VALORISE · DETAILLE
-- CLASSE C · branche C2 — référentiel partagé
-- Story : ETB-02b
-- Seul le profil SIMPLE est implémenté au MVP ; VALORISE et DETAILLE existent
-- au référentiel et sont refusés explicitement (registre §10).
-- ============================================================================
CREATE TABLE etablissements.profil_stock (
    id                UUID CONSTRAINT pk_profil_stock PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    code              TEXT        NOT NULL,
    libelle           TEXT        NOT NULL,
    implemente_au_mvp BOOLEAN     NOT NULL DEFAULT false,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- AUCUNE contrainte d'énumération : une CHECK sur les quatre valeurs
    -- rendrait la cinquième impossible sans migration, sur toutes les bases du
    -- parc. L'intégrité est portée par fk_module_capacite_profil.
    CONSTRAINT uq_profil_stock_code UNIQUE (tenant_id, code)
);

ALTER TABLE etablissements.profil_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.profil_stock FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.profil_stock
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.profil_stock
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.profil_stock TO kaya_app;


-- ============================================================================
-- etablissements.module_capacite — quel module consomme quelle capacité
-- CLASSE C · branche C2 — référentiel
-- Story : ETB-02b
-- C'est ici, et nulle part ailleurs, que se déclare le profil de stock d'un
-- module : la restauration suit son stock simplement, la quincaillerie le suivra
-- au détail, et le socle n'a pas à savoir ce que ces mots veulent dire.
-- ============================================================================
CREATE TABLE etablissements.module_capacite (
    id                 UUID CONSTRAINT pk_module_capacite PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    module_activite_id UUID        NOT NULL,
    capacite_id        UUID        NOT NULL,
    profil_stock_code  TEXT            NULL,   -- requis pour la capacité STOCK
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_module_capacite_module FOREIGN KEY (module_activite_id)
        REFERENCES etablissements.module_activite (id),
    CONSTRAINT fk_module_capacite_capacite FOREIGN KEY (capacite_id)
        REFERENCES etablissements.capacite (id),
    -- La clé étrangère porte le tenant : elle interdit de rattacher un profil
    -- d'un autre client, ce que la seule politique RLS ne garantirait pas au
    -- moment de l'écriture.
    CONSTRAINT fk_module_capacite_profil FOREIGN KEY (tenant_id, profil_stock_code)
        REFERENCES etablissements.profil_stock (tenant_id, code),
    CONSTRAINT uq_module_capacite UNIQUE (module_activite_id, capacite_id)
);

ALTER TABLE etablissements.module_capacite ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.module_capacite FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.module_capacite
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.module_capacite
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.module_capacite TO kaya_app;


-- ============================================================================
-- etablissements.etablissement_module — activation d'un module sur un lieu
-- CLASSE C · branche C2 — modules activés, référentiel
-- Story : ETB-02
-- ============================================================================
CREATE TABLE etablissements.etablissement_module (
    id                 UUID CONSTRAINT pk_etablissement_module PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    etablissement_id   UUID        NOT NULL,
    module_activite_id UUID        NOT NULL,
    actif              BOOLEAN     NOT NULL DEFAULT true,
    active_le          TIMESTAMPTZ     NULL,
    desactive_le       TIMESTAMPTZ     NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_etablissement_module_etab FOREIGN KEY (etablissement_id)
        REFERENCES etablissements.etablissement (id),
    CONSTRAINT fk_etablissement_module_module FOREIGN KEY (module_activite_id)
        REFERENCES etablissements.module_activite (id),
    CONSTRAINT uq_etablissement_module UNIQUE (etablissement_id, module_activite_id)
);

ALTER TABLE etablissements.etablissement_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.etablissement_module FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.etablissement_module
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.etablissement_module
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.etablissement_module TO kaya_app;

-- Sert : quels modules sont actifs sur cet établissement — la question posée à
-- chaque ouverture d'application pour composer l'accueil (ETB-02, ETB-06)
CREATE INDEX ix_etablissement_module_actif
    ON etablissements.etablissement_module (etablissement_id, actif);


-- ============================================================================
-- etablissements.point_de_vente — où l'on vend, rattaché à un module
-- CLASSE C · branche C2 — référentiel
-- Story : ETB-03
-- ============================================================================
CREATE TABLE etablissements.point_de_vente (
    id                 UUID CONSTRAINT pk_point_de_vente PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    etablissement_id   UUID        NOT NULL,
    module_activite_id UUID        NOT NULL,
    nom                TEXT        NOT NULL,
    avec_tables        BOOLEAN     NOT NULL DEFAULT false,
    -- Pas de REFERENCES : socle/caisse est un autre module. L'intégrité passe
    -- par un trait exposé, jamais par la base (constitution, principe 2).
    -- Sans ce commentaire, le cycle qui relira ce fichier prendrait l'absence
    -- de clé étrangère pour un oubli et l'ajouterait.
    caisse_id          UUID            NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_point_de_vente_etab FOREIGN KEY (etablissement_id)
        REFERENCES etablissements.etablissement (id),
    CONSTRAINT fk_point_de_vente_module FOREIGN KEY (module_activite_id)
        REFERENCES etablissements.module_activite (id)
);

COMMENT ON COLUMN etablissements.point_de_vente.caisse_id IS
    'Rattachement inter-modules vers caisse.caisse — colonne NUE, sans REFERENCES, délibérément.';

ALTER TABLE etablissements.point_de_vente ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.point_de_vente FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.point_de_vente
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.point_de_vente
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.point_de_vente TO kaya_app;

-- Sert : lister les points de vente d'un établissement à l'ouverture de shift (ETB-03)
CREATE INDEX ix_point_de_vente_etab ON etablissements.point_de_vente (etablissement_id);


-- ============================================================================
-- etablissements.table_pdv — les tables d'un point de vente qui en a
-- CLASSE C · branche C2 — référentiel
-- Story : ETB-03
-- ============================================================================
CREATE TABLE etablissements.table_pdv (
    id                UUID CONSTRAINT pk_table_pdv PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    point_de_vente_id UUID        NOT NULL,
    code              TEXT        NOT NULL,
    libelle           TEXT            NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_table_pdv_pdv FOREIGN KEY (point_de_vente_id)
        REFERENCES etablissements.point_de_vente (id),
    CONSTRAINT uq_table_pdv_code UNIQUE (point_de_vente_id, code)
);

ALTER TABLE etablissements.table_pdv ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.table_pdv FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.table_pdv
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.table_pdv
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.table_pdv TO kaya_app;


-- ============================================================================
-- etablissements.parametre_catalogue — le référentiel des CLÉS de configuration
-- CLASSE C · branche C2 — référentiel partagé
-- Story : ETB-04, ADM-06
-- Aucun paramètre métier n'est en dur dans le code : il a d'abord une clé ici.
-- ============================================================================
CREATE TABLE etablissements.parametre_catalogue (
    id                   UUID CONSTRAINT pk_parametre_catalogue PRIMARY KEY,
    tenant_id            UUID        NOT NULL,
    cle                  TEXT        NOT NULL,
    libelle              TEXT        NOT NULL,
    type_valeur          TEXT        NOT NULL,   -- booleen, entier, montant, texte, json
    -- La portée LA PLUS BASSE à laquelle la clé peut être posée : une clé de
    -- portée MODULE ne se surcharge pas par point de vente.
    portee_la_plus_basse TEXT        NOT NULL,
    valeur_defaut        JSONB           NULL,
    cree_le              TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_parametre_catalogue_cle UNIQUE (tenant_id, cle),
    -- Les quatre portées sont STRUCTURELLES — elles décrivent la chaîne
    -- d'héritage du modèle, pas de la configuration d'établissement. Elles ne
    -- changent pas sans que du code change avec elles : la CHECK est légitime,
    -- là où celle de profil_stock ne l'était pas.
    CONSTRAINT ck_parametre_catalogue_portee CHECK (
        portee_la_plus_basse IN ('TENANT', 'ETABLISSEMENT', 'MODULE', 'POINT_DE_VENTE'))
);

ALTER TABLE etablissements.parametre_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.parametre_catalogue FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.parametre_catalogue
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.parametre_catalogue
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.parametre_catalogue TO kaya_app;


-- ============================================================================
-- etablissements.parametre_configuration — une valeur, à une portée donnée
-- CLASSE C · branche C2 — référentiel de paramètres
-- Story : ETB-04
-- La chaîne d'héritage tenant → établissement → module → point de vente se
-- résout en UNE requête, servie par ix_parametre_configuration_resolution.
-- ============================================================================
CREATE TABLE etablissements.parametre_configuration (
    id         UUID CONSTRAINT pk_parametre_configuration PRIMARY KEY,
    tenant_id  UUID        NOT NULL,
    cle        TEXT        NOT NULL,
    portee     TEXT        NOT NULL,
    -- NOT NULL, y compris à la portée TENANT — où la colonne porte alors l'id
    -- du tenant lui-même. Une colonne nullable rendrait uq_…_portee inopérante
    -- justement sur la portée la plus large, celle où un doublon coûte le plus.
    portee_id  UUID        NOT NULL,
    valeur     JSONB       NOT NULL,
    cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_parametre_configuration_cle FOREIGN KEY (tenant_id, cle)
        REFERENCES etablissements.parametre_catalogue (tenant_id, cle),
    CONSTRAINT uq_parametre_configuration_portee UNIQUE (tenant_id, cle, portee, portee_id),
    CONSTRAINT ck_parametre_configuration_portee CHECK (
        portee IN ('TENANT', 'ETABLISSEMENT', 'MODULE', 'POINT_DE_VENTE'))
);

ALTER TABLE etablissements.parametre_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.parametre_configuration FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.parametre_configuration
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.parametre_configuration
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.parametre_configuration TO kaya_app;

-- Sert : résoudre une clé le long de sa chaîne d'héritage, du point de vente
-- vers le tenant, en une seule requête (ETB-04)
CREATE INDEX ix_parametre_configuration_resolution
    ON etablissements.parametre_configuration (cle, portee, portee_id);


-- ============================================================================
-- etablissements.branding — logo, couleurs, en-têtes de documents
-- CLASSE C · branche C2 — référentiel
-- Story : ETB-05
-- ============================================================================
CREATE TABLE etablissements.branding (
    id                UUID CONSTRAINT pk_branding PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    portee            TEXT        NOT NULL,
    portee_id         UUID        NOT NULL,
    logo_uri          TEXT            NULL,
    couleur_primaire  TEXT            NULL,
    entete_document   TEXT            NULL,
    pied_document     TEXT            NULL,
    mentions_legales  TEXT            NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_branding_portee UNIQUE (tenant_id, portee, portee_id),
    CONSTRAINT ck_branding_portee CHECK (portee IN ('TENANT', 'ETABLISSEMENT'))
);

ALTER TABLE etablissements.branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.branding FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.branding
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.branding
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON etablissements.branding TO kaya_app;


-- ============================================================================
-- etablissements.note_etablissement — un mot laissé sur l'établissement
-- CLASSE A · branche A4 — append-only, commutative, sans effet monétaire
-- Story : TRX-01
-- C'est LE PATRON du module doré : la table la plus simple du modèle, celle sur
-- laquelle se lisent d'un coup d'œil le tronc « écriture », les quatre
-- instructions RLS, le rattachement inter-modules nu, et le GRANT qui dit la
-- classe. Toute table de classe A lui ressemble.
-- ============================================================================
CREATE TABLE etablissements.note_etablissement (
    id                UUID CONSTRAINT pk_note_etablissement PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    etablissement_id  UUID        NOT NULL,
    -- Pas de REFERENCES : socle/comptes est un autre module.
    auteur_compte_id  UUID        NOT NULL,
    contenu           TEXT        NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_note_etablissement_etab FOREIGN KEY (etablissement_id)
        REFERENCES etablissements.etablissement (id)
);

COMMENT ON COLUMN etablissements.note_etablissement.auteur_compte_id IS
    'Rattachement inter-modules vers comptes.compte — colonne NUE, sans REFERENCES, délibérément.';
COMMENT ON COLUMN etablissements.note_etablissement.horodatage_client IS
    'INDICATIF. Aucune règle métier, fiscale, de clôture ou de durée ne s''y appuie.';
COMMENT ON COLUMN etablissements.note_etablissement.cree_le IS
    'AUTORITÉ SERVEUR. Tout s''y appuie : tri, pagination, durées.';

ALTER TABLE etablissements.note_etablissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements.note_etablissement FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON etablissements.note_etablissement
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON etablissements.note_etablissement
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- Ni UPDATE ni DELETE : une entité de classe A est append-only. Une correction
-- est une nouvelle ligne. Accorder UPDATE casserait la commutativité que le test
-- de désordre vérifie, et le classement en A deviendrait faux sans que rien ne
-- le signale.
GRANT SELECT, INSERT ON etablissements.note_etablissement TO kaya_app;

-- Sert : afficher les notes d'un établissement, de la plus récente à la plus
-- ancienne, paginées sans saut ni répétition (TRX-01)
CREATE INDEX ix_note_etablissement_etab_date
    ON etablissements.note_etablissement (etablissement_id, cree_le DESC, id DESC);
