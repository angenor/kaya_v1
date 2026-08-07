# Kaya — Lexique du vocabulaire utilisateur

*Source de vérité du vocabulaire visible par l'utilisateur. Extrait de `docs/Kaya_Design.md` §6
le 2026-07-30 — ce fichier fait foi, `Kaya_Design.md` y renvoie.*

**Version 1.7.0** — le vocabulaire du cycle PDV : la **commande**, la **ligne**, l'**addition**,
l'**article**, la **destination**, l'**envoi en préparation**, la **remise**, la **part**, le **bon
de dépôt**, la **pièce**, le **numéro de retrait**, et les **onze refus** que le cycle produit.
Ajoutée le 2026-08-05, **avant le code**.

Trois points méritent d'être lus plutôt que survolés :

- **« Cible de facturation » est proscrit du visible, et c'est l'entrée la plus utile du lot.**
  C'est le mot du modèle, et il n'a aucun équivalent naturel — parce qu'il n'en a pas besoin :
  l'utilisateur ne choisit pas une cible, il dit **« sur la table »**, **« sur la chambre »**,
  **« au comptoir »**, **« à emporter »**. Quatre libellés qui se passent du concept qui les
  regroupe.
- **Un seul objet porte deux mots selon le moment** : on *prend une commande*, on *demande
  l'addition*. Ce n'est pas une synonymie approximative, c'est ce que dit le personnel — et coder
  « commande » partout ferait dire à Aminata « voici votre commande » en tendant le total.
- **Deux refus portent leur versant positif dans la phrase elle-même**, et il est obligatoire :
  l'ouverture de table hors ligne dit *« saisissez au comptoir »*, la ligne déjà envoyée dit
  *« annulez-la avec un motif »*. C'est l'exigence 4 de la section « Couverture des portes »
  appliquée à l'interface — « la table 6 n'est pas ouverte » est vrai et inutile à quelqu'un
  debout avec un plateau.

**Version 1.6.0** — le vocabulaire du cycle SEJ : le **séjour**, l'**arrivée**, le **départ**, le
**client**, l'**accompagnant**, la **fiche de police**, la **note arrêtée**, et les **six refus**
que le cycle produit. Ajoutée le 2026-08-03, **avant le code**.

Trois points méritent d'être lus plutôt que survolés :

- **Six mots sont écartés nommément** — « check-in », « check-out », « occupation », « constat »,
  « assiette » et « figeage ». Les deux premiers sont de l'anglais de métier que le personnel de
  Deloria n'emploie pas ; les quatre autres sont les mots de la table, de la ligne de code et du
  formulaire fiscal. **Aucun n'atteint l'interface, et aucun n'atteint une route** : les quatre
  routes du cycle sont `/passage`, `/arrivee`, `/clients` et `/depart`. C'est la leçon `S1` du
  cycle SYN appliquée avant d'avoir à la réapprendre — *le nom du fichier de page décide de la
  route, et une URL est visible*.
- **« Fiche de police » est conservé tel quel**, et c'est une décision, pas un oubli. Le terme est
  celui de l'usage ivoirien : c'est ce que l'exploitant lit sur ses propres registres et ce que la
  gendarmerie lui demande. Le reformuler le rendrait méconnaissable — même raisonnement que
  « classement » et « NCC », règle 2 ci-dessous.
- **Deux formulations partent à l'atelier terrain et le disent.** La bascule de formule annonce un
  changement de tarif **avant** confirmation ; l'écriture orpheline décrit une situation qu'aucun
  exploitant n'a encore vue. Les deux sont marquées ⚠️ dans le tableau.

**Version 1.5.1** — complément des cinq entrées ci-dessous, trouvé à l'analyse de cohérence du
cycle SYN, le 2026-08-02. Trois manques, chacun réel :

- **la dérive d'horloge n'avait qu'un sens.** La phrase disait « retarde de {n} minutes », alors que
  la détection porte sur la **valeur absolue** de l'écart (SYN-04) : une horloge **en avance** — le
  cas du scénario de recette — n'avait aucune formulation, donc la moitié des cas était muette ;
- **les formulations anglaises manquaient** aux cinq libellés nouveaux, alors que le reste du
  document en donne ;
- **le titre de `S1` ne disait rien de sa route.** « Synchronisation » est proscrit du visible, et
  une URL est visible : le mot serait rentré par la porte du nom de fichier.

**Version 1.5.0** — le vocabulaire du cycle SYN : les **quatre formulations** que le témoin et le
panneau d'envoi réclamaient — connexion faible, saisie refusée, dérive d'horloge, titre de `S1` —
et la **confirmation que le lexique prime sur `app/core/i18n`**, qui avait dérivé sur les trois
libellés du témoin. Ajoutée le 2026-08-02.

