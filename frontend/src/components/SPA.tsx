import glamorous from "glamorous";
import * as React from "react";

import Map from "./Map";
import MapKey from "./MapKey";
import Sidebar from "./sidebar/Sidebar";

export default function SPA() {
  return (
    <>
      <Map />
      <MapKey />
      <Sidebar size={300} />
    </>
  );
}
