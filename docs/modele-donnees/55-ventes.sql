-- ============================================================================
-- SCHÉMA ventes — le module `socle/ventes`
--
-- ⚠️ LE TRONC COMMUN DE LA VENTE VIT ICI, PAS DANS UNE VERTICALE — catalogue,
-- commande, ligne, envoi en préparation, remise, division d'addition. C'est ce
-- qui permet à un bar, à une quincaillerie et au room-service d'un hôtel de
-- partager la même mécanique sans qu'aucun ne dépende de l'autre.
--
-- ⚠️ `verticales/restauration` ET `verticales/bar` SONT DES COQUILLES VIDES, ET
-- CE N'EST PAS UN OUBLI. Il n'existe ni schéma `restauration`, ni schéma `bar`,
-- et le registre §8 le dit en toutes lettres plutôt que de leur inventer un
-- contenu. Tout ce qu'ils feraient est ici.
--
-- ⚠️ CE SCHÉMA NE CONNAÎT NI CHAMBRE NI SÉJOUR. La cible de facturation
-- `SEJOUR` est une VALEUR OPAQUE : elle circule dans `cible_type`, elle est
-- résolue par un trait exposé de la phase 3, et AUCUNE CONTRAINTE DE BASE NE LA
-- NOMME. Le motif est de hiérarchie : `ventes` est du SOCLE, `hebergement` est
-- une verticale, et le socle ne connaît pas les verticales (constitution,
-- principe 2). Le précédent est au socle : `caisse.encaissement` porte
-- `ck_encaissement_mode` — le mode décide de la classe hors-ligne — mais LAISSE
-- `cible_type` LIBRE ; `documents.document_operationnel` fait de même.
--
-- POURQUOI LE PRÉFIXE `55-`, HORS DU PAS DE DIX : `ventes` est un crate de
-- `socle/`. Le placer à `99-`, avec les verticales, dirait le contraire à qui
-- lit le répertoire. L'ordre lexicographique n'est aucunement une contrainte
-- technique — aucune clé étrangère ne traverse un schéma — il est PUREMENT
-- DOCUMENTAIRE, et c'est précisément pourquoi il doit dire la hiérarchie.
--
-- CE QU'IL NE COUVRE PAS : l'encaissement, qui est dans `caisse` ; le document
-- fiscal, qui est dans `fiscalite` ; la note de séjour, qui est dans
-- `hebergement`. Une commande produit un montant ; ce qui en est fait ensuite
-- ne lui appartient pas.
--
-- ⚠️ ÉCART CONSTATÉ ET ASSUMÉ — `conversion_unite_mesure` EST ICI, PAS DANS
-- `stocks`. L'amendement A3 de `00-conventions.sql` (cycle D1) la nomme
-- `stocks.conversion_unite_mesure` ; le registre §10 la rattache à **PDV-01**,
-- qui est une story de `ventes`, et le modèle de données de ce cycle la place
-- dans ce fichier. La convention d'unité de mesure est celle de l'ARTICLE VENDU
-- (A3 porte sur `ventes.article.unite_mesure`) : la table appartient au module
-- qui porte l'unité qu'elle convertit. Le fichier du socle N'EST PAS MODIFIÉ —
-- le périmètre du cycle l'interdit — et l'écart est consigné au rapport de
-- cycle plutôt que corrigé en silence.
-- ============================================================================

CREATE SCHEMA ventes;
GRANT USAGE ON SCHEMA ventes TO kaya_app;


-- ############################################################################
-- 1 · CATALOGUE — ce qui se paramètre, et ne s'écrit jamais hors ligne
-- ############################################################################


-- ============================================================================
-- ventes.categorie_article — le regroupement d'affichage de la carte
-- CLASSE C · branche C2 — référentiel
-- Story : PDV-01
--
-- Rattachée au POINT DE VENTE et non à l'établissement : la carte du bar et
-- celle du restaurant n'ont pas les mêmes catégories, et c'est le cas le plus
-- courant dès qu'un établissement a deux points de vente.
-- ============================================================================
CREATE TABLE ventes.categorie_article (
    id                UUID CONSTRAINT pk_categorie_article PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.point_de_vente — NU.
    point_de_vente_id UUID        NOT NULL,
    nom               TEXT        NOT NULL,
    ordre             INTEGER     NOT NULL DEFAULT 0,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_categorie_article_nom UNIQUE (tenant_id, point_de_vente_id, nom)
);

COMMENT ON COLUMN ventes.categorie_article.point_de_vente_id IS
    'Rattachement inter-modules vers etablissements.point_de_vente — nu, sans REFERENCES.';

ALTER TABLE ventes.categorie_article ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.categorie_article FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.categorie_article
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.categorie_article
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.categorie_article TO kaya_app;

-- Sert : le catalogue ordonné d'un point de vente — l'écran de prise de
-- commande (PDV-01)
CREATE INDEX ix_categorie_article_pdv
    ON ventes.categorie_article (point_de_vente_id, ordre);


