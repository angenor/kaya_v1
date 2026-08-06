-- ============================================================================
-- SCHÉMA synchronisation — crate socle/synchronisation
--
-- CE QU'IL COUVRE : le grand livre permanent des événements (outbox), le fait
-- de leur publication, et la file de réconciliation des écritures orphelines.
--
-- CE QU'IL NE COUVRE PAS, ET POURQUOI :
--   — LA FILE D'ACTIONS LOCALE DU TERMINAL. Elle n'est pas une entité de ce
--     registre : c'est l'infrastructure qui transporte les écritures de classe
--     A, et elle NE CONTIENT JAMAIS de donnée B, C ou D en cache d'écriture
--     (cadrage §11.5, règle 4). Lui donner une table côté serveur reviendrait à
--     la rendre durable, donc à la sauvegarder, donc à la restaurer un jour —
--     et à rejouer des écritures qu'on croyait perdues.
--   — les verrous distribués et la limitation de débit : éphémères Redis.
--
-- ⚠️ L'OUTBOX EST UN GRAND LIVRE PERMANENT, PAS UNE FILE DE MESSAGES.
-- Trois règles indissociables (TRX-02) : RÉTENTION ILLIMITÉE, CHARGE UTILE
-- FINANCIÈREMENT COMPLÈTE ET DÉNORMALISÉE, IMMUABILITÉ. C'est pourquoi le
-- marquage « publié » n'est pas un UPDATE mais une ligne dans
-- publication_outbox : accorder UPDATE « juste pour un drapeau » casserait
-- l'immuabilité sans que rien ne le signale.
-- ============================================================================

CREATE SCHEMA synchronisation;
GRANT USAGE ON SCHEMA synchronisation TO kaya_app;


-- ============================================================================
-- synchronisation.evenement_outbox — le grand livre, immuable
-- CLASSE A · branche A4 — append-only, immuable, RÉTENTION ILLIMITÉE
-- Story : TRX-02
-- ============================================================================
CREATE TABLE synchronisation.evenement_outbox (
    id                UUID CONSTRAINT pk_evenement_outbox PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    -- Séquence MONOTONE PAR ÉTABLISSEMENT : elle permet au consommateur de
    -- détecter un trou, donc un événement perdu. Elle n'est pas une SEQUENCE
    -- PostgreSQL — voir 00-conventions.sql §7 (c).
    sequence          BIGINT      NOT NULL,
    type_evenement    TEXT        NOT NULL,
    agregat_type      TEXT        NOT NULL,
    agregat_id        UUID        NOT NULL,
    -- FINANCIÈREMENT COMPLÈTE ET DÉNORMALISÉE : un encaissement y porte
    -- montant, mode, contrepartie, ventilation de taxes et référence de
    -- document — JAMAIS un simple identifiant. Un consommateur doit pouvoir
    -- rebâtir la comptabilité à partir de l'outbox SEULE, des années plus tard,
    -- sans relire une table qui aura changé de forme entre-temps.
    charge_utile      JSONB       NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_evenement_outbox_sequence UNIQUE (etablissement_id, sequence)
);

COMMENT ON TABLE synchronisation.evenement_outbox IS
    'Grand livre permanent. Rétention illimitée, charge utile complète, immuable par privilège.';
COMMENT ON COLUMN synchronisation.evenement_outbox.charge_utile IS
    'Dénormalisée et financièrement complète : jamais un simple identifiant à re-résoudre.';

ALTER TABLE synchronisation.evenement_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchronisation.evenement_outbox FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON synchronisation.evenement_outbox
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON synchronisation.evenement_outbox
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- NI UPDATE NI DELETE. Le privilège absent est ce qui PROUVE l'immuabilité et
-- la rétention illimitée ; un commentaire ne prouverait rien.
GRANT SELECT, INSERT ON synchronisation.evenement_outbox TO kaya_app;

-- Sert : la boucle du worker de publication — les événements d'un établissement
-- dans l'ordre de leur séquence, dont on écarte ceux qui ont déjà une ligne de
-- publication (TRX-02)
CREATE INDEX ix_evenement_outbox_publication
    ON synchronisation.evenement_outbox (etablissement_id, sequence);


