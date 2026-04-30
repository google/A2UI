/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2007 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

#define SF_FOREIGN 1
#define SF_TRY_SECURE 2
#define SF_SECURE 4

struct stream_data {
	iksparser *prs;
	ikstack *s;
	ikstransport *trans;
	char *name_space;
	void *user_data;
	const char *server;
	iksStreamHook *streamHook;
	iksLogHook *logHook;
	iks *current;
	char *buf;
	void *sock;
	unsigned int flags;
	char *auth_username;
	char *auth_pass;
	struct ikstls_data *tlsdata;
};

static void
insert_attribs (iks *x, char **atts)
{
	if (atts) {
		int i = 0;
		while (atts[i]) {
			iks_insert_attrib (x, atts[i], atts[i+1]);
			i += 2;
		}
	}
}

#define CNONCE_LEN 4

static void
parse_digest (char *message, const char *key, char **value_ptr, char **value_end_ptr)
{
	char *t;

	*value_ptr = NULL;
	*value_end_ptr = NULL;

	t = strstr(message, key);
	if (t) {
		t += strlen(key);
		*value_ptr = t;
		while (t[0] != '\0') {
			if (t[0] != '\\' && t[1] == '"') {
				++t;
				*value_end_ptr = t;
				return;
			}
			++t;
		}
	}
}

static iks *
make_sasl_response (struct stream_data *data, char *message)
{
	iks *x = NULL;
	char *realm, *realm_end;
	char *nonce, *nonce_end;
	char cnonce[CNONCE_LEN*8 + 1];
	iksmd5 *md5;
	unsigned char a1_h[16], a1[33], a2[33], response_value[33];
	char *response, *response_coded;
	int i;

	parse_digest(message, "realm=\"", &realm, &realm_end);
	parse_digest(message, "nonce=\"", &nonce, &nonce_end);

	/* nonce is necessary for auth */
	if (!nonce || !nonce_end) return NULL;
	*nonce_end = '\0';

	/* if no realm is given use the server hostname */
	if (realm) {
		if (!realm_end) return NULL;
		*realm_end = '\0';
	} else {
		realm = (char *) data->server;
	}

	/* generate random client challenge */
	for (i = 0; i < CNONCE_LEN; ++i)
		sprintf (cnonce + i*8, "%08x", rand());

	md5 = iks_md5_new();
	if (!md5) return NULL;

	iks_md5_hash (md5, (const unsigned char*)data->auth_username, iks_strlen (data->auth_username), 0);
	iks_md5_hash (md5, (const unsigned char*)":", 1, 0);
	iks_md5_hash (md5, (const unsigned char*)realm, iks_strlen (realm), 0);
	iks_md5_hash (md5, (const unsigned char*)":", 1, 0);
	iks_md5_hash (md5, (const unsigned char*)data->auth_pass, iks_strlen (data->auth_pass), 1);
	iks_md5_digest (md5, a1_h);

	iks_md5_reset (md5);
	iks_md5_hash (md5, (const unsigned char*)a1_h, 16, 0);
	iks_md5_hash (md5, (const unsigned char*)":", 1, 0);
	iks_md5_hash (md5, (const unsigned char*)nonce, iks_strlen (nonce), 0);
	iks_md5_hash (md5, (const unsigned char*)":", 1, 0);
	iks_md5_hash (md5, (const unsigned char*)cnonce, iks_strlen (cnonce), 1);
	iks_md5_print (md5, (char*)a1);

	iks_md5_reset (md5);
	iks_md5_hash (md5, (const unsigned char*)"AUTHENTICATE:xmpp/", 18, 0);
	iks_md5_hash (md5, (const unsigned char*)data->server, iks_strlen (data->server), 1);
	iks_md5_print (md5, (char*)a2);

	iks_md5_reset (md5);
	iks_md5_hash (md5, (const unsigned char*)a1, 32, 0);
	iks_md5_hash (md5, (const unsigned char*)":", 1, 0);
	iks_md5_hash (md5, (const unsigned char*)nonce, iks_strlen (nonce), 0);
	iks_md5_hash (md5, (const unsigned char*)":00000001:", 10, 0);
	iks_md5_hash (md5, (const unsigned char*)cnonce, iks_strlen (cnonce), 0);
	iks_md5_hash (md5, (const unsigned char*)":auth:", 6, 0);
	iks_md5_hash (md5, (const unsigned char*)a2, 32, 1);
	iks_md5_print (md5, (char*)response_value);

	iks_md5_delete (md5);

	i = iks_strlen (data->auth_username) + iks_strlen (realm) +
		iks_strlen (nonce) + iks_strlen (data->server) +
		CNONCE_LEN*8 + 136;
	response = iks_malloc (i);
	if (!response) return NULL;

	sprintf (response, "username=\"%s\",realm=\"%s\",nonce=\"%s\""
		",cnonce=\"%s\",nc=00000001,qop=auth,digest-uri=\""
		"xmpp/%s\",response=%s,charset=utf-8",
		data->auth_username, realm, nonce, cnonce,
		data->server, response_value);

	response_coded = iks_base64_encode (response, 0);
	if (response_coded) {
		x = iks_new ("response");
		iks_insert_cdata (x, response_coded, 0);
		iks_free (response_coded);
	}
	iks_free (response);

	return x;
}

