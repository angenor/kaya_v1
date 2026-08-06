-- ============================================================================
-- SCHÉMA editeur — crate socle/editeur
--
-- CE QU'IL COUVRE : la relation entre l'éditeur et ses clients. Les plans et
-- leurs paliers, les abonnements, ce qui est compté pour facturer, la
-- télémétrie du parc, les bundles de diagnostic, et les deux tables de
-- l'encaissement d'abonnement.
--
-- ⚠️ DEUX FAMILLES DE COLONNES DE TENANT, ET LES CONFONDRE SERAIT GRAVE.
--   — `tenant_id` est la colonne D'ISOLATION, comme partout ailleurs. Ces
--     tables appartiennent au TENANT DE L'ÉDITEUR — qui est un tenant comme un
--     autre (décision D-03), sans aucune exception de politique.
--   — `tenant_abonne_id` et `tenant_observe_id` désignent LE CLIENT OBSERVÉ.
--     Ce ne sont PAS des colonnes d'isolation, et leur nom le dit pour qu'on ne
--     les confonde jamais. Une politique qui s'appuierait sur elles rendrait
--     chaque client visible de lui-même dans le catalogue de l'éditeur.
--
-- CE QU'IL NE COUVRE PAS : l'exploitation du client. Un abonnement ne connaît
-- ni chambre ni couvert — il connaît un NOMBRE d'unités facturables, que la
-- verticale a compté pour lui.
-- ============================================================================

CREATE SCHEMA editeur;
GRANT USAGE ON SCHEMA editeur TO kaya_app;


-- ============================================================================
-- editeur.plan — forfait par palier, ou compteur
-- CLASSE C · branche C2 — relation éditeur–client
-- Story : ADM-03
-- ============================================================================
CREATE TABLE editeur.plan (
    id         UUID CONSTRAINT pk_plan PRIMARY KEY,
    tenant_id  UUID        NOT NULL,
    code       TEXT        NOT NULL,
    libelle    TEXT        NOT NULL,
    mode       TEXT        NOT NULL,
    actif      BOOLEAN     NOT NULL DEFAULT true,
    cree_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_plan_code UNIQUE (tenant_id, code),
    -- Deux modes de tarification, deux chemins de calcul distincts dans le
    -- moteur : un troisième s'accompagnerait du code qui le calcule.
    CONSTRAINT ck_plan_mode CHECK (mode IN ('FORFAIT_PALIER', 'COMPTEUR'))
);

ALTER TABLE editeur.plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.plan FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.plan
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.plan
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON editeur.plan TO kaya_app;


-- ============================================================================
-- editeur.palier — de tant à tant d'unités, tel montant
-- CLASSE C · branche C2 — relation éditeur–client
-- Story : ADM-03
-- ============================================================================
CREATE TABLE editeur.palier (
    id               UUID CONSTRAINT pk_palier PRIMARY KEY,
    tenant_id        UUID           NOT NULL,
    plan_id          UUID           NOT NULL,
    unites_min       INTEGER        NOT NULL,
    -- NULL = sans plafond. C'est le dernier palier, celui qui absorbe tout le
    -- reste — et il doit exister, sinon un client dépasse la grille et le
    -- moteur ne sait plus quoi facturer.
    unites_max       INTEGER            NULL,
    montant_mensuel  montant_mineur     NULL,
    montant_par_unite montant_mineur    NULL,
    devise           code_devise    NOT NULL,
    cree_le          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_palier_plan FOREIGN KEY (plan_id)
        REFERENCES editeur.plan (id),
    CONSTRAINT ck_palier_bornes CHECK (
        unites_min >= 0 AND (unites_max IS NULL OR unites_max >= unites_min))
);

ALTER TABLE editeur.palier ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.palier FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.palier
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.palier
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON editeur.palier TO kaya_app;


