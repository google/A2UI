//
//  AGenUIEngineBridge.h
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/18.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// MARK: - FunctionCall Callback Type Definitions

/// FunctionCall execution callback
/// @param args JSON string of arguments
/// @return JSON string of execution result
typedef NSString* _Nullable (^AGenUIFunctionCallCallback)(NSString *args);

/// AGenUI Engine Bridge (Singleton)
///
/// Manages the global IAGenUIEngine lifecycle and all engine-level configurations:
/// theme, DesignToken, day/night mode, Skill registration, working directory, etc.
///
/// Use AGenUIEngineSurfaceManagerBridge for per-instance data transmission.
@interface AGenUIEngineBridge : NSObject

// MARK: - Singleton

/// Shared singleton instance
+ (instancetype)sharedInstance;

// MARK: - Theme Configuration

/// Load theme configuration
/// @param themeConfigJson Theme configuration JSON string
/// @return Whether loading succeeded
- (BOOL)loadThemeConfig:(NSString *)themeConfigJson;

// MARK: - DesignToken Configuration

/// Load DesignToken configuration
/// @param designTokenConfigJson DesignToken configuration JSON string
/// @return Whether loading succeeded
- (BOOL)loadDesignTokenConfig:(NSString *)designTokenConfigJson;

// MARK: - Theme Mode Management

/// Set day/night mode
/// @param mode Mode configuration, "light" or "dark"
- (void)setDayNightMode:(NSString *)mode;

// MARK: - FunctionCall / Skill Management

/// Register FunctionCall (Skill)
/// @param functionCallName FunctionCall name
/// @param configJson FunctionCall configuration JSON string
/// @param callback FunctionCall execution callback block
/// @return Whether registration succeeded
- (BOOL)registerFunction:(NSString *)functionCallName
                      config:(NSString *)configJson
                    callback:(nullable AGenUIFunctionCallCallback)callback;

/// Get registered FunctionCall callback (for internal use by FuncInvoker)
/// @param functionCallName FunctionCall name
/// @return FunctionCall callback, returns nil if not found
- (nullable AGenUIFunctionCallCallback)getFunctionCallCallback:(NSString *)functionCallName;

/// Unregister a previously registered FunctionCall
/// @param functionCallName FunctionCall name to unregister
/// @note Must be called before the associated callback is deallocated to prevent dangling pointers
- (void)unregisterFunction:(NSString *)functionCallName;

// MARK: - C++ SurfaceManager Factory (Internal Use)

/// Create a new C++ ISurfaceManager instance
/// Called by AGenUIEngineSurfaceManagerBridge on init
/// @return Opaque pointer to ISurfaceManager (caller must destroy via destroyCXXSurfaceManager:)
- (void *)createSurfaceManager;

/// Destroy a C++ ISurfaceManager instance
/// @param surfaceManager Opaque pointer returned by createCXXSurfaceManager
- (void)destroySurfaceManager:(void *)surfaceManager;

@end

NS_ASSUME_NONNULL_END
