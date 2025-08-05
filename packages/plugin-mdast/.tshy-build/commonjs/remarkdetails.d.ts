import type { Plugin } from "unified";
import type { Root, Data, Parent } from "mdast";
declare module "mdast" {
    interface RootContentMap {
        details: DetailsElement;
    }
}
export interface RemarkDetailsOptions {
}
export interface DetailsElement extends Parent {
    type: "detailsElement";
    attributes?: string;
    data?: Data & {
        detailsElement?: {
            summary: string;
            content: string;
        };
    };
}
export interface SummaryElement extends Parent {
    type: "summaryElement";
    data?: Data & {
        summaryElement?: {
            text: string;
        };
    };
}
declare const remarkDetails: Plugin<[RemarkDetailsOptions?], Root>;
export default remarkDetails;
//# sourceMappingURL=remarkdetails.d.ts.map