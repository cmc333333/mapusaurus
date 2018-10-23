import Lar from "./Lar";
import { initGeos, initLenders } from "./Lar/Lookups";
import { updatePoints } from "./Lar/Points";
import Mapbox from "./Mapbox";
import Sidebar from "./Sidebar";
import Viewport from "./Viewport";
import Window from "./Window";

export default interface State {
  lar: Lar;
  mapbox: Mapbox;
  sidebar: Sidebar;
  viewport: Viewport;
  window: Window;
}

export const initCalls = store => {
  store.dispatch(updatePoints.action());
  store.dispatch(initGeos.action());
  store.dispatch(initLenders.action());
};
