// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import type {
  Ffmpeg,
  Git,
  GitHub,
  JSONSchemaUtilities,
  Tokenizers,
  Parsers,
  YAMLObject,
  CSVObject,
  DIFFObject,
  HTMLObject,
  INIObject,
  JSON5Object,
  JSONLObject,
  XMLObject,
  MDObject,
} from "@genaiscript/core";
import { installGlobals } from "@genaiscript/core";

installGlobals();

declare global {
  const parsers: Parsers;
  const YAML: YAMLObject;
  const INI: INIObject;
  const CSV: CSVObject;
  const XML: XMLObject;
  const HTML: HTMLObject;
  const MD: MDObject;
  const JSONL: JSONLObject;
  const JSON5: JSON5Object;
  const JSONSchema: JSONSchemaUtilities;
  const DIFF: DIFFObject;
  const github: GitHub;
  const git: Git;
  const ffmpeg: Ffmpeg;
  const tokenizers: Tokenizers;
}
