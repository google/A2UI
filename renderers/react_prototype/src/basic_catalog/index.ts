import { Catalog } from "@a2ui/web_core/v0_9";
import { BASIC_FUNCTIONS } from "@a2ui/web_core/v0_9/basic_catalog";
import type { ReactComponentImplementation } from "../adapter";

import { ReactText } from "./components/ReactText";
import { ReactImage } from "./components/ReactImage";
import { ReactIcon } from "./components/ReactIcon";
import { ReactVideo } from "./components/ReactVideo";
import { ReactAudioPlayer } from "./components/ReactAudioPlayer";
import { ReactRow } from "./components/ReactRow";
import { ReactColumn } from "./components/ReactColumn";
import { ReactList } from "./components/ReactList";
import { ReactCard } from "./components/ReactCard";
import { ReactTabs } from "./components/ReactTabs";
import { ReactDivider } from "./components/ReactDivider";
import { ReactModal } from "./components/ReactModal";
import { ReactButton } from "./components/ReactButton";
import { ReactTextField } from "./components/ReactTextField";
import { ReactCheckBox } from "./components/ReactCheckBox";
import { ReactChoicePicker } from "./components/ReactChoicePicker";
import { ReactSlider } from "./components/ReactSlider";
import { ReactDateTimeInput } from "./components/ReactDateTimeInput";

const basicComponents: ReactComponentImplementation[] = [
  ReactText,
  ReactImage,
  ReactIcon,
  ReactVideo,
  ReactAudioPlayer,
  ReactRow,
  ReactColumn,
  ReactList,
  ReactCard,
  ReactTabs,
  ReactDivider,
  ReactModal,
  ReactButton,
  ReactTextField,
  ReactCheckBox,
  ReactChoicePicker,
  ReactSlider,
  ReactDateTimeInput,
];

export const basicCatalog = new Catalog<ReactComponentImplementation>(
  "https://a2ui.org/specification/v0_9/basic_catalog.json",
  basicComponents,
  BASIC_FUNCTIONS
);

export {
  ReactText,
  ReactImage,
  ReactIcon,
  ReactVideo,
  ReactAudioPlayer,
  ReactRow,
  ReactColumn,
  ReactList,
  ReactCard,
  ReactTabs,
  ReactDivider,
  ReactModal,
  ReactButton,
  ReactTextField,
  ReactCheckBox,
  ReactChoicePicker,
  ReactSlider,
  ReactDateTimeInput,
};
