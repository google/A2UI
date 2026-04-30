//
//  AGenUIEngineFunction.mm
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/21.
//

#import "AGenUIEngineFunction.h"
#import "AGenUIEngineBridge.h"

namespace agenui {

AGenUIEngineFunction::AGenUIEngineFunction(void* bridge, const std::string& functionName)
    : _bridge(bridge), _functionName(functionName) {
}

AGenUIEngineFunction::~AGenUIEngineFunction() {
    _bridge = nullptr;
}

FunctionCallResult AGenUIEngineFunction::callSync(const std::string& params) {
    @autoreleasepool {
        FunctionCallResult result;
        result.status = FunctionCallStatus::Error;

        // 1. Validate bridge
        if (_bridge == nullptr) {
            result.error = "Bridge is null";
            return result;
        }

        AGenUIEngineBridge* bridge = (__bridge AGenUIEngineBridge*)_bridge;

        // 2. Retrieve callback by function name
        NSString* functionNameNS = [NSString stringWithUTF8String:_functionName.c_str()];
        AGenUIFunctionCallCallback callback = [bridge getFunctionCallCallback:functionNameNS];
        if (callback == nil) {
            result.error = "FunctionCall not found: " + _functionName;
            return result;
        }

        // 3. Execute callback with params
        NSString* paramsNS = [NSString stringWithUTF8String:params.c_str()];
        NSString* resultNS = callback(paramsNS);
        if (resultNS == nil) {
            result.error = "FunctionCall execution returned nil";
            return result;
        }

        // 4. Parse result
        std::string resultStr = [resultNS UTF8String];
        return parseFunctionCallResult(resultStr);
    }
}

FunctionCallResult AGenUIEngineFunction::callAsync(const std::string& params,
                                                               const FunctionCallCallback& callback) {
    @autoreleasepool {
        FunctionCallResult result;
        result.status = FunctionCallStatus::Error;

        // 1. Validate bridge
        if (_bridge == nullptr) {
            result.error = "Bridge is null";
            return result;
        }

        AGenUIEngineBridge* bridge = (__bridge AGenUIEngineBridge*)_bridge;

        // 2. Retrieve OC callback by function name
        NSString* functionNameNS = [NSString stringWithUTF8String:_functionName.c_str()];
        AGenUIFunctionCallCallback ocCallback = [bridge getFunctionCallCallback:functionNameNS];
        if (ocCallback == nil) {
            result.error = "FunctionCall not found: " + _functionName;
            return result;
        }

        // 3. Execute asynchronously on a background queue
        NSString* paramsNS = [NSString stringWithUTF8String:params.c_str()];
        FunctionCallCallback cppCallback = callback;

        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            @autoreleasepool {
                NSString* resultNS = ocCallback(paramsNS);

                FunctionCallResult asyncResult;
                if (resultNS == nil) {
                    asyncResult.status = FunctionCallStatus::Error;
                    asyncResult.error = "FunctionCall execution returned nil";
                } else {
                    std::string resultStr = [resultNS UTF8String];
                    asyncResult = parseFunctionCallResult(resultStr);
                }

                cppCallback(asyncResult);
            }
        });

        // 4. Return pending status immediately
        result.status = FunctionCallStatus::Pending;
        return result;
    }
}

FunctionCallResult AGenUIEngineFunction::parseFunctionCallResult(const std::string& resultJson) {
    FunctionCallResult result;
    result.status = FunctionCallStatus::Error;

    try {
        // Parse JSON using NSJSONSerialization to avoid nlohmann dependency
        NSString* jsonNS = [NSString stringWithUTF8String:resultJson.c_str()];
        NSData* jsonData = [jsonNS dataUsingEncoding:NSUTF8StringEncoding];
        if (jsonData == nil) {
            result.error = "Failed to convert result to data";
            return result;
        }

        NSError* parseError = nil;
        NSDictionary* resultDict = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                   options:0
                                                                     error:&parseError];
        if (parseError != nil || resultDict == nil) {
            result.error = "Failed to parse result JSON: " + resultJson;
            return result;
        }

        NSString* status = resultDict[@"status"];
        if ([status isEqualToString:@"Success"]) {
            result.status = FunctionCallStatus::Success;
            NSString* data = resultDict[@"data"];
            if (data != nil) {
                if ([data isKindOfClass:[NSString class]]) {
                    result.data = [data UTF8String];
                } else {
                    // data might be a dictionary/array, serialize it back to JSON string
                    NSData* dataJson = [NSJSONSerialization dataWithJSONObject:data options:0 error:nil];
                    if (dataJson != nil) {
                        result.data = std::string((const char*)[dataJson bytes], [dataJson length]);
                    }
                }
            }
        } else if ([status isEqualToString:@"Error"]) {
            result.status = FunctionCallStatus::Error;
            NSString* error = resultDict[@"error"];
            result.error = error ? [error UTF8String] : "Unknown error";
        } else if ([status isEqualToString:@"Pending"]) {
            result.status = FunctionCallStatus::Pending;
        } else {
            result.error = "Unknown status in result: " + resultJson;
        }
    } catch (const std::exception& e) {
        result.error = std::string("Failed to parse result: ") + e.what();
    }

    return result;
}

} // namespace agenui
