#include "nlohmann/json-schema.hpp"

#include "smtp-address-validator.hpp"

#include <algorithm>
#include <exception>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#ifdef JSON_SCHEMA_BOOST_REGEX
#	include <boost/regex.hpp>
#	define REGEX_NAMESPACE boost
#elif defined(JSON_SCHEMA_NO_REGEX)
#	define NO_STD_REGEX
#else
#	include <regex>
#	define REGEX_NAMESPACE std
#endif

/**
 * Many of the RegExes are from @see http://jmrware.com/articles/2009/uri_regexp/URI_regex.html
 */

namespace
{
	template <typename T>
	void range_check(const T value, const T min, const T max)
	{
		if (!((value >= min) && (value <= max))) {
			std::stringstream out;
			out << "Value " << value << " should be in interval [" << min << "," << max << "] but is not!";
			throw std::invalid_argument(out.str());
		}
	}

/** @see date_time_check */
	void rfc3339_date_check(const std::string &value)
	{
		const static REGEX_NAMESPACE::regex dateRegex{R"(^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$)"};

		REGEX_NAMESPACE::smatch matches;
		if (!REGEX_NAMESPACE::regex_match(value, matches, dateRegex)) {
			throw std::invalid_argument(value + " is not a date string according to RFC 3339.");
		}

		const auto year = std::stoi(matches[1].str());
		const auto month = std::stoi(matches[2].str());
		const auto mday = std::stoi(matches[3].str());

		const auto isLeapYear = (year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0));

		range_check(month, 1, 12);
		if (month == 2) {
			range_check(mday, 1, isLeapYear ? 29 : 28);
		} else if (month <= 7) {
			range_check(mday, 1, month % 2 == 0 ? 30 : 31);
		} else {
			range_check(mday, 1, month % 2 == 0 ? 31 : 30);
		}
	}

/** @see date_time_check */
	void rfc3339_time_check(const std::string &value)
	{
		const static REGEX_NAMESPACE::regex timeRegex{R"(^([0-9]{2})\:([0-9]{2})\:([0-9]{2})(\.[0-9]+)?(?:[Zz]|((?:\+|\-)[0-9]{2})\:([0-9]{2}))$)"};

		REGEX_NAMESPACE::smatch matches;
		if (!REGEX_NAMESPACE::regex_match(value, matches, timeRegex)) {
			throw std::invalid_argument(value + " is not a time string according to RFC 3339.");
		}

		auto hour = std::stoi(matches[1].str());
		auto minute = std::stoi(matches[2].str());
		auto second = std::stoi(matches[3].str());
		// const auto secfrac      = std::stof( matches[4].str() );

		range_check(hour, 0, 23);
		range_check(minute, 0, 59);

		int offsetHour = 0,
				offsetMinute = 0;

		/* don't check the numerical offset if time zone is specified as 'Z' */
		if (!matches[5].str().empty()) {
			offsetHour = std::stoi(matches[5].str());
			offsetMinute = std::stoi(matches[6].str());

			range_check(offsetHour, -23, 23);
			range_check(offsetMinute, 0, 59);
			if (offsetHour < 0)
				offsetMinute *= -1;
		}

		/**
         * @todo Could be made more exact by querying a leap second database and choosing the
         *       correct maximum in {58,59,60}. This current solution might match some invalid dates
         *       but it won't lead to false negatives. This only works if we know the full date, however
         */

		auto day_minutes = hour * 60 + minute - (offsetHour * 60 + offsetMinute);
		if (day_minutes < 0)
			day_minutes += 60 * 24;
		hour = day_minutes % 24;
		minute = day_minutes / 24;

		if (hour == 23 && minute == 59)
			range_check(second, 0, 60); // possible leap-second
		else
			range_check(second, 0, 59);
	}

