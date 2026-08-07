<script setup lang="ts">
/**
 * COMPOSANT 16 · CHAMP DE SAISIE
 *
 * Rôle : la pièce de TOUTE écriture du produit. Les quinze premiers composants
 * disent, montrent et déclenchent ; celui-ci est le seul par lequel l'exploitant
 * entre quelque chose.
 * États : repos · focus · saisie · erreur · désactivé · lecture seule ·
 *         comptoir (`h-12`) · choix fermé (`<select>`).
 *
 * ⚠️ IL REÇOIT DES CLÉS i18n, JAMAIS DU TEXTE. Une chaîne en dur passée en
 * propriété afficherait la clé brute au premier rendu, au lieu d'attendre qu'un
 * anglophone ouvre l'application.
 *
 * ⚠️ LE FOCUS ET LE DÉSACTIVÉ NE SE DÉCLARENT PAS ICI. `theme.css` les porte
 * globalement — l'anneau indigo de 2 px et l'opacité 0,45. Les redéclarer
 * créerait une seconde source de vérité. Le champ n'ajoute que
 * `focus:border-prim` : l'indigo est l'action, et un champ actif se touche.
 *
 * ⚠️ L'ERREUR PORTE TROIS SIGNAUX, JAMAIS LA COULEUR SEULE : bordure danger,
 * message sous le champ, ET icône dans ce message. Sur un 1366 × 768 en plein
 * soleil une bordure rouge seule ne se voit pas — et pas du tout pour un
 * daltonien.
 *
 * ⚠️ L'AIDE S'EFFACE PENDANT L'ERREUR. Deux phrases sous un champ en font lire
 * zéro.
 *
 * ⚠️ LECTURE SEULE ≠ DÉSACTIVÉ. La lecture seule se sélectionne et se copie ;
 * elle passe sur `bg-tile border-line`, où le filet appuyé MENTIRAIT en
 * suggérant qu'on peut écrire.
 */
export interface OptionChoixFerme {
  readonly valeur: string
  readonly libelle: string
}

withDefaults(
  defineProps<{
    etiquetteCle: string
    aideCle?: string
    erreurCle?: string
    type?: 'text' | 'number' | 'tel' | 'email'
    /** Le choix fermé partage l'enveloppe : même étiquette, même aide. */
    options?: readonly OptionChoixFerme[]
    desactive?: boolean
    lectureSeule?: boolean
    comptoir?: boolean
    placeholderCle?: string
  }>(),
  {
    aideCle: undefined,
    erreurCle: undefined,
    type: 'text',
    options: undefined,
    desactive: false,
    lectureSeule: false,
    comptoir: false,
    placeholderCle: undefined,
  },
)

const valeur = defineModel<string>({ default: '' })
const identifiant = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="identifiant"
      class="text-etiquette uppercase text-ink-3"
    >{{ $t(etiquetteCle) }}</label>

    <div class="relative">
      <select
        v-if="options"
        :id="identifiant"
        v-model="valeur"
        :disabled="desactive"
        class="w-full appearance-none rounded-md border-[1.5px] px-3 pr-9 font-texte text-corps text-ink transition-colors duration-90 ease-entree focus:border-prim"
        :class="[
          comptoir ? 'h-12' : 'h-11',
          erreurCle ? 'border-danger' : 'border-line-2',
          desactive || lectureSeule ? 'bg-tile' : 'bg-surf',
        ]"
      >
        <option
          v-for="option in options"
          :key="option.valeur"
          :value="option.valeur"
        >
          {{ option.libelle }}
        </option>
      </select>
      <i
        v-if="options"
        class="ph ph-caret-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-corps text-ink-3"
        aria-hidden="true"
      />

      <input
        v-else
        :id="identifiant"
        v-model="valeur"
        :type="type"
        :disabled="desactive"
        :readonly="lectureSeule"
        :placeholder="placeholderCle ? $t(placeholderCle) : undefined"
        :aria-invalid="Boolean(erreurCle)"
        class="w-full rounded-md border-[1.5px] px-3 font-texte text-corps text-ink transition-colors duration-90 ease-entree placeholder:text-ink-3 focus:border-prim"
        :class="[
          comptoir ? 'h-12' : 'h-11',
          erreurCle ? 'border-danger' : lectureSeule ? 'border-line' : 'border-line-2',
          desactive || lectureSeule ? 'bg-tile' : 'bg-surf',
        ]"
      >
    </div>

    <!-- L'aide s'efface pendant l'erreur : deux phrases en font lire zéro. -->
    <span
      v-if="erreurCle"
      class="inline-flex items-center gap-1.5 text-mini text-danger-fort"
    >
      <i
        class="ph ph-warning-circle"
        aria-hidden="true"
      />
      {{ $t(erreurCle) }}
    </span>
    <span
      v-else-if="aideCle"
      class="text-mini text-ink-3"
    >{{ $t(aideCle) }}</span>
  </div>
</template>
