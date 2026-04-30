//
//  AGenUIEngineSurfaceManagerBridge.mm
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/18.
//

#import "AGenUIEngineSurfaceManagerBridge.h"
#import "AGenUIEngineBridge.h"
#include "agenui_message_listener.h"
#include "agenui_surface_manager_interface.h"
#include <memory>

// MARK: - Notification Constants

NSString * const AGenUICreateSurfaceNotification      = @"AGenUICreateSurfaceNotification";
NSString * const AGenUIUpdateComponentsNotification   = @"AGenUIUpdateComponentsNotification";
NSString * const AGenUIDeleteSurfaceNotification      = @"AGenUIDeleteSurfaceNotification";
NSString * const AGenUIActionEventRoutedNotification  = @"AGenUIActionEventRoutedNotification";

NSString * const AGenUISurfaceIdKey     = @"surfaceId";
NSString * const AGenUICatalogIdKey     = @"catalogId";
NSString * const AGenUIThemeKey         = @"theme";
NSString * const AGenUISendDataModelKey = @"sendDataModel";
NSString * const AGenUIComponentsKey    = @"components";
NSString * const AGenUIContextKey       = @"context";
NSString * const AGenUIAnimated         = @"animated";

// MARK: - C++ Event Listener (per-instance)

/// Per-instance C++ event listener.
/// Posts NSNotifications with the owning AGenUIEngineSurfaceManagerBridge as `object`,
/// so each Swift SurfaceManager can subscribe filtered by its own bridge instance.
class AGenUIInstanceEventListener : public agenui::IAGenUIMessageListener {
public:
    explicit AGenUIInstanceEventListener(void* bridge, NSInteger engineId)
        : _bridge(bridge) {
        NSString *suffix   = [NSString stringWithFormat:@"_%ld", (long)engineId];
        _createNotifName   = [AGenUICreateSurfaceNotification    stringByAppendingString:suffix];
        _updateNotifName   = [AGenUIUpdateComponentsNotification  stringByAppendingString:suffix];
        _deleteNotifName   = [AGenUIDeleteSurfaceNotification    stringByAppendingString:suffix];
        _actionNotifName   = [AGenUIActionEventRoutedNotification stringByAppendingString:suffix];
    }
    virtual ~AGenUIInstanceEventListener() = default;

    void onCreateSurface(const agenui::CreateSurfaceMessage& msg) override {
        NSMutableDictionary *themeDict = [NSMutableDictionary dictionary];
        for (const auto& pair : msg.theme) {
            themeDict[[NSString stringWithUTF8String:pair.first.c_str()]] =
                [NSString stringWithUTF8String:pair.second.c_str()];
        }

        NSString *surfaceId  = [NSString stringWithUTF8String:msg.surfaceId.c_str()];
        NSString *catalogId  = [NSString stringWithUTF8String:msg.catalogId.c_str()];
        BOOL sendDataModel   = msg.sendDataModel;
        BOOL animated        = msg.animated;

        NSDictionary *userInfo = @{
            AGenUISurfaceIdKey:     surfaceId,
            AGenUICatalogIdKey:     catalogId,
            AGenUIThemeKey:         themeDict,
            AGenUISendDataModelKey: @(sendDataModel),
            AGenUIAnimated:         @(animated)
        };

        __weak id weakBridge = (__bridge id)_bridge;
        NSString *notifName = _createNotifName;
        auto postBlock = ^{
            __strong id strongBridge = weakBridge;
            if (!strongBridge) return;
            [[NSNotificationCenter defaultCenter]
                postNotificationName:notifName
                              object:strongBridge
                            userInfo:userInfo];
        };
        if (![NSThread isMainThread]) {
            dispatch_async(dispatch_get_main_queue(), postBlock);
        } else {
            postBlock();
        }
    }

    void onUpdateComponents(const agenui::UpdateComponentsMessage& msg) override {
        NSMutableArray *componentsArray = [NSMutableArray array];
        for (const auto& component : msg.components) {
            [componentsArray addObject:[NSString stringWithUTF8String:component.c_str()]];
        }

        NSString *surfaceId = [NSString stringWithUTF8String:msg.surfaceId.c_str()];
        NSDictionary *userInfo = @{
            AGenUISurfaceIdKey:  surfaceId,
            AGenUIComponentsKey: componentsArray
        };

        __weak id weakBridge = (__bridge id)_bridge;
        NSString *notifName = _updateNotifName;
        auto postBlock = ^{
            __strong id strongBridge = weakBridge;
            if (!strongBridge) return;
            [[NSNotificationCenter defaultCenter]
                postNotificationName:notifName
                              object:strongBridge
                            userInfo:userInfo];
        };
        if (![NSThread isMainThread]) {
            dispatch_async(dispatch_get_main_queue(), postBlock);
        } else {
            postBlock();
        }
    }

