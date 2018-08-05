import glamorous from "glamorous";
import * as React from "react";

import Map from "./Map";
import Sidebar from "./sidebar/Sidebar";

export default function SPA() {
  const sidebarSize = 300;
  return (
    <>
      <Sidebar size={sidebarSize} />
      <glamorous.Div marginLeft={`${sidebarSize}px`}>
        <Map />
      </glamorous.Div>
    </>
  );
}
