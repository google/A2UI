import { z } from 'zod';

const Weight = z.number().describe("The relative weight of this component within a Row or Column. This is similar to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.");

export const CatalogCommon = {
    Weight: Weight,
};