-- ============================================================================
-- ventes.destination_preparation — où part le bon d'envoi
-- CLASSE C · branche C2 — référentiel PAR ÉTABLISSEMENT
-- Story : PDV-04
--
-- ⚠️ RATTACHÉE À L'ÉTABLISSEMENT, ET NON AU POINT DE VENTE. UNE CUISINE SERT
-- PLUSIEURS POINTS DE VENTE : le restaurant, la terrasse et le room-service
-- envoient dans la même cuisine. La rattacher au point de vente obligerait à
-- créer trois « Cuisine », à en imprimer trois bons, et à les réconcilier à la
-- main. C'est la décision qui coûterait le plus cher à défaire, parce qu'elle se
-- défait en migrant des bons d'envoi déjà émis.
--
-- ⚠️ C'EST UNE TABLE, PAS UNE ÉNUMÉRATION. « Cuisine » et « bar » ne sont pas
-- les mêmes chez tous les exploitants, et une valeur en dur imposerait une
-- migration au premier client qui a deux cuisines (registre §8.1).
-- ============================================================================
CREATE TABLE ventes.destination_preparation (
    id               UUID CONSTRAINT pk_destination_preparation PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    -- ⚠️ ÉTABLISSEMENT, pas point de vente : une cuisine sert plusieurs points
    -- de vente.
    etablissement_id UUID        NOT NULL,
    nom              TEXT        NOT NULL,
    actif            BOOLEAN     NOT NULL DEFAULT true,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_destination_preparation_nom
        UNIQUE (tenant_id, etablissement_id, nom)
);

COMMENT ON COLUMN ventes.destination_preparation.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES. ÉTABLISSEMENT et non point de vente : une cuisine sert plusieurs points de vente (PDV-04).';

ALTER TABLE ventes.destination_preparation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.destination_preparation FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.destination_preparation
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.destination_preparation
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.destination_preparation TO kaya_app;

-- Sert : les destinations d'un établissement, au paramétrage d'un article et au
-- routage d'un envoi (PDV-04)
CREATE INDEX ix_destination_preparation_etab
    ON ventes.destination_preparation (etablissement_id, actif);


-- ============================================================================
-- ventes.article — ce qui se vend
-- CLASSE C · branche C2 — catalogue et prix, explicitement C au cadrage §11.3
-- Story : PDV-01
--
-- ⚠️ `destination_preparation_id` EST NULLABLE, ET LE NUL A UN SENS PRÉCIS :
-- « suivre la destination par défaut du point de vente », clé
-- `ventes.destination_preparation_defaut` du catalogue de configuration créée au
-- cycle D1. LE MOTIF EST QU'AUCUN BON D'ENVOI NE MANQUE : rendre la colonne
-- obligatoire forcerait à choisir une destination pour chaque article, y compris
-- ceux qui n'en ont pas besoin, et le premier article mal paramétré serait un
-- plat qui ne part jamais en cuisine.
--
-- ⚠️ `unite_mesure` EST OBLIGATOIRE, AVEC LE DÉFAUT 'unite' (00-conventions.sql,
-- amendement A3). Sans valeur imposée, la moitié des articles n'en aurait pas.
--
-- ⚠️ `code_barre` ET `article_parent_id` SONT DES PROVISIONS-COLONNES
-- (amendement A5) : nullables et NON UTILISÉES AU MVP. La première sert le
-- profil de stock `DETAILLE`, la seconde les déclinaisons d'un même article.
--
-- LE PRIX EST UNE SOURCE, PAS UNE VÉRITÉ COURANTE : `ligne_commande` en fait une
-- COPIE à la création, et une modification de tarif ne modifie aucune commande
-- existante (registre §8.1).
-- ============================================================================
CREATE TABLE ventes.article (
    id                         UUID CONSTRAINT pk_article PRIMARY KEY,
    tenant_id                  UUID           NOT NULL,
    -- Rattachement inter-modules vers etablissements.point_de_vente — NU.
    point_de_vente_id          UUID           NOT NULL,
    categorie_article_id       UUID           NOT NULL,
    -- NULLABLE — le nul veut dire « destination par défaut du point de vente ».
    destination_preparation_id UUID               NULL,
    nom                        TEXT           NOT NULL,
    prix                       montant_mineur NOT NULL,
    code_devise                code_devise    NOT NULL,
    taux_tva                   NUMERIC        NOT NULL DEFAULT 0,
    disponible                 BOOLEAN        NOT NULL DEFAULT true,
    suivi_stock                BOOLEAN        NOT NULL DEFAULT false,
    unite_mesure               TEXT           NOT NULL DEFAULT 'unite',
    -- PROVISIONS-COLONNES (amendement A5) — non utilisées au MVP.
    code_barre                 TEXT               NULL,
    article_parent_id          UUID               NULL,
    cree_le                    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    modifie_le                 TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_article_categorie FOREIGN KEY (categorie_article_id)
        REFERENCES ventes.categorie_article (id),
    CONSTRAINT fk_article_destination FOREIGN KEY (destination_preparation_id)
        REFERENCES ventes.destination_preparation (id),
    CONSTRAINT fk_article_parent FOREIGN KEY (article_parent_id)
        REFERENCES ventes.article (id),
    CONSTRAINT uq_article_nom UNIQUE (tenant_id, point_de_vente_id, nom),
    -- Un taux, jamais une règle : le calcul de TVA appartient au
    -- JurisdictionAdapter (constitution, principe 5). Les bornes refusent la
    -- saisie d'un pourcentage à la place d'un taux.
    CONSTRAINT ck_article_taux_tva CHECK (taux_tva >= 0 AND taux_tva <= 1)
);

