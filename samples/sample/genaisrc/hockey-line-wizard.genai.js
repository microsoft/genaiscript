script({
    model: "large",
    title: "hockey-line-wizard",
    temperature: 0.01,
    system: ["system", "system.tools", "system.zero_shot_cot"],
})

const players = [
    {
        name: "CW3",
        PreferredPosition: ["Center", "Left Wing", "Right Wing"],
        skill: "3",
    },
    { name: "C3", PreferredPosition: ["Center"], skill: "3" },
    {
        name: "CW1",
        PreferredPosition: ["Center", "Left Wing", "Right Wing"],
        skill: "1",
    },
    { name: "CLW3", PreferredPosition: ["Center", "Left Wing"], skill: "3" },
    { name: "LW3", PreferredPosition: ["Left Wing"], skill: "3" },
    { name: "RW1", PreferredPosition: ["Right Wing"], skill: "1" },
    { name: "W3", PreferredPosition: ["Left Wing", "Right Wing"], skill: "3" },
    {
        name: "RWRD3",
        PreferredPosition: ["Right Wing", "Right Defender"],
        skill: "3",
    },
    {
        name: "RWD2",
        PreferredPosition: ["Right Wing", "Left Defender", "Right Defender"],
        skill: "2",
    },
    { name: "RW1", PreferredPosition: ["Right Wing"], skill: "1" },
    {
        name: "LDRD2",
        PreferredPosition: ["Left Defender", "Right Defender"],
        skill: "2",
    },
    { name: "N1", PreferredPosition: ["No Preference"], skill: "1" },
    { name: "N3", PreferredPosition: ["No Preference"], skill: "3" },
    { name: "N3_2", PreferredPosition: ["No Preference"], skill: "2" },
]

const ps = defData("PLAYERS", players)

const lineup = defSchema("LINEUP", {
    type: "array",
    description: "A description of a hockey line",
    items: {
        type: "object",
        properties: {
            score: {
                type: "number",
                description: "Total skill level of the line",
            },
            LD: { type: "string", description: "Left Defender" },
            RD: { type: "string", description: "Right Defender" },
            C: { type: "string", description: "Center" },
            LW: { type: "string", description: "Left Wing" },
            RW: { type: "string", description: "Right Wing" },
        },
        required: ["LD", "RD", "C", "LW", "RW"],
    },
})

defTool(
    "player_in_mutiple_lines_validator",
    "Validates that the positions for players in multiple lines",
    {
        type: "object",
        description: "A player's position in two lines",
        properties: {
            name: {
                type: "string",
                description: "Player name",
            },
            position1: {
                type: "string",
                description: "Positions in the first line",
            },
        },
        required: ["name", "position1", "position2"],
    },
    ({ name, position1, position2 }) => {
        if (position1 !== position2) {
            return `${name} is in different positions in different lines.`
        } else return `rule is ok.`
    }
)

$`You are a team manager for a hockey team and responsible for setting the line up.

## Task

In hockey, a line consists of five players across 5 different positions: 
left defender, right defender, center, left wing, and right wing.

You are given a list of players in ${ps}, their preferred positions, 
including those that have no preference and can play in any position,
and their skill level. A skill level of 1 is low skill, 2 is medium skill, and 3 is high skill.

## Step 1: Generate the lines.

Let's reason step by step and explain your reasoning as well. 
You will be tipped 20$ to achieve this work. Do not be lazy.

### Rules

- Build the minimum set of lines such that every player plays at least once.
- All players must be in at least one line. THIS IS IMPORTANT.
- One player can be 2 lines.
- A player MUST play in the same position in all lines: if a player is position X in Y line, he must be in position X in line Z. THIS IS IMPORTANT.
- Try your best to create lines that are comparable skill level.
- ensure all lines have a person at each position
- ensure that the difference in total skill between any two lines is not more than 4
- Avoid putting all the skilled players together in one line
- validate player in multiple lines

## Step 2: Rule validation

You are an expert at validating hockey line rules.

- Validate each rules systematically. Justify that they are valid. THIS IS IMPORTAINT.

If a rule is violated, report the rule and the line and go back to the Step 1 to fix the issue.
If you get stuck trying to find a solution, try randomizing the lines.
If all rules are ok, go to step 3.

## Step 3: Output

- Format the lines into valid YAML using the ${lineup} schema.
- List each players and their position in each lines in YAML.
YOU MUST DO THIS.
`
