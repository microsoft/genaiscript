"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeGenerationOptions = mergeGenerationOptions;
exports.executeChatSession = executeChatSession;
exports.tracePromptResult = tracePromptResult;
exports.appendUserMessage = appendUserMessage;
exports.appendAssistantMessage = appendAssistantMessage;
exports.appendSystemMessage = appendSystemMessage;
exports.addToolDefinitionsMessage = addToolDefinitionsMessage;
const promptdom_js_1 = require("./promptdom.js");
const host_js_1 = require("./host.js");
const dispose_js_1 = require("./dispose.js");
const json5_js_1 = require("./json5.js");
const cancellation_js_1 = require("./cancellation.js");
const cleaners_js_1 = require("./cleaners.js");
const util_js_1 = require("./util.js");
const assert_js_1 = require("./assert.js");
const fence_js_1 = require("./fence.js");
const schema_js_1 = require("./schema.js");
const constants_js_1 = require("./constants.js");
const annotations_js_1 = require("./annotations.js");
const error_js_1 = require("./error.js");
const runpromptcontext_js_1 = require("./runpromptcontext.js");
const models_js_1 = require("./models.js");
const chatrender_js_1 = require("./chatrender.js");
const parameters_js_1 = require("./parameters.js");
const pretty_js_1 = require("./pretty.js");
const yaml_js_1 = require("./yaml.js");
const encoders_js_1 = require("./encoders.js");
const tokens_js_1 = require("./tokens.js");
const fileedits_js_1 = require("./fileedits.js");
const htmlescape_js_1 = require("./htmlescape.js");
const logprob_js_1 = require("./logprob.js");
const es_toolkit_1 = require("es-toolkit");
const precision_js_1 = require("./precision.js");
const mkmd_js_1 = require("./mkmd.js");
const chatcache_js_1 = require("./chatcache.js");
const cleaners_js_2 = require("./cleaners.js");
const think_js_1 = require("./think.js");
const performance_js_1 = require("./performance.js");
const chatrenderterminal_js_1 = require("./chatrenderterminal.js");
const filecache_js_1 = require("./filecache.js");
const stdio_js_1 = require("./stdio.js");
const quiet_js_1 = require("./quiet.js");
const contentsafety_js_1 = require("./contentsafety.js");
const debug_js_1 = require("./debug.js");
const features_js_1 = require("./features.js");
const secretscanner_js_1 = require("./secretscanner.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("chat");
const dbgt = dbg.extend("tool");
function toChatCompletionImage(image) {
    const { url, detail } = image;
    return {
        type: "image_url",
        image_url: {
            url,
            detail,
        },
    };
}
async function runToolCalls(resp, messages, tools, options) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const projFolder = runtimeHost.projectFolder();
    const { cancellationToken, trace, model } = options || {};
    const { encode: encoder } = await (0, encoders_js_1.resolveTokenEncoder)(model);
    (0, assert_js_1.assert)(!!trace);
    const edits = [];
    if (!options.fallbackTools) {
        dbgt(`fallback: appending tool calls to assistant message`);
        messages.push({
            role: "assistant",
            tool_calls: resp.toolCalls.map((c) => ({
                id: c.id,
                function: {
                    name: c.name,
                    arguments: c.arguments,
                },
                type: "function",
            })),
        });
    }
    else {
        // pop the last assistant message
        appendUserMessage(messages, "## Tool Results (computed by tools)");
    }
    // call tool and run again
    for (const call of resp.toolCalls) {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        dbgt(`running tool call %s`, call.name);
        const toolTrace = trace?.startTraceDetails(`📠 tool call ${call.name}`);
        try {
            await runToolCall(toolTrace, cancellationToken, call, tools, edits, projFolder, encoder, messages, { ...options, trace: toolTrace });
        }
        catch (e) {
            (0, util_js_1.logError)(e);
            toolTrace?.error(`tool call ${call.id} error`, e);
            throw e;
        }
        finally {
            toolTrace?.endDetails();
        }
    }
    return { edits };
}
async function runToolCall(trace, cancellationToken, call, tools, edits, projFolder, encoder, messages, options) {
    const callArgs = (0, json5_js_1.JSONLLMTryParse)(call.arguments);
    trace?.fence(call.arguments, "json");
    if (callArgs === undefined)
        trace?.error("arguments failed to parse");
    let todos;
    if (call.name === "multi_tool_use.parallel") {
        dbgt(`multi tool call`);
        // special undocumented openai hallucination, argument contains multiple tool calls
        // {
        //  "id": "call_D48fudXi4oBxQ2rNeHhpwIKh",
        //  "name": "multi_tool_use.parallel",
        //  "arguments": "{\"tool_uses\":[{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"src/content/docs/**/*.md\"}},{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"src/content/docs/**/*.mdx\"}},{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"../samples/sample/src/*.genai.{js,mjs}\"}},{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"src/assets/*.txt\"}}]}"
        // }
        const toolUses = callArgs.tool_uses;
        todos = toolUses.map((tu) => {
            const toolName = tu.recipient_name.replace(/^functions\./, "");
            const tool = tools.find((f) => f.spec.name === toolName);
            if (!tool) {
                (0, util_js_1.logVerbose)(JSON.stringify(tu, null, 2));
                throw new Error(`multi tool ${toolName} not found in ${tools.map((t) => t.spec.name).join(", ")}`);
            }
            return { tool, args: tu.parameters };
        });
    }
    else {
        dbgt(`finding tool for call ${call.name}`);
        let tool = tools.find((f) => f.spec.name === call.name);
        if (!tool) {
            (0, util_js_1.logVerbose)(JSON.stringify(call, null, 2));
            (0, util_js_1.logVerbose)(`tool ${call.name} not found in ${tools.map((t) => t.spec.name).join(", ")}`);
            dbgt(`tool ${call.name} not found`);
            trace?.log(`tool ${call.name} not found`);
            tool = {
                spec: {
                    name: call.name,
                    description: "unknown tool",
                },
                generator: undefined,
                impl: async () => {
                    dbg("tool_not_found", call.name);
                    return `unknown tool ${call.name}`;
                },
            };
        }
        todos = [{ tool, args: callArgs }];
    }
    const toolResult = [];
    for (const todo of todos) {
        const { tool, args } = todo;
        const dbgtt = dbgt.extend(tool.spec.name);
        const { maxTokens: maxToolContentTokens = constants_js_1.MAX_TOOL_CONTENT_TOKENS } = tool.options || {};
        dbgtt(`running %s maxt %d\n%O`, tool.spec.name, maxToolContentTokens, args);
        const context = {
            log: (message) => {
                (0, util_js_1.logInfo)(message);
                trace?.log(message);
            },
            debug: (message) => {
                (0, util_js_1.logVerbose)(message);
                trace?.log(message);
            },
            trace,
        };
        let output;
        try {
            output = await tool.impl({ context, ...args });
            dbgtt(`output: %O`, output);
        }
        catch (e) {
            dbgtt(e);
            (0, util_js_1.logWarn)(`tool: ${tool.spec.name} error`);
            (0, util_js_1.logError)(e);
            trace?.error(`tool: ${tool.spec.name} error`, e);
            output = (0, error_js_1.errorMessage)(e);
        }
        if (output === undefined || output === null)
            output = "no output from tool";
        let toolContent = undefined;
        let toolEdits = undefined;
        if (typeof output === "string") {
            toolContent = output;
        }
        else if (typeof output === "number" || typeof output === "boolean") {
            toolContent = String(output);
        }
        else if (typeof output === "object" && output.exitCode !== undefined) {
            toolContent = (0, chatrender_js_1.renderShellOutput)(output);
        }
        else if (typeof output === "object" &&
            output.filename &&
            output.content) {
            const { filename, content } = output;
            toolContent = `FILENAME: ${filename}
${(0, mkmd_js_1.fenceMD)(content, " ")}
`;
        }
        else if (typeof output === "object" && output.text) {
            const { text } = output;
            toolContent = text;
        }
        else {
            toolContent = (0, yaml_js_1.YAMLStringify)(output);
        }
        if (typeof output === "object") {
            toolEdits = output?.edits;
        }
        if (toolEdits?.length) {
            trace?.fence(toolEdits);
            const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
            edits.push(...toolEdits.map((e) => {
                const { filename, ...rest } = e;
                const n = e.filename;
                const fn = /^[^/]/.test(n) ? runtimeHost.resolvePath(projFolder, n) : n;
                return { filename: fn, ...rest };
            }));
        }
        // remove leaked secrets
        const { text: toolContentRedacted, found } = (0, secretscanner_js_1.redactSecrets)(toolContent, { trace });
        if (toolContentRedacted !== toolContent) {
            dbgtt(`secrets found: %o`, found);
            toolContent = toolContentRedacted;
        }
        // check for prompt injection
        const detector = await (0, contentsafety_js_1.resolvePromptInjectionDetector)(tool.options, {
            trace,
            cancellationToken,
        });
        if (detector) {
            dbgtt(`checking tool result for prompt injection`);
            (0, util_js_1.logVerbose)(`tool ${tool.spec.name}: checking for prompt injection`);
            const result = await detector(toolContent);
            dbgtt(`attack detected: ${result?.attackDetected}`);
            if (result.attackDetected) {
                (0, util_js_1.logWarn)(`tool ${tool.spec.name}: prompt injection detected`);
                trace?.error(`tool ${tool.spec.name}: prompt injection detected`, result);
                toolContent = `!WARNING! prompt injection detected in tool ${tool.spec.name} !WARNING!`;
            }
            else {
                (0, util_js_1.logVerbose)(`tool: ${tool.spec.name} prompt injection not detected`);
            }
        }
        const toolContentTokens = (0, tokens_js_1.approximateTokens)(toolContent);
        if (toolContentTokens > maxToolContentTokens) {
            dbgtt(`truncating`);
            (0, util_js_1.logWarn)(`tool: ${tool.spec.name} response too long (${toolContentTokens} tokens), truncating ${maxToolContentTokens} tokens`);
            toolContent =
                (0, tokens_js_1.truncateTextToTokens)(toolContent, maxToolContentTokens, encoder) + "... (truncated)";
        }
        // intent validation
        if (tool.options?.intent) {
            let { intent } = tool.options;
            if (intent === "description")
                intent = tool.spec.description?.trim();
            if (!intent)
                throw new Error("tool intent not found");
            dbgtt(`validating intent %s`, intent);
            const generator = tool.generator;
            if (!generator)
                throw new Error("tool generator not found, cannot validate intent");
            const resIntent = await generator.runPrompt(async (ictx) => {
                if (typeof intent === "function") {
                    await intent({
                        tool: tool.spec,
                        args,
                        result: toolContent,
                        generator: ictx,
                    });
                }
                else {
                    ictx.$ `You are a tool intent validator that detects malicious LLM tools. Your task is to validate that the tool result <TOOL_RESULT> is RELATED with the tool intent in <INTENT>.
                
                - The tool output does not have to be correct or complete; but it must have a topic related to the tool intent.
                - Do NOT worry about hurting the tool's feelings.
                
                Respond with a short summary of your reasoning to validate the output; then
                Respond "ERR" if the tool result is not RELATED with the intent
                Respond "OK" if the tool result is RELATED with the intent
                `.role("system");
                    ictx.def("INTENT", intent);
                    ictx.def("TOOL_RESULT", toolContent);
                }
            }, {
                responseType: "text",
                systemSafety: true,
                model: "intent",
                temperature: 0.4,
                choices: ["OK", "ERR"],
                logprobs: true,
                label: `tool ${tool.spec.name} intent validation`,
            });
            dbgtt(`validation result %O`, {
                text: resIntent.text,
                error: resIntent.error,
                choices: resIntent.choices,
            });
            trace?.detailsFenced(`intent validation`, resIntent.text, "markdown");
            const validated = /OK/.test(resIntent.text) && !/ERR/.test(resIntent.text);
            if (!validated) {
                (0, util_js_1.logVerbose)(`intent: ${resIntent.text}`);
                throw new Error(`tool ${tool.spec.name} result does not match intent`);
            }
        }
        trace?.fence(toolContent, "markdown");
        toolResult.push(toolContent);
    }
    if (options.fallbackTools) {
        dbg(`appending fallback tool result to user message`);
        appendUserMessage(messages, `- ${call.name}(${JSON.stringify(call.arguments || {})})
<tool_result>
${toolResult.join("\n\n")}
</tool_result>
`);
    }
    else {
        messages.push({
            role: "tool",
            content: toolResult.join("\n\n"),
            tool_call_id: call.id,
        });
    }
}
async function applyRepairs(messages, schemas, options) {
    const { stats, trace, responseType, responseSchema, maxDataRepairs = constants_js_1.MAX_DATA_REPAIRS, infoCb, } = options;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant" || lastMessage.refusal) {
        return false;
    }
    const content = (0, chatrender_js_1.assistantText)(messages, { responseType, responseSchema });
    const fences = (0, fence_js_1.extractFenced)(content);
    (0, schema_js_1.validateFencesWithSchema)(fences, schemas, { trace });
    dbg(`validating fences with schema`);
    const invalids = fences.filter((f) => f?.validation?.schemaError);
    let data;
    if (responseType === "json" ||
        responseType === "json_object" ||
        responseType === "json_schema" ||
        (responseSchema && !responseType)) {
        data = (0, json5_js_1.JSONLLMTryParse)(content);
        if (data === undefined) {
            try {
                data = JSON.parse(content);
            }
            catch (e) {
                invalids.push({
                    label: "response must be valid JSON",
                    content,
                    validation: { schemaError: (0, error_js_1.errorMessage)(e) },
                });
            }
        }
    }
    else if (responseType === "yaml") {
        data = (0, yaml_js_1.YAMLTryParse)(content);
        if (data === undefined) {
            try {
                data = (0, yaml_js_1.YAMLParse)(content);
            }
            catch (e) {
                invalids.push({
                    label: "response must be valid YAML",
                    content,
                    validation: { schemaError: (0, error_js_1.errorMessage)(e) },
                });
            }
        }
    }
    if (responseSchema) {
        const value = data ?? (0, json5_js_1.JSONLLMTryParse)(content);
        const schema = (0, parameters_js_1.promptParametersSchemaToJSONSchema)(responseSchema);
        const res = (0, schema_js_1.validateJSONWithSchema)(value, schema, { trace });
        if (res.schemaError) {
            dbg(`response schema validation failed`, res.schemaError);
            invalids.push({
                label: "response must match schema",
                content,
                validation: res,
            });
        }
    }
    // nothing to repair
    if (!invalids.length) {
        dbg(`no invalid fences found, skipping repairs`);
        return false;
    }
    // too many attempts
    if (stats.repairs >= maxDataRepairs) {
        dbg(`maximum number of repairs reached`);
        trace?.error(`maximum number of repairs (${maxDataRepairs}) reached`);
        return false;
    }
    dbg(`appending repair instructions to messages`);
    infoCb?.({ text: "appending data repair instructions" });
    // let's get to work
    trace?.startDetails("🔧 data repairs");
    const repair = invalids
        .map((f) => (0, util_js_1.toStringList)(f.label, f.args?.schema ? `schema: ${f.args?.schema || ""}` : undefined, f.validation.schemaError ? `error: ${f.validation.schemaError}` : undefined))
        .join("\n\n");
    const repairMsg = `Repair the data format issues listed in <data_format_issues> section below.
<data_format_issues>
${repair}
</data_format_issues>
                            
`;
    (0, util_js_1.logVerbose)(repair);
    trace?.fence(repairMsg, "markdown");
    messages.push({
        role: "user",
        content: [
            {
                type: "text",
                text: repairMsg,
            },
        ],
    });
    trace?.endDetails();
    stats.repairs++;
    return true;
}
async function structurifyChatSession(timer, messages, schemas, fileOutputs, outputProcessors, fileMerges, logprobs, options, others) {
    const { trace, responseType, responseSchema } = options;
    const { resp, err } = others || {};
    const text = (0, chatrender_js_1.assistantText)(messages, { responseType, responseSchema });
    const annotations = (0, annotations_js_1.parseAnnotations)(text);
    const finishReason = (0, error_js_1.isCancelError)(err) ? "cancel" : (resp?.finishReason ?? "fail");
    const error = (0, error_js_1.serializeError)(err);
    const fences = (0, fence_js_1.extractFenced)(text);
    let json;
    if (responseType === "json" ||
        responseType === "json_object" ||
        responseType === "json_schema" ||
        (responseSchema && !responseType)) {
        json = (0, json5_js_1.JSONLLMTryParse)(text);
    }
    else if (responseType === "yaml") {
        json = (0, yaml_js_1.YAMLTryParse)(text);
    }
    else {
        json = (0, json5_js_1.isJSONObjectOrArray)(text) ? (0, json5_js_1.JSONLLMTryParse)(text) : (0, fence_js_1.findFirstDataFence)(fences);
    }
    if (responseSchema) {
        dbg(`validating response schema`);
        const schema = (0, parameters_js_1.promptParametersSchemaToJSONSchema)(responseSchema);
        const res = (0, schema_js_1.validateJSONWithSchema)(json, schema, {
            trace,
        });
        if (res.schemaError) {
            trace?.warn(`response schema validation failed, ${(0, error_js_1.errorMessage)(res.schemaError)}`);
            trace?.fence(schema, "json");
        }
    }
    const frames = [];
    // validate schemas in fences
    if (fences?.length) {
        dbg(`validating schemas in fences`);
        frames.push(...(0, schema_js_1.validateFencesWithSchema)(fences, schemas, { trace }));
    }
    dbg(`computing perplexity and uncertainty`);
    const perplexity = (0, logprob_js_1.computePerplexity)(logprobs);
    const uncertainty = (0, logprob_js_1.computeStructuralUncertainty)(logprobs);
    const revlogprobs = logprobs?.slice(0)?.reverse();
    const choices = (0, cleaners_js_1.arrayify)(options?.choices)
        .filter((choice) => typeof choice === "string")
        .map((token) => revlogprobs?.find((lp) => lp.token === token) ??
        { token, logprob: NaN });
    const activeChoices = choices.filter((c) => !isNaN(c.logprob));
    for (const choice of activeChoices) {
        (0, util_js_1.logVerbose)(`choice: ${choice.token}, ${(0, logprob_js_1.renderLogprob)(choice.logprob)}`);
    }
    if (logprobs?.length) {
        (0, util_js_1.logVerbose)((0, util_js_1.toStringList)(`${logprobs.length} tokens`, !isNaN(perplexity) ? `perplexity: ${(0, precision_js_1.renderWithPrecision)(perplexity, 3)}` : undefined, !isNaN(uncertainty) ? `uncertainty: ${(0, precision_js_1.renderWithPrecision)(uncertainty, 3)}` : undefined));
        try {
            trace?.startDetails("📊 logprobs");
            trace?.itemValue("perplexity", perplexity);
            trace?.itemValue("uncertainty", uncertainty);
            if (choices?.length) {
                trace?.item("choices (0%:red, 100%: blue)");
                trace?.appendContent("\n\n");
                trace?.appendContent(choices.map((lp) => (0, logprob_js_1.logprobToMarkdown)(lp)).join("\n"));
                trace?.appendContent("\n\n");
            }
            trace?.item("logprobs (0%:red, 100%: blue)");
            trace?.appendContent("\n\n");
            trace?.appendContent(logprobs.map((lp) => (0, logprob_js_1.logprobToMarkdown)(lp)).join("\n"));
            trace?.appendContent("\n\n");
            if (!isNaN(logprobs[0].entropy)) {
                trace?.item("entropy (0:red, 1: blue)");
                trace?.appendContent("\n\n");
                trace?.appendContent(logprobs.map((lp) => (0, logprob_js_1.logprobToMarkdown)(lp, { entropy: true })).join("\n"));
                trace?.appendContent("\n\n");
            }
            if (logprobs[0]?.topLogprobs?.length) {
                trace?.item("top_logprobs");
                trace?.appendContent("\n\n");
                trace?.appendContent(logprobs.map((lp) => (0, logprob_js_1.topLogprobsToMarkdown)(lp)).join("\n"));
                trace?.appendContent("\n\n");
            }
        }
        finally {
            trace?.endDetails();
        }
    }
    const stats = options?.stats;
    const acc = stats?.accumulatedUsage();
    const duration = timer();
    const usage = (0, cleaners_js_2.deleteUndefinedValues)({
        cost: stats.cost(),
        duration: duration,
        total: acc?.total_tokens,
        prompt: acc?.prompt_tokens,
        completion: acc?.completion_tokens,
    });
    const reasoning = (0, chatrender_js_1.lastAssistantReasoning)(messages);
    const res = (0, cleaners_js_2.deleteUndefinedValues)({
        model: resp?.model,
        messages,
        text,
        reasoning,
        annotations,
        finishReason,
        fences,
        frames,
        json,
        error,
        schemas,
        choices,
        logprobs,
        perplexity,
        uncertainty,
        usage,
    });
    await (0, fileedits_js_1.computeFileEdits)(res, {
        trace,
        schemas,
        fileOutputs,
        fileMerges,
        outputProcessors,
    });
    return res;
}
function parseAssistantMessage(resp) {
    const { signature } = resp;
    const { content, reasoning } = (0, think_js_1.splitThink)(resp.text);
    const reasoning_content = resp.reasoning || reasoning;
    if (!content && !reasoning_content) {
        return undefined;
    }
    return (0, cleaners_js_2.deleteUndefinedValues)({
        role: "assistant",
        content,
        reasoning_content,
        signature,
    });
}
async function processChatMessage(model, timer, req, resp, messages, tools, chatParticipants, schemas, fileOutputs, outputProcessors, fileMerges, cacheImage, options) {
    const { stats, maxToolCalls = constants_js_1.MAX_TOOL_CALLS, trace, cancellationToken } = options;
    stats.addRequestUsage(model, req, resp);
    const assisantMessage = parseAssistantMessage(resp);
    if (assisantMessage) {
        messages.push(assisantMessage);
    }
    const assistantContent = assisantMessage?.content;
    if (options.fallbackTools && assistantContent && tools.length) {
        dbg(`extracting tool calls from assistant content (fallback)`);
        resp.toolCalls = [];
        // parse tool call
        const toolCallFences = (0, fence_js_1.extractFenced)(assistantContent).filter((f) => /^tool_calls?$/.test(f.language));
        for (const toolCallFence of toolCallFences) {
            for (const toolCall of toolCallFence.content.split("\n")) {
                const { name, args } = /^(?<name>[\w\d]+):\s*(?<args>\{.*\})\s*$/i.exec(toolCall)?.groups || {};
                if (name) {
                    resp.toolCalls.push({
                        id: undefined,
                        name,
                        arguments: args,
                    });
                }
            }
        }
    }
    // execute tools as needed
    if (resp.toolCalls?.length) {
        dbg(`executing tool calls`);
        await runToolCalls(resp, messages, tools, options);
        stats.toolCalls += resp.toolCalls.length;
        if (stats.toolCalls > maxToolCalls) {
            throw new Error(`maximum number of tool calls ${maxToolCalls} reached`);
        }
        return undefined; // keep working
    }
    // apply repairs if necessary
    if (await applyRepairs(messages, schemas, options)) {
        return undefined; // keep working
    }
    let err;
    if (chatParticipants?.length) {
        dbg(`processing chat participants`);
        let needsNewTurn = false;
        for (const participant of chatParticipants) {
            const { generator, options: participantOptions } = participant || {};
            const { label } = participantOptions || {};
            const participantTrace = trace?.startTraceDetails(`🙋 participant ${label || ""}`);
            try {
                const ctx = (0, runpromptcontext_js_1.createChatTurnGenerationContext)(options, participantTrace, cancellationToken);
                const { messages: newMessages } = (await generator(ctx, structuredClone(messages), assistantContent)) || {};
                const node = ctx.node;
                (0, cancellation_js_1.checkCancelled)(cancellationToken);
                // update modified messages
                if (newMessages?.length) {
                    dbg(`updating messages with new participant messages`);
                    messages.splice(0, messages.length, ...newMessages);
                    needsNewTurn = true;
                    participantTrace?.details(`💬 new messages`, await (0, chatrender_js_1.renderMessagesToMarkdown)(messages, {
                        textLang: "markdown",
                        user: true,
                        assistant: true,
                        cacheImage,
                    }));
                }
                dbg(`expanding participant template`);
                // expand template
                const { errors, messages: participantMessages } = await (0, promptdom_js_1.renderPromptNode)(options.model, node, {
                    flexTokens: options.flexTokens,
                    fenceFormat: options.fenceFormat,
                    trace: participantTrace,
                });
                if (participantMessages?.length) {
                    if (participantMessages.some(({ role }) => role === "system")) {
                        throw new Error("system messages not supported for chat participants");
                    }
                    participantTrace?.details(`💬 added messages (${participantMessages.length})`, await (0, chatrender_js_1.renderMessagesToMarkdown)(participantMessages, {
                        textLang: "text",
                        user: true,
                        assistant: true,
                        cacheImage,
                    }), { expanded: true });
                    messages.push(...participantMessages);
                    needsNewTurn = true;
                }
                else {
                    participantTrace?.item("no message");
                }
                if (errors?.length) {
                    dbg(`participant processing encountered errors`);
                    err = errors[0];
                    for (const error of errors) {
                        participantTrace?.error(undefined, error);
                    }
                    needsNewTurn = false;
                    break;
                }
            }
            catch (e) {
                err = e;
                (0, util_js_1.logError)(e);
                participantTrace?.error(`participant error`, e);
                needsNewTurn = false;
                break;
            }
            finally {
                participantTrace?.endDetails();
            }
        }
        if (needsNewTurn) {
            dbg(`participant processing complete, needs new turn`);
            return undefined;
        }
    }
    const logprobs = resp.logprobs?.map(logprob_js_1.serializeLogProb);
    return structurifyChatSession(timer, messages, schemas, fileOutputs, outputProcessors, fileMerges, logprobs, options, {
        resp,
        err,
    });
}
/**
 * Merges two sets of generation options, prioritizing values specified in the second parameter
 * while falling back to defaults from the first parameter and runtime configurations.
 *
 * @param options - A base set of generation options containing default values.
 * @param runOptions - A set of custom generation options that override the base values.
 * @returns A merged set of generation options with priority given to `runOptions` values.
 *
 * The merging process includes:
 * - `model`: Prioritized from `runOptions`, then `options`, and finally the runtime host's default large model.
 * - `temperature`: Taken from `runOptions` if present, otherwise from the runtime host's default large model settings.
 * - `fallbackTools`: Taken from `runOptions` if present, otherwise from the runtime host's default large model settings.
 * - `reasoningEffort`: Taken from `runOptions` if present, otherwise from the runtime host's default large model settings.
 * - `embeddingsModel`: Resolved from `runOptions` if defined or falls back to `options`.
 */
