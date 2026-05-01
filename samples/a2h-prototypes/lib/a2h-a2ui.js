/**
 * a2h-a2ui.js — Helper library for generating A2UI v0.9 message sequences
 * from A2H (Agent-to-Human) intent descriptions.
 *
 * Each function returns an array of A2UI v0.9 messages (createSurface,
 * updateDataModel, updateComponents) ready for JSONL serialization.
 */

const CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json';
const VERSION = 'v0.9';

// ─── Utilities ───

let _counter = 0;
function uid(prefix) {
  return `${prefix}-${++_counter}`;
}

/** Reset ID counter (useful for tests). */
export function resetIds() {
  _counter = 0;
}

function msg(payload) {
  return { version: VERSION, ...payload };
}

function createSurfaceMsg(surfaceId, sendDataModel = true) {
  return msg({
    createSurface: {
      surfaceId,
      catalogId: CATALOG_ID,
      sendDataModel,
    },
  });
}

function updateDataModelMsg(surfaceId, value) {
  return msg({ updateDataModel: { surfaceId, value } });
}

function updateComponentsMsg(surfaceId, components) {
  return msg({ updateComponents: { surfaceId, components } });
}

/** Build the standard Card → Column → [header, divider, body, divider, actions] skeleton. */
function cardSkeleton(prefix, { titleIcon, titleText, bodyChildren, actionChildren }) {
  const ids = {
    root: `${prefix}-root`,
    col: `${prefix}-col`,
    headerRow: `${prefix}-header-row`,
    headerIcon: `${prefix}-header-icon`,
    headerText: `${prefix}-header-text`,
    div1: `${prefix}-div-1`,
    body: `${prefix}-body`,
    div2: `${prefix}-div-2`,
    actions: `${prefix}-actions`,
  };

  const components = [
    { id: ids.root, component: 'Card', child: ids.col },
  ];

  const colChildren = [ids.headerRow, ids.div1, ids.body];
  if (actionChildren && actionChildren.length > 0) {
    colChildren.push(ids.div2, ids.actions);
  }
  components.push({ id: ids.col, component: 'Column', children: colChildren });

  // Header
  components.push(
    { id: ids.headerRow, component: 'Row', children: [ids.headerIcon, ids.headerText], align: 'center' },
    { id: ids.headerIcon, component: 'Text', text: titleIcon, variant: 'h3' },
    { id: ids.headerText, component: 'Text', text: titleText, variant: 'h3' },
    { id: ids.div1, component: 'Divider' },
  );

  // Body
  components.push({ id: ids.body, component: 'Column', children: bodyChildren.map(c => c.id) });
  components.push(...bodyChildren);

  // Actions
  if (actionChildren && actionChildren.length > 0) {
    components.push({ id: ids.div2, component: 'Divider' });
    components.push({ id: ids.actions, component: 'Row', children: actionChildren.map(c => c.id), justify: 'end' });
    components.push(...actionChildren);
  }

  return { components, rootId: ids.root };
}

function makeButton(id, label, variant, eventName, context) {
  const textId = `${id}-text`;
  return [
    { id: textId, component: 'Text', text: label },
    {
      id,
      component: 'Button',
      variant,
      child: textId,
      action: { event: { name: eventName, context: context || {} } },
    },
  ];
}

function makeDetailRow(id, label, valuePath) {
  const rowId = id;
  const labelId = `${id}-label`;
  const valId = `${id}-val`;
  return [
    { id: rowId, component: 'Row', children: [labelId, valId] },
    { id: labelId, component: 'Text', text: label, variant: 'caption' },
    { id: valId, component: 'Text', text: typeof valuePath === 'string' && valuePath.startsWith('/') ? { path: valuePath } : (valuePath ?? ''), variant: 'body' },
  ];
}

// ─── AUTHORIZE ───

/**
 * Create an AUTHORIZE surface — approval card with details and approve/reject buttons.
 *
 * @param {Object} opts
 * @param {string} opts.surfaceId - Surface ID
 * @param {string} opts.title - Card title
 * @param {string} opts.description - Description text
 * @param {Array<{label: string, path: string}>} opts.details - Detail rows with data model paths
 * @param {Array<{id: string, label: string, variant?: string, event: string}>} [opts.actions] - Action buttons
 * @param {Object} opts.dataModel - Initial data model value
 * @returns {Array} A2UI v0.9 messages
 */
