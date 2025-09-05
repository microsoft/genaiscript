---
title: FAQ
sidebar:
  order: 100
description: Trouvez des réponses aux questions fréquentes concernant la
  génération de scripts par IA, ses utilisations, ses performances et les
  meilleures pratiques pour une application efficace.
keywords: AI, script generation, performance, best practices, limitations

---

### Prise en main

* **Qu'est-ce que GenAIScript et comment cela fonctionne-t-il ?**\
  GenAIScript est un framework qui permet aux utilisateurs de créer des scripts enrichis par l'IA pour automatiser des tâches. Il utilise des commandes simples et s'intègre avec des modèles d'IA pour exécuter des tâches basées sur des invites écrites par l'utilisateur.

* **Qui peut utiliser GenAIScript et faut-il être développeur ?**\
  Tout le monde peut utiliser GenAIScript, y compris les non-développeurs. Il est conçu pour être convivial, mais une compréhension de base du scripting ou de la programmation peut être utile.

* **Quelles sont les prérequis pour utiliser GenAIScript ?**\
  Vous devez avoir VS Code installé pour utiliser l'extension GenAIScript, et une certaine familiarité avec les concepts de programmation est bénéfique mais pas obligatoire.

* **Comment installer le framework GenAIScript et son extension VS Code ?**\
  Les étapes d'installation spécifiques sont documentées ici : [Installation](../../getting-started/installation/)

