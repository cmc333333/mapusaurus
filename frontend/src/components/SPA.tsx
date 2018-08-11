import glamorous from "glamorous";
import * as React from "react";

import Map from "./Map";
import Sidebar from "./sidebar/Sidebar";

export default function SPA() {
  return (
    <>
      <Map />
      <Sidebar size={300} />
    </>
  );
}
