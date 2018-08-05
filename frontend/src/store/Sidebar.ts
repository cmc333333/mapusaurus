import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

export type Tab = "layers" | "features" | "lar";

export default interface Sidebar {
  activeTab: Tab;
  expanded: boolean;
}

export const SAFE_INIT: Sidebar = {
  activeTab: "layers",
  expanded: true,
};

const actionCreator = actionCreatorFactory("Sidebar");

export const activateTab = actionCreator<Tab>("ACTIVATE");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    activateTab,
    (original: Sidebar, activeTab: Tab) => ({ ...original, activeTab }),
  ).build();
