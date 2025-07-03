import { v4 as uuidv4 } from "uuid";
script({ model: "none" });

/**
 * Generates 100 key-value pairs where key is a GUID and value is a random number
 * @returns An object containing GUIDs as keys and random numbers as values
 */
export function generateKeyValuePairs() {
  const pairs: Record<string, number> = {};

  // Generate 100 key-value pairs
  for (let i = 0; i < 100; i++) {
    // Generate a UUID (GUID)
    const guid = uuidv4();

    // Generate a random number between 1 and 1000
    const randomNumber = i;

    // Add to the pairs object
    pairs[guid] = randomNumber;
  }

  return pairs;
}

// Generate and log the key-value pairs
const result = generateKeyValuePairs();
const s = JSON.stringify(result, null, 2);

const { encoded, decode } = parsers.encodeIDs(s);
console.log({ encoded });

const res = await runPrompt(
  (_) => {
    _.def("FILE", encoded);
    _.$`Find the top 10 keys with the highest values in the file <FILE>. Respond in text.
        
            key: value
            key2: value2
            ...
        `;
  },
  {
    model: "small",
  },
);

console.log({ generated: res.text });
const decoded = decode(res.text);
console.log({ decoded });
