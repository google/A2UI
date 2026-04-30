/*
 * Minimal config.h for iksemel (replaces autotools-generated config.h)
 *
 * This file provides the minimal configuration needed to build iksemel
 * without the autotools build system (configure/make). It is used when
 * building the vendored iksemel source via CMake.
 *
 * Original iksemel: Copyright (c) 2000-2007 Gurer Ozen
 * License: LGPL v2.1
 */

#ifndef _ASL_IKSEMEL_CONFIG_H_
#define _ASL_IKSEMEL_CONFIG_H_

/* Shared library symbol visibility */
#if defined(ASL_IKSEMEL_DLL) || defined(GLOBAL_LIB_EXPORT)
    #define IKSEMEL_EXPORT __attribute__ ((visibility ("default")))
#else
    #define IKSEMEL_EXPORT
#endif

/* Standard C headers (used by common.h to include stdlib.h, string.h, stdarg.h) */
#define STDC_HEADERS 1

/* POSIX standard headers (available on HarmonyOS / Linux / macOS) */
#define HAVE_STDLIB_H 1
#define HAVE_STRING_H 1
#define HAVE_UNISTD_H 1
#define HAVE_ERRNO_H 1
#define HAVE_STRINGS_H 1

/* Disable optional features not needed by AGenUI */
/* #undef HAVE_GNUTLS */
/* #undef HAVE_OPENSSL */

#endif /* _ASL_IKSEMEL_CONFIG_H_ */
