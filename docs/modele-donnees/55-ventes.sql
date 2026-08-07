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


-- ============================================================================
-- FIN — 55-ventes.sql
-- ============================================================================
