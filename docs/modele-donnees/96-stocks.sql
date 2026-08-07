-- ============================================================================
-- SCHÉMA stocks — la capacité `capacites/stocks`
--
-- ⚠️ LE STOCK EST UNE CAPACITÉ, PAS UN MODULE (ETB-02b). La distinction n'est
-- pas de vocabulaire : un module est CE QUE FAIT l'établissement — hébergement,
-- pressing, bar ; une capacité est CE DONT IL A BESOIN POUR LE FAIRE. Le stock
-- sert la restauration, le bar, la quincaillerie et le pressing sans appartenir
-- à aucun. C'est pourquoi il vit dans `capacites/` et non dans une verticale, et
-- pourquoi rien ici ne nomme un module.
--
-- SEUL LE PROFIL `SIMPLE` EST IMPLÉMENTÉ. `VALORISE` et `DETAILLE` sont déclarés
-- au socle (etablissements.profil_stock) et REFUSÉS EXPLICITEMENT — le refus est
-- une décision, pas un manque. Conséquences directes sur ce fichier :
--   — aucune valorisation : `mouvement_stock.cout_unitaire` est une PROVISION
--     nullable, jamais renseignée au MVP (00-conventions.sql, amendement A4) ;
--   — aucune commande fournisseur, aucun lot, aucune date limite de
--     consommation, aucun emplacement : ce sont des objets de `DETAILLE`.
--
-- CE QU'IL NE COUVRE PAS, DÉLIBÉRÉMENT : la valorisation du stock, le calcul de
-- prix de revient, la gestion des fournisseurs, la traçabilité par lot. Une
-- table posée d'avance pour l'un de ces quatre se remplirait un jour de ce qui
-- traîne.
--
-- ⚠️ TOUTE QUANTITÉ EST EN `NUMERIC`, JAMAIS EN ENTIER (amendement A2). Une
-- quincaillerie vend 2,3 mètres de fer ; une boulangerie achète 47,5 kg de
-- farine. Passer d'entier à décimal après mise en production imposerait de
-- migrer toutes les lignes de vente et de stock.
--
-- Ordre d'application : après tout le socle, avant les verticales. L'ordre
-- lexicographique DIT LA HIÉRARCHIE DE DÉPENDANCE — c'est la seule information
-- qu'il porte, aucune clé étrangère ne traversant un schéma.
-- ============================================================================

CREATE SCHEMA stocks;
GRANT USAGE ON SCHEMA stocks TO kaya_app;


-- ============================================================================
-- stocks.point_de_stock — où le stock est physiquement tenu
-- CLASSE C · branche C2 — référentiel de l'établissement
-- Story : STK-01
--
-- Cave, cuisine, bar, réserve. DISTINCT du point de vente : une cave sert deux
-- bars, un bar tient son propre stock de service. Les confondre interdirait le
-- transfert entre deux points, qui est le mouvement le plus courant.
-- ============================================================================
CREATE TABLE stocks.point_de_stock (
    id               UUID CONSTRAINT pk_point_de_stock PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id UUID        NOT NULL,
    nom              TEXT        NOT NULL,
    type             TEXT        NOT NULL DEFAULT 'RESERVE',
    actif            BOOLEAN     NOT NULL DEFAULT true,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_point_de_stock_nom UNIQUE (tenant_id, etablissement_id, nom)
);

COMMENT ON COLUMN stocks.point_de_stock.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN stocks.point_de_stock.type IS
    'Libellé de type, sans CHECK : « cave », « cuisine », « réserve » ne sont pas les mêmes chez tous les exploitants, et une énumération imposerait une migration au premier qui en veut une de plus.';

ALTER TABLE stocks.point_de_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.point_de_stock FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.point_de_stock
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.point_de_stock
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON stocks.point_de_stock TO kaya_app;

-- Sert : lister les points de stock d'un établissement, au paramétrage et au
-- choix de destination d'un mouvement (STK-01)
CREATE INDEX ix_point_de_stock_etab
    ON stocks.point_de_stock (etablissement_id, actif);


