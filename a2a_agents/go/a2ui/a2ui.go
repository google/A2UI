package a2ui

// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import (
	"context"
	"fmt"
	"log"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"
)

const (
	// ExtensionURI is the URI for the A2UI extension.
	ExtensionURI = "https://a2ui.org/a2a-extension/a2ui/v0.8"

	// MIMETypeKey is the key for the MIME type in metadata.
	MIMETypeKey = "mimeType"
	// MIMEType is the MIME type for A2UI data.
	MIMEType = "application/json+a2ui"

	// ClientCapabilitiesKey is the key for A2UI client capabilities.
	ClientCapabilitiesKey = "a2uiClientCapabilities"
	// SupportedCatalogIDsKey is the key for supported catalog IDs.
	SupportedCatalogIDsKey = "supportedCatalogIds"
	// InlineCatalogsKey is the key for inline catalogs.
	InlineCatalogsKey = "inlineCatalogs"

	// StandardCatalogID is the ID for the standard catalog.
	StandardCatalogID = "https://github.com/google/A2UI/blob/main/specification/v0_8/json/standard_catalog_definition.json"

	// AgentExtensionSupportedCatalogIDsKey is the parameter key for supported catalogs in the agent extension.
	AgentExtensionSupportedCatalogIDsKey = "supportedCatalogIds"
	// AgentExtensionAcceptsInlineCatalogsKey is the parameter key for accepting inline catalogs.
	AgentExtensionAcceptsInlineCatalogsKey = "acceptsInlineCatalogs"
)

// CreateA2UIPart creates an A2A Part containing A2UI data.
func CreateA2UIPart(a2uiData map[string]interface{}) a2a.Part {
	return &a2a.DataPart{
		Data: a2uiData,
		Metadata: map[string]interface{}{
			MIMETypeKey: MIMEType,
		},
	}
}

// GetA2UIDataPart extracts the DataPart containing A2UI data from an A2A Part, if present.
func GetA2UIDataPart(part a2a.Part) (*a2a.DataPart, error) {
	dp, ok := part.(*a2a.DataPart)
	if !ok {
		return nil, fmt.Errorf("part is not a DataPart")
	}
	if dp.Metadata != nil && dp.Metadata[MIMETypeKey] == MIMEType {
		return dp, nil
	}
	return nil, fmt.Errorf("part is not an A2UI part")
}

// GetA2UIAgentExtension creates the A2UI AgentExtension configuration.
func GetA2UIAgentExtension(acceptsInlineCatalogs bool, supportedCatalogIDs []string) *a2a.AgentExtension {
	params := make(map[string]interface{})

	if acceptsInlineCatalogs {
		params[AgentExtensionAcceptsInlineCatalogsKey] = true
	}

	if len(supportedCatalogIDs) > 0 {
		params[AgentExtensionSupportedCatalogIDsKey] = supportedCatalogIDs
	}

	var paramsOrNil map[string]interface{}
	if len(params) > 0 {
		paramsOrNil = params
	}

	return &a2a.AgentExtension{
		URI:         ExtensionURI,
		Description: "Provides agent driven UI using the A2UI JSON format.",
		Params:      paramsOrNil,
	}
}

// TryActivateA2UIExtension activates the A2UI extension if requested.
func TryActivateA2UIExtension(ctx context.Context) bool {
	exts, ok := a2asrv.ExtensionsFrom(ctx)
	if !ok {
		log.Println("TryActivateA2UIExtension: No extensions found in context")
		return false
	}

	a2uiExt := &a2a.AgentExtension{URI: ExtensionURI}
	requested := exts.Requested(a2uiExt)

	log.Printf("TryActivateA2UIExtension: Checking URI %s. Requested: %v", ExtensionURI, requested)

	if requested {
		exts.Activate(a2uiExt)
		return true
	}
	return false
}
