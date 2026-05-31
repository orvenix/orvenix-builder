import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type SortDirection = "asc" | "desc";

export interface FileUserRecord {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileSiteRecord {
  id: string;
  name: string;
  description: string;
  tree: unknown;
  published: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileTicketRecord {
  id: string;
  type: string;
  templateId: string | null;
  templateName: string | null;
  siteId: string | null;
  siteName: string | null;
  userId: string;
  userEmail: string;
  workMode: string;
  assignedTo: string;
  status: string;
  priority: string;
  message: string;
  assets: string | null;
  timeline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileTemplateIntentRecord {
  id: string;
  templateId: string;
  templateName: string;
  userId: string;
  userEmail: string;
  intent: string;
  status: string;
  pricingModel: string;
  amountCents: number;
  currency: string;
  siteId: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FilePlanRecord {
  id: string;
  name: string;
  priceMonthMxn: number;
  priceYearMxn: number;
  mpPlanIdMonth: string | null;
  mpPlanIdYear: string | null;
  stripePriceIdMonth: string | null;
  stripePriceIdYear: string | null;
  maxWebsites: number;
  maxVisits: number;
  hasEcommerce: boolean;
  hasAI: boolean;
  hasExport: boolean;
  features: string[];
  isActive: boolean;
}

export interface FileSubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  provider: string;
  mpSubscriptionId: string | null;
  mpPayerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  interval: string;
  status: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileWebhookEventRecord {
  id: string;
  provider: string;
  eventId: string | null;
  eventType: string;
  resourceId: string | null;
  status: string;
  error: string | null;
  payload: unknown;
  createdAt: string;
  processedAt: string | null;
}

interface FileStoreShape {
  users: FileUserRecord[];
  sites: FileSiteRecord[];
  supportTickets: FileTicketRecord[];
  templateIntents: FileTemplateIntentRecord[];
  plans: FilePlanRecord[];
  subscriptions: FileSubscriptionRecord[];
  webhookEvents: FileWebhookEventRecord[];
}

type DateInput = string | Date | null | undefined;
type FileSubscriptionWriteRecord = Omit<FileSubscriptionRecord, "currentPeriodEnd" | "canceledAt"> & {
  currentPeriodEnd: DateInput;
  canceledAt: DateInput;
};
type FileWebhookEventWriteRecord = Omit<FileWebhookEventRecord, "processedAt"> & {
  processedAt: DateInput;
};

const DEFAULT_PLANS: FilePlanRecord[] = [
  {
    id: "starter",
    name: "Basico",
    priceMonthMxn: 349,
    priceYearMxn: 3350,
    mpPlanIdMonth: null,
    mpPlanIdYear: null,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
    maxWebsites: 1,
    maxVisits: 15000,
    hasEcommerce: false,
    hasAI: true,
    hasExport: false,
    features: [
      "1 sitio publicado",
      "Editor visual completo",
      "SSL y hosting administrado",
      "Soporte por email y WhatsApp",
    ],
    isActive: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthMxn: 699,
    priceYearMxn: 6710,
    mpPlanIdMonth: null,
    mpPlanIdYear: null,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
    maxWebsites: 3,
    maxVisits: 75000,
    hasEcommerce: true,
    hasAI: true,
    hasExport: true,
    features: [
      "Hasta 3 sitios",
      "CMS editable por colecciones",
      "Tienda online integrada",
      "Exportacion de codigo",
    ],
    isActive: true,
  },
  {
    id: "commerce",
    name: "Empresa",
    priceMonthMxn: 1399,
    priceYearMxn: 13430,
    mpPlanIdMonth: null,
    mpPlanIdYear: null,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
    maxWebsites: 9999,
    maxVisits: 500000,
    hasEcommerce: true,
    hasAI: true,
    hasExport: true,
    features: [
      "Sitios ilimitados",
      "Billing y operaciones avanzadas",
      "Webhooks y automatizaciones",
      "Soporte prioritario",
    ],
    isActive: true,
  },
];

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "runtime-store.json");

const EMPTY_STORE: FileStoreShape = {
  users: [],
  sites: [],
  supportTickets: [],
  templateIntents: [],
  plans: DEFAULT_PLANS,
  subscriptions: [],
  webhookEvents: [],
};

async function ensureStoreFile() {
  await mkdir(STORE_DIR, { recursive: true });
  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    await writeFile(STORE_FILE, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<FileStoreShape> {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<FileStoreShape>;
    return {
      users: parsed.users ?? [],
      sites: parsed.sites ?? [],
      supportTickets: parsed.supportTickets ?? [],
      templateIntents: parsed.templateIntents ?? [],
      plans: parsed.plans ?? DEFAULT_PLANS,
      subscriptions: parsed.subscriptions ?? [],
      webhookEvents: parsed.webhookEvents ?? [],
    };
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

async function writeStore(store: FileStoreShape) {
  await ensureStoreFile();
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function sortByField<T extends object>(items: T[], orderBy?: Record<string, SortDirection>) {
  if (!orderBy) return items;
  const [field, direction] = Object.entries(orderBy)[0] ?? [];
  if (!field || !direction) return items;

  return [...items].sort((a, b) => {
    const left = (a as Record<string, unknown>)[field];
    const right = (b as Record<string, unknown>)[field];
    if (left === right) return 0;
    if (left == null) return direction === "asc" ? -1 : 1;
    if (right == null) return direction === "asc" ? 1 : -1;
    return left > right ? (direction === "asc" ? 1 : -1) : (direction === "asc" ? -1 : 1);
  });
}

function filterSites(sites: FileSiteRecord[], where?: Record<string, unknown>) {
  if (!where) return sites;
  return sites.filter((site) =>
    Object.entries(where).every(([key, value]) => ((site as unknown) as Record<string, unknown>)[key] === value)
  );
}

function filterUsers(users: FileUserRecord[], where?: Record<string, unknown>) {
  if (!where) return users;
  return users.filter((user) =>
    Object.entries(where).every(([key, value]) => ((user as unknown) as Record<string, unknown>)[key] === value)
  );
}

function withSiteDates(site: FileSiteRecord) {
  return {
    ...site,
    createdAt: new Date(site.createdAt),
    updatedAt: new Date(site.updatedAt),
  };
}

function withUserDates(user: FileUserRecord) {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

function withSubscriptionDates(subscription: FileSubscriptionRecord) {
  return {
    ...subscription,
    currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
    canceledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null,
    createdAt: new Date(subscription.createdAt),
    updatedAt: new Date(subscription.updatedAt),
  };
}

function withWebhookDates(event: FileWebhookEventRecord) {
  return {
    ...event,
    createdAt: new Date(event.createdAt),
    processedAt: event.processedAt ? new Date(event.processedAt) : null,
  };
}

function normalizeOptionalDate(value: DateInput, fallback: string | null) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null) {
    return null;
  }

  return value ?? fallback;
}

function filterPlans(plans: FilePlanRecord[], where?: Record<string, unknown>) {
  if (!where) return plans;
  return plans.filter((plan) =>
    Object.entries(where).every(([key, value]) => ((plan as unknown) as Record<string, unknown>)[key] === value)
  );
}

function filterWebhookEvents(events: FileWebhookEventRecord[], where?: Record<string, unknown>) {
  if (!where) return events;
  return events.filter((event) =>
    Object.entries(where).every(([key, value]) => ((event as unknown) as Record<string, unknown>)[key] === value)
  );
}

function selectPlan(plan: FilePlanRecord, select?: Record<string, unknown>) {
  if (!select) return plan;
  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled)
      .map(([field]) => [field, ((plan as unknown) as Record<string, unknown>)[field]])
  );
}

function selectSubscription(
  subscription: FileSubscriptionRecord,
  plans: FilePlanRecord[],
  select?: Record<string, unknown>,
  include?: Record<string, unknown>
) {
  const hydrated = withSubscriptionDates(subscription);

  if (include?.plan) {
    return {
      ...hydrated,
      plan: plans.find((plan) => plan.id === subscription.planId) ?? null,
    };
  }

  if (!select) return hydrated;

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled)
      .map(([field]) => [field, (hydrated as Record<string, unknown>)[field]])
  );
}

function selectWebhookEvent(event: FileWebhookEventRecord, select?: Record<string, unknown>) {
  const hydrated = withWebhookDates(event);
  if (!select) return hydrated;
  return Object.fromEntries(
    Object.entries(select)
      .filter(([, enabled]) => enabled)
      .map(([field]) => [field, (hydrated as Record<string, unknown>)[field]])
  );
}

function selectSite(site: FileSiteRecord, users: FileUserRecord[], select?: Record<string, unknown>) {
  const hydrated = withSiteDates(site);
  if (!select) return hydrated;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(select)) {
    if (!value) continue;
    if (key === "user" && typeof value === "object" && value && "select" in value) {
      const user = users.find((item) => item.id === site.userId);
      if (!user) {
        result.user = null;
      } else {
        const userSelect = (value as { select: Record<string, boolean> }).select;
        result.user = Object.fromEntries(
          Object.entries(userSelect)
            .filter(([, enabled]) => enabled)
            .map(([field]) => [field, ((user as unknown) as Record<string, unknown>)[field]])
        );
      }
      continue;
    }

    result[key] = (hydrated as Record<string, unknown>)[key];
  }