-- ============================================================================
-- editeur.abonnement — ce qu'un client a souscrit
-- CLASSE C · branche C2 — relation éditeur–client
-- Story : ADM-03, ADM-04
-- ============================================================================
CREATE TABLE editeur.abonnement (
    id                 UUID CONSTRAINT pk_abonnement PRIMARY KEY,
    tenant_id          UUID           NOT NULL,
    -- LE CLIENT OBSERVÉ, pas la colonne d'isolation. Pas de REFERENCES :
    -- etablissements est un autre module.
    tenant_abonne_id   UUID           NOT NULL,
    plan_id            UUID           NOT NULL,
    debut              DATE           NOT NULL,
    fin                DATE               NULL,
    etat               TEXT           NOT NULL,
    remise_commerciale NUMERIC            NULL,
    -- La gratuité EXIGE son motif : « offert » sans raison écrite devient
    -- ingérable au bout de trente clients.
    motif_gratuite     TEXT               NULL,
    frais_installation montant_mineur     NULL,
    devise             code_devise    NOT NULL,
    cree_le            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_abonnement_plan FOREIGN KEY (plan_id)
        REFERENCES editeur.plan (id),
    CONSTRAINT ck_abonnement_etat CHECK (
        etat IN ('ACTIF', 'GRATUIT', 'SUSPENDU', 'RESILIE'))
);

COMMENT ON COLUMN editeur.abonnement.tenant_abonne_id IS
    'Le client observé — JAMAIS la colonne d''isolation, qui est tenant_id.';

ALTER TABLE editeur.abonnement ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.abonnement FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.abonnement
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.abonnement
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON editeur.abonnement TO kaya_app;

-- Sert : lister les abonnements par état — les suspendus pour impayé, les
-- gratuits à revoir (ADM-04)
CREATE INDEX ix_abonnement_tenant_etat ON editeur.abonnement (tenant_abonne_id, etat);


-- ============================================================================
-- editeur.unite_facturable — UNE MÉTRIQUE ABSTRAITE, jamais « chambre »
-- CLASSE C · branche C2 — dérivé du référentiel
-- Story : ADM-03
-- ⚠️ AMENDEMENT A11. `verticale_code` dit QUI COMPTE, `metrique` dit CE QU'ON
-- COMPTE — la chambre pour l'hébergement, le point de vente pour la
-- restauration, le véhicule pour la livraison. Le moteur de tarification ne
-- connaît qu'un NOMBRE.
-- Au MVP, la seule implémentation est « chambre », et le comportement
-- observable est strictement identique à une facturation à la chambre. La
-- différence n'apparaîtra qu'au premier client sans chambre — et ce jour-là,
-- elle vaudra une refonte évitée.
-- ============================================================================
CREATE TABLE editeur.unite_facturable (
    id               UUID CONSTRAINT pk_unite_facturable PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Le client observé. Pas de REFERENCES : autre module.
    tenant_abonne_id UUID        NOT NULL,
    etablissement_id UUID        NOT NULL,
    verticale_code   TEXT        NOT NULL,
    metrique         TEXT        NOT NULL,
    quantite_comptee INTEGER     NOT NULL,
    -- L'instant où le comptage a été arrêté. Un comptage sans date d'arrêt se
    -- refait, et deux refontes ne rendent pas le même nombre.
    arrete_le        TIMESTAMPTZ NOT NULL,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_unite_facturable_arret UNIQUE (tenant_abonne_id, etablissement_id, metrique, arrete_le)
);

COMMENT ON COLUMN editeur.unite_facturable.metrique IS
    'Ce qu''on compte, nommé par la verticale. Jamais « chambre » en dur — amendement A11.';