/**
 * @see https://tools.ietf.org/html/rfc3339#section-5.6
 *
 * @verbatim
 * date-fullyear   = 4DIGIT
 * date-month      = 2DIGIT  ; 01-12
 * date-mday       = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on
 *                          ; month/year
 * time-hour       = 2DIGIT  ; 00-23
 * time-minute     = 2DIGIT  ; 00-59
 * time-second     = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second
 *                          ; rules
 * time-secfrac    = "." 1*DIGIT
 * time-numoffset  = ("+" / "-") time-hour ":" time-minute
 * time-offset     = "Z" / time-numoffset
 *
 * partial-time    = time-hour ":" time-minute ":" time-second
 *                  [time-secfrac]
 * full-date       = date-fullyear "-" date-month "-" date-mday
 * full-time       = partial-time time-offset
 *
 * date-time       = full-date "T" full-time
 * @endverbatim
 * NOTE: Per [ABNF] and ISO8601, the "T" and "Z" characters in this
 *       syntax may alternatively be lower case "t" or "z" respectively.
 */
	void rfc3339_date_time_check(const std::string &value)
	{
		const static REGEX_NAMESPACE::regex dateTimeRegex{R"(^([0-9]{4}\-[0-9]{2}\-[0-9]{2})[Tt]([0-9]{2}\:[0-9]{2}\:[0-9]{2}(?:\.[0-9]+)?(?:[Zz]|(?:\+|\-)[0-9]{2}\:[0-9]{2}))$)"};

		REGEX_NAMESPACE::smatch matches;
		if (!REGEX_NAMESPACE::regex_match(value, matches, dateTimeRegex)) {
			throw std::invalid_argument(value + " is not a date-time string according to RFC 3339.");
		}

		rfc3339_date_check(matches[1].str());
		rfc3339_time_check(matches[2].str());
	}

	const std::string decOctet{R"((?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]))"}; // matches numbers 0-255
	const std::string ipv4Address{"(?:" + decOctet + R"(\.){3})" + decOctet};
	const std::string h16{R"([0-9A-Fa-f]{1,4})"};
	const std::string h16Left{"(?:" + h16 + ":)"};
	const std::string ipv6Address{
			"(?:"
			"(?:" +
			h16Left + "{6}"
					  "|::" +
			h16Left + "{5}"
					  "|(?:" +
			h16 + ")?::" + h16Left + "{4}"
									 "|(?:" +
			h16Left + "{0,1}" + h16 + ")?::" + h16Left + "{3}"
														 "|(?:" +
			h16Left + "{0,2}" + h16 + ")?::" + h16Left + "{2}"
														 "|(?:" +
			h16Left + "{0,3}" + h16 + ")?::" + h16Left +
			"|(?:" + h16Left + "{0,4}" + h16 + ")?::"
											   ")(?:" +
			h16Left + h16 + "|" + ipv4Address + ")"
												"|(?:" +
			h16Left + "{0,5}" + h16 + ")?::" + h16 +
			"|(?:" + h16Left + "{0,6}" + h16 + ")?::"
											   ")"};
	const std::string ipvFuture{R"([Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)"};
	const std::string regName{R"((?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)"};
	const std::string host{
			"(?:"
			R"(\[(?:)" +
			ipv6Address + "|" + ipvFuture + R"()\])" +
			"|" + ipv4Address +
			"|" + regName +
			")"};

	const std::string uuid{R"([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})"};

// from http://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
	const std::string hostname{R"(^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*$)"};

	bool is_ascii(std::string const &value)
	{
		for (auto ch : value) {
			if (ch & 0x80) {
				return false;
			}
		}
		return true;
	}

