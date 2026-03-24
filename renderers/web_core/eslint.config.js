import {config as ignores} from "./eslint.ignores.js";
import gts from "gts";

const customConfig = [{ignores}];
export default [...customConfig, ...gts];
