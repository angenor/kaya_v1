-- ============================================================================
-- SCHÉMA caisse — crate socle/caisse
--
-- CE QU'IL COUVRE : l'argent qui entre et qui sort, et qui en répond. Les
-- caisses, les shifts, les encaissements quel qu'en soit le mode, les sorties,
-- les comptages contradictoires, les écarts, et les deux clôtures — de shift et
-- de journée.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — CE QUI est encaissé. encaissement porte cible_type et cible_id, deux
--     colonnes NUES : la note d'un séjour vit dans hebergement, l'addition
--     d'une table dans ventes, et ces schémas sont d'autres modules. La caisse
--     encaisse un montant contre une référence qu'elle ne sait pas ouvrir.
--   — le document fiscal → socle/fiscalite. Encaisser n'est pas certifier, et
--     l'un peut réussir quand l'autre échoue : c'est très exactement le cas que
--     la file de certification existe pour tenir.
--   — la personne qui tient la caisse → socle/comptes. compte_id est nu.
--
-- UN RÈGLEMENT FRACTIONNÉ EST PLUSIEURS LIGNES, une par mode, jamais une ligne
-- à modes multiples. « La classe de chaque part » (registre §5.3) n'a de sens
-- que si chaque part est une ligne.
-- ============================================================================

CREATE SCHEMA caisse;
GRANT USAGE ON SCHEMA caisse TO kaya_app;


-- ============================================================================
-- caisse.caisse — un tiroir, physique ou non, rattaché à un établissement
-- CLASSE C · branche C2 — référentiel
-- Story : ETB-03
-- ============================================================================
CREATE TABLE caisse.caisse (
    id               UUID CONSTRAINT pk_caisse PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id UUID        NOT NULL,
    code             TEXT        NOT NULL,
    libelle          TEXT        NOT NULL,
    active           BOOLEAN     NOT NULL DEFAULT true,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_caisse_code UNIQUE (etablissement_id, code)
);

COMMENT ON COLUMN caisse.caisse.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';

ALTER TABLE caisse.caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.caisse FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.caisse
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.caisse
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON caisse.caisse TO kaya_app;

-- Sert : lister les caisses d'un établissement à l'ouverture de shift (ETB-03)
CREATE INDEX ix_caisse_etab ON caisse.caisse (etablissement_id);


-- ============================================================================
-- caisse.shift — un utilisateur, une caisse, une période
-- CLASSE B · branche B3 — un utilisateur, une caisse, une période
-- Story : CAI-01
-- UN SEUL SHIFT OUVERT PAR CAISSE, et c'est un index unique PARTIEL qui le
-- tient — pas une vérification applicative. Deux ouvertures simultanées sur la
-- même caisse est exactement le conflit que la classe B décrit ; la contrainte
-- est ce qui en fait échouer une, au lieu de laisser deux personnes répondre du
-- même tiroir.
-- ============================================================================
CREATE TABLE caisse.shift (
    id                UUID CONSTRAINT pk_shift PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    caisse_id         UUID           NOT NULL,
    -- Pas de REFERENCES : socle/comptes est un autre module.
    compte_id         UUID           NOT NULL,
    ouvert_le         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    ferme_le          TIMESTAMPTZ        NULL,
    fond_declare      montant_mineur NOT NULL,
    devise            code_devise    NOT NULL,
    etat              TEXT           NOT NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_shift_caisse FOREIGN KEY (caisse_id)
        REFERENCES caisse.caisse (id),
    -- Cycle de vie du modèle, non configurable : un état de plus s'accompagne
    -- du code qui le fait vivre.
    CONSTRAINT ck_shift_etat CHECK (etat IN ('OUVERT', 'PASSE', 'FERME'))
);

COMMENT ON COLUMN caisse.shift.compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';
COMMENT ON COLUMN caisse.shift.horodatage_client IS
    'INDICATIF. La durée d''un shift et toute clôture s''appuient sur cree_le / ouvert_le.';