/**
 * @see
 *
 * @verbatim
 * URI           = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
 *
 *  hier-part     = "//" authority path-abempty
 *               / path-absolute
 *               / path-rootless
 *               / path-empty
 *
 * URI-reference = URI / relative-ref
 *
 * absolute-URI  = scheme ":" hier-part [ "?" query ]
 *
 * relative-ref  = relative-part [ "?" query ] [ "#" fragment ]
 *
 * relative-part = "//" authority path-abempty
 *               / path-absolute
 *               / path-noscheme
 *               / path-empty
 *
 * scheme        = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
 *
 * authority     = [ userinfo "@" ] host [ ":" port ]
 * userinfo      = *( unreserved / pct-encoded / sub-delims / ":" )
 * host          = IP-literal / IPv4address / reg-name
 * port          = *DIGIT
 *
 * IP-literal    = "[" ( IPv6address / IPvFuture  ) "]"
 *
 * IPvFuture     = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
 *
 * IPv6address   =                            6( h16 ":" ) ls32
 *               /                       "::" 5( h16 ":" ) ls32
 *               / [               h16 ] "::" 4( h16 ":" ) ls32
 *               / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
 *               / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
 *               / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
 *               / [ *4( h16 ":" ) h16 ] "::"              ls32
 *               / [ *5( h16 ":" ) h16 ] "::"              h16
 *               / [ *6( h16 ":" ) h16 ] "::"
 *
 * h16           = 1*4HEXDIG
 * ls32          = ( h16 ":" h16 ) / IPv4address
 * IPv4address   = dec-octet "." dec-octet "." dec-octet "." dec-octet
 *    dec-octet     = DIGIT                 ; 0-9
 *               / %x31-39 DIGIT         ; 10-99
 *               / "1" 2DIGIT            ; 100-199
 *               / "2" %x30-34 DIGIT     ; 200-249
 *               / "25" %x30-35          ; 250-255
 *
 * reg-name      = *( unreserved / pct-encoded / sub-delims )
 *
 * path          = path-abempty    ; begins with "/" or is empty
 *               / path-absolute   ; begins with "/" but not "//"
 *               / path-noscheme   ; begins with a non-colon segment
 *               / path-rootless   ; begins with a segment
 *               / path-empty      ; zero characters
 *
 * path-abempty  = *( "/" segment )
 * path-absolute = "/" [ segment-nz *( "/" segment ) ]
 * path-noscheme = segment-nz-nc *( "/" segment )
 * path-rootless = segment-nz *( "/" segment )
 * path-empty    = 0<pchar>
 *
 * segment       = *pchar
 * segment-nz    = 1*pchar
 * segment-nz-nc = 1*( unreserved / pct-encoded / sub-delims / "@" )
 *               ; non-zero-length segment without any colon ":"
 *
 * pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *
 * query         = *( pchar / "/" / "?" )
 *
 * fragment      = *( pchar / "/" / "?" )
 *
 * pct-encoded   = "%" HEXDIG HEXDIG
 *
 * unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 * reserved      = gen-delims / sub-delims
 * gen-delims    = ":" / "/" / "?" / "#" / "[" / "]" / "@"
 * sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *               / "*" / "+" / "," / ";" / "="
 *
 * @endverbatim
 * @see adapted from: https://github.com/jhermsmeier/uri.regex/blob/master/uri.regex
 *
 */
	void rfc3986_uri_check(const std::string &value)
	{
		const static std::string scheme{R"(([A-Za-z][A-Za-z0-9+\-.]*):)"};
		const static std::string hierPart{
				R"((?:(\/\/)(?:((?:[A-Za-z0-9\-._~!$&'()*+,;=:]|)"
				R"(%[0-9A-Fa-f]{2})*)@)?((?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|)"
				R"(::(?:[0-9A-Fa-f]{1,4}:){5}|)"
				R"((?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|)"
				R"((?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|)"
				R"((?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|)"
				R"((?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|)"
				R"((?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|)"
				R"((?:(?:25[0-5]|2[0-4][0-9]|)"
				R"([01]?[0-9][0-9]?)\.){3}(?:25[0-5]|)"
				R"(2[0-4][0-9]|)"
				R"([01]?[0-9][0-9]?))|)"
				R"((?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|)"
				R"((?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|)"
				R"([Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|)"
				R"((?:(?:25[0-5]|)"
				R"(2[0-4][0-9]|)"
				R"([01]?[0-9][0-9]?)\.){3}(?:25[0-5]|)"
				R"(2[0-4][0-9]|)"
				R"([01]?[0-9][0-9]?)|)"
				R"((?:[A-Za-z0-9\-._~!$&'()*+,;=]|)"
				R"(%[0-9A-Fa-f]{2})*))(?::([0-9]*))?((?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|)"
				R"(%[0-9A-Fa-f]{2})*)*)|)"
				R"(\/((?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|)"
				R"(%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|)"
				R"(%[0-9A-Fa-f]{2})*)*)?)|)"
				R"(((?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|)"
				R"(%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|)"
				R"(%[0-9A-Fa-f]{2})*)*)|))"};

		const static std::string query{R"((?:\?((?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*))?)"};
		const static std::string fragment{
				R"((?:\#((?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*))?)"};
		const static std::string uriFormat{scheme + hierPart + query + fragment};

		const static REGEX_NAMESPACE::regex uriRegex{uriFormat};

		if (!REGEX_NAMESPACE::regex_match(value, uriRegex)) {
			throw std::invalid_argument(value + " is not a URI string according to RFC 3986.");
		}
	}

} // namespace

