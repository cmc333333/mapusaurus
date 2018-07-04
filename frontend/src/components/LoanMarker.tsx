import glamorous from "glamorous";
import * as React from "react";
import { Marker } from "react-map-gl";

export const LoanCircle = glamorous.div<{ radius: number }>(
  {
    backgroundColor: "#000a",
    border: "solid white 2px",
    borderRadius: "50%",
  },
  ({ radius }) => ({
    height: `${radius * 2}px`,
    width: `${radius * 2}px`,
  }),
);

export default function LoanMarker({ latitude, longitude, radius }) {
  return (
    <Marker
      latitude={latitude}
      longitude={longitude}
      offsetLeft={-radius}
      offsetTop={-radius}
    >
      <LoanCircle radius={radius} />
    </Marker>
  );
}
