---
title: batch
description: Learn how to use the batch command to process multiple files with GenAIScript, including JSON Lines output and GitHub Actions integration.
sidebar:
  order: 4
keywords: batch processing, JSON Lines, CLI tool, automation, GitHub Actions
---

To run the tool over many files in a batch mode (one full LLM iteration per file), use the `batch` command.

```bash
node .genaiscript/genaiscript.cjs batch <tool> "src/*.bicep"
```

The tool will create various JSON Lines files with the results (JSON Lines is a file format where each line is a valid JSON object, which allows for appending results). You can post-process those results using your favorite script environment.

By default, results will be saved in the `.genaiscript/results` folder, this can be overriden with `--out`. The execution produces various `.jsonl` (JSON Lines) files that provide a convinient way to append runs to the same files.

In a GitHub Actions workflow, you can inject a report in the step summary (`GITHUB_STEP_SUMMARY`) using `--out-summary` (`-os`).

```yaml
- name: Batch genaiscript <toolname> on <files>
  run: |
      node .genaiscript/genaiscript.cjs batch <toolname> <files> -os $GITHUB_STEP_SUMMARY
- name: Upload GenAIScript results
  if: success() || failure()
  uses: actions/upload-artifact@v4
  with:
      path: |
          results/**
```