COMMENT ON COLUMN ventes.article.point_de_vente_id IS
    'Rattachement inter-modules vers etablissements.point_de_vente — nu, sans REFERENCES.';
COMMENT ON COLUMN ventes.article.destination_preparation_id IS
    'NULLABLE. Le nul veut dire « suivre la clé de catalogue ventes.destination_preparation_defaut du point de vente » (cycle D1) — POUR QU''AUCUN BON D''ENVOI NE MANQUE. Jamais une valeur en dur.';
COMMENT ON COLUMN ventes.article.taux_tva IS
    'TAUX en fraction (0,18 pour 18 %), jamais un pourcentage et jamais une règle. Le calcul vit dans le JurisdictionAdapter.';
COMMENT ON COLUMN ventes.article.code_barre IS
    'PROVISION-COLONNE (amendement A5) — nullable et NON UTILISÉE AU MVP. Servira le profil de stock DETAILLE.';
COMMENT ON COLUMN ventes.article.article_parent_id IS
    'PROVISION-COLONNE (amendement A5) — nullable et NON UTILISÉE AU MVP. Servira les déclinaisons d''un même article.';

ALTER TABLE ventes.article ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.article FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.article
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.article
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.article TO kaya_app;

-- Sert : le catalogue d'un point de vente par catégorie — l'écran de prise de
-- commande, articles disponibles seuls (PDV-01)
CREATE INDEX ix_article_pdv_categorie
    ON ventes.article (point_de_vente_id, categorie_article_id, disponible);

-- Sert : la lecture code-barre du profil de stock DETAILLE (A5). Index PARTIEL
-- sur la colonne non nulle : la provision n'étant pas utilisée au MVP, il est
-- vide et ne coûte rien à l'écriture
CREATE INDEX ix_article_code_barre
    ON ventes.article (code_barre) WHERE code_barre IS NOT NULL;


-- ============================================================================
-- ventes.conversion_unite_mesure — PROVISION
-- CLASSE C · branche C2 — référentiel d'unités
-- Story : PDV-01 · cadrage §14.7
-- PROVISION — tables seulement, aucune logique au MVP
--
-- ⚠️ AUCUN `GRANT` À `kaya_app`, PAS MÊME `SELECT`, ET C'EST CETTE ABSENCE QUI
-- LA PROUVE PROVISION (00-conventions.sql, amendement A3). Rien du produit n'a
-- de raison de la lire : au MVP, `unite_mesure` est un LIBELLÉ, et aucune
-- conversion n'est faite. Le jour où l'on convertira, il faudra un `GRANT` —
-- ce qui se voit dans un diff, et c'est exactement l'effet recherché.
--
-- La table existe malgré tout, parce que c'est le dernier cycle où elle coûte
-- zéro : la poser plus tard demanderait une migration au moment même où l'on
-- écrirait la logique.
-- ============================================================================
CREATE TABLE ventes.conversion_unite_mesure (
    id            UUID CONSTRAINT pk_conversion_unite_mesure PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    unite_source  TEXT        NOT NULL,
    unite_cible   TEXT        NOT NULL,
    facteur       quantite    NOT NULL,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversion_unite_mesure
        UNIQUE (tenant_id, unite_source, unite_cible),
    CONSTRAINT ck_conversion_unite_mesure_facteur_positif CHECK (facteur > 0)
);

ALTER TABLE ventes.conversion_unite_mesure ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.conversion_unite_mesure FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.conversion_unite_mesure
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.conversion_unite_mesure
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- ⚠️ AUCUN GRANT. L'absence EST la preuve. Voir l'en-tête.

-- Aucun index : une table que personne ne peut lire n'a aucune recherche à
-- servir. Un index sans usage nommé ne se crée pas.


-- ############################################################################
-- 2 · COMMANDE — le cœur du besoin hors-ligne
--
-- ⚠️ L'ORDRE DES TABLES DANS CETTE SECTION EST CONTRAINT PAR LES CLÉS
-- ÉTRANGÈRES INTERNES, et non par l'importance : `jeton_table` et
-- `numerotation_reference` d'abord, puis `commande`, puis `lot_envoi`, puis
-- `ligne_commande` — qui référence les deux —, puis `remise` et
-- `part_addition`. Une table déclarée avant sa cible ferait échouer
-- l'application sur une base vierge, c'est-à-dire précisément ce que P-01
-- prouve.
-- ############################################################################


