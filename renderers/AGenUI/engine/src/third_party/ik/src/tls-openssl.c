/* iksemel (XML parser for Jabber)
** Copyright (C) 2010 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

#ifdef HAVE_OPENSSL

#include <openssl/ssl.h>

struct ikstls_data {
	SSL_CTX *ctx;
	SSL *ssl;
	ikstransport *trans;
	void *sock;
	int timeout;
};

static int init_done;

static int
my_bio_create (BIO *b)
{
	b->init = 1;
	b->num = 0;
	b->ptr = NULL;
	b->flags = 0 ;
	return 1;
}

static int
my_bio_destroy (BIO *b)
{
	if (b == 0) return 0;

	b->ptr = NULL;
	b->init = 0;
	b->flags = 0;
	return 1;
}

static int
my_bio_read (BIO *b, char *buf, int len)
{
	struct ikstls_data *data = (struct ikstls_data *) b->ptr;
	int ret;

	if (buf == NULL || len <= 0 || data == NULL) return 0;

	ret = data->trans->recv (data->sock, buf, len, data->timeout);
	BIO_clear_retry_flags (b);
	return ret;
}

static int
my_bio_write (BIO *b, const char *buf, int len)
{
	struct ikstls_data *data = (struct ikstls_data *) b->ptr;
	int ret;

	if (buf == NULL || len <= 0 || data == NULL) return 0;

	ret = data->trans->send (data->sock, buf, len);
	BIO_clear_retry_flags (b);
	return ret;
}

static long
my_bio_ctrl (BIO *b, int cmd, long num, void *ptr)
{
	if (cmd == BIO_CTRL_FLUSH ) {
		return 1;
	}
	return 0;
}

static int
my_bio_gets (BIO *b, char *buf, int len)
{
	return -1;
}

static int
my_bio_puts (BIO *b, const char *str)
{
	return my_bio_write (b, str, strlen(str));
}

static BIO_METHOD my_bio_method = {
	( 100 | 0x400 ),
	"iksemel transport",
	my_bio_write,
	my_bio_read,
	my_bio_puts,
	my_bio_gets,
	my_bio_ctrl,
	my_bio_create,
	my_bio_destroy
};

static int
tls_handshake (struct ikstls_data **datap, ikstransport *trans, void *sock)
{
	struct ikstls_data *data;
	BIO *bio;

	*datap = NULL;

	data = iks_malloc (sizeof(*data));
	if (!data) return IKS_NOMEM;
	memset (data, 0, sizeof(*data));
	data->trans = trans;
	data->sock = sock;
	data->timeout = -1;

	if (!init_done) {
		SSL_library_init ();
		init_done = 1;
	}

	data->ctx = SSL_CTX_new (SSLv23_client_method ());
	if (!data->ctx) {
		iks_free (data);
		return IKS_NOMEM;
	}

	data->ssl = SSL_new (data->ctx);
	if (!data->ssl) {
		iks_free (data);
		SSL_CTX_free (data->ctx);
		return IKS_NOMEM;
	}

	bio = BIO_new (&my_bio_method);
	bio->ptr = (void *) data;
	SSL_set_bio (data->ssl, bio, bio);
	if (SSL_connect (data->ssl) < 0) {
		SSL_free (data->ssl);
		SSL_CTX_free (data->ctx);
		iks_free (data);
		return IKS_NET_TLSFAIL;
	}

	*datap = data;
	return IKS_OK;
}

static int
tls_send (struct ikstls_data *data, const char *buf, size_t size)
{
	int r;

	r = SSL_write (data->ssl, buf, size);
	switch (SSL_get_error(data->ssl, r)) {
		case SSL_ERROR_NONE:
			return IKS_OK;
		default:
			return IKS_NET_RWERR;
	}
}

static int
tls_recv (struct ikstls_data *data, char *buf, size_t size, int timeout)
{
	int r;

	data->timeout = timeout;
	r = SSL_read (data->ssl, buf, size);
	switch (SSL_get_error(data->ssl, r)) {
		case SSL_ERROR_NONE:
			return IKS_OK;
		default:
			return IKS_NET_RWERR;
	}
}

static void
tls_terminate(struct ikstls_data *data)
{
	SSL_free (data->ssl);
	SSL_CTX_free (data->ctx);
	iks_free (data);
}

ikstls iks_default_tls = {
	tls_handshake,
	tls_send,
	tls_recv,
	tls_terminate
};

#endif /* HAVE_OPENSSL */
