import {
  VscodeBadge,
  VscodeButton,
  VscodeCheckbox,
  VscodeCheckboxGroup,
  VscodeCollapsible,
  VscodeContextMenu,
  VscodeContextMenuItem,
  VscodeDivider,
  VscodeFormContainer,
  VscodeFormGroup,
  VscodeFormHelper,
  VscodeIcon,
  VscodeLabel,
  VscodeMultiSelect,
  VscodeOption,
  VscodeProgressRing,
  VscodeRadio,
  VscodeRadioGroup,
  VscodeScrollable,
  VscodeSingleSelect,
  VscodeTabHeader,
  VscodeTable,
  VscodeTableBody,
  VscodeTableCell,
  VscodeTableHeader,
  VscodeTableHeaderCell,
  VscodeTableRow,
  VscodeTabPanel,
  VscodeTabs,
  VscodeTextarea,
  VscodeTextfield,
  VscodeTree,
} from "@vscode-elements/elements";
import type { VscCollapsibleToggleEvent } from "@vscode-elements/elements/dist/vscode-collapsible/vscode-collapsible";
import type { VscContextMenuSelectEvent } from "@vscode-elements/elements/dist/vscode-context-menu/vscode-context-menu";
import type {
  VscodeSplitLayout,
  VscSplitLayoutChangeEvent,
} from "@vscode-elements/elements/dist/vscode-split-layout/vscode-split-layout";
import type { VscTabsSelectEvent } from "@vscode-elements/elements/dist/vscode-tabs/vscode-tabs";
import type {
  VscTreeActionEvent,
  VscTreeSelectEvent,
} from "@vscode-elements/elements/dist/vscode-tree/vscode-tree";

type ElementProps<I> = Partial<Omit<I, keyof HTMLElement>>;
type CustomEventHandler<E> = (e: E) => void;

type WebComponentProps<I extends HTMLElement> = React.DetailedHTMLProps<
  React.HTMLAttributes<I>,
  I
> &
  ElementProps<I>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "vscode-dev-toolbar": {
        hidden?: boolean;
      };
      "vscode-badge": WebComponentProps<VscodeBadge>;
      "vscode-button": WebComponentProps<VscodeButton>;
      "vscode-checkbox": WebComponentProps<VscodeCheckbox>;
      "vscode-checkbox-group": WebComponentProps<VscodeCheckboxGroup>;
      "vscode-collapsible": WebComponentProps<VscodeCollapsible> & {
        "onvsc-collapsible-toggle"?: CustomEventHandler<VscCollapsibleToggleEvent>;
      };
      "vscode-context-menu": WebComponentProps<VscodeContextMenu> & {
        "onvsc-context-menu-select"?: CustomEventHandler<VscContextMenuSelectEvent>;
      };
      "vscode-context-menu-item": WebComponentProps<VscodeContextMenuItem>;
      "vscode-divider": WebComponentProps<VscodeDivider>;
      "vscode-form-container": WebComponentProps<VscodeFormContainer>;
      "vscode-form-group": WebComponentProps<VscodeFormGroup>;
      "vscode-form-helper": WebComponentProps<VscodeFormHelper>;
      "vscode-icon": WebComponentProps<VscodeIcon>;
      "vscode-label": WebComponentProps<VscodeLabel>;
      "vscode-multi-select": WebComponentProps<VscodeMultiSelect>;
      "vscode-option": WebComponentProps<VscodeOption>;
      "vscode-progress-ring": WebComponentProps<VscodeProgressRing>;
      "vscode-radio": WebComponentProps<VscodeRadio>;
      "vscode-radio-group": WebComponentProps<VscodeRadioGroup>;
      "vscode-scrollable": WebComponentProps<VscodeScrollable>;
      "vscode-single-select": WebComponentProps<VscodeSingleSelect>;
      "vscode-split-layout": WebComponentProps<VscodeSplitLayout> & {
        "onvsc-split-layout-change"?: CustomEventHandler<VscSplitLayoutChangeEvent>;
      };
      "vscode-tab-header": WebComponentProps<VscodeTabHeader>;
      "vscode-tab-panel": WebComponentProps<VscodeTabPanel>;
      "vscode-table": WebComponentProps<VscodeTable>;
      "vscode-table-body": WebComponentProps<VscodeTableBody>;
      "vscode-table-body": WebComponentProps<VscodeTableCell>;
      "vscode-table-header": WebComponentProps<VscodeTableHeader>;
      "vscode-table-header-cell": WebComponentProps<VscodeTableHeaderCell>;
      "vscode-table-row": WebComponentProps<VscodeTableRow>;
      "vscode-tabs": WebComponentProps<VscodeTabs> & {
        "onvsc-tabs-select"?: CustomEventHandler<VscTabsSelectEvent>;
      };
      "vscode-textarea": WebComponentProps<VscodeTextarea>;
      "vscode-textfield": WebComponentProps<VscodeTextfield>;
      "vscode-tree": WebComponentProps<VscodeTree> & {
        "onvsc-tree-select"?: CustomEventHandler<VscTreeSelectEvent>;
        "onvsc-tree-action"?: CustomEventHandler<VscTreeActionEvent>;
      };
    }
  }
}