-- ============================================================================
-- ventes.jeton_table — le QR collé sur la table
-- CLASSE C · branche C2 — explicitement C au cadrage §11.3
-- Story : QRC-01
--
-- ⚠️ SEULE L'EMPREINTE DU JETON EST STOCKÉE, jamais le jeton lui-même. Un jeton
-- en clair dans une table est un jeton qu'une sauvegarde, un export de support
-- ou une fuite de lecture rendrait utilisable — et il ouvre une commande au nom
-- de la table.
--
-- `revoque_le` PLUTÔT QU'UN BOOLÉEN : la révocation est un fait daté. Savoir
-- QUAND un QR a été révoqué est ce qui permet de comprendre une commande arrivée
-- juste après.
--
-- ⚠️ DÉCISION OUVERTE O-03, NON TRANCHÉE PAR CE CYCLE : le crate d'accueil de
-- la surface QR n'est pas arbitré (registre §8.5). La table vit dans `ventes`
-- parce que c'est là que vit la commande qu'elle ouvre ; l'arbitrage porte sur
-- le CRATE, pas sur le schéma, et ne demandera aucune migration de données.
-- ============================================================================
CREATE TABLE ventes.jeton_table (
    id              UUID CONSTRAINT pk_jeton_table PRIMARY KEY,
    tenant_id       UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.table_pdv — NU.
    table_pdv_id    UUID        NOT NULL,
    empreinte_jeton TEXT        NOT NULL,
    emis_le         TIMESTAMPTZ NOT NULL,
    revoque_le      TIMESTAMPTZ     NULL,
    cree_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_jeton_table_empreinte UNIQUE (tenant_id, empreinte_jeton)
);

COMMENT ON COLUMN ventes.jeton_table.table_pdv_id IS
    'Rattachement inter-modules vers etablissements.table_pdv — nu, sans REFERENCES.';
COMMENT ON COLUMN ventes.jeton_table.empreinte_jeton IS
    'EMPREINTE seule, jamais le jeton en clair : un jeton lisible en base ouvre une commande au nom de la table.';

ALTER TABLE ventes.jeton_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.jeton_table FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.jeton_table
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.jeton_table
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.jeton_table TO kaya_app;

-- Sert : les jetons actifs d'une table, et la révocation par table (QRC-01)
CREATE INDEX ix_jeton_table_pdv
    ON ventes.jeton_table (table_pdv_id, revoque_le);


-- ============================================================================
-- ventes.numerotation_reference — le compteur de la référence à emporter
-- CLASSE B · branche B3 — numérotation continue, sérialisée par verrou de ligne
-- Story : PDV-02
--
-- ⚠️ UN COMPTEUR EN TABLE À VERROU DE LIGNE, JAMAIS UNE `SEQUENCE`.
-- Une SEQUENCE PostgreSQL n'est PAS transactionnelle : chaque transaction
-- annulée laisse un trou. Pour une référence de retrait, UN TROU EST UNE
-- COMMANDE DONT PERSONNE NE SAIT SI ELLE A EXISTÉ — le client réclame la 47, la
-- 47 n'existe pas, et rien ne dit si elle a été annulée ou perdue.
-- Le service de la phase 3 verrouille la ligne de sa portée
-- (`SELECT … FOR UPDATE`), incrémente, et libère au commit
-- (00-conventions.sql, piège (c)).
-- ============================================================================
CREATE TABLE ventes.numerotation_reference (
    id                UUID CONSTRAINT pk_numerotation_reference PRIMARY KEY,
    tenant_id         UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id  UUID        NOT NULL,
    portee            TEXT        NOT NULL,
    dernier_numero    BIGINT      NOT NULL DEFAULT 0,
    horodatage_client TIMESTAMPTZ     NULL,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_numerotation_reference_portee
        UNIQUE (tenant_id, etablissement_id, portee),
    CONSTRAINT ck_numerotation_reference_positif CHECK (dernier_numero >= 0)
);

COMMENT ON COLUMN ventes.numerotation_reference.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN ventes.numerotation_reference.dernier_numero IS
    'Compteur à VERROU DE LIGNE, jamais une SEQUENCE : une séquence n''est pas transactionnelle et laisse un trou à chaque annulation.';

ALTER TABLE ventes.numerotation_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.numerotation_reference FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.numerotation_reference
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.numerotation_reference
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.numerotation_reference TO kaya_app;

-- Aucun index : uq_numerotation_reference_portee sert le verrou de ligne, qui
-- est la seule recherche de cette table.


