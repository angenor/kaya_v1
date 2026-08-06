-- ============================================================================
-- SCHÉMA comptes — crate socle/comptes
--
-- CE QU'IL COUVRE : qui est une personne, qui a un compte pour se connecter,
-- quels rôles ce compte porte et SUR QUEL ÉTABLISSEMENT, quels appareils sont
-- enrôlés, et le journal d'audit — immuable — de ce qui a été fait.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — les sessions, les JWT, les jetons de rafraîchissement. Ils sont
--     ÉPHÉMÈRES RECONSTRUCTIBLES et vivent en Redis (constitution, principe 2 ;
--     registre §9). Redis vidé, tout le monde se reconnecte et aucune donnée
--     métier ne manque. Leur donner une table les rendrait durables, donc à
--     purger, donc à sauvegarder.
--   — l'établissement lui-même → socle/etablissements. compte_role porte un
--     etablissement_id NU, sans REFERENCES.
--   — la paie et le contrat de travail. `employe` est une PROVISION, ajoutée
--     par une tâche ultérieure de ce cycle, et n'est JAMAIS confondue avec
--     `compte` (CPT-00).
--
-- TROIS ENTITÉS, JAMAIS CONFONDUES : personne, compte, employe.
-- Une femme de ménage est un EMPLOYÉ SANS COMPTE ; un comptable externe est un
-- COMPTE SANS CONTRAT. Écrire « le salaire de l'utilisateur » quelque part
-- rendrait la paie inaccessible sans refonte de l'authentification.
-- ============================================================================

CREATE SCHEMA comptes;
GRANT USAGE ON SCHEMA comptes TO kaya_app;


