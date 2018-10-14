import axios from "axios";
import { Map, Set } from "immutable";

export async function fetchGeos(ids: Set<string>): Promise<Map<string, string>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/geo/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.reduce(
      (soFar, { geoid, name }) => soFar.set(geoid, name),
      Map<string, string>(),
    );
  }
  return Map<string, string>();
}

export async function searchMetros(
  text: string,
  year: number,
): Promise<Map<string, string>> {
  const response = await axios.get(
    "/shapes/search/metro/",
    { params: { year, q: text } },
  );
  return response.data.geos.reduce(
    (soFar, { geoid, name }) => soFar.set(geoid, name),
    Map<string, string>(),
  );
}

export const makeCountySearch =
  (state: string) => async (text: string, year: number) => {
    const response = await axios.get(
      "/shapes/search/county/",
      { params: { state, year, q: text } },
    );
    return response.data.geos.reduce(
      (soFar, { geoid, name }) => soFar.set(geoid, name),
      Map<string, string>(),
    );
  };
