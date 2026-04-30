#include "layout/Html.h"
#include "sax/sax.h"
#include <unordered_map>

// #define DEBUG_HTML_PARSER
namespace agenui {
    
static Html::TagID getTagId(const char* name) {
    Html::TagID tagId = Html::text;
    if (strcasecmp(name, "font") == 0) {
        tagId = Html::font;
    } else if (strcasecmp(name, "a") == 0) {
        tagId = Html::a;
    } else if (strcasecmp(name, "br") == 0) {
        tagId = Html::br;
    } else if (strcasecmp(name, "blockquote") == 0) {
        tagId = Html::blockquote;
    } else if (strcasecmp(name, "i") == 0) {
        tagId = Html::i;
    } else if (strcasecmp(name, "u") == 0) {
        tagId = Html::u;
    } else if (strcasecmp(name, "strike") == 0) {
        tagId = Html::strike;
    } else if (strcasecmp(name, "sub") == 0) {
        tagId = Html::sub;
    } else if (strcasecmp(name, "sup") == 0) {
        tagId = Html::sup;
    } else if (strcasecmp(name, "strong") == 0) {
        tagId = Html::strong;
    } else if (strcasecmp(name, "b") == 0) {
        tagId = Html::b;
    } else if (strcasecmp(name, "small") == 0) {
        tagId = Html::small;
    } else if (strcasecmp(name, "img") == 0) {
        tagId = Html::img;
    } else {
        tagId = Html::text;
    }
    return tagId;
}
    
static int iksTagHookSAX(void *user_data, char *name, char **atts, int type) {
    Html* html = (Html*)user_data;
    if (IKS_OPEN == type) {
        html->handleStartTag(name, atts);
    } else if (IKS_CLOSE == type) {
        html->handleEndTag(name);
    } else if (IKS_SINGLE == type) {
        html->handleStartTag(name, atts);
        html->handleEndTag(name);
    }
    return IKS_OK;
}

static int iksCDataHookSAX(void *user_data, char *data, size_t len) {
    Html* html = (Html*)user_data;
    html->handleStartData(data, len);
    return IKS_OK;
}

static void EntityParserExtendHook(const char *entity, char *result, int size) {
    if (!entity || !result || size < 4) {
        return;
    }
    
    static std::unordered_map<std::string, std::string> sEntitiesMap = {{"&quot",  "\""},
        {"&amp",  "&"},
        {"&lt",  "<"},
        {"&gt",  ">"},
        {"&apos",  "\'"},
        {"&euro",  "€"}, // wide char cannot use char type
        {"&sbquo",  "‚"},
        {"&fnof",  "ƒ"},
        {"&bdquo",  "„"},
        {"&hellip",  "…"},
        {"&dagger",  "†"},
        {"&Dagger",  "‡"},
        {"&circ",  "ˆ"},
        {"&permil",  "‰"},
        {"&Scaron",  "Š"},
        {"&lsaquo",  "‹"},
        {"&OElig",  "Œ"},
        {"&Zcaron",  "Ž"},
        {"&lsquo",  "‘"},
        {"&rsquo",  "’"},
        {"&ldquo",  "“"},
        {"&rdquo",  "”"},
        {"&bull",  "•"},
        {"&ndash",  "–"},
        {"&mdash",  "—"},
        {"&tilde",  "˜"},
        {"&trade",  "™"},
        {"&scaron",  "š"},
        {"&rsaquo",  "›"},
        {"&oelig",  "œ"},
        {"&zcaron",  "ž"},
        {"&Yuml",  "Ÿ"},
        {"&nbsp",  " "},
        {"&iexcl",  "¡"},
        {"&cent",  "¢"},
        {"&pound",  "£"},
        {"&curren",  "¤"},
        {"&yen",  "¥"},
        {"&brvbar",  "¦"},
        {"&sect",  "§"},
        {"&uml",  "¨"},
        {"&copy",  "©"},
        {"&ordf",  "ª"},
        {"&laquo",  "«"},
        {"&not",  "¬"},
        {"&shy",  ""},// empty string represents soft hyphen
        {"&reg",  "®"},
        {"&macr",  "¯"},
        {"&deg",  "°"},
        {"&plusmn",  "±"},
        {"&sup2",  "²"},
        {"&sup3",  "³"},
        {"&acute",  "´"},
        {"&micro",  "µ"},
        {"&para",  "¶"},
        {"&middot",  "·"},
        {"&cedil",  "¸"},
        {"&sup1",  "¹"},
        {"&ordm",  "º"},
        {"&raquo",  "»"},
        {"&frac14",  "¼"},
        {"&frac12",  "½"},
        {"&frac34",  "¾"},
        {"&iquest",  "¿"},
        {"&Agrave",  "À"},
        {"&Aacute",  "Á"},
        {"&Acirc",  "Â"},
        {"&Atilde",  "Ã"},
        {"&Auml",  "Ä"},
        {"&Aring",  "Å"},
        {"&AElig",  "Æ"},
        {"&Ccedil",  "Ç"},
        {"&Egrave",  "È"},
        {"&Eacute",  "É"},
        {"&Ecirc",  "Ê"},
        {"&Euml",  "Ë"},
        {"&Igrave",  "Ì"},
        {"&Iacute",  "Í"},
        {"&Icirc",  "Î"},
        {"&Iuml",  "Ï"},
        {"&ETH",  "Ð"},
        {"&Ntilde",  "Ñ"},
        {"&Ograve",  "Ò"},
        {"&Oacute",  "Ó"},
        {"&Ocirc",  "Ô"},
        {"&Otilde",  "Õ"},
        {"&Ouml",  "Ö"},
        {"&times",  "×"},
        {"&Oslash",  "Ø"},
        {"&Ugrave",  "Ù"},
        {"&Uacute",  "Ú"},
        {"&Ucirc",  "Û"},
        {"&Uuml",  "Ü"},
        {"&Yacute",  "Ý"},
        {"&THORN",  "Þ"},
        {"&szlig",  "ß"},
        {"&agrave",  "à"},
        {"&aacute",  "á"},
        {"&acirc",  "â"},
        {"&atilde",  "ã"},
        {"&auml",  "ä"},
        {"&aring",  "å"},
        {"&aelig",  "æ"},
        {"&ccedil",  "ç"},
        {"&egrave",  "è"},
        {"&eacute",  "é"},
        {"&ecirc",  "ê"},
        {"&euml",  "ë"},
        {"&igrave",  "ì"},
        {"&iacute",  "í"},
        {"&icirc",  "î"},
        {"&iuml",  "ï"},
        {"&eth",  "ð"},
        {"&ntilde",  "ñ"},
        {"&ograve",  "ò"},
        {"&oacute",  "ó"},
        {"&ocirc",  "ô"},
        {"&otilde",  "õ"},
        {"&ouml",  "ö"},
        {"&divide",  "÷"},
        {"&oslash",  "ø"},
        {"&ugrave",  "ù"},
        {"&uacute",  "ú"},
        {"&ucirc",  "û"},
        {"&uuml",  "ü"},
        {"&yacute",  "ý"},
        {"&thorn",  "þ"},
        {"&yuml",  "ÿ"}};
    auto it = sEntitiesMap.find(entity);
    if (it != sEntitiesMap.end()) {
        size_t entity_length = it->second.length();
        memcpy(result, it->second.c_str(), entity_length);
        *(result + entity_length) = '\0';
    }
}

Html::Html(const std::string &source) : _is_malformed(false) {
    fromHtml(source);
}
    
Html::~Html() {
    for (auto &span : _spans) {
        delete span;
    }
}
    
Html::Span* Html::getSpan(int index) {
    if (index < 0 || index >= _spans.size()) {
        return nullptr;
    }
    
    return _spans[index];
}

void Html::fromHtml(const std::string &source) {
    agenui_iksparser* _parser = agenui_iks_sax_new(this, iksTagHookSAX, iksCDataHookSAX, EntityParserExtendHook);
    int code = agenui_iks_parse(_parser, source.c_str(), source.size(), 1);
    if (code != IKS_OK
#ifdef LOG_PERFORMANCE
        || !_tag_list.empty()
#endif
        ) {
        _is_malformed = true;
    }
    
    agenui_iks_parser_delete(_parser);
}

void Html::dump() {
#ifdef DEBUG_HTML_PARSER
#endif
}

void Html::handleStartTag(char *name, char **atts) {    
    TagID tagId = getTagId(name);
    Tag tag(tagId);
    
    if (atts) {
        char* a = atts[0];
        int i = 0;
        while (a) {
            tag._attributes[std::string(a)] = atts[++i] ? std::string(atts[i]) : "";
            a = atts[++i];
        }
    }
    
    if (tagId == br || tagId == img) {
        Span *span = new Span();
        span->_tag_list.push_back(tag);
        _spans.push_back(span);
        return;
    }
    
    _tag_list.push_back(tag);
}

void Html::handleStartData(char *data, size_t len) {
    Span *span = new Span();
    span->_tag_list = _tag_list;
    
    _spans.push_back(span);
    
    char *buf = new char[len + 1];
    snprintf(buf, len + 1, "%s", data);
    
    span->_text.append(buf);
    delete [] buf;
}

void Html::handleEndTag(const std::string &name) {
    TagID tagId = getTagId(name.c_str());
    if (tagId == br || tagId == img) {
        return;
    }
    
    if (!_tag_list.empty()) {
        Tag tag = _tag_list.back();
        _tag_list.pop_back();

        if (tag._tagID != tagId) {
#ifdef LOG_PERFORMANCE
            _is_malformed = true;
#endif
        }
    } else {
#ifdef LOG_PERFORMANCE
        _is_malformed = true;
#endif
    }
}

} //namespace agenui
