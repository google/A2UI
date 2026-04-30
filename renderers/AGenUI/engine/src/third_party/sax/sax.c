/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2004 Gurer Ozen <madcat@e-kolay.net>
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
**
** Modified by AGenUI Contributors, 2026-03-29.
** Modifications: Function names prefixed with agenui_, parser structure
** extended, and XML parsing rules relaxed (see sax.h for details).
*/

#include "sax.h"
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>

enum cons_e {
	C_CDATA = 0,
	C_TAG_START,
	C_TAG,
	C_TAG_END,
	C_ATTRIBUTE,
	C_ATTRIBUTE_1,
	C_ATTRIBUTE_2,
	C_VALUE,
	C_VALUE_APOS,
	C_VALUE_QUOT,
    C_VALUE_COMP,
	C_WHITESPACE,
	C_ENTITY,
	C_COMMENT,
	C_COMMENT_1,
	C_COMMENT_2,
	C_COMMENT_3,
	C_MARKUP,
	C_MARKUP_1,
	C_SECT,
	C_SECT_CDATA,
	C_SECT_CDATA_1,
	C_SECT_CDATA_2,
	C_SECT_CDATA_3,
	C_SECT_CDATA_4,
	C_SECT_CDATA_C,
	C_SECT_CDATA_E,
	C_SECT_CDATA_E2,
	C_PI,
    C_VALUE_ENTITY,
    C_VALUE_APOS_QUOT_ENTITY,
};

/* if you add a variable here, dont forget changing agenui_iks_parser_reset */
struct iksparser_struct {
	ikstack *s;
	void *user_data;
	iksTagHook *tagHook;
	iksCDataHook *cdataHook;
	iksDeleteHook *deleteHook;
	/* parser context */
	char *stack;
	size_t stack_pos;
	size_t stack_max;

	enum cons_e context;
	enum cons_e oldcontext;

	char *tag_name;
	enum ikstagtype tagtype;

	unsigned int attmax;
	unsigned int attcur;
	int attflag;
	char **atts;
	int valflag;

	unsigned int entpos;
	char entity[8];

	unsigned long nr_bytes;
	unsigned long nr_lines;

	int uni_max;
	int uni_len;

    /* Whether to skip the & escape sequence &amp; */
	int skip_and_char;
    FuncEntityParserExtendHook *entity_parser_extend_hook;
};

agenui_iksparser *
agenui_iks_sax_new (void *user_data, iksTagHook *tagHook, iksCDataHook *cdataHook, FuncEntityParserExtendHook *entity_parser_extend_hook)
{
	agenui_iksparser *prs;

	prs = (agenui_iksparser *)malloc (sizeof (agenui_iksparser));
	if (NULL == prs) return NULL;
	memset (prs, 0, sizeof (agenui_iksparser));
	prs->user_data = user_data;
	prs->tagHook = tagHook;
	prs->cdataHook = cdataHook;
    prs->entity_parser_extend_hook = entity_parser_extend_hook;
	return prs;
}

agenui_iksparser *
agenui_iks_sax_extend (ikstack *s, void *user_data, iksTagHook *tagHook, iksCDataHook *cdataHook, iksDeleteHook *deleteHook)
{
	agenui_iksparser *prs;

	prs = (agenui_iksparser *)iks_stack_alloc (s, sizeof (agenui_iksparser));
	if (NULL == prs) return NULL;
	memset (prs, 0, sizeof (agenui_iksparser));
	prs->s = s;
	prs->user_data = user_data;
	prs->tagHook = tagHook;
	prs->cdataHook = cdataHook;
	prs->deleteHook = deleteHook;
	return prs;
}

ikstack *
agenui_iks_parser_stack (agenui_iksparser *prs)
{
	return prs->s;
}

void *
agenui_iks_user_data (agenui_iksparser *prs)
{
	return prs->user_data;
}

unsigned long
agenui_iks_nr_bytes (agenui_iksparser *prs)
{
	return prs->nr_bytes;
}

unsigned long
agenui_iks_nr_lines (agenui_iksparser *prs)
{
	return prs->nr_lines;
}

