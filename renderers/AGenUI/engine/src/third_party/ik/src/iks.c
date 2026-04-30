/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2007 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

#define IKS_COMMON \
	struct iks_struct *next, *prev; \
	struct iks_struct *parent; \
	enum ikstype type; \
	ikstack *s

struct iks_struct {
	IKS_COMMON;
};

struct iks_tag {
	IKS_COMMON;
	struct iks_struct *children, *last_child;
	struct iks_struct *attribs, *last_attrib;
	char *name;
};

#define IKS_TAG_NAME(x) ((struct iks_tag *) (x) )->name
#define IKS_TAG_CHILDREN(x) ((struct iks_tag *) (x) )->children
#define IKS_TAG_LAST_CHILD(x) ((struct iks_tag *) (x) )->last_child
#define IKS_TAG_ATTRIBS(x) ((struct iks_tag *) (x) )->attribs
#define IKS_TAG_LAST_ATTRIB(x) ((struct iks_tag *) (x) )->last_attrib

struct iks_cdata {
	IKS_COMMON;
	char *cdata;
	size_t len;
};

#define IKS_CDATA_CDATA(x) ((struct iks_cdata *) (x) )->cdata
#define IKS_CDATA_LEN(x) ((struct iks_cdata *) (x) )->len

struct iks_attrib {
	IKS_COMMON;
	char *name;
	char *value;
};

#define IKS_ATTRIB_NAME(x) ((struct iks_attrib *) (x) )->name
#define IKS_ATTRIB_VALUE(x) ((struct iks_attrib *) (x) )->value

/*****  Node Creating & Deleting  *****/

iks *
iks_new (const char *name)
{
	ikstack *s;
	iks *x;

	s = iks_stack_new (sizeof (struct iks_tag) * 6, 256);
	if (!s) return NULL;
	x = iks_new_within (name, s);
	if (!x) {
		iks_stack_delete (s);
		return NULL;
	}
	return x;
}

iks *
iks_new_within (const char *name, ikstack *s)
{
	iks *x;
	size_t len;

	if (name) len = sizeof (struct iks_tag); else len = sizeof (struct iks_cdata);
	x = iks_stack_alloc (s, len);
	if (!x) return NULL;
	memset (x, 0, len);
	x->s = s;
	x->type = IKS_TAG;
	if (name) {
		IKS_TAG_NAME (x) = iks_stack_strdup (s, name, 0);
		if (!IKS_TAG_NAME (x)) return NULL;
	}
	return x;
}

iks *
iks_insert (iks *x, const char *name)
{
	iks *y;

	if (!x) return NULL;

	y = iks_new_within (name, x->s);
	if (!y) return NULL;
	y->parent = x;
	if (!IKS_TAG_CHILDREN (x)) IKS_TAG_CHILDREN (x) = y;
	if (IKS_TAG_LAST_CHILD (x)) {
		IKS_TAG_LAST_CHILD (x)->next = y;
		y->prev = IKS_TAG_LAST_CHILD (x);
	}
	IKS_TAG_LAST_CHILD (x) = y;
	return y;
}

iks *
iks_insert_cdata (iks *x, const char *data, size_t len)
{
	iks *y;

	if(!x || !data) return NULL;
	if(len == 0) len = strlen (data);

	y = IKS_TAG_LAST_CHILD (x);
	if (y && y->type == IKS_CDATA) {
		IKS_CDATA_CDATA (y) = iks_stack_strcat (x->s, IKS_CDATA_CDATA (y), IKS_CDATA_LEN (y), data, len);
		IKS_CDATA_LEN (y) += len;
	} else {
		y = iks_insert (x, NULL);
		if (!y) return NULL;
		y->type = IKS_CDATA;
		IKS_CDATA_CDATA (y) = iks_stack_strdup (x->s, data, len);
		if (!IKS_CDATA_CDATA (y)) return NULL;
		IKS_CDATA_LEN (y) = len;
	}
	return y;
}

