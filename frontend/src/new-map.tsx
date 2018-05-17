//import 'font-awesome/css/font-awesome.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'normalize.css/normalize.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import SPA from './components/SPA';
import reducer from './store';
import { fetchLayerData } from './util/apis';
import * as hash from './util/hash';
import typography from './util/typography';

typography.injectStyles();

const devtoolsField = '__REDUX_DEVTOOLS_EXTENSION__';
const store = createStore(
  reducer,
  hash.deserialize(window.location.hash),
  window[devtoolsField] && window[devtoolsField]()
);

store.subscribe(() => {
  window.location.hash = hash.serialize(store.getState());
});
fetchLayerData(store);

window.onload = () => {
  ReactDOM.render(
    <Provider store={store}><SPA /></Provider>,
    document.getElementById('spa'),
  );
};
