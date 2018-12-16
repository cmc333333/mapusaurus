import axios from "axios";
import { OrderedMap, Set } from "immutable";

export interface Point {
  lat: number;
  lon: number;
}

export class Geo {
  constructor(
    readonly name: string,
    readonly northeast: Point,
    readonly southwest: Point,
  ) {}

  public toString(): string {
    return this.name;
  }
}

function geoReducer(
  soFar: OrderedMap<string, Geo>,
  { geoid, name, points },
): OrderedMap<string, Geo> {
  return soFar.set(geoid, new Geo(name, points.northeast, points.southwest));
}

export async function fetchCounties(ids: Set<string>): Promise<OrderedMap<string, Geo>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/county/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.reduce(geoReducer, OrderedMap<string, Geo>());
  }
  return OrderedMap<string, Geo>();
}

export async function fetchMetros(ids: Set<string>): Promise<OrderedMap<string, Geo>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/metro/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.reduce(geoReducer, OrderedMap<string, Geo>());
  }
  return OrderedMap<string, Geo>();
}

export async function searchMetros(
  text: string,
): Promise<OrderedMap<string, string>> {
  const response = await axios.get(
    "/api/metro/",
    { params: { q: text } },
  );
  return response.data.results.reduce(geoReducer, OrderedMap<string, Geo>());
}

export const makeCountySearch =
  (state: string) => async (text: string) => {
    const response = await axios.get(
      "/api/county/",
      { params: { state, q: text } },
    );
    return response.data.results.reduce(geoReducer, OrderedMap<string, Geo>());
  };