    void onDeleteSurface(const agenui::DeleteSurfaceMessage& msg) override {
        NSString *surfaceId = [NSString stringWithUTF8String:msg.surfaceId.c_str()];
        NSDictionary *userInfo = @{ AGenUISurfaceIdKey: surfaceId };

        __weak id weakBridge = (__bridge id)_bridge;
        NSString *notifName = _deleteNotifName;
        auto postBlock = ^{
            __strong id strongBridge = weakBridge;
            if (!strongBridge) return;
            [[NSNotificationCenter defaultCenter]
                postNotificationName:notifName
                              object:strongBridge
                            userInfo:userInfo];
        };
        if (![NSThread isMainThread]) {
            dispatch_async(dispatch_get_main_queue(), postBlock);
        } else {
            postBlock();
        }
    }

    void onActionEventRouted(const std::string& content) override {
        NSString *context = [NSString stringWithUTF8String:content.c_str()];
        NSDictionary *userInfo = @{ AGenUIContextKey: context };

        __weak id weakBridge = (__bridge id)_bridge;
        NSString *notifName = _actionNotifName;
        auto postBlock = ^{
            __strong id strongBridge = weakBridge;
            if (!strongBridge) return;
            [[NSNotificationCenter defaultCenter]
                postNotificationName:notifName
                              object:strongBridge
                            userInfo:userInfo];
        };
        if (![NSThread isMainThread]) {
            dispatch_async(dispatch_get_main_queue(), postBlock);
        } else {
            postBlock();
        }
    }

private:
    void* _bridge;          // Weak (unretained) reference to owning ObjC bridge
    NSString* _createNotifName;
    NSString* _updateNotifName;
    NSString* _deleteNotifName;
    NSString* _actionNotifName;
};

// MARK: - AGenUIEngineSurfaceManagerBridge Private Interface

@interface AGenUIEngineSurfaceManagerBridge ()

@property (nonatomic, unsafe_unretained) agenui::ISurfaceManager* surfaceManager;
@property (nonatomic, unsafe_unretained) AGenUIInstanceEventListener* eventListener;

@end

// MARK: - AGenUIEngineSurfaceManagerBridge Implementation

@implementation AGenUIEngineSurfaceManagerBridge

- (instancetype)init {
    self = [super init];
    if (self) {
        // Create an independent C++ ISurfaceManager via the engine singleton
        _surfaceManager = (agenui::ISurfaceManager *)[AGenUIEngineBridge.sharedInstance createSurfaceManager];

        // Register per-instance event listener; use self (unretained) as bridge pointer
        if (_surfaceManager != nullptr) {
            _eventListener = new AGenUIInstanceEventListener((__bridge void*)self, self.engineId);
            _surfaceManager->addSurfaceEventListener(_eventListener);
        }
    }
    return self;
}

- (void)dealloc {
    [self teardown];
}

- (void)teardown {
    if (_surfaceManager != nullptr && _eventListener != nullptr) {
        _surfaceManager->removeSurfaceEventListener(_eventListener);
        delete _eventListener;
        _eventListener = nullptr;
    }

    if (_surfaceManager != nullptr) {
        [AGenUIEngineBridge.sharedInstance destroySurfaceManager:(void *)_surfaceManager];
        _surfaceManager = nullptr;
    }
}

- (NSInteger)engineId
{
    if (_surfaceManager == nullptr) {
        return 0;
    }
    
    return _surfaceManager->getEngineId();
}

// MARK: - Data Transmission

- (void)beginTextStream {
    if (_surfaceManager == nullptr) { return; }
    _surfaceManager->beginTextStream();
}

- (void)endTextStream {
    if (_surfaceManager == nullptr) { return; }
    _surfaceManager->endTextStream();
}

- (void)receiveTextChunk:(NSString *)data {
    if (!data || data.length == 0 || _surfaceManager == nullptr) { return; }
    std::string dataStr = [data UTF8String];
    _surfaceManager->receiveTextChunk(dataStr);
}

- (void)triggerAction:(NSString *)surfaceId
          componentId:(NSString *)componentId
              context:(NSString *)contextJson {
    if (!surfaceId || surfaceId.length == 0) { return; }
    if (!componentId || componentId.length == 0) { return; }
    if (_surfaceManager == nullptr) { return; }

    agenui::ActionMessage msg;
    msg.surfaceId         = [surfaceId UTF8String];
    msg.sourceComponentId = [componentId UTF8String];
    msg.contextJson       = contextJson ? [contextJson UTF8String] : "";
    _surfaceManager->submitUIAction(msg);
}

- (void)syncState:(NSString *)surfaceId
      componentId:(NSString *)componentId
          context:(NSString *)contextJson {
    if (!surfaceId || surfaceId.length == 0) { return; }
    if (!componentId || componentId.length == 0) { return; }
    if (_surfaceManager == nullptr) { return; }

    agenui::SyncUIToDataMessage msg;
    msg.surfaceId   = [surfaceId UTF8String];
    msg.componentId = [componentId UTF8String];
    msg.change      = contextJson ? [contextJson UTF8String] : "";
    _surfaceManager->submitUIDataModel(msg);
}

@end
