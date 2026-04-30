/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2007 Gurer Ozen <madcat@e-kolay.net>
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
**
** Modified by AGenUI Contributors, 2026-03-29.
** Modifications: See sax.c for details.
*/

/*
** Based on the iksemel open-source library, modifications were made to the SAX parsing part.
** XML requirements are more relaxed, supporting:
** Single or double quotes using &apos;, e.g., <font color=&apos;#FF1A1A&apos;>Resting</font>
** Single & symbols, e.g., H&M
** Attribute values without quote delimiters, e.g., <font size=45px>Resting</font>
*/
#ifndef AGENUI_SAX_H
#define AGENUI_SAX_H 1

#ifdef __cplusplus
extern "C" {
#endif
#include <iksemel.h>

struct iksparser_struct;
typedef struct iksparser_struct  agenui_iksparser;

typedef void (FuncEntityParserExtendHook)(const char *, char *, int);

agenui_iksparser *agenui_iks_sax_new (void *user_data, iksTagHook *tagHook, iksCDataHook *cdataHook, FuncEntityParserExtendHook *entity_parserex_hook);
agenui_iksparser *agenui_iks_sax_extend (ikstack *s, void *user_data, iksTagHook *tagHook, iksCDataHook *cdataHook, iksDeleteHook *deleteHook);
ikstack *agenui_iks_parser_stack (agenui_iksparser *prs);
void *agenui_iks_user_data (agenui_iksparser *prs);
unsigned long agenui_iks_nr_bytes (agenui_iksparser *prs);
unsigned long agenui_iks_nr_lines (agenui_iksparser *prs);
int agenui_iks_parse (agenui_iksparser *prs, const char *data, size_t len, int finish);
void agenui_iks_parser_reset (agenui_iksparser *prs);
void agenui_iks_parser_delete (agenui_iksparser *prs);

#ifdef __cplusplus
}
#endif

#endif  /* AGENUI_SAX_H */