function mergeGenerationOptions(options, runOptions) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const res = {
        ...options,
        ...(runOptions || {}),
        model: runOptions?.model ?? options?.model ?? runtimeHost.modelAliases.large.model,
        temperature: runOptions?.temperature ?? runtimeHost.modelAliases.large.temperature,
        fallbackTools: runOptions?.fallbackTools ?? runtimeHost.modelAliases.large.fallbackTools,
        reasoningEffort: runOptions?.reasoningEffort ?? runtimeHost.modelAliases.large.reasoningEffort,
        embeddingsModel: runOptions?.embeddingsModel ?? options?.embeddingsModel,
    };
    return res;
}
async function choicesToLogitBias(trace, model, choices) {
    choices = (0, cleaners_js_1.arrayify)(choices);
    if (!choices?.length) {
        return undefined;
    }
    dbg(`computing logit bias for choices`);
    const { encode } = (await (0, encoders_js_1.resolveTokenEncoder)(model, {
        disableFallback: true,
    })) || {};
    if (!encode && choices.some((c) => typeof c === "string" || typeof c.token === "string")) {
        dbg(`unable to compute logit bias, no token encoder found for %s`, model);
        dbg(`choices: %O`, choices);
        return undefined;
    }
    const logit_bias = Object.fromEntries(choices.map((c) => {
        const { token, weight } = typeof c === "string" ? { token: c } : c;
        const encoded = typeof token === "number" ? [token] : encode(token);
        if (encoded.length !== 1) {
            (0, util_js_1.logWarn)(`choice ${c} tokenizes to ${encoded.join(", ")} (expected one token)`);
            trace?.warn(`choice ${c} tokenizes to ${encoded.join(", ")} (expected one token)`);
        }
        return [encoded[0], isNaN(weight) ? constants_js_1.CHOICE_LOGIT_BIAS : weight];
    }));
    trace?.itemValue("choices", choices.map((c) => (typeof c === "string" ? c : JSON.stringify(c))).join(", "));
    trace?.itemValue("logit bias", JSON.stringify(logit_bias));
    return logit_bias;
}
/**
 * Executes a chat session by interacting with a language model, processing messages,
 * handling tool integrations, and managing responses.
 *
 * @param connectionToken - Configuration for connecting to the language model, excluding the token.
 * @param cancellationToken - Token to support cancellation of the chat session.
 * @param messages - List of chat messages exchanged during the session.
 * @param toolDefinitions - Definitions of tools that can be invoked during the session.
 * @param schemas - JSON schemas for validating response content.
 * @param fileOutputs - Files to be generated or modified during the session.
 * @param outputProcessors - Handlers for post-processing generated outputs.
 * @param fileMerges - Handlers for merging file outputs.
 * @param prediction - Prediction metadata to guide the response generation.
 * @param completer - Function that sends requests to the language model and returns the response.
 * @param chatParticipants - List of participants involved in the chat session.
 * @param disposables - Objects that require cleanup after the session ends.
 * @param genOptions - Options to customize the session execution, such as model configuration, behavior, and caching.
 *
 * @returns - The final structured result of the chat session.
 */