**Version 1.4.0** — le vocabulaire du cycle HEB : la **formule**, le **type de chambre**, les cinq
refus du moteur de disponibilité, et le choix fiscal que l'exploitant fait à l'écran. Le mot
« formule » était déjà sur la maquette `G2` — « Vos formules », « Ajouter une formule » — et absent
d'ici : il est inscrit avant d'être codé. Six mots sont écartés nommément — « unité louable »,
« catégorie d'unité », « occupation », « intervalle », « palier » et « exclusion » —, et l'entrée
la plus délicate du cycle est celle du choix fiscal : **ses deux formulations ne disent rien des
personnes**, ce qui est précisément ce qui les rend employables alors que l'axe « par client » de
la taxe de séjour n'est pas tranché (B-10 du cadrage, échéance avant le cycle SEJ).

**Version 1.3.0** — deux entrées pour le geste qui manquait au produit : **quitter son poste**.
`fermerSession()` existait depuis le cycle CPT sans aucun appelant — il n'y avait, littéralement,
aucun moyen de sortir de sa session. Le mot retenu n'est pas « se déconnecter » : sur un terminal
partagé, l'appareil ne bouge pas, c'est la personne qui change, et le journal d'audit du §8.3 —
« ce que le propriétaire achète » — devient faux dès que Yao travaille sous le nom d'Aminata. Le
libellé nomme donc le geste réel, **passer la main**, et la seconde entrée porte son unique refus.

**Version 1.2.0** — le vocabulaire du cycle CPT : compte, personne, appareil connecté, registre des
actions, et **la phrase unique des deux échecs d'authentification**. Quatre mots y sont écartés
nommément — « rôle », « permission », « jeton » et « JWT » —, et l'entrée la plus contraignante du
lexique y apparaît : une phrase qui doit rester **la même** dans deux situations différentes, sans
quoi l'interface publie la liste des comptes existants.

**Version 1.1.0** — cinq entrées ajoutées avec la couche d'écriture d'ETB-02 : l'ajout et le retrait
d'un service, les deux refus qu'ils produisent, et la règle « le `message` de diagnostic n'apparaît
jamais ». Deux d'entre elles écartent un mot faux plutôt qu'un mot technique — « désactiver » décrit
un interrupteur, « supprimer » serait **faux**.

---

Le produit manipule des concepts fiscaux et techniques réels. L'utilisateur ne doit jamais les rencontrer sous leur nom d'origine.

