<script setup lang="ts">
/**
 * `R2` · LA VUE DU JOUR — **le point d'entrée du passage et de l'arrivée**.
 *
 * RÉFÉRENCE VISUELLE : cas (b), **DÉRIVÉ** — `derivation.md` : *« hérite de
 * `R1` + composant 14 · **grille d'unités au lieu de tuiles** »*. On ouvre
 * `docs/design/html/R1-accueil.html` et on en respecte la **grammaire** : deux
 * colonnes, à gauche ce qu'on FAIT, à droite ce qu'on SURVEILLE.
 * Composants : **05** tuile d'action · **08** ligne de liste · **06** carte
 * chiffre · **04** pastille · **11** état vide · **13** squelette · **07**
 * bandeau d'alerte.
 *
 * ⚠️ **CE QUI CHANGE PAR RAPPORT À `R1`, ET C'EST TOUT** : les tuiles de la
 * colonne principale laissent place à **la grille des chambres**. Un accueil
 * répond à « qu'est-ce qui m'attend » ; la vue du jour répond à « où en est la
 * maison ». Les deux questions n'ont pas la même forme, et le reste de la
 * grammaire — la colonne latérale, les états, la réserve de bas de page — ne
 * bouge pas.
 *
 * ⚠️ **SANS CET ÉCRAN, LE PARCOURS DES TROIS TAPS N'A PAS DE PREMIER TAP.**
 * C'est un dérivé sans priorité propre, et il passe pourtant avant les récits
 * P1 du cycle : *aucun budget de gestes ne se mesure sans lui*.
 *
 * ⚠️ **LE COMPOSANT 14 ARRIVE AVEC LE STATUT MÉNAGE (T051, HEB-06)**, et non
 * ici : le bandeau d'annulation n'a de sens que derrière une écriture, et la
 * seule écriture de cet écran est le changement de statut — de classe **A**,
 * donc différée en phase 11 avec le reste du P1. *L'inscrire à `derivation.md`
 * avant qu'il existe ferait mentir le document.*
 *
 * ⚠️ **UNE SEULE RACINE, ET C'EST UN ÉLÉMENT.**
 */
import CarteChiffre from '~/core/design-system/CarteChiffre.vue'
import BandeauAlerte from '~/core/design-system/BandeauAlerte.vue'
import EtatVide from '~/core/design-system/EtatVide.vue'
import LigneListe from '~/core/design-system/LigneListe.vue'
import PastilleEtat from '~/core/design-system/PastilleEtat.vue'
import Squelette from '~/core/design-system/Squelette.vue'
import TuileAction from '~/core/design-system/TuileAction.vue'
import { useJour, type ChambreDuJour } from '~/core/reception/composerJour'
import { formaterHeure } from '~/core/format/instant'
import { useLangue } from '~/core/i18n/useLangue'
import { useSession } from '~/core/session/useSession'

definePageMeta({ path: '/jour' })

const { t } = useI18n()
useHead({ title: () => t('jour.titre') })

const { session } = useSession()
const { jour, composer } = useJour()
const { langue } = useLangue()

/**
 * L'HEURE DE LIBÉRATION, ÉCRITE PAR LA SEULE FONCTION QUI ÉCRIT UNE HEURE.
 *
 * ⚠️ **AU FUSEAU DE L'ÉTABLISSEMENT, jamais à celui de l'appareil.** Un poste
 * réglé ailleurs afficherait une heure qui n'est celle de personne — et la
 * réceptionniste annoncerait au client une chambre libre à la mauvaise heure.
 */
const contexteInstant = computed(() => ({
  fuseauHoraire: 'Africa/Abidjan',
  langue: langue.value,
}))

function heureDe(instant: string | null): string | null {
  return instant === null ? null : formaterHeure(new Date(instant), contexteInstant.value)
}

/** Le sous-titre d'une chambre — ce qu'elle est, et jusqu'à quand. */
function detailDe(chambre: ChambreDuJour): string {
  if (chambre.libre) return t(`jour.menage.${chambre.unite.statutMenage}`)
  const heure = heureDe(chambre.libreA)
  return heure === null ? t('jour.occupee') : t('jour.occupeeJusqua', { heure })
}

/** Les chambres qui se libèrent, dans l'ordre de l'heure. */
const liberations = computed(() =>
  jour.value.chambres
    .filter((chambre) => !chambre.libre && chambre.libreA !== null)
    .sort((a, b) => (a.libreA! < b.libreA! ? -1 : 1))
    .slice(0, 6),
)