iks *
iks_insert_attrib (iks *x, const char *name, const char *value)
{
	iks *y;

	if (!x) return NULL;

	y = IKS_TAG_ATTRIBS (x);
	while (y) {
		if (strcmp (name, IKS_ATTRIB_NAME (y)) == 0) break;
		y = y->next;
	}
	if (NULL == y) {
		if (!value) return NULL;
		y = iks_stack_alloc (x->s, sizeof (struct iks_attrib));
		if (!y) return NULL;
		memset (y, 0, sizeof (struct iks_attrib));
		y->type = IKS_ATTRIBUTE;
		y->s = x->s;
		IKS_ATTRIB_NAME (y) = iks_stack_strdup (x->s, name, 0);
		if (!IKS_ATTRIB_NAME (y)) return NULL;
		y->parent = x;
		if (!IKS_TAG_ATTRIBS (x)) IKS_TAG_ATTRIBS (x) = y;
		if (IKS_TAG_LAST_ATTRIB (x)) {
			IKS_TAG_LAST_ATTRIB (x)->next = y;
			y->prev = IKS_TAG_LAST_ATTRIB (x);
		}
		IKS_TAG_LAST_ATTRIB (x) = y;
	}

	if (value) {
		IKS_ATTRIB_VALUE (y) = iks_stack_strdup (x->s, value, 0);
		if (!IKS_ATTRIB_VALUE (y)) return NULL;
	} else {
		if (y->next) y->next->prev = y->prev;
		if (y->prev) y->prev->next = y->next;
		if (IKS_TAG_ATTRIBS (x) == y) IKS_TAG_ATTRIBS (x) = y->next;
		if (IKS_TAG_LAST_ATTRIB (x) == y) IKS_TAG_LAST_ATTRIB (x) = y->prev;
	}

	return y;
}

iks *
iks_insert_node (iks *x, iks *y)
{
	y->parent = x;
	if (!IKS_TAG_CHILDREN (x)) IKS_TAG_CHILDREN (x) = y;
	if (IKS_TAG_LAST_CHILD (x)) {
		IKS_TAG_LAST_CHILD (x)->next = y;
		y->prev = IKS_TAG_LAST_CHILD (x);
	}
	IKS_TAG_LAST_CHILD (x) = y;
	return y;
}

iks *
iks_append (iks *x, const char *name)
{
	iks *y;

	if (!x) return NULL;
	y = iks_new_within (name, x->s);
	if (!y) return NULL;

	if (x->next) {
		x->next->prev = y;
	} else {
		IKS_TAG_LAST_CHILD (x->parent) = y;
	}
	y->next = x->next;
	x->next = y;
	y->parent = x->parent;
	y->prev = x;

	return y;
}

iks *
iks_prepend (iks *x, const char *name)
{
	iks *y;

	if (!x) return NULL;
	y = iks_new_within (name, x->s);
	if (!y) return NULL;

	if (x->prev) {
		x->prev->next = y;
	} else {
		IKS_TAG_CHILDREN (x->parent) = y;
	}
	y->prev = x->prev;
	x->prev = y;
	y->parent = x->parent;
	y->next = x;

	return y;
}

iks *
iks_append_cdata (iks *x, const char *data, size_t len)
{
	iks *y;

	if (!x || !data) return NULL;
	if (len == 0) len = strlen (data);

	y = iks_new_within (NULL, x->s);
	if (!y) return NULL;
	y->type = IKS_CDATA;
	IKS_CDATA_CDATA (y) = iks_stack_strdup (x->s, data, len);
	if (!IKS_CDATA_CDATA (y)) return NULL;
	IKS_CDATA_LEN (y) = len;

	if (x->next) {
		x->next->prev = y;
	} else {
		IKS_TAG_LAST_CHILD (x->parent) = y;
	}
	y->next = x->next;
	x->next = y;
	y->parent = x->parent;
	y->prev = x;

	return y;
}

