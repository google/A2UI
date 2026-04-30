//
//  AGenUIEngineSurfaceManagerBridge.h
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/18.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// MARK: - Notification Names

/// Notification sent when a new Surface is created
/// userInfo contains: surfaceId, catalogId, theme, sendDataModel, animated
extern NSString * const AGenUICreateSurfaceNotification;

/// Notification sent when components are updated
/// userInfo contains: surfaceId, components
extern NSString * const AGenUIUpdateComponentsNotification;

/// Notification sent when a Surface is deleted
/// userInfo contains: surfaceId
extern NSString * const AGenUIDeleteSurfaceNotification;

/// Notification sent when an action event is routed
/// userInfo contains: surfaceId, componentId, context
extern NSString * const AGenUIActionEventRoutedNotification;

// MARK: - Notification UserInfo Keys

extern NSString * const AGenUISurfaceIdKey;
extern NSString * const AGenUICatalogIdKey;
extern NSString * const AGenUIThemeKey;
extern NSString * const AGenUISendDataModelKey;
extern NSString * const AGenUIComponentsKey;
extern NSString * const AGenUIContextKey;

/// AGenUI Engine SurfaceManager Bridge (Multi-instance)
///
/// Each SurfaceManager holds one instance of this bridge.
/// Owns an independent C++ ISurfaceManager for isolated stream parsing, data binding and event callbacks.
/// Posts NSNotifications using self as object — subscribers must filter by object to receive only their events.
@interface AGenUIEngineSurfaceManagerBridge : NSObject

@property (nonatomic, assign, readonly) NSInteger engineId;

/// Initialize and create the C++ ISurfaceManager
- (instancetype)init;

/// Tear down: remove listener and destroy C++ ISurfaceManager
- (void)teardown;

// MARK: - Data Transmission

/// Begin a text stream session
- (void)beginTextStream;

/// End a text stream session
- (void)endTextStream;

/// Receive A2UI protocol text chunk
/// @param data Text chunk string
- (void)receiveTextChunk:(NSString *)data;

/// Trigger user action on a component
/// @param surfaceId Surface ID
/// @param componentId Component ID
/// @param contextJson Context data JSON string
- (void)triggerAction:(NSString *)surfaceId
          componentId:(NSString *)componentId
              context:(nullable NSString *)contextJson;

/// Sync UI state to data model
/// @param surfaceId Surface ID
/// @param componentId Component ID
/// @param contextJson Context data JSON string
- (void)syncState:(NSString *)surfaceId
      componentId:(NSString *)componentId
          context:(nullable NSString *)contextJson;

@end

NS_ASSUME_NONNULL_END