  return result;
}

function selectUser(user: FileUserRecord, sites: FileSiteRecord[], select?: Record<string, unknown>) {
  const hydrated = withUserDates(user);
  if (!select) return hydrated;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(select)) {
    if (!value) continue;
    if (key === "_count" && typeof value === "object" && value && "select" in value) {
      const countSelect = (value as { select: Record<string, boolean> }).select;
      result._count = {
        ...(countSelect.sites ? { sites: sites.filter((site) => site.userId === user.id).length } : {}),
      };
      continue;
    }

    result[key] = (hydrated as Record<string, unknown>)[key];
  }

  return result;
}

export const fileStoreApi = {
  async readStore() {
    return readStore();
  },

  async createUser(data: Pick<FileUserRecord, "id" | "email" | "name" | "password" | "role">) {
    const store = await readStore();
    const now = new Date().toISOString();
    const user: FileUserRecord = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    store.users.push(user);
    await writeStore(store);
    return withUserDates(user);
  },

  async findUser(where: { email?: string; id?: string }) {
    const store = await readStore();
    const user = store.users.find((item) =>
      (where.email ? item.email === where.email : true) &&
      (where.id ? item.id === where.id : true)
    );
    return user ? withUserDates(user) : null;
  },

  async countUsers() {
    const store = await readStore();
    return store.users.length;
  },

  async listUsers(args?: { where?: Record<string, unknown>; orderBy?: Record<string, SortDirection>; select?: Record<string, unknown> }) {
    const store = await readStore();
    const users = sortByField(filterUsers(store.users, args?.where), args?.orderBy);
    return users.map((user) => selectUser(user, store.sites, args?.select));
  },

  async createSite(data: Partial<FileSiteRecord> & Pick<FileSiteRecord, "id" | "name" | "tree">) {
    const store = await readStore();
    const now = new Date().toISOString();
    const site: FileSiteRecord = {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      tree: data.tree,
      published: data.published ?? false,
      userId: data.userId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    store.sites.push(site);
    await writeStore(store);
    return withSiteDates(site);
  },

  async findSiteUnique(where: { id: string }, select?: Record<string, unknown>) {
    const store = await readStore();
    const site = store.sites.find((item) => item.id === where.id);
    return site ? selectSite(site, store.users, select) : null;
  },

  async findSiteFirst(args: { where?: Record<string, unknown>; select?: Record<string, unknown> }) {
    const store = await readStore();
    const site = filterSites(store.sites, args.where)[0];
    return site ? selectSite(site, store.users, args.select) : null;
  },

  async listSites(args?: { where?: Record<string, unknown>; orderBy?: Record<string, SortDirection>; select?: Record<string, unknown> }) {
    const store = await readStore();
    const sites = sortByField(filterSites(store.sites, args?.where), args?.orderBy);
    return sites.map((site) => selectSite(site, store.users, args?.select));
  },

  async countSites(where?: Record<string, unknown>) {
    const store = await readStore();
    return filterSites(store.sites, where).length;
  },

  async updateSite(where: { id: string }, data: Partial<FileSiteRecord>) {
    const store = await readStore();
    const index = store.sites.findIndex((item) => item.id === where.id);
    if (index === -1) throw new Error(`Sitio ${where.id} no encontrado.`);
    store.sites[index] = {
      ...store.sites[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeStore(store);
    return withSiteDates(store.sites[index]);
  },

  async updateSites(where: Record<string, unknown>, data: Partial<FileSiteRecord>) {
    const store = await readStore();
    let count = 0;
    store.sites = store.sites.map((site) => {
      const matches = Object.entries(where).every(([key, value]) => ((site as unknown) as Record<string, unknown>)[key] === value);
      if (!matches) return site;
      count += 1;
      return {
        ...site,
        ...data,
        updatedAt: new Date().toISOString(),
      };
    });
    await writeStore(store);
    return { count };
  },

  async deleteSites(where: Record<string, unknown>) {
    const store = await readStore();
    const before = store.sites.length;
    store.sites = store.sites.filter((site) =>
      !Object.entries(where).every(([key, value]) => ((site as unknown) as Record<string, unknown>)[key] === value)
    );
    const count = before - store.sites.length;
    await writeStore(store);
    return { count };
  },

  async upsertSite(where: { id: string }, update: Partial<FileSiteRecord>, create: Partial<FileSiteRecord> & Pick<FileSiteRecord, "id" | "name" | "tree">) {
    const existing = await this.findSiteUnique(where);
    if (existing) {
      return this.updateSite(where, update);
    }
    return this.createSite(create);
  },

  async listTickets() {
    const store = await readStore();
    return store.supportTickets.map((ticket) => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
    }));
  },

  async createTicket(ticket: Omit<FileTicketRecord, "createdAt" | "updatedAt">) {
    const store = await readStore();
    const now = new Date().toISOString();
    store.supportTickets.push({ ...ticket, createdAt: now, updatedAt: now });
    await writeStore(store);
  },

  async updateTicketStatus(ticketId: string, status: string, userId?: string) {
    const store = await readStore();
    let count = 0;
    store.supportTickets = store.supportTickets.map((ticket) => {
      if (ticket.id !== ticketId) return ticket;
      if (userId && ticket.userId !== userId) return ticket;
      if (userId && !["open", "in_progress"].includes(ticket.status)) return ticket;
      count += 1;
      return { ...ticket, status, updatedAt: new Date().toISOString() };
    });
    await writeStore(store);
    return count;
  },

  async createTemplateIntent(intent: Omit<FileTemplateIntentRecord, "createdAt" | "updatedAt">) {
    const store = await readStore();
    const now = new Date().toISOString();
    store.templateIntents.push({ ...intent, createdAt: now, updatedAt: now });
    await writeStore(store);
  },

  async listPlans(args?: { where?: Record<string, unknown>; orderBy?: Record<string, SortDirection>; select?: Record<string, unknown> }) {
    const store = await readStore();
    const plans = sortByField(filterPlans(store.plans, args?.where), args?.orderBy);
    return plans.map((plan) => selectPlan(plan, args?.select));
  },

  async findPlanUnique(where: { id: string }, select?: Record<string, unknown>) {
    const store = await readStore();
    const plan = store.plans.find((item) => item.id === where.id);
    return plan ? selectPlan(plan, select) : null;
  },

  async upsertPlan(where: { id: string }, update: Partial<FilePlanRecord>, create: FilePlanRecord) {
    const store = await readStore();
    const index = store.plans.findIndex((item) => item.id === where.id);
    if (index >= 0) {
      store.plans[index] = { ...store.plans[index], ...update };
      await writeStore(store);
      return store.plans[index];
    }
    store.plans.push(create);
    await writeStore(store);
    return create;
  },

  async updatePlan(where: { id: string }, data: Partial<FilePlanRecord>) {
    const store = await readStore();
    const index = store.plans.findIndex((item) => item.id === where.id);
    if (index === -1) throw new Error(`Plan ${where.id} no encontrado.`);
    store.plans[index] = { ...store.plans[index], ...data };
    await writeStore(store);
    return store.plans[index];
  },

  async findSubscriptionUnique(args: {
    where: { userId?: string; stripeSubscriptionId?: string; mpSubscriptionId?: string };
    select?: Record<string, unknown>;
    include?: Record<string, unknown>;
  }) {
    const store = await readStore();
    const subscription = store.subscriptions.find((item) =>
      (args.where.userId ? item.userId === args.where.userId : true) &&
      (args.where.stripeSubscriptionId ? item.stripeSubscriptionId === args.where.stripeSubscriptionId : true) &&
      (args.where.mpSubscriptionId ? item.mpSubscriptionId === args.where.mpSubscriptionId : true)
    );
    return subscription ? selectSubscription(subscription, store.plans, args.select, args.include) : null;
  },

  async upsertSubscription(
    where: { userId?: string; stripeSubscriptionId?: string; mpSubscriptionId?: string },
    update: Partial<FileSubscriptionWriteRecord>,
    create: Omit<FileSubscriptionWriteRecord, "id" | "createdAt" | "updatedAt">
  ) {
    const store = await readStore();
    const index = store.subscriptions.findIndex((item) =>
      (where.userId ? item.userId === where.userId : true) &&
      (where.stripeSubscriptionId ? item.stripeSubscriptionId === where.stripeSubscriptionId : true) &&
      (where.mpSubscriptionId ? item.mpSubscriptionId === where.mpSubscriptionId : true)
    );
    const now = new Date().toISOString();

    if (index >= 0) {
      store.subscriptions[index] = {
        ...store.subscriptions[index],
        ...update,
        currentPeriodEnd: normalizeOptionalDate(update.currentPeriodEnd, store.subscriptions[index].currentPeriodEnd),
        canceledAt: normalizeOptionalDate(update.canceledAt, store.subscriptions[index].canceledAt),
        updatedAt: now,
      };
      await writeStore(store);
      return withSubscriptionDates(store.subscriptions[index]);
    }

    const next: FileSubscriptionRecord = {
      id: crypto.randomUUID(),
      ...create,
      currentPeriodEnd: normalizeOptionalDate(create.currentPeriodEnd, null),
      canceledAt: normalizeOptionalDate(create.canceledAt, null),
      createdAt: now,
      updatedAt: now,
    };
    store.subscriptions.push(next);
    await writeStore(store);
    return withSubscriptionDates(next);
  },

  async updateSubscription(where: { userId: string }, data: Partial<FileSubscriptionWriteRecord>) {
    const store = await readStore();
    const index = store.subscriptions.findIndex((item) => item.userId === where.userId);
    if (index === -1) throw new Error(`Subscription de ${where.userId} no encontrada.`);
    store.subscriptions[index] = {
      ...store.subscriptions[index],
      ...data,
      currentPeriodEnd: normalizeOptionalDate(data.currentPeriodEnd, store.subscriptions[index].currentPeriodEnd),
      canceledAt: normalizeOptionalDate(data.canceledAt, store.subscriptions[index].canceledAt),
      updatedAt: new Date().toISOString(),
    };
    await writeStore(store);
    return withSubscriptionDates(store.subscriptions[index]);
  },

  async updateSubscriptions(where: Record<string, unknown>, data: Partial<FileSubscriptionWriteRecord>) {
    const store = await readStore();
    let count = 0;
    store.subscriptions = store.subscriptions.map((subscription) => {
      const matches = Object.entries(where).every(
        ([key, value]) => ((subscription as unknown) as Record<string, unknown>)[key] === value
      );
      if (!matches) return subscription;
      count += 1;
      return {
        ...subscription,
        ...data,
        currentPeriodEnd: normalizeOptionalDate(data.currentPeriodEnd, subscription.currentPeriodEnd),
        canceledAt: normalizeOptionalDate(data.canceledAt, subscription.canceledAt),
        updatedAt: new Date().toISOString(),
      };
    });
    await writeStore(store);
    return { count };
  },

  async createWebhookEvent(data: Omit<FileWebhookEventWriteRecord, "createdAt" | "processedAt"> & { processedAt?: DateInput }) {
    const store = await readStore();
    const event: FileWebhookEventRecord = {
      ...data,
      createdAt: new Date().toISOString(),
      processedAt: normalizeOptionalDate(data.processedAt, null),
    };
    store.webhookEvents.push(event);
    await writeStore(store);
    return withWebhookDates(event);
  },

  async updateWebhookEvent(where: { id: string }, data: Partial<FileWebhookEventWriteRecord>) {
    const store = await readStore();
    const index = store.webhookEvents.findIndex((item) => item.id === where.id);
    if (index === -1) throw new Error(`Webhook ${where.id} no encontrado.`);
    store.webhookEvents[index] = {
      ...store.webhookEvents[index],
      ...data,
      processedAt: normalizeOptionalDate(data.processedAt, store.webhookEvents[index].processedAt),
    };
    await writeStore(store);
    return withWebhookDates(store.webhookEvents[index]);
  },

  async listWebhookEvents(args?: { where?: Record<string, unknown>; orderBy?: Record<string, SortDirection>; take?: number; select?: Record<string, unknown> }) {
    const store = await readStore();
    const events = sortByField(filterWebhookEvents(store.webhookEvents, args?.where), args?.orderBy);
    const sliced = typeof args?.take === "number" ? events.slice(0, args.take) : events;
    return sliced.map((event) => selectWebhookEvent(event, args?.select));
  },

  async countWebhookEvents(where?: Record<string, unknown>) {
    const store = await readStore();
    return filterWebhookEvents(store.webhookEvents, where).length;
  },
};
