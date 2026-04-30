/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2003 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

struct dom_data {
	iks **iksptr;
	iks *current;
	size_t chunk_size;
};

static int
tagHook (struct dom_data *data, char *name, char **atts, int type)
{
	iks *x;

	if (IKS_OPEN == type || IKS_SINGLE == type) {
		if (data->current) {
			x = iks_insert (data->current, name);
		} else {
			ikstack *s;
			s = iks_stack_new (data->chunk_size, data->chunk_size);
			x = iks_new_within (name, s);
		}
		if (atts) {
			int i=0;
			while (atts[i]) {
				iks_insert_attrib (x, atts[i], atts[i+1]);
				i += 2;
			}
		}
		data->current = x;
	}
	if (IKS_CLOSE == type || IKS_SINGLE == type) {
		x = iks_parent (data->current);
		if (iks_strcmp(iks_name(data->current), name) != 0)
			return IKS_BADXML;
		if (x)
			data->current = x;
		else {
			*(data->iksptr) = data->current;
			data->current = NULL;
		}
	}
	return IKS_OK;
}

static int
cdataHook (struct dom_data *data, char *cdata, size_t len)
{
	if (data->current) iks_insert_cdata (data->current, cdata, len);
	return IKS_OK;
}

static void
deleteHook (struct dom_data *data)
{
	if (data->current) iks_delete (data->current);
	data->current = NULL;
}

iksparser *
iks_dom_new (iks **iksptr)
{
	ikstack *s;
	struct dom_data *data;

	*iksptr = NULL;
	s = iks_stack_new (DEFAULT_DOM_CHUNK_SIZE, 0);
	if (!s) return NULL;
	data = iks_stack_alloc (s, sizeof (struct dom_data));
	data->iksptr = iksptr;
	data->current = NULL;
	data->chunk_size = DEFAULT_DOM_IKS_CHUNK_SIZE;
	return iks_sax_extend (s, data, (iksTagHook *) tagHook, (iksCDataHook *) cdataHook, (iksDeleteHook *) deleteHook);
}

void
iks_set_size_hint (iksparser *prs, size_t approx_size)
{
	size_t cs;
	struct dom_data *data = iks_user_data (prs);

	cs = approx_size / 10;
	if (cs < DEFAULT_DOM_IKS_CHUNK_SIZE) cs = DEFAULT_DOM_IKS_CHUNK_SIZE;
	data->chunk_size = cs;
}

iks *
iks_tree (const char *xml_str, size_t len, int *err)
{
	iksparser *prs;
	iks *x;
	int e;

	if (0 == len) len = strlen (xml_str);
	prs = iks_dom_new (&x);
	if (!prs) {
		if (err) *err = IKS_NOMEM;
		return NULL;
	}
	e = iks_parse (prs, xml_str, len, 1);
	if (err) *err = e;
	iks_parser_delete (prs);
	return x;
}

int
iks_load (const char *fname, iks **xptr)
{
	iksparser *prs;
	char *buf;
	FILE *f;
	int len, done = 0;
	int ret;

	*xptr = NULL;

	buf = iks_malloc (FILE_IO_BUF_SIZE);
	if (!buf) return IKS_NOMEM;
	ret = IKS_NOMEM;
	prs = iks_dom_new (xptr);
	if (prs) {
		f = fopen (fname, "r");
		if (f) {
			while (0 == done) {
				len = fread (buf, 1, FILE_IO_BUF_SIZE, f);
				if (len < FILE_IO_BUF_SIZE) {
					if (0 == feof (f)) {
						ret = IKS_FILE_RWERR;
						break;
					}
					if (0 == len) ret = IKS_OK;
					done = 1;
				}
				if (len > 0) {
					int e;
					e = iks_parse (prs, buf, len, done);
					if (IKS_OK != e) {
						ret = e;
						break;
					}
					if (done) ret = IKS_OK;
				}
			}
			fclose (f);
		} else {
			if (ENOENT == errno) ret = IKS_FILE_NOFILE;
			else ret = IKS_FILE_NOACCESS;
		}
		iks_parser_delete (prs);
	}
	iks_free (buf);
	return ret;
}

int
iks_save (const char *fname, iks *x)
{
	FILE *f;
	char *data;
	int ret;

	ret = IKS_NOMEM;
	data = iks_string (NULL, x);
	if (data) {
		ret = IKS_FILE_NOACCESS;
		f = fopen (fname, "w");
		if (f) {
			ret = IKS_FILE_RWERR;
			if (fputs (data, f) >= 0) ret = IKS_OK;
			fclose (f);
		}
		iks_free (data);
	}
	return ret;
}
