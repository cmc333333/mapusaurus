import { createReport } from "../../../apis/reports";
import { FiltersFactory } from "../../../testUtils/Factory";
import { addFilter, removeFilter, setFilters } from "../Filters";
import {
  reducer,
  SAFE_INIT,
  sendReport,
  setGroup,
  setReportEmail,
  setState,
} from "../UIOnly";
jest.mock("../../../apis/reports");
const createReportMock = createReport as jest.Mock;

describe("reducer()", () => {
  it("sets state", () => {
    const result = reducer(SAFE_INIT, setState("31"));
    expect(result.state).toEqual("31");
  });

  it("sets filter group", () => {
    const uiOnly = { ...SAFE_INIT };
    uiOnly.group = "custom";
    const result = reducer(uiOnly, setGroup("refinance"));
    expect(result.group).toBe("refinance");
  });

  it("sends a report", () => {
    const uiOnly = {
      ...SAFE_INIT,
      reportEmail: "someone@example.com",
      reportSent: false,
    };
    const filters = FiltersFactory.build();
    const result = reducer(uiOnly, sendReport(filters));
    expect(result.reportSent).toBe(true);
    expect(createReportMock).toHaveBeenCalledWith(
      "someone@example.com",
      filters,
    );
  });

  it("sets report email", () => {
    const uiOnly = {
      ...SAFE_INIT,
      reportEmail: "someone@example.com",
      reportSent: true,
    };
    const result = reducer(uiOnly, setReportEmail("abc@example"));
    expect(result.reportEmail).toBe("abc@example");
    expect(result.reportSent).toBe(false);
  });

  it("resets when filters change", () => {
    const actions = [
      addFilter({ county: "abcdef", metro: "012345" }),
      removeFilter({ lender: "0a1b2c" }),
      setFilters(FiltersFactory.build()),
    ];
    actions.forEach(action => {
      const result = reducer({ ...SAFE_INIT, reportSent: true }, action);
      expect(result.reportSent).toBe(false);
    });
  });
});
