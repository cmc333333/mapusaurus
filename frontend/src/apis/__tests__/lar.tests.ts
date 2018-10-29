import axios from "axios";
import { Set } from "immutable";

import { FiltersFactory } from "../../testUtils/Factory";
import { fetchLar } from "../lar";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchLar()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: [] }));
    await fetchLar(FiltersFactory.build({
      county: Set(["111"]),
      lender: Set(["222"]),
      lienStatus: Set(["4"]),
      loanPurpose: Set(["3"]),
      metro: Set(["333"]),
      ownerOccupancy: Set(["2"]),
      propertyType: Set(["1"]),
    }));
    expect(getMock).toHaveBeenCalled();
    const options = getMock.mock.calls[0][1];
    expect(options.params).toEqual({
      action_taken: "1,2,3,4,5",
      county: "111",
      lender: "222",
      lien_status: "4",
      loan_purpose: "3",
      metro: "333",
      owner_occupancy: "2",
      property_type: "1",
    });
  });

  it("handles non-hmda displays", async () => {
    const result = await fetchLar(FiltersFactory.build({
      county: Set<string>(),
      lender: Set<string>(),
      metro: Set<string>(),
    }));
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("requires a geo", async () => {
    const result = await fetchLar(FiltersFactory.build({
      county: Set<string>(),
      lender: Set(["1"]),
      metro: Set<string>(),
    }));
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("creates results in the right format", async () => {
    getMock.mockImplementationOnce(() => ({
      data: [
        {
          centlat: -7.7,
          centlon: 8.8,
          geo_id: "bbbbbbbb",
          num_households: 6,
          volume: 5,
        }, {
          centlat: 3.3,
          centlon: -4.4,
          geo_id: "aaaaaaaa",
          num_households: 2,
          volume: 1,
        }, {
          centlat: 11,
          centlon: -12,
          geo_id: "cccccccc",
          num_households: 10,
          volume: 9,
        },
      ],
    }));
    const lar = await fetchLar(FiltersFactory.build());

    expect(lar).toEqual([
      {
        houseCount: 2,
        latitude: 3.3,
        loanCount: 1,
        longitude: -4.4,
        normalizedLoans: 1 / 2,
      },
      {
        houseCount: 6,
        latitude: -7.7,
        loanCount: 5,
        longitude: 8.8,
        normalizedLoans: 5 / 6,
      },
      {
        houseCount: 10,
        latitude: 11,
        loanCount: 9,
        longitude: -12,
        normalizedLoans: 9 / 10,
      },
    ]);
  });
});