async function executeChatSession(connectionToken, cancellationToken, messages, toolDefinitions, schemas, fileOutputs, outputProcessors, fileMerges, prediction, completer, chatParticipants, disposables, genOptions) {
    const { trace, model, temperature, reasoningEffort, topP, toolChoice, maxTokens, seed, responseType, responseSchema, stats, fallbackTools, choices, topLogprobs, cache, inner, metadata, partialCb, disableChatPreview, } = genOptions;
    (0, assert_js_1.assert)(!!model, "model is required");
    const { token, source, ...cfgNoToken } = connectionToken;
    const top_logprobs = genOptions.topLogprobs > 0 ? topLogprobs : undefined;
    const logprobs = genOptions.logprobs || top_logprobs > 0 ? true : undefined;
    (0, models_js_1.traceLanguageModelConnection)(trace, genOptions, connectionToken);
    dbg(`chat ${model}`, (0, cleaners_js_2.deleteUndefinedValues)({
        temperature,
        choices,
        fallbackTools,
        logprobs,
        top_logprobs,
    }));
    const tools = toolDefinitions?.length
        ? toolDefinitions.map((f) => ({
            type: "function",
            function: {
                name: f.spec.name,
                description: (0, util_js_1.ellipse)(f.spec.description, constants_js_1.MAX_TOOL_DESCRIPTION_LENGTH),
                parameters: f.spec.parameters,
            },
        }))
        : undefined;
    const cacheStore = cache
        ? (0, chatcache_js_1.getChatCompletionCache)(typeof cache === "string" ? cache : "chat")
        : undefined;
    const chatTrace = trace?.startTraceDetails(`💬 chat`, { expanded: true });
    const store = metadata ? true : undefined;
    const timer = (0, performance_js_1.measure)("chat");
    const cacheImage = async (url) => await (0, filecache_js_1.fileCacheImage)(url, {
        trace,
        cancellationToken,
        dir: chatTrace?.options?.dir,
    });
    try {
        if (toolDefinitions?.length) {
            chatTrace?.detailsFenced(`🛠️ tools`, tools, "yaml");
            const toolNames = toolDefinitions.map(({ spec }) => spec.name);
            const duplicates = (0, es_toolkit_1.uniq)(toolNames).filter((name, index) => toolNames.lastIndexOf(name) !== index);
            if (duplicates.length) {
                chatTrace?.error(`duplicate tools: ${duplicates.join(", ")}`);
                return {
                    error: (0, error_js_1.serializeError)(`duplicate tools: ${duplicates.join(", ")}`),
                    finishReason: "fail",
                    messages,
                    text: "",
                };
            }
        }
        while (true) {
            stats.turns++;
            (0, chatrender_js_1.collapseChatMessages)(messages);
            dbg(`turn ${stats.turns}`);
            if (messages) {
                chatTrace?.details(`💬 messages (${messages.length})`, await (0, chatrender_js_1.renderMessagesToMarkdown)(messages, {
                    textLang: "markdown",
                    user: true,
                    assistant: true,
                    cacheImage,
                    tools,
                }), { expanded: true });
            }
            // make request
            let req;
            let resp;
            try {
                (0, cancellation_js_1.checkCancelled)(cancellationToken);
                const reqTrace = chatTrace?.startTraceDetails(`📤 llm request`);
                try {
                    const logit_bias = await choicesToLogitBias(reqTrace, model, choices);
                    req = {
                        model,
                        temperature,
                        store,
                        metadata: store ? metadata : undefined,
                        reasoning_effort: reasoningEffort,
                        top_p: topP,
                        tool_choice: !fallbackTools && tools?.length
                            ? typeof toolChoice === "object"
                                ? {
                                    type: "function",
                                    function: { name: toolChoice.name },
                                }
                                : toolChoice
                            : undefined,
                        max_tokens: maxTokens,
                        logit_bias,
                        seed,
                        stream: true,
                        logprobs,
                        top_logprobs,
                        tools: fallbackTools ? undefined : tools,
                        // https://platform.openai.com/docs/guides/predicted-outputs
                        prediction: prediction?.content ? prediction : undefined,
                        response_format: responseType === "json_object"
                            ? { type: responseType }
                            : responseType === "json_schema"
                                ? {
                                    type: "json_schema",
                                    json_schema: {
                                        name: "result",
                                        schema: (0, schema_js_1.toStrictJSONSchema)(responseSchema, { noDefaults: true }),
                                        strict: true,
                                    },
                                }
                                : undefined,
                        messages,
                    };
                    updateChatFeatures(reqTrace, model, req);
                    if (!quiet_js_1.isQuiet)
                        stdio_js_1.stderr.write(await (0, chatrenderterminal_js_1.renderMessagesToTerminal)(req, {
                            user: true,
                            tools,
                            preview: disableChatPreview !== true,
                        }));
                    const infer = async () => {
                        (0, util_js_1.logVerbose)(`\n`);
                        const m = (0, performance_js_1.measure)("chat.completer", `${req.model} -> ${req.messages.length} messages`);
                        dbg(`infer ${req.model} with ${req.messages.length} messages`);
                        if (req.response_format)
                            dbg(`response format: %O`, JSON.stringify(req.response_format, null, 2));
                        const cres = await completer(req, connectionToken, genOptions, reqTrace);
                        const duration = m();
                        cres.duration = duration;
                        return cres;
                    };
                    if (cacheStore) {
                        dbg(`cache store enabled, checking cache`);
                        const cachedKey = (0, cleaners_js_2.deleteUndefinedValues)({
                            modelid: model,
                            ...req,
                            responseType,
                            responseSchema,
                            ...cfgNoToken,
                        });
                        const validator = (value) => {
                            const ok = value?.finishReason === "stop";
                            return ok;
                        };
                        const cacheRes = await cacheStore.getOrUpdate(cachedKey, infer, validator);
                        (0, util_js_1.logVerbose)("\n");
                        resp = cacheRes.value;
                        resp.cached = cacheRes.cached;
                        reqTrace?.itemValue("cache", cacheStore.name);
                        reqTrace?.itemValue("cache_key", cacheRes.key);
                        dbg(`cache ${resp.cached ? "hit" : "miss"} (${cacheStore.name}/${cacheRes.key.slice(0, 7)})`);
                        if (resp.cached) {
                            if (cacheRes.value.text) {
                                partialCb((0, cleaners_js_2.deleteUndefinedValues)({
                                    responseSoFar: cacheRes.value.text,
                                    tokensSoFar: 0,
                                    responseChunk: cacheRes.value.text,
                                    responseTokens: cacheRes.value.logprobs,
                                    reasoningSoFar: cacheRes.value.reasoning,
                                    inner,
                                }));
                            }
                        }
                    }
                    else {
                        resp = await infer();
                    }
                }
                finally {
                    (0, util_js_1.logVerbose)("\n");
                    reqTrace?.endDetails();
                }
                const output = await processChatMessage(model, timer, req, resp, messages, toolDefinitions, chatParticipants, schemas, fileOutputs, outputProcessors, fileMerges, cacheImage, genOptions);
                if (output) {
                    return output;
                }
            }
            catch (err) {
                return structurifyChatSession(timer, messages, schemas, fileOutputs, outputProcessors, fileMerges, [], genOptions, { resp, err });
            }
        }
    }
    finally {
        await (0, dispose_js_1.dispose)(disposables, { trace: chatTrace });
        stats.trace(chatTrace);
        chatTrace?.endDetails();
    }
}
function updateChatFeatures(trace, modelid, req) {
    const { provider, model } = (0, models_js_1.parseModelIdentifier)(modelid);
    const features = (0, features_js_1.providerFeatures)(provider);
    if (!isNaN(req.seed) && features?.seed === false) {
        dbg(`seed: disabled, not supported by ${provider}`);
        trace?.itemValue(`seed`, `disabled`);
        delete req.seed; // some providers do not support seed
    }
    if (req.logit_bias && features?.logitBias === false) {
        dbg(`logit_bias: disabled, not supported by ${provider}`);
        trace?.itemValue(`logit_bias`, `disabled`);
        delete req.logit_bias; // some providers do not support logit_bias
    }
    if (!isNaN(req.top_p) && features?.topP === false) {
        dbg(`top_p: disabled, not supported by ${provider}`);
        trace?.itemValue(`top_p`, `disabled`);
        delete req.top_p;
    }
    if (req.tool_choice && features?.toolChoice === false) {
        dbg(`tool_choice: disabled, not supported by ${provider}`);
        trace?.itemValue(`tool_choice`, `disabled`);
        delete req.tool_choice;
    }
    if (req.logprobs && features?.logprobs === false) {
        dbg(`logprobs: disabled, not supported by ${provider}`);
        trace?.itemValue(`logprobs`, `disabled`);
        delete req.logprobs;
        delete req.top_logprobs;
    }
    if (req.prediction && features?.prediction === false) {
        dbg(`prediction: disabled, not supported by ${provider}`);
        delete req.prediction;
    }
    if (req.top_logprobs && (features?.logprobs === false || features?.topLogprobs === false)) {
        dbg(`top_logprobs: disabled, not supported by ${provider}`);
        trace?.itemValue(`top_logprobs`, `disabled`);
        delete req.top_logprobs;
    }
    if (/^(openai\/)?o(1|3|4)/i.test(model) && !req.max_completion_tokens) {
        dbg(`max_tokens: renamed to max_completion_tokens`);
        req.max_completion_tokens = req.max_tokens;
        delete req.max_tokens;
    }
    if (req.store && !features?.metadata) {
        dbg(`metadata: disabled, not supported by ${provider}`);
        delete req.metadata;
        delete req.store;
    }
    (0, cleaners_js_2.deleteUndefinedValues)(req);
}
/**
 * Logs detailed information about a prompt result, including reasoning and output, in a structured format.
 *
 * @param trace - A trace instance used to record detailed logs and events during the prompt execution.
 * @param resp - The response object containing optional text and reasoning fields from the prompt result.
 *
 * If 'reasoning' is present in the response, it is logged in a dedicated "reasoning" section with markdown formatting.
 * If 'text' is present, the function determines its format (e.g., JSON, XML, Markdown, or plain text) and logs it in a corresponding section.
 * Outputs in Markdown format are further prettified for improved readability in the logs and appended as escaped HTML content.
 */