-- ============================================================================
-- stocks.article_stock — ce qu'on suit en quantité
-- CLASSE C · branche C2 — référentiel de l'établissement
-- Story : STK-01
--
-- DISTINCT DE `ventes.article`, et la distinction est le cœur de la capacité :
-- on vend une « bière pression 33 cl », on stocke un « fût de 30 L ». Un article
-- de stock alimente plusieurs articles de vente, et un article de vente
-- consomme plusieurs articles de stock — c'est ce que porte
-- `article_stock_catalogue`.
--
-- `seuil_alerte` est nullable : tout ce qu'on stocke ne mérite pas une alerte.
-- Une valeur par défaut à zéro ferait crier sur chaque article épuisé, y compris
-- ceux qu'on laisse s'épuiser exprès.
-- ============================================================================
CREATE TABLE stocks.article_stock (
    id               UUID CONSTRAINT pk_article_stock PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    -- Rattachement inter-modules vers etablissements.etablissement — NU.
    etablissement_id UUID        NOT NULL,
    nom              TEXT        NOT NULL,
    -- OBLIGATOIRE, défaut 'unite' (00-conventions.sql, amendement A3). Sans
    -- valeur imposée, la moitié des articles n'en aurait pas et les quantités
    -- deviendraient incomparables.
    unite_mesure     TEXT        NOT NULL DEFAULT 'unite',
    seuil_alerte     quantite        NULL,
    actif            BOOLEAN     NOT NULL DEFAULT true,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_article_stock_nom UNIQUE (tenant_id, etablissement_id, nom),
    CONSTRAINT ck_article_stock_seuil_positif CHECK (
        seuil_alerte IS NULL OR seuil_alerte >= 0)
);

COMMENT ON COLUMN stocks.article_stock.etablissement_id IS
    'Rattachement inter-modules vers etablissements.etablissement — nu, sans REFERENCES.';
COMMENT ON COLUMN stocks.article_stock.seuil_alerte IS
    'NULL = aucune alerte pour cet article. Jamais zéro par défaut : on crierait sur chaque article qu''on laisse s''épuiser exprès.';

ALTER TABLE stocks.article_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.article_stock FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.article_stock
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.article_stock
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON stocks.article_stock TO kaya_app;

-- Sert : le catalogue de stock d'un établissement, au paramétrage et à la
-- saisie d'inventaire (STK-01)
CREATE INDEX ix_article_stock_etab
    ON stocks.article_stock (etablissement_id, actif);


-- ============================================================================
-- stocks.article_stock_catalogue — combien un article vendu consomme
-- CLASSE C · branche C2 — référentiel
-- Story : STK-01
--
-- ★ ENTITÉ NOMMÉE PAR CE CYCLE. Le registre §6.1 la décrivait — « Liaison
-- article de catalogue → article de stock » — sans lui donner de nom. Retenu
-- contre `liaison_article_stock` : la table EST le catalogue de stock d'un
-- article vendu, et un nom commençant par « liaison » range une table par sa
-- mécanique plutôt que par ce qu'elle porte (journal du registre §13).
--
-- `quantite_consommee` est ce qui rend le décrément automatique possible :
-- vendre une « bière pression 33 cl » consomme 0,33 unité du fût. C'est une
-- QUANTITÉ DÉCIMALE, et l'exemple montre pourquoi un entier ne suffirait pas.
--
-- `article_id` EST NU, sans REFERENCES : `ventes` est un autre module, et la
-- liaison vaut même si l'article de vente est retiré du catalogue — le stock a
-- alors un mouvement historique dont l'origine n'existe plus, ce qui est
-- normal et se lit.
-- ============================================================================
CREATE TABLE stocks.article_stock_catalogue (
    id                 UUID CONSTRAINT pk_article_stock_catalogue PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    article_stock_id   UUID        NOT NULL,
    -- Rattachement inter-modules vers ventes.article — NU.
    article_id         UUID        NOT NULL,
    quantite_consommee quantite    NOT NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    modifie_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_article_stock_catalogue_article_stock FOREIGN KEY (article_stock_id)
        REFERENCES stocks.article_stock (id),
    CONSTRAINT uq_article_stock_catalogue
        UNIQUE (tenant_id, article_id, article_stock_id),
    CONSTRAINT ck_article_stock_catalogue_quantite_positive
        CHECK (quantite_consommee > 0)
);

COMMENT ON COLUMN stocks.article_stock_catalogue.article_id IS
    'Rattachement inter-modules vers ventes.article — nu, sans REFERENCES. La liaison survit au retrait de l''article du catalogue de vente : le mouvement historique reste lisible.';

ALTER TABLE stocks.article_stock_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.article_stock_catalogue FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.article_stock_catalogue
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.article_stock_catalogue
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON stocks.article_stock_catalogue TO kaya_app;

-- Sert : le décrément sur vente — partir de l'article vendu pour trouver les
-- articles de stock à décrémenter et de combien (STK-02)
CREATE INDEX ix_article_stock_catalogue_article
    ON stocks.article_stock_catalogue (article_id);


