
  // src/index.tsx
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import { sampleSchema } from './schema';
  
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');
  
  const root = createRoot(rootElement);
  root.render(<JsonSchemaForm schema={sampleSchema} />);
  