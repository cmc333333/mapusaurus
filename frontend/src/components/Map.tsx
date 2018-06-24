import glamorous from "glamorous";
import * as React from "react";
import ReactMapGL, { NavigationControl } from "react-map-gl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { changeViewport } from "../store/actions";
import { larCircles, mapboxStyleSelector, Store } from "../store/store";
import typography from "../util/typography";
import LoanMarker from "./LoanMarker";

export function Map({ changeViewport, circles, config, mapStyle, viewport }) {
  if (!mapStyle) {
    return <div>Loading...</div>;
  }

  return (
    <ReactMapGL
      mapboxApiAccessToken={config.token}
      width={window.innerWidth - 300}
      height={window.innerHeight}
      latitude={viewport.latitude}
      longitude={viewport.longitude}
      zoom={viewport.zoom}
      mapStyle={mapStyle}
      onViewportChange={changeViewport}
    >
      {circles.map(c => <LoanMarker key={c.geoid} {...c} />)}
      <glamorous.Div
        position="absolute"
        right={typography.rhythm(1)}
        top={typography.rhythm(1)}
      >
        <NavigationControl
          onViewportChange={changeViewport}
          showCompass={false}
        />
      </glamorous.Div>
    </ReactMapGL>
  );
}
export default connect(
  (store: Store) => ({
    circles: larCircles(store),
    config: store.config,
    mapStyle: mapboxStyleSelector(store),
    viewport: store.viewport,
  }),
  dispatch => bindActionCreators({ changeViewport }, dispatch),
)(Map);