export function createAuthorizeSurface({ surfaceId, title, description, details = [], actions, dataModel = {} }) {
  const prefix = 'auth';

  // Default actions: Approve + Reject
  const actionDefs = actions || [
    { id: 'btn-reject', label: 'Reject', variant: 'default', event: 'a2h.authorize.reject' },
    { id: 'btn-approve', label: 'Approve', variant: 'primary', event: 'a2h.authorize.approve' },
  ];

  // Build detail rows
  const detailComponents = [];
  const descId = uid(`${prefix}-desc`);
  detailComponents.push({ id: descId, component: 'Text', text: description, variant: 'body' });

  const detailCardId = uid(`${prefix}-details-card`);
  const detailColId = uid(`${prefix}-details-col`);
  const detailRowComps = [];
  const detailRowIds = [];
  for (const d of details) {
    const rowId = uid(`${prefix}-detail`);
    const rows = makeDetailRow(rowId, d.label, d.path);
    detailRowComps.push(...rows);
    detailRowIds.push(rowId);
  }

  detailComponents.push(
    { id: detailCardId, component: 'Card', child: detailColId },
    { id: detailColId, component: 'Column', children: detailRowIds },
    ...detailRowComps,
  );

  // Build action buttons
  const actionComps = [];
  for (const a of actionDefs) {
    actionComps.push(...makeButton(a.id, a.label, a.variant || 'default', a.event, {}));
  }

  const { components } = cardSkeleton(prefix, {
    titleIcon: '🔒',
    titleText: title || 'Authorization Required',
    bodyChildren: detailComponents,
    actionChildren: actionComps.filter(c => c.component === 'Button' || c.component === 'Text'),
  });

  return [
    createSurfaceMsg(surfaceId),
    updateDataModelMsg(surfaceId, dataModel),
    updateComponentsMsg(surfaceId, components),
  ];
}

// ─── COLLECT ───

/**
 * Create a COLLECT surface — form with fields and a submit button.
 *
 * @param {Object} opts
 * @param {string} opts.surfaceId
 * @param {string} opts.title
 * @param {Array<{id: string, label: string, type: 'text'|'select', options?: string[], path: string, value?: any}>} opts.fields
 * @param {string} [opts.submitLabel='Submit']
 * @param {Object} [opts.dataModel={}]
 * @returns {Array} A2UI v0.9 messages
 */
export function createCollectSurface({ surfaceId, title, fields = [], submitLabel = 'Submit', dataModel = {} }) {
  const prefix = 'collect';

  const fieldComponents = [];
  for (const f of fields) {
    const labelId = `field-${f.id}-label`;
    const fieldId = `field-${f.id}`;
    fieldComponents.push({ id: labelId, component: 'Text', text: f.label, variant: 'caption' });

    if (f.type === 'select') {
      fieldComponents.push({
        id: fieldId,
        component: 'ChoicePicker',
        options: (f.options || []).map(o => typeof o === 'string' ? { label: o, value: o } : o),
        value: f.value != null ? { path: f.path } : undefined,
        data: { path: f.path },
      });
    } else {
      fieldComponents.push({
        id: fieldId,
        component: 'TextField',
        placeholder: f.label,
        value: f.value != null ? { path: f.path } : undefined,
        data: { path: f.path },
      });
    }
  }

  const submitBtnComps = makeButton('btn-submit', submitLabel, 'primary', 'a2h.collect.submit', {});

  const { components } = cardSkeleton(prefix, {
    titleIcon: '📝',
    titleText: title || 'Information Required',
    bodyChildren: fieldComponents,
    actionChildren: submitBtnComps,
  });

  return [
    createSurfaceMsg(surfaceId),
    updateDataModelMsg(surfaceId, dataModel),
    updateComponentsMsg(surfaceId, components),
  ];
}

// ─── INFORM ───

/**
 * Create an INFORM surface — notification card with key-value items.
 *
 * @param {Object} opts
 * @param {string} opts.surfaceId
 * @param {string} opts.title
 * @param {Array<{label: string, value: string, icon?: string}>} opts.items
 * @param {Object} [opts.dataModel={}]
 * @returns {Array} A2UI v0.9 messages
 */
export function createInformSurface({ surfaceId, title, items = [], dataModel = {} }) {
  const prefix = 'inform';

  const bodyComponents = [];
  for (const item of items) {
    const rowId = uid(`${prefix}-item`);
    if (item.icon) {
      const iconId = `${rowId}-icon`;
      const labelId = `${rowId}-label`;
      const valId = `${rowId}-val`;
      bodyComponents.push(
        { id: rowId, component: 'Row', children: [iconId, labelId, valId] },
        { id: iconId, component: 'Text', text: item.icon },
        { id: labelId, component: 'Text', text: item.label, variant: 'caption' },
        { id: valId, component: 'Text', text: item.value, variant: 'body' },
      );
    } else {
      const rows = makeDetailRow(rowId, item.label, item.value);
      bodyComponents.push(...rows);
    }
  }

  const { components } = cardSkeleton(prefix, {
    titleIcon: 'ℹ️',
    titleText: title || 'Notification',
    bodyChildren: bodyComponents,
    actionChildren: [],
  });

  return [
    createSurfaceMsg(surfaceId, false),
    updateDataModelMsg(surfaceId, dataModel),
    updateComponentsMsg(surfaceId, components),
  ];
}

