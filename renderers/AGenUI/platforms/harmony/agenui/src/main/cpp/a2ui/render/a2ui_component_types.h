#pragma once

#include <string>

namespace a2ui {
namespace ComponentType {

    // Base components
    static const std::string kText          = "Text";
    static const std::string kButton        = "Button";
    static const std::string kImage         = "Image";
    static const std::string kIcon          = "Icon";
    static const std::string kDivider       = "Divider";
    static const std::string kVideo         = "Video";
    static const std::string kAudioPlayer   = "AudioPlayer";
    static const std::string kModal         = "Modal";

    // Layout components
    static const std::string kColumn        = "Column";
    static const std::string kRow           = "Row";
    static const std::string kCard          = "Card";
    static const std::string kTabs          = "Tabs";
    static const std::string kList          = "List";

    // Interactive components
    static const std::string kTextField     = "TextField";
    static const std::string kCheckBox      = "CheckBox";
    static const std::string kSlider        = "Slider";
    static const std::string kChoicePicker  = "ChoicePicker";
    static const std::string kDateTimeInput = "DateTimeInput";

    // Extended components
    static const std::string kRichText      = "RichText";
    static const std::string kLottie        = "Lottie";
    static const std::string kWeb           = "Web";
    static const std::string kTable         = "Table";
    static const std::string kCarousel      = "Carousel";

} // namespace ComponentType
} // namespace a2ui
