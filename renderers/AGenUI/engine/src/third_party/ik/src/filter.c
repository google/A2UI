/* iksemel (XML parser for Jabber)
** Copyright (C) 2000-2003 Gurer Ozen
** This code is free software; you can redistribute it and/or
** modify it under the terms of GNU Lesser General Public License.
*/

#include "common.h"
#include "iksemel.h"

struct iksrule_struct {
	struct iksrule_struct *next, *prev;
	ikstack *s;
	void *user_data;
	iksFilterHook *filterHook;
	char *id;
	char *from;
	char *ns;
	int score;
	int rules;
	enum ikstype type;
	enum iksubtype subtype;
};

struct iksfilter_struct {
	iksrule *rules;
	iksrule *last_rule;
};

iksfilter *
iks_filter_new (void)
{
	iksfilter *f;

	f = iks_malloc (sizeof (iksfilter));
	if (!f) return NULL;
	memset (f, 0, sizeof (iksfilter));

	return f;
}

iksrule *
iks_filter_add_rule (iksfilter *f, iksFilterHook *filterHook, void *user_data, ...)
{
	ikstack *s;
	iksrule *rule;
	va_list ap;
	int type;

	s = iks_stack_new (sizeof (iksrule), DEFAULT_RULE_CHUNK_SIZE);
	if (!s) return NULL;
	rule = iks_stack_alloc (s, sizeof (iksrule));
	memset (rule, 0, sizeof (iksrule));
	rule->s = s;
	rule->user_data = user_data;
	rule->filterHook = filterHook;

	va_start (ap, user_data);
	while (1) {
		type = va_arg (ap, int);
		if (IKS_RULE_DONE == type) break;
		rule->rules += type;
		switch (type) {
			case IKS_RULE_TYPE:
				rule->type = va_arg (ap, int);
				break;
			case IKS_RULE_SUBTYPE:
				rule->subtype = va_arg (ap, int);
				break;
			case IKS_RULE_ID:
				rule->id = iks_stack_strdup (s, va_arg (ap, char *), 0);
				break;
			case IKS_RULE_NS:
				rule->ns = iks_stack_strdup (s, va_arg (ap, char *), 0);
				break;
			case IKS_RULE_FROM:
				rule->from = iks_stack_strdup (s, va_arg (ap, char *), 0);
				break;
			case IKS_RULE_FROM_PARTIAL:
				rule->from = iks_stack_strdup (s, va_arg (ap, char *), 0);
				break;
		}
	}
	va_end (ap);

	if (!f->rules) f->rules = rule;
	if (f->last_rule) f->last_rule->next = rule;
	rule->prev = f->last_rule;
	f->last_rule = rule;
	return rule;
}

void
iks_filter_remove_rule (iksfilter *f, iksrule *rule)
{
	if (rule->prev) rule->prev->next = rule->next;
	if (rule->next) rule->next->prev = rule->prev;
	if (f->rules == rule) f->rules = rule->next;
	if (f->last_rule == rule) f->last_rule = rule->prev;
	iks_stack_delete (rule->s);
}

void
iks_filter_remove_hook (iksfilter *f, iksFilterHook *filterHook)
{
	iksrule *rule, *tmp;

	rule = f->rules;
	while (rule) {
		tmp = rule->next;
		if (rule->filterHook == filterHook) iks_filter_remove_rule (f, rule);
		rule = tmp;
	}
}

void
iks_filter_packet (iksfilter *f, ikspak *pak)
{
	iksrule *rule, *max_rule;
	int fail, score, max_score;

	rule = f->rules;
	max_rule = NULL;
	max_score = 0;
	while (rule) {
		score = 0;
		fail = 0;
		if (rule->rules & IKS_RULE_TYPE) {
			if (rule->type == pak->type) score += 1; else fail = 1;
		}
		if (rule->rules & IKS_RULE_SUBTYPE) {
			if (rule->subtype == pak->subtype) score += 2; else fail = 1;
		}
		if (rule->rules & IKS_RULE_ID) {
			if (iks_strcmp (rule->id, pak->id) == 0) score += 16; else fail = 1;
		}
		if (rule->rules & IKS_RULE_NS) {
			if (iks_strcmp (rule->ns, pak->ns) == 0) score += 4; else fail = 1;
		}
		if (rule->rules & IKS_RULE_FROM) {
			if (pak->from && iks_strcmp (rule->from, pak->from->full) == 0) score += 8; else fail = 1;
		}
		if (rule->rules & IKS_RULE_FROM_PARTIAL) {
			if (pak->from && iks_strcmp (rule->from, pak->from->partial) == 0) score += 8; else fail = 1;
		}
		if (fail != 0) score = 0;
		rule->score = score;
		if (score > max_score) {
			max_rule = rule;
			max_score = score;
		}
		rule = rule->next;
	}
	while (max_rule) {
		if (IKS_FILTER_EAT == max_rule->filterHook (max_rule->user_data, pak)) return;
		max_rule->score = 0;
		max_rule = NULL;
		max_score = 0;
		rule = f->rules;
		while (rule) {
			if (rule->score > max_score) {
				max_rule = rule;
				max_score = rule->score;
			}
			rule = rule->next;
		}
	}
}

void
iks_filter_delete (iksfilter *f)
{
	iksrule *rule, *tmp;

	rule = f->rules;
	while (rule) {
		tmp = rule->next;
		iks_stack_delete (rule->s);
		rule = tmp;
	}
	iks_free (f);
}
