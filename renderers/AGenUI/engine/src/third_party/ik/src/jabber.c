/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2003 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

iksid *
iks_id_new (ikstack *s, const char *jid)
{
	iksid *id;
	char *src, *tmp;

/* FIXME: add jabber id validity checks to this function */
/* which characters are allowed in id parts? */

	if (!jid) return NULL;
	id = iks_stack_alloc (s, sizeof (iksid));
	if (!id) return NULL;
	memset (id, 0, sizeof (iksid));

	/* skip scheme */
	if (strncmp ("jabber:", jid, 7) == 0) jid += 7;

	id->full = iks_stack_strdup (s, jid, 0);
	src = id->full;

	/* split resource */
	tmp = strchr (src, '/');
	if (tmp) {
		id->partial = iks_stack_strdup (s, src, tmp - src);
		id->resource = tmp + 1;
		src = id->partial;
	} else {
		id->partial = src;
	}

	/* split user */
	tmp = strchr (src, '@');
	if (tmp) {
		id->user = iks_stack_strdup (s, src, tmp - src);
		src = ++tmp;
	}

	id->server = src;

	return id;
}

int
iks_id_cmp (iksid *a, iksid *b, int parts)
{
	int diff;

	if (!a || !b) return (IKS_ID_RESOURCE | IKS_ID_USER | IKS_ID_SERVER);
	diff = 0;
	if (parts & IKS_ID_RESOURCE && !(!a->resource && !b->resource) && iks_strcmp (a->resource, b->resource) != 0)
		diff += IKS_ID_RESOURCE;
	if (parts & IKS_ID_USER && !(!a->user && !b->user) && iks_strcasecmp (a->user, b->user) != 0)
		diff += IKS_ID_USER;
	if (parts & IKS_ID_SERVER && !(!a->server && !b->server) && iks_strcmp (a->server, b->server) != 0)
		diff += IKS_ID_SERVER;
	return diff;
}

ikspak *
iks_packet (iks *x)
{
	ikspak *pak;
	ikstack *s;
	char *tmp;

	s = iks_stack (x);
	pak = iks_stack_alloc (s, sizeof (ikspak));
	if (!pak) return NULL;
	memset (pak, 0, sizeof (ikspak));
	pak->x = x;
	tmp = iks_find_attrib (x, "from");
	if (tmp) pak->from = iks_id_new (s, tmp);
	pak->id = iks_find_attrib (x, "id");

	tmp = iks_find_attrib (x, "type");
	if (strcmp (iks_name (x), "message") == 0) {
		pak->type = IKS_PAK_MESSAGE;
		if (tmp) {
			if (strcmp (tmp, "chat") == 0)
				pak->subtype = IKS_TYPE_CHAT;
			else if (strcmp (tmp, "groupchat") == 0)
				pak->subtype = IKS_TYPE_GROUPCHAT;
			else if (strcmp (tmp, "headline") == 0)
				pak->subtype = IKS_TYPE_HEADLINE;
			else if (strcmp (tmp, "error") == 0)
				pak->subtype = IKS_TYPE_ERROR;
		}
	} else if (strcmp (iks_name (x), "presence") == 0) {
		pak->type = IKS_PAK_S10N;
		if (tmp) {
			if (strcmp (tmp, "unavailable") == 0) {
				pak->type = IKS_PAK_PRESENCE;
				pak->subtype = IKS_TYPE_UNAVAILABLE;
				pak->show = IKS_SHOW_UNAVAILABLE;
			} else if (strcmp (tmp, "probe") == 0) {
				pak->type = IKS_PAK_PRESENCE;
				pak->subtype = IKS_TYPE_PROBE;
			} else if(strcmp(tmp, "subscribe") == 0)
				pak->subtype = IKS_TYPE_SUBSCRIBE;
			else if(strcmp(tmp, "subscribed") == 0)
				pak->subtype = IKS_TYPE_SUBSCRIBED;
			else if(strcmp(tmp, "unsubscribe") == 0)
				pak->subtype = IKS_TYPE_UNSUBSCRIBE;
			else if(strcmp(tmp, "unsubscribed") == 0)
				pak->subtype = IKS_TYPE_UNSUBSCRIBED;
			else if(strcmp(tmp, "error") == 0)
				pak->subtype = IKS_TYPE_ERROR;
		} else {
			pak->type = IKS_PAK_PRESENCE;
			pak->subtype = IKS_TYPE_AVAILABLE;
			tmp = iks_find_cdata (x, "show");
			pak->show = IKS_SHOW_AVAILABLE;
			if (tmp) {
				if (strcmp (tmp, "chat") == 0)
					pak->show = IKS_SHOW_CHAT;
				else if (strcmp (tmp, "away") == 0)
					pak->show = IKS_SHOW_AWAY;
				else if (strcmp (tmp, "xa") == 0)
					pak->show = IKS_SHOW_XA;
				else if (strcmp (tmp, "dnd") == 0)
					pak->show = IKS_SHOW_DND;
			}
		}
	} else if (strcmp (iks_name (x), "iq") == 0) {
		iks *q;
		pak->type = IKS_PAK_IQ;
		if (tmp) {
			if (strcmp (tmp, "get") == 0)
				pak->subtype = IKS_TYPE_GET;
			else if (strcmp (tmp, "set") == 0)
				pak->subtype = IKS_TYPE_SET;
			else if (strcmp (tmp, "result") == 0)
				pak->subtype = IKS_TYPE_RESULT;
			else if (strcmp (tmp, "error") == 0)
				pak->subtype = IKS_TYPE_ERROR;
		}
		for (q = iks_child (x); q; q = iks_next (q)) {
			if (IKS_TAG == iks_type (q)) {
				char *ns;
				ns = iks_find_attrib (q, "xmlns");
				if (ns) {
					pak->query = q;
					pak->ns = ns;
					break;
				}
			}
		}
	}
	return pak;
}

