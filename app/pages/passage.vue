<script setup lang="ts">
/**
 * `R4` · LE PASSAGE — **l'écran dont dépend l'adoption du produit**.
 *
 * RÉFÉRENCE VISUELLE : cas (a), **MAQUETTÉ** —
 * `docs/design/html/R4-passage.html` et ses quatre états. On lit ses valeurs,
 * on ne copie pas son balisage ; `docs/design/tokens.md` **prime sur l'export**.
 *
 * ⚠️ **CET ÉCRAN NE SE COMPOSE PAS, ET C'EST ÉCRIT.** `derivation.md` :
 * *« il est en zone de vitesse et ne se compose jamais… `R4` porte une intention
 * dessinée qu'un assemblage ne retrouverait pas — les tailles de la durée et de
 * l'heure de fin, la place du prix sur le bouton »*. Les quatre boutons de durée
 * et la grille sont donc **propres à l'écran** ; il emprunte des composants
 * canoniques **autour** — 07 bandeau d'alerte, 11 état vide, 13 squelette —,
 * jamais **à la place**.
 *
 * ⚠️ **AUCUN BOUTON DE SOUMISSION. LE DERNIER GESTE EST LE TAP SUR LA DURÉE.**
 * C'est l'exigence FR-001, et elle est **mesurée** : ajouter un « Confirmer »
 * entre la durée et l'enregistrement fait rougir P-04 en nommant le budget P1.
 * *Une consigne qu'aucune porte ne mesure est un souhait.*
 *
 * ⚠️ **TROIS ÉLÉMENTS QUE LA MAQUETTE PORTE ET QU'ON NE PEUT PAS LAISSER
 * TOMBER** :
 *   *(a)* **une chambre libre est proposée automatiquement**, avec le motif du
 *         choix quand il y en a un — c'est elle qui économise un tap ;
 *   *(b)* la **grille** ne rend touchables **que** les chambres réellement
 *         disponibles — absentes des cibles, présentes à l'écran : *« absent,
 *         jamais grisé »* porte sur l'action, pas sur l'information ;
 *   *(c)* le bloc **« Pièce d'identité : après la clé, pas avant »** — c'est lui
 *         qui tient les 30 secondes. L'ôter ferait basculer le parcours à ≈ 41 s
 *         (FR-003, FR-005), et la pièce redeviendrait un préalable.
 *
 * ⚠️ **AUCUN MONTANT, AUCUNE DURÉE, AUCUNE HEURE N'EST ÉCRITE ICI.** Tout vient
 * du barème du référentiel, et l'instant vient de la couture. Un tarif dans le
 * balisage serait un tarif que l'exploitant ne peut pas changer.
 *
 * ⚠️ **UNE SEULE RACINE, ET C'EST UN ÉLÉMENT.**
 */
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import BandeauAnnulation from '~/core/design-system/BandeauAnnulation.vue'
import BoutonPrincipal from '~/core/design-system/BoutonPrincipal.vue'
import BoutonSecondaire from '~/core/design-system/BoutonSecondaire.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import type { PassageEnregistre } from '~/core/donnees/hebergement/interface'
import { usePassage, type CaseChambre, type DureeProposee } from '~/core/reception/composerPassage'
import { formaterHeure } from '~/core/format/instant'
import { formaterMontant } from '~/core/format/montant'
import { useLangue } from '~/core/i18n/useLangue'
import { useSession } from '~/core/session/useSession'

definePageMeta({ path: '/passage' })

const { t } = useI18n()
useHead({ title: () => t('passage.titre') })

const { session } = useSession()
const { passage, composer, donnerLaChambre, annuler, garderLaChambre } = usePassage()
const { langue } = useLangue()

/** La chambre retenue — proposée, ou changée d'un tap. */
const uniteRetenueId = ref<string | null>(null)