-- ============================================================================
-- ventes.commande — ce qu'on sert, et à qui on le facture
-- CLASSE A · branche A4 — ouverture, réception d'une commande QR
-- CLASSE B · branche B3 — validation d'une commande QR, addition de table
-- Story : PDV-02, PDV-03, QRC-03
--
-- DEUX CLASSES SUR UNE TABLE, et l'opération de chacune est nommée :
--   — L'OUVERTURE est de CLASSE A. Elle n'a aucune unicité tant qu'elle n'est
--     pas numérotée, et c'est ce qui permet à Aminata de prendre une commande au
--     bar sans réseau. C'est le cœur du besoin hors-ligne du produit.
--   — LA RÉCEPTION D'UNE COMMANDE QR est de CLASSE A : elle arrive en état
--     À_CONFIRMER, sans effet.
--   — LA VALIDATION D'UNE COMMANDE QR est de CLASSE B : elle engage la cuisine.
--   — L'OUVERTURE D'UNE ADDITION DE TABLE est de CLASSE B : la table est une
--     RESSOURCE UNIQUE, deux serveurs ne l'ouvrent pas deux fois.
-- La distinction ne se lit dans aucune colonne — c'est le seul point du modèle
-- qui demande un jugement humain, et c'est pourquoi il est écrit ici.
--
-- ⚠️ AUCUNE CONTRAINTE `CHECK` SUR `cible_type`, ET C'EST LE SOCLE QUI L'A
-- TRANCHÉ. Énumérer les valeurs obligerait `ventes` — QUI EST DU SOCLE — à
-- NOMMER `SEJOUR` DANS UNE CONTRAINTE DE BASE, donc à connaître une verticale.
-- Le précédent : `caisse.encaissement` porte `ck_encaissement_mode` — le mode
-- décide de la classe hors-ligne — mais laisse `cible_type` libre.
-- Une `CHECK` imposerait en outre une migration au premier module d'activité
-- nouveau. La valeur circule ; elle reste OPAQUE ; le routage de facturation est
-- fermé par le code de la phase 3, pas par le schéma.
--
-- `ck_commande_etat`, EN REVANCHE, EST LÉGITIME : un état de plus n'est pas de
-- la configuration d'établissement, c'est du code de plus — une transition, un
-- écran, et un arbitrage de classe hors-ligne. C'est la même règle que celle qui
-- rend `ck_encaissement_mode` légitime au socle.
-- ============================================================================
CREATE TABLE ventes.commande (
    id                    UUID CONSTRAINT pk_commande PRIMARY KEY,
    tenant_id             UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.point_de_vente — NU.
    point_de_vente_id     UUID        NOT NULL,
    -- ⚠️ CIBLE OPAQUE. TABLE, SEJOUR, COMPTOIR, EMPORTER — mais AUCUNE CHECK
    -- ne les énumère : `ventes` est du socle et ne nomme pas une verticale.
    cible_type            TEXT        NOT NULL,
    cible_id              UUID            NULL,
    etat                  TEXT        NOT NULL,
    reference_retrait     TEXT            NULL,
    jeton_table_id        UUID            NULL,
    ouverte_le            TIMESTAMPTZ NOT NULL,
    fermee_le             TIMESTAMPTZ     NULL,
    -- Rattachement inter-modules vers comptes.compte — NU.
    ouverte_par_compte_id UUID            NULL,
    horodatage_client     TIMESTAMPTZ     NULL,
    cree_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_commande_jeton_table FOREIGN KEY (jeton_table_id)
        REFERENCES ventes.jeton_table (id),
    CONSTRAINT ck_commande_etat CHECK (etat IN (
        'A_CONFIRMER', 'OUVERTE', 'FERMEE', 'ANNULEE'))
    -- ⚠️ AUCUNE CONTRAINTE SUR cible_type — voir l'en-tête.
);

COMMENT ON COLUMN ventes.commande.point_de_vente_id IS
    'Rattachement inter-modules vers etablissements.point_de_vente — nu, sans REFERENCES.';
COMMENT ON COLUMN ventes.commande.cible_type IS
    'CIBLE OPAQUE : TABLE | SEJOUR | COMPTOIR | EMPORTER. AUCUNE CHECK ne les énumère — `ventes` est du SOCLE et ne nomme pas une verticale dans une contrainte de base. Précédent : caisse.encaissement (cycle D1).';
COMMENT ON COLUMN ventes.commande.cible_id IS
    'Rattachement inter-modules NU vers la cible de facturation. Pour SEJOUR, c''est hebergement.sejour — résolu par un trait exposé, jamais par une jointure.';
COMMENT ON COLUMN ventes.commande.ouverte_par_compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';
COMMENT ON COLUMN ventes.commande.reference_retrait IS
    'Référence à emporter, tirée du compteur ventes.numerotation_reference. NULL hors du mode EMPORTER.';

ALTER TABLE ventes.commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.commande FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.commande
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.commande
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.commande TO kaya_app;

-- Sert : les commandes ouvertes d'un point de vente — l'écran de salle et la
-- reprise après reconnexion (PDV-02)
CREATE INDEX ix_commande_pdv_etat
    ON ventes.commande (point_de_vente_id, etat);

-- Sert : l'addition d'une table, la note d'un séjour — retrouver les commandes
-- d'une cible donnée (PDV-02)
CREATE INDEX ix_commande_cible
    ON ventes.commande (cible_type, cible_id);

