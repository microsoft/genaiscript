Ce glossaire fournit des définitions pour les termes utilisés dans le projet.
Chaque terme est lié à sa section correspondante dans la documentation pour une référence facile.

> Ce glossaire est généré automatiquement à partir des fichiers sources.

## Termes

* **À propos du mélange des fichiers et --vars** : Ordre des arguments CLI pour spécifier les fichiers et variables.
* **Drapeaux supplémentaires** : Drapeaux de clonage de dépôt : `--remote-branch <branche>` pour spécifier la branche, `--remote-force` pour forcer l'écrasement, `--remote-install` pour installer les dépendances après clonage.
* **Astro** : Astro est un générateur de sites statiques moderne pour construire des sites web rapides et optimisés utilisant n'importe quel framework.
* **Authentification** : Supporte les secrets via des variables d'environnement et l'authentification Microsoft Entra.
* **Azure AI Foundry** : Plateforme pour construire et déployer des modèles d'IA.
* **Azure AI Inference** : [Azure AI Inference](../../getting-started/configuration/)
* **Azure AI Search** : Moteur de recherche hybride vecteur et mot-clé.
* **Azure AI Serverless Models** : [Azure AI Serverless Models](../../getting-started/configuration/)
* **Azure Content Safety** : Service pour détecter et filtrer les contenus nuisibles dans les applications.
* **Azure OpenAI and AI services** : Permet à GenAIScript d'exécuter l'inférence de LLM dans Azure AI Foundry.
* **Azure OpenAI Serverless** : [Azure OpenAI Serverless](../../getting-started/configuration/)
* **Capacités** : Permet aux équipes, y compris les non-développeurs, de créer et déboguer des scripts JavaScript enrichis par l'IA appelant des LLMs et des modèles de base.
* **Compilation des scripts** : Exécute le compilateur TypeScript pour vérifier les erreurs dans les scripts.
* **Résolution des fichiers de configuration** : Processus par lequel GenAIScript analyse et fusionne les paramètres des fichiers de configuration.
* **Configuration** : La CLI charge les secrets depuis les variables d'environnement ou un fichier `./.env`.
* **Créer un nouveau script** : Commande pour générer un nouveau fichier de script dans le dossier `genaisrc`.
* **Débogage** : Activez la catégorie debug dans la configuration pour voir plus d'informations sur la résolution de la configuration.
* **envFile** : Spécifie le fichier d'environnement à charger pour les secrets en tant que variables d'environnement.
* **Modèles de base et LLMs** : GenAIScript supporte plusieurs LLMs et prévoit d'inclure d'autres modèles de base au-delà des modèles de langage.
* **GenAIScript** : GenAIScript est un langage de script qui fait des LLMs une partie à part entière du processus de scripting, permettant aux utilisateurs de créer, déboguer et déployer des scripts alimentés par LLM pour des tâches au-delà du code conventionnel.
* **CLI GenAIScript** : Outil en ligne de commande `genaiscript` pour exécuter des scripts hors VS Code et [automatisation](../../getting-started/automating-scripts/).
* **GPVM** : Système d'exécution pour GenAIScript intégrant le contexte dans les invites, appelant les LLMs spécifiés et extrayant les résultats.
* **Scripts d'aide** : Entrées `package.json` garantissant la génération correcte des fichiers de définition TypeScript pour les scripts.
* **include** : Motif glob pour inclure des scripts supplémentaires et permettre le partage entre projets.
* **Lancement** : Depuis la racine de l'espace de travail, exécutez `npx --yes genaiscript serve` et accédez à l'URL fournie (typiquement `http://127.0.0.1:8003/`).
* **Liste de la configuration des scripts** : Liste les scripts et les configurations de modèles pour le dépannage CI/CD.
* **Liste des configurations de modèles** : Liste les scripts et configurations de modèles disponibles pour le dépannage CI/CD.
* **Installation locale** : Pour éviter la lenteur de `npx`, installez localement avec `npm install -g genaiscript`.
* **Markdown** : Markdown est un langage de balisage léger avec une syntaxe de formatage en texte brut utilisé pour la création de contenus, notamment la documentation et les applications web.
* **modelAliases** : Permet des alias pour les noms de modèles dans la configuration GenAIScript.
* **modelEncodings** : Définit des encodages spécifiques aux modèles pour les LLMs.
* **Sans installation (npx)** : Exécutez la CLI GenAIScript avec npx sans installation préalable.
* **API d'exécution Node.JS** : API pour exécuter GenAIScript dans des threads de travail Node isolés, évitant la pollution du scope global.
* **Playground** : Application web auto-hébergée pour exécuter des scripts GenAIScript via une interface utilisateur conviviale, faisant le lien entre la CLI et les intégrations VS Code.
* **Prérequis** : Exigences pour utiliser la CLI GenAIScript, comme l'installation de Node.JS.
* **Dépôt distant** : Le Playground peut exécuter des scripts à partir d'un dépôt distant en utilisant les secrets `.env` actuels.
* **run** : La fonction `run` encapsule la commande [CLI run](../../reference/cli/run/) pour exécuter des scripts.
* **Exécuter un script** : Exécute un script en diffusant la sortie LLM vers stdout depuis la racine de l'espace de travail.
* **Exécution des scripts depuis un dépôt distant** : Utilisez `--remote` pour charger et exécuter des scripts depuis un dépôt distant via un clonage superficiel.
* **Exemples** : Les scripts d'exemple sont pleinement fonctionnels et prêts à l'usage, mais peuvent être modifiés ou adaptés selon vos besoins.
* **Fichiers de script** : GenAIScript identifie tout fichier `*.genai.mjs`, `*.genai.js` ou `*.genai.mts` dans votre espace de travail comme script, lesquels peuvent être placés n'importe où.
* **Starlight** : Starlight est un projet pour construire et rédiger des sites web de documentation utilisant Astro et des principes de design spécifiques.
* **Comportement du système** : Cadre pour intégrer l'exécution de code et les invocations de modèles de base/LLM, permettant aux utilisateurs de spécifier le contexte LLM, d'invoquer les modèles et d'analyser les résultats.
* **templates d'invite système** : Les fichiers `system.*.genai.mjs` sont des [templates d'invite système](../../reference/scripts/system/), cachés par défaut.
* **system.\*.genai.mjs** : Les fichiers `system.*.genai.mjs` sont des [templates d'invite système](../../reference/scripts/system/), non listés par défaut.
* **Note de transparence** : Informations pour aider les utilisateurs à comprendre les capacités et limites de GenAIScript.
* **Utilisation de la CLI comme API Node.JS** : Importez et utilisez la CLI GenAIScript comme une API dans Node.JS.
* **Recherche vectorielle** : [Recherche vectorielle](../../reference/scripts/vector-search/)
* **vision\_script** : Fichiers de script (`*.genai.mjs` ou `*.genai.mts`) utilisant le prompting LLM pour la construction d'invites.
* **Extension Visual Studio Code** : Plugin pour VS Code pour créer, déboguer et déployer des scripts GenAIScript.
* **Aperçu Markdown de Visual Studio Code** : Utilise l'aperçu Markdown intégré de VS Code pour la sortie LLM et la trace, limitant l'affichage de certains contenus.
* **Marketplace Visual Studio Code** : Le [Marketplace Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=genaiscript.genaiscript-vscode) fournit la dernière version stable de l'[extension GenAIScript pour VS Code](https://marketplace.visualstudio.com/items?itemName=genaiscript.genaiscript-vscode).
* **Confiance de l'espace de travail Visual Studio Code** : Désactive l'extension en [mode restreint](https://code.visualstudio.com/docs/editor/workspace-trust).
* **Extension VS Code GenAIScript** : Extension VS Code pour créer, éditer, exécuter et déboguer des scripts GenAIScript.
* **WarningCode** : Composant pour afficher des avertissements de sécurité et des solutions dans la documentation.
* **Travail derrière un proxy** : Instructions pour utiliser la CLI dans des environnements avec un proxy HTTP.