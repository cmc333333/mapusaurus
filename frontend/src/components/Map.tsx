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
import { largeSpace } from "../theme";

export function Map({
  changeViewport,
  height,
  mapStyle,
  mapboxApiAccessToken,
  scatterPlot,
  viewport,
  width,
}) {
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
      <glamorous.Div position="absolute" right={largeSpace} top={largeSpace}>
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
    height: state.window.height,
    mapStyle: currentStyleSelector(state.mapbox),
    mapboxApiAccessToken: state.mapbox.token,
    scatterPlot: scatterPlotSelector(state.larLayer),
    viewport: state.viewport,
    width: state.window.width,
  }),
  dispatch => ({
    changeViewport: ({ latitude, longitude, zoom }) => {
      dispatch(setViewport({ latitude, longitude, zoom }));
    },
  }),
)(Map);
