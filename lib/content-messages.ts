import contentCatalog from '@/data/content-messages.json';

export interface ContentMessage {
  id: string;
  tipo: 'success' | 'error' | 'warning' | 'info' | 'action';
  nivel: 'essencial' | 'contextual' | 'premium';
  rota: string;
  momento: string;
  persona: string;
  headline: string;
  headlineContextual?: string;
  headlineRuah?: string;
  body: string;
  bodyContextual?: string;
  bodyRuah?: string;
  fallbackBody?: string;
  variables?: string[];
  ctaPrimary?: string;
  ctaSecondary?: string;
}

const messages = contentCatalog.messages as ContentMessage[];

export function getContentMessage(id: string) {
  return messages.find((msg) => msg.id === id) ?? null;
}

export function renderContentMessage(id: string, vars?: Record<string, string | number>) {
  const msg = getContentMessage(id);
  if (!msg) return null;

  const usedVars = msg.variables ?? [];
  const hasAllVars = usedVars.every((key) => vars && vars[key] !== undefined && vars[key] !== null);
  const canUseContextual = hasAllVars;
  const headlineTemplate = canUseContextual ? msg.headlineContextual ?? msg.headline : msg.headline;
  const bodyTemplate = canUseContextual ? msg.bodyContextual ?? msg.body : msg.body;

  const bodySource = hasAllVars ? bodyTemplate : msg.fallbackBody ?? msg.body;

  const renderTemplate = (template: string) =>
    template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_whole, key: string) => {
      if (!vars || vars[key] === undefined || vars[key] === null) return '';
      return String(vars[key]);
    });

  const renderedHeadline = renderTemplate(headlineTemplate);
  const renderedBody = renderTemplate(bodySource);

  return {
    ...msg,
    headline: renderedHeadline,
    body: renderedBody,
  };
}

export function renderContentMessageByLayer(
  id: string,
  options?: {
    vars?: Record<string, string | number>;
    layer?: 'base' | 'contextual' | 'ruah';
  }
) {
  const msg = getContentMessage(id);
  if (!msg) return null;
  const vars = options?.vars;
  const layer = options?.layer ?? 'base';
  const usedVars = msg.variables ?? [];
  const hasAllVars = usedVars.every((key) => vars && vars[key] !== undefined && vars[key] !== null);

  const headlineTemplate =
    layer === 'ruah'
      ? msg.headlineRuah ?? msg.headlineContextual ?? msg.headline
      : layer === 'contextual'
        ? msg.headlineContextual ?? msg.headline
        : msg.headline;
  const bodyTemplate =
    layer === 'ruah' ? msg.bodyRuah ?? msg.bodyContextual ?? msg.body : layer === 'contextual' ? msg.bodyContextual ?? msg.body : msg.body;

  const bodySource = hasAllVars ? bodyTemplate : msg.fallbackBody ?? msg.body;
  const renderTemplate = (template: string) =>
    template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_whole, key: string) => {
    if (!vars || vars[key] === undefined || vars[key] === null) return '';
    return String(vars[key]);
  });
  return { ...msg, headline: renderTemplate(headlineTemplate), body: renderTemplate(bodySource) };
}
