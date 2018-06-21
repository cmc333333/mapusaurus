import axios from "axios";

import { loadStyle } from "../store/actions";

export async function fetchLayerData(store) {
  const state = store.getState();
  const response = await axios.get(
    `https://api.mapbox.com/styles/v1/${state.config.styleName}`
    + `?access_token=${state.config.token}`,
  );
  store.dispatch(loadStyle(response.data));
}