-- Sert : l'unicité de la référence à emporter. Index UNIQUE PARTIEL sur la
-- colonne non nulle : hors du mode EMPORTER, la référence est nulle, et deux
-- nuls ne se comparent pas (PDV-02)
--
-- ⚠️ RÈGLE DE SERVICE OPPOSABLE À LA PHASE 3 : LA PORTÉE DE CET INDEX ET CELLE
-- DU COMPTEUR DOIVENT COÏNCIDER. `numerotation_reference` est clé par
-- (tenant, établissement, portée) où `portee` est un LIBELLÉ LIBRE ; pour que le
-- compteur ne rende jamais un numéro que cet index refuse, LA PORTÉE DOIT ÊTRE
-- LE POINT DE VENTE. Un compteur de portée « établissement » avec un index de
-- portée « point de vente » ne casserait rien — il gaspillerait des numéros ;
-- l'inverse ferait échouer une commande sur un conflit qu'aucun écran
-- n'explique.
CREATE UNIQUE INDEX uq_commande_reference_retrait
    ON ventes.commande (tenant_id, point_de_vente_id, reference_retrait)
    WHERE reference_retrait IS NOT NULL;


-- ============================================================================
-- ventes.lot_envoi — ce qui est parti en préparation, et quand
-- CLASSE A · branche A4 — explicitement A au cadrage §11.3
-- Story : PDV-04
--
-- ⚠️ IMMUABLE PAR PRIVILÈGE : `SELECT, INSERT` SEULS, aucun `UPDATE`, aucun
-- `DELETE`. UN SECOND ENVOI CRÉE UN SECOND LOT — il ne modifie pas le premier.
-- C'est ce qui rend le bon d'envoi opposable : la cuisine a reçu ce qui est
-- écrit là, et personne ne peut le récrire après coup.
--
-- ⚠️ SA COMPOSITION EST IMMUABLE PAR CONSÉQUENCE, PAS PAR PRIVILÈGE, ET LA
-- NUANCE EST ÉCRITE PLUTÔT QUE LAISSÉE À CROIRE. La composition vit dans
-- `ligne_commande.lot_envoi_id`, et `ligne_commande` A BESOIN d'`UPDATE` pour
-- son annulation de classe B. LA RÈGLE « `lot_envoi_id` NE S'ÉCRIT QU'UNE FOIS »
-- EST DONC UNE RÈGLE DE SERVICE DE LA PHASE 3, pas une garantie de la base.
-- L'écrire ici évite de laisser croire à une garantie qui n'existe pas.
-- ============================================================================
CREATE TABLE ventes.lot_envoi (
    id                         UUID CONSTRAINT pk_lot_envoi PRIMARY KEY,
    tenant_id                  UUID        NOT NULL,
    commande_id                UUID        NOT NULL,
    destination_preparation_id UUID        NOT NULL,
    numero_lot                 INTEGER     NOT NULL,
    envoye_le                  TIMESTAMPTZ NOT NULL,
    -- Rattachement inter-modules vers comptes.compte — NU.
    envoye_par_compte_id       UUID            NULL,
    horodatage_client          TIMESTAMPTZ     NULL,
    cree_le                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_lot_envoi_commande FOREIGN KEY (commande_id)
        REFERENCES ventes.commande (id),
    CONSTRAINT fk_lot_envoi_destination FOREIGN KEY (destination_preparation_id)
        REFERENCES ventes.destination_preparation (id),
    CONSTRAINT uq_lot_envoi_numero UNIQUE (tenant_id, commande_id, numero_lot),
    CONSTRAINT ck_lot_envoi_numero_positif CHECK (numero_lot > 0)
);

COMMENT ON COLUMN ventes.lot_envoi.envoye_par_compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';
COMMENT ON COLUMN ventes.lot_envoi.numero_lot IS
    'Rang de l''envoi dans la commande. UN SECOND ENVOI CRÉE UN SECOND LOT — la table est immuable par privilège.';

ALTER TABLE ventes.lot_envoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.lot_envoi FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.lot_envoi
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.lot_envoi
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- IMMUABLE PAR PRIVILÈGE — ni UPDATE, ni DELETE.
GRANT SELECT, INSERT ON ventes.lot_envoi TO kaya_app;

-- Sert : l'écran de préparation par destination, par ancienneté — ce que la
-- cuisine doit faire, du plus ancien au plus récent (PDV-07)
CREATE INDEX ix_lot_envoi_destination_date
    ON ventes.lot_envoi (destination_preparation_id, envoye_le);


