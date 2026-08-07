-- ============================================================================
-- SCHÉMA pressing — la verticale `verticales/pressing`
--
-- LE PRESSING N'EST PAS UNE VENTE IMMÉDIATE, ET TOUT CE FICHIER DÉCOULE DE LÀ :
-- il y a DÉPÔT, DÉLAI, RETRAIT. Entre les trois, le client peut partir, changer
-- d'avis, ne jamais revenir ; le linge, lui, existe et doit être retrouvable. Le
-- tronc commun de la vente — catalogue, commande, ligne, remise — vit dans
-- `ventes` ; ce schéma ne garde QUE ce qui lui est propre : le bon de dépôt.
--
-- ⚠️ IL NE SUPPOSE JAMAIS QUE L'ÉTABLISSEMENT POSSÈDE DE L'HÉBERGEMENT.
-- UN PRESSING SEUL EST UN ÉTABLISSEMENT VALIDE, et c'est la contrainte la plus
-- structurante du fichier. Conséquence directe et vérifiable :
-- `bon_depot.personne_id` pointe sur `comptes.personne` — du SOCLE — et JAMAIS
-- sur `hebergement.client`. La hiérarchie de la constitution (principe 2) est
-- formelle : `verticales/pressing` ne peut dépendre que de `socle/` et de
-- `capacites/`, JAMAIS D'UNE AUTRE VERTICALE.
--
-- LE RATTACHEMENT À UN SÉJOUR EXISTE MALGRÉ TOUT — `bon_depot.sejour_id` — et
-- c'est la SECONDE SAGA du modèle. Il est nu, nullable, et le consommateur qui
-- reporte la charge sur la note ne dépend pas du crate `pressing` : il consomme
-- un ÉVÉNEMENT OUTBOX dont la charge utile est financièrement complète et dont
-- le type est déclaré AU SOCLE. C'est ce qui rend ce rattachement possible sans
-- dépendance de compilation.
-- ⚠️ UN TEST STRUCTUREL DE PHASE 3 DOIT ÉCHOUER si `verticales/hebergement`
-- déclare `verticales/pressing` dans son manifeste, et réciproquement.
--
-- CE QU'IL NE COUVRE PAS : l'encaissement, qui est dans `caisse` ; le tarif par
-- type de pièce, qui est un article de `ventes` ; la blanchisserie interne de
-- l'hôtel, qui n'est pas un pressing et n'a pas de story au MVP.
-- ============================================================================

CREATE SCHEMA pressing;
GRANT USAGE ON SCHEMA pressing TO kaya_app;


-- ============================================================================
-- pressing.numerotation_retrait — le compteur du numéro de retrait
-- CLASSE B · branche B3 — numérotation continue, sérialisée par verrou de ligne
-- Story : PDV-06
--
-- ⚠️ UN COMPTEUR EN TABLE À VERROU DE LIGNE, JAMAIS UNE `SEQUENCE`
-- (00-conventions.sql, piège (c) ; registre §8.4). Une séquence PostgreSQL
-- n'est pas transactionnelle : chaque transaction annulée laisse un trou. Et
-- ici, UN TROU EST UNE PIÈCE DE LINGE DONT PERSONNE NE SAIT SI ELLE A EXISTÉ —
-- le client présente son ticket n° 214, le 214 n'existe pas, et rien ne dit si
-- son costume a été perdu ou si le numéro a simplement sauté.
--
-- Déclarée AVANT `bon_depot` : elle n'en dépend pas, mais l'ordre de lecture du
-- fichier suit celui de l'écriture réelle — on prend un numéro, puis on crée le
-- bon.
-- ============================================================================
CREATE TABLE pressing.numerotation_retrait (
    id                UUID CONSTRAINT pk_numerotation_retrait PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id  UUID        NOT NULL,
    portee            TEXT        NOT NULL,
    dernier_numero    BIGINT      NOT NULL DEFAULT 0,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_numerotation_retrait_portee
        UNIQUE (tenant_id, etablissement_id, portee),
    CONSTRAINT ck_numerotation_retrait_positif CHECK (dernier_numero >= 0)
);

COMMENT ON COLUMN pressing.numerotation_retrait.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN pressing.numerotation_retrait.portee IS
    'Libellé de portée à l''intérieur de l''établissement — l''année, la période. IL DOIT CORRESPONDRE À CELUI DE uq_bon_depot_numero : un compteur et une contrainte de portées différentes finissent par se contredire.';
COMMENT ON COLUMN pressing.numerotation_retrait.dernier_numero IS
    'Compteur à VERROU DE LIGNE, jamais une SEQUENCE : un trou est une pièce de linge dont personne ne sait si elle a existé.';

ALTER TABLE pressing.numerotation_retrait ENABLE ROW LEVEL SECURITY;
ALTER TABLE pressing.numerotation_retrait FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON pressing.numerotation_retrait
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON pressing.numerotation_retrait
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON pressing.numerotation_retrait TO kaya_app;

-- Aucun index : uq_numerotation_retrait_portee sert le verrou de ligne, qui est
-- la seule recherche de cette table.