-- ⚠️ `quantite_comptee` est un INTEGER et NON le domaine `quantite` (NUMERIC), et ce
-- n'est pas un écart à l'amendement A2. A2 vise les quantités de MARCHANDISE — une
-- quincaillerie vend 2,3 mètres de fer, une boulangerie achète 47,5 kg de farine.
-- Ici, on compte des OBJETS DISCRETS : des chambres, des points de vente, des
-- véhicules. Une demi-chambre facturable n'existe pas, et un NUMERIC laisserait
-- entendre le contraire. Le nom porte « quantite » parce que c'est le mot du métier
-- de l'abonnement ; le type dit ce que c'est réellement.
COMMENT ON COLUMN editeur.unite_facturable.quantite_comptee IS
    'CARDINAL d''objets discrets (chambres, points de vente), donc INTEGER — pas le domaine quantite.';

ALTER TABLE editeur.unite_facturable ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.unite_facturable FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.unite_facturable
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.unite_facturable
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON editeur.unite_facturable TO kaya_app;

-- Sert : le comptage du dernier arrêté d'un client, à l'établissement d'une
-- facture d'abonnement (ADM-03)
CREATE INDEX ix_unite_facturable_tenant_arret
    ON editeur.unite_facturable (tenant_abonne_id, arrete_le DESC);