-- ============================================================================
-- comptes.personne — l'identité, partagée entre les établissements du tenant
-- CLASSE C · branche C2 — identité partagée entre établissements
-- Story : CPT-00
-- Porte numero_piece, type_piece et piece_capturee_le pour la purge TRX-06 :
-- la purge ARTCI est une ANONYMISATION exécutée sous kaya_owner, jamais un
-- DELETE accordé à l'application.
-- ============================================================================
CREATE TABLE comptes.personne (
    id                UUID CONSTRAINT pk_personne PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    nom               TEXT        NOT NULL,
    prenoms           TEXT            NULL,
    -- Forme normalisée (sans accent, en minuscules) : c'est elle qu'indexe
    -- ix_personne_nom, parce qu'on ne tape pas « Kouamé » avec son accent au
    -- comptoir à vingt-trois heures.
    nom_normalise     TEXT        NOT NULL,
    telephone_e164    TEXT            NULL,
    email             TEXT            NULL,
    type_piece        TEXT            NULL,
    numero_piece      TEXT            NULL,
    -- Date de capture de la pièce : c'est elle qui déclenche la purge TRX-06,
    -- et ix_personne_purge existe pour que la purge ne balaie pas la table.
    piece_capturee_le TIMESTAMPTZ     NULL,
    consentement_le   TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_personne_telephone UNIQUE (tenant_id, telephone_e164),
    -- E.164 : le « + » et jusqu'à quinze chiffres. Normaliser à l'écriture est
    -- ce qui rend la recherche par téléphone exacte plutôt qu'approchante.
    CONSTRAINT ck_personne_telephone_e164 CHECK (
        telephone_e164 IS NULL OR telephone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

ALTER TABLE comptes.personne ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.personne FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.personne
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.personne
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.personne TO kaya_app;

-- Sert : recherche d'une personne par DÉBUT DE NOM au comptoir — moins de
-- 300 ms sur 10 000 fiches (SC-009, SEJ-01, CPT-00). Un B-tree sert le préfixe,
-- qui est l'usage réel : on tape le début d'un nom. La recherche INFIXE
-- demanderait pg_trgm, délibérément non créée tant qu'on n'a pas constaté
-- qu'elle manque (décision D-13).
CREATE INDEX ix_personne_nom ON comptes.personne (nom_normalise text_pattern_ops);

-- Sert : recherche par numéro de téléphone exact, saisi au comptoir (SC-009)
CREATE INDEX ix_personne_telephone ON comptes.personne (telephone_e164);

-- Sert : recherche par pièce d'identité, type et numéro (SC-009, SEJ-06)
CREATE INDEX ix_personne_piece ON comptes.personne (type_piece, numero_piece);

-- Sert : la purge ARTCI des pièces d'identité au-delà du délai de rétention,
-- sans balayage complet de la table (TRX-06)
CREATE INDEX ix_personne_purge ON comptes.personne (piece_capturee_le);


-- ============================================================================
-- comptes.compte — l'identité d'authentification
-- CLASSE C · branche C2 — identité d'authentification
-- Story : CPT-01
-- ============================================================================
CREATE TABLE comptes.compte (
    id                    UUID CONSTRAINT pk_compte PRIMARY KEY,
    tenant_id             UUID        NOT NULL,
    personne_id           UUID        NOT NULL,
    identifiant           TEXT        NOT NULL,
    type_identifiant      TEXT        NOT NULL,   -- TELEPHONE | EMAIL | CODE
    empreinte_mot_de_passe TEXT           NULL,   -- jamais le mot de passe
    etat                  TEXT        NOT NULL,   -- ACTIF | SUSPENDU | REVOQUE
    derniere_connexion_le TIMESTAMPTZ     NULL,
    cree_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_compte_personne FOREIGN KEY (personne_id)
        REFERENCES comptes.personne (id),
    CONSTRAINT uq_compte_identifiant UNIQUE (tenant_id, identifiant)
);

COMMENT ON COLUMN comptes.compte.empreinte_mot_de_passe IS
    'Empreinte seule (argon2). Le mot de passe n''entre jamais en base, même chiffré.';

ALTER TABLE comptes.compte ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.compte FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.compte
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.compte
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- Pas de DELETE : un compte ne se supprime pas, il se révoque (etat). La
-- suppression de ce qui ne se supprime jamais est d'ailleurs une famille du
-- journal d'audit (`suppression`, CPT-01).
GRANT SELECT, INSERT, UPDATE ON comptes.compte TO kaya_app;

-- Sert : retrouver un compte par son identifiant à la connexion (CPT-01)
CREATE INDEX ix_compte_identifiant ON comptes.compte (identifiant);


-- ============================================================================
-- comptes.methode_authentification — mot de passe, OTP par SMS
-- CLASSE C · branche C2 — référentiel
-- Story : CPT-01
-- ============================================================================
CREATE TABLE comptes.methode_authentification (
    id         UUID CONSTRAINT pk_methode_authentification PRIMARY KEY,
    tenant_id  UUID        NOT NULL,
    -- Valeurs semées : MOT_DE_PASSE, OTP_SMS. Aucune CHECK : une méthode
    -- supplémentaire est de la configuration, pas une migration du parc.
    code       TEXT        NOT NULL,
    libelle    TEXT        NOT NULL,
    activee    BOOLEAN     NOT NULL DEFAULT true,
    cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_methode_authentification_code UNIQUE (tenant_id, code)
);

ALTER TABLE comptes.methode_authentification ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.methode_authentification FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.methode_authentification
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.methode_authentification
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.methode_authentification TO kaya_app;


-- ============================================================================
-- comptes.role — gérant, serveuse, réceptionniste, propriétaire
-- CLASSE C · branche C2 — référentiel
-- Story : CPT-02
-- ============================================================================
CREATE TABLE comptes.role (
    id         UUID CONSTRAINT pk_role PRIMARY KEY,
    tenant_id  UUID        NOT NULL,
    code       TEXT        NOT NULL,
    libelle    TEXT        NOT NULL,
    cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_code UNIQUE (tenant_id, code)
);

ALTER TABLE comptes.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.role FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.role
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.role
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.role TO kaya_app;


-- ============================================================================
-- comptes.permission — une action nommée, ex. pdv.remise.appliquer
-- CLASSE C · branche C2 — référentiel
-- Story : CPT-02
-- ============================================================================
CREATE TABLE comptes.permission (
    id                    UUID CONSTRAINT pk_permission PRIMARY KEY,
    tenant_id             UUID        NOT NULL,
    code                  TEXT        NOT NULL,
    -- Quel module d'activité porte cette permission. Colonne de CODE, pas
    -- d'identifiant : etablissements est un autre module, et un code se
    -- compare sans jointure.
    module_activite_code  TEXT            NULL,
    libelle               TEXT        NOT NULL,
    cree_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_permission_code UNIQUE (tenant_id, code)
);

COMMENT ON COLUMN comptes.permission.module_activite_code IS
    'Rattachement inter-modules vers etablissements.module_activite.code — nu, sans REFERENCES.';

ALTER TABLE comptes.permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.permission FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.permission
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.permission
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.permission TO kaya_app;


-- ============================================================================
-- comptes.role_permission — ce qu'un rôle permet
-- CLASSE C · branche C2 — référentiel
-- Story : CPT-02
-- ============================================================================
CREATE TABLE comptes.role_permission (
    id            UUID CONSTRAINT pk_role_permission PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    role_id       UUID        NOT NULL,
    permission_id UUID        NOT NULL,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id)
        REFERENCES comptes.role (id),
    CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id)
        REFERENCES comptes.permission (id),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

ALTER TABLE comptes.role_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.role_permission FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.role_permission
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.role_permission
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.role_permission TO kaya_app;


-- ============================================================================
-- comptes.compte_role — quel rôle, SUR QUEL ÉTABLISSEMENT
-- CLASSE C · branche C2 — explicitement C au cadrage §11.3
-- Story : CPT-02, ETB-01
-- La colonne etablissement_id est le point de cette table : « un utilisateur
-- peut être rattaché à plusieurs établissements avec des rôles différents sur
-- chacun » (ETB-01). Sans elle, Adjoua gérante à Abengourou serait gérante
-- partout. AUCUNE élévation de privilège hors ligne, jamais.
-- ============================================================================
CREATE TABLE comptes.compte_role (
    id               UUID CONSTRAINT pk_compte_role PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    compte_id        UUID        NOT NULL,
    role_id          UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id UUID        NOT NULL,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_compte_role_compte FOREIGN KEY (compte_id)
        REFERENCES comptes.compte (id),
    CONSTRAINT fk_compte_role_role FOREIGN KEY (role_id)
        REFERENCES comptes.role (id),
    CONSTRAINT uq_compte_role_portee UNIQUE (compte_id, role_id, etablissement_id)
);

COMMENT ON COLUMN comptes.compte_role.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';

ALTER TABLE comptes.compte_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.compte_role FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.compte_role
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.compte_role
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.compte_role TO kaya_app;

-- Sert : charger les rôles d'un compte à l'ouverture de session (CPT-02)
CREATE INDEX ix_compte_role_compte ON comptes.compte_role (compte_id);


-- ============================================================================
-- comptes.appareil_enrole — un terminal reconnu, et son attestation
-- CLASSE C · branche C2 — explicitement C au cadrage §11.3
-- Story : CPT-05, CPT-06
-- L'ATTESTATION D'INTÉGRITÉ N'A PAS DE TABLE : son résultat est l'état COURANT
-- de l'appareil, donc deux colonnes ici. CPT-06 ne demande pas d'historique, et
-- une table d'historique qu'on ne relit jamais est une table qu'on purge un jour
-- sans savoir ce qu'on perd.
-- ============================================================================
CREATE TABLE comptes.appareil_enrole (
    id                      UUID CONSTRAINT pk_appareil_enrole PRIMARY KEY,
    tenant_id               UUID        NOT NULL,
    compte_id               UUID        NOT NULL,
    libelle                 TEXT        NOT NULL,
    cle_publique            TEXT        NOT NULL,
    etat                    TEXT        NOT NULL,   -- ENROLE | REVOQUE
    enrole_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoque_le              TIMESTAMPTZ     NULL,
    attestation_etat        TEXT            NULL,   -- VALIDE | INVALIDE | INDISPONIBLE
    attestation_verifiee_le TIMESTAMPTZ     NULL,
    cree_le                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_appareil_enrole_compte FOREIGN KEY (compte_id)
        REFERENCES comptes.compte (id),
    CONSTRAINT uq_appareil_enrole_cle UNIQUE (tenant_id, cle_publique)
);

ALTER TABLE comptes.appareil_enrole ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.appareil_enrole FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.appareil_enrole
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.appareil_enrole
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON comptes.appareil_enrole TO kaya_app;

-- Sert : lister les appareils d'un compte pour les révoquer (CPT-05)
CREATE INDEX ix_appareil_enrole_compte ON comptes.appareil_enrole (compte_id);


-- ============================================================================
-- comptes.journal_audit — ce qui a été fait, et par qui. IMMUABLE.
-- CLASSE A · branche A4 — append-only, immuable, sans effet propre
-- Story : CPT-04, DIR-04
-- Le journal est A, mais L'OPÉRATION QU'IL TRACE GARDE SA PROPRE CLASSE :
-- tracer une remise hors ligne est A, appliquer la remise est B. Les deux ne
-- voyagent pas ensemble.
-- ============================================================================
CREATE TABLE comptes.journal_audit (
    id                UUID CONSTRAINT pk_journal_audit PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    auteur_compte_id  UUID            NULL,   -- NULL pour une écriture système
    famille           TEXT        NOT NULL,
    action            TEXT        NOT NULL,
    cible_type        TEXT        NOT NULL,
    cible_id          UUID            NULL,
    contexte          JSONB           NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Les DOUZE familles de docs/taxonomie-audit.md, versionnées dans le dépôt.
    -- Cette CHECK est légitime là où celle de profil_stock ne l'était pas :
    -- une famille ne s'ajoute pas par configuration, elle s'ajoute avec le code
    -- qui l'écrit — et une treizième se justifie par une story, pas par une
    -- intuition (taxonomie, « Ajouter une famille »).
    CONSTRAINT ck_journal_audit_famille CHECK (famille IN (
        'remise',
        'annulation_ligne_envoyee',
        'avoir',
        'ouverture_tiroir',
        'modification_tarif',
        'suppression',
        'changement_role',
        'ecart_caisse',
        'rebascule_palier_passage',
        'forcage_disponibilite',
        'derive_horloge_constatee',
        'consultation_piece_identite'))
);

COMMENT ON COLUMN comptes.journal_audit.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN comptes.journal_audit.contexte IS
    'Détail de l''action. JAMAIS la valeur lue pour consultation_piece_identite.';

ALTER TABLE comptes.journal_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.journal_audit FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.journal_audit
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.journal_audit
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- IMMUABLE PAR PRIVILÈGE. Un journal d'audit qu'on peut récrire n'est pas un
-- journal d'audit : c'est une opinion.
GRANT SELECT, INSERT ON comptes.journal_audit TO kaya_app;

-- Sert : la consultation filtrée du journal par établissement, famille d'action
-- et période (DIR-04, CPT-04)
CREATE INDEX ix_journal_audit_filtre
    ON comptes.journal_audit (etablissement_id, famille, cree_le DESC);

-- Sert : la même consultation filtrée par auteur — « qu'a fait Adjoua hier ? »
-- (DIR-04)
CREATE INDEX ix_journal_audit_auteur
    ON comptes.journal_audit (auteur_compte_id, cree_le DESC);


-- ============================================================================
-- comptes.releve_position — le géorepérage SOUPLE, signal d'audit
-- CLASSE A · branche A4 — signal d'audit, JAMAIS BLOQUANT
-- Story : CPT-06
-- ★ ENTITÉ NOMMÉE PAR LE CYCLE D1 — le registre §5.2 la décrivait sans la
-- nommer (« Relevé de position (géorepérage souple) »). Inscrite au registre
-- dans le même changement.
-- Souple veut dire : on relève, on n'interdit pas. Une position hors zone
-- n'empêche jamais une opération — elle laisse une trace que quelqu'un lira.
-- ============================================================================
CREATE TABLE comptes.releve_position (
    id                 UUID CONSTRAINT pk_releve_position PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    compte_id          UUID        NOT NULL,
    appareil_enrole_id UUID        NOT NULL,
    latitude           NUMERIC(9, 6)  NULL,
    longitude          NUMERIC(9, 6)  NULL,
    precision_m        NUMERIC        NULL,
    -- Le terminal déclare une position simulée quand le système d'exploitation
    -- le lui dit. La colonne existe pour que le signal soit LISIBLE plutôt que
    -- deviné à la lecture de coordonnées trop rondes.
    position_simulee   BOOLEAN     NOT NULL DEFAULT false,
    horodatage_client  TIMESTAMPTZ     NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_releve_position_appareil FOREIGN KEY (appareil_enrole_id)
        REFERENCES comptes.appareil_enrole (id)
);

ALTER TABLE comptes.releve_position ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes.releve_position FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON comptes.releve_position
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON comptes.releve_position
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON comptes.releve_position TO kaya_app;

-- Sert : relire les positions d'un compte sur une période, à l'enquête (CPT-06)
CREATE INDEX ix_releve_position_compte_date
    ON comptes.releve_position (compte_id, cree_le DESC, id DESC);
