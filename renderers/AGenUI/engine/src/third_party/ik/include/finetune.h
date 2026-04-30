/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2003 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

/* minimum sax buffer size */
#define SAX_BUFFER_MIN_SIZE 128

/* sax parser structure plus extra data of dom parser */
#define DEFAULT_DOM_CHUNK_SIZE 256

/* sax parser structure plus extra data of stream parser */
#define DEFAULT_STREAM_CHUNK_SIZE 256

/* iks structure, its data, child iks structures, for stream parsing */
#define DEFAULT_IKS_CHUNK_SIZE 1024

/* iks structure, its data, child iks structures, for file parsing */
#define DEFAULT_DOM_IKS_CHUNK_SIZE 2048

/* rule structure and from/to/id/ns strings */
#define DEFAULT_RULE_CHUNK_SIZE 128

/* file is read by blocks with this size */
#define FILE_IO_BUF_SIZE 4096

/* network receive buffer */
#define NET_IO_BUF_SIZE 4096
