import { Map } from "immutable";

import { LARLayerFactory, LARPointFactory } from "../../testUtils/Factory";
import {
  addCountyNames,
  addLenderNames,
  addMetroNames,
  reducer,
  reduceToNames,
  scatterPlotSelector,
  setLarData,
} from "../LARLayer";

describe("reducer()", () => {
  it("sets lar data", () => {
    const lar = [LARPointFactory.build(), LARPointFactory.build()];

    const result = reducer(LARLayerFactory.build(), setLarData(lar));
    expect(result.lar).toEqual(lar);
  });

  describe("setting names", () => {
    const original = LARLayerFactory.build({
      countyNames: Map<string, string>({ one: "1", two: "2" }),
      lenderNames: Map<string, string>({ aye: "aaa", bee: "bbb" }),
      metroNames: Map<string, string>({ a: "AaA" }),
    });
    const names = Map<string, string>({ names: "here", some: "stuff" });

    it("adds counties", () => {
      const result = reducer(original, addCountyNames(names));
      expect(result.countyNames).toEqual(Map<string, string>({
        names: "here", one: "1", some: "stuff", two: "2",
      }));
      expect(result.lenderNames).toEqual(original.lenderNames);
      expect(result.metroNames).toEqual(original.metroNames);
    });

    it("adds lenders", () => {
      const result = reducer(original, addLenderNames(names));
      expect(result.countyNames).toEqual(original.countyNames);
      expect(result.lenderNames).toEqual(Map<string, string>({
        aye: "aaa", bee: "bbb", names: "here", some: "stuff",
      }));
      expect(result.metroNames).toEqual(original.metroNames);
    });

    it("adds metros", () => {
      const result = reducer(original, addMetroNames(names));
      expect(result.countyNames).toEqual(original.countyNames);
      expect(result.lenderNames).toEqual(original.lenderNames);
      expect(result.metroNames).toEqual(Map<string, string>({
        a: "AaA", names: "here", some: "stuff",
      }));
    });
  });
});

describe("scatterPlotSelector", () => {
  it("transforms the data", () => {
    const lar = [
      LARPointFactory.build({
        houseCount: 1,
        latitude: 11,
        loanCount: 4,
        longitude: 22,
      }),
      LARPointFactory.build({
        houseCount: 3,
        latitude: 33.33,
        loanCount: 75,
        longitude: 44.44,
      }),
    ];

    const circles = scatterPlotSelector(LARLayerFactory.build({ lar }));
    expect(circles).toEqual([
      { radius: 2, position: [22, 11] },
      { radius: 5, position: [44.44, 33.33] },
    ]);
  });
});

describe("reduceToNames()", () => {
  it("only includes ids that are present", () => {
    const ids = ["aaa", "bbb", "ccc"];
    const mapping = Map<string, string>({ bbb: "BBB", ccc: "CCC" });
    expect(reduceToNames(ids, mapping)).toEqual(["BBB", "CCC"]);
  });

  it("sorts the results", () => {
    const ids = ["aaa", "zzz"];
    const mapping = Map<string, string>({ aaa: "ZZZ", zzz: "AAA" });
    expect(reduceToNames(ids, mapping)).toEqual(["AAA", "ZZZ"]);
  });
});
