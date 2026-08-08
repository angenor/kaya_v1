import { echec, reussite, type PorteeLecture, type ResultatDomaine } from '~/core/donnees/contrat'
import type {
  DemandePassage,
  DonneesHebergement,
  DonneesReception,
  EcrituresReception,
  Liberation,
  PassageEnregistre,
  UniteDisponible,
} from '~/core/donnees/hebergement/interface'
import { decale, instantAutorite } from '~/core/donnees/horloge'
import { mouvement } from '~/core/donnees/hebergement/magasin'
import type {
  BaremePalier,
  Categorie,
  Formule,
  Intervalle,
  Occupation,
  PlageDemiJournee,
  Unite,
} from '~/core/donnees/hebergement/types'
import * as deloria from '~/core/donnees/jeux/deloria'
import * as test from '~/core/donnees/jeux/residence-test'
import { prixDeLaDuree } from '~/core/reception/bareme'
import {
  avecRemiseEnEtat,
  intervalleValide,
  occupationEnConflit,
  prochainesLiberations,
  remiseEnEtatMinutes,
  seChevauchent,
  unitesDisponibles,
} from '~/core/reception/disponibilite'
import { formaterHeure } from '~/core/format/instant'
import { ecrireSimule, lireSimule } from '~/core/donnees/simulationCommune'
import { reglagesCourants } from '~/core/scenarios/reglages'

/** ⚠️ Ce fichier disparaît au branchement de la phase 3. */
const TOUTES_CATEGORIES = [...deloria.categories, ...test.categories]
const TOUTES_UNITES = [...deloria.unites, ...test.unites]

/**
 * Les unités d'un établissement.
 *
 * ⚠️ **C'EST CE QUI FAIT QUE « RÉSIDENCE TEST » NE VOIT RIEN.** Elle a des
 * unités mais aucun mouvement : ses lectures rendent des listes vides parce que
 * le jeu est vide, jamais parce qu'un `if` les aurait exclues.
 */
function unitesDe(etablissementId: string): readonly Unite[] {
  const categories = TOUTES_CATEGORIES.filter((c) => c.etablissementId === etablissementId).map(
    (c) => c.id,
  )
  return TOUTES_UNITES.filter((u) => categories.includes(u.categorieId))
}

/** Le code d'une unité, pour les libérations que l'écran affiche. */
function codeDe(uniteId: string): string {
  return TOUTES_UNITES.find((u) => u.id === uniteId)?.code ?? uniteId
}

export const simulationHebergement: DonneesHebergement = {
  listerCategories(portee: PorteeLecture): Promise<ResultatDomaine<readonly Categorie[]>> {
    return lireSimule(
      () => TOUTES_CATEGORIES.filter((c) => c.etablissementId === portee.etablissementId),
      [],
    )
  },

  listerUnites(portee: PorteeLecture): Promise<ResultatDomaine<readonly Unite[]>> {
    return lireSimule(() => unitesDe(portee.etablissementId), [])
  },

  listerFormules(categorieId: string): Promise<ResultatDomaine<readonly Formule[]>> {
    // ⚠️ Résidence Test n'en a AUCUNE, et c'est délibéré : un écran de
    // tarification doit gérer l'absence au lieu de la supposer.
    return lireSimule(
      () => deloria.formules.filter((f) => f.categorieId === categorieId),
      [],
    )
  },

  lireBareme(formuleId: string): Promise<ResultatDomaine<readonly BaremePalier[]>> {
    return lireSimule(
      () => deloria.baremePaliers.filter((p) => p.formuleId === formuleId),
      [],
    )
  },

  listerPlagesDemiJournee(
    formuleId: string,
  ): Promise<ResultatDomaine<readonly PlageDemiJournee[]>> {
    return lireSimule(
      () => deloria.plagesDemiJournee.filter((p) => p.formuleId === formuleId),
      [],
    )
  },
}

