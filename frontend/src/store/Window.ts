import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

export default interface Window {
  height: number;
  width: number;
}

export const SAFE_INIT: Window = {
  height: 100,
  width: 100,
};

const actionCreator = actionCreatorFactory("WINDOW");

export const resize = actionCreator<Window>("RESIZE");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(resize, (original, updated: Window) => updated)
  .build();

export function setupResize(window, store) {
  let timer;
  window.addEventListener("resize", () => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(
      () => store.dispatch(resize({
        height: window.innerHeight,
        width: window.innerWidth,
      })),
      1000,
    );
  });
}