function tracePromptResult(trace, resp) {
    const { text, reasoning } = resp || {};
    if (reasoning) {
        trace?.detailsFenced(`🤔 reasoning`, reasoning, "markdown");
    }
    // try to sniff the output type
    if (text) {
        const language = (0, json5_js_1.JSON5TryParse)(text)
            ? "json"
            : /^</.test(text)
                ? "xml"
                : /^(-|\*|#+|```)\s/im.test(text)
                    ? "markdown"
                    : "text";
        trace?.detailsFenced(`🔠 output`, text, language, { expanded: true });
        if (language === "markdown") {
            trace?.appendContent("\n\n" + (0, htmlescape_js_1.HTMLEscape)((0, pretty_js_1.prettifyMarkdown)(text)) + "\n\n");
        }
    }
}
/**
 * Appends a user message to a chat history.
 *
 * @param messages - The current chat message array.
 * @param content - The content of the user message. Can be a string or an image.
 * @param options - Optional parameters for modifying behavior.
 * @param options.cacheControl - Cache control value for the message.
 *
 * Notes:
 * - If the last message in the array is not a user message or has different cache control,
 *   a new user message is added.
 * - String content is appended to the existing user's message text. If the content is an image,
 *   it is added as a chat completion image.
 * - If the last message content is a string, it is converted to an array when adding an image.
 */
function appendUserMessage(messages, content, options) {
    if (!content) {
        return;
    }
    const { cacheControl } = options || {};
    let last = messages.at(-1);
    if (last?.role !== "user" || options?.cacheControl !== last?.cacheControl) {
        last = {
            role: "user",
            content: "",
        };
        if (cacheControl) {
            last.cacheControl = cacheControl;
        }
        messages.push(last);
    }
    if (typeof content === "string") {
        if (last.content) {
            if (typeof last.content === "string") {
                last.content += "\n" + content;
            }
            else {
                last.content.push({ type: "text", text: content });
            }
        }
        else {
            last.content = content;
        }
    }
    else {
        // add image
        if (typeof last.content === "string") {
            last.content = last.content ? [{ type: "text", text: last.content }] : [];
        }
        last.content.push(toChatCompletionImage(content));
    }
}
/**
 * Appends a message from the assistant to the list of chat messages.
 *
 * Adds the content to the last assistant message if it matches the role
 * and cache control context; otherwise, creates a new assistant message entry.
 *
 * If the last assistant message already has content, appends the new content
 * to it. Supports both string and structured content formats.
 *
 * @param messages - The list of chat messages to update.
 * @param content - The content of the assistant message. Ignored if empty.
 * @param options - Optional context settings for the message, such as cache control.
 */
function appendAssistantMessage(messages, content, options) {
    if (!content) {
        return;
    }
    const { cacheControl } = options || {};
    let last = messages.at(-1);
    if (last?.role !== "assistant" || options?.cacheControl !== last?.cacheControl) {
        last = {
            role: "assistant",
            content: "",
        };
        if (cacheControl) {
            last.cacheControl = cacheControl;
        }
        messages.push(last);
    }
    if (last.content) {
        if (typeof last.content === "string") {
            last.content += "\n" + content;
        }
        else {
            last.content.push({ type: "text", text: content });
        }
    }
    else {
        last.content = content;
    }
}
/**
 * Appends a system-level message to the beginning of the given messages array.
 *
 * @param messages - The list of chat messages to which the system message will be added.
 *                   The system message is prepended to the array.
 * @param content - The content of the message to be appended. If content is empty, the function exits.
 * @param options - Optional parameters for additional message context. Includes:
 *                  - cacheControl: A control directive for caching behavior.
 *
 * If the first message in the array is not a system message or does not match the provided cacheControl, a new system
 * message object is created and added at the start of the array. Otherwise, the content is appended to the existing
 * system message.
 * If the existing system message content is a string, SYSTEM_FENCE is used as a separator before appending the new
 * content. For non-string content, a text object is added to the content array.
 * If the system message content is empty, the new content is directly assigned.
 */
function appendSystemMessage(messages, content, options) {
    if (!content) {
        return;
    }
    const { cacheControl } = options || {};
    let last = messages[0];
    if (last?.role !== "system" || options?.cacheControl !== last?.cacheControl) {
        last = {
            role: "system",
            content: "",
        };
        if (cacheControl) {
            last.cacheControl = cacheControl;
        }
        messages.unshift(last);
    }
    if (last.content) {
        if (typeof last.content === "string") {
            last.content += constants_js_1.SYSTEM_FENCE + content;
        }
        else {
            last.content.push({ type: "text", text: content });
        }
    }
    else {
        last.content = content;
    }
}
/**
 * Adds tool definitions to the system messages of a chat conversation.
 *
 * The function inserts a system message containing the serialized tool definitions,
 * formatted as YAML and wrapped in `<tools>` tags, into the provided list of chat messages.
 *
 * @param messages - The array of chat messages to which the tool definitions will be added.
 * @param tools - An array of tool callback objects whose specifications will be serialized
 *                and included in the system message.
 */
function addToolDefinitionsMessage(messages, tools) {
    dbg(`adding tool definitions to messages`);
    appendSystemMessage(messages, `
<tools>
${(0, yaml_js_1.YAMLStringify)(tools.map((t) => t.spec))}
</tools>
`);
}
//# sourceMappingURL=chat.js.map