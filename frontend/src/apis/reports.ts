import axios from "axios";

import Filters from "../store/Lar/Filters";

export function createReport(email: string, filters: Filters) {
  axios.post("/api/reports/", { ...filters, email });
}