-- ============================================================================
-- pressing.bon_depot — ce qui a été déposé, et quand ça se retire
-- CLASSE B · branche B3 — création avec numéro de retrait, et transition
--                          `pret → retire` avec règlement : numérotation,
--                          ressource unique, effet monétaire
-- CLASSE A · branche A4 — transitions `depose → en_traitement → pret` : sans
--                          effet monétaire, sans unicité — un pressing marque
--                          « en traitement » depuis l'arrière-boutique, où le
--                          réseau ne va pas
-- Story : PDV-06
--
-- DEUX CLASSES SUR UNE TABLE, et le partage se fait sur les DEUX BOUTS DU CYCLE
-- DE VIE : les extrémités engagent — un numéro opposable à la création, de
-- l'argent au retrait —, le milieu n'engage rien.
--
-- ⚠️ `personne_id` POINTE SUR `comptes.personne`, JAMAIS SUR
-- `hebergement.client`. Voir l'en-tête du fichier : une verticale ne dépend pas
-- d'une autre verticale, et un pressing seul est un établissement valide.
-- Il est NULLABLE : le client de passage qui dépose trois chemises n'a pas
-- toujours de fiche, et l'exiger ferait créer des fiches vides — ou pire,
-- refuser le dépôt.
--
-- ⚠️ `sejour_id` EST LA SECONDE SAGA. Voir son commentaire de colonne.
--
-- ⚠️ `moment_reglement` EST RÉSOLU À LA CRÉATION DU BON, PUIS FIGÉ. Le paramètre
-- `pressing.moment_reglement` a pour portée la plus basse le point de vente ; LE
-- CHANGER NE DÉPLACE PAS L'EXIGIBILITÉ D'UN BON DÉJÀ PRIS. Une lecture différée
-- du paramètre au retrait ferait exactement l'inverse, SILENCIEUSEMENT : un bon
-- déposé « payable au retrait » deviendrait « payable d'avance » sans que
-- personne ne l'ait décidé pour lui — et le client apprendrait au comptoir
-- qu'il aurait dû payer il y a trois jours.
-- ============================================================================
CREATE TABLE pressing.bon_depot (
    id                   UUID CONSTRAINT pk_bon_depot PRIMARY KEY,
    tenant_id            UUID           NOT NULL,
    -- Rattachement inter-modules vers etablissements.point_de_vente — NU.
    point_de_vente_id    UUID           NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    -- Présent parce que uq_bon_depot_numero doit porter sur LA MÊME PORTÉE que
    -- le compteur numerotation_retrait : une contrainte UNIQUE ne traverse pas
    -- une jointure, et le point de vente ne dit pas l'établissement en SQL.
    etablissement_id     UUID           NOT NULL,
    -- ⚠️ Vers comptes.personne — DU SOCLE —, JAMAIS vers hebergement.client.
    personne_id          UUID               NULL,
    -- ⚠️ SAGA `pressing` → `hebergement`. NU, nullable.
    sejour_id            UUID               NULL,
    numero_retrait       TEXT           NOT NULL,
    portee_numero        TEXT           NOT NULL,
    etat                 TEXT           NOT NULL,
    -- RÉSOLU À LA CRÉATION PUIS FIGÉ — voir l'en-tête.
    moment_reglement     TEXT           NOT NULL,
    date_retrait_promise TIMESTAMPTZ        NULL,
    retire_le            TIMESTAMPTZ        NULL,
    montant_total        montant_mineur NOT NULL DEFAULT 0,
    code_devise          code_devise    NOT NULL,
    horodatage_client    TIMESTAMPTZ        NULL,
    cree_le              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    -- La portée est celle du compteur : établissement + libellé de période.
    CONSTRAINT uq_bon_depot_numero
        UNIQUE (tenant_id, etablissement_id, portee_numero, numero_retrait),
    CONSTRAINT ck_bon_depot_etat CHECK (etat IN (
        'DEPOSE', 'EN_TRAITEMENT', 'PRET', 'RETIRE', 'ABANDONNE')),
    CONSTRAINT ck_bon_depot_moment_reglement CHECK (moment_reglement IN (
        'AU_DEPOT', 'AU_RETRAIT'))
);

COMMENT ON TABLE pressing.bon_depot IS
    'Le pressing n''est pas une vente immédiate : dépôt, délai, retrait. DEUX CLASSES — B à la création et au retrait, A pour les transitions intermédiaires.';
COMMENT ON COLUMN pressing.bon_depot.point_de_vente_id IS
    'Rattachement inter-modules vers etablissements.point_de_vente — nu, sans REFERENCES.';
COMMENT ON COLUMN pressing.bon_depot.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES. Présent pour que uq_bon_depot_numero porte sur la MÊME PORTÉE que le compteur numerotation_retrait.';
COMMENT ON COLUMN pressing.bon_depot.personne_id IS
    'Rattachement inter-modules vers comptes.personne — nu, sans REFERENCES. JAMAIS vers hebergement.client : une verticale ne dépend pas d''une autre verticale, et un pressing seul est un établissement valide. NULLABLE — le client de passage n''a pas toujours de fiche.';
