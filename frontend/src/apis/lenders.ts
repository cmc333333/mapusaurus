import axios from "axios";

import { Lender } from "../store/LARLayer";

export async function fetchLenders(ids: string[]): Promise<Lender[]> {
  if (ids.length) {
    const response = await axios.get(
      `/api/respondents/`,
      { params: { institution_id__in: ids.join(",") } },
    );
    return response.data.results.map(({ institution_id, name }) => ({
      name,
      id: institution_id,
    }));
  }
  return [];
}