ALTER TABLE caisse.shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.shift FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.shift
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.shift
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON caisse.shift TO kaya_app;

-- L'invariant « un seul shift ouvert par caisse », tenu par la base.
CREATE UNIQUE INDEX uq_shift_caisse_ouvert
    ON caisse.shift (caisse_id) WHERE etat = 'OUVERT';

-- Sert : l'historique des shifts d'une caisse, du plus récent au plus ancien —
-- la reprise de clôture et le récapitulatif de journée (CAI-05, CAI-06)
CREATE INDEX ix_shift_caisse_ouvert ON caisse.shift (caisse_id, ouvert_le DESC);


-- ============================================================================
-- caisse.encaissement — de l'argent reçu, contre quelque chose
-- CLASSE B · branche B3 — espèces, virement, à crédit : effet monétaire,
--                          constaté sans tiers en ligne
-- CLASSE D · branche D1 — Mobile Money, carte : un agrégateur tranche
-- Story : CAI-02
-- DEUX CLASSES SUR UNE TABLE, et c'est le cas normal. Le mode de règlement
-- décide de la classe : c'est pourquoi ck_encaissement_mode est une CHECK
-- légitime — un mode de plus n'est pas de la configuration d'établissement,
-- c'est du code de plus, et une classe hors-ligne de plus à trancher.
-- UPDATE est accordé pour LA SEULE TRANSITION D'ÉTAT DES MODES D : un paiement
-- Mobile Money part EN_ATTENTE et revient CONFIRME ou ECHOUE. Aucun montant, ni
-- aucun mode, ne se récrit.
-- ============================================================================
CREATE TABLE caisse.encaissement (
    id                UUID CONSTRAINT pk_encaissement PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    shift_id          UUID           NOT NULL,
    mode              TEXT           NOT NULL,
    montant           montant_mineur NOT NULL,
    devise            code_devise    NOT NULL,
    -- Ce qui est encaissé : une note de séjour, une addition de table, un bon
    -- de dépôt pressing. Colonnes NUES, sans REFERENCES — ces agrégats vivent
    -- dans d'autres modules, et certains n'existent pas encore.
    cible_type        TEXT           NOT NULL,
    cible_id          UUID               NULL,
    -- Référence de l'agrégateur pour les modes D. Nulle pour les modes B.
    reference_externe TEXT               NULL,
    etat              TEXT           NOT NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_encaissement_shift FOREIGN KEY (shift_id)
        REFERENCES caisse.shift (id),
    CONSTRAINT ck_encaissement_mode CHECK (mode IN (
        'ESPECES', 'VIREMENT', 'A_CREDIT',        -- classe B
        'MOBILE_MONEY', 'CARTE')),                -- classe D
    -- Un encaissement négatif serait un remboursement déguisé : un
    -- remboursement est une contre-passation, avec son propre parcours.
    CONSTRAINT ck_encaissement_montant_positif CHECK (montant > 0)
);

COMMENT ON COLUMN caisse.encaissement.cible_id IS
    'Rattachement inter-modules (note de séjour, addition, bon de dépôt) — nu, sans REFERENCES.';

ALTER TABLE caisse.encaissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.encaissement FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.encaissement
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.encaissement
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON caisse.encaissement TO kaya_app;

-- Sert : le récapitulatif de clôture de shift, ventilé par mode de règlement
-- (CAI-05)
CREATE INDEX ix_encaissement_shift_mode ON caisse.encaissement (shift_id, mode);


