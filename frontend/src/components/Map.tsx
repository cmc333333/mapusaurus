import glamorous from "glamorous";
import * as React from "react";
import ReactMapGL, { NavigationControl } from "react-map-gl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { changeViewport } from "../store/actions";
import { mapboxStyleSelector, Store } from "../store/store";
import typography from "../util/typography";

export function Map({ changeViewport, config, mapStyle, viewport }) {
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
    config: store.config,
    mapStyle: mapboxStyleSelector(store),
    viewport: store.viewport,
  }),
  dispatch => bindActionCreators({ changeViewport }, dispatch),
)(Map);
