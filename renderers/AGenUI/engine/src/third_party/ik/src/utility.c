/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2003 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

/*****  malloc wrapper  *****/

static void *(*my_malloc_func)(size_t size);
static void (*my_free_func)(void *ptr);

void *
iks_malloc (size_t size)
{
	if (my_malloc_func)
		return my_malloc_func (size);
	else
		return malloc (size);
}

void
iks_free (void *ptr)
{
	if (my_free_func)
		my_free_func (ptr);
	else
		free (ptr);
}

void
iks_set_mem_funcs (void *(*malloc_func)(size_t size), void (*free_func)(void *ptr))
{
	my_malloc_func = malloc_func;
	my_free_func = free_func;
}

/*****  NULL-safe Functions  *****/

char *
iks_strdup (const char *src)
{
	if (src) return strdup(src);
	return NULL;
}

char *
iks_strcat (char *dest, const char *src)
{
	size_t len;

	if (!src) return dest;

	len = strlen (src);
	memcpy (dest, src, len);
	dest[len] = '\0';
	return dest + len;
}

int
iks_strcmp (const char *a, const char *b)
{
	if (!a || !b) return -1;
	return strcmp (a, b);
}

int
iks_strcasecmp (const char *a, const char *b)
{
	if (!a || !b) return -1;
	return strcasecmp (a, b);
}

int
iks_strncmp (const char *a, const char *b, size_t n)
{
	if (!a || !b) return -1;
	return strncmp (a, b, n);
}

int
iks_strncasecmp (const char *a, const char *b, size_t n)
{
	if (!a || !b) return -1;
	return strncasecmp (a, b, n);
}

size_t
iks_strlen (const char *src)
{
	if (!src) return 0;
	return strlen (src);
}

/*****  XML Escaping  *****/

char *
iks_escape (ikstack *s, char *src, size_t len)
{
	char *ret;
	int i, j, nlen;

	if (!src || !s) return NULL;
	if (len == -1) len = strlen (src);

	nlen = len;
	for (i=0; i<len; i++) {
		switch (src[i]) {
		case '&': nlen += 4; break;
		case '<': nlen += 3; break;
		case '>': nlen += 3; break;
		case '\'': nlen += 5; break;
		case '"': nlen += 5; break;
		}
	}
	if (len == nlen) return src;

	ret = iks_stack_alloc (s, nlen + 1);
	if (!ret) return NULL;

	for (i=j=0; i<len; i++) {
		switch (src[i]) {
		case '&': memcpy (&ret[j], "&amp;", 5); j += 5; break;
		case '\'': memcpy (&ret[j], "&apos;", 6); j += 6; break;
		case '"': memcpy (&ret[j], "&quot;", 6); j += 6; break;
		case '<': memcpy (&ret[j], "&lt;", 4); j += 4; break;
		case '>': memcpy (&ret[j], "&gt;", 4); j += 4; break;
		default: ret[j++] = src[i];
		}
	}
	ret[j] = '\0';

	return ret;
}

char *
iks_unescape (ikstack *s, char *src, size_t len)
{
	int i,j;
	char *ret;

	if (!s || !src) return NULL;
	if (!strchr (src, '&')) return src;
	if (len == -1) len = strlen (src);

	ret = iks_stack_alloc (s, len + 1);
	if (!ret) return NULL;

	for (i=j=0; i<len; i++) {
		if (src[i] == '&') {
			i++;
			if (strncmp (&src[i], "amp;", 4) == 0) {
				ret[j] = '&';
				i += 3;
			} else if (strncmp (&src[i], "quot;", 5) == 0) {
				ret[j] = '"';
				i += 4;
			} else if (strncmp (&src[i], "apos;", 5) == 0) {
				ret[j] = '\'';
				i += 4;
			} else if (strncmp (&src[i], "lt;", 3) == 0) {
				ret[j] = '<';
				i += 2;
			} else if (strncmp (&src[i], "gt;", 3) == 0) {
				ret[j] = '>';
				i += 2;
			} else {
				ret[j] = src[--i];
			}
		} else {
			ret[j] = src[i];
		}
		j++;
	}
	ret[j] = '\0';

	return ret;
}
