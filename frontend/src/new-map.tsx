import "mapbox-gl/dist/mapbox-gl.css";
import "normalize.css/normalize.css";

import { Set } from "immutable";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { AnyAction, applyMiddleware, compose, createStore } from "redux";
import reduxThunk, { ThunkDispatch } from "redux-thunk";

import SPA from "./components/SPA";
import initialState from "./store/initial-state";
import reducer from "./store/reducer";
import { setupSerialization } from "./store/serialize";
import State, { initCalls } from "./store/State";
import { setupResize } from "./store/Window";
import { typography } from "./theme";

typography.injectStyles();

const devtoolsField = "__REDUX_DEVTOOLS_EXTENSION__";

const store = createStore(
  reducer,
  initialState(window),
  compose(
    applyMiddleware(reduxThunk),
    window[devtoolsField] ? window[devtoolsField]() : f => f,
  ),
);

setupSerialization(window, store);
setupResize(window, store);

(store.dispatch as ThunkDispatch<State, void, AnyAction>)(
  initCalls.action(store.getState()),
);
ReactDOM.render(
  <Provider store={store}><SPA /></Provider>,
  document.getElementById("spa"),
);