-- ============================================================================
-- stocks.mouvement_stock — ce qui fait bouger une quantité
-- CLASSE B · branche B3 — décrément d'une quantité partagée
-- Story : STK-02
--
-- ⚠️ UNE SEULE CLASSE, B, AVEC UN PRIVILÈGE PLUS STRICT QU'ELLE N'EXIGE.
-- La classe B autorise `UPDATE` ; cette table ne le reçoit pas, et le motif
-- tient en une phrase : UNE CORRECTION DE MOUVEMENT EST UNE CONTRE-PASSATION,
-- pas une réécriture. Corriger une entrée de 12 en 10 par `UPDATE` effacerait la
-- trace de l'erreur ; écrire un mouvement d'ajustement de −2 la conserve, et
-- c'est ce que l'inventaire relit.
-- ⚠️ CE N'EST PAS UNE SECONDE CLASSE. Une décision de forme n'est pas une
-- classe, et les confondre ferait chercher au lecteur une double déclaration qui
-- n'a pas lieu d'être (registre §6.1, contrat de conventions §3).
--
-- ⚠️ DÉCISION OUVERTE O-02, NON TRANCHÉE PAR CE CYCLE. Si le pilote confirme que
-- le stock sert à DÉTECTER LE VOL, `mouvement_stock` reste B et sérialisé ; s'il
-- ne sert qu'à RÉAPPROVISIONNER, il peut passer en A. Jusqu'à cet arbitrage,
-- LA CLASSE INSCRITE AU REGISTRE S'APPLIQUE, et c'est la plus stricte des deux
-- options. Ce n'est pas une question de modèle : c'est une question pour le
-- terrain.
--
-- `cout_unitaire` EST UNE PROVISION-COLONNE (amendement A4) : nullable, JAMAIS
-- RENSEIGNÉE AU MVP. Sans elle, aucune valorisation rétroactive ne serait
-- possible et le profil `VALORISE` exigerait de recréer tout l'historique ; avec
-- une valeur, on croirait le stock valorisé.
-- ============================================================================
CREATE TABLE stocks.mouvement_stock (
    id                UUID CONSTRAINT pk_mouvement_stock PRIMARY KEY,
    tenant_id         UUID           NOT NULL,
    article_stock_id  UUID           NOT NULL,
    point_de_stock_id UUID           NOT NULL,
    type              TEXT           NOT NULL,
    quantite          quantite       NOT NULL,
    -- PROVISION — jamais renseignée au MVP (amendement A4).
    cout_unitaire     montant_mineur     NULL,
    code_devise       code_devise        NULL,
    -- Ce qui a provoqué le mouvement : une ligne de commande, un inventaire, une
    -- saisie manuelle. Colonnes NUES — la cible varie, et certaines vivent dans
    -- un autre module.
    origine_type      TEXT               NULL,
    origine_id        UUID               NULL,
    motif             TEXT               NULL,
    horodatage_client TIMESTAMPTZ        NULL,
    cree_le           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_mouvement_stock_article FOREIGN KEY (article_stock_id)
        REFERENCES stocks.article_stock (id),
    CONSTRAINT fk_mouvement_stock_point FOREIGN KEY (point_de_stock_id)
        REFERENCES stocks.point_de_stock (id),
    -- Une CHECK légitime : un type de plus n'est pas de la configuration
    -- d'établissement, c'est du code de plus — un traitement de décrément, une
    -- ligne au rapport, et un arbitrage de classe hors-ligne.
    CONSTRAINT ck_mouvement_stock_type CHECK (type IN (
        'ENTREE', 'SORTIE_VENTE', 'AJUSTEMENT', 'TRANSFERT', 'CASSE')),
    -- Zéro est refusé, le négatif ne l'est pas : un ajustement de −2 EST la
    -- forme correcte d'une correction. Un mouvement de zéro, lui, est une
    -- écriture qui ne dit rien.
    CONSTRAINT ck_mouvement_stock_quantite_non_nulle CHECK (quantite <> 0)
);

COMMENT ON COLUMN stocks.mouvement_stock.cout_unitaire IS
    'PROVISION — nullable et JAMAIS RENSEIGNÉE AU MVP (amendement A4). Sans elle, aucune valorisation rétroactive ne serait possible ; avec une valeur, on croirait le stock valorisé.';
COMMENT ON COLUMN stocks.mouvement_stock.origine_id IS
    'Rattachement inter-modules (ligne de commande, inventaire) — nu, sans REFERENCES.';

ALTER TABLE stocks.mouvement_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.mouvement_stock FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.mouvement_stock
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.mouvement_stock
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- PRIVILÈGE PLUS STRICT QUE LA CLASSE — voir l'en-tête : une correction est une
-- contre-passation.
GRANT SELECT, INSERT ON stocks.mouvement_stock TO kaya_app;