-- ============================================================================
-- caisse.sortie_de_caisse — une dépense, une avance, un prélèvement
-- CLASSE B · branche B3 — effet monétaire
-- Story : CAI-03
-- SELECT, INSERT seuls, bien que la classe soit B : une dépense constatée ne se
-- corrige pas, elle se contre-passe. C'est une décision de FORME, pas de
-- classe — le privilège dit en plus qu'aucune ligne ne se récrit.
-- ============================================================================
CREATE TABLE caisse.sortie_de_caisse (
    id                       UUID CONSTRAINT pk_sortie_de_caisse PRIMARY KEY,
    tenant_id                UUID           NOT NULL,
    shift_id                 UUID           NOT NULL,
    type                     TEXT           NOT NULL,   -- DEPENSE | AVANCE | PRELEVEMENT
    montant                  montant_mineur NOT NULL,
    devise                   code_devise    NOT NULL,
    motif                    TEXT           NOT NULL,
    piece_justificative_uri  TEXT               NULL,
    beneficiaire             TEXT               NULL,
    horodatage_client        TIMESTAMPTZ        NULL,
    cree_le                  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_sortie_de_caisse_shift FOREIGN KEY (shift_id)
        REFERENCES caisse.shift (id),
    -- Un motif vide rendrait le contrôle de fin de mois impossible : c'est la
    -- seule chose qui distingue une avance d'un trou.
    CONSTRAINT ck_sortie_de_caisse_motif_non_vide CHECK (btrim(motif) <> '')
);

ALTER TABLE caisse.sortie_de_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.sortie_de_caisse FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.sortie_de_caisse
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.sortie_de_caisse
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON caisse.sortie_de_caisse TO kaya_app;

-- Sert : les sorties d'un shift au récapitulatif de clôture (CAI-03, CAI-05)
CREATE INDEX ix_sortie_de_caisse_shift ON caisse.sortie_de_caisse (shift_id);


-- ============================================================================
-- caisse.comptage — ce qu'on a compté dans le tiroir, à trois moments
-- CLASSE B · branche B3 — effet monétaire, tracé
-- Story : CAI-04
-- ============================================================================
CREATE TABLE caisse.comptage (
    id                UUID CONSTRAINT pk_comptage PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    shift_id          UUID           NOT NULL,
    moment            TEXT           NOT NULL,
    total_compte      montant_mineur NOT NULL,
    devise            code_devise    NOT NULL,
    -- Le témoin du comptage contradictoire. Pas de REFERENCES : comptes est un
    -- autre module. Nullable : le comptage d'ouverture n'a pas de témoin.
    compte_id_temoin  UUID               NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_comptage_shift FOREIGN KEY (shift_id)
        REFERENCES caisse.shift (id),
    CONSTRAINT ck_comptage_moment CHECK (
        moment IN ('OUVERTURE', 'PASSATION', 'CLOTURE'))
);

COMMENT ON COLUMN caisse.comptage.compte_id_temoin IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';

ALTER TABLE caisse.comptage ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.comptage FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.comptage
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.comptage
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON caisse.comptage TO kaya_app;

-- Sert : retrouver les comptages d'un shift à la clôture (CAI-04, CAI-05)
CREATE INDEX ix_comptage_shift ON caisse.comptage (shift_id);


-- ============================================================================
-- caisse.coupure_comptee — le détail par coupure d'un comptage
-- CLASSE B · branche B3 — effet monétaire, tracé
-- Story : CAI-04
-- ★ ENTITÉ NOMMÉE PAR LE CYCLE D1 — le registre §5.3 décrivait le comptage par
-- coupure sans nommer la table qui le porte. Inscrite au registre dans le même
-- changement.
-- Compter « 240 000 » et compter « douze billets de 10 000, quatre de 5 000,
-- cent de 1 000 » ne se valent pas : le second se recompte, le premier se croit.
-- ============================================================================
CREATE TABLE caisse.coupure_comptee (
    id                UUID CONSTRAINT pk_coupure_comptee PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    comptage_id       UUID           NOT NULL,
    valeur_faciale    montant_mineur NOT NULL,
    nombre            INTEGER        NOT NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_coupure_comptee_comptage FOREIGN KEY (comptage_id)
        REFERENCES caisse.comptage (id),
    -- Une même coupure ne se déclare qu'une fois par comptage : deux lignes
    -- « billets de 10 000 » se contrediraient sans qu'on sache laquelle croire.
    CONSTRAINT uq_coupure_comptee_valeur UNIQUE (comptage_id, valeur_faciale)
);

