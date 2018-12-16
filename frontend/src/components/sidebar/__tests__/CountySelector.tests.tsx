import { Map } from "immutable";

import { makeCountySearch } from "../../../apis/geography";
import { addFilter, zoomToGeos } from "../../../store/Lar/Filters";
import { addGeos } from "../../../store/Lar/Lookups";
import { updatePoints } from "../../../store/Lar/Points";
import {
  GeoFactory,
  LarFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import { mergeProps } from "../CountySelector";

jest.mock("../../../apis/geography");
const makeCountySearchMock = makeCountySearch as jest.Mock;

describe("mergeProps()", () => {
  it("creates a fetchFn by active state", async () => {
    const lar = LarFactory.build();
    lar.uiOnly.state = "12";
    const geo = GeoFactory.build();
    const mockSearchWithState = jest.fn(() => Map([["idid", geo]]));
    makeCountySearchMock.mockReturnValueOnce(mockSearchWithState);

    const merged = mergeProps({ lar }, { dispatch: jest.fn() });
    const result = await merged.fetchFn("stuff");
    expect(makeCountySearch).toHaveBeenCalledWith("12");
    expect(mockSearchWithState).toHaveBeenCalledWith("stuff");
    expect(result).toEqual([["idid", geo]]);
  });

  it("triggers a state change", () => {
    const lar = LarFactory.build();
    const dispatch = jest.fn();
    const result = mergeProps({ lar }, { dispatch });
    const geo = GeoFactory.build();

    result.setValue(["idid", geo]);
    expect(dispatch).toHaveBeenCalledTimes(4);
    expect(dispatch.mock.calls[0]).toEqual([addGeos(Map([["idid", geo]]))]);
    expect(dispatch.mock.calls[1]).toEqual([addFilter({ county: "idid" })]);
  });
});