-- ============================================================================
-- synchronisation.publication_outbox — la publication est un FAIT AJOUTÉ
-- CLASSE A · branche A4 — append-only
-- Story : TRX-02
-- ★ ENTITÉ NOMMÉE PAR LE CYCLE D1 — conséquence directe de l'immuabilité de
-- l'outbox. Inscrite au registre §5.6 dans le même changement.
-- L'existence d'une ligne VAUT publication. La forme courante — une colonne
-- publie_le mise à jour par le worker — exigerait exactement le privilège qu'on
-- veut refuser sur l'événement.
-- ============================================================================
CREATE TABLE synchronisation.publication_outbox (
    id                UUID CONSTRAINT pk_publication_outbox PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    evenement_id      UUID        NOT NULL,
    publie_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Qui a consommé. Plusieurs consommateurs peuvent publier le même
    -- événement — la comptabilité, les métriques — et chacun laisse sa ligne.
    consommateur      TEXT        NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_publication_outbox_evenement FOREIGN KEY (evenement_id)
        REFERENCES synchronisation.evenement_outbox (id),
    CONSTRAINT uq_publication_outbox UNIQUE (evenement_id, consommateur)
);

ALTER TABLE synchronisation.publication_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchronisation.publication_outbox FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON synchronisation.publication_outbox
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON synchronisation.publication_outbox
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON synchronisation.publication_outbox TO kaya_app;

-- Sert : la jointure du worker — LEFT JOIN … WHERE p.evenement_id IS NULL,
-- qui sélectionne les événements pas encore publiés (TRX-02)
CREATE INDEX ix_publication_outbox_evenement
    ON synchronisation.publication_outbox (evenement_id);


-- ============================================================================
-- synchronisation.reconciliation_orpheline — l'écriture arrivée trop tard
-- CLASSE A · branche A4 — À LA CRÉATION : constat append-only
-- CLASSE B · branche B3 — À LA RÉSOLUTION : effet monétaire, résolution
--                          humaine obligatoire — NON IMPLÉMENTÉE AU MVP
-- Story : SYN-03
-- ⚠️ C'EST L'EXEMPLE CANONIQUE DU PRIVILÈGE QUI PROUVE LA PROVISION.
-- Un commentaire disant « la résolution viendra plus tard » ne prouve rien ;
-- un GRANT sans UPDATE la rend impossible. Le jour où la résolution s'écrira,
-- le privilège changera — et ça se verra dans un diff.
--
-- Le cas nominal : une consommation saisie hors ligne arrive sur un séjour
-- déjà clos et facturé. Jamais de rejet silencieux, jamais d'ajout d'office.
-- ============================================================================
CREATE TABLE synchronisation.reconciliation_orpheline (
    id                UUID        CONSTRAINT pk_reconciliation_orpheline PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Pas de REFERENCES : socle/etablissements est un autre module.
    etablissement_id  UUID        NOT NULL,
    -- L'écriture qui arrive, et ce sur quoi elle prétendait s'imputer. Quatre
    -- colonnes NUES : ces agrégats vivent dans d'autres modules, et certains
    -- n'existent pas encore.
    origine_type      TEXT        NOT NULL,
    origine_id        UUID        NOT NULL,
    cible_type        TEXT        NOT NULL,
    cible_id          UUID            NULL,
    -- Le constat, dénormalisé : de quoi qu'un humain décide sans rouvrir
    -- l'agrégat d'origine, qui aura peut-être changé.
    constat           JSONB       NOT NULL,
    etat              TEXT        NOT NULL,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_reconciliation_etat CHECK (etat IN ('EN_ATTENTE', 'RESOLUE'))
);

COMMENT ON COLUMN synchronisation.reconciliation_orpheline.origine_id IS
    'Rattachement inter-modules — nu, sans REFERENCES.';

ALTER TABLE synchronisation.reconciliation_orpheline ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchronisation.reconciliation_orpheline FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON synchronisation.reconciliation_orpheline
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON synchronisation.reconciliation_orpheline
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- JAMAIS UPDATE : la résolution de classe B n'est pas implémentée, et le
-- privilège absent est ce qui le prouve.
GRANT SELECT, INSERT ON synchronisation.reconciliation_orpheline TO kaya_app;

-- Sert : l'écran de réconciliation — les orphelines en attente d'un
-- établissement (SYN-03), l'écran testé en priorité du registre §12
CREATE INDEX ix_reconciliation_etab_etat
    ON synchronisation.reconciliation_orpheline (etablissement_id, etat, cree_le DESC);
