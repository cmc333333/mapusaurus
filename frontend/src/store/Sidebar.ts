import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

import tabs, { TabId } from "../tabs";

export default interface Sidebar {
  activeTabId: TabId;
  expanded: boolean;
}

export const SAFE_INIT: Sidebar = {
  activeTabId: "lar",
  expanded: true,
};

const actionCreator = actionCreatorFactory("SIDEBAR");

export const activateTab = actionCreator<TabId>("ACTIVATE");
export const collapse = actionCreator("COLLAPSE");
export const expand = actionCreator("EXPAND");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    activateTab,
    (original: Sidebar, activeTabId: TabId) => ({ ...original, activeTabId }),
  ).case(
    collapse,
    (original: Sidebar) => ({ ...original, expanded: false }),
  ).case(
    expand,
    (original: Sidebar) => ({ ...original, expanded: true }),
  ).build();

export const activeTabSelector = createSelector(
  ({ activeTabId }: Sidebar) => activeTabId,
  activeTabId => tabs.find(tab => tab.id === activeTabId) || tabs[0],
);
