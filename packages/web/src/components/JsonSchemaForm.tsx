
  // src/components/JsonSchemaForm.tsx
  import React, { useState } from 'react';
  import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
  import { marked } from 'marked';
  import { FormField } from './FormField';
  import { JSONSchema, FormData } from '../types';
  
  interface JsonSchemaFormProps {
    schema: JSONSchema;
  }
  
  export const JsonSchemaForm: React.FC<JsonSchemaFormProps> = ({ schema }) => {
    const [formData, setFormData] = useState<FormData>({});
    const [markdown, setMarkdown] = useState<string>('');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const markdownOutput = Object.entries(formData)
        .map(([key, value]) => `### ${key}\n${value}`)
        .join('\n\n');
      setMarkdown(markdownOutput);
    };
  
    const handleFieldChange = (fieldName: string, value: string | boolean | number) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    };
  
    return (
      <div className="container">
        <form onSubmit={handleSubmit}>
          {Object.entries(schema.properties).map(([fieldName, field]) => (
            <div key={fieldName} className="field-container">
              <label>{field.title || fieldName}</label>
              <FormField
                field={field}
                value={formData[fieldName] || ''}
                onChange={(value) => handleFieldChange(fieldName, value)}
              />
              {field.description && (
                <small className="description">{field.description}</small>
              )}
            </div>
          ))}
          <VSCodeButton type="submit">Generate Markdown</VSCodeButton>
        </form>
        
        {markdown && (
          <div className="markdown-output">
            <h2>Output:</h2>
            <div 
              dangerouslySetInnerHTML={{ __html: marked(markdown) }} 
              className="markdown-content"
            />
          </div>
        )}
      </div>
    );
  };
  