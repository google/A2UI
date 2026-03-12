import React from 'react';

/** Standard leaf margin from the implementation guide. */
export const LEAF_MARGIN = '8px';

/** Standard internal padding for visually bounded containers. */
export const CONTAINER_PADDING = '16px';

/** Standard border for cards and inputs. */
export const STANDARD_BORDER = '1px solid #ccc';

/** Standard border radius. */
export const STANDARD_RADIUS = '8px';

export const mapJustify = (j?: string) => {
  switch(j) {
    case "center": return "center";
    case "end": return "flex-end";
    case "spaceAround": return "space-around";
    case "spaceBetween": return "space-between";
    case "spaceEvenly": return "space-evenly";
    case "start": return "flex-start";
    case "stretch": return "stretch";
    default: return "flex-start";
  }
}

export const mapAlign = (a?: string) => {
  switch(a) {
    case "start": return "flex-start";
    case "center": return "center";
    case "end": return "flex-end";
    case "stretch": return "stretch";
    default: return "stretch";
  }
}

export const getBaseLeafStyle = (): React.CSSProperties => ({
  margin: LEAF_MARGIN,
  boxSizing: 'border-box'
});

export const getBaseContainerStyle = (): React.CSSProperties => ({
  margin: LEAF_MARGIN,
  padding: CONTAINER_PADDING,
  border: STANDARD_BORDER,
  borderRadius: STANDARD_RADIUS,
  boxSizing: 'border-box'
});
