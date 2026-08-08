/**
 * L'OUVERTURE DE LA NAVIGATION SUR TÉLÉPHONE — **un état, deux consommateurs**.
 *
 * ⚠️ **IL EXISTE PARCE QUE LE BOUTON ET LE TIROIR NE SONT PAS AU MÊME ENDROIT.**
 * Le bouton est dans l'en-tête — le seul coin que l'œil cherche pour sortir d'un
 * écran — et le tiroir est dans le gabarit, à côté du `<main>`. Faire remonter
 * l'état par des propriétés obligerait l'en-tête à émettre vers un parent qui ne
 * le rend pas, et le jour où un troisième écran voudrait fermer le tiroir,
 * chacun aurait sa copie.
 *
 * ⚠️ **ET IL N'EXISTE QUE SOUS `sm`.** Au-delà, le rail est visible en
 * permanence : ce booléen ne pilote rien. Le tiroir est `sm:hidden`, le bouton
 * aussi — c'est le point de rupture qui décide, pas ce fichier.
 *
 * ⚠️ **L'ÉTAT NE SURVIT PAS AU RECHARGEMENT**, comme le repli du rail : c'est un
 * geste du moment, pas un réglage d'appareil. `useState` de Nuxt suffit — aucune
 * persistance, donc rien à traverser `PlatformAdapter`.
 */
export function useNavigationMobile() {
  const ouverte = useState<boolean>('coquille.navigation-mobile', () => false)
  return { ouverte }
}