COMMENT ON COLUMN pressing.bon_depot.moment_reglement IS
    'AU_DEPOT | AU_RETRAIT — RÉSOLU À LA CRÉATION DU BON, PUIS FIGÉ. Changer la clé de configuration ne déplace pas l''exigibilité d''un bon déjà pris ; une lecture différée au retrait ferait l''inverse, silencieusement.';
COMMENT ON COLUMN pressing.bon_depot.etat IS
    'DEPOSE → EN_TRAITEMENT → PRET sont de CLASSE A (l''arrière-boutique n''a pas de réseau) ; la création et PRET → RETIRE sont de CLASSE B.';

ALTER TABLE pressing.bon_depot ENABLE ROW LEVEL SECURITY;
ALTER TABLE pressing.bon_depot FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON pressing.bon_depot
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON pressing.bon_depot
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- UPDATE sert les DEUX classes : les transitions intermédiaires (A) et le
-- retrait avec règlement (B).
GRANT SELECT, INSERT, UPDATE ON pressing.bon_depot TO kaya_app;

-- Sert : les bons prêts et les bons en retard — l'écran du comptoir, où l'on
-- cherche par état et par date promise (PDV-06)
CREATE INDEX ix_bon_depot_etat_date
    ON pressing.bon_depot (etat, date_retrait_promise);

-- Sert : les bons rattachés à un séjour, ET LEUR CAS ORPHELIN — un bon dont le
-- séjour est clos se retrouve par là. Index PARTIEL sur la colonne non nulle :
-- la plupart des bons n'ont pas de séjour (PDV-06)
CREATE INDEX ix_bon_depot_sejour
    ON pressing.bon_depot (sejour_id) WHERE sejour_id IS NOT NULL;

-- Sert : retrouver les bons d'un client extérieur — « j'ai perdu mon ticket ».
-- Index PARTIEL : le client de passage n'a pas toujours de fiche (PDV-06)
CREATE INDEX ix_bon_depot_personne
    ON pressing.bon_depot (personne_id) WHERE personne_id IS NOT NULL;


-- ============================================================================
-- pressing.piece_deposee — ce qu'il y a dans le sac
-- CLASSE A · branche A4 — append-only, rattaché au bon
-- Story : PDV-06
--
-- APPEND-ONLY, et c'est le régime juste : on dépose des pièces, on n'en retire
-- pas de la liste. Une pièce ajoutée après coup — « j'ai oublié la cravate » —
-- est une ligne de plus, pas une modification.
--
-- `etat_constate` EST LE POINT SENSIBLE DE TOUT LE MODULE : c'est ce qu'on
-- constate AU DÉPÔT — tache, accroc, décoloration —, et c'est la seule chose qui
-- protège l'exploitant d'une réclamation au retrait. Il est saisi en clair
-- plutôt qu'en énumération : « auréole au col droit » n'entre dans aucune liste
-- fermée, et une liste fermée ferait choisir « autre » neuf fois sur dix.
--
-- `prix_unitaire` EST UNE COPIE, comme sur `ventes.ligne_commande` : le tarif du
-- pressing peut changer entre le dépôt et le retrait, et le client paie le prix
-- affiché le jour où il a déposé.
-- ============================================================================
CREATE TABLE pressing.piece_deposee (
    id                UUID CONSTRAINT pk_piece_deposee PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    bon_depot_id      UUID           NOT NULL,
    designation       TEXT           NOT NULL,
    quantite          quantite       NOT NULL,
    etat_constate     TEXT               NULL,
    prix_unitaire     montant_mineur NOT NULL,
    code_devise       code_devise    NOT NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_piece_deposee_bon FOREIGN KEY (bon_depot_id)
        REFERENCES pressing.bon_depot (id),
    CONSTRAINT ck_piece_deposee_quantite_positive CHECK (quantite > 0)
);

COMMENT ON COLUMN pressing.piece_deposee.etat_constate IS
    'CE QU''ON CONSTATE AU DÉPÔT — tache, accroc, décoloration. En clair et non en énumération : « auréole au col droit » n''entre dans aucune liste fermée, et une liste fermée ferait choisir « autre » neuf fois sur dix. C''est la seule chose qui protège l''exploitant d''une réclamation au retrait.';
COMMENT ON COLUMN pressing.piece_deposee.prix_unitaire IS
    'COPIE au moment du dépôt, jamais une lecture différée : le tarif peut changer entre le dépôt et le retrait, et le client paie le prix affiché le jour où il a déposé.';

ALTER TABLE pressing.piece_deposee ENABLE ROW LEVEL SECURITY;
ALTER TABLE pressing.piece_deposee FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON pressing.piece_deposee
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON pressing.piece_deposee
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON pressing.piece_deposee TO kaya_app;

-- Sert : les pièces d'un bon — le ticket de dépôt et le contrôle au retrait
-- (PDV-06)
CREATE INDEX ix_piece_deposee_bon ON pressing.piece_deposee (bon_depot_id);


-- ============================================================================
-- FIN — 98-pressing.sql
-- ============================================================================
