# ChromaDB RAG solution

https://docs.trychroma.com/

## setup

### sqlite3 issue

chromeadb uses a recent version of sqlite and it will typically fail unless [the following steps are taken](https://microsoft.github.io/autogen/docs/FAQ#chromadb-fails-in-codespaces-because-of-old-version-of-sqlite3).

-   install pysqlite3-binary

```bash
pip install pysqlite3-binary chromadb
```

-   patch paths

```bash
mkdir /home/codespace/.local/lib/python3.10/site-packages/google
mkdir /home/codespace/.local/lib/python3.10/site-packages/google/colab
```

## launch server

```bash
yarn serve
```
