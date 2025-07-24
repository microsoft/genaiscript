// Type declarations for optional dependencies

declare module "@lvce-editor/ripgrep" {
  export const rgPath: string;
}

declare module "xlsx" {
  export interface Workbook {
    SheetNames: string[];
    Sheets: Record<string, any>;
  }
  
  export interface Utils {
    sheet_to_json(worksheet: any, options?: any): object[];
  }
  
  export function read(data: any, options?: { type: string }): Workbook;
  export const utils: Utils;
}