/**
 * LES LECTURES DE LA RÉCEPTION — cycle F3.
 *
 * ⚠️ **ELLES HONORENT LES LEVIERS SANS UNE LIGNE DE CODE PROPRE.** Latence,
 * échec réseau, hors ligne et jeu vide passent tous par `lireSimule`, posé au
 * cycle F1. Une lecture qui les réimplémenterait serait une lecture qui les
 * oublierait à moitié.
 */
export const simulationReception: DonneesReception = {
  listerOccupations(
    portee: PorteeLecture,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly Occupation[]>> {
    return lireSimule(() => {
      const miennes = new Set(unitesDe(portee.etablissementId).map((u) => u.id))
      return mouvement().occupations.filter(
        (occupation) =>
          miennes.has(occupation.uniteId) &&
          seChevauchent(occupation.periodeIndisponibilite, periode),
      )
    }, [])
  },

  listerUnitesDisponibles(
    portee: PorteeLecture,
    formuleId: string,
    periode: Intervalle,
  ): Promise<ResultatDomaine<readonly UniteDisponible[]>> {
    return lireSimule(() => {
      // ⚠️ **LA FORMULE DÉCIDE DE LA CATÉGORIE, ET LA CATÉGORIE DES UNITÉS.**
      // C'est le pendant du refus `FORMULE_HORS_CATEGORIE` : proposer une
      // chambre à laquelle la formule ne s'applique pas ferait découvrir le
      // refus au tap, avec le client au comptoir.
      const formule = deloria.formules.find((f) => f.id === formuleId)
      if (!formule) return []
      const occupations = mouvement().occupations
      // ⚠️ LA REMISE EN ÉTAT DE LA DEMANDE COMPTE AUSSI : une chambre dont le
      // ménage suivant mordrait sur l'occupation d'après n'est pas libre, même
      // si l'occupation elle-même y tiendrait.
      const menage = remiseEnEtatMinutes(
        deloria.tempsRemiseEnEtat,
        formuleId,
        formule.categorieId,
      )
      const unites = unitesDe(portee.etablissementId).filter(
        (unite) => unite.categorieId === formule.categorieId,
      )
      return unitesDisponibles(unites, occupations, avecRemiseEnEtat(periode, menage)).map(
        (disponible) => ({
          unite: disponible.unite,
          libreJusqua: disponible.libreJusqua,
          motifCle: null,
        }),
      )
    }, [])
  },

  listerProchainesLiberations(
    portee: PorteeLecture,
    depuis: string,
    limite: number,
  ): Promise<ResultatDomaine<readonly Liberation[]>> {
    return lireSimule(() => {
      const miennes = new Set(unitesDe(portee.etablissementId).map((u) => u.id))
      const occupations = mouvement().occupations.filter((o) => miennes.has(o.uniteId))
      return prochainesLiberations(occupations, depuis, limite).map((liberation) => ({
        ...liberation,
        codeUnite: codeDe(liberation.uniteId),
      }))
    }, [])
  },
}

/**
 * LES ÉCRITURES DE LA RÉCEPTION — cycle F3.
 *
 * ⚠️ **UNE SIMULATION DOIT SAVOIR ÉCHOUER AUSSI BIEN QUE RÉUSSIR** (cadrage
 * §13.0 ter). Celle-ci **déduplique**, **refuse le chevauchement**, **numérote
 * sans trou** et **recalcule le total** — non pour faire joli, mais parce que
 * chacun de ces comportements est celui que la base aura demain. *Un écran qui
 * accepte aujourd'hui ce que la base refusera est un écran à refaire.*
 */
export const simulationEcrituresReception: EcrituresReception = {
  enregistrerPassage(demande: DemandePassage): Promise<ResultatDomaine<PassageEnregistre>> {
    // ⚠️ LA CLASSE EST CELLE DE L'OCCUPATION — la plus stricte des cinq lignes
    // que ce geste écrit. Elle est LUE au registre, jamais recopiée.
    return ecrireSimule('occupation', () => {
      const etat = mouvement()

      // ── 0 · LA DÉDUPLICATION, AVANT TOUT ────────────────────────────────
      // ⚠️ ELLE PRÉCÈDE MÊME LA VALIDATION : un rejeu doit rendre le MÊME
      // résultat, pas une seconde validation qui pourrait échouer entre-temps.
      const deja = etat.demandesTraitees.get(demande.id)
      if (deja !== undefined) return reussite(deja as PassageEnregistre)

      // ── 1 · valider la formule contre la catégorie de l'unité ────────────
      const unite = TOUTES_UNITES.find((u) => u.id === demande.uniteId)
      const formule = deloria.formules.find((f) => f.id === demande.formuleId)
      if (unite === undefined || formule === undefined) return echec('INTROUVABLE')
      if (formule.categorieId !== unite.categorieId) return echec('FORMULE_HORS_CATEGORIE')

      // ── 2 · calculer periode ET periodeIndisponibilite ───────────────────
      const debut = instantAutorite()
      const periode = { debut, fin: decale(debut, demande.dureeMinutes) }
      if (!intervalleValide(periode)) return echec('INTERVALLE_INVALIDE')
      if (
        (formule.dureeMinMinutes !== null && demande.dureeMinutes < formule.dureeMinMinutes) ||
        (formule.dureeMaxMinutes !== null && demande.dureeMinutes > formule.dureeMaxMinutes)
      ) {
        return echec('DUREE_HORS_CONTRAINTE', {
          min: (formule.dureeMinMinutes ?? 0) / 60,
          max: (formule.dureeMaxMinutes ?? 0) / 60,
        })
      }
      const menage = remiseEnEtatMinutes(deloria.tempsRemiseEnEtat, formule.id, unite.categorieId)
      const periodeIndisponibilite = avecRemiseEnEtat(periode, menage)

      // ── 2 bis · la demi-journée ne se fractionne pas ─────────────────────
      // ⚠️ **UNE PLAGE SE LOUE EN ENTIER**, et les heures viennent de
      // l'établissement — jamais du code. Le lexique l'exige : la phrase du
      // refus **reçoit** les deux plages.
      if (formule.type === 'DEMI_JOURNEE') {
        const plages = deloria.plagesDemiJournee.filter((p) => p.formuleId === formule.id)
        const entiere = plages.find(
          (plage) => dureeDeLaPlage(plage) === demande.dureeMinutes,
        )
        if (plages.length >= 2 && entiere === undefined) {
          return echec('PLAGE_NON_FRACTIONNABLE', {
            plage1: `${plages[0]!.heureDebut} – ${plages[0]!.heureFin}`,
            plage2: `${plages[1]!.heureDebut} – ${plages[1]!.heureFin}`,
          })
        }
      }

      // ── 3 · VÉRIFIER LE CHEVAUCHEMENT — AVANT TOUTE ÉCRITURE ─────────────
      // ⚠️ Vérifier après aurait donné la chambre, et le refus se découvrirait
      // avec le client dans le couloir.
      //
      // ⚠️ **ET LE REFUS SE DÉCIDE ICI, AU MOMENT DU TAP — JAMAIS AU MOMENT DE
      // L'AFFICHAGE.** La grille montre l'état d'il y a quelques secondes ;
      // entre les deux, un autre poste a pu donner la chambre. Le levier
      // `conflitAuTap` fait exactement cela, et c'est lui qui exerce le cas des
      // deux réceptionnistes à la même seconde — celui qui décide si le refus
      // arrive avant ou après la clé.
      if (reglagesCourants().conflitAuTap) {
        etat.occupations.push({
          id: `occupation-concurrente-${demande.id}`,
          tenantId: unite.tenantId,
          uniteId: unite.id,
          motif: 'SEJOUR',
          periode,
          periodeIndisponibilite,
          statut: 'ACTIVE',
          origineType: 'sejour',
          origineId: `sejour-concurrent-${demande.id}`,
          horodatageClient: null,
          creeLe: debut,
        })
      }

      const conflit = occupationEnConflit(
        etat.occupations,
        demande.uniteId,
        periodeIndisponibilite,
      )
      if (conflit !== null) {
        return refuserSurConflit(etat, unite, formule, conflit, periodeIndisponibilite)
      }

      // ── 4 · créer l'occupation (ACTIVE) ──────────────────────────────────
      const sejourId = `sejour-${demande.id}`
      const occupation: Occupation = {
        id: `occupation-${demande.id}`,
        tenantId: unite.tenantId,
        uniteId: unite.id,
        motif: 'SEJOUR',
        periode,
        periodeIndisponibilite,
        statut: 'ACTIVE',
        origineType: 'sejour',
        origineId: sejourId,
        horodatageClient: demande.horodatageClient,
        creeLe: debut,
      }
      etat.occupations.push(occupation)

      // ── 5 · créer le séjour (clientId éventuellement NUL) ────────────────
      // ⚠️ UN PASSAGE N'OUVRE AUCUNE FICHE CLIENT : la fiche est de classe C, et
      // en créer une pour un client de deux heures ferait entrer au fichier une
      // personne qui n'a rien demandé.
      etat.sejours.push({
        id: sejourId,
        tenantId: unite.tenantId,
        etablissementId: demande.etablissementId,
        clientId: demande.clientId,
        uniteId: unite.id,
        formuleId: formule.id,
        occupationId: occupation.id,
        reservationId: null,
        etat: 'EN_COURS',
        arriveLe: debut,
        partiLe: null,
        horodatageClient: demande.horodatageClient,
        creeLe: debut,
      })

      // ── 6 · ouvrir la note, y porter la ligne au prix du palier ──────────
      const bareme = deloria.baremePaliers.filter((p) => p.formuleId === formule.id)
      const issue = prixDeLaDuree(bareme, formule, demande.dureeMinutes)
      // ⚠️ **`INTROUVABLE`, ET NON UNE BORNE ÉCRITE EN DUR.** Une première
      // version rendait `DUREE_HORS_CONTRAINTE { min: 1, max: 8 }` — deux
      // valeurs métier dans le code, sur un chemin qui n'a rien à voir avec une
      // durée : le barème de cette formule est **absent du référentiel**. La
      // demi-journée de Deloria est dans ce cas, et c'est un manque du jeu, pas
      // une contrainte de durée. Dire « hors contrainte » aurait envoyé la
      // réceptionniste chercher une durée valable qui n'existe pas.
      if (issue === null) return echec('INTROUVABLE')
      if (issue.bascule) {
        return echec('BASCULE_FORMULE_NON_CONFIRMEE', {
          seuilHeures: issue.seuilMinutes / 60,
          montant: issue.montantNuitee ?? 0,
        })
      }
      const noteId = `note-${demande.id}`
      etat.lignes.push({
        id: `ligne-${demande.id}`,
        tenantId: unite.tenantId,
        noteSejourId: noteId,
        type: 'HEBERGEMENT',
        libelle: `${demande.dureeMinutes / 60} h`,
        quantite: 1,
        prixUnitaire: issue.prix.montant,
        codeDevise: issue.prix.codeDevise,
        tauxTva: '18',
        ligneCommandeId: null,
        sejourOrigineId: null,
        bonDepotId: null,
        horodatageClient: demande.horodatageClient,
        creeLe: debut,
      })

      // ── 7 · encaisser en espèces · 8 · arrêter la note ───────────────────
      // ⚠️ TROIS FAITS DISTINCTS, JAMAIS FONDUS : la note est arrêtée · le
      // règlement est encaissé · la chambre est donnée. Le passage les traverse
      // en un tap, et c'est pourquoi l'annulation les défait TOUS LES TROIS.
      //
      // ⚠️ ET LE TOTAL EST RECALCULÉ DEPUIS LES LIGNES, jamais incrémenté : un
      // cache incrémenté dérive en silence, et personne ne compare.
      etat.notes.push({
        id: noteId,
        tenantId: unite.tenantId,
        sejourId,
        etat: 'ARRETEE',
        arreteeLe: debut,
        totalProvisoire: totalDesLignes(etat, noteId),
        codeDevise: issue.prix.codeDevise,
        horodatageClient: demande.horodatageClient,
        creeLe: debut,
      })

      // ── 9 · émettre la fiche de police, numéro pris AU COMPTEUR ──────────
      const numero = numeroSuivant(etat, demande.etablissementId, debut)
      etat.fichesPolice.push({
        id: `fiche-${demande.id}`,
        tenantId: unite.tenantId,
        sejourId,
        etablissementId: demande.etablissementId,
        numero,
        annee: new Date(debut).getUTCFullYear(),
        // ⚠️ `complete: false` N'EST PAS UN DÉFAUT DE SAISIE : c'est le parcours
        // normal du passage — la pièce vient APRÈS la clé.
        complete: false,
        emiseLe: debut,
        contenu: { formule: formule.type, duree: demande.dureeMinutes },
        horodatageClient: demande.horodatageClient,
        creeLe: debut,
      })

      // ── 10 · rendre ce que l'écran annonce ───────────────────────────────
      const enregistre: PassageEnregistre = {
        occupation,
        sejourId,
        noteSejourId: noteId,
        codeUnite: unite.code,
        finPrevue: periode.fin,
        montant: issue.prix.montant,
        codeDevise: issue.prix.codeDevise,
        numeroFichePolice: numero,
        fenetreAnnulationSecondes: FENETRE_ANNULATION_SECONDES,
      }
      etat.demandesTraitees.set(demande.id, enregistre)
      return reussite(enregistre)
    })
  },

  annulerPassage(occupationId: string): Promise<ResultatDomaine<void>> {
    return ecrireSimule('occupation', () => {
      const etat = mouvement()
      const rang = etat.occupations.findIndex((o) => o.id === occupationId)
      if (rang < 0) return echec('INTROUVABLE')

      const occupation = etat.occupations[rang]!
      // ⚠️ `ANNULEE`, ET NON SUPPRIMÉE. Une ligne supprimée ne laisse aucune
      // trace de ce qui a été tenté — et c'est exactement ce qu'un audit
      // cherche. La contrainte d'exclusion ignore déjà ce statut, donc la
      // chambre redevient libre sans qu'on efface quoi que ce soit.
      etat.occupations[rang] = { ...occupation, statut: 'ANNULEE' }

      // ⚠️ LES CINQ EFFETS, JAMAIS UN SEUL. Annuler l'occupation en laissant la
      // note arrêtée et l'encaissement produirait un trou de caisse que
      // personne ne saurait rattacher à un séjour.
      const sejourId = occupation.origineId
      for (const sejour of etat.sejours) {
        if (sejour.id !== sejourId) continue
        etat.sejours[etat.sejours.indexOf(sejour)] = { ...sejour, etat: 'ANNULE' }
      }
      const notes = etat.notes.filter((n) => n.sejourId === sejourId).map((n) => n.id)
      etat.notes = etat.notes.filter((n) => n.sejourId !== sejourId)
      etat.lignes = etat.lignes.filter((l) => !notes.includes(l.noteSejourId))
      etat.fichesPolice = etat.fichesPolice.filter((f) => f.sejourId !== sejourId)

      return reussite(undefined)
    })
  },
}

/** La durée d'une plage de demi-journée, en minutes. */
function dureeDeLaPlage(plage: PlageDemiJournee): number {
  const [debutH = 0, debutM = 0] = plage.heureDebut.split(':').map(Number)
  const [finH = 0, finM = 0] = plage.heureFin.split(':').map(Number)
  return finH * 60 + finM - (debutH * 60 + debutM)
}

/** ⚠️ Huit secondes, et elles viennent du domaine — jamais du composant. */
const FENETRE_ANNULATION_SECONDES = 8

/** Le total d'une note, **recalculé depuis ses lignes**, jamais incrémenté. */
function totalDesLignes(etat: ReturnType<typeof mouvement>, noteId: string): number {
  return etat.lignes
    .filter((ligne) => ligne.noteSejourId === noteId)
    .reduce((total, ligne) => total + ligne.prixUnitaire * ligne.quantite, 0)
}

/**
 * LE NUMÉRO SUIVANT — **compteur verrouillé, jamais une séquence**.
 *
 * ⚠️ *Un trou dans une numérotation opposable est une fiche dont personne ne
 * sait si elle a existé.* Une séquence PostgreSQL consomme son numéro même
 * quand la transaction échoue ; un compteur ne le fait pas. La simulation
 * incrémente **puis** émet, dans cet ordre, et le test vérifie 1..N sans trou.
 */
function numeroSuivant(
  etat: ReturnType<typeof mouvement>,
  etablissementId: string,
  instant: string,
): string {
  const annee = new Date(instant).getUTCFullYear()
  const rang = etat.numerotations.findIndex(
    (n) => n.etablissementId === etablissementId && n.annee === annee,
  )
  const courant = rang >= 0 ? etat.numerotations[rang]! : null
  const suivant = (courant?.dernierNumero ?? 0) + 1
  const ligne = {
    id: courant?.id ?? `numerotation-${etablissementId}-${annee}`,
    tenantId: courant?.tenantId ?? 'deloria',
    etablissementId,
    annee,
    dernierNumero: suivant,
    horodatageClient: null,
    creeLe: courant?.creeLe ?? instant,
  }
  if (rang >= 0) etat.numerotations[rang] = ligne
  else etat.numerotations.push(ligne)
  return String(suivant)
}

/**
 * LE REFUS QUI **NOMME LA PÉRIODE QUI BLOQUE**, et qui distingue deux cas.
 *
 * ⚠️ **UN MESSAGE GÉNÉRIQUE EST UN DÉFAUT.** C'est la différence entre un refus
 * qu'Adjoua peut expliquer au client et un refus qu'elle contournera. Deux
 * situations, deux codes : la chambre est prise **maintenant**, ou elle est
 * **tenue à partir de** telle heure — et dans le second cas, on donne les
 * chambres libres du même type.
 */
function refuserSurConflit(
  etat: ReturnType<typeof mouvement>,
  unite: Unite,
  formule: Formule,
  conflit: Occupation,
  demande: Intervalle,
): ResultatDomaine<never> {
  const contexte = { fuseauHoraire: 'Africa/Abidjan', langue: 'fr' } as const
  const commenceApres = conflit.periodeIndisponibilite.debut > demande.debut
  if (commenceApres) {
    const libres = unitesDisponibles(
      TOUTES_UNITES.filter((u) => u.categorieId === formule.categorieId && u.id !== unite.id),
      etat.occupations,
      demande,
    ).map((disponible) => disponible.unite.code)
    return echec('CONFLIT_OCCUPATION_SUIVANTE', {
      unite: unite.code,
      heure: formaterHeure(new Date(conflit.periodeIndisponibilite.debut), contexte),
      // ⚠️ LA LISTE — le seul code du contrat qui en porte une, et c'est
      // l'alternative que le lexique exige.
      chambresLibres: libres,
    })
  }
  return echec('UNITE_DEJA_OCCUPEE', {
    unite: unite.code,
    debut: formaterHeure(new Date(conflit.periodeIndisponibilite.debut), contexte),
    fin: formaterHeure(new Date(conflit.periodeIndisponibilite.fin), contexte),
  })
}
