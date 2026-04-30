#include "agenui_component_property_spec.h"

namespace agenui {

ComponentPropertySpec::ComponentPropertySpec(std::map<std::string, PropertySpec> properties,
                                             PropertyValueMap defaultStyles)
    : _properties(std::move(properties)),
      _defaultStyles(std::move(defaultStyles)) {
}
const std::map<std::string, PropertySpec>& ComponentPropertySpec::getProperties() const {
    return _properties;
}

const PropertyValueMap& ComponentPropertySpec::getDefaultStyles() const {
    return _defaultStyles;
}

}  // namespace agenui