#define IS_WHITESPACE(x) ' ' == (x) || '\t' == (x) || '\r' == (x) || '\n' == (x)
#define NOT_WHITESPACE(x) ' ' != (x) && '\t' != (x) && '\r' != (x) && '\n' != (x)

static int
stack_init (agenui_iksparser *prs)
{
	prs->stack = (char *)malloc (128);
	if (!prs->stack) return 0;
	prs->stack_max = 128;
	prs->stack_pos = 0;
	return 1;
}

static int
stack_expand (agenui_iksparser *prs, int len)
{
	size_t need;
	off_t diff;
	char *tmp;
	need = len - (prs->stack_max - prs->stack_pos);
	if (need < prs->stack_max) {
		need = prs->stack_max * 2;
	} else {
		/* need x 1.2 for integer only archs like ARM */
		need = prs->stack_max + ( (need * 6) / 5);
	}
	tmp = (char *)malloc (need);
	if (!tmp) return 0;
	diff = (off_t)(tmp - prs->stack);
	memcpy (tmp, prs->stack, prs->stack_max);
	free (prs->stack);
	prs->stack = tmp;
	prs->stack_max = need;
	prs->tag_name += diff;
	if (prs->attflag != 0) {
		unsigned int i = 0;
		while (i < (prs->attmax * 2)) {
			if (prs->atts[i]) prs->atts[i] += diff;
			i++;
		}
	}
	return 1;
}

#define STACK_INIT \
	if (NULL == prs->stack && 0 == stack_init (prs)) return IKS_NOMEM

#define STACK_PUSH_START (prs->stack + prs->stack_pos)

#define STACK_PUSH(buf,len) \
{ \
	char *sbuf = (buf); \
	size_t slen = (len); \
	if (prs->stack_max - prs->stack_pos <= slen) { \
		if (0 == stack_expand (prs, (int)slen)) return IKS_NOMEM; \
	} \
	memcpy (prs->stack + prs->stack_pos, sbuf, slen); \
	prs->stack_pos += slen; \
}

#define STACK_PUSH_SKIP_AND_CHAR(buf,len) \
{ \
	char *sbuf = (buf); \
	size_t slen = (len); \
    char *tmp = malloc(slen);\
    int tmpIndex = 0;\
    int skip = 0;\
    for (int i = 0; i < slen; i++) {\
        if (skip) {\
            if (sbuf[i] == ';') {\
                skip = 0;\
            }\
            continue;\
        }\
        skip = sbuf[i] == '&';\
        tmp[tmpIndex++] = sbuf[i];\
    }\
	if (prs->stack_max - prs->stack_pos <= tmpIndex) { \
		if (0 == stack_expand (prs, (int)tmpIndex)) {     \
            free(tmp);                              \
            return IKS_NOMEM;             \
        } \
    } \
	memcpy (prs->stack + prs->stack_pos, tmp, tmpIndex); \
	prs->stack_pos += tmpIndex; \
    free(tmp);\
}

#define STACK_PUSH_END \
{ \
	if (prs->stack_pos >= prs->stack_max) { \
		if (0 == stack_expand (prs, 1)) return IKS_NOMEM; \
	} \
	prs->stack[prs->stack_pos] = '\0'; \
	prs->stack_pos++; \
}

