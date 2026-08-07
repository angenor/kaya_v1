import type {
  Etablissement,
  EtablissementModule,
  PointDeVente,
  TablePdv,
} from '~/core/donnees/etablissements/types'

/**
 * CHEZ TANTIE ADJO — LE MAQUIS D'ABOBO, ET LA QUATRIÈME VARIANTE DE `R1`.
 *
 * ⚠️ SANS CE JEU, LA QUATRIÈME MAQUETTE N'A RIEN À AFFICHER, et l'accueil du
 * propriétaire non plus : M. Koffi voit ses **deux** maisons côte à côte.
 *
 * ⚠️ C'EST LE **SECOND ÉTABLISSEMENT DU TENANT `deloria`**, pas un tenant
 * propre. Un tenant propre exigerait un `compte_role` d'un tenant pointant
 * l'établissement d'un autre — ce que le jeu ne fait qu'**une fois** et **pour
 * un motif nommé** (`cr-koffi-test` vers Résidence Test, qui éprouve
 * l'agnosticité du socle). Reproduire l'exception pour un cas ordinaire la
 * banaliserait.
 *
 * ⚠️ ET RÉSIDENCE TEST RESTE INTACTE. Le maquis ne la remplace pas : il en est
 * le pendant côté restauration. L'une fait découvrir toute surface qui suppose
 * une chambre ou un tarif ; l'autre, toute surface qui suppose cinq services.
 *
 * ⚠️ UN SEUL `etablissement_module`, ET C'EST TOUT L'INTÉRÊT. `HEBERGEMENT`,
 * `BAR`, `PRESSING` et `SALLE_REUNION` sont **absents de la liste des actifs** —
 * et `listerModulesActifs` ne rend QUE les actifs, jamais un module inactif
 * accompagné d'un drapeau. Aucun écran n'a donc à décider d'en griser un : il ne
 * le reçoit pas.
 *
 * ⚠️ AUCUNE VALEUR INVENTÉE. Les noms, la commune et le décompte de tables
 * viennent de `docs/design/html/R1-accueil-maquis.html` ; les champs et les
 * types, de `docs/modele-donnees/10-etablissements.sql`, à la transformation
 * `snake_case → camelCase` près.
 */

/**
 * ⚠️ LE TENANT EST ÉCRIT ICI PLUTÔT QU'IMPORTÉ DE `deloria.ts`, ET C'EST UN
 * CHOIX D'ÉVALUATION, PAS UNE DUPLICATION ASSUMÉE. `deloria.ts` importe ce
 * module — il y lit `ETABLISSEMENT_TANTIE_ADJO` pour ses trois `compte_role` —,
 * et l'importer en retour formerait un cycle : à l'évaluation, la constante du
 * module encore en cours de chargement serait dans sa zone morte, et la lecture
 * lèverait. **Le sens d'import est donc unique : `deloria` → `tantie-adjo`.**
 * Ce que la divergence coûterait, un test le ferme :
 * `conformite-modele.spec.ts` compare cette valeur à `deloria.TENANT_DELORIA`.
 */
const TENANT_DELORIA = 'deloria'

export const ETABLISSEMENT_TANTIE_ADJO = 'tantie-adjo-etablissement'
export const POINT_DE_VENTE_LA_SALLE = 'tantie-adjo-pdv-la-salle'

export const etablissements: readonly Etablissement[] = [
  {
    id: ETABLISSEMENT_TANTIE_ADJO,
    tenantId: TENANT_DELORIA,
    code: 'TANTIE_ADJO_ABOBO',
    nom: 'Chez Tantie Adjo',
    juridictionCode: 'CI',
    // ⚠️ Une CHAÎNE, jamais une union fermée : les classements sont propres à
    // la juridiction, et la simulation ne resserre pas ce que la base ouvre.
    classement: 'NON_CLASSE',
    commune: 'Abobo',
    // ⚠️ C'EST CE CHAMP QUI DÉCIDE DE L'HEURE AFFICHÉE À L'EN-TÊTE. Abobo et
    // Abengourou partagent le fuseau ; le lire quand même est ce qui rend le
    // second pays possible sans toucher un écran.
    fuseauHoraire: 'Africa/Abidjan',
    devise: 'XOF',
    adresse: 'Abobo, Côte d’Ivoire',
    // ⚠️ UN MAQUIS N'A PAS DE NCC, ET C'EST LE CAS NORMAL — pas un vide à
    // combler. Une surface qui l'exigerait se casse ici, au moment le moins cher.
    ncc: null,
  },
]

/** **Une seule ligne**, et c'est ce qu'elle prouve qui compte. */
export const etablissementModules: readonly EtablissementModule[] = [
  {
    id: 'tantie-adjo-actif-restauration',
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_TANTIE_ADJO,
    moduleActiviteId: 'module-restauration',
    actif: true,
    activeLe: '2026-03-01T08:00:00.000Z',
    desactiveLe: null,
  },
]

/**
 * ⚠️ `caisseId` RESTE `null`, ET LA COLONNE EST **NUE, SANS `REFERENCES`**.
 * `socle/caisse` est un autre module : l'intégrité inter-modules passe par un
 * trait exposé, jamais par une clé étrangère entre schémas (principe 2, porte
 * P-05). La simulation ne la remplit pas.
 */
export const pointsDeVente: readonly PointDeVente[] = [
  {
    id: POINT_DE_VENTE_LA_SALLE,
    tenantId: TENANT_DELORIA,
    etablissementId: ETABLISSEMENT_TANTIE_ADJO,
    moduleActiviteId: 'module-restauration',
    // ⚠️ LE POSTE UNIQUE DE YAO — c'est ce nom que l'en-tête affiche, et il est
    // DÉRIVÉ, jamais stocké : le modèle ne porte aucun lien `compte →
    // point_de_vente`.
    nom: 'La salle',
    avecTables: true,
    caisseId: null,
  },
]

/**
 * LES NEUF TABLES.
 *
 * ⚠️ ÉCART CONSTATÉ ET TRANCHÉ : la maquette AFFIRME « 9 tables » et « 6 tables
 * occupées sur 9 » dans son corps, et sa grille n'en DESSINE que huit. Le
 * décompte fait foi — `data-model.md` §3.3 l'écrit « neuf lignes », et deux
 * chiffres de la maquette le disent deux fois. **Le jeu fait foi sur les
 * données ; la maquette fait foi sur le dessin** (data-model §3.2). Aucune
 * correction de maquette n'est due de ce chef : une grille d'illustration n'est
 * pas une valeur de référence au sens de `tokens.md`.
 *
 * ⚠️ ET LE COMPTOIR EST L'UNE DES NEUF. `libelle` reste `null` partout ailleurs :
 * une table se nomme par son numéro, et lui inventer un libellé ferait croire
 * que l'exploitant en a saisi un.
 */
export const tablesPdv: readonly TablePdv[] = [
  ...['1', '2', '3', '4', '5', '6', '7', '8'].map((code) => ({
    id: `tantie-adjo-table-${code}`,
    tenantId: TENANT_DELORIA,
    pointDeVenteId: POINT_DE_VENTE_LA_SALLE,
    code,
    libelle: null,
  })),
  {
    id: 'tantie-adjo-table-comptoir',
    tenantId: TENANT_DELORIA,
    pointDeVenteId: POINT_DE_VENTE_LA_SALLE,
    code: 'COMPTOIR',
    libelle: 'Comptoir',
  },
]
