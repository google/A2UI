import Foundation
import A2UI

struct GalleryComponent: Identifiable, Hashable {
	let id: String
	let template: String
	let staticComponents: [StaticComponent]
	var dataModelFields: [DataModelField]
	var canEditDataModel: Bool {
		return !dataModelFields.isEmpty
	}
	var properties: [PropertyDefinition]
	var canEditProperties: Bool {
		return !properties.isEmpty
	}
	
	mutating func setProperty(_ key: String, to value: String?) {
		guard let index = properties.firstIndex(where: { $0.key == key }) else { return }
		properties[index].value = value
	}
	
	func resolveProperties(_ input: String) -> String {
		var output = input
		for prop in properties {
			let replacement = prop.mapValue?(prop.value) ?? prop.value ?? ""
			output = output.replacingOccurrences(of: "{{\(prop.key)}}", with: replacement)
		}
		return output
	}
	
	var resolvedTemplate: String {
		return resolveProperties(template)
	}
	
	var a2ui: String {
		let dataModelUpdates = dataModelFields.map { $0.updateDataModelA2UI(surfaceId: id) }
		return ([createSurfaceA2UI, updateComponentsA2UI] + dataModelUpdates)
			.joined(separator: "\n")
	}
	
	var createSurfaceA2UI: String {
		return #"{"version":"v0.9","createSurface":{"surfaceId":"\#(id)","catalogId":"a2ui.org:standard_catalog"}}"#
	}
	var updateComponentsA2UI: String {
		return #"{"version":"v0.9","updateComponents":{"surfaceId":"\#(id)","components":[\#(resolvedComponents.joined(separator: ","))]}}"#
	}
	
	var resolvedComponents: [String] {
		return [resolvedTemplate] + staticComponents.map { resolveProperties($0.rawValue) }
	}
	
	var prettyJson: String {
		let objects: [Any] = resolvedComponents.compactMap { json in
			guard let data = json.data(using: .utf8) else { return nil }
			return try? JSONSerialization.jsonObject(with: data)
		}
		guard !objects.isEmpty else { return "[]" }
		let options: JSONSerialization.WritingOptions = [.prettyPrinted, .sortedKeys]
		guard let data = try? JSONSerialization.data(withJSONObject: objects, options: options),
			  let pretty = String(data: data, encoding: .utf8) else {
			return "[\n\(resolvedComponents.joined(separator: ",\n"))\n]"
		}
		return pretty
	}
	
	static func == (lhs: GalleryComponent, rhs: GalleryComponent) -> Bool {
		return lhs.resolvedTemplate == rhs.resolvedTemplate
	}
	func hash(into hasher: inout Hasher) {
		hasher.combine(resolvedTemplate)
	}
}

