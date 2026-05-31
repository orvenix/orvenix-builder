"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileStoreApi = void 0;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const DEFAULT_PLANS = [
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
const STORE_DIR = path_1.default.join(process.cwd(), "data");
const STORE_FILE = path_1.default.join(STORE_DIR, "runtime-store.json");
const EMPTY_STORE = {
    users: [],
    sites: [],
    supportTickets: [],
    templateIntents: [],
    plans: DEFAULT_PLANS,
    subscriptions: [],
    webhookEvents: [],
};
async function ensureStoreFile() {
    await (0, promises_1.mkdir)(STORE_DIR, { recursive: true });
    try {
        await (0, promises_1.readFile)(STORE_FILE, "utf8");
    }
    catch (_a) {
        await (0, promises_1.writeFile)(STORE_FILE, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
    }
}
async function readStore() {
    var _a, _b, _c, _d, _e, _f, _g;
    await ensureStoreFile();
    const raw = await (0, promises_1.readFile)(STORE_FILE, "utf8");
    try {
        const parsed = JSON.parse(raw);
        return {
            users: (_a = parsed.users) !== null && _a !== void 0 ? _a : [],
            sites: (_b = parsed.sites) !== null && _b !== void 0 ? _b : [],
            supportTickets: (_c = parsed.supportTickets) !== null && _c !== void 0 ? _c : [],
            templateIntents: (_d = parsed.templateIntents) !== null && _d !== void 0 ? _d : [],
            plans: (_e = parsed.plans) !== null && _e !== void 0 ? _e : DEFAULT_PLANS,
            subscriptions: (_f = parsed.subscriptions) !== null && _f !== void 0 ? _f : [],
            webhookEvents: (_g = parsed.webhookEvents) !== null && _g !== void 0 ? _g : [],
        };
    }
    catch (_h) {
        return structuredClone(EMPTY_STORE);
    }
}
async function writeStore(store) {
    await ensureStoreFile();
    await (0, promises_1.writeFile)(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}
function sortByField(items, orderBy) {
    var _a;
    if (!orderBy)
        return items;
    const [field, direction] = (_a = Object.entries(orderBy)[0]) !== null && _a !== void 0 ? _a : [];
    if (!field || !direction)
        return items;
    return [...items].sort((a, b) => {
        const left = a[field];
        const right = b[field];
        if (left === right)
            return 0;
        if (left == null)
            return direction === "asc" ? -1 : 1;
        if (right == null)
            return direction === "asc" ? 1 : -1;
        return left > right ? (direction === "asc" ? 1 : -1) : (direction === "asc" ? -1 : 1);
    });
}
function filterSites(sites, where) {
    if (!where)
        return sites;
    return sites.filter((site) => Object.entries(where).every(([key, value]) => site[key] === value));
}
function filterUsers(users, where) {
    if (!where)
        return users;
    return users.filter((user) => Object.entries(where).every(([key, value]) => user[key] === value));
}
function withSiteDates(site) {
    return Object.assign(Object.assign({}, site), { createdAt: new Date(site.createdAt), updatedAt: new Date(site.updatedAt) });
}
function withUserDates(user) {
    return Object.assign(Object.assign({}, user), { createdAt: new Date(user.createdAt), updatedAt: new Date(user.updatedAt) });
}
function withSubscriptionDates(subscription) {
    return Object.assign(Object.assign({}, subscription), { currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null, canceledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null, createdAt: new Date(subscription.createdAt), updatedAt: new Date(subscription.updatedAt) });
}
function withWebhookDates(event) {
    return Object.assign(Object.assign({}, event), { createdAt: new Date(event.createdAt), processedAt: event.processedAt ? new Date(event.processedAt) : null });
}
function normalizeOptionalDate(value, fallback) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (value === null) {
        return null;
    }
    return value !== null && value !== void 0 ? value : fallback;
}
function filterPlans(plans, where) {
    if (!where)
        return plans;
    return plans.filter((plan) => Object.entries(where).every(([key, value]) => plan[key] === value));
}
function filterWebhookEvents(events, where) {
    if (!where)
        return events;
    return events.filter((event) => Object.entries(where).every(([key, value]) => event[key] === value));
}
function selectPlan(plan, select) {
    if (!select)
        return plan;
    return Object.fromEntries(Object.entries(select)
        .filter(([, enabled]) => enabled)
        .map(([field]) => [field, plan[field]]));
}
function selectSubscription(subscription, plans, select, include) {
    var _a;
    const hydrated = withSubscriptionDates(subscription);
    if (include === null || include === void 0 ? void 0 : include.plan) {
        return Object.assign(Object.assign({}, hydrated), { plan: (_a = plans.find((plan) => plan.id === subscription.planId)) !== null && _a !== void 0 ? _a : null });
    }
    if (!select)
        return hydrated;
    return Object.fromEntries(Object.entries(select)
        .filter(([, enabled]) => enabled)
        .map(([field]) => [field, hydrated[field]]));
}
function selectWebhookEvent(event, select) {
    const hydrated = withWebhookDates(event);
    if (!select)
        return hydrated;
    return Object.fromEntries(Object.entries(select)
        .filter(([, enabled]) => enabled)
        .map(([field]) => [field, hydrated[field]]));
}
function selectSite(site, users, select) {
    const hydrated = withSiteDates(site);
    if (!select)
        return hydrated;
    const result = {};
    for (const [key, value] of Object.entries(select)) {
        if (!value)
            continue;
        if (key === "user" && typeof value === "object" && value && "select" in value) {
            const user = users.find((item) => item.id === site.userId);
            if (!user) {
                result.user = null;
            }
            else {
                const userSelect = value.select;
                result.user = Object.fromEntries(Object.entries(userSelect)
                    .filter(([, enabled]) => enabled)
                    .map(([field]) => [field, user[field]]));
            }
            continue;
        }
        result[key] = hydrated[key];
    }
    return result;
}
function selectUser(user, sites, select) {
    const hydrated = withUserDates(user);
    if (!select)
        return hydrated;
    const result = {};
    for (const [key, value] of Object.entries(select)) {
        if (!value)
            continue;
        if (key === "_count" && typeof value === "object" && value && "select" in value) {
            const countSelect = value.select;
            result._count = Object.assign({}, (countSelect.sites ? { sites: sites.filter((site) => site.userId === user.id).length } : {}));
            continue;
        }
        result[key] = hydrated[key];
    }
    return result;
}
exports.fileStoreApi = {
    async readStore() {
        return readStore();
    },
    async createUser(data) {
        const store = await readStore();
        const now = new Date().toISOString();
        const user = Object.assign(Object.assign({}, data), { createdAt: now, updatedAt: now });
        store.users.push(user);
        await writeStore(store);
        return withUserDates(user);
    },
    async findUser(where) {
        const store = await readStore();
        const user = store.users.find((item) => (where.email ? item.email === where.email : true) &&
            (where.id ? item.id === where.id : true));
        return user ? withUserDates(user) : null;
    },
    async countUsers() {
        const store = await readStore();
        return store.users.length;
    },
    async listUsers(args) {
        const store = await readStore();
        const users = sortByField(filterUsers(store.users, args === null || args === void 0 ? void 0 : args.where), args === null || args === void 0 ? void 0 : args.orderBy);
        return users.map((user) => selectUser(user, store.sites, args === null || args === void 0 ? void 0 : args.select));
    },
    async createSite(data) {
        var _a, _b, _c;
        const store = await readStore();
        const now = new Date().toISOString();
        const site = {
            id: data.id,
            name: data.name,
            description: (_a = data.description) !== null && _a !== void 0 ? _a : "",
            tree: data.tree,
            published: (_b = data.published) !== null && _b !== void 0 ? _b : false,
            userId: (_c = data.userId) !== null && _c !== void 0 ? _c : null,
            createdAt: now,
            updatedAt: now,
        };
        store.sites.push(site);
        await writeStore(store);
        return withSiteDates(site);
    },
    async findSiteUnique(where, select) {
        const store = await readStore();
        const site = store.sites.find((item) => item.id === where.id);
        return site ? selectSite(site, store.users, select) : null;
    },
    async findSiteFirst(args) {
        const store = await readStore();
        const site = filterSites(store.sites, args.where)[0];
        return site ? selectSite(site, store.users, args.select) : null;
    },
    async listSites(args) {
        const store = await readStore();
        const sites = sortByField(filterSites(store.sites, args === null || args === void 0 ? void 0 : args.where), args === null || args === void 0 ? void 0 : args.orderBy);
        return sites.map((site) => selectSite(site, store.users, args === null || args === void 0 ? void 0 : args.select));
    },
    async countSites(where) {
        const store = await readStore();
        return filterSites(store.sites, where).length;
    },
    async updateSite(where, data) {
        const store = await readStore();
        const index = store.sites.findIndex((item) => item.id === where.id);
        if (index === -1)
            throw new Error(`Sitio ${where.id} no encontrado.`);
        store.sites[index] = Object.assign(Object.assign(Object.assign({}, store.sites[index]), data), { updatedAt: new Date().toISOString() });
        await writeStore(store);
        return withSiteDates(store.sites[index]);
    },
    async updateSites(where, data) {
        const store = await readStore();
        let count = 0;
        store.sites = store.sites.map((site) => {
            const matches = Object.entries(where).every(([key, value]) => site[key] === value);
            if (!matches)
                return site;
            count += 1;
            return Object.assign(Object.assign(Object.assign({}, site), data), { updatedAt: new Date().toISOString() });
        });
        await writeStore(store);
        return { count };
    },
    async deleteSites(where) {
        const store = await readStore();
        const before = store.sites.length;
        store.sites = store.sites.filter((site) => !Object.entries(where).every(([key, value]) => site[key] === value));
        const count = before - store.sites.length;
        await writeStore(store);
        return { count };
    },
    async upsertSite(where, update, create) {
        const existing = await this.findSiteUnique(where);
        if (existing) {
            return this.updateSite(where, update);
        }
        return this.createSite(create);
    },
    async listTickets() {
        const store = await readStore();
        return store.supportTickets.map((ticket) => (Object.assign(Object.assign({}, ticket), { createdAt: new Date(ticket.createdAt), updatedAt: new Date(ticket.updatedAt) })));
    },
    async createTicket(ticket) {
        const store = await readStore();
        const now = new Date().toISOString();
        store.supportTickets.push(Object.assign(Object.assign({}, ticket), { createdAt: now, updatedAt: now }));
        await writeStore(store);
    },
    async updateTicketStatus(ticketId, status, userId) {
        const store = await readStore();
        let count = 0;
        store.supportTickets = store.supportTickets.map((ticket) => {
            if (ticket.id !== ticketId)
                return ticket;
            if (userId && ticket.userId !== userId)
                return ticket;
            if (userId && !["open", "in_progress"].includes(ticket.status))
                return ticket;
            count += 1;
            return Object.assign(Object.assign({}, ticket), { status, updatedAt: new Date().toISOString() });
        });
        await writeStore(store);
        return count;
    },
    async createTemplateIntent(intent) {
        const store = await readStore();
        const now = new Date().toISOString();
        store.templateIntents.push(Object.assign(Object.assign({}, intent), { createdAt: now, updatedAt: now }));
        await writeStore(store);
    },
    async listPlans(args) {
        const store = await readStore();
        const plans = sortByField(filterPlans(store.plans, args === null || args === void 0 ? void 0 : args.where), args === null || args === void 0 ? void 0 : args.orderBy);
        return plans.map((plan) => selectPlan(plan, args === null || args === void 0 ? void 0 : args.select));
    },
    async findPlanUnique(where, select) {
        const store = await readStore();
        const plan = store.plans.find((item) => item.id === where.id);
        return plan ? selectPlan(plan, select) : null;
    },
    async upsertPlan(where, update, create) {
        const store = await readStore();
        const index = store.plans.findIndex((item) => item.id === where.id);
        if (index >= 0) {
            store.plans[index] = Object.assign(Object.assign({}, store.plans[index]), update);
            await writeStore(store);
            return store.plans[index];
        }
        store.plans.push(create);
        await writeStore(store);
        return create;
    },
    async updatePlan(where, data) {
        const store = await readStore();
        const index = store.plans.findIndex((item) => item.id === where.id);
        if (index === -1)
            throw new Error(`Plan ${where.id} no encontrado.`);
        store.plans[index] = Object.assign(Object.assign({}, store.plans[index]), data);
        await writeStore(store);
        return store.plans[index];
    },
    async findSubscriptionUnique(args) {
        const store = await readStore();
        const subscription = store.subscriptions.find((item) => (args.where.userId ? item.userId === args.where.userId : true) &&
            (args.where.stripeSubscriptionId ? item.stripeSubscriptionId === args.where.stripeSubscriptionId : true) &&
            (args.where.mpSubscriptionId ? item.mpSubscriptionId === args.where.mpSubscriptionId : true));
        return subscription ? selectSubscription(subscription, store.plans, args.select, args.include) : null;
    },
    async upsertSubscription(where, update, create) {
        const store = await readStore();
        const index = store.subscriptions.findIndex((item) => (where.userId ? item.userId === where.userId : true) &&
            (where.stripeSubscriptionId ? item.stripeSubscriptionId === where.stripeSubscriptionId : true) &&
            (where.mpSubscriptionId ? item.mpSubscriptionId === where.mpSubscriptionId : true));
        const now = new Date().toISOString();
        if (index >= 0) {
            store.subscriptions[index] = Object.assign(Object.assign(Object.assign({}, store.subscriptions[index]), update), { currentPeriodEnd: normalizeOptionalDate(update.currentPeriodEnd, store.subscriptions[index].currentPeriodEnd), canceledAt: normalizeOptionalDate(update.canceledAt, store.subscriptions[index].canceledAt), updatedAt: now });
            await writeStore(store);
            return withSubscriptionDates(store.subscriptions[index]);
        }
        const next = Object.assign(Object.assign({ id: crypto.randomUUID() }, create), { currentPeriodEnd: normalizeOptionalDate(create.currentPeriodEnd, null), canceledAt: normalizeOptionalDate(create.canceledAt, null), createdAt: now, updatedAt: now });
        store.subscriptions.push(next);
        await writeStore(store);
        return withSubscriptionDates(next);
    },
    async updateSubscription(where, data) {
        const store = await readStore();
        const index = store.subscriptions.findIndex((item) => item.userId === where.userId);
        if (index === -1)
            throw new Error(`Subscription de ${where.userId} no encontrada.`);
        store.subscriptions[index] = Object.assign(Object.assign(Object.assign({}, store.subscriptions[index]), data), { currentPeriodEnd: normalizeOptionalDate(data.currentPeriodEnd, store.subscriptions[index].currentPeriodEnd), canceledAt: normalizeOptionalDate(data.canceledAt, store.subscriptions[index].canceledAt), updatedAt: new Date().toISOString() });
        await writeStore(store);
        return withSubscriptionDates(store.subscriptions[index]);
    },
    async updateSubscriptions(where, data) {
        const store = await readStore();
        let count = 0;
        store.subscriptions = store.subscriptions.map((subscription) => {
            const matches = Object.entries(where).every(([key, value]) => subscription[key] === value);
            if (!matches)
                return subscription;
            count += 1;
            return Object.assign(Object.assign(Object.assign({}, subscription), data), { currentPeriodEnd: normalizeOptionalDate(data.currentPeriodEnd, subscription.currentPeriodEnd), canceledAt: normalizeOptionalDate(data.canceledAt, subscription.canceledAt), updatedAt: new Date().toISOString() });
        });
        await writeStore(store);
        return { count };
    },
    async createWebhookEvent(data) {
        const store = await readStore();
        const event = Object.assign(Object.assign({}, data), { createdAt: new Date().toISOString(), processedAt: normalizeOptionalDate(data.processedAt, null) });
        store.webhookEvents.push(event);
        await writeStore(store);
        return withWebhookDates(event);
    },
    async updateWebhookEvent(where, data) {
        const store = await readStore();
        const index = store.webhookEvents.findIndex((item) => item.id === where.id);
        if (index === -1)
            throw new Error(`Webhook ${where.id} no encontrado.`);
        store.webhookEvents[index] = Object.assign(Object.assign(Object.assign({}, store.webhookEvents[index]), data), { processedAt: normalizeOptionalDate(data.processedAt, store.webhookEvents[index].processedAt) });
        await writeStore(store);
        return withWebhookDates(store.webhookEvents[index]);
    },
    async listWebhookEvents(args) {
        const store = await readStore();
        const events = sortByField(filterWebhookEvents(store.webhookEvents, args === null || args === void 0 ? void 0 : args.where), args === null || args === void 0 ? void 0 : args.orderBy);
        const sliced = typeof (args === null || args === void 0 ? void 0 : args.take) === "number" ? events.slice(0, args.take) : events;
        return sliced.map((event) => selectWebhookEvent(event, args === null || args === void 0 ? void 0 : args.select));
    },
    async countWebhookEvents(where) {
        const store = await readStore();
        return filterWebhookEvents(store.webhookEvents, where).length;
    },
};
