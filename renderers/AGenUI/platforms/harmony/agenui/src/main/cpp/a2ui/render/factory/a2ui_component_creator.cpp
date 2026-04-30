#include "a2ui_component_creator.h"
#include "log/a2ui_capi_log.h"

// Component headers
#include "../components/text_component.h"
#include "../components/image_component.h"
#include "../components/button_component.h"
#include "../components/icon_component.h"
#include "../components/divider_component.h"
#include "../components/video_component.h"
#include "../components/audio_player_component.h"
#include "../components/modal_component.h"
#include "../components/column_component.h"
#include "../components/row_component.h"
#include "../components/card_component.h"
#include "../components/tabs_component.h"
#include "../components/list_component.h"
#include "../components/textfield_component.h"
#include "../components/checkbox_component.h"
#include "../components/slider_component.h"
#include "../components/choicepicker_component.h"
#include "../components/datetimeinput_component.h"
#include "../components/richtext_component.h"
#include "../components/table_component.h"
#include "../components/carousel_component.h"

#include "../a2ui_component_state.h"
#include "../hybrid/a2ui_hybrid_factory.h"
#include "../hybrid/a2ui_hybrid_view.h"

namespace a2ui {

A2UIComponent* A2UIComponentCreator::createComponent(const std::string& surfaceId,
                                                      const std::string& id,
                                                      const nlohmann::json& properties) {
    HM_LOGI("surfaceId=%s, type=%s, id=%s", surfaceId.c_str(), m_type.c_str(), id.c_str());
    auto createHybridComponent = [&](const std::string& type) -> A2UIComponent* {
        // Use unique_ptr so that state is automatically deleted if createHybridView
        // returns nullptr (e.g. ArkTS function not registered, or no node handle).
        // Ownership is released to the hybrid view on the success path.
        std::unique_ptr<ComponentState> state(new ComponentState(id, type, properties));
        state->setSurfaceId(surfaceId);
        state->markDirty();
        auto component = static_cast<A2UIComponent*>(A2UIHybridFactory::createHybridView(state.get()));
        if (component) {
            // The hybrid view now owns state via m_state; relinquish unique_ptr.
            state.release();
            return component;
        }
        // state is deleted here by unique_ptr – no leak on failure path.
        return new A2UIComponent(id, type);
    };

    // Base components
    if (m_type == ComponentType::kText)         return new TextComponent(id, properties);
    if (m_type == ComponentType::kImage)        return new ImageComponent(id, properties);
    if (m_type == ComponentType::kButton)       return new ButtonComponent(id, properties);
    if (m_type == ComponentType::kIcon)         return new IconComponent(id, properties);
    if (m_type == ComponentType::kDivider)      return new DividerComponent(id, properties);
    if (m_type == ComponentType::kVideo)        return new VideoComponent(id, properties);
    if (m_type == ComponentType::kAudioPlayer)  return new AudioPlayerComponent(id, properties);
    if (m_type == ComponentType::kModal)        return new ModalComponent(id, properties);

    // Layout components
    if (m_type == ComponentType::kColumn)   return new ColumnComponent(id, properties);
    if (m_type == ComponentType::kRow)      return new RowComponent(id, properties);
    if (m_type == ComponentType::kCard)     return new CardComponent(id, properties);
    if (m_type == ComponentType::kTabs)     return new TabsComponent(id, properties);
    if (m_type == ComponentType::kList)     return new ListComponent(id, properties);

    // Interactive components
    if (m_type == ComponentType::kTextField)    return new TextFieldComponent(id, properties);
    if (m_type == ComponentType::kCheckBox)     return new CheckBoxComponent(id, properties);
    if (m_type == ComponentType::kSlider)       return new SliderComponent(id, properties);
    if (m_type == ComponentType::kChoicePicker) return new ChoicePickerComponent(id, properties);
    if (m_type == ComponentType::kDateTimeInput)return new DateTimeInputComponent(id, properties);

    // Extended components
    if (m_type == ComponentType::kRichText)  return new RichTextComponent(id, properties);
    if (m_type == ComponentType::kTable)     return new TableComponent(id, properties);
    if (m_type == ComponentType::kCarousel)  return new CarouselComponent(id, properties);
    
    // Hybrid components
    if (m_type == ComponentType::kWeb) {
        return createHybridComponent(m_type);
    }

    if (A2UIHybridFactory::hasCustomComponent(m_type)) {
        HM_LOGI("A2UIComponentCreator::createComponent - Creating custom hybrid component: %s", m_type.c_str());
        return createHybridComponent(m_type);
    }

    HM_LOGW("Unknown type: %s", m_type.c_str());
    return nullptr;
}

const std::string& A2UIComponentCreator::getComponentType() const {
    return m_type;
}

void A2UIComponentCreator::setType(const std::string& type) {
    m_type = type;
}

} // namespace a2ui