-- Sert : l'historique d'un article, du plus récent au plus ancien — la fiche
-- article et le calcul de quantité théorique (STK-02)
CREATE INDEX ix_mouvement_stock_article_date
    ON stocks.mouvement_stock (article_stock_id, cree_le DESC);

-- Sert : le journal d'un point de stock sur une période — le contrôle de cave
-- (STK-02)
CREATE INDEX ix_mouvement_stock_point_date
    ON stocks.mouvement_stock (point_de_stock_id, cree_le DESC);


-- ============================================================================
-- stocks.inventaire — on compte ce qu'il y a réellement
-- CLASSE B · branche B3 — effet sur les quantités
-- Story : STK-03
--
-- ⚠️ UNE SEULE CLASSE, B, AVEC UN PRIVILÈGE PLUS STRICT — même régime que
-- `mouvement_stock`, même motif : un inventaire corrigé est un inventaire
-- refait, pas un inventaire réécrit. UNE DÉCISION DE FORME N'EST PAS UNE SECONDE
-- CLASSE.
--
-- Conséquence directe de l'absence d'`UPDATE` : la clôture d'un inventaire ne
-- peut PAS être un changement d'état sur cette ligne. `cloture_le` est donc
-- posée À L'INSERTION, et un inventaire en cours n'existe pas encore en base —
-- il vit dans la file locale du terminal jusqu'à la validation. C'est cohérent
-- avec la classe B : la validation est une opération en ligne.
-- ============================================================================
CREATE TABLE stocks.inventaire (
    id                    UUID CONSTRAINT pk_inventaire PRIMARY KEY,
    tenant_id             UUID        NOT NULL,
    point_de_stock_id     UUID        NOT NULL,
    etat                  TEXT        NOT NULL,
    debute_le             TIMESTAMPTZ NOT NULL,
    cloture_le            TIMESTAMPTZ     NULL,
    -- Rattachement inter-modules vers comptes.compte — NU.
    realise_par_compte_id UUID            NULL,
    horodatage_client     TIMESTAMPTZ     NULL,
    cree_le               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_inventaire_point FOREIGN KEY (point_de_stock_id)
        REFERENCES stocks.point_de_stock (id),
    CONSTRAINT ck_inventaire_etat CHECK (etat IN ('CLOTURE', 'ANNULE')),
    CONSTRAINT ck_inventaire_cloture_coherente CHECK (
        cloture_le IS NULL OR cloture_le >= debute_le)
);

COMMENT ON COLUMN stocks.inventaire.realise_par_compte_id IS
    'Rattachement inter-modules vers comptes.compte — nu, sans REFERENCES.';
COMMENT ON COLUMN stocks.inventaire.etat IS
    'CLOTURE | ANNULE seulement. Un inventaire EN COURS n''existe pas en base : sans UPDATE, il ne pourrait pas y changer d''état. Il vit dans la file locale du terminal jusqu''à la validation, qui est une opération en ligne (classe B).';

ALTER TABLE stocks.inventaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.inventaire FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.inventaire
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.inventaire
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

-- PRIVILÈGE PLUS STRICT QUE LA CLASSE — voir l'en-tête.
GRANT SELECT, INSERT ON stocks.inventaire TO kaya_app;

-- Sert : le dernier inventaire d'un point de stock, et l'historique des
-- comptages (STK-03)
CREATE INDEX ix_inventaire_point_date
    ON stocks.inventaire (point_de_stock_id, debute_le DESC);