* **Faut-il installer Node.JS ?**\
  Oui. Pour l’installer, suivez les [instructions d'installation](../../reference/cli/).

* **Puis-je utiliser GenAIScript dans des IDE autres que VS Code ?**\
  Actuellement, GenAIScript est intégré à VS Code, mais il peut être écrit dans n'importe quel IDE. L'extension VS Code fournit cependant un support supplémentaire pour la création et le débogage des scripts. Bien que non entièrement testé, vous pouvez utiliser GenAIScript dans des variantes de VS Code comme Cursor.

* **Que sont les modèles foundation et les LLM dans le contexte de GenAIScript ?**\
  Les modèles foundation et les LLM (Modèles de Langage Large) sont des modèles d'IA avec lesquels GenAIScript peut interagir pour exécuter des tâches telles que la génération de texte ou le traitement d'informations.

* **Comment écrire mon premier GenAIScript ?**\
  Commencez par apprendre les bases de JavaScript et du framework GenAIScript, puis utilisez l'extension VS Code pour créer un script qui définit la tâche, appelle le LLM et traite la sortie. Plus d'informations sont disponibles ici : [Prise en main](../../getting-started/)

### Utilisation de GenAIScript

* **Comment déboguer un GenAIScript dans VS Code ?**\
  Utilisez l'extension GenAIScript dans VS Code, qui fournit des outils pour exécuter, déboguer et tracer l'exécution de votre script. Les instructions de débogage sont ici : [Débogage](../../getting-started/debugging-scripts/)

* **Quelles sont les meilleures pratiques pour rédiger des invites efficaces dans GenAIScript ?**\
  Voir [Meilleures pratiques](../../getting-started/best-practices/)

* **Comment intégrer des appels à plusieurs modèles LLM dans un seul GenAIScript ?**\
  Le framework vous permet de paramétrer des appels à différents modèles, vous pouvez donc inclure plusieurs invocations de modèles dans votre script et les gérer en conséquence à l'aide de la fonction runPrompt documentée ici : [Invites en ligne](../../reference/scripts/inline-prompts/)

* **GenAIScript peut-il générer des sorties dans des formats autres que JSON ?**\
  Oui, GenAIScript prend en charge plusieurs formats de sortie, y compris les modifications de fichiers, JSON et des schémas définis par l'utilisateur. Plus d'informations ici : [Schémas](../../reference/scripts/schemas/)

* **Comment exécuter un GenAIScript depuis la ligne de commande ?**\
  Une fois que vous avez empaqueté un GenAIScript, vous pouvez l’exécuter depuis la ligne de commande comme n'importe quel autre script. Plus d'informations ici : [Ligne de commande](../../getting-started/automating-scripts/)

* **Les GenAIScripts peuvent-ils prendre des entrées de fichiers dans plusieurs formats, tels que .pdf ou .docx ?**\
  Oui, le framework GenAIScript prend en charge en natif la lecture des formats .pdf et .docx. Consultez les pages de documentation [PDF](../../reference/scripts/pdf/) et [DOCX](../../reference/scripts/docx/) pour plus d'informations.

### Fonctionnalités avancées

* **Comment utiliser GenAIScript pour automatiser la traduction de documents ?**\
  Une de nos études de cas illustre l'utilisation de GenAIScript pour traduire des fragments de documents entre langues : [Étude de cas Traduction](../../case-studies/documentation-translations/)

* **Puis-je utiliser GenAIScript pour résumer des documents ou créer des dialogues à partir de monologues ?**\
  Oui, les LLM sont performants pour résumer et peuvent être utilisés dans GenAIScript pour résumer des documents ou convertir des monologues en dialogues.

### Dépannage

* **Que faire en cas d'erreurs lors de l'exécution d'un GenAIScript ?**\
  Vérifiez les messages d'erreur, consultez la documentation et utilisez les outils de débogage de l'extension VS Code pour identifier et résoudre les problèmes.

* **Comment résoudre les problèmes liés à l'analyse des sorties LLM dans GenAIScript ?**\
  Revoyez l'invite et la sortie, assurez-vous que votre script gère correctement la réponse du LLM, et ajustez votre logique d'analyse si nécessaire.

* **Où trouver des exemples de GenAIScript pour mieux comprendre ses capacités ?**\
  Visitez le dépôt GitHub de GenAIScript pour des exemples et la documentation. [Documentation GenAIScript](../../)

### Sécurité et IA responsable

* **Quels sont les usages non intentionnels de GenAIScript et comment les éviter ?**\
  Les usages non intentionnels incluent toute application malveillante. Pour les éviter, suivez les pratiques d'IA responsable et utilisez les modèles recommandés dotés de fonctionnalités de sécurité.

* **Comment GenAIScript s'aligne-t-il avec les pratiques d'IA responsable ?**\
  GenAIScript encourage l'usage de modèles avec des atténuations robustes pour l'IA responsable et fournit des conseils pour un usage sécurisé et éthique.\
  Pour plus d'informations, voir la [Note de transparence](../../reference/transparency-note/)

* **Quels modèles foundation et LLM sont recommandés pour une utilisation avec GenAIScript ?**\
  Des services comme Azure Open AI avec des fonctionnalités mises à jour de sécurité et d'IA responsable sont recommandés. GenAIScript peut aussi être utilisé avec des LLM open source existants.

* **Fournissez-vous des invites système pour se prémunir contre des problèmes courants comme les contenus nuisibles ou le jailbreak ?**\
  Oui, GenAIScript inclut des invites système pour se protéger contre les contenus nuisibles et le jailbreak. Pour plus d'informations, voir la documentation [Sécurité du contenu](../../reference/scripts/content-safety/).

* **Supportez-vous les services Azure Content ?**\
  Oui, GenAIScript fournit des API pour interagir avec les services Azure Content Safety. Pour plus d'informations, voir la documentation [Sécurité du contenu](../../reference/scripts/content-safety/).

### Communauté et support

* **Où trouver la communauté GenAIScript pour discussions et support ?**\
  Le dépôt GitHub de GenAIScript est un bon point de départ pour les discussions communautaires et le support. [GenAIScript GitHub](https://github.com/microsoft/genaiscript/)

* **Comment puis-je contribuer au projet GenAIScript ?**\
  Consultez le dépôt pour les directives de contribution et envisagez de fournir des retours, de soumettre des issues, ou de contribuer du code. Visitez la page [Contribuer](https://github.com/microsoft/genaiscript/blob/main/CONTRIBUTING.md) pour plus d'informations.

* **Qui contacter pour des retours ou questions sur GenAIScript ?**\
  Vous pouvez envoyer un courriel aux contacts fournis dans le document [Note de transparence](../../reference/transparency-note/) pour des retours ou questions.

### Mises à jour et feuille de route

* **À quelle fréquence GenAIScript est-il mis à jour et comment rester informé des nouveautés ?**\
  Vous pouvez suivre le dépôt GitHub pour les mises à jour et annonces.

* **Existe-t-il une feuille de route pour le développement de GenAIScript ?**\
  Le dépôt GitHub fournit des informations sur les plans de développement futurs.