ALTER TABLE caisse.coupure_comptee ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.coupure_comptee FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.coupure_comptee
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.coupure_comptee
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON caisse.coupure_comptee TO kaya_app;


-- ============================================================================
-- caisse.ecart_de_caisse — la différence entre l'attendu et le constaté
-- CLASSE B · branche B3 — effet monétaire, tracé
-- Story : CAI-04
-- ============================================================================
CREATE TABLE caisse.ecart_de_caisse (
    id                UUID CONSTRAINT pk_ecart_de_caisse PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    comptage_id       UUID           NOT NULL,
    attendu           montant_mineur NOT NULL,
    constate          montant_mineur NOT NULL,
    ecart             montant_mineur NOT NULL,
    devise            code_devise    NOT NULL,
    motif             TEXT               NULL,
    notifie_le        TIMESTAMPTZ        NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_ecart_de_caisse_comptage FOREIGN KEY (comptage_id)
        REFERENCES caisse.comptage (id),
    -- Un écart nul n'a pas de motif ; un écart non nul en exige un. C'est la
    -- contrainte qui empêche la case « écart constaté » de devenir un réflexe
    -- muet en fin de service.
    CONSTRAINT ck_ecart_motif_si_non_nul CHECK (
        ecart = 0 OR (motif IS NOT NULL AND btrim(motif) <> ''))
);

ALTER TABLE caisse.ecart_de_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.ecart_de_caisse FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.ecart_de_caisse
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.ecart_de_caisse
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON caisse.ecart_de_caisse TO kaya_app;


-- ============================================================================
-- caisse.cloture_shift — le shift est arrêté, et son récapitulatif est figé
-- CLASSE B · branche B3 — sérialisation par caisse
-- Story : CAI-05
-- ============================================================================
CREATE TABLE caisse.cloture_shift (
    id                UUID CONSTRAINT pk_cloture_shift PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    shift_id          UUID        NOT NULL,
    cloture_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Récapitulatif FIGÉ au moment de la clôture : par mode de règlement, par
    -- point de vente, par module. Il est dénormalisé exprès — recalculé six
    -- mois plus tard, il ne rendrait plus le même montant, et c'est celui du
    -- jour qui a été signé.
    recapitulatif     JSONB       NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_cloture_shift_shift FOREIGN KEY (shift_id)
        REFERENCES caisse.shift (id),
    CONSTRAINT uq_cloture_shift UNIQUE (shift_id)
);

ALTER TABLE caisse.cloture_shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.cloture_shift FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.cloture_shift
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.cloture_shift
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON caisse.cloture_shift TO kaya_app;


-- ============================================================================
-- caisse.cloture_journaliere — une seule par établissement et par jour
-- CLASSE B · branche B3 — ATOMIQUE, explicitement B au cadrage §11.3
-- Story : CAI-06
-- ============================================================================
CREATE TABLE caisse.cloture_journaliere (
    id                UUID CONSTRAINT pk_cloture_journaliere PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    journee           DATE        NOT NULL,
    cloture_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    recapitulatif     JSONB       NOT NULL,
    -- Ce qui bloquait la clôture et a été levé — stickers bas, documents non
    -- certifiés, shift resté ouvert. Écrire CE QU'ON A PASSÉ OUTRE est ce qui
    -- rend la clôture relisable ; sans cette colonne, un blocage levé ne
    -- laisserait aucune trace.
    blocages_leves    JSONB           NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cloture_journaliere_jour UNIQUE (etablissement_id, journee)
);

COMMENT ON COLUMN caisse.cloture_journaliere.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';

ALTER TABLE caisse.cloture_journaliere ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse.cloture_journaliere FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON caisse.cloture_journaliere
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON caisse.cloture_journaliere
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON caisse.cloture_journaliere TO kaya_app;

-- Sert : retrouver la clôture d'un jour donné, et la dernière journée close
-- d'un établissement (CAI-06)
CREATE INDEX ix_cloture_journaliere_etab_jour
    ON caisse.cloture_journaliere (etablissement_id, journee DESC);
