import { reducer, SAFE_INIT, setGroup, setState } from "../UIOnly";

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
});
