import axios from "axios";
import { Map, Set } from "immutable";

export class Geo {
  constructor(
    readonly name: string,
    readonly minlon: number,
    readonly maxlon: number,
    readonly minlat: number,
    readonly maxlat: number,
  ) {}

  public toString(): string {
    return this.name;
  }
}

function geoReducer(
  soFar: Map<string, Geo>,
  { geoid, maxlat, maxlon, minlat, minlon, name },
): Map<string, Geo> {
  return soFar.set(
    geoid,
    new Geo(name, minlon, maxlon, minlat, maxlat),
  );
}

export async function fetchGeos(ids: Set<string>): Promise<Map<string, Geo>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/geo/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.reduce(geoReducer, Map<string, Geo>());
  }
  return Map<string, Geo>();
}

export async function searchMetros(
  text: string,
  year: number,
): Promise<Map<string, string>> {
  const response = await axios.get(
    "/shapes/search/metro/",
    { params: { year, q: text } },
  );
  return response.data.geos.reduce(geoReducer, Map<string, Geo>());
}

export const makeCountySearch =
  (state: string) => async (text: string, year: number) => {
    const response = await axios.get(
      "/shapes/search/county/",
      { params: { state, year, q: text } },
    );
    return response.data.geos.reduce(geoReducer, Map<string, Geo>());
  };
