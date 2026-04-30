#pragma once
#include <memory>
#include <vector>

namespace agenui {
class IPlatformLayoutBridge {

public:
    virtual ~IPlatformLayoutBridge() {}

public:
    enum DeviceOrientation {
        eOrientationuUknown,
        eOrientationPortrait = 1,
        eOrientationPortraitUpsideDown,
        eOrientationLandscapeLeft,
        eOrientationLandscapeRight,
    };

    class IDeviceConfigChangeObserver {
    public:
        virtual void onDeviceOrientationChanged(DeviceOrientation newOrientation) = 0;
    };

    struct MeasureSize {
        int lines;
        float width;
        float height;
        std::vector<int> countOfLines;
    };

    enum MeasureMode {
        MeasureModeUndefined,
        MeasureModeExactly,
        MeasureModeAtMost,
    };

    enum TextOverflow {
        TextOverflowUndefined,
        TextOverflowClip,
        TextOverflowEllipsis,
    };

    struct TextMeasureParam {
        const char* text;
        int fontSize;
        int fontWeight;
        int fontStyle;
        int textAlign;
        bool isMultLineHeight;
        float lineHeight;
        int maxLines;
        bool isRichtext;
        int textOverflow;
        long id;
        const char* fontFamily;
        const char* extras;
        float letter_spacing;
        long ctx_id;
    };

    struct ImgMeasureParam {
        const char* src;
    };

    struct LottieMeasureParam {
        const char* url;        // Lottie animation URL or path
        long id;                // Component ID
    };

    struct ChartMeasureParam {
        const char* type;       // Chart type: "donut", "line", "bar"
        const char* data;       // Chart data JSON string
        const char* config;     // Chart config JSON string
        long id;                // Component ID
    };

    class ILayoutMeasurement {
    public:
        virtual ~ILayoutMeasurement() {}
    };

    class ITextMeasurement : public ILayoutMeasurement {
    public:
        virtual MeasureSize measure(const TextMeasureParam &param,
            float width, MeasureMode widthMode, float height, MeasureMode heightMode) = 0;

        virtual float getBaselineOfFirstLine(const TextMeasureParam &param,
            float width, MeasureMode widthMode, float height, MeasureMode heightMode) = 0;
    };

    class IImgMeasurement : public ILayoutMeasurement {
    public:
        virtual MeasureSize measure(const ImgMeasureParam &param,
            float width, MeasureMode widthMode, float height, MeasureMode heightMode) = 0;
    };

    class ILottieMeasurement : public ILayoutMeasurement {
    public:
        virtual MeasureSize measure(const LottieMeasureParam &param,
            float width, MeasureMode widthMode, float height, MeasureMode heightMode) = 0;
    };

    class IChartMeasurement : public ILayoutMeasurement {
    public:
        virtual MeasureSize measure(const ChartMeasureParam &param,
            float width, MeasureMode widthMode, float height, MeasureMode heightMode) = 0;
    };

public:
    virtual ITextMeasurement* getTextMeasurement() = 0;
    virtual IImgMeasurement* getImgMeasurement() = 0;
    virtual ILottieMeasurement* getLottieMeasurement() = 0;
    virtual IChartMeasurement* getChartMeasurement() = 0;

    virtual int getDeviceWidth() = 0;
    virtual int getDeviceHeight() = 0;
    virtual DeviceOrientation getDeviceOrientation() = 0;
    virtual float getDeviceDensity() = 0;

    virtual void registerDeviceConfigChangeObserver(IDeviceConfigChangeObserver *observer) = 0;

    virtual const char* getComponentStyles() = 0;
};

} // namespace agenui
