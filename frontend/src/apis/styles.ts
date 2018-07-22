import axios from "axios";

import { MapboxStyle } from "../store/Mapbox";

/*
 * Mapbox "style" data includes all layers; we'll load it from their API.
 */
export async function fetchStyle(
  styleName: string,
  token: string,
): Promise<MapboxStyle> {
  const response = await axios.get(
    `https://api.mapbox.com/styles/v1/${styleName}`,
    { params: { access_token: token } },
  );
  return response.data;
}
