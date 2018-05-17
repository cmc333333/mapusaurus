import glamorous from 'glamorous';
import * as React from 'react';

import Map from './Map';
import Sidebar from './Sidebar';

export default function SPA() {
  return (
    <>
      <glamorous.Aside
        background="white"
        borderRight="solid 1px black"
        display="inline-block"
        float="left"
        height="100%"
        overflowY="scroll"
        width="300px"
      >
        <Sidebar />
      </glamorous.Aside>
      <glamorous.Div
        marginLeft="300px"
      >
        <Map />
      </glamorous.Div>
    </>
  );
}
