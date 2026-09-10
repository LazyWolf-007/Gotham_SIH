import type { StylesheetJson } from "cytoscape";

export const canvasStylesheet: StylesheetJson = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      width: "data(size)",
      height: "data(size)",
      label: "data(label)",
      color: "#D7E0EC",
      "font-size": 8,
      "font-family": "Segoe UI, system-ui, sans-serif",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 4,
      "text-max-width": "86px",
      "text-wrap": "ellipsis",
      "min-zoomed-font-size": 7,
      "text-outline-width": 2,
      "text-outline-color": "#0B1220",
      "overlay-padding": 4,
      "overlay-opacity": 0,
      "border-width": 0,
      "border-color": "#F4E4B8",
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.2,
      "line-color": "data(color)",
      "curve-style": "haystack",
      "haystack-radius": 0.6,
      opacity: 0.45,
      "overlay-opacity": 0,
    },
  },
  {
    selector: "edge[type = 'CALLED']",
    style: {
      width: "mapData(weight, 1, 40, 1, 4.5)",
      opacity: 0.55,
    },
  },
  {
    selector: "node[cycleHighlight]",
    style: {
      "border-width": 4,
      "border-color": "#F59E0B",
      "border-opacity": 1,
    },
  },
  {
    selector: "node.focused, node:selected",
    style: {
      "border-width": 2,
      "border-color": "#F4E4B8",
      "border-opacity": 1,
      opacity: 1,
    },
  },
  {
    selector: "node.neighbor",
    style: {
      opacity: 1,
      "border-width": 1,
      "border-color": "#F4E4B8",
      "border-opacity": 0.55,
    },
  },
  {
    selector: "edge.neighbor",
    style: {
      opacity: 0.95,
      width: 2,
    },
  },
  {
    selector: ".faded",
    style: {
      opacity: 0.15,
    },
  },
  {
    selector: ".ego-off",
    style: {
      display: "none",
    },
  },
];
