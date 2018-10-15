import axios from "axios";
import { OrderedMap, Set } from "immutable";

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
  soFar: OrderedMap<string, Geo>,
  { geoid, maxlat, maxlon, minlat, minlon, name },
): OrderedMap<string, Geo> {
  return soFar.set(
    geoid,
    new Geo(name, minlon, maxlon, minlat, maxlat),
  );
}

export async function fetchGeos(ids: Set<string>): Promise<OrderedMap<string, Geo>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/geo/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.reduce(geoReducer, OrderedMap<string, Geo>());
  }
  return OrderedMap<string, Geo>();
}

export async function searchMetros(
  text: string,
  year: number,
): Promise<OrderedMap<string, string>> {
  const response = await axios.get(
    "/shapes/search/metro/",
    { params: { year, q: text } },
  );
  return response.data.geos.reduce(geoReducer, OrderedMap<string, Geo>());
}

export const makeCountySearch =
  (state: string) => async (text: string, year: number) => {
    const response = await axios.get(
      "/shapes/search/county/",
      { params: { state, year, q: text } },
    );
    return response.data.geos.reduce(geoReducer, OrderedMap<string, Geo>());
  };