namespace nlohmann
{
	namespace json_schema
	{
/**
 * Checks validity for built-ins by converting the definitions given as ABNF in the linked RFC from
 * @see https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
 * into regular expressions using @see https://www.msweet.org/abnf/ and some manual editing.
 *
 * @see https://json-schema.org/latest/json-schema-validation.html
 */
		void default_string_format_check(const std::string &format, const std::string &value)
		{
			if (format == "date-time") {
				rfc3339_date_time_check(value);
			} else if (format == "date") {
				rfc3339_date_check(value);
			} else if (format == "time") {
				rfc3339_time_check(value);
			} else if (format == "uri") {
				rfc3986_uri_check(value);
			} else if (format == "email") {
				if (!is_ascii(value)) {
					throw std::invalid_argument(value + " contains non-ASCII values, not RFC 5321 compliant.");
				}
				if (!is_address(&*value.begin(), &*value.end())) {
					throw std::invalid_argument(value + " is not a valid email according to RFC 5321.");
				}
			} else if (format == "idn-email") {
				if (!is_address(&*value.begin(), &*value.end())) {
					throw std::invalid_argument(value + " is not a valid idn-email according to RFC 6531.");
				}
			} else if (format == "hostname") {
				static const REGEX_NAMESPACE::regex hostRegex{hostname};
				if (!REGEX_NAMESPACE::regex_match(value, hostRegex)) {
					throw std::invalid_argument(value + " is not a valid hostname according to RFC 3986 Appendix A.");
				}
			} else if (format == "ipv4") {
				const static REGEX_NAMESPACE::regex ipv4Regex{"^" + ipv4Address + "$"};
				if (!REGEX_NAMESPACE::regex_match(value, ipv4Regex)) {
					throw std::invalid_argument(value + " is not an IPv4 string according to RFC 2673.");
				}
			} else if (format == "ipv6") {
				static const REGEX_NAMESPACE::regex ipv6Regex{ipv6Address};
				if (!REGEX_NAMESPACE::regex_match(value, ipv6Regex)) {
					throw std::invalid_argument(value + " is not an IPv6 string according to RFC 5954.");
				}
			} else if (format == "uuid") {
				static const REGEX_NAMESPACE::regex uuidRegex{uuid};
				if (!REGEX_NAMESPACE::regex_match(value, uuidRegex)) {
					throw std::invalid_argument(value + " is not an uuid string according to RFC 4122.");
				}
			} else if (format == "regex") {
				try {
					REGEX_NAMESPACE::regex re(value, std::regex::ECMAScript);
				} catch (std::exception &exception) {
					throw exception;
				}
			} else {
				/* yet unsupported JSON schema draft 7 built-ins */
				static const std::vector<std::string> jsonSchemaStringFormatBuiltIns{
						"date-time", "time", "date", "email", "idn-email", "hostname", "idn-hostname", "ipv4", "ipv6", "uri",
						"uri-reference", "iri", "iri-reference", "uri-template", "json-pointer", "relative-json-pointer", "regex"};
				if (std::find(jsonSchemaStringFormatBuiltIns.begin(), jsonSchemaStringFormatBuiltIns.end(), format) != jsonSchemaStringFormatBuiltIns.end()) {
					throw std::logic_error("JSON schema string format built-in " + format + " not yet supported. " +
										   "Please open an issue or use a custom format checker.");
				}

				throw std::logic_error("Don't know how to validate " + format);
			}
		}
	} // namespace json_schema
} // namespace nlohmann
