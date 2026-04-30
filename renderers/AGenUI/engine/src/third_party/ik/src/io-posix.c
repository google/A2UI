/* iksemel (XML parser for Jabber)
** Copyright (C) 2004 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

#include <errno.h>
#ifdef _WIN32
#include <winsock.h>
#else
#include <netdb.h>
#include <sys/time.h>
#include <sys/socket.h>
#include <netinet/in.h>
#endif

static void
io_close (void *socket)
{
	int sock = (int) socket;
#ifdef _WIN32
	closesocket (sock);
#else
	close (sock);
#endif
}

static int
io_connect (iksparser *prs, void **socketptr, const char *server, int port)
{
	int sock = -1;
	int tmp;
#ifdef HAVE_GETADDRINFO
	struct addrinfo hints;
	struct addrinfo *addr_res, *addr_ptr;
	char port_str[6];
	int err = 0;

	hints.ai_flags = AI_CANONNAME;
	hints.ai_family = PF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = 0;
	hints.ai_addrlen = 0;
	hints.ai_canonname = NULL;
	hints.ai_addr = NULL;
	hints.ai_next = NULL;
	sprintf (port_str, "%i", port);

	if (getaddrinfo (server, port_str, &hints, &addr_res) != 0)
		return IKS_NET_NODNS;

	addr_ptr = addr_res;
	while (addr_ptr) {
		err = IKS_NET_NOSOCK;
		sock = socket (addr_ptr->ai_family, addr_ptr->ai_socktype, addr_ptr->ai_protocol);
		if (sock != -1) {
			err = IKS_NET_NOCONN;
			tmp = connect (sock, addr_ptr->ai_addr, addr_ptr->ai_addrlen);
			if (tmp == 0) break;
			io_close ((void *) sock);
			sock = -1;
		}
		addr_ptr = addr_ptr->ai_next;
	}
	freeaddrinfo (addr_res);

	if (sock == -1) return err;
#else
	struct hostent *host;
	struct sockaddr_in sin;

	host = gethostbyname (server);
	if (!host) return IKS_NET_NODNS;

	memcpy (&sin.sin_addr, host->h_addr, host->h_length);
	sin.sin_family = host->h_addrtype;
	sin.sin_port = htons (port);
	sock = socket (host->h_addrtype, SOCK_STREAM, 0);
	if (sock == -1) return IKS_NET_NOSOCK;

	tmp = connect (sock, (struct sockaddr *)&sin, sizeof (struct sockaddr_in));
	if (tmp != 0) {
		io_close ((void *) sock);
		return IKS_NET_NOCONN;
	}
#endif

	*socketptr = (void *) sock;

	return IKS_OK;
}

static int
io_send (void *socket, const char *data, size_t len)
{
	int sock = (int) socket;
	int ret;

	while (len > 0) {
		ret = send (sock, data, len, 0);
		if (ret == -1) {
			if (errno == EAGAIN || errno == EINTR) {
				// Signalled, try again
				continue;
			}
			// Real error
			return IKS_NET_RWERR;
		} else {
			len -= ret;
			data += ret;
		}
	}
	return IKS_OK;
}

static int
io_recv (void *socket, char *buffer, size_t buf_len, int timeout)
{
	int sock = (int) socket;
	fd_set fds;
	struct timeval tv, *tvptr;
	int len;

	tv.tv_sec = 0;
	tv.tv_usec = 0;

	FD_ZERO (&fds);
	FD_SET (sock, &fds);
	tv.tv_sec = timeout;
	if (timeout != -1) tvptr = &tv; else tvptr = NULL;
	if (select (sock + 1, &fds, NULL, NULL, tvptr) > 0) {
		do {
			len = recv (sock, buffer, buf_len, 0);
		} while (len == -1 && (errno == EAGAIN || errno == EINTR));
		if (len > 0) {
			return len;
		} else if (len <= 0) {
			return -1;
		}
	}
	return 0;
}

ikstransport iks_default_transport = {
	IKS_TRANSPORT_V1,
	io_connect,
	io_send,
	io_recv,
	io_close,
	NULL
};