static void
iks_sasl_challenge (struct stream_data *data, iks *challenge)
{
	char *message;
	iks *x;
	char *tmp;

	tmp = iks_cdata (iks_child (challenge));
	if (!tmp) return;

	/* decode received blob */
	message = iks_base64_decode (tmp);
	if (!message) return;

	/* reply the challenge */
	if (strstr (message, "rspauth")) {
		x = iks_new ("response");
	} else {
		x = make_sasl_response (data, message);
	}
	if (x) {
		iks_insert_attrib (x, "xmlns", IKS_NS_XMPP_SASL);
		iks_send (data->prs, x);
		iks_delete (x);
	}
	iks_free (message);
}

static int
tagHook (struct stream_data *data, char *name, char **atts, int type)
{
	iks *x;
	int err;

	switch (type) {
		case IKS_OPEN:
		case IKS_SINGLE:
			if (data->flags & SF_TRY_SECURE) {
				if (strcmp (name, "proceed") == 0) {
					err = iks_default_tls.handshake (&data->tlsdata,
						data->trans, data->sock);
					if (err == IKS_OK) {
						data->flags &= (~SF_TRY_SECURE);
						data->flags |= SF_SECURE;
						iks_send_header (data->prs, data->server);
					}
					return err;
				} else if (strcmp (name, "failure") == 0){
					return IKS_NET_TLSFAIL;
				}
			}
			if (data->current) {
				x = iks_insert (data->current, name);
				insert_attribs (x, atts);
			} else {
				x = iks_new (name);
				insert_attribs (x, atts);
				if (iks_strcmp (name, "stream:stream") == 0) {
					err = data->streamHook (data->user_data, IKS_NODE_START, x);
					if (err != IKS_OK) return err;
					break;
				}
			}
			data->current = x;
			if (IKS_OPEN == type) break;
		case IKS_CLOSE:
			x = data->current;
			if (NULL == x) {
				err = data->streamHook (data->user_data, IKS_NODE_STOP, NULL);
				if (err != IKS_OK) return err;
				break;
			}
			if (NULL == iks_parent (x)) {
				data->current = NULL;
				if (iks_strcmp (name, "challenge") == 0) {
					iks_sasl_challenge(data, x);
					iks_delete (x);
				} else if (iks_strcmp (name, "stream:error") == 0) {
					err = data->streamHook (data->user_data, IKS_NODE_ERROR, x);
					if (err != IKS_OK) return err;
				} else {
					err = data->streamHook (data->user_data, IKS_NODE_NORMAL, x);
					if (err != IKS_OK) return err;
				}
				break;
			}
			data->current = iks_parent (x);
	}
	return IKS_OK;
}

static int
cdataHook (struct stream_data *data, char *cdata, size_t len)
{
	if (data->current) iks_insert_cdata (data->current, cdata, len);
	return IKS_OK;
}

static void
deleteHook (struct stream_data *data)
{
	if (data->flags & SF_SECURE) {
		iks_default_tls.terminate(data->tlsdata);
		data->tlsdata = NULL;
	}
	if (data->trans) data->trans->close (data->sock);
	data->trans = NULL;
	if (data->current) iks_delete (data->current);
	data->current = NULL;
	data->flags = 0;
}