static enum ikserror
agenui_sax_core (agenui_iksparser *prs, char *buf, int len)
{
	enum ikserror err;
	int pos = 0, old = 0, re, stack_old = -1;
	unsigned char c;

	while (pos < len) {
		re = 0;
		c = buf[pos];
		if (0 == c || 0xFE == c || 0xFF == c)
			return IKS_BADXML;

		switch (prs->context) {
			case C_CDATA:
				if ('&' == c) {
					if (old < pos && prs->cdataHook) {
						err = (enum ikserror)prs->cdataHook (prs->user_data, &buf[old], pos - old);
						if (IKS_OK != err) return err;
					}
					prs->context = C_ENTITY;
					prs->entpos = 0;
                    prs->entity[prs->entpos++] = '&';
					break;
				}
				if ('<' == c) {
					if (old < pos && prs->cdataHook) {
						err = (enum ikserror)prs->cdataHook (prs->user_data, &buf[old], pos - old);
						if (IKS_OK != err) return err;
					}
					STACK_INIT;
					prs->tag_name = STACK_PUSH_START;
					if (!prs->tag_name) return IKS_NOMEM;
					prs->context = C_TAG_START;
				}
				break;

			case C_TAG_START:
				prs->context = C_TAG;
				if ('/' == c) {
					prs->tagtype = IKS_CLOSE;
					break;
				}
				if ('?' == c) {
					prs->context = C_PI;
					break;
				}
				if ('!' == c) {
					prs->context = C_MARKUP;
					break;
				}
				prs->tagtype = IKS_OPEN;
				stack_old = pos;
				break;

			case C_TAG:
				if (IS_WHITESPACE(c)) {
					if (IKS_CLOSE == prs->tagtype)
						prs->oldcontext = C_TAG_END;
					else
						prs->oldcontext = C_ATTRIBUTE;
					prs->context = C_WHITESPACE;
					if (stack_old != -1) STACK_PUSH (buf + stack_old, pos - stack_old);
					stack_old = -1;
					STACK_PUSH_END;
					break;
				}
				if ('/' == c) {
					if (IKS_CLOSE == prs->tagtype) 
						return IKS_BADXML;
					prs->tagtype = IKS_SINGLE;
					prs->context = C_TAG_END;
					if (stack_old != -1) STACK_PUSH (buf + stack_old, pos - stack_old);
					stack_old = -1;
					STACK_PUSH_END;
					break;
				}
				if ('>' == c) {
					prs->context = C_TAG_END;
					if (stack_old != -1) STACK_PUSH (buf + stack_old, pos - stack_old);
					stack_old = -1;
					STACK_PUSH_END;
					re = 1;
					break;
				}
				if (stack_old == -1) stack_old = pos;
				break;

			case C_TAG_END:
				if (c != '>') 
					return IKS_BADXML;
				if (prs->tagHook) {
					char **tmp;
					if (prs->attcur == 0) tmp = NULL; else tmp = prs->atts;
					err = (enum ikserror)prs->tagHook (prs->user_data, prs->tag_name, tmp, prs->tagtype);
					if (IKS_OK != err) return err;
				}
				prs->stack_pos = 0;
				stack_old = -1;
				prs->attcur = 0;
				prs->attflag = 0;
				prs->context = C_CDATA;
				old = pos + 1;
				break;

			case C_ATTRIBUTE:
				if ('/' == c) {
					prs->tagtype = IKS_SINGLE;
					prs->context = C_TAG_END;
					break;
				}
				if ('>' == c) {
					prs->context = C_TAG_END;
					re = 1;
					break;
				}
				if (!prs->atts) {
					prs->attmax = 12;
					prs->atts = (char **)malloc (sizeof(char *) * 2 * 12);
					if (!prs->atts) return IKS_NOMEM;
					memset (prs->atts, 0, sizeof(char *) * 2 * 12);
					prs->attcur = 0;
				} else {
					if (prs->attcur >= (prs->attmax * 2)) {
						void *tmp;
						prs->attmax += 12;
						tmp = malloc (sizeof(char *) * 2 * prs->attmax);
						if (!tmp) return IKS_NOMEM;
						memset (tmp, 0, sizeof(char *) * 2 * prs->attmax);
						memcpy (tmp, prs->atts, sizeof(char *) * prs->attcur);
						free (prs->atts);
						prs->atts = (char **)tmp;
					}
				}
				prs->attflag = 1;
				prs->atts[prs->attcur] = STACK_PUSH_START;
				stack_old = pos;
				prs->context = C_ATTRIBUTE_1;
				break;

			case C_ATTRIBUTE_1:
				if ('=' == c) {
					if (stack_old != -1) STACK_PUSH (buf + stack_old, pos - stack_old);
					stack_old = -1;
					STACK_PUSH_END;
					prs->context = C_VALUE;
					break;
				}
				if (stack_old == -1) stack_old = pos;
				break;

			case C_ATTRIBUTE_2:
				if ('/' == c) {
					prs->tagtype = IKS_SINGLE;
					prs->atts[prs->attcur] = NULL;
					prs->context = C_TAG_END;
					break;
				}
				if ('>' == c) {
					prs->atts[prs->attcur] = NULL;
					prs->context = C_TAG_END;
					re = 1;
					break;
				}
				prs->context = C_ATTRIBUTE;
				re = 1;
				break;

			case C_VALUE:
				prs->atts[prs->attcur + 1] = STACK_PUSH_START;
				if ('\'' == c) {
					prs->skip_and_char = 0;
					prs->context = C_VALUE_APOS;
					break;
				}
				if ('"' == c) {
					prs->skip_and_char = 0;
					prs->context = C_VALUE_QUOT;
					break;
				}
                if ('&' == c) {
					prs->skip_and_char = 0;
                    prs->context = C_VALUE_ENTITY;
                    prs->entpos = 0;
                    prs->entity[prs->entpos++] = '&';
                    break;
                }
                if (NOT_WHITESPACE(c)) {
                    prs->context = C_VALUE_COMP;
                    if (stack_old == -1) stack_old = pos;
                    break;
                }
				return IKS_BADXML;

            case C_VALUE_ENTITY:
                // <font color=&quot;#ff0000&quot;>Hello,world!</font>
                // <font color=&apos;#ff0000&apos;>Hello,world!</font>
                if (';' == c) {
                    prs->entity[prs->entpos] = '\0';
                    
                    if (strcmp(prs->entity, "&quot") == 0)
                        prs->context = C_VALUE_QUOT;
                    else if (strcmp(prs->entity, "&apos") == 0)
                        prs->context = C_VALUE_APOS;
                    else
                        return IKS_BADXML;
                } else {
                    prs->entity[prs->entpos++] = buf[pos];
                    
                    if (prs->entpos > 7)
                        return IKS_BADXML;
                }
                break;
                
            case C_VALUE_APOS_QUOT_ENTITY:
                if (';' == c) {
                    prs->entity[prs->entpos] = '\0';
                    
                    if (strcmp(prs->entity, "&apos") == 0 || strcmp(prs->entity, "&quot") == 0) {
                        if (stack_old != -1) {
                            if (prs->skip_and_char != 0) {
                                prs->skip_and_char = 0;
                                STACK_PUSH_SKIP_AND_CHAR(buf + stack_old, pos - stack_old - 5);
                            } else {
                                STACK_PUSH (buf + stack_old, pos - stack_old - 5);
                            }
                        }
                        stack_old = -1;
                        STACK_PUSH_END;
                        prs->oldcontext = C_ATTRIBUTE_2;
                        prs->context = C_WHITESPACE;
                        prs->attcur += 2;
                        
                        if (stack_old == -1) stack_old = pos;
                    } else if (strcmp(prs->entity, "&amp") == 0) {
                        // Supports & symbol in attribute values; business code must escape it as &amp;
                        prs->context = prs->oldcontext;
                        prs->skip_and_char = 1;
                    } else {
                        return IKS_BADXML;
                    }
                } else {
                    prs->entity[prs->entpos++] = buf[pos];
                    
                    if (prs->entpos > 7)
                        return IKS_BADXML;//TODO
                }
                break;
            case C_VALUE_COMP:
                if ('>' == c) {
                    if (stack_old != -1) STACK_PUSH (buf + stack_old, pos - stack_old);
                    stack_old = -1;
                    STACK_PUSH_END;
         
                    prs->attcur += 2;
                    prs->atts[prs->attcur] = NULL;
                    prs->context = C_TAG_END;
                    
                    re = 1;
                }
                break;
			case C_VALUE_APOS:
				if ('\'' == c) {
                    if (stack_old != -1) {
                        if (prs->skip_and_char != 0) {
                            prs->skip_and_char = 0;
                            STACK_PUSH_SKIP_AND_CHAR(buf + stack_old, pos - stack_old);
                        } else {
                            STACK_PUSH (buf + stack_old, pos - stack_old);
                        }
                    }
					stack_old = -1;
					STACK_PUSH_END;
					prs->oldcontext = C_ATTRIBUTE_2;
					prs->context = C_WHITESPACE;
					prs->attcur += 2;
                } else if ('&' == c) {
                    prs->oldcontext = C_VALUE_APOS;
                    prs->context = C_VALUE_APOS_QUOT_ENTITY;
                    prs->entpos = 0;
                    prs->entity[prs->entpos++] = '&';
                }
				if (stack_old == -1) stack_old = pos;
				break;

			case C_VALUE_QUOT:
				if ('"' == c) {
                    if (stack_old != -1) {
                        if (prs->skip_and_char != 0) {
                            prs->skip_and_char = 0;
                            STACK_PUSH_SKIP_AND_CHAR(buf + stack_old, pos - stack_old);
                        } else {
                            STACK_PUSH (buf + stack_old, pos - stack_old);
                        }
                    }
					stack_old = -1;
					STACK_PUSH_END;
					prs->oldcontext = C_ATTRIBUTE_2;
					prs->context = C_WHITESPACE;
					prs->attcur += 2;
                } else if ('&' == c) {
                    prs->oldcontext = C_VALUE_QUOT;
                    prs->context = C_VALUE_APOS_QUOT_ENTITY;
                    prs->entpos = 0;
                    prs->entity[prs->entpos++] = '&';
                }
				if (stack_old == -1) stack_old = pos;
				break;

			case C_WHITESPACE:
				if (NOT_WHITESPACE(c)) {
					prs->context = prs->oldcontext;
					re = 1;
				}
				break;

			case C_ENTITY:
				if (';' == c) {
					char hede[4];// In ISO-8859 variants, entity characters are at most 3 bytes long. For example, the '€' character cannot actually be stored in a char type and requires multiple consecutive chars.
					prs->entity[prs->entpos] = '\0';
					
					old = pos + 1;
					hede[0] = '?';
					hede[1] = '\0';
                    
                    if (prs->entity_parser_extend_hook) {
                        prs->entity_parser_extend_hook(prs->entity, hede, 4);
                    }
                    
                    if (prs->cdataHook) {
						err = (enum ikserror)prs->cdataHook (prs->user_data, hede, strlen(hede));
						if (IKS_OK != err) return err;
					}
					prs->context = C_CDATA;
				} else {
					prs->entity[prs->entpos++] = buf[pos];
                    
                    // The & symbol cannot be used directly in XML; when needed, it must be escaped as &amp;. After compatibility, it can be used, and & will appear as normal text.
                    if (prs->entpos > 7 && prs->cdataHook) {
                        err = (enum ikserror)prs->cdataHook (prs->user_data, &prs->entity[0], 1);
                        if (IKS_OK != err) return err;
                        
                        pos = pos - 7;
                        old = pos + 1;
                        prs->context = C_CDATA;
                    }
				}
				break;

			case C_COMMENT:
				if ('-' != c) 
					return IKS_BADXML;
				prs->context = C_COMMENT_1;
				break;

			case C_COMMENT_1:
				if ('-' == c) prs->context = C_COMMENT_2;
				break;

			case C_COMMENT_2:
				if ('-' == c)
					prs->context = C_COMMENT_3;
				else
					prs->context = C_COMMENT_1;
				break;

			case C_COMMENT_3:
				if ('>' != c) 
					return IKS_BADXML;
				prs->context = C_CDATA;
				old = pos + 1;
				break;

			case C_MARKUP:
				if ('[' == c) {
					prs->context = C_SECT;
					break;
				}
				if ('-' == c) {
					prs->context = C_COMMENT;
					break;
				}
				prs->context = C_MARKUP_1;

			case C_MARKUP_1:
				if ('>' == c) {
					old = pos + 1;
					prs->context = C_CDATA;
				}
				break;

			case C_SECT:
				if ('C' == c) {
					prs->context = C_SECT_CDATA;
					break;
				}
				return IKS_BADXML;

			case C_SECT_CDATA:
				if ('D' != c) 
					return IKS_BADXML;
				prs->context = C_SECT_CDATA_1;
				break;

			case C_SECT_CDATA_1:
				if ('A' != c) 
					return IKS_BADXML;
				prs->context = C_SECT_CDATA_2;
				break;

			case C_SECT_CDATA_2:
				if ('T' != c) 
					return IKS_BADXML;
				prs->context = C_SECT_CDATA_3;
				break;

			case C_SECT_CDATA_3:
				if ('A' != c) 
					return IKS_BADXML;
				prs->context = C_SECT_CDATA_4;
				break;

			case C_SECT_CDATA_4:
				if ('[' != c) 
					return IKS_BADXML;
				old = pos + 1;
				prs->context = C_SECT_CDATA_C;
				break;

			case C_SECT_CDATA_C:
				if (']' == c) {
					prs->context = C_SECT_CDATA_E;
					if (prs->cdataHook && old < pos) {
						err = (enum ikserror)prs->cdataHook (prs->user_data, &buf[old], pos - old);
						if (IKS_OK != err) return err;
					}
				}
				break;

			case C_SECT_CDATA_E:
				if (']' == c) {
					prs->context = C_SECT_CDATA_E2;
				} else {
					if (prs->cdataHook) {
						err = (enum ikserror)prs->cdataHook (prs->user_data, "]", 1);
						if (IKS_OK != err) return err;
					}
					old = pos;
					prs->context = C_SECT_CDATA_C;
				}
				break;

			case C_SECT_CDATA_E2:
				if ('>' == c) {
					old = pos + 1;
					prs->context = C_CDATA;
				} else {
					if (prs->cdataHook) {
						err = (enum ikserror)prs->cdataHook (prs->user_data, "]]", 2);
						if (IKS_OK != err) return err;
					}
					old = pos;
					prs->context = C_SECT_CDATA_C;
				}
				break;

			case C_PI:
				old = pos + 1;
				if ('>' == c) prs->context = C_CDATA;
				break;
            default:
                break;
		}
//cont:
		if (0 == re) {
			pos++;
			prs->nr_bytes++;
			if ('\n' == c) prs->nr_lines++;
		}
	}

	if (stack_old != -1)
		STACK_PUSH (buf + stack_old, pos - stack_old);

	err = IKS_OK;
    if (prs->cdataHook && (prs->context == C_CDATA || prs->context == C_SECT_CDATA_C) && old < pos) {
        err = (enum ikserror)prs->cdataHook (prs->user_data, &buf[old], pos - old);
    } else if (prs->cdataHook && prs->context == C_ENTITY && prs->entpos > 0) {
        err = (enum ikserror)prs->cdataHook (prs->user_data, &prs->entity[0], prs->entpos);
    } else if (prs->context != C_CDATA) {
#ifdef LOG_PERFORMANCE
        err = IKS_BADXML;
#endif
    }
	return err;
}

int
agenui_iks_parse (agenui_iksparser *prs, const char *data, size_t len, int finish)
{
	if (!data) return IKS_OK;
	if (len == 0) len = strlen (data);
	enum ikserror e = agenui_sax_core (prs, (char *) data, (int)len);
    return e;
}

void
agenui_iks_parser_reset (agenui_iksparser *prs)
{
	if (prs->deleteHook) prs->deleteHook (prs->user_data);
	prs->stack_pos = 0;
	prs->context = (enum cons_e)0;
	prs->oldcontext = (enum cons_e)0;
	prs->tagtype = (enum ikstagtype)0;
	prs->attcur = 0;
	prs->attflag = 0;
	prs->valflag = 0;
	prs->entpos = 0;
	prs->nr_bytes = 0;
	prs->nr_lines = 0;
	prs->uni_max = 0;
	prs->uni_len = 0;
	prs->skip_and_char = 0;
}

void
agenui_iks_parser_delete (agenui_iksparser *prs)
{
	if (prs->deleteHook) prs->deleteHook (prs->user_data);
	if (prs->stack) free (prs->stack);
	if (prs->atts) free (prs->atts);
	if (prs->s) iks_stack_delete (prs->s); else free (prs);
}