| Concept interne | Ce qu'affiche l'interface |
|---|---|
| Certification FNE | « Envoi aux impôts » / « Validée par les impôts » |
| Document en état `SOUMISE` | « Envoi en cours… » |
| Document en état `INDETERMINEE` | « Nous ne savons pas si les impôts ont reçu cette facture » |
| Document en état `ECHEC` | « Les impôts ont refusé cette facture » + motif en clair |
| Stickers FNE restants | « Factures restantes » avec le nombre |
| Idempotence, rejeu, file d'attente | **N'apparaît jamais.** L'utilisateur voit « en attente d'envoi » et un nombre |
| Écriture orpheline, réconciliation | « Une consommation est arrivée après la facture » |
| Classe hors-ligne A/B/C/D | **N'apparaît jamais.** L'utilisateur voit « disponible hors connexion » ou « nécessite internet » |
| Taxe communale de nuitée | « Taxe de séjour (mairie) » — le nom légal reste sur la facture |
| Rebascule de palier de passage | « Durée dépassée : passé au tarif 4 h » |
| Temps de remise en état | « Chambre indisponible 30 min (ménage) » |
| Tenant, établissement | « Votre établissement » — le mot « tenant » n'existe pas pour l'utilisateur |
| Module d'activité | « Vos services » |
| Activation d'un module (`PUT … actif: true`) | « **Ajouter un service** » / *Add a service* — jamais « activer », qui décrit un interrupteur technique là où l'exploitant ajoute quelque chose à ce qu'il propose |
| Désactivation d'un module (`PUT … actif: false`) | « **Retirer** » / *Remove* — jamais « désactiver » (même motif), et **jamais « supprimer »**, qui serait faux : la désactivation ne supprime rien, et la réactivation restitue tout. La phrase de confirmation le dit : « Rien n'a été supprimé : vous pourrez le remettre » |
| `desactivation_bloquee` | « **Ce service est encore en cours d'utilisation.** » + ce qui l'occupe, compté. Jamais « obstacle », qui est le mot du trait `ObstacleDesactivation` |
| `module_non_implemente` | « **Ce service n'est pas encore disponible.** » — le référentiel le connaît, le produit ne le sert pas encore. À distinguer de « ce service n'existe pas » (`module_inconnu`) |
| Code d'erreur HTTP, `message` de diagnostic | **N'apparaît jamais.** L'interface branche sa clé i18n sur le `code`, jamais sur le `message` — qui nomme des tables et parle anglais technique |
| Unité louable | « Chambre » en hôtel, « logement » en résidence, « salle » pour la réunion — selon le contexte |
| RBAC, permissions | « Ce que chacun peut faire » |
| Synchronisation | « Enregistré » / *Saved* · « En attente d'envoi (4) » / *Pending send (4)* · « Hors connexion » / *No connection* — **ces trois libellés font foi ; `app/core/i18n` disait « Connecté », « Hors ligne », « {n} éléments en attente », ce qui décrit le RÉSEAU au lieu de dire ce qui compte pour Aminata : son travail est-il en sécurité** |
| Réseau **dégradé** (le mot n'apparaît jamais) | « **Connexion faible** » / *Weak connection* — le réseau répond mal, les envois partent lentement. « Dégradé » est un terme d'ingénieur ; « faible » est ce qu'on dit spontanément d'un réseau qui rame |
| Écriture **définitivement refusée** par le serveur | « **Cette saisie a été refusée** » / *This entry was refused* **suivi du motif en clair et de ce qui reste possible.** Même patron que l'échec de certification : on dit qui refuse et pourquoi, jamais « erreur » seul. Ne jamais employer « rejet », « échec de synchronisation » ni un code |
| **Dérive d'horloge** au-delà du seuil | **Deux formes, une par sens** — « **L'heure de cet appareil retarde de {n} minutes.** » / *This device's clock is {n} minutes behind.* ou « **L'heure de cet appareil avance de {n} minutes.** » / *This device's clock is {n} minutes ahead.*, suivies **dans les deux cas** de « **Les durées et les montants restent calculés sur l'heure du serveur.** » / *Durations and amounts are still calculated from the server's time.* — **la seconde phrase est obligatoire** : sans elle, l'exploitant croira ses passages mal facturés, alors que l'horodatage d'autorité les protège (principe IV). **Les deux sens sont dus** : la détection porte sur la **valeur absolue** de l'écart (SYN-04), et une horloge en avance est aussi fausse qu'une horloge en retard — une seule forme laisserait la moitié des cas sans phrase |
| Titre de l'écran `S1` — panneau de synchronisation | « **Mes envois** » / *My uploads* — jamais « Synchronisation », le mot est proscrit par la ligne ci-dessus. Court, possessif : c'est son travail qui est en jeu, pas un mécanisme. **La route de la page suit le titre** (`/mes-envois`) : une URL est visible dans la barre d'adresse, et le mot proscrit ne s'y invite pas par la porte du nom de fichier |
| Attestation d'intégrité, enrôlement | « Téléphones autorisés » |
| `note_etablissement` | « **Note interne** » / *Internal note* — jamais « note d'établissement » : le §6 pose déjà que l'utilisateur est toujours dans le sien, le mot serait superflu sur un bouton |
| `capacite` | **N'apparaît jamais.** Le mot est un terme d'architecture — il nomme le transverse (stock, livraison, fidélité) par opposition au module d'activité. L'utilisateur ne voit que la **capacité concrète**, sous le service qui la consomme |
| `STOCK` (capacité) | « **Suivi du stock** » / *Stock tracking* — affiché sous le service qui le consomme, jamais comme une rubrique à part |
| `point_de_vente` | « **Point de vente** » / *Point of sale* |
| `point_de_vente` sans `table_pdv` | « **Comptoir** » / *Counter* — l'absence de tables **est** le comptoir. Jamais « point de vente sans tables », qui décrit un manque là où il s'agit d'une forme normale |
| Valeur héritée d'un niveau supérieur | « **Vaut pour tous vos établissements** » / *Applies to all your establishments* — jamais « hérité », « valeur par défaut » ni « niveau tenant » |
| Valeur surchargée au niveau courant | « **Modifié ici** » / *Changed here* — jamais « surcharge », « override » ni « exception » |
| `compte` | « **Compte** » / *Account* — ce avec quoi on se connecte. Distinct de la personne : une femme de ménage a une fiche et pas de compte, un comptable externe a un compte et pas de contrat |
| `personne` | « **Personne** » / *Person* — l'identité civile. Jamais « utilisateur », qui suppose un compte, ni « employé », qui suppose un contrat |
| `employe` | « **Employé** » / *Employee* — **n'apparaît nulle part au MVP**. La table est une provision (CPT-05) sans écran ; l'entrée est ici pour que le mot ne soit pas employé à la place de « personne » |
| `role`, `compte_role`, `permission` | « **Ce que chacun peut faire** » — règle déjà posée pour le RBAC. **Les mots « rôle » et « permission » n'atteignent jamais l'interface** : on montre ce qui est possible, pas la mécanique qui l'autorise |
| `journal_audit` | « **Registre des actions** » / *Activity log* — jamais « journal d'audit », qui est le nom technique et sonne comme une inspection. C'est ce que le propriétaire consulte pour savoir qui a fait quoi |
| Session, jeton d'accès, jeton de rafraîchissement, JWT | **N'apparaît jamais.** L'utilisateur voit un « **appareil connecté** » ; les quatre mots sont de la mécanique interne |
| Une session de la liste | « **Appareil connecté** » / *Connected device* — avec l'appareil, la première connexion et la dernière activité. Jamais « session » |
| Révocation d'une session | « **Déconnecter cet appareil** » / *Disconnect this device* — jamais « révoquer », qui est le mot du jeton. La phrase de confirmation dit l'effet : « Cet appareil devra se reconnecter » |
| Fermeture de **sa propre** session sur le terminal qu'on a sous la main (`DELETE /api/v1/session`) | « **Passer la main** » / *Hand over* — jamais « Se déconnecter », qui décrit la rupture d'un lien technique là où le geste réel est **de rendre le poste au suivant**. Au comptoir de Deloria, l'appareil ne bouge pas : c'est la personne qui change. L'infobulle dit l'effet : « **La personne suivante devra entrer son identifiant.** » / *The next person will have to enter their ID.* — jamais « votre session sera fermée », ni « vous serez déconnecté ». À ne pas confondre avec « Déconnecter cet appareil » ci-dessus : celui-là coupe un **autre** appareil, à distance, depuis la liste ; celui-ci rend **celui-là même** qu'on tient |
| Refus de passer la main, file d'envoi non vide | « **Des enregistrements ne sont pas encore partis.** Attendez le retour du réseau avant de passer la main. » / *Some entries haven’t been sent yet. Wait for the network before handing over.* — le mot « file » n'apparaît pas (règle déjà posée pour l'idempotence et le rejeu), et le refus est **immédiat**, jamais un échec après coup |
| `identifiants_invalides` (401) | « **Identifiant ou mot de passe incorrect** » / *Incorrect ID or password* — **une seule phrase, employée dans les deux cas** : compte inconnu et mot de passe faux. Deux phrases distinctes publieraient la liste des comptes existants (FR-012). C'est aussi pourquoi le compte désactivé et le dépassement de tentatives rendent **cette même phrase** |
| `session_invalide` (401) | « **Votre session a expiré. Reconnectez-vous.** » / *Your session has expired. Please sign in again.* |
| `mot_de_passe_refuse` (422) | Deux phrases distinctes, parce que l'utilisateur doit savoir quoi corriger : « **Choisissez un mot de passe d'au moins 8 caractères.** » ou « **Ce mot de passe est trop courant. Choisissez-en un autre.** » Jamais « compromis » ni « figurant dans une fuite », qui alarment sans instruire |
| `identifiant_refuse` (422) | « **Cet identifiant ne peut pas être utilisé.** » / *This ID cannot be used.* — **ne dit pas qu'il existe déjà**, ce qui reviendrait à confirmer un compte |
| `identifiant_absent` (422) | « **Indiquez un numéro de téléphone ou une adresse e-mail.** » |
| `portee_incompatible` (422) | « **Choisissez l'établissement concerné.** » — ou, pour l'administrateur éditeur, « **Ce compte agit sur tous les établissements.** » Jamais « portée », qui est le mot de la colonne |
| `derniere_habilitation` (409) | « **Il doit rester au moins une personne pouvant gérer les accès de cet établissement.** » — jamais « dernière habilitation » |
| `permission_absente` (403) | **Ne devrait jamais s'afficher** : sans le droit, l'action est **absente** de l'écran (FR-026). La phrase existe pour l'appel direct : « **Cette action ne vous est pas accessible.** » |
| Refus hors ligne d'une opération de classe C | Réemploi exact de la formulation d'ETB-02 : « **Cette action nécessite internet.** » / *This action requires an internet connection.* — annoncée **avant** la saisie, jamais après un échec |
| `methode_non_implementee` (422) | « **Ce compte se connecte autrement.** » — `OTP_SMS` est au référentiel et n'est pas servi ; jamais « méthode non implémentée » |
| `formule` | « **Formule** » / *Rate plan* — ce qu'on vend sur un type de chambre : la nuitée, le passage, la demi-journée, le mois. Le mot est sur la maquette `G2` (« Vos formules », « Ajouter une formule ») et manquait ici. Jamais « tarif », qui ne désigne que le prix, ni « produit » ni « offre », qui sont les mots du catalogue |
| `categorie` (d'unité louable) | « **Type de chambre** » / *Room type* — « type de logement » en résidence, « type de salle » pour la réunion, selon le même contexte que l'entrée « Unité louable ». **Jamais « catégorie d'unité »**, qui est le nom de la table : il colle deux mots techniques dont l'un — « unité » — est déjà écarté ci-dessus |
| `occupation`, `intervalle`, `palier`, contrainte d'`exclusion` | **N'apparaît jamais.** Ce sont les mots de la table, de la période, du barème et de la garantie de base. L'utilisateur voit « chambre prise », « du … au … », « à partir de 4 h » et « déjà prise sur cette période » |
| `unite_deja_occupee` (409) | « **Cette chambre est déjà prise sur cette période.** » / *This room is already taken for this period.* — jamais « conflit », « chevauchement » ni « violation de contrainte », qui nomment la mécanique. Le refus vient de la base ; ce que l'utilisateur en lit est un fait d'exploitation |
| `formule_hors_categorie` (422) | « **Cette formule ne s'applique pas à cette chambre.** » / *This rate plan does not apply to this room.* |
| `plage_non_fractionnable` (422) | « **Une demi-journée se loue en entier : 8 h – 12 h ou 13 h – 16 h.** » / *A half-day is booked in full: 8 a.m. – 12 p.m. or 1 p.m. – 4 p.m.* — les deux plages sont **celles de l'établissement**, jamais écrites en dur : la phrase les reçoit. Jamais « non fractionnable », qui est le mot du code |
| `intervalle_invalide` (422) | « **La fin doit être après le début.** » / *The end must be after the start.* |
| `duree_hors_contrainte` (422) | « **Cette formule se loue de 1 h à 8 h.** » / *This rate plan is booked from 1 to 8 hours.* — les deux bornes viennent de la formule, jamais d'une constante |
| `formule.assujettie_taxe_nuitee` | « **Taxe de séjour comprise dans le prix** » quand elle vaut vrai, « **Pas de taxe de séjour sur cette formule** » sinon — les deux mentions exactes de la maquette `G2`. Jamais « assujettie », qui est le mot du formulaire fiscal |
| `regle_conversion_taxe = une_nuitee_par_occupation` | « **Une seule taxe pour tout le séjour** » / *One tax for the whole stay* — **formulation validée au terrain le 2026-08-02**. Ni « conversion », ni « règle », ni le nom de l'énumération n'atteignent l'interface |
| `regle_conversion_taxe = au_prorata` | « **Une taxe par nuit** » / *One tax per night* — même validation. ⛔ **Ces deux formulations ne disent rien des personnes**, et c'est ce qui les rend employables aujourd'hui : la taxe est due **par nuitée et par séjour** (cadrage §9.6, décision **B-10** close le 2026-08-03). Elles tranchent l'axe des nuits, rien d'autre — et c'est encore vrai après B-10, qui tranche l'axe des personnes sans toucher à celui des nuits |
| `sejour` | « **Séjour** » / *Stay* — le passage d'un client dans l'établissement, de l'arrivée au départ, **quelle qu'en soit la durée** : deux heures de passage sont un séjour autant que trois nuits. Jamais « dossier », qui évoque un classeur, ni « réservation », qui suppose un engagement pris d'avance |
| check-in (le mot **est écarté**) | « **Arrivée** » / *Arrival* — le geste de recevoir le client et de lui donner la clé. ⛔ **« Check-in » n'atteint ni l'interface ni une route** : c'est de l'anglais de métier hôtelier que le personnel de Deloria n'emploie pas. Les routes sont `/arrivee` pour le parcours long et `/passage` pour le court |
| check-out (le mot **est écarté**) | « **Départ** » / *Departure* — le geste de rendre la chambre et d'arrêter la note. ⛔ Même motif, même conséquence : la route est `/depart` |
| `client` | « **Client** » / *Guest* — la personne qui séjourne. Distinct de « personne » (l'identité civile, qui couvre aussi le personnel) : un client est une personne **qualifiée cliente**. C'est ce qui fait que chercher « Kouamé » à la réception ne montre jamais la femme de ménage. La route est `/clients` |
| `accompagnant` | « **Accompagnant** » / *Additional guest* — une personne qui séjourne **avec** le client, sans fiche à elle. Un nom suffit à l'ajouter : demander une pièce par accompagnant coûterait la cible des 60 secondes de l'arrivée. Jamais « occupant » ni « co-client » |
| `fiche_police` | « **Fiche de police** » / *Police registration form* — **le terme de l'usage ivoirien est conservé**, comme « classement » et « NCC » : c'est ce que l'exploitant lit sur ses propres registres et ce que la gendarmerie lui demande. Le reformuler le rendrait méconnaissable. Elle porte, comme la note, la mention « Document non fiscal — ne tient pas lieu de facture » |
| Fiche de police sans identité rattachée (`complete = false`) | « **Identité à compléter** » / *Identity to be completed* — la fiche **existe et est numérotée**, elle n'est pas encore complète. Jamais « incomplète » seul, qui sonne comme un défaut de saisie là où c'est le parcours normal du passage : la pièce vient **après** la clé |
| `note_sejour` en statut `arretee` | « **La note est arrêtée : plus rien ne peut s'y ajouter** » / *The bill is closed: nothing more can be added to it* — chaîne exacte de la maquette `R7`. Jamais « clôturée », « figée » ni « verrouillée », qui sont les mots de la ligne de code |
| `taxe_sejour_constat`, `constat`, `assiette`, `figeage` | **N'apparaît jamais.** Ce sont les mots de la table, du formulaire fiscal et de la ligne de code. L'utilisateur voit « Taxe de séjour (mairie) » sur la note, et rien du mécanisme qui la fixe au départ |
| `sejour_deja_clos` (409) | « **Ce séjour est déjà terminé.** » / *This stay has already ended.* — au départ d'un séjour clos. Jamais « déjà clos », qui est le mot du statut |
| `sejour_clos` (409, à la prolongation) | « **On ne prolonge pas un séjour terminé.** » / *A stay that has ended cannot be extended.* — la phrase dit **la règle**, pas l'état : c'est ce qui évite qu'Adjoua cherche comment « rouvrir » le séjour |
| `conflit_occupation_suivante` (409) | « **Cette chambre est réservée à partir de {heure}.** » / *This room is booked from {time}.* — **suivie des chambres libres de la même catégorie**. ⛔ Un message générique est un défaut (FR-070) : c'est la différence entre un refus qu'Adjoua peut expliquer au client et un refus qu'elle contournera. L'heure vient de l'occupation suivante, jamais d'une constante |
| `unite_cible_occupee` (409) | « **Cette chambre n'est pas libre sur la période restante.** » / *This room is not free for the remaining period.* — au changement de chambre. Distincte de `unite_deja_occupee` ci-dessus, qui porte sur une **période demandée** ; celle-ci porte sur **ce qui reste du séjour en cours** |
| `bascule_formule_non_confirmee` (422) | ⚠️ **À valider à l'atelier terrain** — « **Au-delà de {n} h, le tarif passe à la nuitée.** » / *Beyond {n} hours, the rate changes to the nightly rate.* suivie du montant résultant et de la confirmation à donner. La phrase **annonce un changement de tarif avant qu'il ne s'applique** : c'est sa raison d'être (FR-073) et c'est ce qui la rend délicate à formuler — trop sèche, elle ressemble à un refus ; trop douce, elle passe inaperçue. Le seuil `{n}` vient de la formule, jamais d'une constante |
| Écriture arrivée après le départ (`202`, réconciliation) | ⚠️ **À valider à l'atelier terrain** — « **Cette information est arrivée après le départ du client.** » / *This information arrived after the guest checked out.* suivie de « **Le gérant décidera de la suite.** » / *The manager will decide what to do next.* — **la seconde phrase est obligatoire** : sans elle, Adjoua ne sait pas si son geste a compté. ⛔ Ni « rejeté » (ce serait faux, l'information est conservée), ni « enregistré » (ce serait faux aussi, elle n'est pas sur le séjour), et **jamais « file de réconciliation »**, qui est le nom de la table. Formulation délicate parce qu'elle décrit une situation **qu'aucun exploitant n'a encore vue** |

| `commande` | « **Commande** » / *Order* — ce qu'un client demande, du premier article au règlement. Jamais « ticket », qui est le papier, ni « vente », qui est le mot de la comptabilité |
| `ligne_commande` | « **Ligne** » / *Item* — un article et sa quantité dans une commande. Sur l'écran, la ligne se nomme par ce qu'elle porte (« 2 × Poulet braisé ») ; le mot « ligne » n'apparaît que dans les actions qui la visent |
| `commande` en attente d'encaissement | « **Addition** » / *Bill* — la même chose vue du côté du paiement. **Un seul objet, deux mots selon le moment** : on *prend une commande*, on *demande l'addition*. Jamais « note », réservé au séjour (`R7`), ni « facture », qui est le document fiscal |
| `article` | « **Article** » / *Item* — ce qui se vend : un plat, une bière, une prestation de pressing. Le mot est sur la maquette `P2` (« Chercher un article », « 7 articles dans Bières ») et il décide de la route, `/articles`. Jamais « produit », ni « catalogue » — qui est le mot de la table |
| `categorie_article` | « **Catégorie** » / *Category* — le regroupement visible sur l'écran de vente : « Bières », « Grillades ». **L'ordre choisi est celui de l'écran**, ce que l'exploitant règle lui-même. Jamais « catégorie d'affichage », qui décrit le mécanisme |
| `commande.cible` — **le terme technique est PROSCRIT** | ⛔ **« Cible de facturation » n'atteint jamais l'interface.** C'est le mot du modèle. L'utilisateur voit quatre choix qui se disent tout seuls : « **Sur la table** » / *On the table* · « **Sur la chambre** » / *On the room* · « **Au comptoir** » / *At the counter* · « **À emporter** » / *Takeaway*. Aucun libellé n'emploie « cible », « facturation » ni « imputation » |
| `destination_preparation` | « **Destination** » / *Destination* — où part la commande pour être préparée : la cuisine, le bar, le pressing. Les noms sont **saisis par l'exploitant**, jamais une liste en dur : deux établissements ne nomment pas leurs postes pareil |
| `lot_envoi` — l'envoi en préparation | « **Envoyer la commande** » / *Send order* pour le geste, « **Bon de préparation** » / *Preparation slip* pour ce qui en sort. Un bon **par destination**, et l'écran le montre avant que ça parte. ⛔ Jamais « lot », « ticket cuisine » ni « KOT ». Le bon porte, comme la note, la mention « Document non fiscal — ne tient pas lieu de facture » |
| `ligne_commande.etat` | Trois mots, jamais les valeurs de la colonne : « **Pas encore envoyé** » / *Not sent yet* · « **Envoyé à {heure}** » / *Sent at {time}* · « **Servi** » / *Served*. **L'heure est celle du serveur** (principe IV), et elle s'écrit avec l'espace **ordinaire** — « 21 h 07 » |
| `remise` | « **Remise** » / *Discount* — ce qu'on retire du montant dû, avec son motif. ⛔ Jamais « réduction », « geste commercial » ni « ristourne ». **Le motif est obligatoire** et la remise est **un montant** : le pourcentage n'est qu'une commodité de saisie, ce qui est engagé devant le client est une somme |
| Annulation d'une ligne envoyée | « **Annuler cette ligne** » / *Cancel this item*, **suivi du motif à saisir**. La ligne annulée **reste visible**, barrée, avec son motif : c'est ce que le propriétaire achète. Jamais « supprimer », qui serait faux — rien n'est retiré |
| `part_addition` — la division | « **Partager l'addition** » / *Split the bill* pour le geste, « **Part** » / *Share* pour chacune. ⛔ Jamais « division », « fractionnement » ni « scission », qui sont les mots du code. Chaque part dit **où elle va** (au comptoir, sur une chambre, à emporter) |
| `bon_depot` | « **Bon de dépôt** » / *Drop-off slip* — ce que le client reçoit quand il laisse son linge. C'est un **contrat**, pas une vente : il porte ce qui a été déposé, ce que ça coûtera et quand ce sera prêt |
| `piece_deposee` | « **Pièce** » / *Garment* — chaque vêtement déposé, avec ce que le client en dit (« la chemise bleue ») |
| `piece_deposee.etat_constate` | « **État constaté** » / *Condition noted* — « tache sur le col », noté **à la remise du linge**, devant le client. C'est ce qui protège les deux parties, et c'est ce qu'une vente n'a pas |
| `bon_depot.numero_retrait` | « **Numéro de retrait** » / *Pickup number* — ce que le client présente pour récupérer son linge. **Sans trou dans la série** : un numéro manquant est une pièce dont personne ne sait si elle a existé |
| `bon_depot.statut` | Quatre mots, jamais les valeurs de la colonne : « **Déposé** » / *Dropped off* · « **En traitement** » / *In progress* · « **Prêt** » / *Ready* · « **Retiré** » / *Picked up* |
| `bon_depot.date_retrait_promise` dépassée | « **Promis pour {date} — en retard** » / *Promised for {date} — overdue* — **le retard se déduit de la date promise**, il n'est jamais une colonne : une colonne « en retard » se désynchronise pendant qu'on dort |
| `commande.reference_retrait` (cible « à emporter ») | « **Numéro de commande** » / *Order number* — ce qu'on appelle quand c'est prêt. Même exigence de continuité que le numéro de retrait du pressing |
| `motif_obligatoire` (422) | « **Dites pourquoi.** » / *Say why.* — trois mots, à l'impératif, parce que c'est une consigne et non un reproche. Jamais « motif obligatoire », qui est le nom du champ |
| `ligne_deja_envoyee` (409) | « **Cette ligne est partie en cuisine.** » / *This item has already gone to the kitchen.* — **suivie de ce qui reste possible** : l'annuler avec un motif. Le refus dit un fait d'exploitation, pas un état de colonne |
| `commande_arretee` (409) | « **Cette addition est arrêtée.** » / *This bill is closed.* — plus rien ne s'y ajoute. Même formulation que la note du séjour, pour la même raison : c'est le même fait |
| `table_deja_ouverte` (409) | « **Quelqu'un vient d'ouvrir cette table.** » / *Someone has just opened this table.* — jamais « conflit » ni « violation d'unicité » : deux serveurs ont visé la même table, et c'est tout ce qu'il y a à en dire |
| Refus hors ligne d'une opération sur une table | « **L'ouverture d'une table demande le réseau.** Saisissez au comptoir : vous rattacherez à la table quand le réseau revient. » / *Opening a table requires a network connection. Take the order at the counter — you can move it to the table when the connection is back.* — ⛔ **la seconde phrase est obligatoire** : *toute interdiction a un versant positif*. « La table 6 n'est pas ouverte » est vrai et inutile à quelqu'un debout avec un plateau. Annoncé **avant** la saisie, jamais après |
| `sejour_indisponible` (422) | « **Aucun client n'est logé en ce moment.** » / *No guest is currently checked in.* — ⛔ **ne s'affiche presque jamais** : sans module d'hébergement ou sans séjour en cours, le choix « Sur la chambre » est **absent** de l'écran, pas refusé (principe VII) |
| `remise_superieure_au_du` (422) | « **Une remise ne peut pas dépasser le montant.** » / *A discount cannot exceed the amount.* |
| `division_incomplete` (422) | « **Le partage ne tombe pas juste.** » / *The split doesn't add up.* — suivie de l'écart restant. Jamais « somme des parts ≠ total », qui est l'énoncé du contrôle |
| `bon_introuvable` (404) | « **Aucun dépôt à ce numéro.** » / *No drop-off with that number.* — la recherche accepte aussi le **nom** et le **téléphone** : la phrase le rappelle plutôt que de renvoyer l'utilisateur à un champ vide |
| `statut_non_atteignable` (422) | « **Ce dépôt n'en est pas là.** » / *This drop-off isn't at that stage.* — suivie de l'étape où il en est. Jamais « transition invalide », qui est le mot de l'automate |
| `reseau_perdu_en_vol` (503) | « **Ça n'est pas parti. Recommencez quand le réseau revient.** » / *It didn't go through. Try again when the connection is back.* — le cas rare où le réseau tombe **entre** la décision et l'envoi d'une opération qui l'exige. Distinct du refus annoncé avant la saisie, qui est la règle |

| Thème d'affichage | « **Thème** » / *Theme* — le réglage clair/sombre. C'est un réglage de **l'appareil**, pas de l'établissement : le poste de réception passe en sombre au coucher du soleil, le téléphone du propriétaire garde le clair. Jamais « mode », qui suppose un mode de fonctionnement du produit, ni « apparence », qui promet plus qu'un choix binaire |
| Valeurs du thème | « **Clair** » / *Light* · « **Sombre** » / *Dark* · « **Comme l'appareil** » / *Match device*. ⛔ Jamais « automatique », qui ne dit pas d'après quoi, ni « système », qui est le mot de l'ingénieur — l'exploitant a un **appareil**, pas un système |
| Langue de l'interface | « **Langue** » / *Language*, et les deux valeurs s'écrivent **dans leur propre langue** : « Français » et « English ». Un anglophone qui ne lit pas le français doit pouvoir trouver son entrée sans la comprendre. ⛔ Jamais « localisation » ni « i18n » |
| Installation de l'application | « **Installer l'application** » / *Install the app* — l'ajouter à l'écran d'accueil pour qu'elle s'ouvre seule, hors ligne, sans barre d'adresse. ⚠️ **Le cas WebKit se dit, il ne se tait pas** : sur iPhone et iPad, **aucune bannière ne se déclenche** — l'écran explique alors le geste, « **Ouvrez le menu de partage, puis « Sur l'écran d'accueil »** » / *Open the share menu, then "Add to Home Screen"*, et il ajoute ce que l'installation apporte : « **Sans installation, cet appareil ne recevra pas les alertes.** » / *Without installing, this device will not receive alerts.* ⛔ Jamais « PWA », « service worker » ni « ajouter aux favoris », qui décrit autre chose |
| Version nouvelle disponible | « **Une version nouvelle est prête.** » / *A new version is ready.* suivie de l'action « **Recharger** » / *Reload*. ⚠️ **L'interface PROPOSE, elle ne recharge pas d'office et elle ne se tait pas** : recharger sans demander ferait disparaître une saisie en cours au comptoir, se taire ferait tourner un correctif de facturation sur un appareil qui ne l'a jamais pris. ⛔ Jamais « mise à jour disponible », qui évoque un téléchargement à faire, ni « nouvelle build » |

> **Les noms des trois instruments de développement — guide de style, index des écrans,
> panneau de scénarios — N'ENTRENT PAS DANS CE LEXIQUE, et c'est une décision.** *Le lexique
> protège l'utilisateur du jargon ; il n'est pas le registre des noms d'outils.* Ces trois
> écrans ne sont jamais montrés à un exploitant : leurs routes portent un trait bas
> (`/_guide-de-style`, `/_ecrans`, `/_scenarios`) précisément pour que personne ne les
> confonde avec le produit.

**Deux termes fiscaux conservés tels quels — règle 2 ci-dessous.** `classement` (« non classé »,
« résidence meublée », le nombre d'étoiles) et **« numéro de compte contribuable (NCC) »** gardent
leur nom officiel à l'écran comme sur les documents. Ce ne sont pas des noms techniques traduits en
jargon : ce sont les termes que l'administration emploie, que l'exploitant lit sur ses propres
papiers, et qu'il reconnaîtrait mal sous une reformulation. Consigné ici explicitement pour qu'une
relecture future ne les prenne pas pour un oubli d'entrée au lexique.

**Règle** : tout nouveau concept technique visible par l'utilisateur entre **dans ce fichier**
avant d'être codé. Fait partie de la Definition of Done (`docs/user-stories-v1.md` §0.4)
et de la porte qui refuse toute chaîne visible écrite en dur.

---

## Comment ajouter une entrée

1. Le terme apparaît dans un bouton, un message, un libellé, une notification ou un document
   **non fiscal** → il lui faut une entrée ici **avant** d'être codé.
2. Le vocabulaire fiscal officiel — « facture normalisée », « taxe communale de nuitée » —
   reste sur les **documents légaux** et nulle part ailleurs. Sur un bouton, il passe par ce
   lexique.
3. Écrire la formulation telle qu'Adjoua la dirait à Abengourou, pas telle que la documentation
   technique la nomme.
4. Les deux clés i18n (`fr` puis `en`) sont créées dans le même changement — jamais de chaîne
   en dur — c'est ce que la porte du lexique vérifie.
5. **Une phrase qui doit rester identique dans deux situations se déclare comme telle.** Le cycle
   CPT en apporte la première : `identifiants_invalides`. La tentation permanente sera de la
   préciser — « ce compte n'existe pas », « mot de passe incorrect », « compte désactivé » — et
   chacune de ces précisions rend la liste des comptes lisible par qui essaie des numéros. Une
   entrée qui porte la mention « **une seule phrase** » ne se scinde pas sans rouvrir FR-012.

## Voir aussi

- `docs/design/derivation.md` — de quel motif maquetté hérite chaque écran non maquetté
- `docs/Kaya_Design.md` §5 « Les neuf règles » — dont la règle 6, « zéro jargon »
- `docs/design/composants.md` — les composants canoniques (seize au 2026-08-02)