-- ============================================================================
-- editeur.telemetrie_parc — version, santé, erreurs d'un client
-- CLASSE A · branche A4 — append-only
-- Story : TRX-07, ADM-02
-- ============================================================================
CREATE TABLE editeur.telemetrie_parc (
    id                        UUID CONSTRAINT pk_telemetrie_parc PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,
    -- Le client observé. Pas de REFERENCES : autre module.
    tenant_observe_id         UUID        NOT NULL,
    version_application       TEXT        NOT NULL,
    etat_sante                TEXT        NOT NULL,
    derniere_synchronisation_le TIMESTAMPTZ   NULL,
    erreurs                   JSONB           NULL,
    horodatage_client         TIMESTAMPTZ     NULL,
    cree_le                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN editeur.telemetrie_parc.tenant_observe_id IS
    'Le client observé — JAMAIS la colonne d''isolation, qui est tenant_id.';

ALTER TABLE editeur.telemetrie_parc ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.telemetrie_parc FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.telemetrie_parc
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.telemetrie_parc
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON editeur.telemetrie_parc TO kaya_app;

-- Sert : l'état courant et l'historique récent d'un client au tableau du parc
-- (ADM-02)
CREATE INDEX ix_telemetrie_parc_tenant_date
    ON editeur.telemetrie_parc (tenant_observe_id, cree_le DESC, id DESC);


-- ============================================================================
-- editeur.bundle_diagnostic — un export d'assistance, à la demande
-- CLASSE A · branche A4 — dérivé
-- Story : TRX-07, ADM-05
-- ============================================================================
CREATE TABLE editeur.bundle_diagnostic (
    id                     UUID CONSTRAINT pk_bundle_diagnostic PRIMARY KEY,
    tenant_id              UUID        NOT NULL,
    tenant_observe_id      UUID        NOT NULL,
    uri                    TEXT        NOT NULL,
    periode_debut          TIMESTAMPTZ NOT NULL,
    periode_fin            TIMESTAMPTZ NOT NULL,
    -- Qui a demandé l'export. Pas de REFERENCES : comptes est un autre module.
    -- La colonne existe parce qu'un export de diagnostic contient des données
    -- d'exploitation d'un client : savoir qui l'a demandé n'est pas facultatif.
    demande_par_compte_id  UUID        NOT NULL,
    horodatage_client      TIMESTAMPTZ     NULL,
    cree_le                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE editeur.bundle_diagnostic ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.bundle_diagnostic FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.bundle_diagnostic
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.bundle_diagnostic
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON editeur.bundle_diagnostic TO kaya_app;


-- ============================================================================
-- editeur.encaissement_abonnement — le client paie son abonnement
-- CLASSE D · branche D1 — explicitement D au cadrage §11.3
-- Story : ADM-04
-- ★ ENTITÉ NOMMÉE PAR LE CYCLE D1 — le registre §5.8 décrivait
-- « Encaissement d'abonnement » sans nommer sa table. Inscrite dans le même
-- changement.
-- ============================================================================
CREATE TABLE editeur.encaissement_abonnement (
    id                UUID CONSTRAINT pk_encaissement_abonnement PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    abonnement_id     UUID           NOT NULL,
    montant           montant_mineur NOT NULL,
    devise            code_devise    NOT NULL,
    fournisseur       TEXT           NOT NULL,
    reference_session TEXT           NOT NULL,
    etat              TEXT           NOT NULL,
    regle_le          TIMESTAMPTZ        NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_encaissement_abonnement_abonnement FOREIGN KEY (abonnement_id)
        REFERENCES editeur.abonnement (id),
    -- Une session de paiement ne s'encaisse qu'une fois : la contrainte fait
    -- échouer le second enregistrement au niveau de la base, seule forme qui
    -- résiste à deux processus concurrents.
    CONSTRAINT uq_encaissement_abonnement_reference UNIQUE (fournisseur, reference_session)
);

ALTER TABLE editeur.encaissement_abonnement ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.encaissement_abonnement FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.encaissement_abonnement
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.encaissement_abonnement
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- UPDATE pour la seule transition d'état — un paiement part EN_ATTENTE et
-- revient REGLE ou ECHOUE, sur décision de l'agrégateur.
GRANT SELECT, INSERT, UPDATE ON editeur.encaissement_abonnement TO kaya_app;


-- ============================================================================
-- editeur.evenement_webhook_paiement — ce que l'agrégateur nous a dit
-- CLASSE D · branche D1 — agrégateur
-- Story : ADM-04
-- ★ ENTITÉ NOMMÉE PAR LE CYCLE D1 — le registre §5.8 décrivait « Webhook de
-- paiement — validation HMAC, idempotence » sans nommer sa table.
--
-- ⚠️ L'IDEMPOTENCE EST PORTÉE PAR UNE CONTRAINTE, PAS PAR DU CODE.
-- uq_evenement_webhook_identifiant fait échouer la seconde réception au niveau
-- de la base : c'est la seule forme qui résiste à deux processus concurrents.
-- Un « si déjà traité alors ignorer » en code laisse passer les deux quand ils
-- lisent en même temps.
-- ============================================================================
CREATE TABLE editeur.evenement_webhook_paiement (
    id                           UUID CONSTRAINT pk_evenement_webhook_paiement PRIMARY KEY,
    tenant_id                    UUID        NOT NULL,
    fournisseur                  TEXT        NOT NULL,
    identifiant_evenement_externe TEXT       NOT NULL,
    -- Le résultat de la vérification HMAC. Un webhook non vérifié s'enregistre
    -- quand même — pour qu'il soit LISIBLE — mais ne déclenche rien.
    signature_verifiee           BOOLEAN     NOT NULL DEFAULT false,
    charge_utile                 JSONB       NOT NULL,
    traite_le                    TIMESTAMPTZ     NULL,
    horodatage_client            TIMESTAMPTZ     NULL,
    cree_le                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_evenement_webhook_identifiant UNIQUE (fournisseur, identifiant_evenement_externe)
);

COMMENT ON CONSTRAINT uq_evenement_webhook_identifiant ON editeur.evenement_webhook_paiement IS
    'C''est cette unicité qui porte l''idempotence — une contrainte, jamais du code.';

ALTER TABLE editeur.evenement_webhook_paiement ENABLE ROW LEVEL SECURITY;
ALTER TABLE editeur.evenement_webhook_paiement FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON editeur.evenement_webhook_paiement
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON editeur.evenement_webhook_paiement
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON editeur.evenement_webhook_paiement TO kaya_app;

-- Sert : la reprise des webhooks reçus et non encore traités (ADM-04)
CREATE INDEX ix_evenement_webhook_non_traite
    ON editeur.evenement_webhook_paiement (cree_le) WHERE traite_le IS NULL;