// ─── ESCALATE ───

/**
 * Create an ESCALATE surface — handoff card with reason, context, and connection options.
 *
 * @param {Object} opts
 * @param {string} opts.surfaceId
 * @param {string} opts.reason - Why the escalation is happening
 * @param {string} [opts.context] - Context/summary text
 * @param {Array<{id: string, label: string, event?: string}>} [opts.options] - Connection method buttons
 * @param {Object} [opts.dataModel={}]
 * @returns {Array} A2UI v0.9 messages
 */
export function createEscalateSurface({ surfaceId, reason, context, options, dataModel = {} }) {
  const prefix = 'esc';

  const optionDefs = options || [
    { id: 'btn-chat', label: '💬 Live Chat', event: 'a2h.escalate.connect' },
    { id: 'btn-phone', label: '📞 Phone', event: 'a2h.escalate.connect' },
  ];

  const bodyComponents = [];

  // Reason
  const reasonId = uid(`${prefix}-reason`);
  bodyComponents.push({ id: reasonId, component: 'Text', text: reason, variant: 'body' });

  // Context card
  if (context) {
    const ctxCardId = uid(`${prefix}-ctx-card`);
    const ctxColId = uid(`${prefix}-ctx-col`);
    const ctxLabelId = uid(`${prefix}-ctx-label`);
    const ctxTextId = uid(`${prefix}-ctx-text`);
    bodyComponents.push(
      { id: ctxCardId, component: 'Card', child: ctxColId },
      { id: ctxColId, component: 'Column', children: [ctxLabelId, ctxTextId] },
      { id: ctxLabelId, component: 'Text', text: 'Context', variant: 'caption' },
      { id: ctxTextId, component: 'Text', text: context, variant: 'body' },
    );
  }

  // Status message (bound to data model)
  const statusId = uid(`${prefix}-status`);
  bodyComponents.push({ id: statusId, component: 'Text', text: { path: '/statusMessage' }, variant: 'caption' });

  // Action buttons
  const actionComps = [];
  for (const o of optionDefs) {
    actionComps.push(...makeButton(o.id, o.label, 'default', o.event || 'a2h.escalate.connect', { method: o.label }));
  }

  const { components } = cardSkeleton(prefix, {
    titleIcon: '🆘',
    titleText: 'Connecting to Support',
    bodyChildren: bodyComponents,
    actionChildren: actionComps,
  });

  const dm = { ...dataModel, statusMessage: dataModel.statusMessage || 'Searching for available agents…' };

  return [
    createSurfaceMsg(surfaceId),
    updateDataModelMsg(surfaceId, dm),
    updateComponentsMsg(surfaceId, components),
  ];
}

// ─── RESULT ───

/**
 * Create a RESULT surface — completion card showing success/failure.
 *
 * @param {Object} opts
 * @param {string} opts.surfaceId
 * @param {string} opts.title
 * @param {string} opts.status - 'success' | 'failure' | 'partial'
 * @param {Array<{label: string, value: string}>} [opts.details] - Result details
 * @param {Object} [opts.dataModel={}]
 * @returns {Array} A2UI v0.9 messages
 */
export function createResultSurface({ surfaceId, title, status = 'success', details = [], dataModel = {} }) {
  const prefix = 'result';
  const icon = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⚠️';

  const bodyComponents = [];

  // Status text
  const statusId = uid(`${prefix}-status`);
  const statusText = status === 'success' ? 'Completed successfully' : status === 'failure' ? 'Failed' : 'Partially completed';
  bodyComponents.push({ id: statusId, component: 'Text', text: statusText, variant: 'body' });

  // Detail rows
  for (const d of details) {
    const rowId = uid(`${prefix}-detail`);
    const rows = makeDetailRow(rowId, d.label, d.value);
    bodyComponents.push(...rows);
  }

  const { components } = cardSkeleton(prefix, {
    titleIcon: icon,
    titleText: title || 'Task Complete',
    bodyChildren: bodyComponents,
    actionChildren: [],
  });

  return [
    createSurfaceMsg(surfaceId, false),
    updateDataModelMsg(surfaceId, dataModel),
    updateComponentsMsg(surfaceId, components),
  ];
}

// ─── JSONL Serialization ───

/** Convert an array of A2UI messages to JSONL string. */
export function toJsonl(messages) {
  return messages.map(m => JSON.stringify(m)).join('\n');
}

/** Parse a JSONL string to an array of A2UI messages. */
export function fromJsonl(jsonl) {
  return jsonl.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}