iksparser *
iks_stream_new (char *name_space, void *user_data, iksStreamHook *streamHook)
{
	ikstack *s;
	struct stream_data *data;

	s = iks_stack_new (DEFAULT_STREAM_CHUNK_SIZE, 0);
	if (NULL == s) return NULL;
	data = iks_stack_alloc (s, sizeof (struct stream_data));
	memset (data, 0, sizeof (struct stream_data));
	data->s = s;
	data->prs = iks_sax_extend (s, data, (iksTagHook *)tagHook, (iksCDataHook *)cdataHook, (iksDeleteHook *)deleteHook);
	data->name_space = name_space;
	data->user_data = user_data;
	data->streamHook = streamHook;
	return data->prs;
}

void *
iks_stream_user_data (iksparser *prs)
{
	struct stream_data *data = iks_user_data (prs);

	return data->user_data;
}

void
iks_set_log_hook (iksparser *prs, iksLogHook *logHook)
{
	struct stream_data *data = iks_user_data (prs);

	data->logHook = logHook;
}

int
iks_connect_tcp (iksparser *prs, const char *server, int port)
{
#ifdef USE_DEFAULT_IO
	return iks_connect_with (prs, server, port, server, &iks_default_transport);
#else
	return IKS_NET_NOTSUPP;
#endif
}

int
iks_connect_via (iksparser *prs, const char *server, int port, const char *server_name)
{
#ifdef USE_DEFAULT_IO
	return iks_connect_with (prs, server, port, server_name, &iks_default_transport);
#else
	return IKS_NET_NOTSUPP;
#endif
}

int
iks_connect_with (iksparser *prs, const char *server, int port, const char *server_name, ikstransport *trans)
{
	struct stream_data *data = iks_user_data (prs);
	int ret;

	if (!trans->connect) return IKS_NET_NOTSUPP;

	if (!data->buf) {
		data->buf = iks_stack_alloc (data->s, NET_IO_BUF_SIZE);
		if (NULL == data->buf) return IKS_NOMEM;
	}

	ret = trans->connect (prs, &data->sock, server, port);
	if (ret) return ret;

	data->trans = trans;

	return iks_send_header (prs, server_name);
}

int
iks_connect_async (iksparser *prs, const char *server, int port, void *notify_data, iksAsyncNotify *notify_func)
{
#ifdef USE_DEFAULT_IO
	return iks_connect_async_with (prs, server, port, server, &iks_default_transport, notify_data, notify_func);
#else
	return IKS_NET_NOTSUPP;
#endif
}

int
iks_connect_async_with (iksparser *prs, const char *server, int port, const char *server_name, ikstransport *trans, void *notify_data, iksAsyncNotify *notify_func)
{
	struct stream_data *data = iks_user_data (prs);
	int ret;

	if (NULL == trans->connect_async)
		return IKS_NET_NOTSUPP;

	if (!data->buf) {
		data->buf = iks_stack_alloc (data->s, NET_IO_BUF_SIZE);
		if (NULL == data->buf) return IKS_NOMEM;
	}

	ret = trans->connect_async (prs, &data->sock, server, server_name, port, notify_data, notify_func);
	if (ret) return ret;

	data->trans = trans;
	data->server = server_name;

	return IKS_OK;
}

int
iks_connect_fd (iksparser *prs, int fd)
{
#ifdef USE_DEFAULT_IO
	struct stream_data *data = iks_user_data (prs);

	if (!data->buf) {
		data->buf = iks_stack_alloc (data->s, NET_IO_BUF_SIZE);
		if (NULL == data->buf) return IKS_NOMEM;
	}

	data->sock = (void *) fd;
	data->flags |= SF_FOREIGN;
	data->trans = &iks_default_transport;

	return IKS_OK;
#else
	return IKS_NET_NOTSUPP;
#endif
}

int
iks_fd (iksparser *prs)
{
	struct stream_data *data = iks_user_data (prs);

	return (int) data->sock;
}

