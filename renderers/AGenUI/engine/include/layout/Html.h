#pragma once

#include <string>
#include <map>
#include <vector>
#include <list>
namespace agenui {

class Html {
public:
    enum TagID {
        text,
        font,
        a,
        br,
        blockquote,
        i,
        u,
        strike,
        sub,
        sup,
        strong,
        b,
        small,
        img
    };
    
    struct Tag {
        Tag() : _tagID(text) {}
        explicit Tag(TagID tagID) : _tagID(tagID) {}
        
        TagID _tagID;
        std::map<std::string, std::string> _attributes;
    };
    
    struct Span {
        ~Span() {};
        
        std::list<Tag> _tag_list;
        std::string _text;
    };
    
public:
    explicit Html(const std::string &source);
    ~Html();
    
    int getSpanSize() {
        return static_cast<int>(_spans.size());
    }

    /**
     * @brief Returns the Span at the given index
     * @param index The index
     * @return Span pointer (managed by the Html object, destroyed when the Html object is destroyed)
     */
    Html::Span* getSpan(int index);

    /**
     * Returns whether the tags are malformed
     */
    bool isMalformed() const { return _is_malformed; }    
public:
    void handleStartTag(char *name, char **atts);
    void handleStartData(char *data, size_t len);
    void handleEndTag(const std::string &tag);
    
private:
    /**
     * @brief Parses rich text tags
     * @param source The raw rich text source
     * @return The number of tags
     */
    void fromHtml(const std::string &source);
    void dump();
private:
    bool _is_malformed;
    std::list<Tag> _tag_list;
    std::vector<Span*> _spans;
};
    
} //namespace agenui
