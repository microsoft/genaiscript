// https://github.com/microsoft/genaiscript/issues/1152
script({
  system: ["system"],
  tools: ["fs"],
  model: "small",
  description: "test out the order of messages",
  tests: {},
});

$`1`;
$`2`.cacheControl("ephemeral");
$`3`.flex(1);
$`6`.flex(1);
$`6`.flex(2);
$`4`.priority(1000);
$`Respond with Hi`;
$`5`.role("system");

defChatParticipant((context, messages) => {
  console.log(messages);
  if (!(messages[0].content as string).includes("5"))
    throw new Error("message 5 should be a system message");
  if (!(messages[1].content as string).includes("1"))
    throw new Error("message 5 should be before message 1");
});
