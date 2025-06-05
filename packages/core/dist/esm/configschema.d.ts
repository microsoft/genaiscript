declare const _default: {
  $schema: string;
  title: string;
  type: string;
  description: string;
  properties: {
    envFile: {
      oneOf: (
        | {
            type: string;
            description: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
              description: string;
            };
            description: string;
          }
      )[];
    };
    include: {
      description: string;
      type: string;
      items: {
        type: string;
        description: string;
      };
    };
    modelEncodings: {
      type: string;
      patternProperties: {
        "^[a-zA-Z0-9_:]+$": {
          type: string;
          description: string;
          enum: string[];
        };
      };
      additionalProperties: boolean;
      description: string;
    };
    modelAliases: {
      type: string;
      patternProperties: {
        "^[a-zA-Z0-9_]+$": {
          oneOf: (
            | {
                type: string;
                description: string;
                properties?: undefined;
                required?: undefined;
              }
            | {
                type: string;
                properties: {
                  model: {
                    type: string;
                    description: string;
                  };
                  temperature: {
                    type: string;
                    description: string;
                  };
                };
                required: string[];
                description?: undefined;
              }
          )[];
        };
      };
      additionalProperties: boolean;
      description: string;
    };
    secretPatterns: {
      type: string;
      patternProperties: {
        "^[a-zA-Z0-9_:\\-\\. ]+$": {
          type: string[];
          description: string;
        };
      };
      additionalProperties: boolean;
      description: string;
    };
  };
};
export default _default;
//# sourceMappingURL=configschema.d.ts.map
