import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

import tabs, { TabId } from "../tabs";

export default interface Sidebar {
  activeTabId: TabId;
  expanded: boolean;
}

export const SAFE_INIT: Sidebar = {
  activeTabId: "layers",
  expanded: true,
};

const actionCreator = actionCreatorFactory("Sidebar");

export const activateTab = actionCreator<TabId>("ACTIVATE");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    activateTab,
    (original: Sidebar, activeTabId: TabId) => ({ ...original, activeTabId }),
  ).build();

export const activeTabSelector = createSelector(
  ({ activeTabId }: Sidebar) => activeTabId,
  activeTabId => tabs.find(tab => tab.id === activeTabId) || tabs[0],
);