-- ============================================================================
-- stocks.ligne_inventaire — un article compté, et son écart
-- CLASSE B · branche B3 — porte l'écart de l'inventaire
-- Story : STK-03
--
-- ★ ENTITÉ NOMMÉE PAR CE CYCLE. Le registre §6.1 disait « `inventaire` — saisie,
-- écart » sans nommer la table qui porte la saisie ligne à ligne.
-- NOM RETENU CONTRE `comptage_article` ET `ligne_comptage`, et le motif est
-- mécanique : `comptage` EST DÉJÀ PRIS AU SOCLE par `caisse.comptage`, et la
-- porte P-02 compare sur le NOM NU, jamais sur `schema.table`. Deux homonymes
-- dans deux schémas passeraient avec une seule déclaration au registre, et l'un
-- des deux serait non déclaré sans que rien ne le dise. Le nom devait donc être
-- libre à l'échelle du modèle entier, pas seulement à celle de son schéma.
--
-- `ecart` est STOCKÉ plutôt que calculé, et c'est délibéré : la quantité
-- théorique du jour du comptage ne se recalcule pas plus tard — les mouvements
-- postérieurs l'auraient changée. L'écart est un CONSTAT DATÉ, comme le constat
-- de taxe de séjour.
-- ============================================================================
CREATE TABLE stocks.ligne_inventaire (
    id                 UUID CONSTRAINT pk_ligne_inventaire PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    inventaire_id      UUID        NOT NULL,
    article_stock_id   UUID        NOT NULL,
    quantite_theorique quantite    NOT NULL,
    quantite_comptee   quantite    NOT NULL,
    ecart              quantite    NOT NULL,
    motif_ecart        TEXT            NULL,
    horodatage_client  TIMESTAMPTZ     NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_ligne_inventaire_inventaire FOREIGN KEY (inventaire_id)
        REFERENCES stocks.inventaire (id),
    CONSTRAINT fk_ligne_inventaire_article FOREIGN KEY (article_stock_id)
        REFERENCES stocks.article_stock (id),
    -- Un article ne se compte qu'une fois par inventaire. Sans cette unicité,
    -- deux saisies concurrentes du même article donneraient deux écarts, et le
    -- rapport en additionnerait un de trop.
    CONSTRAINT uq_ligne_inventaire_article
        UNIQUE (tenant_id, inventaire_id, article_stock_id)
);

COMMENT ON COLUMN stocks.ligne_inventaire.ecart IS
    'CONSTAT DATÉ, stocké et jamais recalculé : la quantité théorique du jour du comptage a changé depuis, et un recalcul rendrait un autre écart.';

ALTER TABLE stocks.ligne_inventaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.ligne_inventaire FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.ligne_inventaire
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.ligne_inventaire
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON stocks.ligne_inventaire TO kaya_app;

-- Sert : la saisie et les écarts d'un inventaire — l'écran de comptage et le
-- rapport d'écart (STK-03)
CREATE INDEX ix_ligne_inventaire_inventaire
    ON stocks.ligne_inventaire (inventaire_id);


-- ============================================================================
-- stocks.alerte_seuil — le stock est passé sous le seuil
-- CLASSE A · branche A4 — explicitement A au cadrage §11.3
-- Story : STK-04
--
-- APPEND-ONLY : une alerte est un FAIT DATÉ, pas un état qu'on acquitte. Deux
-- passages sous le seuil produisent deux lignes, et c'est ce qui permet de dire
-- « cet article est passé sous le seuil quatre fois ce mois-ci » — information
-- qu'un état booléen effacerait à chaque réapprovisionnement.
--
-- `quantite_constatee` ET `seuil` sont TOUS DEUX copiés au moment du
-- déclenchement : le seuil peut être modifié ensuite, et une alerte qui
-- relirait le seuil courant mentirait sur les raisons de son déclenchement.
-- ============================================================================
CREATE TABLE stocks.alerte_seuil (
    id                 UUID CONSTRAINT pk_alerte_seuil PRIMARY KEY,
    tenant_id          UUID        NOT NULL,
    article_stock_id   UUID        NOT NULL,
    point_de_stock_id  UUID        NOT NULL,
    quantite_constatee quantite    NOT NULL,
    seuil              quantite    NOT NULL,
    declenchee_le      TIMESTAMPTZ NOT NULL,
    horodatage_client  TIMESTAMPTZ     NULL,
    cree_le            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_alerte_seuil_article FOREIGN KEY (article_stock_id)
        REFERENCES stocks.article_stock (id),
    CONSTRAINT fk_alerte_seuil_point FOREIGN KEY (point_de_stock_id)
        REFERENCES stocks.point_de_stock (id)
);

COMMENT ON COLUMN stocks.alerte_seuil.seuil IS
    'COPIE du seuil au moment du déclenchement. Relire article_stock.seuil_alerte plus tard ferait mentir l''alerte sur la raison de son déclenchement.';

ALTER TABLE stocks.alerte_seuil ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks.alerte_seuil FORCE  ROW LEVEL SECURITY;

CREATE POLICY isolation_tenant ON stocks.alerte_seuil
    USING      (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY administration_editeur ON stocks.alerte_seuil
    FOR ALL TO kaya_owner USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON stocks.alerte_seuil TO kaya_app;

-- Sert : les alertes récentes d'un article — l'écran de réapprovisionnement
-- (STK-04)
CREATE INDEX ix_alerte_seuil_article_date
    ON stocks.alerte_seuil (article_stock_id, declenchee_le DESC);


-- ============================================================================
-- FIN — 96-stocks.sql
-- ============================================================================
