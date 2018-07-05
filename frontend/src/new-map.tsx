import "mapbox-gl/dist/mapbox-gl.css";
import "normalize.css/normalize.css";

import { Set } from "immutable";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";

import SPA from "./components/SPA";
import reducer from "./store/reducer";
import { fetchData } from "./util/apis";
import * as hash from "./util/hash";
import typography from "./util/typography";

typography.injectStyles();

const devtoolsField = "__REDUX_DEVTOOLS_EXTENSION__";
const configField = "__SPA_CONFIG__";

const config = window[configField] || {};
config.features = config.features || [];
config.features.forEach(feature => {
  feature.ids = Set(feature.ids);
});

const store = createStore(
  reducer,
  hash.deserialize(window.location.hash.substr(1), config),
  window[devtoolsField] && window[devtoolsField](),
);

window.setInterval(
  () => {
    window.location.hash = hash.serialize(store.getState());
  },
  3000,
);

fetchData(store);
ReactDOM.render(
  <Provider store={store}><SPA /></Provider>,
  document.getElementById("spa"),
);
