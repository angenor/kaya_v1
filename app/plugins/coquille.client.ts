import { useCoquille } from '~/core/coquille/useCoquille'

/**
 * Enregistre la coquille PWA — après le premier rendu, jamais avant.
 *
 * ⚠️ CONTRAIREMENT AU THÈME, LE MOMENT N'EST PAS CRITIQUE ICI, ET L'INVERSE
 * SERAIT MÊME NUISIBLE : enregistrer le service worker avant le premier rendu
 * ajouterait une requête réseau sur le chemin du premier écran. Ce qui compte
 * est qu'il soit enregistré AVANT que le réseau ne tombe — pas avant le premier
 * pixel.
 */
export default defineNuxtPlugin(() => {
  const { installer } = useCoquille()
  onNuxtReady(() => {
    void installer()
  })
})
