import DeckGL, { ScatterplotLayer } from "deck.gl";
import glamorous from "glamorous";
import * as React from "react";
import ReactMapGL, { NavigationControl } from "react-map-gl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { scatterPlotSelector } from "../store/LARLayer";
import { currentStyleSelector } from "../store/Mapbox";
import State from "../store/State";
import { setViewport } from "../store/Viewport";
import typography from "../util/typography";

export function Map({
  changeViewport,
  mapStyle,
  mapboxApiAccessToken,
  scatterPlot,
  viewport,
}) {
  if (!mapStyle) {
    return <div>Loading...</div>;
  }

  const width = window.innerWidth - 300;
  const height = window.innerHeight;
  const layers = [
    new ScatterplotLayer({
      data: scatterPlot,
      getColor: [0, 0, 0, 200],
      radiusScale: 2500,
    }),
    new ScatterplotLayer({
      data: scatterPlot,
      getColor: [255, 255, 255, 255],
      outline: true,
      radiusScale: 2500,
    }),
  ];

  return (
    <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={mapboxApiAccessToken}
      width={width}
      height={height}
      mapStyle={mapStyle}
      onViewportChange={changeViewport}
    >
      <DeckGL {...viewport} layers={layers} width={width} height={height} />
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
  (state: State) => ({
    mapStyle: currentStyleSelector(state.mapbox),
    mapboxApiAccessToken: state.mapbox.config.token,
    scatterPlot: scatterPlotSelector(state.larLayer),
    viewport: state.viewport,
  }),
  dispatch => ({
    changeViewport: ({ latitude, longitude, zoom }) => {
      dispatch(setViewport({ latitude, longitude, zoom }));
    },
  }),
)(Map);
