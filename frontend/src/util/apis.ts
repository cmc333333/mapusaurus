import axios from 'axios';

import { configureMap } from '../store';

export async function fetchLayerData(store) {
  const state = store.getState();
  const response = await axios.get(
    `https://api.mapbox.com/styles/v1/${state.spaConfig.style}`
    + `?access_token=${state.spaConfig.token}`
  );
  store.dispatch(configureMap(response.data));
};
