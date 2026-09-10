import type { StylesheetJson } from "cytoscape";

const LABEL_STYLE = {
  label: "data(label)",
  color: "#E8EEF7",
  "font-size": 9,
  "font-family": "Segoe UI, system-ui, sans-serif",
  "font-weight": 600,
  "text-valign": "bottom",
  "text-halign": "center",
  "text-margin-y": 6,
  "text-max-width": "88px",
  "text-wrap": "wrap",
  "text-outline-width": 3,
  "text-outline-color": "#0B1220",
  "text-outline-opacity": 1,
  "text-background-color": "#0B1220",
  "text-background-opacity": 0.92,
  "text-background-padding": "3px",
  "text-background-shape": "roundrectangle",
  "text-events": "no",
  "z-index": 20,
} as const;

export const canvasStylesheet: StylesheetJson = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      width: "data(size)",
      height: "data(size)",
      label: "",
      color: "#D7E0EC",
      "font-size": 9,
      "font-family": "Segoe UI, system-ui, sans-serif",
      "text-valign": "bottom",
      "text-halign": "center",
      "overlay-padding": 4,
      "overlay-opacity": 0,
      "border-width": 0,
      "border-color": "#F4E4B8",
      "min-zoomed-font-size": 0,
      "text-events": "no",
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.1,
      "line-color": "data(color)",
      "curve-style": "haystack",
      "haystack-radius": 0.55,
      opacity: 0.18,
      "overlay-opacity": 0,
    },
  },
  {
    selector: "edge[type = 'PAID']",
    style: {
      "line-color": "#C9A227",
      opacity: 0.2,
      width: 1.35,
    },
  },
  {
    selector: "edge[type = 'CALLED']",
    style: {
      "line-color": "#6B8499",
      width: "mapData(weight, 1, 40, 1, 4)",
      opacity: 0.42,
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
  {
    selector: "node.labeled, node.hovered, node:selected, node.focused",
    style: {
      ...LABEL_STYLE,
    },
  },
  {
    selector: "node:selected, node.focused",
    style: {
      "font-size": 11,
    },
  },
];