iks *
iks_make_auth (iksid *id, const char *pass, const char *sid)
{
	iks *x, *y;

	x = iks_new ("iq");
	iks_insert_attrib (x, "type", "set");
	y = iks_insert (x, "query");
	iks_insert_attrib (y, "xmlns", IKS_NS_AUTH);
	iks_insert_cdata (iks_insert (y, "username"), id->user, 0);
	iks_insert_cdata (iks_insert (y, "resource"), id->resource, 0);
	if(sid) {
		char buf[41];
		iksha *sha;
		sha = iks_sha_new ();
		iks_sha_hash (sha, (const unsigned char*)sid, strlen (sid), 0);
		iks_sha_hash (sha, (const unsigned char*)pass, strlen (pass), 1);
		iks_sha_print (sha, buf);
		iks_sha_delete (sha);
		iks_insert_cdata (iks_insert (y, "digest"), buf, 40);
	} else {
		iks_insert_cdata (iks_insert (y, "password"), pass, 0);
	}
	return x;
}

iks *
iks_make_msg (enum iksubtype type, const char *to, const char *body)
{
	iks *x;
	char *t = NULL;

	x = iks_new ("message");
	switch (type) {
	case IKS_TYPE_CHAT: t = "chat"; break;
	case IKS_TYPE_GROUPCHAT: t = "groupchat"; break;
	case IKS_TYPE_HEADLINE: t = "headline"; break;
	default: break;
	}
	if (t) iks_insert_attrib (x, "type", t);
	if (to) iks_insert_attrib (x, "to", to);
	if (body) iks_insert_cdata (iks_insert (x, "body"), body, 0);
	return x;
}