/**
 * CE QUI VIENT D'ÊTRE ENREGISTRÉ — `null` tant que rien ne l'a été.
 *
 * ⚠️ **L'ÉTAT ENREGISTRÉ N'EST PAS UNE AUTRE PAGE, ET C'EST DÉLIBÉRÉ.** Naviguer
 * ferait perdre la grille, donc le contexte : la réceptionniste doit voir, dans
 * le même écran, que la chambre vient de passer à « Donnée ». Une navigation
 * coûterait aussi le retour, donc un geste.
 */
const enregistre = ref<PassageEnregistre | null>(null)

/**
 * LE COMPTE À REBOURS D'ANNULATION — **huit secondes, venues du domaine**.
 *
 * ⚠️ **IL S'ARRÊTE, MAIS IL NE DÉFAIT RIEN.** Passé le délai, le bandeau
 * disparaît et l'enregistrement reste : *« toute action destructrice s'exécute
 * immédiatement et laisse huit secondes »* — le contraire d'une confirmation
 * préalable, qui n'apprend qu'à répondre oui sans lire.
 */
const secondesRestantes = ref(0)
let rebours: ReturnType<typeof setInterval> | null = null

function arreterLeRebours(): void {
  if (rebours !== null) clearInterval(rebours)
  rebours = null
}

onBeforeUnmount(arreterLeRebours)

/**
 * LE DERNIER GESTE — un tap sur la durée, et **rien après**.
 *
 * ⚠️ **AUCUNE CONFIRMATION N'EST DEMANDÉE ICI.** Ajouter un « Confirmer » entre
 * ce tap et l'enregistrement ferait rougir P-04 en nommant le budget P1 : trois
 * taps, zéro frappe. *L'interdiction de FR-001 est mesurée, pas seulement
 * écrite.*
 */
async function choisirLaDuree(duree: DureeProposee): Promise<void> {
  const resultat = await donnerLaChambre(duree.minutes)
  if (resultat === null) return
  enregistre.value = resultat
  secondesRestantes.value = resultat.fenetreAnnulationSecondes
  arreterLeRebours()
  rebours = setInterval(() => {
    secondesRestantes.value -= 1
    if (secondesRestantes.value <= 0) arreterLeRebours()
  }, 1000)
}

/** Annuler dans les huit secondes — **les cinq effets, jamais un seul**. */
async function annulerLEnregistrement(): Promise<void> {
  const courant = enregistre.value
  if (courant === null) return
  arreterLeRebours()
  const defait = await annuler(courant.occupation.id)
  if (defait) {
    enregistre.value = null
    secondesRestantes.value = 0
  }
}

/** Passer au client suivant — on repart d'un écran propre. */
async function clientSuivant(): Promise<void> {
  arreterLeRebours()
  enregistre.value = null
  secondesRestantes.value = 0
  uniteRetenueId.value = null
  await composer(null)
}

const contexteInstant = computed(() => ({
  fuseauHoraire: 'Africa/Abidjan',
  langue: langue.value,
}))

function heure(instant: string): string {
  return formaterHeure(new Date(instant), contexteInstant.value)
}

function montant(duree: DureeProposee): string {
  return formaterMontant(duree.montant, duree.codeDevise)
}

/**
 * LA DURÉE DU PASSAGE ENREGISTRÉ, EN HEURES — **lue sur l'occupation**.
 *
 * ⚠️ Elle se déduit de la période rendue par le domaine, jamais de ce qui a été
 * demandé : c'est le serveur qui fait foi, et la différence se verra le jour où
 * il arrondira autrement.
 */
const dureeEnregistree = computed(() => {
  const courant = enregistre.value
  if (courant === null) return 0
  const minutes =
    (Date.parse(courant.occupation.periode.fin) - Date.parse(courant.occupation.periode.debut)) /
    60_000
  return minutes / 60
})

/** La chambre affichée en grand — celle qu'on va donner. */
const chambreRetenue = computed<CaseChambre | null>(
  () =>
    passage.value.chambres.find((chambre) => chambre.unite.id === passage.value.uniteProposeeId) ??
    null,
)