-- ============================================================================
-- ventes.ligne_commande — ce qui a été commandé, et à quel prix
-- CLASSE A · branche A4 — saisie, modification AVANT envoi
-- CLASSE B · branche B3 — annulation APRÈS envoi
-- Story : PDV-03
--
-- DEUX CLASSES SUR UNE TABLE, et le partage se fait sur l'ENVOI :
--   — LA SAISIE ET LA MODIFICATION AVANT ENVOI sont de CLASSE A. Elles sont
--     purement locales et JAMAIS SYNCHRONISÉES avant l'envoi : tant que la
--     cuisine n'a rien reçu, corriger une quantité n'engage personne.
--   — L'ANNULATION APRÈS ENVOI est de CLASSE B. La cuisine a commencé, il y a
--     un motif obligatoire et une entrée au journal d'audit.
-- `UPDATE` sert les deux, et aucune colonne ne dit laquelle — c'est un jugement
-- humain, écrit ici parce qu'aucune lecture du schéma ne le retrouverait.
--
-- ⚠️ `prix_unitaire` EST VERROUILLÉ À LA CRÉATION : c'est une COPIE de
-- `article.prix`, jamais une lecture différée. UNE MODIFICATION DE TARIF NE
-- MODIFIE AUCUNE COMMANDE EXISTANTE (registre §8.1). Sans la copie, changer un
-- prix à 19 h récrirait le montant des additions ouvertes depuis 18 h.
-- Même raisonnement pour `taux_tva` et `code_devise`.
--
-- ⚠️ `quantite` EST EN `NUMERIC` (amendement A2) : une quincaillerie vend 2,3 m
-- de fer. Le CHECK exige le POSITIF STRICT — une ligne de quantité nulle est une
-- ligne qu'on aurait dû ne pas créer, et une quantité négative serait un avoir
-- déguisé, qui a son propre parcours dans `fiscalite`.
-- ============================================================================
CREATE TABLE ventes.ligne_commande (
    id                    UUID CONSTRAINT pk_ligne_commande PRIMARY KEY,
    tenant_id             UUID           NOT NULL,
    commande_id           UUID           NOT NULL,
    article_id            UUID           NOT NULL,
    quantite              quantite       NOT NULL,
    -- COPIE verrouillée à la création — voir l'en-tête.
    prix_unitaire         montant_mineur NOT NULL,
    code_devise           code_devise    NOT NULL,
    taux_tva              NUMERIC        NOT NULL DEFAULT 0,
    commentaire           TEXT               NULL,
    etat                  TEXT           NOT NULL,
    lot_envoi_id          UUID               NULL,
    motif_annulation      TEXT               NULL,
    -- Rattachement inter-modules vers comptes.compte — NU.
    annulee_par_compte_id UUID               NULL,
    horodatage_client     TIMESTAMPTZ        NULL,
    cree_le               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_ligne_commande_commande FOREIGN KEY (commande_id)
        REFERENCES ventes.commande (id),
    CONSTRAINT fk_ligne_commande_article FOREIGN KEY (article_id)
        REFERENCES ventes.article (id),
    CONSTRAINT fk_ligne_commande_lot FOREIGN KEY (lot_envoi_id)
        REFERENCES ventes.lot_envoi (id),
    CONSTRAINT ck_ligne_commande_etat CHECK (etat IN (
        'SAISIE', 'ENVOYEE', 'PRETE', 'SERVIE', 'ANNULEE')),
    CONSTRAINT ck_ligne_commande_quantite_positive CHECK (quantite > 0),
    -- Le motif d'annulation est OBLIGATOIRE dès que la ligne est annulée. C'est
    -- ce qui fait de l'annulation une opération traçable plutôt qu'une
    -- disparition — le journal d'audit relit ce motif (PDV-03, CPT-04).
    CONSTRAINT ck_ligne_commande_motif_si_annulee CHECK (
        etat <> 'ANNULEE' OR motif_annulation IS NOT NULL)
);

COMMENT ON COLUMN ventes.ligne_commande.prix_unitaire IS
    'COPIE de ventes.article.prix VERROUILLÉE À LA CRÉATION, jamais une lecture différée. Une modification de tarif ne modifie aucune commande existante (PDV-01).';
COMMENT ON COLUMN ventes.ligne_commande.lot_envoi_id IS
    'NE S''ÉCRIT QU''UNE FOIS — RÈGLE DE SERVICE DE LA PHASE 3, jamais une garantie de la base : la table a besoin d''UPDATE pour l''annulation de classe B. Un second envoi crée un SECOND lot.';
COMMENT ON COLUMN ventes.ligne_commande.annulee_par_compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';

ALTER TABLE ventes.ligne_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.ligne_commande FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.ligne_commande
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.ligne_commande
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- UPDATE sert les DEUX classes : la modification avant envoi (A) et
-- l'annulation après envoi (B).
GRANT SELECT, INSERT, UPDATE ON ventes.ligne_commande TO kaya_app;

-- Sert : les lignes d'une addition — l'écran de commande et le total courant
-- (PDV-03)
CREATE INDEX ix_ligne_commande_commande
    ON ventes.ligne_commande (commande_id);

-- Sert : le bon de préparation d'un lot — ce que la cuisine a reçu dans cet
-- envoi précis (PDV-04)
CREATE INDEX ix_ligne_commande_lot
    ON ventes.ligne_commande (lot_envoi_id);


