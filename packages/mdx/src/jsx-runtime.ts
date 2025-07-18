import { PromptDomNode } from "./types.js";

/**
 * Custom JSX runtime for MDX without React
 * This replaces React DOM with a lightweight DOM subset for GenAIScript
 */

export interface JSXElement {
  type: string | JSXFunction;
  props: Record<string, any>;
  key?: string | number | null;
}

export type JSXFunction = (props: Record<string, any>) => JSXElement | string | null;

/**
 * Create a JSX element (jsx factory function)
 */
export function jsx(
  type: string | JSXFunction,
  props: Record<string, any> = {},
  key?: string | number | null
): JSXElement | string | null {
  // Handle functional components
  if (typeof type === "function") {
    return type(props);
  }

  return {
    type,
    props: {
      ...props,
      children: props.children,
    },
    key,
  };
}

/**
 * Create a JSX element with children (jsxs factory function)
 */
export function jsxs(
  type: string | JSXFunction,
  props: Record<string, any> = {},
  key?: string | number | null
): JSXElement | string | null {
  return jsx(type, props, key);
}

/**
 * JSX Fragment implementation
 */
export function Fragment(props: { children?: any }): JSXElement {
  return {
    type: "Fragment",
    props: {
      children: props.children,
    },
  };
}

/**
 * Convert JSX elements to PromptDomNode
 */
export function jsxToPromptDom(element: JSXElement | string | null): PromptDomNode | string | null {
  if (element === null) {
    return null;
  }
  
  if (typeof element === "string") {
    return element;
  }

  // Ensure we have a JSXElement at this point
  if (typeof element !== "object" || !element || typeof element.type !== "string") {
    return String(element);
  }

  if (element.type === "Fragment") {
    // Handle fragments by flattening children
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    
    return {
      tag: "fragment",
      props: {},
      children: children
        .filter(child => child != null)
        .map(child => {
          if (typeof child === "string") return child;
          if (typeof child === "object" && child !== null && "type" in child) {
            return jsxToPromptDom(child as JSXElement);
          }
          return String(child);
        })
        .filter(child => child != null) as (PromptDomNode | string)[],
    };
  }

  const { children, ...restProps } = element.props;
  
  let processedChildren: (PromptDomNode | string)[] = [];
  if (children !== undefined) {
    if (Array.isArray(children)) {
      processedChildren = children
        .filter(child => child != null)
        .map(child => {
          if (typeof child === "string") return child;
          if (typeof child === "object" && child !== null && "type" in child) {
            return jsxToPromptDom(child as JSXElement);
          }
          return String(child);
        })
        .filter(child => child != null) as (PromptDomNode | string)[];
    } else if (children != null) {
      if (typeof children === "string") {
        processedChildren = [children];
      } else if (typeof children === "object" && "type" in children) {
        const converted = jsxToPromptDom(children as JSXElement);
        if (converted != null) {
          processedChildren = [converted];
        }
      } else {
        processedChildren = [String(children)];
      }
    }
  }

  return {
    tag: element.type,
    props: restProps,
    children: processedChildren,
  };
}

/**
 * Runtime for automatic JSX transformation
 */
export const jsxRuntime = {
  jsx,
  jsxs,
  Fragment,
};

/**
 * Export for classic JSX transform
 */
export function createElement(
  type: string | JSXFunction,
  props: Record<string, any> | null = {},
  ...children: any[]
): JSXElement | string | null {
  const normalizedProps = props || {};
  
  if (children.length > 0) {
    normalizedProps.children = children.length === 1 ? children[0] : children;
  }

  return jsx(type, normalizedProps);
}

// React compatibility exports
export { createElement as default };
export const React = {
  createElement,
  Fragment,
};
