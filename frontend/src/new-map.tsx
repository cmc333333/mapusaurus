import "mapbox-gl/dist/mapbox-gl.css";
import "normalize.css/normalize.css";

import { Set } from "immutable";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";

import SPA from "./components/SPA";
import initialState from "./store/initial-state";
import reducer from "./store/reducer";
import serialize from "./store/serialize";
import { fetchData } from "./util/apis";
import typography from "./util/typography";

typography.injectStyles();

const devtoolsField = "__REDUX_DEVTOOLS_EXTENSION__";

const store = createStore(
  reducer,
  initialState(window),
  window[devtoolsField] && window[devtoolsField](),
);

let serializerTimer;
store.subscribe(() => {
  if (serializerTimer) {
    clearTimeout(serializerTimer);
  }
  serializerTimer = setTimeout(
    () => { window.location.hash = serialize(store.getState()); },
    1000,
  );
});

fetchData(store);
ReactDOM.render(
  <Provider store={store}><SPA /></Provider>,
  document.getElementById("spa"),
);
