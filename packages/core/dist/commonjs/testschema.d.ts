declare const _default: {
  $schema: string;
  title: string;
  type: string;
  properties: {
    name: {
      type: string;
      description: string;
    };
    description: {
      type: string;
      description: string;
    };
    files: {
      oneOf: (
        | {
            type: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
            };
          }
      )[];
      description: string;
    };
    workspaceFiles: {
      oneOf: (
        | {
            type: string;
            properties: {
              filename: {
                type: string;
              };
              content: {
                type: string;
              };
              encoding: {
                type: string;
                enum: string[];
              };
              size: {
                type: string;
              };
            };
            required: string[];
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
              properties: {
                filename: {
                  type: string;
                };
                content: {
                  type: string;
                };
                encoding: {
                  type: string;
                  enum: string[];
                };
                size: {
                  type: string;
                };
              };
              required: string[];
            };
            properties?: undefined;
            required?: undefined;
          }
      )[];
      description: string;
    };
    vars: {
      type: string;
      additionalProperties: {
        type: string[];
      };
      description: string;
    };
    rubrics: {
      oneOf: (
        | {
            type: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
            };
          }
      )[];
      description: string;
    };
    facts: {
      oneOf: (
        | {
            type: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
            };
          }
      )[];
      description: string;
    };
    keywords: {
      oneOf: (
        | {
            type: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
            };
          }
      )[];
      description: string;
    };
    forbidden: {
      oneOf: (
        | {
            type: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
            };
          }
      )[];
      description: string;
    };
    asserts: {
      oneOf: (
        | {
            type: string;
            items?: undefined;
          }
        | {
            type: string;
            items: {
              type: string;
            };
          }
      )[];
      description: string;
    };
  };
  additionalProperties: boolean;
};
export default _default;
//# sourceMappingURL=testschema.d.ts.map