iks *
iks_prepend_cdata (iks *x, const char *data, size_t len)
{
	iks *y;

	if (!x || !data) return NULL;
	if (len == 0) len = strlen (data);

	y = iks_new_within (NULL, x->s);
	if (!y) return NULL;
	y->type = IKS_CDATA;
	IKS_CDATA_CDATA(y) = iks_stack_strdup (x->s, data, len);
	if (!IKS_CDATA_CDATA (y)) return NULL;
	IKS_CDATA_LEN (y) = len;

	if (x->prev) {
		x->prev->next = y;
	} else {
		IKS_TAG_CHILDREN (x->parent) = y;
	}
	y->prev = x->prev;
	x->prev = y;
	y->parent = x->parent;
	y->next = x;

	return y;
}

void
iks_hide (iks *x)
{
	iks *y;

	if (!x) return;

	if (x->prev) x->prev->next = x->next;
	if (x->next) x->next->prev = x->prev;
	y = x->parent;
	if (y) {
		if (IKS_TAG_CHILDREN (y) == x) IKS_TAG_CHILDREN (y) = x->next;
		if (IKS_TAG_LAST_CHILD (y) == x) IKS_TAG_LAST_CHILD (y) = x->prev;
	}
}

void
iks_delete (iks *x)
{
	if (x) iks_stack_delete (x->s);
}

/*****  Node Traversing  *****/

iks *
iks_next (iks *x)
{
	if (x) return x->next;
	return NULL;
}

iks *
iks_next_tag (iks *x)
{
	if (x) {
		while (1) {
			x = x->next;
			if (NULL == x) break;
			if (IKS_TAG == x->type) return x;
		}
	}
	return NULL;
}

iks *
iks_prev (iks *x)
{
	if (x) return x->prev;
	return NULL;
}

iks *
iks_prev_tag (iks *x)
{
	if (x) {
		while (1) {
			x = x->prev;
			if (NULL == x) break;
			if (IKS_TAG == x->type) return x;
		}
	}
	return NULL;
}

iks *
iks_parent (iks *x)
{
	if (x) return x->parent;
	return NULL;
}

iks *
iks_root (iks *x)
{
	if (x) {
		while (x->parent)
			x = x->parent;
	}
	return x;
}

iks *
iks_child (iks *x)
{
	if (x && IKS_TAG == x->type) return IKS_TAG_CHILDREN (x);
	return NULL;
}

iks *
iks_first_tag (iks *x)
{
	if (x) {
		x = IKS_TAG_CHILDREN (x);
		while (x) {
			if (IKS_TAG == x->type) return x;
			x = x->next;
		}
	}
	return NULL;
}

iks *
iks_attrib (iks *x)
{
	if (x) return IKS_TAG_ATTRIBS (x);
	return NULL;
}

iks *
iks_find (iks *x, const char *name)
{
	iks *y;

	if (!x) return NULL;
	y = IKS_TAG_CHILDREN (x);
	while (y) {
		if (IKS_TAG == y->type && IKS_TAG_NAME (y) && strcmp (IKS_TAG_NAME (y), name) == 0) return y;
		y = y->next;
	}
	return NULL;
}

char *
iks_find_cdata (iks *x, const char *name)
{
	iks *y;

	y = iks_find (x, name);
	if (!y) return NULL;
	y = IKS_TAG_CHILDREN (y);
	if (!y || IKS_CDATA != y->type) return NULL;
	return IKS_CDATA_CDATA (y);
}

char *
iks_find_attrib (iks *x, const char *name)
{
	iks *y;

	if (!x) return NULL;

	y = IKS_TAG_ATTRIBS (x);
	while (y) {
		if (IKS_ATTRIB_NAME (y) && strcmp (IKS_ATTRIB_NAME (y), name) == 0)
			return IKS_ATTRIB_VALUE (y);
		y = y->next;
	}
	return NULL;
}

iks *
iks_find_with_attrib (iks *x, const char *tagname, const char *attrname, const char *value)
{
	iks *y;

	if (NULL == x) return NULL;

	if (tagname) {
		for (y = IKS_TAG_CHILDREN (x); y; y = y->next) {
			if (IKS_TAG == y->type
				&& strcmp (IKS_TAG_NAME (y), tagname) == 0
				&& iks_strcmp (iks_find_attrib (y, attrname), value) == 0) {
					return y;
			}
		}
	} else {
		for (y = IKS_TAG_CHILDREN (x); y; y = y->next) {
			if (IKS_TAG == y->type
				&& iks_strcmp (iks_find_attrib (y, attrname), value) == 0) {
					return y;
			}
		}
	}
	return NULL;
}

