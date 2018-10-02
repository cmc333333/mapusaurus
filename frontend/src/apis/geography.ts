import axios from "axios";

import { FilterValue } from "../store/LARLayer";

function convert({ geoid, geo_type, name }): FilterValue {
  return new FilterValue({ name, id: geoid });
}

export async function fetchGeos(ids: string[]): Promise<FilterValue[]> {
  if (ids.length) {
    const response = await axios.get(
      "/api/geo/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.map(convert);
  }
  return [];
}

export async function searchMetros(
  text: string,
  year: number,
): Promise<FilterValue[]> {
  const response = await axios.get(
    "/shapes/search/metro/",
    { params: { year, q: text } },
  );
  return response.data.geos.map(convert);
}

export const makeCountySearch =
  (state: string) => async (text: string, year: number) => {
    const response = await axios.get(
      "/shapes/search/county/",
      { params: { state, year, q: text } },
    );
    return response.data.geos.map(convert);
  };
