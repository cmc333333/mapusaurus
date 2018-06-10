import glamorous from 'glamorous';
import * as React from 'react';
import ReactMapGL, { NavigationControl } from 'react-map-gl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { changeViewport, Store } from '../store';
import typography from '../util/typography';

export function Map({
  changeViewport,
  lat,
  lon,
  mapboxKey,
  mapConfig,
  zoom,
}) {
  if (!mapConfig) {
    return <div>Loading...</div>;
  }

  return (
    <ReactMapGL
      attributionControl={false}
      mapboxApiAccessToken={mapboxKey}
      width={window.innerWidth - 300}
      height={window.innerHeight}
      latitude={lat}
      longitude={lon}
      zoom={zoom}
      mapStyle={mapConfig}
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
  ({ lat, lon, mapboxKey, mapConfig, zoom }: Store) => ({
    lat,
    lon,
    mapboxKey,
    mapConfig,
    zoom,
  }),
  (dispatch) => bindActionCreators({ changeViewport }, dispatch),
)(Map);