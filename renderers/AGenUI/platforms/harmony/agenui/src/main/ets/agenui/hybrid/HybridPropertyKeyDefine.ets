export enum Keys {
  NODE_PROPERTY_START = 0x3f000000,
  // position property
  NODE_PROPERTY_FLEX_VALUE_CENTER = NODE_PROPERTY_START + 0x01,   // center
  // layout
  // left, top, right & bottom are special, because they are not only the text-align's values,
  // but also as the keys of flex layout.
  NODE_PROPERTY_LEFT              = NODE_PROPERTY_START + 0x02,   // left : CssPropertyFloat
  NODE_PROPERTY_TOP               = NODE_PROPERTY_START + 0x04,   // top : CssPropertyFloat
  NODE_PROPERTY_RIGHT             = NODE_PROPERTY_START + 0x08,   // right : CssPropertyFloat
  NODE_PROPERTY_BOTTOM            = NODE_PROPERTY_START + 0x10,   // bottom : CssPropertyFloat

  // layout
  NODE_PROPERTY_LAYOUT_START,
  NODE_PROPERTY_WIDTH,                // width : CssPropertyFloat
  NODE_PROPERTY_HEIGHT,               // height : CssPropertyFloat
  NODE_PROPERTY_BORDER_WIDTH,         // border-width : CssPropertyMargin
  NODE_PROPERTY_FLEX_DIRECTION,       // flex-direction : CssPropertyInt
  NODE_PROPERTY_FLEX_WRAP,            // flex-wrap : CssPropertyInt
  NODE_PROPERTY_FLEX_JUSTIFY_CONTENT, // justify-content : CssPropertyInt
  NODE_PROPERTY_FLEX_ALIGN_ITEMS,     // align-items : CssPropertyInt
  NODE_PROPERTY_FLEX_ALIGN_CONTENT,   // align-content : CssPropertyInt
  NODE_PROPERTY_ASPECT_RATIO,         // aspect-ratio : CssPropertyFloat
  NODE_PROPERTY_FLEX_FLEX,            // flex : CssPropertyInt
  NODE_PROPERTY_FLEX_GROW,            // flex-grow : CssPropertyInt
  NODE_PROPERTY_FLEX_SHRINK,          // flex-shrink : CssPropertyInt
  NODE_PROPERTY_FLEX_BASIS,           // flex-basis : CssPropertyInt
  NODE_PROPERTY_FLEX_ALIGN_SELF,      // align-self : CssPropertyInt
  NODE_PROPERTY_FLEX_MARGIN,          // margin : CssPropertyMargin
  NODE_PROPERTY_FLEX_MARGIN_LEFT,     // margin-left : CssPropertyInt
  NODE_PROPERTY_FLEX_MARGIN_RIGHT,    // margin-right : CssPropertyInt
  NODE_PROPERTY_FLEX_MARGIN_TOP,      // margin-top : CssPropertyInt
  NODE_PROPERTY_FLEX_MARGIN_BOTTOM,   // margin-bottom : CssPropertyInt
  NODE_PROPERTY_FLEX_OVERFLOW,        // overflow : CssPropertyInt
  NODE_PROPERTY_FLEX_MIN_WIDTH,       // min-width : CssPropertyFloat
  NODE_PROPERTY_FLEX_MIN_HEIGHT,      // min-height : CssPropertyFloat
  NODE_PROPERTY_FLEX_MAX_WIDTH,       // max-width : CssPropertyFloat
  NODE_PROPERTY_FLEX_MAX_HEIGHT,      // max-height : CssPropertyFloat
  NODE_PROPERTY_FLEX_PADDING,         // padding : CssPropertyMargin
  NODE_PROPERTY_FLEX_PADDING_LEFT,    // padding-left : CssPropertyInt
  NODE_PROPERTY_FLEX_PADDING_RIGHT,   // padding-right : CssPropertyInt
  NODE_PROPERTY_FLEX_PADDING_TOP,     // padding-top : CssPropertyInt
  NODE_PROPERTY_FLEX_PADDING_BOTTOM,  // padding-bottom : CssPropertyInt
  NODE_PROPERTY_DISPLAY,              // display : CssPropertyInt
  NODE_PROPERTY_LINE_CLAMP,           // line-clamp : CssPropertyInt
  NODE_PROPERTY_LINE_HEIGHT,          // line-height : CssPropertyLineHeight
  NODE_PROPERTY_POSITION,             // position : CssPropertyInt
  NODE_PROPERTY_FONT_SIZE,            // font-size : CssPropertyInt
  NODE_PROPERTY_FONT_WEIGHT,          // font-weight : CssPropertyInt
  NODE_PROPERTY_FONT_STYLE,           // font-style : CssPropertyString
  NODE_PROPERTY_FONT_FAMILY,          // font-family : CssPropertyString
  NODE_PROPERTY_LETTER_SPACING,       // letter-spacing : CssPropertyFloat
  NODE_PROPERTY_FONT,                 // font : CssPropertyInt
  NODE_PROPERTY_LAYOUT_END,

  NODE_PROPERTY_BORDER_COLOR,         // border-color : CssPropertyColor
  NODE_PROPERTY_BORDER_STYLE,         // border-style : CssPropertyString
  NODE_PROPERTY_COLOR,                // color : CssPropertyColor
  NODE_PROPERTY_TEXT_ALIGN,           // text-align : CssPropertyAlign
  NODE_PROPERTY_TEXT_OVERFLOW,        // text-overflow : CssPropertyInt (NODE_PROPERTY_TEXT_OVERFLOW_CLIP/NODE_PROPERTY_TEXT_OVERFLOW_ELLIPSIS)
  NODE_PROPERTY_TEXT_DECORATION,      // text-decoration : CssPropertyString
  NODE_PROPERTY_BACKGROUND_COLOR,     // background-color : CssPropertyColor
  NODE_PROPERTY_INPUT_TYPE,           // inputtype : CssPropertyString
  NODE_PROPERTY_KEYBOARD,             // keyboard : CssPropertyString
  NODE_PROPERTY_ROWS,                 // rows : CssPropertyInt
  NODE_PROPERTY_BACKGROUND_IMAGE,     // background-image : CssPropertyString
  NODE_PROPERTY_BACKGROUND,           // background : CssPropertyString
  NODE_PROPERTY_VISIBILITY,           // visibility : CssPropertyInt
  NODE_PROPERTY_BORDER_RADIUS,        // border-radius : CssPropertyMargin
  NODE_PROPERTY_BACKGROUND_SIZE,      // background-size : CssPropertyInt
  NODE_PROPERTY_FILL_MODE,            // fill-mode : CssPropertyInt
  NODE_PROPERTY_OPACITY,              // opacity : CssPropertyFloat
  NODE_PROPERTY_TRANSFORM,            // transform : CssPropertyFloat
  NODE_PROPERTY_TRANSFORM_ORIGIN,     // transform-origin : CssPropertyTransformOrigin
  NODE_PROPERTY_IMAGE_STRETCH,        // imagestretch : CssPropertyMargin
  NODE_PROPERTY_BG_STRETCH,           // backgroundstretch : CssPropertyMargin
  NODE_PROPERTY_ORIENTATION,          // orientation : CssPropertyOrientation
  NODE_PROPERTY_BOUNCE,               // bounce : CssPropertyString
  NODE_PROPERTY_INDICATOR,            // indicator : CssPropertyBool
  NODE_PROPERTY_DEFAULT_IMG,          // default-img : CssPropertyString
  NODE_PROPERTY_CAPTURE_HOVER,        // capturehover : CssPropertyInt (none/self/content/self-content)
  NODE_PROPERTY_HOVER_BOUNDARY,       // hoverboundary : CssPropertyBool
  NODE_PROPERTY_PLACEHOLDER_COLOR,    // placeholder-color : CssPropertyColor
  NODE_PROPERTY_PLACEHOLDER_SIZE,     // placeholder-size : CssPropertyInt
  NODE_PROPERTY_WHITE_SPACE,          // white-space : CssPropertyInt
  NODE_PROPERTY_OHOS_SUPPORTED,       //

  NODE_PROPERTY_FILTER,               // filter : CssPropertyFilter
  NODE_PROPERTY_FILTER_BLUR,          // blur : CssPropertyInt
  NODE_PROPERTY_FILTER_BRIGHTNESS,    // brightness : CssPropertyFloat
  NODE_PROPERTY_FILTER_SATURATE,      // saturate : CssPropertyFloat
  NODE_PROPERTY_FILTER_DROP_SHADOW,   // drop-shadow : CssPropertyDropShadow
  NODE_PROPERTY_BACKDROP_FILTER,      // backdrop-filter. only blur is supported until now.
  // xml property
  NODE_PROPERTY_TEXT,                 // text : CssPropertyString
  NODE_PROPERTY_VALUE,                // value : CssPropertyString
  NODE_PROPERTY_PLACEHOLDER,          // placeholder : CssPropertyString
  NODE_PROPERTY_ID,                   // id : CssPropertyString
  NODE_PROPERTY_X,                    // x : CssPropertyString
  NODE_PROPERTY_LINE,                 // _line: source line number for the node
  NODE_PROPERTY_CLASS,                // class : CssPropertyString
  NODE_PROPERTY_IMAGE_SRC,            // src : CssPropertyString
  NODE_PROPERTY_STYLE,                // style : CssPropertyString

  // flex property value
  NODE_PROPERTY_FLEX_VALUE_ROW,               // row
  NODE_PROPERTY_FLEX_VALUE_ROW_REVERSE,       // row-reverse
  NODE_PROPERTY_FLEX_VALUE_COLUMN,            // column
  NODE_PROPERTY_FLEX_VALUE_COLUMN_REVERSE,    // column-reverse
  NODE_PROPERTY_FLEX_VALUE_NOWRAP,            // nowrap
  NODE_PROPERTY_FLEX_VALUE_WRAP,              // wrap
  NODE_PROPERTY_FLEX_VALUE_WRAP_REVERSE,      // wrap-reverse
  NODE_PROPERTY_FLEX_VALUE_FLEX_START,        // flex-start
  NODE_PROPERTY_FLEX_VALUE_FLEX_END,          // flex-end
  NODE_PROPERTY_FLEX_VALUE_SPACE_BETWEEN,     // space-between
  NODE_PROPERTY_FLEX_VALUE_SPACE_AROUND,      // space-around
  NODE_PROPERTY_FLEX_VALUE_BASELINE,          // baseline
  NODE_PROPERTY_FLEX_VALUE_STRETCH,           // stretch
  // flex overflow property value
  NODE_PROPERTY_FLEX_VALUE_OVERFLOW_VISIBLE,  // visible
  NODE_PROPERTY_FLEX_VALUE_OVERFLOW_HIDDEN,   // hidden
  NODE_PROPERTY_FLEX_VALUE_OVERFLOW_SCROLL,   // scroll

  NODE_PROPERTY_TEXT_OVERFLOW_UNDEFINED,      //
  NODE_PROPERTY_TEXT_OVERFLOW_CLIP,           // clip
  NODE_PROPERTY_TEXT_OVERFLOW_ELLIPSIS,       // ellipsis
  NODE_PROPERTY_TEXT_OVERFLOW_MIDDLE,         // middle
  NODE_PROPERTY_TEXT_OVERFLOW_HEAD,           // head

  NODE_PROPERTY_VALUE_NONE,                   // none
  NODE_PROPERTY_VALUE_SELF,                   // self
  NODE_PROPERTY_VALUE_CONTENT,                // content
  NODE_PROPERTY_VALUE_SELF_CONTENT,           // self-content
  NODE_PROPERTY_VALUE_ALL,                    // all
  NODE_PROPERTY_VALUE_AUTO,
  NODE_PROPERTY_VALUE_HIGHLIGHT,
  NODE_PROPERTY_VALUE_LIFT,
  NODE_PROPERTY_VALUE_CAPSULE,
  NODE_PROPERTY_VALUE_CIRCLE,

  // position property value
  NODE_PROPERTY_POSITION_ABSOLUTE,            // absolute
  NODE_PROPERTY_POSITION_RELATIVE,            // relative

  // font-weight & font-style property value
  NODE_PROPERTY_FONT_NORMAL,           // normal
  NODE_PROPERTY_FONT_BOLD,             // bold
  NODE_PROPERTY_FONT_BOLDER,           // bolder
  NODE_PROPERTY_FONT_ITALIC,           // italic
  NODE_PROPERTY_FONT_ULTRALIGHT,       // ultralight
  NODE_PROPERTY_FONT_THIN,             // thin
  NODE_PROPERTY_FONT_LIGHT,            // light
  NODE_PROPERTY_FONT_MEDIUM,           // medium

  // orientation value
  NODE_PROPERTY_ORIENTATION_VERTICAL,         // vertical
  NODE_PROPERTY_ORIENTATION_HORIZONTAL,       // horizontal

  // background-size value
  NODE_PROPERTY_FILL_MODE_COVER,                  // cover
  NODE_PROPERTY_FILL_MODE_CONTAIN,                // contain
  NODE_PROPERTY_FILL_MODE_HUNDRED_PERCENT,        // 100%
  NODE_PROPERTY_FILL_MODE_ADAPT,                  // adapt

  //transition
  NODE_PROPERTY_TRANSITION,                       // transition
  NODE_PROPERTY_ANIMATION,                       // animation

  NODE_TYPE_BASE,         // node
  // layout
  NODE_TYPE_FLEX,         // div
  // view
  NODE_TYPE_LABEL,        // label
  NODE_TYPE_HTML,         // richtext
  NODE_TYPE_INPUT,        // input
  NODE_TYPE_TEXT_AREA,    // textarea
  NODE_TYPE_IMAGE,        // img
  NODE_TYPE_SCROLLER,     // scroll

  // list
  NODE_TYPE_LIST	,       // list
  NODE_TYPE_SECTION,      // section
  NODE_TYPE_CELL,         // cell
  NODE_TYPE_HEADER,       // header
  NODE_TYPE_FOOTER,       // footer
  NODE_TYPE_WATERFALL,    // waterfall

  // all
  NODE_TYPE_ALL,

  NODE_STYLE_BASE,
  NODE_STYLE_NORMAL,      // normal
  //NODE_STYLE_FOCUS,     // focus
  //NODE_STYLE_ACTIVE,    // active
  NODE_STYLE_HOVER,       // hover
  NODE_STYLE_END = NODE_STYLE_HOVER,

  NODE_PROPERTY_COLUMN_COUNT,                 // column_count
  NODE_PROPERTY_PADDING_SPACING,
  NODE_PROPERTY_INNER_COLUMN_SPACING,
  NODE_PROPERTY_INNER_ROW_SPACING,
  NODE_PROPERTY_CURSOR,
  NODE_PROPERTY_CURSOR_POINTER_MASK,

  // label only
  NODE_PROPERTY_TEXT_SHADE,    // text-shade

  NODE_PROPERTY_END
};

export enum FillMode {
  FillMode_cover           = Keys.NODE_PROPERTY_FILL_MODE_COVER,                  // Scale the background image until it fully covers the background area
  FillMode_contain         = Keys.NODE_PROPERTY_FILL_MODE_CONTAIN,                // Scale the image to fit entirely inside the container
  FillMode_hundred_percent = Keys.NODE_PROPERTY_FILL_MODE_HUNDRED_PERCENT,        // 100%
  FillMode_adapt           = Keys.NODE_PROPERTY_FILL_MODE_ADAPT,                  // Keep the background image size unchanged and center it
}
