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
import EtatVide from '~/core/design-system/EtatVide.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import { usePassage, type CaseChambre, type DureeProposee } from '~/core/reception/composerPassage'
import { formaterHeure } from '~/core/format/instant'
import { formaterMontant } from '~/core/format/montant'
import { useLangue } from '~/core/i18n/useLangue'
import { useSession } from '~/core/session/useSession'

definePageMeta({ path: '/passage' })

const { t } = useI18n()
useHead({ title: () => t('passage.titre') })

const { session } = useSession()
const { passage, composer } = usePassage()
const { langue } = useLangue()

/** La chambre retenue — proposée, ou changée d'un tap. */
const uniteRetenueId = ref<string | null>(null)

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
      <!-- ── LA DÉCISION · propre à l'écran ─────────────────────────────── -->
      <section
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
        <div
          v-else-if="passage.etat === 'vide'"
          class="overflow-hidden rounded-xl border border-line bg-tile"
        >
          <EtatVide message-cle="passage.aucuneChambre" />
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
        <div
          class="flex flex-col gap-2.5 rounded-xl border border-line-2 bg-tile px-4 py-3.5"
          data-piece-apres-la-cle
        >
          <span class="flex items-start gap-2.5">
            <i
              class="ph ph-info shrink-0 text-titre-s text-ocre"
              aria-hidden="true"
            />
            <span class="flex flex-col gap-1">
              <span class="font-titre text-corps font-semibold text-ink-2">{{ $t('passage.pieceApresLaCle') }}</span>
              <span class="text-mini text-ink-3">{{ $t('passage.pieceApresLaCleAide') }}</span>
            </span>
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
        class="flex w-full shrink-0 flex-col gap-2.5 lg:w-96"
        data-rubrique="chambres"
      >
        <div class="flex flex-col gap-1">
          <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.chambresTitre') }}</span>
          <span class="text-mini text-ink-3">{{ $t('passage.chambresAide') }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <button
            v-for="chambre in passage.chambres"
            :key="chambre.unite.id"
            type="button"
            class="flex min-h-16.5 flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-[transform,border-color] duration-110 ease-deplace"
            :class="
              chambre.unite.id === passage.uniteProposeeId
                ? 'cursor-pointer border-2 border-prim bg-tile active:translate-y-0.5'
                : chambre.disponible
                  ? 'cursor-pointer border-line bg-tile active:translate-y-0.5'
                  : 'cursor-default border-line bg-transparent'
            "
            :data-chambre="chambre.unite.code"
            :data-disponible="chambre.disponible ? 'oui' : 'non'"
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
            <span class="text-mini text-ink-3">{{ detailDe(chambre) }}</span>
          </button>
        </div>
      </section>
    </div>

    <!-- ⚠️ LA CHAMBRE RETENUE EST ANNONCÉE EN GRAND, **avant même le tap** :
         c'est le numéro que la réceptionniste dit au client en lui tendant la
         clé, et il doit être lisible d'un mètre. -->
    <div
      v-if="chambreRetenue"
      class="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surf px-5 py-4"
      data-chambre-retenue
    >
      <span class="text-etiquette uppercase text-ink-3">{{ $t('passage.chambreRetenue') }}</span>
      <span class="font-mono text-annonce font-bold text-ink">{{ chambreRetenue.unite.code }}</span>
    </div>
  </div>
</template>