iks *
iks_make_s10n (enum iksubtype type, const char *to, const char *msg)
{
	iks *x;
	char *t;

	x = iks_new ("presence");
	switch (type) {
		case IKS_TYPE_SUBSCRIBE: t = "subscribe"; break;
		case IKS_TYPE_SUBSCRIBED: t = "subscribed"; break;
		case IKS_TYPE_UNSUBSCRIBE: t = "unsubscribe"; break;
		case IKS_TYPE_UNSUBSCRIBED: t = "unsubscribed"; break;
		case IKS_TYPE_PROBE: t = "probe"; break;
		default: t = NULL; break;
	}
	if (t) iks_insert_attrib (x, "type", t);
	if (to) iks_insert_attrib (x, "to", to);
	if (msg) iks_insert_cdata(iks_insert (x, "status"), msg, 0);
	return x;
}

iks *
iks_make_pres (enum ikshowtype show, const char *status)
{
	iks *x;
	char *t;

	x = iks_new ("presence");
	switch (show) {
		case IKS_SHOW_CHAT: t = "chat"; break;
		case IKS_SHOW_AWAY: t = "away"; break;
		case IKS_SHOW_XA: t = "xa"; break;
		case IKS_SHOW_DND: t = "dnd"; break;
		case IKS_SHOW_UNAVAILABLE:
			t = NULL;
			iks_insert_attrib (x, "type", "unavailable");
			break;
		default: t = NULL; break;
	}
	if (t) iks_insert_cdata (iks_insert (x, "show"), t, 0);
	if (status) iks_insert_cdata(iks_insert (x, "status"), status, 0);
	return x;
}

iks *
iks_make_iq (enum iksubtype type, const char *xmlns)
{
	iks *x;
	char *t = NULL;

	x = iks_new ("iq");
	switch (type) {
	case IKS_TYPE_GET: t = "get"; break;
	case IKS_TYPE_SET: t = "set"; break;
	case IKS_TYPE_RESULT: t = "result"; break;
	case IKS_TYPE_ERROR: t = "error"; break;
	default: break;
	}
	if (t) iks_insert_attrib (x, "type", t);
	iks_insert_attrib (iks_insert (x, "query"), "xmlns", xmlns);

	return x;
}

iks *
iks_make_resource_bind (iksid *id)
{
	iks *x, *y, *z;

	x = iks_new("iq");
	iks_insert_attrib(x, "type", "set");
	y = iks_insert(x, "bind");
	iks_insert_attrib(y, "xmlns", IKS_NS_XMPP_BIND);
	if (id->resource && iks_strcmp(id->resource, "")) {
		z = iks_insert(y, "resource");
		iks_insert_cdata(z, id->resource, 0);
	}
	return x;
}

iks *
iks_make_session (void)
{
	iks *x, *y;

	x = iks_new ("iq");
	iks_insert_attrib (x, "type", "set");
	y = iks_insert (x, "session");
	iks_insert_attrib (y, "xmlns", IKS_NS_XMPP_SESSION);
	return x;
}

static int
iks_sasl_mechanisms (iks *x)
{
	int sasl_mech = 0;

	while (x) {
		if (!iks_strcmp(iks_cdata(iks_child(x)), "DIGEST-MD5"))
			sasl_mech |= IKS_STREAM_SASL_MD5;
		else if (!iks_strcmp(iks_cdata(iks_child(x)), "PLAIN"))
			sasl_mech |= IKS_STREAM_SASL_PLAIN;
		x = iks_next_tag(x);
	}
	return sasl_mech;
}

int
iks_stream_features (iks *x)
{
	int features = 0;

	if (iks_strcmp(iks_name(x), "stream:features"))
		return 0;
	for (x = iks_child(x); x; x = iks_next_tag(x))
		if (!iks_strcmp(iks_name(x), "starttls"))
			features |= IKS_STREAM_STARTTLS;
		else if (!iks_strcmp(iks_name(x), "bind"))
			features |= IKS_STREAM_BIND;
		else if (!iks_strcmp(iks_name(x), "session"))
			features |= IKS_STREAM_SESSION;
		else if (!iks_strcmp(iks_name(x), "mechanisms"))
			features |= iks_sasl_mechanisms(iks_child(x));
	return features;
}
