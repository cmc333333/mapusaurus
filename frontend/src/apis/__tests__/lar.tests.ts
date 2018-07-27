import axios from "axios";

import { fetchLar } from "../lar";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchLar()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: {} }));
    await fetchLar([], ["2012abcd123"], ["333"]);
    expect(getMock).toHaveBeenCalled();
    const options = getMock.mock.calls[0][1];
    expect(options.params).toEqual({
      action_taken: "1,2,3,4,5",
      lender: "2012abcd123",
      lh: "false",
      metro: "333",
      peers: "false",
      year: "2012",
    });
  });

  it("handles non-hmda displays", async () => {
    const result = await fetchLar([], [], []);
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("creates an action in the right format", async () => {
    getMock.mockImplementationOnce(() => ({
      data: {
        aaaaaaaa: {
          centlat: 3.3,
          centlon: -4.4,
          num_households: 2,
          volume: 1,
        },
        bbbbbbbb: {
          centlat: -7.7,
          centlon: 8.8,
          num_households: 6,
          volume: 5,
        },
        cccccccc: {
          centlat: 11,
          centlon: -12,
          num_households: 10,
          volume: 9,
        },
      } ,
    }));
    const lar = await fetchLar(["1"], ["2"], ["3"]);

    // Ensure a consistent order
    lar.sort((l, r) => l.loanCount - r.loanCount);

    expect(lar).toEqual([
      { houseCount: 2, latitude: 3.3, loanCount: 1, longitude: -4.4 },
      { houseCount: 6, latitude: -7.7, loanCount: 5, longitude: 8.8 },
      { houseCount: 10, latitude: 11, loanCount: 9, longitude: -12 },
    ]);
  });
});