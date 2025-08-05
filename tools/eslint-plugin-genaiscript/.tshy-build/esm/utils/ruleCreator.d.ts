import { ESLintUtils } from "@typescript-eslint/utils";
export declare const createRule: <Options extends readonly unknown[], MessageIds extends string>({ meta, name, ...rule }: Readonly<ESLintUtils.RuleWithMetaAndName<Options, MessageIds, unknown>>) => ESLintUtils.RuleModule<MessageIds, Options, unknown, ESLintUtils.RuleListener>;
//# sourceMappingURL=ruleCreator.d.ts.map