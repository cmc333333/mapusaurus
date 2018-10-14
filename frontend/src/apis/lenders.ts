import axios from "axios";
import { Map, Set } from "immutable";

export async function fetchLenders(ids: Set<string>): Promise<Map<string, string>> {
  if (ids.size) {
    const response = await axios.get(
      "/api/respondents/",
      { params: { institution_id__in: ids.join(",") } },
    );
    return response.data.results.reduce(
      (soFar, { institution_id, name }) => soFar.set(institution_id, name),
      Map<string, string>(),
    );
  }
  return Map<string, string>();
}

export async function searchLenders(
  text: string,
  year: number,
): Promise<Map<string, string>> {
  const response = await axios.get(
    "/institutions/search/",
    { params: { year, auto: 1, q: text } },
  );
  return response.data.institutions.reduce(
    (soFar, { institution_id, name }) => soFar.set(institution_id, name),
    Map<string, string>(),
  );
}