/** Le détail d'une case de la grille — libre, ou prise et jusqu'à quand. */
function detailDe(chambre: CaseChambre): string {
  if (!chambre.disponible) return t('passage.chambreOccupee')
  return chambre.libreJusqua === null
    ? t('passage.chambreLibre')
    : t('passage.chambreLibreJusqua', { heure: heure(chambre.libreJusqua) })
}

/**
 * CHANGER DE CHAMBRE — **un tap, et rien d'autre à faire**.
 *
 * ⚠️ ON RECOMPOSE PLUTÔT QUE DE POSER UN ÉTAT LOCAL : les heures de fin et les
 * disponibilités dépendent de l'instant, et un écran laissé ouvert dix minutes
 * proposerait sinon des heures périmées — donc des montants faux.
 */
async function changerDeChambre(chambre: CaseChambre): Promise<void> {
  if (!chambre.disponible) return
  uniteRetenueId.value = chambre.unite.id
  await composer(chambre.unite.id)
}

watch(
  () => [session.value.compteId, session.value.portee] as const,
  () => void composer(uniteRetenueId.value),
  { immediate: true, deep: true },
)
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-5 px-5 py-5 lg:px-6 lg:py-5.5"
    data-ecran="R4"
    data-zone="vitesse"
  >
    <h1 class="sr-only">
      {{ $t('passage.titre') }}
    </h1>

    <!-- ⚠️ LE REFUS EST RENDU PAR LE COMPOSANT 07, **JAMAIS DEUX BANDEAUX
         EMPILÉS**. Il porte sa clé i18n branchée sur le CODE, et son versant
         positif : « cette chambre est prise » est vrai et inutile à quelqu'un
         debout au comptoir. -->
    <BandeauAlerte
      v-if="passage.refus"
      ton="danger"
      :message="$t(`refus.${passage.refus.code}`, passage.refus.parametres)"
      :alternative="$t(`refus.${passage.refus.code}Alternative`, passage.refus.parametres)"
      pleine-largeur
      data-refus
    />

    <div class="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start">
      <!-- ── C'EST FAIT · l'état enregistré ────────────────────────────────
           ⚠️ **LE NUMÉRO DE CHAMBRE ET L'HEURE DE FIN SONT LES DEUX PLUS GRANDS
           ÉLÉMENTS DE LA PAGE**, aux corps `text-annonce` (68 px) et
           `text-annonce-l` (88 px). Ce ne sont pas des titres : ce sont les deux
           nombres que la réceptionniste **dit à voix haute** en tendant la clé,
           et qu'elle doit pouvoir relire d'un mètre pendant qu'elle parle.

           ⚠️ **« ENCAISSÉ EN ESPÈCES » EST UNE PHRASE DISTINCTE DU MONTANT.**
           Fondre les deux laisserait croire au paiement là où il n'y aurait
           qu'un total — et le trou se découvrirait au comptage de caisse, sans
           qu'on sache à quel séjour le rattacher. -->
      <section
        v-if="enregistre"
        class="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-line bg-surf px-5 py-5"
        data-rubrique="enregistre"
      >
        <div class="flex flex-col gap-1">
          <span class="text-etiquette uppercase text-succes-fort">{{ $t('passage.cestFait') }}</span>
          <span class="font-titre text-titre-l font-semibold text-ink">{{
            $t('passage.chambreDonnee', {
              chambre: enregistre.codeUnite,
              duree: $t('passage.heures', { n: dureeEnregistree }),
            })
          }}</span>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            class="flex flex-col items-center gap-1 rounded-xl border border-line bg-tile px-4 py-4"
            data-annonce="chambre"
          >
            <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.chambreRetenue') }}</span>
            <span class="font-mono text-annonce font-bold text-ink">{{ enregistre.codeUnite }}</span>
          </div>
          <div
            class="flex flex-col items-center gap-1 rounded-xl border border-line bg-tile px-4 py-4"
            data-annonce="fin"
          >
            <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.finPrevue') }}</span>
            <!-- ⚠️ **`whitespace-nowrap`, ET LE MOTIF EST UNE CAPTURE.** À
                 88 px, « 18 h 55 » se coupait après le « h » et l'heure se
                 lisait sur deux lignes — le nombre qu'on dit à voix haute
                 devenait deux nombres. Le corps suit la largeur disponible :
                 `text-annonce` en colonne étroite, `text-annonce-l` dès que la
                 place existe. Les deux sont des jetons ; aucune valeur
                 intermédiaire n'est inventée. -->
            <span class="font-mono text-annonce font-bold whitespace-nowrap text-ink lg:text-annonce-l">{{ heure(enregistre.finPrevue) }}</span>
          </div>
        </div>

        <span
          class="text-mini text-ink-3"
          data-encaissement
        >{{
          $t('passage.encaisseEnEspeces', {
            montant: formaterMontant(enregistre.montant, enregistre.codeDevise),
          })
        }}</span>

        <div class="flex flex-wrap items-center gap-3">
          <BoutonPrincipal
            libelle-cle="passage.clientSuivant"
            data-action="client-suivant"
            @activer="clientSuivant()"
          />
          <!-- ⚠️ L'IMPRESSION PASSE PAR LE `PlatformAdapter` (T025a). Ce cycle
               branche le geste ; il ne dessine pas le ticket — le gabarit
               thermique est du cycle F6. -->
          <BoutonSecondaire
            libelle-cle="passage.imprimerLeRecu"
            data-action="imprimer"
          />
        </div>

        <!-- ⚠️ « IDENTITÉ À COMPLÉTER », JAMAIS « INCOMPLÈTE » SEUL : la fiche
             de police émise porte `complete: false`, et c'est le parcours
             normal du passage. La phrase dit ce qui reste à faire et quand. -->
        <div
          class="flex items-start gap-2.5 rounded-xl border border-line-2 bg-tile px-4 py-3.5"
          data-identite-a-completer
        >
          <i
            class="ph ph-info shrink-0 text-titre-s text-ocre"
            aria-hidden="true"
          />
          <span class="text-mini text-ink-3">{{ $t('passage.identiteACompleter') }}</span>
        </div>
      </section>

      <!-- ── LA DÉCISION · propre à l'écran ─────────────────────────────── -->
      <section
        v-else
        class="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-line bg-surf px-5 py-5"
        data-rubrique="decision"
        :data-etat="passage.etat"
      >
        <div class="flex flex-col gap-1">
          <span class="text-etiquette uppercase text-ocre">{{ $t('passage.surtitre') }}</span>
          <span class="font-titre text-titre-l font-semibold text-ink">{{ $t('passage.question') }}</span>
          <!-- ⚠️ (a) LA CHAMBRE PROPOSÉE EST ANNONCÉE ICI, avec son motif quand
               il y en a un. Sans elle, il faudrait un tap de plus — et le
               budget P1 serait dépassé dès le premier écran. -->
          <span
            v-if="chambreRetenue"
            class="text-mini text-ink-3"
            data-proposition
          >{{
            passage.motifPropositionCle
              ? $t(passage.motifPropositionCle, { chambre: chambreRetenue.unite.code })
              : $t('passage.propositionAutomatique', { chambre: chambreRetenue.unite.code })
          }}</span>
        </div>

        <Squelette
          v-if="passage.etat === 'chargement'"
          variante="carte"
        />
        <BandeauAlerte
          v-else-if="passage.etat === 'horsLigne'"
          ton="alerte"
          message-cle="passage.horsLigne"
          alternative-cle="passage.horsLigneAlternative"
          pleine-largeur
        />
        <BandeauAlerte
          v-else-if="passage.etat === 'erreur'"
          ton="danger"
          message-cle="passage.erreur"
          alternative-cle="passage.erreurAlternative"
          action-cle="passage.reessayer"
          pleine-largeur
          @agir="composer(uniteRetenueId)"
        />
        <!-- ── TOUT EST PRIS · composant 11 ──────────────────────────────
             ⚠️ **CE N'EST PAS UN ÉTAT VIDE — LA MAISON EST PLEINE, CE N'EST PAS
             UNE PANNE.** Le composant 11 porte le motif de contreforts ocre,
             mais la phrase et l'action ne sont pas celles d'un démarrage :
             l'écran dit **ce qui se libère et quand**, et propose de **garder
             la chambre** pour le client qui est là, devant le comptoir.

             ⚠️ **« GARDER », JAMAIS « RÉSERVER ».** Le mot promettrait un
             engagement que quinze minutes ne portent pas, et il collerait à
             `RSV`, qui est un autre produit. -->
        <div
          v-else-if="passage.etat === 'vide'"
          class="flex flex-col gap-3 overflow-hidden rounded-xl border border-line bg-tile"
          data-tout-est-pris
        >
          <EtatVide message-cle="passage.toutEstPris" />
          <div
            v-if="passage.liberations.length > 0"
            class="flex flex-col gap-2.5 px-5 pb-5"
          >
            <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.ceQuiSeLibere') }}</span>
            <div
              v-for="liberation in passage.liberations"
              :key="liberation.uniteId"
              class="flex items-center justify-between gap-3 rounded-xl border border-line bg-surf px-4 py-3"
              :data-liberation="liberation.codeUnite"
            >
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="font-mono text-lead font-semibold text-ink">{{ liberation.codeUnite }}</span>
                <!-- ⚠️ **LES DEUX BORNES, ET LA PREMIÈRE EST LA PLUS
                     IMPORTANTE.** *Constaté à l'usage* : « Tenue jusqu'à
                     19 h 03 » posé à côté d'une chambre occupée se lisait « je
                     garde une chambre occupée » — ce qui n'a pas de sens. On
                     tient **celle qui va se libérer**, et la phrase le dit. -->
                <span class="text-mini text-ink-3">{{
                  liberation.tenueDe && liberation.tenueJusqua
                    ? $t('passage.tenueDeA', {
                      de: heure(liberation.tenueDe),
                      a: heure(liberation.tenueJusqua),
                    })
                    : $t('passage.occupeeSeLibereA', { heure: heure(liberation.libreA) })
                }}</span>
              </span>
              <!-- ⚠️ **LE BOUTON PORTE L'HEURE**, et ce n'est pas un détail de
                   libellé : « Garder la chambre » seul laissait croire qu'on
                   agit sur l'occupation en cours. « Garder pour 18 h 48 » dit
                   ce qu'on tient, et à partir de quand. -->
              <BoutonSecondaire
                v-if="!liberation.tenueJusqua"
                :libelle="$t('passage.garderPour', { heure: heure(liberation.libreA) })"
                :data-action="`garder-${liberation.codeUnite}`"
                @activer="garderLaChambre(liberation.uniteId)"
              />
            </div>
          </div>
        </div>

        <!-- ── LES QUATRE BOUTONS DE DURÉE · propres à l'écran ───────────
             ⚠️ **LE PRIX EST SUR LE BOUTON, ET L'HEURE DE FIN AUSSI.** C'est ce
             que la maquette dessine, et ce n'est pas décoratif : la
             réceptionniste annonce l'heure de fin à voix haute au client, et
             elle ne doit pas la calculer de tête.
             ⚠️ **CE TAP EST LE DERNIER GESTE.** Il enregistre. -->
        <div
          v-else
          class="grid grid-cols-2 gap-3 sm:grid-cols-4"
          data-durees
        >
          <button
            v-for="duree in passage.durees"
            :key="duree.minutes"
            type="button"
            class="flex h-38 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl bg-prim text-prim-ink shadow-bouton-grand transition-[transform,box-shadow] duration-90 ease-entree hover:brightness-105 active:translate-y-0.5 active:shadow-none"
            :data-duree="duree.minutes"
            data-mouvement="tactile"
            @click="choisirLaDuree(duree)"
          >
            <span class="font-mono text-geste font-bold">{{ $t('passage.heures', { n: duree.minutes / 60 }) }}</span>
            <span class="font-mono text-lead">{{ montant(duree) }}</span>
            <span class="text-mini opacity-80">{{ $t('passage.jusqua', { heure: heure(duree.fin) }) }}</span>
          </button>
        </div>

        <!-- ── (c) LA PIÈCE D'IDENTITÉ · APRÈS LA CLÉ, PAS AVANT ─────────
             ⚠️ **C'EST CE BLOC QUI TIENT LES 30 SECONDES.** L'ôter — ou en
             faire un préalable — ferait basculer le parcours à ≈ 41 s et
             remettrait la saisie d'identité avant la remise de la clé, ce que
             le terrain ne fait pas. -->
        <!-- ⚠️ **LA GRAMMAIRE DE LA MAQUETTE : UNE LIGNE, PAS UN
             EMPILEMENT.** L'icône, la phrase et **les deux gestes** tiennent
             sur une même rangée, les gestes poussés à droite par `ml-auto`.
             Empilés, ils se lisaient comme une consigne à exécuter — alors que
             ce bloc dit exactement le contraire : *vous pouvez donner la
             chambre tout de suite*.

             ⚠️ **LES DEUX GESTES SONT SECONDAIRES, ET LEUR RANG SE VOIT.**
             « Scanner » porte son icône et une bordure marquée ; « Saisir » est
             plus discret. Aucun des deux n'est le geste principal — celui-là
             est le tap sur la durée, au-dessus. -->
        <div
          class="flex flex-col gap-3 rounded-xl border border-line-2 bg-tile px-4 py-3.5 xl:flex-row xl:items-center"
          data-piece-apres-la-cle
        >
          <i
            class="ph ph-info shrink-0 text-titre-s text-ocre"
            aria-hidden="true"
          />
          <span class="flex min-w-0 flex-col gap-1">
            <span class="font-titre text-corps font-semibold text-ink-2">{{ $t('passage.pieceApresLaCle') }}</span>
            <span class="text-mini text-ink-3">{{ $t('passage.pieceApresLaCleAide') }}</span>
          </span>
          <!-- ⚠️ **LES GESTES PASSENT À DROITE SEULEMENT EN `xl`.** *Constaté
               sur une capture* : dès `sm`, ils écrasaient la phrase à cinq
               lignes sur un poste de 1 280 px — et cette phrase est celle qui
               fait tenir les 30 secondes. Le texte prime ; les gestes attendent
               d'avoir la place. -->
          <span class="flex shrink-0 items-center gap-2 xl:ml-auto">
            <button
              type="button"
              class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-line-2 px-4 font-titre text-corps font-semibold text-ink transition-[transform,border-color] duration-90 hover:border-prim active:translate-y-0.5"
              data-action="scanner-piece"
            >
              <i
                class="ph ph-camera text-titre-s"
                aria-hidden="true"
              />
              {{ $t('passage.scannerLaPiece') }}
            </button>
            <button
              type="button"
              class="inline-flex h-11 cursor-pointer items-center rounded-md border border-line px-4 font-titre text-corps font-medium text-ink-2 transition-colors duration-90 hover:border-line-2 hover:text-ink"
              data-action="saisir-telephone"
            >
              {{ $t('passage.saisirTelephone') }}
            </button>
          </span>
        </div>
      </section>

      <!-- ── (b) LA GRILLE DES CHAMBRES ────────────────────────────────────
           ⚠️ **SEULES LES DISPONIBLES SONT TOUCHABLES.** Une chambre prise
           reste VISIBLE — c'est une information, et l'information ne se cache
           pas —, mais elle n'est pas une cible : ce n'est pas un `disabled`,
           c'est un élément qui n'est pas un bouton. -->
      <section
        v-if="passage.chambres.length > 0"
        class="flex w-full shrink-0 flex-col gap-2.5 lg:w-80 xl:w-96"
        data-rubrique="chambres"
      >
        <div class="flex flex-col gap-1">
          <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.chambresTitre') }}</span>
          <span class="text-mini text-ink-3">{{ $t('passage.chambresAide') }}</span>
        </div>
        <!-- ⚠️ **UN BLOC PAR ÉTAGE, ET C'EST LE PLAN DE LA MAISON.** Une
             réceptionniste cherche « la 12 du premier », pas « la douzième de
             la liste » : à plat, il faut lire tous les numéros pour retrouver
             un niveau, et c'est le geste qu'on refait vingt fois par jour. -->
        <div
          v-for="etage in passage.etages"
          :key="etage.etage ?? 'sans-etage'"
          class="flex flex-col gap-2"
          :data-etage="etage.etage ?? 'sans-etage'"
        >
          <span class="text-etiquette uppercase text-ink-3">{{
            etage.etage === null
              ? $t('passage.etageInconnu')
              : etage.etage === '0'
                ? $t('passage.rezDeChaussee')
                : $t('passage.etage', { n: etage.etage })
          }}</span>
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button
              v-for="chambre in etage.chambres"
              :key="chambre.unite.id"
              type="button"
              class="flex min-h-16.5 flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-[transform,border-color] duration-110 ease-deplace"
              :class="
                chambre.unite.id === passage.uniteProposeeId
                  ? 'cursor-pointer border-2 border-prim bg-tile active:translate-y-0.5'
                  : chambre.disponible
                    ? 'cursor-pointer border-line bg-tile active:translate-y-0.5'
                    : 'cursor-default border-line bg-transparent opacity-55'
              "
              :data-chambre="chambre.unite.code"
              :data-disponible="chambre.disponible ? 'oui' : 'non'"
              :data-donnee="chambre.unite.code === enregistre?.codeUnite ? 'oui' : undefined"
              :data-retenue="chambre.unite.id === passage.uniteProposeeId ? 'oui' : undefined"
              @click="changerDeChambre(chambre)"
            >
              <span class="flex items-center gap-2">
                <span
                  class="size-2 shrink-0"
                  :class="chambre.disponible ? 'rounded-xs bg-succes' : 'rounded-pleine bg-alerte'"
                  aria-hidden="true"
                />
                <span class="font-mono text-lead font-semibold text-ink">{{ chambre.unite.code }}</span>
              </span>
              <!-- ⚠️ **LA CHAMBRE PASSE À « DONNÉE » SANS RECHARGEMENT**, et
                   c'est ce qui permet de rester sur le même écran. -->
              <span class="text-mini text-ink-3">{{
                chambre.unite.code === enregistre?.codeUnite ? $t('passage.chambreDonneeCourt') : detailDe(chambre)
              }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- ⚠️ LA CHAMBRE RETENUE EST ANNONCÉE EN GRAND, **avant même le tap** :
         c'est le numéro que la réceptionniste dit au client en lui tendant la
         clé, et il doit être lisible d'un mètre. -->
    <div
      v-if="chambreRetenue && !enregistre"
      class="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surf px-5 py-4"
      data-chambre-retenue
    >
      <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.chambreRetenue') }}</span>
      <span class="font-mono text-annonce font-bold text-ink">{{ chambreRetenue.unite.code }}</span>
    </div>

    <!-- ── LE BANDEAU D'ANNULATION · composant 14 ────────────────────────────
         ⚠️ **EN SURIMPRESSION, JAMAIS EN FLUX.** Posé dans le flux, il
         pousserait la page vers le bas au moment précis où la réceptionniste
         lit un numéro de chambre — et le nombre bougerait sous ses yeux
         pendant qu'elle le dit à voix haute.

         ⚠️ **ET IL DÉFAIT LES CINQ EFFETS, JAMAIS UN SEUL** : occupation,
         séjour, note, encaissement, fiche. Annuler la seule occupation en
         laissant la note arrêtée produirait un trou de caisse que personne ne
         saurait rattacher à un séjour. -->
    <div
      v-if="enregistre && secondesRestantes > 0"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-5"
      data-bandeau-annulation
    >
      <div class="pointer-events-auto w-full max-w-140">
        <BandeauAnnulation
          message-cle="passage.annulationPossible"
          :secondes="secondesRestantes"
          :secondes-total="enregistre.fenetreAnnulationSecondes"
          action-cle="passage.annuler"
          @annuler="annulerLEnregistrement()"
        />
      </div>
    </div>
  </div>
</template>
