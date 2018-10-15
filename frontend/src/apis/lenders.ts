import axios from "axios";
import { OrderedMap, Set } from "immutable";

export async function fetchLenders(ids: Set<string>): Promise<OrderedMap<string, string>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/respondents/",
      { params: { institution_id__in: ids.join(",") } },
    );
    return response.data.results.reduce(
      (soFar, { institution_id, name }) => soFar.set(institution_id, name),
      OrderedMap<string, string>(),
    );
  }
  return OrderedMap<string, string>();
}

export async function searchLenders(
  text: string,
  year: number,
): Promise<OrderedMap<string, string>> {
  const response = await axios.get(
    "/institutions/search/",
    { params: { year, auto: 1, q: text } },
  );
  return response.data.institutions.reduce(
    (soFar, { institution_id, name }) => soFar.set(institution_id, name),
    OrderedMap<string, string>(),
  );
}
