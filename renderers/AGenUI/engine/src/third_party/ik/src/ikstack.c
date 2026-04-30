/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2004 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

struct align_test { char a; double b; };
#define DEFAULT_ALIGNMENT  ((size_t) ((char *) &((struct align_test *) 0)->b - (char *) 0))
#define ALIGN_MASK ( DEFAULT_ALIGNMENT - 1 )
#define MIN_CHUNK_SIZE ( DEFAULT_ALIGNMENT * 8 )
#define MIN_ALLOC_SIZE DEFAULT_ALIGNMENT
#define ALIGN(x) ( (x) + (DEFAULT_ALIGNMENT - ( (x) & ALIGN_MASK)) )

typedef struct ikschunk_struct {
	struct ikschunk_struct *next;
	size_t size;
	size_t used;
	size_t last;
	char data[4];
} ikschunk;

struct ikstack_struct {
	size_t allocated;
	ikschunk *meta;
	ikschunk *data;
};

static ikschunk *
find_space (ikstack *s, ikschunk *c, size_t size)
{
	/* FIXME: dont use *2 after over allocated chunks */
	while (1) {
		if (c->size - c->used >= size) return c;
		if (!c->next) {
			if ((c->size * 2) > size) size = c->size * 2;
			c->next = iks_malloc (sizeof (ikschunk) + size);
			if (!c->next) return NULL;
			s->allocated += sizeof (ikschunk) + size;
			c = c->next;
			c->next = NULL;
			c->size = size;
			c->used = 0;
			c->last = (size_t) -1;
			return c;
		}
		c = c->next;
	}
	return NULL;
}

ikstack *
iks_stack_new (size_t meta_chunk, size_t data_chunk)
{
	ikstack *s;
	size_t len;

	if (meta_chunk < MIN_CHUNK_SIZE) meta_chunk = MIN_CHUNK_SIZE;
	if (meta_chunk & ALIGN_MASK) meta_chunk = ALIGN (meta_chunk);
	if (data_chunk < MIN_CHUNK_SIZE) data_chunk = MIN_CHUNK_SIZE;
	if (data_chunk & ALIGN_MASK) data_chunk = ALIGN (data_chunk);

	len = sizeof (ikstack) + meta_chunk + data_chunk + (sizeof (ikschunk) * 2);
	s = iks_malloc (len);
	if (!s) return NULL;
	s->allocated = len;
	s->meta = (ikschunk *) ((char *) s + sizeof (ikstack));
	s->meta->next = NULL;
	s->meta->size = meta_chunk;
	s->meta->used = 0;
	s->meta->last = (size_t) -1;
	s->data = (ikschunk *) ((char *) s + sizeof (ikstack) + sizeof (ikschunk) + meta_chunk);
	s->data->next = NULL;
	s->data->size = data_chunk;
	s->data->used = 0;
	s->data->last = (size_t) -1;
	return s;
}

void *
iks_stack_alloc (ikstack *s, size_t size)
{
	ikschunk *c;
	void *mem;

	if (size < MIN_ALLOC_SIZE) size = MIN_ALLOC_SIZE;
	if (size & ALIGN_MASK) size = ALIGN (size);

	c = find_space (s, s->meta, size);
	if (!c) return NULL;
	mem = c->data + c->used;
	c->used += size;
	return mem;
}

char *
iks_stack_strdup (ikstack *s, const char *src, size_t len)
{
	ikschunk *c;
	char *dest;

	if (!src) return NULL;
	if (0 == len) len = strlen (src);

	c = find_space (s, s->data, len + 1);
	if (!c) return NULL;
	dest = c->data + c->used;
	c->last = c->used;
	c->used += len + 1;
	memcpy (dest, src, len);
	dest[len] = '\0';
	return dest;
}

char *
iks_stack_strcat (ikstack *s, char *old, size_t old_len, const char *src, size_t src_len)
{
	char *ret;
	ikschunk *c;

	if (!old) {
		return iks_stack_strdup (s, src, src_len);
	}
	if (0 == old_len) old_len = strlen (old);
	if (0 == src_len) src_len = strlen (src);

	for (c = s->data; c; c = c->next) {
		if (c->data + c->last == old) break;
	}
	if (!c) {
		c = find_space (s, s->data, old_len + src_len + 1);
		if (!c) return NULL;
		ret = c->data + c->used;
		c->last = c->used;
		c->used += old_len + src_len + 1;
		memcpy (ret, old, old_len);
		memcpy (ret + old_len, src, src_len);
		ret[old_len + src_len] = '\0';
		return ret;
	}

	if (c->size - c->used > src_len) {
		ret = c->data + c->last;
		memcpy (ret + old_len, src, src_len);
		c->used += src_len;
		ret[old_len + src_len] = '\0';
	} else {
		/* FIXME: decrease c->used before moving string to new place */
		c = find_space (s, s->data, old_len + src_len + 1);
		if (!c) return NULL;
		c->last = c->used;
		ret = c->data + c->used;
		memcpy (ret, old, old_len);
		c->used += old_len;
		memcpy (c->data + c->used, src, src_len);
		c->used += src_len;
		c->data[c->used] = '\0';
		c->used++;
	}
	return ret;
}

void
iks_stack_stat (ikstack *s, size_t *allocated, size_t *used)
{
	ikschunk *c;

	if (allocated) {
		*allocated = s->allocated;
	}
	if (used) {
		*used = 0;
		for (c = s->meta; c; c = c->next) {
			(*used) += c->used;
		}
		for (c = s->data; c; c = c->next) {
			(*used) += c->used;
		}
	}
}

void
iks_stack_delete (ikstack *s)
{
	ikschunk *c, *tmp;

	c = s->meta->next;
	while (c) {
		tmp = c->next;
		iks_free (c);
		c = tmp;
	}
	c = s->data->next;
	while (c) {
		tmp = c->next;
		iks_free (c);
		c = tmp;
	}
	iks_free (s);
}
