//
//  ComponentRegister.swift
//  AGenUI
//
//  Created by A2UI on 2026/4/21.
//

import Foundation

/// Global component factory registry (singleton)
internal class ComponentRegister {
    
    /// Shared singleton instance
    static let shared = ComponentRegister()
    
    /// Component factory type: (componentId, properties) -> Component
    internal typealias ComponentCreator = (String, [String: Any]) -> Component
    
    /// Registered component factories
    private var creators: [String: ComponentCreator] = [:]
    
    private init() {
        registerBuiltInComponents()
    }
    
    /// Register a component factory
    /// - Parameters:
    ///   - type: Component type identifier
    ///   - creator: Factory closure that creates Component
    func register(_ type: String, creator: @escaping ComponentCreator) {
        creators[type] = creator
        Logger.shared.debug("Registered component: \(type)")
    }
    
    /// Unregister a component factory
    /// - Parameter type: Component type identifier
    func unregister(_ type: String) {
        creators.removeValue(forKey: type)
        Logger.shared.debug("Unregistered component: \(type)")
    }
    
    /// Create a component using registered factory
    /// - Parameters:
    ///   - type: Component type
    ///   - id: Component ID
    ///   - properties: Component properties
    /// - Returns: Created component, or nil if factory not found
    func createComponent(_ type: String, id: String, properties: [String: Any]) -> Component? {
        guard let factory = creators[type] else {
            Logger.shared.error("Component factory not found for type: \(type)")
            return nil
        }
        
        let component = factory(id, properties)
        Logger.shared.debug("Created component: \(id) (\(type))")
        return component
    }
    
    private func registerBuiltInComponents() {
        // Register TextComponent
        register("Text") { id, properties in
            return TextComponent(componentId: id, properties: properties)
        }

        // Register RowComponent
        register("Row") { id, properties in
            return RowComponent(componentId: id, properties: properties)
        }

        // Register ColumnComponent
        register("Column") { id, properties in
            return ColumnComponent(componentId: id, properties: properties)
        }

        // Register DividerComponent
        register("Divider") { id, properties in
            return DividerComponent(componentId: id, properties: properties)
        }

        // Register ButtonComponent
        register("Button") { id, properties in
            return ButtonComponent(componentId: id, properties: properties)
        }

        // Register CardComponent
        register("Card") { id, properties in
            return CardComponent(componentId: id, properties: properties)
        }

        // Register ImageComponent
        register("Image") { id, properties in
            return ImageComponent(componentId: id, properties: properties)
        }

        // Register ListComponent
        register("List") { id, properties in
            return ListComponent(componentId: id, properties: properties)
        }

        // Register TableComponent
        register("Table") { id, properties in
            return TableComponent(componentId: id, properties: properties)
        }

        // Register TabsComponent
        register("Tabs") { id, properties in
            return TabsComponent(componentId: id, properties: properties)
        }

        // Register AudioPlayerComponent
        register("AudioPlayer") { id, properties in
            return AudioPlayerComponent(componentId: id, properties: properties)
        }

        // Register CarouselComponent
        register("Carousel") { id, properties in
            return CarouselComponent(componentId: id, properties: properties)
        }

        // Register TextFieldComponent
        register("TextField") { id, properties in
            return TextFieldComponent(componentId: id, properties: properties)
        }

        // Register CheckBoxComponent
        register("CheckBox") { id, properties in
            return CheckBoxComponent(componentId: id, properties: properties)
        }

        // Register SliderComponent
        register("Slider") { id, properties in
            return SliderComponent(componentId: id, properties: properties)
        }

        // Register ChoicePickerComponent
        register("ChoicePicker") { id, properties in
            return ChoicePickerComponent(componentId: id, properties: properties)
        }

        // Register DateTimeInputComponent
        register("DateTimeInput") { id, properties in
            return DateTimeInputComponent(componentId: id, properties: properties)
        }

        // Register RichTextComponent
        register("RichText") { id, properties in
            return RichTextComponent(componentId: id, properties: properties)
        }

        // Register WebComponent
        register("Web") { id, properties in
            return WebComponent(componentId: id, properties: properties)
        }

        // Register IconComponent
        register("Icon") { id, properties in
            return IconComponent(componentId: id, properties: properties)
        }

        // Register VideoComponent
        register("Video") { id, properties in
            return VideoComponent(componentId: id, properties: properties)
        }

        // Register ModalComponent
        register("Modal") { id, properties in
            return ModalComponent(componentId: id, properties: properties)
        }
        
        Logger.shared.info("Built-in components registered")
    }
}