/*****  Node Information  *****/

ikstack *
iks_stack (iks *x)
{
	if (x) return x->s;
	return NULL;
}

enum ikstype
iks_type (iks *x)
{
	if (x) return x->type;
	return IKS_NONE;
}

char *
iks_name (iks *x)
{
	if (x) {
		if (IKS_TAG == x->type)
			return IKS_TAG_NAME (x);
		else
			return IKS_ATTRIB_NAME (x);
	}
	return NULL;
}

char *
iks_cdata (iks *x)
{
	if (x) {
		if (IKS_CDATA == x->type)
			return IKS_CDATA_CDATA (x);
		else
			return IKS_ATTRIB_VALUE (x);
	}
	return NULL;
}

size_t
iks_cdata_size (iks *x)
{
	if (x) return IKS_CDATA_LEN (x);
	return 0;
}

int
iks_has_children (iks *x)
{
	if (x && IKS_TAG == x->type && IKS_TAG_CHILDREN (x)) return 1;
	return 0;
}

int
iks_has_attribs (iks *x)
{
	if (x && IKS_TAG == x->type && IKS_TAG_ATTRIBS (x)) return 1;
	return 0;
}

/*****  Serializing  *****/

static size_t
escape_size (char *src, size_t len)
{
	size_t sz;
	char c;
	int i;

	sz = 0;
	for (i = 0; i < len; i++) {
		c = src[i];
		switch (c) {
			case '&': sz += 5; break;
			case '\'': sz += 6; break;
			case '"': sz += 6; break;
			case '<': sz += 4; break;
			case '>': sz += 4; break;
			default: sz++; break;
		}
	}
	return sz;
}

static char *
my_strcat (char *dest, char *src, size_t len)
{
	if (0 == len) len = strlen (src);
	memcpy (dest, src, len);
	return dest + len;
}

static char *
escape (char *dest, char *src, size_t len)
{
	char c;
	int i;
	int j = 0;

	for (i = 0; i < len; i++) {
		c = src[i];
		if ('&' == c || '<' == c || '>' == c || '\'' == c || '"' == c) {
			if (i - j > 0) dest = my_strcat (dest, src + j, i - j);
			j = i + 1;
			switch (c) {
			case '&': dest = my_strcat (dest, "&amp;", 5); break;
			case '\'': dest = my_strcat (dest, "&apos;", 6); break;
			case '"': dest = my_strcat (dest, "&quot;", 6); break;
			case '<': dest = my_strcat (dest, "&lt;", 4); break;
			case '>': dest = my_strcat (dest, "&gt;", 4); break;
			}
		}
	}
	if (i - j > 0) dest = my_strcat (dest, src + j, i - j);
	return dest;
}

