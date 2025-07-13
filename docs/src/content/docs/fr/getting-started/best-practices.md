---
title: Meilleures pratiques
description: Suggestions pour utiliser GenAIScripts de manière plus efficace
keywords: best practices, writing scripts
sidebar:
  order: 6
hero:
  image:
    alt: A small, simple illustration using five solid colors shows rectangle icons
      for scripts, each with symbols indicating parameters, arranged to appear
      interconnected. There’s a plain document icon with a folded corner, and
      two distinct file icons marked out by colored sections for PDF and DOCX
      formats. Arrows connect these elements, illustrating the flow of input and
      output between scripts. A cogwheel icon signals configuration, while two
      overlapping speech bubble shapes symbolize different large language
      models. All shapes are flat, iconic, and set on a blank, untextured
      background with no people or written text.
    file: ../../getting-started/best-practices.png

---

## GenAIScript permet aux utilisateurs de chatbot de créer des scripts réutilisables

Si vous avez utilisé un chatbot basé sur un LLM, comme ChatGPT, vous connaissez les types de choses que les LLM peuvent faire et que les logiciels ordinaires (qui n'utilisent pas de LLM) ne peuvent pas. Par exemple, les LLM peuvent examiner un document, écrire de la poésie et analyser des images, juste comme point de départ (avec la réserve qu'ils font parfois des erreurs). GenAIScript vous permet d'écrire une invite qui est intégrée dans un cadre JavaScript afin que l'invite puisse être paramétrée, testée, déboguée, réutilisée et exécutée depuis une ligne de commande.

## Fournir au modèle le contexte dont il a besoin à partir des documents

GenAIScript permet aux utilisateurs d'ajouter des documents à leurs invites. Cela permet au LLM d'avoir plus d'informations de fond liées à la tâche qu'on lui demande d'effectuer. Dans un GenAIScript, la commande JavaScript [`def`](../../reference/scripts/context/) donne au LLM le contenu d'un document et définit un nom qui peut être utilisé dans l'invite pour faire référence à ce document. Les formats de documents standard, comme [pdf](../../reference/scripts/pdf/) et [docx](../../reference/scripts/docx/) sont pris en charge, vous n'avez donc qu'à nommer les fichiers et nos bibliothèques extraieront automatiquement le texte. Vous pouvez paramétrer davantage le contexte d'entrée en utilisant [`env.files`](../../reference/scripts/context/).

## Concentrez un GenAIScript pour que le LLM fasse bien une seule chose

Supposons que je veuille utiliser un GenAIScript pour rédiger un livre blanc. Plutôt que de demander au modèle d'écrire tout le document en une seule invite, je diviserais la tâche en différentes parties : écrire l'introduction, rédiger les recommandations, écrire la conclusion, etc. En décomposant le problème en sous-problèmes, vous pouvez déboguer le script pour accomplir correctement la tâche spécifique, puis passer à la suivante.

## Utilisez la sortie d'un GenAIScript comme entrée pour un autre

En combinant les deux points ci-dessus, vous pouvez créer une collection de scripts interconnectés qui accomplissent un objectif plus ambitieux. Selon votre niveau d'expertise, la combinaison peut être réalisée en utilisant l'interface en ligne de commande des scripts [CLI](../../reference/cli/) et en utilisant un logiciel traditionnel pour les connecter.

## Utilisez le bon LLM ou autre modèle de base pour la tâche

Il existe actuellement de nombreux choix différents de modèles d'IA. Nous expliquons comment connecter plusieurs d'entre eux avec GenAIScript dans [configuration](../../getting-started/configuration/). Ils varient en capacités et en coût, certains étant disponibles en open source et utilisables (avec le bon GPU) gratuitement. Consultez la documentation du LLM ou autre modèle spécifique que vous utilisez pour comprendre comment écrire des invites qui communiquent efficacement la tâche que vous voulez que l'IA accomplisse. Les paramètres varient entre les LLM, par exemple, la taille du contexte d'entrée autorisée, alors assurez-vous que le contenu que vous voulez transmettre au LLM tient dans la taille de sa fenêtre de contexte.
