/**
 * Les règles opposables de Kaya, écrites ici parce qu'aucun greffon ne les
 * porte.
 *
 * Elles fonctionnent sur le TEXTE du fichier et non sur son arbre syntaxique, et
 * c'est un choix : ce qu'elles refusent vit pour l'essentiel dans des
 * ATTRIBUTS DE GABARIT — `class="bg-[#21458c]"` —, que l'arbre du script ne voit
 * pas. Une règle qui ne verrait que le script laisserait passer exactement le
 * cas fréquent.
 *
 * Les commentaires sont MASQUÉS avant l'analyse, en préservant les indices :
 * sans cela, un commentaire qui CITE ce qu'il interdit ferait échouer la règle
 * sur son propre motif — ce qui s'est produit une fois sur le test des polices.
 */

/** Remplace le contenu des commentaires par des espaces, à longueur égale. */
function masquerCommentaires(texte) {
  const remplacer = (bloc) => bloc.replace(/[^\n]/g, ' ')
  return texte
    .replace(/\/\*[\s\S]*?\*\//g, remplacer)
    .replace(/<!--[\s\S]*?-->/g, remplacer)
    .replace(/(^|[^:\w])\/\/[^\n]*/g, (bloc, avant) => avant + remplacer(bloc.slice(avant.length)))
}

function signaler(context, texte, motifs) {
  const masque = masquerCommentaires(texte)
  for (const { regex, messageId } of motifs) {
    regex.lastIndex = 0
    for (const trouve of masque.matchAll(regex)) {
      context.report({
        loc: context.sourceCode.getLocFromIndex(trouve.index),
        messageId,
        data: { objet: trouve[0].trim() },
      })
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   (a) · AUCUNE API DE PLATEFORME HORS DE L'ADAPTATEUR
   ═══════════════════════════════════════════════════════════════════════════
   « Toute capacité de plateforme passe par PlatformAdapter » (constitution,
   principe 7). C'est cette règle, et elle seule, qui rend le passage à Capacitor
   mécanique plutôt qu'une réécriture. La liste est celle du §6 de
   contracts/platform-adapter.md, jamais élargie de mémoire. */
const MOTIFS_PLATEFORME = [
  { regex: /\bnavigator\s*\./g, messageId: 'plateforme' },
  { regex: /\bwindow\s*\.\s*print\b/g, messageId: 'plateforme' },
  { regex: /\bnew\s+Notification\b/g, messageId: 'plateforme' },
  { regex: /\bNotification\s*\.\s*(requestPermission|permission)\b/g, messageId: 'plateforme' },
  { regex: /\b(localStorage|sessionStorage)\b/g, messageId: 'plateforme' },
  { regex: /\bindexedDB\b/g, messageId: 'plateforme' },
  { regex: /\b(USBDevice|BluetoothDevice|MediaDevices|MediaStream)\b/g, messageId: 'plateforme' },
  { regex: /\bcaches\s*\./g, messageId: 'plateforme' },
]

/* ═══════════════════════════════════════════════════════════════════════════
   (c) · AUCUNE VALEUR LITTÉRALE HORS DES JETONS
   ═══════════════════════════════════════════════════════════════════════════
   « Aucune couleur ni espacement littéral hors des tokens » (principe 8) et
   « tout style s'exprime en utilitaires du noyau référençant les tokens de
   @theme » (principe 12).

   TROIS EXEMPTIONS, et chacune est écrite dans un document :
     — `max-w-[…]`, `min-w-[…]`, `w-[…]`, `min-h-[…]` : tokens.md §7 —
       « les largeurs de gabarit sont des décisions de mise en page, pas des
       tokens » ;
     — `border-[1.5px]` : tokens.md §7 — Tailwind 4 n'a pas d'espace de nom pour
       les épaisseurs de bordure, c'est la décision n° 1 du README de design ;
     — `[clip-path:…]`, `[&…]`, `[data-…]`, `[--…]` : ce ne sont pas des valeurs,
       ce sont des sélecteurs et des propriétés que Tailwind n'expose pas ;
     — `transition-[…]` : la LISTE DES PROPRIÉTÉS qui transitionnent, et non une
       valeur. `composants.md` §01 l'écrit littéralement —
       `transition-[transform,box-shadow,background-color]`. La durée et la
       courbe, elles, restent des jetons et restent contrôlées. */
const EXEMPTIONS_ARBITRAIRES =
  /^(?:(?:max-w|min-w|min-h|w)-\[|border-\[1\.5px\]|transition-\[|\[clip-path:|\[&|\[data-|\[--)/

const MOTIFS_JETONS = [
  // Une couleur écrite en clair, sous toutes ses formes.
  { regex: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b/g, messageId: 'couleur' },
  { regex: /\b(?:rgba?|hsla?|oklch|color-mix)\s*\(/g, messageId: 'couleur' },
  // Un style en ligne STATIQUE. La liaison `:style` reste permise : la barre de
  // proportion porte un pourcentage, qui n'est pas une valeur de jeton.
  { regex: /\sstyle\s*=\s*"[^"]*[0-9#][^"]*"/g, messageId: 'styleEnLigne' },
  // Une durée ou une courbe écrite en clair, hors des quatre jetons.
  { regex: /\b\d+(?:\.\d+)?m?s\b(?!\s*\*\/)/g, messageId: 'duree' },
  { regex: /\bcubic-bezier\s*\(/g, messageId: 'courbe' },
]

/** Les valeurs arbitraires de Tailwind : `bg-[…]`, `duration-[…]`, `p-[…]`… */
const MOTIF_ARBITRAIRE = /\b[a-z][a-z0-9:-]*-?\[[^\]\s]+\]/g

/* ═══════════════════════════════════════════════════════════════════════════
   (d) · UNE PAGE A UNE SEULE RACINE, ET C'EST UN ÉLÉMENT
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ AUCUNE RÈGLE INSTALLÉE NE COUVRE LE CAS, et c'est exactement ce que
   research.md §5 annonçait en refusant qu'on cite un identifiant de mémoire. Le
   constat, fait en exécutant eslint-plugin-vue 10.10.0 :

     — `vue/no-root-v-if` ne signale QUE le `v-if` de racine SANS `v-else`. Son
       message le dit : « v-if should not be used on root element WITHOUT
       v-else ». Le cas de FR-036 — un `v-if`/`v-else` de premier niveau — le
       traverse sans un mot ;
     — `vue/no-multiple-template-root` compte une chaîne `v-if`/`v-else` comme
       UNE racine, puisque les branches sont exclusives. Elle ne dit rien non
       plus.

   Les deux règles amont restent activées : elles attrapent les cas voisins. Mais
   la propriété que le cycle doit tenir s'écrit ici.

   CE QU'ELLE REFUSE, ET CE QUE ÇA COÛTE : une racine conditionnelle est
   DÉMONTÉE à chaque changement d'état. Le gabarit se reconstruit, donc le témoin
   de synchronisation et le sélecteur d'établissement clignotent — deux
   composants « présents partout » —, et la transition d'écran perd son ancrage. */
function racinesDuGabarit(elementTemplate) {
  return elementTemplate.children.filter(
    (enfant) =>
      enfant.type === 'VElement' ||
      enfant.type === 'VExpressionContainer' ||
      (enfant.type === 'VText' && enfant.value.trim() !== ''),
  )
}

function directiveDeCondition(element) {
  if (element.type !== 'VElement') return null
  for (const attribut of element.startTag.attributes) {
    if (!attribut.directive) continue
    const nom = attribut.key.name?.name
    if (nom === 'if' || nom === 'else' || nom === 'else-if') return `v-${nom}`
  }
  return null
}

export default {
  meta: { name: 'kaya' },
  rules: {
    'racine-de-page-stable': {
      meta: {
        type: 'problem',
        docs: {
          description:
            "exige qu'une page ou un gabarit ait une racine unique, qui soit un élément et qui ne se démonte pas",
        },
        schema: [],
        messages: {
          conditionnelle:
            "La racine porte « {{objet}} » : elle se DÉMONTE à chaque changement d'état. Le témoin et le sélecteur d'établissement clignoteraient, et la transition d'écran perdrait son ancrage. Mettez la condition à l'intérieur.",
          plusieurs:
            'Le gabarit a {{objet}} racines. Une page et un gabarit en ont UNE SEULE, pour que la racine reste stable à la navigation.',
          pasUnElement:
            "La racine du gabarit n'est pas un élément. Un texte ou une interpolation en racine ne peut porter ni classe de thème, ni zone de mouvement.",
        },
      },
      create(context) {
        const services = context.sourceCode.parserServices
        if (!services?.defineTemplateBodyVisitor) return {}
        return services.defineTemplateBodyVisitor({
          "VElement[name='template']"(node) {
            if (node.parent.type !== 'VDocumentFragment') return
            const racines = racinesDuGabarit(node)
            if (racines.length === 0) return

            // ⚠️ LA CONDITION SE SIGNALE AVANT LE DÉCOMPTE, et l'ordre a été
            // corrigé après l'avoir constaté : un `v-if`/`v-else` de premier
            // niveau donne DEUX racines, donc la règle rendait « le gabarit a 2
            // racines » — vrai, et à côté de la vraie cause. Le développeur
            // aurait enveloppé les deux branches sans comprendre que le défaut
            // était le démontage.
            for (const racine of racines) {
              const condition = directiveDeCondition(racine)
              if (condition) {
                context.report({
                  node: racine.startTag,
                  messageId: 'conditionnelle',
                  data: { objet: condition },
                })
                return
              }
            }

            if (racines.length > 1) {
              context.report({
                node: racines[1],
                messageId: 'plusieurs',
                data: { objet: String(racines.length) },
              })
              return
            }
            if (racines[0].type !== 'VElement') {
              context.report({ node: racines[0], messageId: 'pasUnElement' })
            }
          },
        })
      },
    },

    'aucune-api-de-plateforme': {
      meta: {
        type: 'problem',
        docs: {
          description:
            "refuse toute API de plateforme hors de app/core/plateforme/ et app/core/file/",
        },
        schema: [],
        messages: {
          plateforme:
            "« {{objet}} » est une API de plateforme. Elle passe par PlatformAdapter — sans quoi le passage à Capacitor devient une réécriture (constitution, principe 7).",
        },
      },
      create(context) {
        return {
          Program() {
            signaler(context, context.sourceCode.text, MOTIFS_PLATEFORME)
          },
        }
      },
    },

    'aucune-valeur-hors-jetons': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'refuse toute valeur littérale de couleur, espacement, rayon, durée ou courbe',
        },
        schema: [],
        messages: {
          couleur:
            "« {{objet}} » est une couleur littérale. Les couleurs vivent dans docs/design/tokens.md et s'écrivent en utilitaires (bg-prim, text-ink…).",
          duree:
            "« {{objet}} » est une durée littérale. Les quatre durées sont des jetons : duration-90, duration-160, duration-240, duration-400.",
          courbe:
            "« {{objet}} » est une courbe littérale. Les quatre courbes sont des jetons : ease-entree, ease-sortie, ease-deplace, ease-elastique.",
          styleEnLigne:
            'Un style en ligne statique porte une valeur hors des jetons. La liaison :style reste permise pour ce qui est calculé.',
          arbitraire:
            "« {{objet}} » est une valeur arbitraire de Tailwind. Elle contourne les jetons de @theme ; seules les largeurs de gabarit et border-[1.5px] sont exemptées (tokens.md §7).",
        },
      },
      create(context) {
        return {
          Program() {
            const texte = context.sourceCode.text
            signaler(context, texte, MOTIFS_JETONS)

            const masque = masquerCommentaires(texte)
            for (const trouve of masque.matchAll(MOTIF_ARBITRAIRE)) {
              const utilitaire = trouve[0]
              // On ne juge que ce qui apparaît dans un attribut de classe : un
              // `Record<string, X[]>` en TypeScript n'est pas un utilitaire.
              const contexteAvant = masque.slice(Math.max(0, trouve.index - 400), trouve.index)
              const dansUneClasse = /(?:class|:class|classe)\s*=\s*["'{][^"']*$/.test(contexteAvant)
              if (!dansUneClasse) continue
              const sansVariante = utilitaire.replace(/^(?:[a-z-]+:)+/, '')
              if (EXEMPTIONS_ARBITRAIRES.test(sansVariante)) continue
              context.report({
                loc: context.sourceCode.getLocFromIndex(trouve.index),
                messageId: 'arbitraire',
                data: { objet: utilitaire },
              })
            }
          },
        }
      },
    },
  },
}