/** Les rubriques qui se rendent : tout sauf « absente ». */
const seRend = computed(() => jour.value.etat !== 'absente')

watch(
  () => [session.value.compteId, session.value.portee] as const,
  () => void composer(),
  { immediate: true, deep: true },
)
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col overflow-y-auto lg:h-full lg:flex-row lg:items-stretch lg:overflow-hidden"
    data-ecran="R2"
    data-zone="charme"
  >
    <!-- ── LA COLONNE PRINCIPALE · ce qu'on FAIT ─────────────────────────── -->
    <div class="flex min-w-0 flex-col gap-4 px-5 py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-6 lg:py-5.5">
      <h1 class="sr-only">
        {{ $t('jour.titre') }}
      </h1>

      <!-- ── Les deux points d'entrée · composant 05 ─────────────────────── -->
      <!-- ⚠️ CE SONT LES DEUX PREMIERS TAPS DU PRODUIT. « Donner une chambre »
           mène au passage, « Enregistrer une arrivée » au parcours long. Les
           mettre en tête n'est pas une hiérarchie de goût : c'est ce que la
           réception fait vingt fois par jour. -->
      <section
        class="flex shrink-0 flex-col gap-2.5"
        data-rubrique="actions"
      >
        <span class="text-etiquette uppercase text-ink-3">{{ $t('jour.actionsTitre') }}</span>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TuileAction
            libelle-cle="jour.donnerUneChambre"
            icone="ph-key"
            detail-cle="jour.donnerUneChambreDetail"
            data-action="passage"
            @activer="navigateTo('/passage')"
          />
          <TuileAction
            libelle-cle="jour.enregistrerUneArrivee"
            icone="ph-user-plus"
            detail-cle="jour.enregistrerUneArriveeDetail"
            data-action="arrivee"
            @activer="navigateTo('/arrivee')"
          />
        </div>
      </section>

      <!-- ── La grille des chambres · composants 04 et 05 compacte ───────── -->
      <section
        v-if="seRend"
        class="flex shrink-0 flex-col gap-2.5"
        data-rubrique="chambres"
        :data-etat="jour.etat"
      >
        <span class="text-etiquette uppercase text-ink-3 font-bold">{{ $t('jour.chambresTitre') }}</span>
        <Squelette
          v-if="jour.etat === 'chargement'"
          variante="carte"
        />
        <BandeauAlerte
          v-else-if="jour.etat === 'horsLigne'"
          ton="alerte"
          message-cle="jour.horsLigne"
          alternative-cle="jour.horsLigneAlternative"
          pleine-largeur
        />
        <BandeauAlerte
          v-else-if="jour.etat === 'erreur'"
          ton="danger"
          message-cle="jour.erreur"
          alternative-cle="jour.erreurAlternative"
          action-cle="jour.reessayer"
          pleine-largeur
          @agir="composer()"
        />
        <div
          v-else-if="jour.etat === 'vide'"
          class="overflow-hidden rounded-xl border border-line bg-surf"
        >
          <!-- ⚠️ « Résidence Test » ARRIVE ICI, et c'est voulu : un
               établissement sans chambre voit une phrase, jamais un cadre nu. -->
          <EtatVide message-cle="jour.aucuneChambre" />
        </div>
        <!-- ⚠️ **UN BLOC PAR ÉTAGE.** Dans un hôtel à niveaux, une grille à
             plat oblige à lire tous les numéros pour retrouver un étage.

             ⚠️ **ET LES OCCUPÉES SONT ATTÉNUÉES**, comme sur la maquette. Ce
             n'est **pas** le grisé que la règle proscrit : celle-là porte sur
             une ACTION interdite par permission ou par module inactif, qui doit
             disparaître. Ici, l'atténuation dit un ÉTAT DE FAIT — la chambre
             est prise — et l'information, elle, ne se cache jamais. *Les
             confondre ferait disparaître de la vue du jour la moitié des
             chambres de la maison.* -->
        <!-- ⚠️ `v-else` SUR UN `<template>`, ET NON SUR LE `v-for` LUI-MÊME :
             cumuler les deux directives sur un même nœud fait dépendre le rendu
             de leur priorité relative, qui a déjà changé entre deux versions
             majeures de Vue. -->
        <template v-else>
          <div
            v-for="etage in jour.etages"
            :key="etage.etage ?? 'sans-etage'"
            class="flex flex-col gap-2"
            :data-etage="etage.etage ?? 'sans-etage'"
          >
            <!-- ⚠️ **LE FILET PROLONGE L'INTITULÉ JUSQU'AU BOUT, ET IL TRAVAILLE.**
                 Les niveaux se suivent sans respiration : un intitulé de 11 px
                 posé au-dessus d'une grille de tuiles se lit comme une tuile de
                 plus. Le trait donne au niveau une LIGNE À LUI, et l'œil compte
                 les étages sans lire les mots. Il est `aria-hidden` — c'est une
                 séparation visuelle, et l'intitulé dit déjà tout. -->
            <span class="flex items-center gap-3">
              <span class="shrink-0 text-etiquette uppercase text-ink-3">{{
                etage.etage === null
                  ? $t('jour.etageInconnu')
                  : etage.etage === '0'
                    ? $t('jour.rezDeChaussee')
                    : $t('jour.etage', { n: etage.etage })
              }}</span>
              <span
                class="flex-1 border-t border-line"
                aria-hidden="true"
              />
            </span>
            <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div
                v-for="chambre in etage.chambres"
                :key="chambre.unite.id"
                class="flex min-h-16.5 flex-col items-start gap-1.5 rounded-xl border border-line px-3 py-2.5"
                :class="chambre.libre ? 'bg-tile' : 'bg-transparent opacity-55'"
                :data-chambre="chambre.unite.code"
                :data-libre="chambre.libre ? 'oui' : 'non'"
              >
                <span class="flex items-center gap-2">
                  <PastilleEtat
                    :etat="chambre.etat"
                    :libelle-cle="chambre.libre ? 'jour.pastilleLibre' : 'jour.pastilleOccupee'"
                    contour
                  />
                  <span class="font-mono text-lead font-semibold text-ink">{{ chambre.unite.code }}</span>
                </span>
                <span class="text-mini text-ink-3">{{ detailDe(chambre) }}</span>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- ── LA COLONNE LATÉRALE · ce qu'on SURVEILLE ──────────────────────── -->
    <div
      class="flex w-full shrink-0 flex-col gap-5.5 border-t border-line bg-surf px-5 py-5 lg:min-h-0 lg:w-84 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:py-5.5"
      data-colonne="laterale"
    >
      <!-- ── Les chiffres du jour · composant 06 ───────────────────────── -->
      <section
        class="flex shrink-0 flex-col gap-2.5"
        data-rubrique="chiffre"
        :data-etat="jour.etat"
      >
        <span class="text-etiquette uppercase text-ink-3">{{ $t('jour.chiffresTitre') }}</span>
        <Squelette
          v-if="jour.etat === 'chargement'"
          variante="carte"
        />
        <template v-else>
          <CarteChiffre
            etiquette-cle="jour.chambresLibres"
            :valeur="String(jour.libres)"
            creux
            contrefort
            data-chiffre="libres"
          />
          <CarteChiffre
            etiquette-cle="jour.chambresOccupees"
            :valeur="String(jour.occupees)"
            creux
            data-chiffre="occupees"
          />
          <CarteChiffre
            etiquette-cle="jour.departsAttendus"
            :valeur="String(jour.departsAttendus)"
            creux
            data-chiffre="departs"
          />
        </template>
      </section>

      <!-- ── Ce qui se libère, et quand · composant 08 ─────────────────── -->
      <section
        class="flex shrink-0 flex-col gap-2.5"
        data-rubrique="liberations"
      >
        <span class="text-etiquette uppercase text-ink-3">{{ $t('jour.liberationsTitre') }}</span>
        <div
          v-if="liberations.length === 0"
          class="overflow-hidden rounded-xl border border-line bg-tile"
        >
          <!-- Rien à libérer est une information, pas une panne. -->
          <EtatVide message-cle="jour.aucuneLiberation" />
        </div>
        <LigneListe
          v-for="chambre in liberations"
          v-else
          :key="chambre.unite.id"
          :reference="chambre.unite.code"
          :libelle="heureDe(chambre.libreA) ?? ''"
          sous-titre-cle="jour.libereA"
          data-liberation
        />
      </section>

      <span class="hidden flex-1 lg:block" />

      <!-- ⚠️ LA NOTE DE PIED DIT LA PORTÉE DE CE QU'ON VIENT DE LIRE. Sans
           elle, une chambre absente de la grille se lirait comme une chambre
           disparue plutôt que comme une chambre d'un autre établissement. -->
      <div
        class="border-t border-line pt-4"
        data-note-de-pied
      >
        <span class="text-mini text-ink-3">{{ $t('jour.note') }}</span>
      </div>
    </div>
  </div>
</template>
