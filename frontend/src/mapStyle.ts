import { OrderedMap, Set } from "immutable";

const mapStyle = {
  glyphs: "mapbox://fonts/cmc333333/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      layout: {},
      metadata: { feature: "Geography" },
      paint: {
        "background-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "hsl(38, 43%, 89%)",
          7,
          "hsl(38, 48%, 86%)",
        ],
      },
      type: "background",
    },
    {
      "filter": [">", "gentrification", 0],
      "id": "gentrification",
      "layout": {},
      "metadata": { choropleth: "Gentrification" },
      "paint": {
        "fill-color": [
          "match",
          ["get", "gentrification"],
          1,
          "#dddd00",
          2,
          "#00dd00",
          3,
          "#00dddd",
          "#ffffff",
        ],
      },
      "source": "composite",
      "source-layer": "tracts",
      "type": "fill",
    },
    {
      "filter": [">", "income", 0],
      "id": "income",
      "layout": {},
      "metadata": { choropleth: "Income" },
      "paint": {
        "fill-color": [
          "match",
          ["get", "income"],
          1,
          "#00ff00",
          2,
          "#00bb00",
          3,
          "#007700",
          4,
          "#003300",
          "#ffffff",
        ],
      },
      "source": "composite",
      "source-layer": "tracts",
      "type": "fill",
    },
    {
      "filter": [">", "minority50", 0],
      "id": "minority-fifty",
      "layout": {},
      "metadata": { choropleth: "50% Minority" },
      "paint": {
        "fill-color": [
          "match",
          ["get", "minority50"],
          1,
          "hsl(199, 75%, 45%)",
          "#ffffff",
        ],
      },
      "source": "composite",
      "source-layer": "tracts",
      "type": "fill",
    },
    {
      "filter": [">", "msaminority", 0],
      "id": "msa-minority",
      "layout": {},
      "metadata": { choropleth: "Higher Minority than MSA Avg" },
      "paint": {
        "fill-color": ["match", ["get", "msaminority"], 1, "#ff9e16", "#ffffff"],
      },
      "source": "composite",
      "source-layer": "tracts",
      "type": "fill",
    },
    {
      "filter": ["==", "class", "national_park"],
      "id": "national_park",
      "layout": {},
      "metadata": { feature: "Geography" },
      "paint": {
        "fill-color": "hsl(78, 51%, 73%)",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.5],
      },
      "source": "composite",
      "source-layer": "landuse_overlay",
      "type": "fill",
    },
    {
      "filter": ["in", "class", "hospital", "park", "pitch", "school"],
      "id": "landuse",
      "layout": {},
      "metadata": { feature: "Geography" },
      "paint": {
        "fill-color": [
          "match",
          ["get", "class"],
          "park",
          "hsl(78, 51%, 73%)",
          "pitch",
          "hsl(78, 51%, 73%)",
          "hospital",
          "hsl(0, 56%, 89%)",
          "school",
          "hsl(25, 45%, 85%)",
          "hsla(0, 0%, 0%, 0)",
        ],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 1],
      },
      "source": "composite",
      "source-layer": "landuse",
      "type": "fill",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["in", "class", "canal", "river"],
      ],
      "id": "waterway",
      "layout": { "line-join": "round", "line-cap": "round" },
      "metadata": { feature: "Geography" },
      "minzoom": 8,
      "paint": {
        "line-color": "hsl(205, 76%, 70%)",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 8.5, 1],
        "line-width": [
          "interpolate",
          ["exponential", 1.3],
          ["zoom"],
          8.5,
          0.1,
          20,
          8,
        ],
      },
      "source": "composite",
      "source-layer": "waterway",
      "type": "line",
    },
    {
      "id": "water",
      "layout": {},
      "metadata": { feature: "Geography" },
      "paint": {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "hsl(205, 76%, 67%)",
          7,
          "hsl(205, 76%, 70%)",
        ],
      },
      "source": "composite",
      "source-layer": "water",
      "type": "fill",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        ["in", "type", "runway", "taxiway"],
      ],
      "id": "aeroway-line",
      "layout": {},
      "metadata": { feature: "Roads" },
      "paint": {
        "line-color": "hsl(0, 0%, 77%)",
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          10,
          0.5,
          18,
          20,
        ],
      },
      "source": "composite",
      "source-layer": "aeroway",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "type", "platform"],
          ["in", "class", "path", "pedestrian"],
        ],
      ],
      "id": "pedestrian-path",
      "layout": { "line-join": "round", "line-cap": "round" },
      "metadata": { feature: "Roads" },
      "minzoom": 14,
      "paint": {
        "line-color": [
          "match",
          ["get", "type"],
          "sidewalk",
          "hsl(38, 35%, 80%)",
          "crossing",
          "hsl(38, 35%, 80%)",
          "hsl(38, 28%, 70%)",
        ],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          14,
          ["match", ["get", "class"], "pedestrian", 1, "path", 0.75, 0.75],
          20,
          ["match", ["get", "class"], "pedestrian", 8, "path", 5, 5],
        ],
      },
      "source": "composite",
      "source-layer": "road",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "type", "service:parking_aisle"],
          ["==", "structure", "tunnel"],
          [
            "in",
            "class",
            "link",
            "motorway",
            "motorway_link",
            "primary",
            "secondary",
            "service",
            "street",
            "street_limited",
            "tertiary",
            "track",
            "trunk",
          ],
        ],
      ],
      "id": "tunnel",
      "layout": { "line-join": "round" },
      "metadata": { feature: "Roads" },
      "paint": {
        "line-color": [
          "match",
          ["get", "class"],
          "street",
          "hsl(38, 100%, 98%)",
          "street_limited",
          "hsl(38, 100%, 98%)",
          "service",
          "hsl(38, 100%, 98%)",
          "track",
          "hsl(38, 100%, 98%)",
          "link",
          "hsl(38, 100%, 98%)",
          "hsl(0, 0%, 100%)",
        ],
        "line-dasharray": [0.2, 0.2],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          5,
          [
            "match",
            ["get", "class"],
            "motorway",
            0.5,
            "trunk",
            0.5,
            "primary",
            0.5,
            "secondary",
            0.01,
            "tertiary",
            0.01,
            "street",
            0,
            "street_limited",
            0,
            "motorway_link",
            0,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          12,
          [
            "match",
            ["get", "class"],
            "motorway",
            3,
            "trunk",
            3,
            "primary",
            3,
            "secondary",
            2,
            "tertiary",
            2,
            "street",
            0.5,
            "street_limited",
            0.5,
            "motorway_link",
            0.5,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          18,
          [
            "match",
            ["get", "class"],
            "motorway",
            30,
            "trunk",
            30,
            "primary",
            30,
            "secondary",
            24,
            "tertiary",
            24,
            "street",
            12,
            "street_limited",
            12,
            "motorway_link",
            12,
            "service",
            10,
            "track",
            10,
            "link",
            10,
            10,
          ],
        ],
      },
      "source": "composite",
      "source-layer": "road",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "type", "service:parking_aisle"],
          ["!in", "structure", "bridge", "tunnel"],
          [
            "in",
            "class",
            "link",
            "motorway",
            "motorway_link",
            "primary",
            "secondary",
            "service",
            "street",
            "street_limited",
            "tertiary",
            "track",
            "trunk",
          ],
        ],
      ],
      "id": "road",
      "layout": { "line-join": "round", "line-cap": "round" },
      "metadata": { feature: "Roads" },
      "paint": {
        "line-color": [
          "match",
          ["get", "class"],
          "street",
          "hsl(38, 100%, 98%)",
          "street_limited",
          "hsl(38, 100%, 98%)",
          "service",
          "hsl(38, 100%, 98%)",
          "track",
          "hsl(38, 100%, 98%)",
          "link",
          "hsl(38, 100%, 98%)",
          "hsl(0, 0%, 100%)",
        ],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          5,
          [
            "match",
            ["get", "class"],
            "motorway",
            0.5,
            "trunk",
            0.5,
            "primary",
            0.5,
            "secondary",
            0.01,
            "tertiary",
            0.01,
            "street",
            0,
            "street_limited",
            0,
            "motorway_link",
            0,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          12,
          [
            "match",
            ["get", "class"],
            "motorway",
            3,
            "trunk",
            3,
            "primary",
            3,
            "secondary",
            2,
            "tertiary",
            2,
            "street",
            0.5,
            "street_limited",
            0.5,
            "motorway_link",
            0.5,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          18,
          [
            "match",
            ["get", "class"],
            "motorway",
            30,
            "trunk",
            30,
            "primary",
            30,
            "secondary",
            24,
            "tertiary",
            24,
            "street",
            12,
            "street_limited",
            12,
            "motorway_link",
            12,
            "service",
            10,
            "track",
            10,
            "link",
            10,
            10,
          ],
        ],
      },
      "source": "composite",
      "source-layer": "road",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "type", "service:parking_aisle"],
          ["==", "structure", "bridge"],
          [
            "in",
            "class",
            "link",
            "motorway",
            "motorway_link",
            "primary",
            "secondary",
            "service",
            "street",
            "street_limited",
            "tertiary",
            "track",
            "trunk",
          ],
        ],
      ],
      "id": "bridge-case",
      "layout": { "line-join": "round" },
      "metadata": { feature: "Roads" },
      "paint": {
        "line-color": "hsl(38, 48%, 86%)",
        "line-gap-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          5,
          [
            "match",
            ["get", "class"],
            "motorway",
            0.5,
            "trunk",
            0.5,
            "primary",
            0.5,
            "secondary",
            0.01,
            "tertiary",
            0.01,
            "street",
            0,
            "street_limited",
            0,
            "motorway_link",
            0,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          12,
          [
            "match",
            ["get", "class"],
            "motorway",
            3,
            "trunk",
            3,
            "primary",
            3,
            "secondary",
            2,
            "tertiary",
            2,
            "street",
            0.5,
            "street_limited",
            0.5,
            "motorway_link",
            0.5,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          18,
          [
            "match",
            ["get", "class"],
            "motorway",
            30,
            "trunk",
            30,
            "primary",
            30,
            "secondary",
            24,
            "tertiary",
            24,
            "street",
            12,
            "street_limited",
            12,
            "motorway_link",
            12,
            "service",
            10,
            "track",
            10,
            "link",
            10,
            10,
          ],
        ],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          10,
          1,
          16,
          2,
        ],
      },
      "source": "composite",
      "source-layer": "road",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "LineString"],
        [
          "all",
          ["!=", "type", "service:parking_aisle"],
          ["==", "structure", "bridge"],
          [
            "in",
            "class",
            "link",
            "motorway",
            "motorway_link",
            "primary",
            "secondary",
            "service",
            "street",
            "street_limited",
            "tertiary",
            "track",
            "trunk",
          ],
        ],
      ],
      "id": "bridge",
      "layout": { "line-join": "round", "line-cap": "round" },
      "metadata": { feature: "Roads" },
      "paint": {
        "line-color": [
          "match",
          ["get", "class"],
          "street",
          "hsl(38, 100%, 98%)",
          "street_limited",
          "hsl(38, 100%, 98%)",
          "service",
          "hsl(38, 100%, 98%)",
          "track",
          "hsl(38, 100%, 98%)",
          "link",
          "hsl(38, 100%, 98%)",
          "hsl(0, 0%, 100%)",
        ],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          5,
          [
            "match",
            ["get", "class"],
            "motorway",
            0.5,
            "trunk",
            0.5,
            "primary",
            0.5,
            "secondary",
            0.01,
            "tertiary",
            0.01,
            "street",
            0,
            "street_limited",
            0,
            "motorway_link",
            0,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          12,
          [
            "match",
            ["get", "class"],
            "motorway",
            3,
            "trunk",
            3,
            "primary",
            3,
            "secondary",
            2,
            "tertiary",
            2,
            "street",
            0.5,
            "street_limited",
            0.5,
            "motorway_link",
            0.5,
            "service",
            0,
            "track",
            0,
            "link",
            0,
            0,
          ],
          18,
          [
            "match",
            ["get", "class"],
            "motorway",
            30,
            "trunk",
            30,
            "primary",
            30,
            "secondary",
            24,
            "tertiary",
            24,
            "street",
            12,
            "street_limited",
            12,
            "motorway_link",
            12,
            "service",
            10,
            "track",
            10,
            "link",
            10,
            10,
          ],
        ],
      },
      "source": "composite",
      "source-layer": "road",
      "type": "line",
    },
    {
      "filter": [
        "in",
        "class",
        "link",
        "motorway",
        "pedestrian",
        "primary",
        "secondary",
        "street",
        "street_limited",
        "tertiary",
        "trunk",
      ],
      "id": "road-label",
      "layout": {
        "symbol-placement": "line",
        "text-field": ["get", "name_en"],
        "text-font": ["Roboto Regular", "Arial Unicode MS Regular"],
        "text-max-angle": 30,
        "text-padding": 1,
        "text-pitch-alignment": "viewport",
        "text-rotation-alignment": "map",
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          [
            "match",
            ["get", "class"],
            "motorway",
            10,
            "trunk",
            10,
            "primary",
            10,
            "secondary",
            10,
            "tertiary",
            10,
            9,
          ],
          20,
          [
            "match",
            ["get", "class"],
            "motorway",
            15,
            "trunk",
            15,
            "primary",
            15,
            "secondary",
            15,
            "tertiary",
            15,
            14,
          ],
        ],
      },
      "metadata": { feature: "Roads" },
      "minzoom": 12,
      "paint": {
        "text-color": "hsl(0, 0%, 0%)",
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1,
      },
      "source": "composite",
      "source-layer": "road_label",
      "type": "symbol",
    },
    {
      "filter": [
        "all",
        ["!=", "type", "building:part"],
        ["==", "underground", "false"],
      ],
      "id": "building",
      "layout": {},
      "metadata": { feature: "Landmarks" },
      "minzoom": 15,
      "paint": {
        "fill-color": "hsl(38, 28%, 77%)",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 15.5, 0, 16, 1],
      },
      "source": "composite",
      "source-layer": "building",
      "type": "fill",
    },
    {
      "filter": [
        "all",
        ["==", "$type", "Polygon"],
        ["in", "type", "helipad", "runway", "taxiway"],
      ],
      "id": "aeroway-polygon",
      "layout": {},
      "metadata": { feature: "Landmarks" },
      "paint": { "fill-color": "hsl(0, 0%, 77%)" },
      "source": "composite",
      "source-layer": "aeroway",
      "type": "fill",
    },
    {
      "filter": ["<=", "scalerank", 3],
      "id": "poi-label",
      "layout": {
        "icon-image": ["concat", ["get", "maki"], "-11"],
        "text-anchor": "top",
        "text-field": ["get", "name_en"],
        "text-font": ["Roboto Regular", "Arial Unicode MS Regular"],
        "text-line-height": 1.1,
        "text-max-angle": 38,
        "text-max-width": 8,
        "text-offset": [0, 0.75],
        "text-padding": 2,
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 18, 13],
      },
      "metadata": { feature: "Landmarks" },
      "paint": {
        "text-color": "hsl(38, 19%, 29%)",
        "text-halo-blur": 0.5,
        "text-halo-color": "hsla(0, 0%, 100%, 0.75)",
        "text-halo-width": 1,
      },
      "source": "composite",
      "source-layer": "poi_label",
      "type": "symbol",
    },
    {
      "filter": ["<=", "scalerank", 2],
      "id": "airport-label",
      "layout": {
        "icon-image": [
          "step",
          ["zoom"],
          ["concat", ["get", "maki"], "-11"],
          13,
          ["concat", ["get", "maki"], "-15"],
        ],
        "text-anchor": "top",
        "text-field": [
          "step",
          ["zoom"],
          ["get", "ref"],
          14,
          ["get", "name_en"],
        ],
        "text-font": ["Roboto Regular", "Arial Unicode MS Regular"],
        "text-line-height": 1.1,
        "text-max-width": 9,
        "text-offset": [0, 0.75],
        "text-padding": 2,
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 12, 18, 18],
      },
      "metadata": { feature: "Landmarks" },
      "paint": {
        "text-color": "hsl(38, 19%, 29%)",
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1,
      },
      "source": "composite",
      "source-layer": "airport_label",
      "type": "symbol",
    },
    {
      "filter": ["all", ["==", "maritime", 0], [">=", "admin_level", 3]],
      "id": "admin-state-province",
      "layout": { "line-join": "round", "line-cap": "round" },
      "metadata": { feature: "Places" },
      "minzoom": 2,
      "paint": {
        "line-color": [
          "step",
          ["zoom"],
          "hsl(0, 0%, 80%)",
          4,
          "hsl(0, 0%, 65%)",
        ],
        "line-dasharray": [
          "step",
          ["zoom"],
          ["literal", [2, 0]],
          7,
          ["literal", [2, 2, 6, 2]],
        ],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 3, 1],
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.75, 12, 1.5],
      },
      "source": "composite",
      "source-layer": "admin",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["<=", "admin_level", 2],
        ["==", "disputed", 1],
        ["==", "maritime", 0],
      ],
      "id": "admin-country-disputed",
      "layout": { "line-join": "round" },
      "metadata": { feature: "Places" },
      "minzoom": 1,
      "paint": {
        "line-color": "hsl(0, 0%, 50%)",
        "line-dasharray": [1.5, 1.5],
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 10, 2],
      },
      "source": "composite",
      "source-layer": "admin",
      "type": "line",
    },
    {
      "filter": [
        "all",
        ["<=", "admin_level", 2],
        ["==", "disputed", 0],
        ["==", "maritime", 0],
      ],
      "id": "admin-country",
      "layout": { "line-join": "round", "line-cap": "round" },
      "metadata": { feature: "Places" },
      "minzoom": 1,
      "paint": {
        "line-color": "hsl(0, 0%, 50%)",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 10, 2],
      },
      "source": "composite",
      "source-layer": "admin",
      "type": "line",
    },
    {
      "filter": ["in", "type", "neighbourhood", "suburb"],
      "id": "place-neighborhood-suburb-label",
      "layout": {
        "text-field": ["get", "name_en"],
        "text-font": ["Roboto Regular", "Arial Unicode MS Regular"],
        "text-letter-spacing": 0.15,
        "text-max-width": 8,
        "text-padding": 3,
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 11, 16, 16],
        "text-transform": "uppercase",
      },
      "maxzoom": 15,
      "metadata": { feature: "Places" },
      "minzoom": 12,
      "paint": {
        "text-color": "hsl(38, 62%, 21%)",
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1,
      },
      "source": "composite",
      "source-layer": "place_label",
      "type": "symbol",
    },
    {
      "filter": ["in", "type", "hamlet", "town", "village"],
      "id": "place-town-village-hamlet-label",
      "layout": {
        "text-field": ["get", "name_en"],
        "text-font": [
          "step",
          ["zoom"],
          ["literal", ["Roboto Regular", "Arial Unicode MS Regular"]],
          12,
          [
            "match",
            ["get", "type"],
            "town",
            ["literal", ["Roboto Medium", "Arial Unicode MS Regular"]],
            ["literal", ["Roboto Regular", "Arial Unicode MS Regular"]],
          ],
        ],
        "text-max-width": 7,
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          ["match", ["get", "type"], "town", 9.5, 8],
          16,
          ["match", ["get", "type"], "town", 20, 16],
        ],
      },
      "maxzoom": 14,
      "metadata": { feature: "Places" },
      "minzoom": 6,
      "paint": {
        "text-color": "hsl(0, 0%, 0%)",
        "text-halo-blur": 0.5,
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1,
      },
      "source": "composite",
      "source-layer": "place_label",
      "type": "symbol",
    },
    {
      "filter": ["all", ["!has", "scalerank"], ["==", "type", "city"]],
      "id": "place-city-label-minor",
      "layout": {
        "text-field": ["get", "name_en"],
        "text-font": ["literal", ["Roboto Medium", "Arial Unicode MS Regular"]],
        "text-max-width": 10,
        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 12, 16, 22],
      },
      "maxzoom": 14,
      "metadata": { feature: "Places" },
      "minzoom": 1,
      "paint": {
        "text-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "hsl(0, 0%, 33%)",
          6,
          "hsl(0, 0%, 0%)",
        ],
        "text-halo-blur": 0.5,
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1.25,
      },
      "source": "composite",
      "source-layer": "place_label",
      "type": "symbol",
    },
    {
      "filter": ["all", ["==", "type", "city"], ["has", "scalerank"]],
      "id": "place-city-label-major",
      "layout": {
        "text-field": ["get", "name_en"],
        "text-font": [
          "step",
          ["zoom"],
          ["literal", ["Roboto Medium", "Arial Unicode MS Regular"]],
          10,
          [
            "step",
            ["get", "scalerank"],
            ["literal", ["Roboto Bold", "Arial Unicode MS Bold"]],
            5,
            ["literal", ["Roboto Medium", "Arial Unicode MS Regular"]],
          ],
        ],
        "text-max-width": 10,
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          ["step", ["get", "scalerank"], 14, 4, 12],
          16,
          ["step", ["get", "scalerank"], 30, 4, 22],
        ],
      },
      "maxzoom": 14,
      "metadata": { feature: "Places" },
      "minzoom": 1,
      "paint": {
        "text-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "hsl(0, 0%, 33%)",
          6,
          "hsl(0, 0%, 0%)",
        ],
        "text-halo-blur": 0.5,
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1.25,
      },
      "source": "composite",
      "source-layer": "place_label",
      "type": "symbol",
    },
    {
      "id": "state-label",
      "layout": {
        "text-field": [
          "step",
          ["zoom"],
          ["step", ["get", "area"], ["get", "abbr"], 80000, ["get", "name_en"]],
          5,
          ["get", "name_en"],
        ],
        "text-font": ["Roboto Black", "Arial Unicode MS Bold"],
        "text-letter-spacing": 0.2,
        "text-line-height": 1.2,
        "text-max-width": 6,
        "text-padding": 1,
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          ["step", ["get", "area"], 8, 20000, 9, 80000, 10],
          9,
          ["step", ["get", "area"], 14, 20000, 18, 80000, 23],
        ],
        "text-transform": "uppercase",
      },
      "maxzoom": 8,
      "metadata": { feature: "Places" },
      "minzoom": 4,
      "paint": {
        "text-color": "hsl(38, 7%, 64%)",
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1,
      },
      "source": "composite",
      "source-layer": "state_label",
      "type": "symbol",
    },
    {
      "id": "country-label",
      "layout": {
        "text-field": ["get", "name_en"],
        "text-font": [
          "step",
          ["zoom"],
          ["literal", ["Roboto Medium", "Arial Unicode MS Regular"]],
          4,
          ["literal", ["Roboto Bold", "Arial Unicode MS Bold"]],
        ],
        "text-max-width": ["interpolate", ["linear"], ["zoom"], 0, 5, 3, 6],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          2,
          ["step", ["get", "scalerank"], 13, 3, 11, 5, 9],
          9,
          ["step", ["get", "scalerank"], 35, 3, 27, 5, 22],
        ],
      },
      "maxzoom": 8,
      "metadata": { feature: "Places" },
      "minzoom": 1,
      "paint": {
        "text-color": "hsl(0, 0%, 0%)",
        "text-halo-color": "hsl(0, 0%, 100%)",
        "text-halo-width": 1.5,
      },
      "source": "composite",
      "source-layer": "country_label",
      "type": "symbol",
    },
  ],
  metadata: {
    "mapbox:autocomposite": true,
    "mapbox:origin": "basic-template-v1",
    "mapbox:sdk-support": {
      android: "6.0.0",
      ios: "4.0.0",
      js: "0.45.0",
    },
    "mapbox:trackposition": true,
    "mapbox:type": "template",
  },
  name: "Redlining Risk Assessment Mapper",
  sources: {
    composite: {
      type: "vector",
      url: "mapbox://cmc333333.8rurks4x,mapbox.mapbox-streets-v7",
    },
  },
  sprite: "mapbox://sprites/cmc333333/cji0srvay07792rpi58zl0tvc",
  version: 8,
};
export default mapStyle;

export const features = mapStyle.layers.reduce((soFar, layer) => {
  if (layer.metadata.feature) {
    const featureName = layer.metadata.feature;
    return soFar.set(
      featureName,
      soFar.get(featureName, Set<string>()).add(layer.id),
    );
  }
  return soFar;
}, OrderedMap<string, Set<string>>());

export const choropleths = mapStyle.layers.reduce(
  (soFar, layer) => {
    if (layer.metadata.choropleth) {
      return soFar.set(layer.id, layer.metadata.choropleth);
    }
    return soFar;
  },
  OrderedMap<string, string>(),
);