-- ============================================================================
-- ventes.remise — un geste commercial, et qui l'a autorisé
-- CLASSE B · branche B3 — effet monétaire, permission, journal d'audit
-- Story : PDV-03
--
-- `ligne_commande_id` NULLABLE : une remise porte SOIT sur une ligne, SOIT sur
-- l'addition entière. Deux tables auraient dit la même chose deux fois.
--
-- `montant_applique` EST STOCKÉ EN PLUS DE `valeur`, et ce n'est pas une
-- redondance : `valeur` est ce que l'utilisateur a saisi — « 10 % » ou
-- « 500 F » —, `montant_applique` est ce que cela a fait AU MOMENT DE
-- L'APPLICATION. Recalculer 10 % plus tard, sur une addition qui a changé,
-- rendrait un autre montant.
--
-- L'AUTORISATION EST TRACÉE PAR `autorise_par_compte_id`, et l'opération écrit
-- dans `comptes.journal_audit` (constitution, principe 9). Le motif est
-- obligatoire : une remise sans motif est une remise qu'on ne peut pas
-- contester.
-- ============================================================================
CREATE TABLE ventes.remise (
    id                     UUID CONSTRAINT pk_remise PRIMARY KEY,
    tenant_id              UUID           NOT NULL,
    commande_id            UUID           NOT NULL,
    ligne_commande_id      UUID               NULL,
    type                   TEXT           NOT NULL,
    valeur                 NUMERIC        NOT NULL,
    montant_applique       montant_mineur NOT NULL,
    code_devise            code_devise    NOT NULL,
    motif                  TEXT           NOT NULL,
    -- Rattachement inter-modules vers comptes.compte — NU.
    autorise_par_compte_id UUID               NULL,
    horodatage_client      TIMESTAMPTZ        NULL,
    cree_le                TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_remise_commande FOREIGN KEY (commande_id)
        REFERENCES ventes.commande (id),
    CONSTRAINT fk_remise_ligne FOREIGN KEY (ligne_commande_id)
        REFERENCES ventes.ligne_commande (id),
    CONSTRAINT ck_remise_type CHECK (type IN ('POURCENTAGE', 'MONTANT')),
    -- Une remise sans motif est une remise qu'on ne peut pas contester.
    CONSTRAINT ck_remise_motif_obligatoire CHECK (length(trim(motif)) > 0)
);

COMMENT ON COLUMN ventes.remise.valeur IS
    'CE QUE L''UTILISATEUR A SAISI — 0,10 pour 10 %, ou un montant. Distinct de montant_applique, qui est ce que cela a fait au moment de l''application.';
COMMENT ON COLUMN ventes.remise.montant_applique IS
    'CONSTAT DATÉ. Recalculer un pourcentage plus tard, sur une addition qui a changé, rendrait un autre montant.';
COMMENT ON COLUMN ventes.remise.autorise_par_compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES. L''opération écrit aussi dans comptes.journal_audit.';

ALTER TABLE ventes.remise ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.remise FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.remise
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.remise
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.remise TO kaya_app;

-- Sert : les remises d'une addition — le total à payer et le contrôle a
-- posteriori (PDV-03)
CREATE INDEX ix_remise_commande ON ventes.remise (commande_id);


-- ============================================================================
-- ventes.part_addition — l'addition divisée, part par part
-- CLASSE B · branche B3 — effet monétaire, cibles multiples
-- Story : PDV-05
--
-- ⚠️ AUCUNE CONTRAINTE SUR `cible_type` NON PLUS, et pour la même raison qu'à
-- `commande` : une part peut être portée sur la note d'un séjour, et `ventes`
-- ne nomme pas une verticale dans une contrainte de base.
--
-- `mode_division` dit COMMENT on a divisé — également, par ligne, par montant
-- libre. Le conserver permet de refaire la division si un convive change d'avis,
-- ce qui est le cas normal ; sans lui, il faudrait tout ressaisir.
-- ============================================================================
CREATE TABLE ventes.part_addition (
    id                UUID CONSTRAINT pk_part_addition PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    commande_id       UUID           NOT NULL,
    mode_division     TEXT           NOT NULL,
    montant           montant_mineur NOT NULL,
    code_devise       code_devise    NOT NULL,
    -- CIBLE OPAQUE — même régime que ventes.commande.
    cible_type        TEXT               NULL,
    cible_id          UUID               NULL,
    reglee_le         TIMESTAMPTZ        NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_part_addition_commande FOREIGN KEY (commande_id)
        REFERENCES ventes.commande (id),
    CONSTRAINT ck_part_addition_mode CHECK (mode_division IN (
        'EGALE', 'PAR_LIGNE', 'PAR_MONTANT')),
    CONSTRAINT ck_part_addition_montant_positif CHECK (montant > 0)
    -- ⚠️ AUCUNE CONTRAINTE SUR cible_type — voir l'en-tête.
);

COMMENT ON COLUMN ventes.part_addition.cible_id IS
    'Rattachement inter-modules NU vers la cible de règlement d''une part — note de séjour, compte client. Sans REFERENCES et sans CHECK sur cible_type.';

ALTER TABLE ventes.part_addition ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes.part_addition FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON ventes.part_addition
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON ventes.part_addition
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON ventes.part_addition TO kaya_app;

-- Sert : les parts d'une addition divisée — ce qui reste à régler (PDV-05)
CREATE INDEX ix_part_addition_commande ON ventes.part_addition (commande_id);


-- ============================================================================
-- FIN — 55-ventes.sql
-- ============================================================================
