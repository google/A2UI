/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2003 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

static void sha_buffer (iksha *sha, const unsigned char *data, int len);
static void sha_calculate (iksha *sha);

struct iksha_struct {
	unsigned int hash[5];
	unsigned int buf[80];
	int blen;
	unsigned int lenhi, lenlo;
};

iksha *
iks_sha_new (void)
{
	iksha *sha;

	sha = iks_malloc (sizeof (iksha));
	if (!sha) return NULL;
	iks_sha_reset (sha);
	return sha;
}

void
iks_sha_reset (iksha *sha)
{
	memset (sha, 0, sizeof (iksha));
	sha->hash[0] = 0x67452301;
	sha->hash[1] = 0xefcdab89;
	sha->hash[2] = 0x98badcfe;
	sha->hash[3] = 0x10325476;
	sha->hash[4] = 0xc3d2e1f0;
}

void
iks_sha_hash (iksha *sha, const unsigned char *data, size_t len, int finish)
{
	unsigned char pad[8];
	unsigned char padc;

	if (data && len != 0) sha_buffer (sha, data, len);
	if (!finish) return;

	pad[0] = (unsigned char)((sha->lenhi >> 24) & 0xff);
	pad[1] = (unsigned char)((sha->lenhi >> 16) & 0xff);
	pad[2] = (unsigned char)((sha->lenhi >> 8) & 0xff);
	pad[3] = (unsigned char)(sha->lenhi & 0xff);
	pad[4] = (unsigned char)((sha->lenlo >> 24) & 0xff);
	pad[5] = (unsigned char)((sha->lenlo >> 16) & 0xff);
	pad[6] = (unsigned char)((sha->lenlo >> 8) & 0xff);
	pad[7] = (unsigned char)(sha->lenlo & 255);

	padc = 0x80;
	sha_buffer (sha, &padc, 1);

	padc = 0x00;
	while (sha->blen != 56)
		sha_buffer (sha, &padc, 1);

	sha_buffer (sha, pad, 8);
}

void
iks_sha_print (iksha *sha, char *hash)
{
	int i;

	for (i=0; i<5; i++)
	{
		sprintf (hash, "%08x", sha->hash[i]);
		hash += 8;
	}
}

void
iks_sha_delete (iksha *sha)
{
	iks_free (sha);
}

void
iks_sha (const char *data, char *hash)
{
	iksha *sha;

	sha = iks_sha_new ();
	iks_sha_hash (sha, (const unsigned char*)data, strlen (data), 1);
	iks_sha_print (sha, hash);
	iks_free (sha);
}

static void
sha_buffer (iksha *sha, const unsigned char *data, int len)
{
	int i;

	for (i=0; i<len; i++) {
		sha->buf[sha->blen / 4] <<= 8;
		sha->buf[sha->blen / 4] |= (unsigned int)data[i];
		if ((++sha->blen) % 64 == 0) {
			sha_calculate (sha);
			sha->blen = 0;
		}
		sha->lenlo += 8;
		sha->lenhi += (sha->lenlo < 8);
	}
}

#define SRL(x,y) (((x) << (y)) | ((x) >> (32-(y))))
#define SHA(a,b,f,c) \
	for (i= (a) ; i<= (b) ; i++) { \
		TMP = SRL(A,5) + ( (f) ) + E + sha->buf[i] + (c) ; \
		E = D; \
		D = C; \
		C = SRL(B,30); \
		B = A; \
		A = TMP; \
	}

static void
sha_calculate (iksha *sha)
{
	int i;
	unsigned int A, B, C, D, E, TMP;

	for (i=16; i<80; i++)
		sha->buf[i] = SRL (sha->buf[i-3] ^ sha->buf[i-8] ^ sha->buf[i-14] ^ sha->buf[i-16], 1);

	A = sha->hash[0];
	B = sha->hash[1];
	C = sha->hash[2];
	D = sha->hash[3];
	E = sha->hash[4];

	SHA (0,  19, ((C^D)&B)^D,     0x5a827999);
	SHA (20, 39, B^C^D,           0x6ed9eba1);
	SHA (40, 59, (B&C)|(D&(B|C)), 0x8f1bbcdc);
	SHA (60, 79, B^C^D,           0xca62c1d6);

	sha->hash[0] += A;
	sha->hash[1] += B;
	sha->hash[2] += C;
	sha->hash[3] += D;
	sha->hash[4] += E;
}
