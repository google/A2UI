import { TemplateResult } from 'lit';
import { createStandardCatalog, Catalog } from '@a2ui/web_core/v0_9';

import { litText } from './components/text.js';
import { litButton } from './components/button.js';
import { litCard } from './components/card.js';
import { litColumn, litRow } from './components/container.js';
import { litImage } from './components/image.js';
import { litIcon } from './components/icon.js';
import { litTextField } from './components/text-field.js';
import { litCheckBox } from './components/check-box.js';
import { litChoicePicker } from './components/choice-picker.js';
import { litSlider } from './components/slider.js';
import { litDateTimeInput } from './components/date-time-input.js';
import { litVideo } from './components/video.js';
import { litAudioPlayer } from './components/audio-player.js';
import { litDivider } from './components/divider.js';
import { litList } from './components/list.js';
import { litTabs } from './components/tabs.js';
import { litModal } from './components/modal.js';

export { litText, litButton, litCard, litColumn, litRow, litImage, litIcon };

export function createLitStandardCatalog(): Catalog<TemplateResult> {
    return createStandardCatalog({
        Text: litText,
        Button: litButton,
        Card: litCard,
        Column: litColumn,
        Row: litRow,
        Image: litImage,
        Icon: litIcon,
        TextField: litTextField,
        CheckBox: litCheckBox,
        ChoicePicker: litChoicePicker,
        Slider: litSlider,
        DateTimeInput: litDateTimeInput,
        Video: litVideo,
        AudioPlayer: litAudioPlayer,
        Divider: litDivider,
        List: litList,
        Tabs: litTabs,
        Modal: litModal
    });
}