char *
iks_string (ikstack *s, iks *x)
{
	size_t size;
	int level, dir;
	iks *y, *z;
	char *ret, *t;

	if (!x) return NULL;

	if (x->type == IKS_CDATA) {
		if (s) {
			return iks_stack_strdup (s, IKS_CDATA_CDATA (x), IKS_CDATA_LEN (x));
		} else {
			ret = iks_malloc (IKS_CDATA_LEN (x) + 1);
			memcpy (ret, IKS_CDATA_CDATA (x), IKS_CDATA_LEN (x) + 1);
			return ret;
		}
	}

	size = 0;
	level = 0;
	dir = 0;
	y = x;
	while (1) {
		if (dir==0) {
			if (y->type == IKS_TAG) {
				size++;
				size += strlen (IKS_TAG_NAME (y));
				for (z = IKS_TAG_ATTRIBS (y); z; z = z->next) {
					size += 4 + strlen (IKS_ATTRIB_NAME (z))
						+ escape_size (IKS_ATTRIB_VALUE (z), strlen (IKS_ATTRIB_VALUE (z)));
				}
				if (IKS_TAG_CHILDREN (y)) {
					size++;
					y = IKS_TAG_CHILDREN (y);
					level++;
					continue;
				} else {
					size += 2;
				}
			} else {
				size += escape_size (IKS_CDATA_CDATA (y), IKS_CDATA_LEN (y));
			}
		}
		z = y->next;
		if (z) {
			if (0 == level) {
				if (IKS_TAG_CHILDREN (y)) size += 3 + strlen (IKS_TAG_NAME (y));
				break;
			}
			y = z;
			dir = 0;
		} else {
			y = y->parent;
			level--;
			if (level >= 0) size += 3 + strlen (IKS_TAG_NAME (y));
			if (level < 1) break;
			dir = 1;
		}
	}

	if (s) ret = iks_stack_alloc (s, size + 1);
	else ret = iks_malloc (size + 1);

	if (!ret) return NULL;

	t = ret;
	level = 0;
	dir = 0;
	while (1) {
		if (dir==0) {
			if (x->type == IKS_TAG) {
				*t++ = '<';
				t = my_strcat (t, IKS_TAG_NAME (x), 0);
				y = IKS_TAG_ATTRIBS (x);
				while (y) {
					*t++ = ' ';
					t = my_strcat (t, IKS_ATTRIB_NAME (y), 0);
					*t++ = '=';
					*t++ = '\'';
					t = escape (t, IKS_ATTRIB_VALUE (y), strlen (IKS_ATTRIB_VALUE (y)));
					*t++ = '\'';
					y = y->next;
				}
				if (IKS_TAG_CHILDREN (x)) {
					*t++ = '>';
					x = IKS_TAG_CHILDREN (x);
					level++;
					continue;
				} else {
					*t++ = '/';
					*t++ = '>';
				}
			} else {
				t = escape (t, IKS_CDATA_CDATA (x), IKS_CDATA_LEN (x));
			}
		}
		y = x->next;
		if (y) {
			if (0 == level) {
				if (IKS_TAG_CHILDREN (x)) {
					*t++ = '<';
					*t++ = '/';
					t = my_strcat (t, IKS_TAG_NAME (x), 0);
					*t++ = '>';
				}
				break;
			}
			x = y;
			dir = 0;
		} else {
			x = x->parent;
			level--;
			if (level >= 0) {
					*t++ = '<';
					*t++ = '/';
					t = my_strcat (t, IKS_TAG_NAME (x), 0);
					*t++ = '>';
				}
			if (level < 1) break;
			dir = 1;
		}
	}
	*t = '\0';

	return ret;
}

/*****  Copying  *****/

iks *
iks_copy_within (iks *x, ikstack *s)
{
	int level=0, dir=0;
	iks *copy = NULL;
	iks *cur = NULL;
	iks *y;

	while (1) {
		if (dir == 0) {
			if (x->type == IKS_TAG) {
				if (copy == NULL) {
					copy = iks_new_within (IKS_TAG_NAME (x), s);
					cur = copy;
				} else {
					cur = iks_insert (cur, IKS_TAG_NAME (x));
				}
				for (y = IKS_TAG_ATTRIBS (x); y; y = y->next) {
					iks_insert_attrib (cur, IKS_ATTRIB_NAME (y), IKS_ATTRIB_VALUE (y));
				}
				if (IKS_TAG_CHILDREN (x)) {
					x = IKS_TAG_CHILDREN (x);
					level++;
					continue;
				} else {
					cur = cur->parent;
				}
			} else {
				iks_insert_cdata (cur, IKS_CDATA_CDATA (x), IKS_CDATA_LEN (x));
			}
		}
		y = x->next;
		if (y) {
			if (0 == level) break;
			x = y;
			dir = 0;
		} else {
			if (level < 2) break;
			level--;
			x = x->parent;
			cur = cur->parent;
			dir = 1;
		}
	}
	return copy;
}

iks *
iks_copy (iks *x)
{
	return iks_copy_within (x, iks_stack_new (sizeof (struct iks_tag) * 6, 256));
}