int
iks_recv (iksparser *prs, int timeout)
{
	struct stream_data *data = iks_user_data (prs);
	int len, ret;

	while (1) {
		if (data->flags & SF_SECURE) {
			len = iks_default_tls.recv(data->tlsdata, data->buf,
				NET_IO_BUF_SIZE - 1, timeout);
		} else {
			len = data->trans->recv (data->sock, data->buf, NET_IO_BUF_SIZE - 1, timeout);
		}
		if (len < 0) return IKS_NET_RWERR;
		if (len == 0) break;
		data->buf[len] = '\0';
		if (data->logHook) data->logHook (data->user_data, data->buf, len, 1);
		ret = iks_parse (prs, data->buf, len, 0);
		if (ret != IKS_OK) return ret;
		if (!data->trans) {
			/* stream hook called iks_disconnect */
			return IKS_NET_NOCONN;
		}
		timeout = 0;
	}
	return IKS_OK;
}

int
iks_send_header (iksparser *prs, const char *to)
{
	struct stream_data *data = iks_user_data (prs);
	char *msg;
	int len, err;

	len = 91 + strlen (data->name_space) + 6 + strlen (to) + 16 + 1;
	msg = iks_malloc (len);
	if (!msg) return IKS_NOMEM;
	sprintf (msg, "<?xml version='1.0'?>"
		"<stream:stream xmlns:stream='http://etherx.jabber.org/streams' xmlns='"
		"%s' to='%s' version='1.0'>", data->name_space, to);
	err = iks_send_raw (prs, msg);
	iks_free (msg);
	if (err) return err;
	data->server = to;
	return IKS_OK;
}

int
iks_send (iksparser *prs, iks *x)
{
	return iks_send_raw (prs, iks_string (iks_stack (x), x));
}

int
iks_send_raw (iksparser *prs, const char *xmlstr)
{
	struct stream_data *data = iks_user_data (prs);
	int ret;

	if (data->flags & SF_SECURE) {
		if (iks_default_tls.send(data->tlsdata, xmlstr, strlen (xmlstr)) != IKS_OK)
			return IKS_NET_RWERR;
	} else {
		ret = data->trans->send (data->sock, xmlstr, strlen (xmlstr));
		if (ret) return ret;
	}
	if (data->logHook) data->logHook (data->user_data, xmlstr, strlen (xmlstr), 0);
	return IKS_OK;
}

void
iks_disconnect (iksparser *prs)
{
	iks_parser_reset (prs);
}

/*****  tls api  *****/

int
iks_has_tls (void)
{
	return iks_default_tls.handshake != NULL;
}

int
iks_is_secure (iksparser *prs)
{
	struct stream_data *data = iks_user_data (prs);

	return data->flags & SF_SECURE;
}

int
iks_start_tls (iksparser *prs)
{
	int ret;
	struct stream_data *data = iks_user_data (prs);

	if (iks_default_tls.handshake == NULL)
		return IKS_NET_NOTSUPP;

	ret = iks_send_raw (prs, "<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>");
	if (ret) return ret;
	data->flags |= SF_TRY_SECURE;
	return IKS_OK;
}

/*****  sasl  *****/

int
iks_start_sasl (iksparser *prs, enum ikssasltype type, char *username, char *pass)
{
	iks *x;

	x = iks_new ("auth");
	iks_insert_attrib (x, "xmlns", IKS_NS_XMPP_SASL);
	switch (type) {
		case IKS_SASL_PLAIN: {
			int len = iks_strlen (username) + iks_strlen (pass) + 2;
			char *s = iks_malloc (80+len);
			char *base64;

			iks_insert_attrib (x, "mechanism", "PLAIN");
			sprintf (s, "%c%s%c%s", 0, username, 0, pass);
			base64 = iks_base64_encode (s, len);
			iks_insert_cdata (x, base64, 0);
			iks_free (base64);
			iks_free (s);
			break;
		}
		case IKS_SASL_DIGEST_MD5: {
			struct stream_data *data = iks_user_data (prs);

			iks_insert_attrib (x, "mechanism", "DIGEST-MD5");
			data->auth_username = username;
			data->auth_pass = pass;
			break;
		}
		default:
			iks_delete (x);
			return IKS_NET_NOTSUPP;
	}
	iks_send (prs, x);
	iks_delete (x);
	return IKS_OK;
}
