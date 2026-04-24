import { _ as withBasePath, a as getLayoutSegmentContext, c as navigateClientSide$1, d as usePathname$1, f as ReadonlyURLSearchParams, g as toSameOriginAppPath, h as toBrowserNavigationHref, i as getCurrentInterceptionContext$1, l as prefetchRscResponse$1, m as resolveRelativeHref, n as ParallelSlot, o as getMountedSlotsHeader$1, p as notifyAppRouterTransitionStart, r as Slot, s as getPrefetchedUrls$1, t as Children, u as toRscUrl$1, v as stripBasePath, y as createAppPayloadCacheKey } from "../index.js";
import { a as getDomainLocaleUrl, i as addLocalePrefix, n as appendSearchParamsToUrl, r as urlQueryToSearchParams } from "./query-DGHsJKv-.js";
import * as React$1 from "react";
import React, { createContext, createElement, forwardRef, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import crypto from "crypto";
//#region api/auth-context.tsx
var AuthContext = createContext({
	token: null,
	user: null,
	setAuth: () => {},
	logout: () => {}
});
function AuthProvider({ children }) {
	const [token, setToken] = useState(null);
	const [user, setUser] = useState(null);
	useEffect(() => {
		const t = localStorage.getItem("cl_token");
		const u = localStorage.getItem("cl_user");
		if (t) setToken(t);
		if (u) setUser(JSON.parse(u));
	}, []);
	const setAuth = (t, u) => {
		localStorage.setItem("cl_token", t);
		localStorage.setItem("cl_user", JSON.stringify(u));
		setToken(t);
		setUser(u);
	};
	const logout = () => {
		localStorage.removeItem("cl_token");
		localStorage.removeItem("cl_user");
		localStorage.removeItem("cl_data");
		setToken(null);
		setUser(null);
	};
	return /* @__PURE__ */ jsx(AuthContext.Provider, {
		value: {
			token,
			user,
			setAuth,
			logout
		},
		children
	});
}
var useAuth = () => useContext(AuthContext);
//#endregion
//#region node_modules/vinext/dist/shims/navigation.js
var _SERVER_INSERTED_HTML_CTX_KEY = Symbol.for("vinext.serverInsertedHTMLContext");
function getServerInsertedHTMLContext() {
	if (typeof React$1.createContext !== "function") return null;
	const globalState = globalThis;
	if (!globalState[_SERVER_INSERTED_HTML_CTX_KEY]) globalState[_SERVER_INSERTED_HTML_CTX_KEY] = React$1.createContext(null);
	return globalState[_SERVER_INSERTED_HTML_CTX_KEY] ?? null;
}
getServerInsertedHTMLContext();
var _GLOBAL_ACCESSORS_KEY = Symbol.for("vinext.navigation.globalAccessors");
function _getGlobalAccessors() {
	return globalThis[_GLOBAL_ACCESSORS_KEY];
}
var _serverContext = null;
var _getServerContext = () => {
	const g = _getGlobalAccessors();
	return g ? g.getServerContext() : _serverContext;
};
var isServer = typeof window === "undefined";
/**
* Convert a pathname (with optional query/hash) to its .rsc URL.
* Strips trailing slashes before appending `.rsc` so that cache keys
* are consistent regardless of the `trailingSlash` config setting.
*/
function toRscUrl(href) {
	const [beforeHash] = href.split("#");
	const qIdx = beforeHash.indexOf("?");
	const pathname = qIdx === -1 ? beforeHash : beforeHash.slice(0, qIdx);
	const query = qIdx === -1 ? "" : beforeHash.slice(qIdx);
	return (pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname) + ".rsc" + query;
}
function getCurrentInterceptionContext() {
	if (isServer) return null;
	return stripBasePath(window.location.pathname, "");
}
/** Get or create the shared in-memory RSC prefetch cache on window. */
function getPrefetchCache() {
	if (isServer) return /* @__PURE__ */ new Map();
	if (!window.__VINEXT_RSC_PREFETCH_CACHE__) window.__VINEXT_RSC_PREFETCH_CACHE__ = /* @__PURE__ */ new Map();
	return window.__VINEXT_RSC_PREFETCH_CACHE__;
}
/**
* Get or create the shared set of already-prefetched RSC URLs on window.
* Keyed by interception-aware cache key so distinct source routes do not alias.
*/
function getPrefetchedUrls() {
	if (isServer) return /* @__PURE__ */ new Set();
	if (!window.__VINEXT_RSC_PREFETCHED_URLS__) window.__VINEXT_RSC_PREFETCHED_URLS__ = /* @__PURE__ */ new Set();
	return window.__VINEXT_RSC_PREFETCHED_URLS__;
}
/**
* Evict prefetch cache entries if at capacity.
* First sweeps expired entries, then falls back to FIFO eviction.
*/
function evictPrefetchCacheIfNeeded() {
	const cache = getPrefetchCache();
	if (cache.size < 50) return;
	const now = Date.now();
	const prefetched = getPrefetchedUrls();
	for (const [key, entry] of cache) if (now - entry.timestamp >= 3e4) {
		cache.delete(key);
		prefetched.delete(key);
	}
	while (cache.size >= 50) {
		const oldest = cache.keys().next().value;
		if (oldest !== void 0) {
			cache.delete(oldest);
			prefetched.delete(oldest);
		} else break;
	}
}
/**
* Snapshot an RSC response to an ArrayBuffer for caching and replay.
* Consumes the response body and stores it with content-type and URL metadata.
*/
async function snapshotRscResponse(response) {
	return {
		buffer: await response.arrayBuffer(),
		contentType: response.headers.get("content-type") ?? "text/x-component",
		mountedSlotsHeader: response.headers.get("X-Vinext-Mounted-Slots"),
		paramsHeader: response.headers.get("X-Vinext-Params"),
		url: response.url
	};
}
/**
* Prefetch an RSC response and snapshot it for later consumption.
* Stores the in-flight promise so immediate clicks can await it instead
* of firing a duplicate fetch.
* Enforces a maximum cache size to prevent unbounded memory growth on
* link-heavy pages.
*/
function prefetchRscResponse(rscUrl, fetchPromise, interceptionContext = null, mountedSlotsHeader = null) {
	const cacheKey = createAppPayloadCacheKey(rscUrl, interceptionContext);
	const cache = getPrefetchCache();
	const prefetched = getPrefetchedUrls();
	const entry = { timestamp: Date.now() };
	entry.pending = fetchPromise.then(async (response) => {
		if (response.ok) entry.snapshot = {
			...await snapshotRscResponse(response),
			mountedSlotsHeader
		};
		else {
			prefetched.delete(cacheKey);
			cache.delete(cacheKey);
		}
	}).catch(() => {
		prefetched.delete(cacheKey);
		cache.delete(cacheKey);
	}).finally(() => {
		entry.pending = void 0;
	});
	cache.set(cacheKey, entry);
	evictPrefetchCacheIfNeeded();
}
var _CLIENT_NAV_STATE_KEY = Symbol.for("vinext.clientNavigationState");
var _MOUNTED_SLOTS_HEADER_KEY = Symbol.for("vinext.mountedSlotsHeader");
function getMountedSlotsHeader() {
	if (isServer) return null;
	return window[_MOUNTED_SLOTS_HEADER_KEY] ?? null;
}
function getClientNavigationState() {
	if (isServer) return null;
	const globalState = window;
	globalState[_CLIENT_NAV_STATE_KEY] ??= {
		listeners: /* @__PURE__ */ new Set(),
		cachedSearch: window.location.search,
		cachedReadonlySearchParams: new ReadonlyURLSearchParams(window.location.search),
		cachedPathname: stripBasePath(window.location.pathname, ""),
		clientParams: {},
		clientParamsJson: "{}",
		pendingClientParams: null,
		pendingClientParamsJson: null,
		pendingPathname: null,
		pendingPathnameNavId: null,
		originalPushState: window.history.pushState.bind(window.history),
		originalReplaceState: window.history.replaceState.bind(window.history),
		patchInstalled: false,
		hasPendingNavigationUpdate: false,
		suppressUrlNotifyCount: 0,
		navigationSnapshotActiveCount: 0
	};
	return globalState[_CLIENT_NAV_STATE_KEY];
}
function notifyNavigationListeners() {
	const state = getClientNavigationState();
	if (!state) return;
	for (const fn of state.listeners) fn();
}
/**
* Get cached pathname snapshot for useSyncExternalStore.
* Note: Returns cached value from ClientNavigationState, not live window.location.
* The cache is updated by syncCommittedUrlStateFromLocation() after navigation commits.
* This ensures referential stability and prevents infinite re-renders.
* External pushState/replaceState while URL notifications are suppressed won't
* be visible until the next commit.
*/
function getPathnameSnapshot() {
	return getClientNavigationState()?.cachedPathname ?? "/";
}
function syncCommittedUrlStateFromLocation() {
	const state = getClientNavigationState();
	if (!state) return false;
	let changed = false;
	const pathname = stripBasePath(window.location.pathname, "");
	if (pathname !== state.cachedPathname) {
		state.cachedPathname = pathname;
		changed = true;
	}
	const search = window.location.search;
	if (search !== state.cachedSearch) {
		state.cachedSearch = search;
		state.cachedReadonlySearchParams = new ReadonlyURLSearchParams(search);
		changed = true;
	}
	return changed;
}
var _EMPTY_PARAMS = {};
var _CLIENT_NAV_RENDER_CTX_KEY = Symbol.for("vinext.clientNavigationRenderContext");
function getClientNavigationRenderContext() {
	if (typeof React$1.createContext !== "function") return null;
	const globalState = globalThis;
	if (!globalState[_CLIENT_NAV_RENDER_CTX_KEY]) globalState[_CLIENT_NAV_RENDER_CTX_KEY] = React$1.createContext(null);
	return globalState[_CLIENT_NAV_RENDER_CTX_KEY] ?? null;
}
function useClientNavigationRenderSnapshot() {
	const ctx = getClientNavigationRenderContext();
	if (!ctx || typeof React$1.useContext !== "function") return null;
	try {
		return React$1.useContext(ctx);
	} catch {
		return null;
	}
}
function getClientParamsSnapshot() {
	return getClientNavigationState()?.clientParams ?? _EMPTY_PARAMS;
}
function getServerParamsSnapshot() {
	return _getServerContext()?.params ?? _EMPTY_PARAMS;
}
function subscribeToNavigation(cb) {
	const state = getClientNavigationState();
	if (!state) return () => {};
	state.listeners.add(cb);
	return () => {
		state.listeners.delete(cb);
	};
}
/**
* Returns the current pathname.
* Server: from request context. Client: from window.location.
*/
function usePathname() {
	if (isServer) return _getServerContext()?.pathname ?? "/";
	const renderSnapshot = useClientNavigationRenderSnapshot();
	const pathname = React$1.useSyncExternalStore(subscribeToNavigation, getPathnameSnapshot, () => _getServerContext()?.pathname ?? "/");
	if (renderSnapshot && (getClientNavigationState()?.navigationSnapshotActiveCount ?? 0) > 0) return renderSnapshot.pathname;
	return pathname;
}
/**
* Returns the dynamic params for the current route.
*/
function useParams() {
	if (isServer) return _getServerContext()?.params ?? _EMPTY_PARAMS;
	const renderSnapshot = useClientNavigationRenderSnapshot();
	const params = React$1.useSyncExternalStore(subscribeToNavigation, getClientParamsSnapshot, getServerParamsSnapshot);
	if (renderSnapshot && (getClientNavigationState()?.navigationSnapshotActiveCount ?? 0) > 0) return renderSnapshot.params;
	return params;
}
/**
* Check if a href is an external URL (any URL scheme per RFC 3986, or protocol-relative).
*/
function isExternalUrl(href) {
	return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
}
/**
* Check if a href is only a hash change relative to the current URL.
*/
function isHashOnlyChange(href) {
	if (typeof window === "undefined") return false;
	if (href.startsWith("#")) return true;
	try {
		const current = new URL(window.location.href);
		const next = new URL(href, window.location.href);
		return stripBasePath(current.pathname, "") === stripBasePath(next.pathname, "") && current.search === next.search && next.hash !== "";
	} catch {
		return false;
	}
}
/**
* Scroll to a hash target element, or to the top if no hash.
*/
function scrollToHash(hash) {
	if (!hash || hash === "#") {
		window.scrollTo(0, 0);
		return;
	}
	const id = hash.slice(1);
	const element = document.getElementById(id);
	if (element) element.scrollIntoView({ behavior: "auto" });
}
function withSuppressedUrlNotifications(fn) {
	const state = getClientNavigationState();
	if (!state) return fn();
	state.suppressUrlNotifyCount += 1;
	try {
		return fn();
	} finally {
		state.suppressUrlNotifyCount -= 1;
	}
}
/**
* Commit pending client navigation state to committed snapshots.
*
* navId is optional: callers that don't own pendingPathname (for example,
* superseded pre-paint cleanup) may pass undefined to flush snapshot/params
* state without clearing pendingPathname owned by the active navigation.
*/
function commitClientNavigationState(navId) {
	if (isServer) return;
	const state = getClientNavigationState();
	if (!state) return;
	if (state.navigationSnapshotActiveCount > 0) state.navigationSnapshotActiveCount -= 1;
	const urlChanged = syncCommittedUrlStateFromLocation();
	if (state.pendingClientParams !== null && state.pendingClientParamsJson !== null) {
		state.clientParams = state.pendingClientParams;
		state.clientParamsJson = state.pendingClientParamsJson;
		state.pendingClientParams = null;
		state.pendingClientParamsJson = null;
	}
	if (state.pendingPathnameNavId === null || navId !== void 0 && state.pendingPathnameNavId === navId) {
		state.pendingPathname = null;
		state.pendingPathnameNavId = null;
	}
	const shouldNotify = urlChanged || state.hasPendingNavigationUpdate;
	state.hasPendingNavigationUpdate = false;
	if (shouldNotify) notifyNavigationListeners();
}
function pushHistoryStateWithoutNotify(data, unused, url) {
	withSuppressedUrlNotifications(() => {
		getClientNavigationState()?.originalPushState.call(window.history, data, unused, url);
	});
}
function replaceHistoryStateWithoutNotify(data, unused, url) {
	withSuppressedUrlNotifications(() => {
		getClientNavigationState()?.originalReplaceState.call(window.history, data, unused, url);
	});
}
/**
* Save the current scroll position into the current history state.
* Called before every navigation to enable scroll restoration on back/forward.
*
* Uses replaceHistoryStateWithoutNotify to avoid triggering the patched
* history.replaceState interception (which would cause spurious re-renders).
*/
function saveScrollPosition() {
	replaceHistoryStateWithoutNotify({
		...window.history.state ?? {},
		__vinext_scrollX: window.scrollX,
		__vinext_scrollY: window.scrollY
	}, "");
}
/**
* Restore scroll position from a history state object (used on popstate).
*
* When an RSC navigation is in flight (back/forward triggers both this
* handler and the browser entry's popstate handler which calls
* __VINEXT_RSC_NAVIGATE__), we must wait for the new content to render
* before scrolling. Otherwise the user sees old content flash at the
* restored scroll position.
*
* This handler fires before the browser entry's popstate handler (because
* navigation.ts is loaded before hydration completes), so we defer via a
* microtask to give the browser entry handler a chance to set
* __VINEXT_RSC_PENDING__. Promise.resolve() schedules a microtask
* that runs after all synchronous event listeners have completed.
*/
function restoreScrollPosition(state) {
	if (state && typeof state === "object" && "__vinext_scrollY" in state) {
		const { __vinext_scrollX: x, __vinext_scrollY: y } = state;
		Promise.resolve().then(() => {
			const pending = window.__VINEXT_RSC_PENDING__ ?? null;
			if (pending) pending.then(() => {
				requestAnimationFrame(() => {
					window.scrollTo(x, y);
				});
			});
			else requestAnimationFrame(() => {
				window.scrollTo(x, y);
			});
		});
	}
}
/**
* Navigate to a URL, handling external URLs, hash-only changes, and RSC navigation.
*/
async function navigateClientSide(href, mode, scroll, programmaticTransition = false) {
	let normalizedHref = href;
	if (isExternalUrl(href)) {
		const localPath = toSameOriginAppPath(href, "");
		if (localPath == null) {
			if (mode === "replace") window.location.replace(href);
			else window.location.assign(href);
			return;
		}
		normalizedHref = localPath;
	}
	const fullHref = toBrowserNavigationHref(normalizedHref, window.location.href, "");
	notifyAppRouterTransitionStart(fullHref, mode);
	if (mode === "push") saveScrollPosition();
	if (isHashOnlyChange(fullHref)) {
		const hash = fullHref.includes("#") ? fullHref.slice(fullHref.indexOf("#")) : "";
		if (mode === "replace") replaceHistoryStateWithoutNotify(null, "", fullHref);
		else pushHistoryStateWithoutNotify(null, "", fullHref);
		commitClientNavigationState();
		if (scroll) scrollToHash(hash);
		return;
	}
	const hashIdx = fullHref.indexOf("#");
	const hash = hashIdx !== -1 ? fullHref.slice(hashIdx) : "";
	if (typeof window.__VINEXT_RSC_NAVIGATE__ === "function") await window.__VINEXT_RSC_NAVIGATE__(fullHref, 0, "navigate", mode, void 0, programmaticTransition);
	else {
		if (mode === "replace") replaceHistoryStateWithoutNotify(null, "", fullHref);
		else pushHistoryStateWithoutNotify(null, "", fullHref);
		commitClientNavigationState();
	}
	if (scroll) if (hash) scrollToHash(hash);
	else window.scrollTo(0, 0);
}
var _appRouter = {
	push(href, options) {
		if (isServer) return;
		React$1.startTransition(() => {
			navigateClientSide(href, "push", options?.scroll !== false, true);
		});
	},
	replace(href, options) {
		if (isServer) return;
		React$1.startTransition(() => {
			navigateClientSide(href, "replace", options?.scroll !== false, true);
		});
	},
	back() {
		if (isServer) return;
		window.history.back();
	},
	forward() {
		if (isServer) return;
		window.history.forward();
	},
	refresh() {
		if (isServer) return;
		const rscNavigate = window.__VINEXT_RSC_NAVIGATE__;
		if (typeof rscNavigate === "function") {
			const navigate = () => {
				rscNavigate(window.location.href, 0, "refresh", void 0, void 0, true);
			};
			React$1.startTransition(navigate);
		}
	},
	prefetch(href) {
		if (isServer) return;
		const rscUrl = toRscUrl(toBrowserNavigationHref(href, window.location.href, ""));
		const interceptionContext = getCurrentInterceptionContext();
		const cacheKey = createAppPayloadCacheKey(rscUrl, interceptionContext);
		const prefetched = getPrefetchedUrls();
		if (prefetched.has(cacheKey)) return;
		prefetched.add(cacheKey);
		const mountedSlotsHeader = getMountedSlotsHeader();
		const headers = new Headers({ Accept: "text/x-component" });
		if (mountedSlotsHeader) headers.set("X-Vinext-Mounted-Slots", mountedSlotsHeader);
		if (interceptionContext !== null) headers.set("X-Vinext-Interception-Context", interceptionContext);
		prefetchRscResponse(rscUrl, fetch(rscUrl, {
			headers,
			credentials: "include",
			priority: "low"
		}), interceptionContext, mountedSlotsHeader);
	}
};
/**
* App Router's useRouter — returns push/replace/back/forward/refresh.
* Different from Pages Router's useRouter (next/router).
*
* Returns a stable singleton: the same object reference on every call,
* matching Next.js behavior so components using referential equality
* (e.g. useMemo / useEffect deps, React.memo) don't re-render unnecessarily.
*/
function useRouter() {
	return _appRouter;
}
if (!isServer) {
	const state = getClientNavigationState();
	if (state && !state.patchInstalled) {
		state.patchInstalled = true;
		window.addEventListener("popstate", (event) => {
			if (typeof window.__VINEXT_RSC_NAVIGATE__ !== "function") {
				commitClientNavigationState();
				restoreScrollPosition(event.state);
			}
		});
		window.history.pushState = function patchedPushState(data, unused, url) {
			state.originalPushState.call(window.history, data, unused, url);
			if (state.suppressUrlNotifyCount === 0) commitClientNavigationState();
		};
		window.history.replaceState = function patchedReplaceState(data, unused, url) {
			state.originalReplaceState.call(window.history, data, unused, url);
			if (state.suppressUrlNotifyCount === 0) commitClientNavigationState();
		};
	}
}
//#endregion
//#region node_modules/vinext/dist/shims/url-safety.js
/**
* Shared URL safety utilities for Link, Form, and navigation shims.
*
* Centralizes dangerous URI scheme detection so all components and
* navigation functions use the same validation logic.
*/
/**
* Detect dangerous URI schemes that should never be navigated to.
*
* Adapted from Next.js's javascript URL detector:
* packages/next/src/client/lib/javascript-url.ts
* https://github.com/vercel/next.js/blob/canary/packages/next/src/client/lib/javascript-url.ts
*
* URL parsing ignores leading C0 control characters / spaces, and treats
* embedded tab/newline characters in the scheme as insignificant. We mirror
* that behavior here so obfuscated values like `java\nscript:` and
* `\x00javascript:` are still blocked.
*
* Vinext intentionally extends this handling to `data:` and `vbscript:` too,
* since both are also dangerous navigation targets.
*/
var LEADING_IGNORED = "[\\u0000-\\u001F \\u200B\\uFEFF]*";
var SCHEME_IGNORED = "[\\r\\n\\t]*";
function buildDangerousSchemeRegex(scheme) {
	const chars = scheme.split("").join(SCHEME_IGNORED);
	return new RegExp(`^${LEADING_IGNORED}${chars}${SCHEME_IGNORED}:`, "i");
}
var DANGEROUS_SCHEME_RES = [
	buildDangerousSchemeRegex("javascript"),
	buildDangerousSchemeRegex("data"),
	buildDangerousSchemeRegex("vbscript")
];
function isDangerousScheme(url) {
	const str = "" + url;
	return DANGEROUS_SCHEME_RES.some((re) => re.test(str));
}
//#endregion
//#region node_modules/vinext/dist/shims/i18n-context.js
var _getI18nContext = () => {
	if (globalThis.__VINEXT_DEFAULT_LOCALE__ == null && globalThis.__VINEXT_LOCALE__ == null) return null;
	return {
		locale: globalThis.__VINEXT_LOCALE__,
		locales: globalThis.__VINEXT_LOCALES__,
		defaultLocale: globalThis.__VINEXT_DEFAULT_LOCALE__,
		domainLocales: globalThis.__VINEXT_DOMAIN_LOCALES__,
		hostname: globalThis.__VINEXT_HOSTNAME__
	};
};
function getI18nContext() {
	return _getI18nContext();
}
//#endregion
//#region node_modules/vinext/dist/shims/link.js
/**
* next/link shim
*
* Renders an <a> tag with client-side navigation support.
* On click, prevents full page reload and triggers client-side
* page swap via the router's navigation system.
*/
var LinkStatusContext = createContext({ pending: false });
/** basePath from next.config.js, injected by the plugin at build time */
var __basePath = "";
function resolveHref(href) {
	if (typeof href === "string") return href;
	let url = href.pathname ?? "/";
	if (href.query) {
		const params = urlQueryToSearchParams(href.query);
		url = appendSearchParamsToUrl(url, params);
	}
	return url;
}
/**
* Prefetch a URL for faster navigation.
*
* For App Router (RSC): fetches the .rsc payload in the background and
* stores it in an in-memory cache for instant use during navigation.
* For Pages Router: injects a <link rel="prefetch"> for the page module.
*
* Uses `requestIdleCallback` (or `setTimeout` fallback) to avoid blocking
* the main thread during initial page load.
*/
function prefetchUrl(href) {
	if (typeof window === "undefined") return;
	let prefetchHref = href;
	if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
		const localPath = toSameOriginAppPath(href, __basePath);
		if (localPath == null) return;
		prefetchHref = localPath;
	}
	const fullHref = toBrowserNavigationHref(prefetchHref, window.location.href, __basePath);
	const rscUrl = toRscUrl$1(fullHref);
	const interceptionContext = getCurrentInterceptionContext$1();
	const cacheKey = createAppPayloadCacheKey(rscUrl, interceptionContext);
	const prefetched = getPrefetchedUrls$1();
	if (prefetched.has(cacheKey)) return;
	prefetched.add(cacheKey);
	(window.requestIdleCallback ?? ((fn) => setTimeout(fn, 100)))(() => {
		if (typeof window.__VINEXT_RSC_NAVIGATE__ === "function") {
			const mountedSlotsHeader = getMountedSlotsHeader$1();
			const headers = new Headers({ Accept: "text/x-component" });
			if (mountedSlotsHeader) headers.set("X-Vinext-Mounted-Slots", mountedSlotsHeader);
			if (interceptionContext !== null) headers.set("X-Vinext-Interception-Context", interceptionContext);
			prefetchRscResponse$1(rscUrl, fetch(rscUrl, {
				headers,
				credentials: "include",
				priority: "low",
				purpose: "prefetch"
			}), interceptionContext, mountedSlotsHeader);
		} else if (window.__NEXT_DATA__?.__vinext?.pageModuleUrl) {
			const link = document.createElement("link");
			link.rel = "prefetch";
			link.href = fullHref;
			link.as = "document";
			document.head.appendChild(link);
		}
	});
}
/**
* Shared IntersectionObserver for viewport-based prefetching.
* All Link elements use the same observer to minimize resource usage.
*/
var sharedObserver = null;
var observerCallbacks = /* @__PURE__ */ new WeakMap();
function getSharedObserver() {
	if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return null;
	if (sharedObserver) return sharedObserver;
	sharedObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) if (entry.isIntersecting) {
			const callback = observerCallbacks.get(entry.target);
			if (callback) {
				callback();
				sharedObserver?.unobserve(entry.target);
				observerCallbacks.delete(entry.target);
			}
		}
	}, { rootMargin: "250px" });
	return sharedObserver;
}
function getDefaultLocale() {
	if (typeof window !== "undefined") return window.__VINEXT_DEFAULT_LOCALE__;
	return getI18nContext()?.defaultLocale;
}
function getDomainLocales() {
	if (typeof window !== "undefined") return window.__NEXT_DATA__?.domainLocales;
	return getI18nContext()?.domainLocales;
}
function getCurrentHostname() {
	if (typeof window !== "undefined") return window.location.hostname;
	return getI18nContext()?.hostname;
}
function getDomainLocaleHref(href, locale) {
	return getDomainLocaleUrl(href, locale, {
		basePath: __basePath,
		currentHostname: getCurrentHostname(),
		domainItems: getDomainLocales()
	});
}
/**
* Apply locale prefix to a URL path based on the locale prop.
* - locale="fr" → prepend /fr (unless it already has a locale prefix)
* - locale={false} → use the href as-is (no locale prefix, link to default)
* - locale=undefined → use current locale (href as-is in most cases)
*/
function applyLocaleToHref(href, locale) {
	if (locale === false) return href;
	if (locale === void 0) return href;
	if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) return href;
	const domainLocaleHref = getDomainLocaleHref(href, locale);
	if (domainLocaleHref) return domainLocaleHref;
	return addLocalePrefix(href, locale, getDefaultLocale() ?? "");
}
var Link = forwardRef(function Link({ href, as, replace = false, prefetch: prefetchProp, scroll = true, children, onClick, onNavigate, ...rest }, forwardedRef) {
	const { locale, ...restWithoutLocale } = rest;
	const resolvedHref = as ?? resolveHref(href);
	const isDangerous = typeof resolvedHref === "string" && isDangerousScheme(resolvedHref);
	const localizedHref = applyLocaleToHref(isDangerous ? "/" : resolvedHref, locale);
	const fullHref = withBasePath(localizedHref, __basePath);
	const [pending, setPending] = useState(false);
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	const internalRef = useRef(null);
	const shouldPrefetch = prefetchProp !== false && !isDangerous;
	const setRefs = useCallback((node) => {
		internalRef.current = node;
		if (typeof forwardedRef === "function") forwardedRef(node);
		else if (forwardedRef) forwardedRef.current = node;
	}, [forwardedRef]);
	useEffect(() => {
		if (!shouldPrefetch || typeof window === "undefined") return;
		const node = internalRef.current;
		if (!node) return;
		let hrefToPrefetch = localizedHref;
		if (localizedHref.startsWith("http://") || localizedHref.startsWith("https://") || localizedHref.startsWith("//")) {
			const localPath = toSameOriginAppPath(localizedHref, __basePath);
			if (localPath == null) return;
			hrefToPrefetch = localPath;
		}
		const observer = getSharedObserver();
		if (!observer) return;
		observerCallbacks.set(node, () => prefetchUrl(hrefToPrefetch));
		observer.observe(node);
		return () => {
			observer.unobserve(node);
			observerCallbacks.delete(node);
		};
	}, [shouldPrefetch, localizedHref]);
	const handleClick = async (e) => {
		if (onClick) onClick(e);
		if (e.defaultPrevented) return;
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (e.currentTarget.target && e.currentTarget.target !== "_self") return;
		let navigateHref = localizedHref;
		if (resolvedHref.startsWith("http://") || resolvedHref.startsWith("https://") || resolvedHref.startsWith("//")) {
			const localPath = toSameOriginAppPath(resolvedHref, __basePath);
			if (localPath == null) return;
			navigateHref = localPath;
		}
		e.preventDefault();
		const absoluteHref = resolveRelativeHref(navigateHref, window.location.href, __basePath);
		const absoluteFullHref = toBrowserNavigationHref(navigateHref, window.location.href, __basePath);
		if (onNavigate) try {
			const navUrl = new URL(absoluteFullHref, window.location.origin);
			let prevented = false;
			const navEvent = {
				url: navUrl,
				preventDefault() {
					prevented = true;
				},
				get defaultPrevented() {
					return prevented;
				}
			};
			onNavigate(navEvent);
			if (navEvent.defaultPrevented) return;
		} catch {}
		if (typeof window.__VINEXT_RSC_NAVIGATE__ === "function") {
			setPending(true);
			try {
				await navigateClientSide$1(navigateHref, replace ? "replace" : "push", scroll);
			} finally {
				if (mountedRef.current) setPending(false);
			}
		} else try {
			const Router = (await import("./router-CHnxSIda.js")).default;
			if (replace) await Router.replace(absoluteHref, void 0, { scroll });
			else await Router.push(absoluteHref, void 0, { scroll });
		} catch {
			if (replace) window.history.replaceState({}, "", absoluteFullHref);
			else window.history.pushState({}, "", absoluteFullHref);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}
	};
	const { passHref: _p, ...anchorProps } = restWithoutLocale;
	const linkStatusValue = React.useMemo(() => ({ pending }), [pending]);
	if (isDangerous) return /* @__PURE__ */ jsx("a", {
		...anchorProps,
		children
	});
	return /* @__PURE__ */ jsx(LinkStatusContext.Provider, {
		value: linkStatusValue,
		children: /* @__PURE__ */ jsx("a", {
			ref: setRefs,
			href: fullHref,
			onClick: handleClick,
			...anchorProps,
			children
		})
	});
});
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
	return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var toPascalCase = (string) => {
	const camelCase = toCamelCase(string);
	return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
//#endregion
//#region node_modules/lucide-react/dist/esm/defaultAttributes.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};
//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var hasA11yProp = (props) => {
	for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
	return false;
};
//#endregion
//#region node_modules/lucide-react/dist/esm/context.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LucideContext = createContext({});
var useLucideContext = () => useContext(LucideContext);
//#endregion
//#region node_modules/lucide-react/dist/esm/Icon.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Icon = forwardRef(({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
	const { size: contextSize = 24, strokeWidth: contextStrokeWidth = 2, absoluteStrokeWidth: contextAbsoluteStrokeWidth = false, color: contextColor = "currentColor", className: contextClass = "" } = useLucideContext() ?? {};
	const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
	return createElement("svg", {
		ref,
		...defaultAttributes,
		width: size ?? contextSize ?? defaultAttributes.width,
		height: size ?? contextSize ?? defaultAttributes.height,
		stroke: color ?? contextColor,
		strokeWidth: calculatedStrokeWidth,
		className: mergeClasses("lucide", contextClass, className),
		...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
		...rest
	}, [...iconNode.map(([tag, attrs]) => createElement(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
});
//#endregion
//#region node_modules/lucide-react/dist/esm/createLucideIcon.js
/**
* @license lucide-react v1.8.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var createLucideIcon = (iconName, iconNode) => {
	const Component = forwardRef(({ className, ...props }, ref) => createElement(Icon, {
		ref,
		iconNode,
		className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
		...props
	}));
	Component.displayName = toPascalCase(iconName);
	return Component;
};
var Moon = createLucideIcon("moon", [["path", {
	d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
	key: "kfwtm"
}]]);
var LayoutDashboard = createLucideIcon("layout-dashboard", [
	["rect", {
		width: "7",
		height: "9",
		x: "3",
		y: "3",
		rx: "1",
		key: "10lvy0"
	}],
	["rect", {
		width: "7",
		height: "5",
		x: "14",
		y: "3",
		rx: "1",
		key: "16une8"
	}],
	["rect", {
		width: "7",
		height: "9",
		x: "14",
		y: "12",
		rx: "1",
		key: "1hutg5"
	}],
	["rect", {
		width: "7",
		height: "5",
		x: "3",
		y: "16",
		rx: "1",
		key: "ldoo1y"
	}]
]);
var BookOpen = createLucideIcon("book-open", [["path", {
	d: "M12 7v14",
	key: "1akyts"
}], ["path", {
	d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
	key: "ruj8y"
}]]);
var User = createLucideIcon("user", [["path", {
	d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
	key: "975kel"
}], ["circle", {
	cx: "12",
	cy: "7",
	r: "4",
	key: "17ys0d"
}]]);
var LogOut = createLucideIcon("log-out", [
	["path", {
		d: "m16 17 5-5-5-5",
		key: "1bji2h"
	}],
	["path", {
		d: "M21 12H9",
		key: "dn1m92"
	}],
	["path", {
		d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
		key: "1uf3rs"
	}]
]);
var ChevronRight = createLucideIcon("chevron-right", [["path", {
	d: "m9 18 6-6-6-6",
	key: "mthhwq"
}]]);
var X = createLucideIcon("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]);
var Menu = createLucideIcon("menu", [
	["path", {
		d: "M4 5h16",
		key: "1tepv9"
	}],
	["path", {
		d: "M4 12h16",
		key: "1lakjw"
	}],
	["path", {
		d: "M4 19h16",
		key: "1djgab"
	}]
]);
//#endregion
//#region app/components/Sidebar.tsx
var navItems = [
	{
		href: "/dashboard",
		icon: LayoutDashboard,
		label: "Dashboard"
	},
	{
		href: "/courses",
		icon: BookOpen,
		label: "My Courses"
	},
	{
		href: "/profile",
		icon: User,
		label: "Profile"
	}
];
function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { user, logout } = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);
	const handleLogout = () => {
		logout();
		router.push("/login");
	};
	const SidebarContent = () => /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col h-full",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "px-6 py-6 border-b border-surface-3/60",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "w-9 h-9 rounded-xl flex items-center justify-center crescent-ring",
						style: { background: "rgba(201,168,76,0.08)" },
						children: /* @__PURE__ */ jsx(Moon, {
							size: 16,
							color: "#C9A84C"
						})
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-display text-sm font-bold text-white",
						children: "Crescent"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-slate-dim",
						children: "Learning"
					})] })]
				})
			}),
			user && /* @__PURE__ */ jsx("div", {
				className: "px-4 py-4 border-b border-surface-3/40",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 px-3 py-2.5 rounded-xl",
					style: { background: "rgba(36,40,64,0.5)" },
					children: [/* @__PURE__ */ jsx("div", {
						className: "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
						style: {
							background: "linear-gradient(135deg, #C9A84C, #7A6230)",
							color: "#0D0F12"
						},
						children: (user.username || user.email || "U").charAt(0).toUpperCase()
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-medium text-white truncate",
							children: user.username || "Student"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-slate-dim truncate",
							children: user.email
						})]
					})]
				})
			}),
			/* @__PURE__ */ jsxs("nav", {
				className: "flex-1 px-4 py-4 space-y-1",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs text-slate-dim uppercase tracking-wider px-3 mb-3",
					children: "Navigation"
				}), navItems.map(({ href, icon: Icon, label }) => {
					const active = pathname === href || pathname.startsWith(href + "/");
					return /* @__PURE__ */ jsxs(Link, {
						href,
						onClick: () => setMobileOpen(false),
						className: "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group",
						style: {
							background: active ? "rgba(201,168,76,0.12)" : "transparent",
							color: active ? "#E8C97A" : "#8A95A8",
							border: active ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent"
						},
						children: [
							/* @__PURE__ */ jsx(Icon, { size: 17 }),
							/* @__PURE__ */ jsx("span", {
								className: "flex-1",
								children: label
							}),
							active && /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
						]
					}, href);
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "px-4 pb-6",
				children: /* @__PURE__ */ jsxs("button", {
					onClick: handleLogout,
					className: "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-soft hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
					children: [/* @__PURE__ */ jsx(LogOut, { size: 17 }), /* @__PURE__ */ jsx("span", { children: "Sign Out" })]
				})
			})
		]
	});
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx("button", {
			className: "fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl flex items-center justify-center",
			style: {
				background: "rgba(19,22,32,0.9)",
				border: "1px solid rgba(42,47,58,0.6)"
			},
			onClick: () => setMobileOpen(!mobileOpen),
			children: mobileOpen ? /* @__PURE__ */ jsx(X, {
				size: 18,
				color: "#C9A84C"
			}) : /* @__PURE__ */ jsx(Menu, {
				size: 18,
				color: "#C9A84C"
			})
		}),
		mobileOpen && /* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 z-30 bg-black/60 lg:hidden",
			onClick: () => setMobileOpen(false)
		}),
		/* @__PURE__ */ jsx("aside", {
			className: "sidebar w-64 lg:hidden",
			style: {
				transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
				transition: "transform 0.3s ease"
			},
			children: /* @__PURE__ */ jsx(SidebarContent, {})
		}),
		/* @__PURE__ */ jsx("aside", {
			className: "sidebar w-64 hidden lg:block",
			children: /* @__PURE__ */ jsx(SidebarContent, {})
		})
	] });
}
//#endregion
//#region app/components/AppShell.tsx
function AppShell({ children }) {
	const { token } = useAuth();
	const router = useRouter();
	useEffect(() => {
		if (!(token ?? localStorage.getItem("cl_token"))) router.replace("/login");
	}, [token, router]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-screen",
		children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsx("main", {
			className: "flex-1 lg:ml-64 min-h-screen",
			children
		})]
	});
}
//#endregion
//#region api/api.ts
function hashPasswordWithSalt(password, salt) {
	const combined = password + salt;
	return crypto.createHash("sha256").update(combined, "utf8").digest("hex");
}
async function loginApi(email, password) {
	const hashed = hashPasswordWithSalt(password, "y6SsdIR");
	const res = await fetch("/api/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify({
			email,
			password: hashed
		})
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(body.message || `Login failed (${res.status})`);
	return {
		token: body.token ?? body.data?.token,
		user: body.user ?? body.data?.user ?? {}
	};
}
async function profileApi(token) {
	const res = await fetch("/api/profile", {
		method: "GET",
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`
		}
	});
	if (res.status === 401) throw new Error("Unauthorized");
	if (!res.ok) throw new Error(`Server error (${res.status})`);
	const body = await res.json();
	return parseProfileData(body.data ?? body);
}
function parseProfileData(data) {
	const batches = [];
	const courses = [];
	const subjects = [];
	const units = [];
	const videos = [];
	const notes = [];
	const batchesRaw = data.batches ?? {};
	for (const [, batchRaw] of Object.entries(batchesRaw)) {
		const courseRaw = batchRaw.course;
		const batch = {
			batch_id: String(batchRaw.batch_id ?? ""),
			name: String(batchRaw.name ?? ""),
			batch_image: batchRaw.batch_image,
			course_id: String(courseRaw?.course_id ?? ""),
			duration: batchRaw.duration,
			created_at: batchRaw.created_at,
			course: courseRaw ? parseCourse(courseRaw) : void 0
		};
		batches.push(batch);
		if (!courseRaw?.course_id) continue;
		const course = parseCourse(courseRaw);
		courses.push(course);
		const subjectsRaw = courseRaw.subjects ?? {};
		for (const [, subjectRaw] of Object.entries(subjectsRaw)) {
			if (!subjectRaw.subject_id) continue;
			const subjectUnits = [];
			const unitsRaw = subjectRaw.units ?? {};
			for (const [, unitRaw] of Object.entries(unitsRaw)) {
				if (!unitRaw.unit_id) continue;
				const unitVideos = (unitRaw.videos ?? []).map((v) => ({
					video_id: String(v.video_id ?? ""),
					title: String(v.title ?? ""),
					unit_id: String(unitRaw.unit_id),
					description: v.description,
					duration: Number(v.duration ?? 0),
					video_url: String(v.url ?? v.video_url ?? ""),
					thumbnail_url: v.thumbnail_url,
					status: v.status ?? "active"
				}));
				const unitNotes = (unitRaw.notes ?? []).map((n) => ({
					note_id: String(n.note_id ?? ""),
					unit_id: String(unitRaw.unit_id),
					title: String(n.title ?? ""),
					file_path: n.file_path,
					mime_type: n.mime_type,
					file_size: n.file_size,
					created_at: n.created_at
				}));
				const unit = {
					unit_id: String(unitRaw.unit_id),
					title: String(unitRaw.title ?? ""),
					unit_image: unitRaw.unit_image,
					subject_id: String(subjectRaw.subject_id),
					videos: unitVideos,
					notes: unitNotes
				};
				subjectUnits.push(unit);
				units.push(unit);
				videos.push(...unitVideos);
				notes.push(...unitNotes);
			}
			const subject = {
				subject_id: String(subjectRaw.subject_id),
				title: String(subjectRaw.title ?? ""),
				subject_image: subjectRaw.subject_image,
				course_id: String(courseRaw.course_id),
				units: subjectUnits
			};
			subjects.push(subject);
		}
	}
	return {
		user: data.user,
		batches,
		courses,
		subjects,
		units,
		videos,
		notes
	};
}
function parseCourse(courseRaw) {
	return {
		course_id: String(courseRaw.course_id ?? ""),
		title: String(courseRaw.title ?? ""),
		description: courseRaw.description,
		course_image: courseRaw.course_image
	};
}
var ArrowLeft = createLucideIcon("arrow-left", [["path", {
	d: "m12 19-7-7 7-7",
	key: "1l729n"
}], ["path", {
	d: "M19 12H5",
	key: "x3x0zl"
}]]);
//#endregion
//#region app/courses/[courseId]/page.tsx
function CoursePage() {
	const { courseId } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [openSubjects, setOpenSubjects] = useState(/* @__PURE__ */ new Set());
	const router = useRouter();
	useEffect(() => {
		const cached = localStorage.getItem("cl_data");
		if (cached) try {
			setData(JSON.parse(cached));
			setLoading(false);
			return;
		} catch (_) {}
		const token = localStorage.getItem("cl_token");
		if (!token) {
			router.push("/login");
			return;
		}
		profileApi(token).then((d) => {
			localStorage.setItem("cl_data", JSON.stringify(d));
			setData(d);
		}).catch(() => router.push("/login")).finally(() => setLoading(false));
	}, [router]);
	const course = data?.courses.find((c) => c.course_id === courseId);
	const subjects = data?.subjects.filter((s) => s.course_id === courseId) ?? [];
	if (loading) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-10 max-w-4xl mx-auto",
		children: [/* @__PURE__ */ jsx("div", {
			className: "shimmer rounded-2xl mb-6",
			style: {
				height: 120,
				background: "#1C202E"
			}
		}), [...Array(3)].map((_, i) => /* @__PURE__ */ jsx("div", {
			className: "shimmer rounded-xl mb-3",
			style: {
				height: 60,
				background: "#1C202E"
			}
		}, i))]
	}) });
	if (!course) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-10 text-center",
		children: [
			/* @__PURE__ */ jsx(BookOpen, {
				size: 48,
				color: "rgba(138,149,168,0.3)",
				className: "mx-auto mb-4"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-slate-soft",
				children: "Course not found"
			}),
			/* @__PURE__ */ jsxs(Link, {
				href: "/courses",
				className: "text-gold text-sm mt-3 inline-flex items-center gap-1",
				children: [/* @__PURE__ */ jsx(ArrowLeft, { size: 14 }), " Back to courses"]
			})
		]
	}) });
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-6 lg:p-10 max-w-4xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs(Link, {
				href: "/courses",
				className: "inline-flex items-center gap-2 text-slate-soft hover:text-gold text-sm mb-6 transition-colors fade-up fade-up-1",
				children: [/* @__PURE__ */ jsx(ArrowLeft, { size: 15 }), " All Courses"]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "rounded-2xl overflow-hidden mb-8 fade-up fade-up-2",
				style: {
					background: "#1C202E",
					border: "1px solid rgba(42,47,58,0.5)"
				},
				children: /* @__PURE__ */ jsx("center", { children: course.title })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "fade-up fade-up-3",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-display text-xl font-bold text-white mb-6",
					children: "Subjects"
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-3 sm:grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6",
					children: subjects.map((subject) => {
						data?.units.filter((u) => u.subject_id === subject.subject_id);
						return /* @__PURE__ */ jsx(Link, {
							href: `/courses/${courseId}/subject/${subject.subject_id}`,
							className: "group",
							children: /* @__PURE__ */ jsx("div", {
								className: "bg-neutral-primary-soft block max-w-sm p-6  rounded-base shadow-xs",
								children: /* @__PURE__ */ jsxs("center", { children: [/* @__PURE__ */ jsx("img", {
									className: "rounded-base h-[360]",
									src: subject.subject_image,
									alt: subject.title
								}), /* @__PURE__ */ jsx("h5", {
									className: "mt-6 mb-2 text-2xl font-semibold tracking-tight text-heading",
									children: subject.title
								})] })
							})
						}, subject.subject_id);
					})
				})]
			})
		]
	}) });
}
var Video = createLucideIcon("video", [["path", {
	d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
	key: "ftymec"
}], ["rect", {
	x: "2",
	y: "6",
	width: "14",
	height: "12",
	rx: "2",
	key: "158x01"
}]]);
var FileText = createLucideIcon("file-text", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M10 9H8",
		key: "b1mrlr"
	}],
	["path", {
		d: "M16 13H8",
		key: "t4e002"
	}],
	["path", {
		d: "M16 17H8",
		key: "z1uh3a"
	}]
]);
var Download = createLucideIcon("download", [
	["path", {
		d: "M12 15V3",
		key: "m9g1x1"
	}],
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}],
	["path", {
		d: "m7 10 5 5 5-5",
		key: "brsn70"
	}]
]);
var Play = createLucideIcon("play", [["path", {
	d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
	key: "10ikf1"
}]]);
var Clock = createLucideIcon("clock", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "M12 6v6l4 2",
	key: "mmk7yg"
}]]);
//#endregion
//#region app/courses/[courseId]/units/[unitId]/page.tsx
function UnitPage() {
	const { courseId, unitId } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeVideo, setActiveVideo] = useState(null);
	const router = useRouter();
	useEffect(() => {
		const cached = localStorage.getItem("cl_data");
		if (cached) try {
			const d = JSON.parse(cached);
			setData(d);
			const u = d.units.find((un) => un.unit_id === unitId);
			if (u?.videos?.[0]) setActiveVideo(u.videos[0]);
			setLoading(false);
			return;
		} catch (_) {}
		const token = localStorage.getItem("cl_token");
		if (!token) {
			router.push("/login");
			return;
		}
		profileApi(token).then((d) => {
			localStorage.setItem("cl_data", JSON.stringify(d));
			setData(d);
			const u = d.units.find((un) => un.unit_id === unitId);
			if (u?.videos?.[0]) setActiveVideo(u.videos[0]);
		}).catch(() => router.push("/login")).finally(() => setLoading(false));
	}, [router, unitId]);
	const unit = data?.units.find((u) => u.unit_id === unitId);
	const videos = unit?.videos ?? [];
	const notes = unit?.notes ?? [];
	const formatDuration = (sec) => {
		if (!sec) return "";
		return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
	};
	if (loading) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", {
		className: "p-6 lg:p-10",
		children: /* @__PURE__ */ jsx("div", {
			className: "shimmer rounded-2xl mb-6",
			style: {
				height: 400,
				background: "#1C202E"
			}
		})
	}) });
	if (!unit) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-10 text-center",
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-slate-soft",
			children: "Unit not found"
		}), /* @__PURE__ */ jsxs(Link, {
			href: `/courses/${courseId}`,
			className: "text-gold text-sm mt-3 inline-flex items-center gap-1",
			children: [/* @__PURE__ */ jsx(ArrowLeft, { size: 14 }), " Back to course"]
		})]
	}) });
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-6 lg:p-10 max-w-7xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs(Link, {
				href: `/courses/${courseId}`,
				className: "inline-flex items-center gap-2 text-slate-soft hover:text-gold text-sm mb-6 transition-colors fade-up fade-up-1",
				children: [/* @__PURE__ */ jsx(ArrowLeft, { size: 15 }), " Back to Course"]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-8 fade-up fade-up-2",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-2xl lg:text-3xl font-bold text-white mb-2",
					children: unit.title
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-4 text-xs text-slate-dim",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ jsx(Video, { size: 12 }),
							" ",
							videos.length,
							" videos"
						]
					}), /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ jsx(FileText, { size: 12 }),
							" ",
							notes.length,
							" notes"
						]
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 fade-up fade-up-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "rounded-2xl overflow-hidden mb-6",
						style: {
							background: "#1C202E",
							border: "1px solid rgba(42,47,58,0.5)"
						},
						children: activeVideo ? /* @__PURE__ */ jsxs(Fragment$1, { children: [activeVideo.video_url ? /* @__PURE__ */ jsxs("video", {
							className: "video-player w-full",
							controls: true,
							poster: activeVideo.thumbnail_url,
							children: [/* @__PURE__ */ jsx("source", {
								src: activeVideo.video_url,
								type: "video/mp4"
							}), "Your browser does not support video playback."]
						}, activeVideo.video_id) : /* @__PURE__ */ jsx("div", {
							className: "aspect-video flex items-center justify-center bg-black/50",
							children: /* @__PURE__ */ jsx("p", {
								className: "text-slate-soft text-sm",
								children: "Video URL not available"
							})
						}), /* @__PURE__ */ jsxs("div", {
							className: "p-5 border-t border-surface-3/40",
							children: [
								/* @__PURE__ */ jsx("h2", {
									className: "font-semibold text-white text-lg mb-1",
									children: activeVideo.title
								}),
								activeVideo.description && /* @__PURE__ */ jsx("p", {
									className: "text-slate-soft text-sm mt-2",
									children: activeVideo.description
								}),
								activeVideo.duration && /* @__PURE__ */ jsxs("p", {
									className: "text-xs text-slate-dim mt-3 flex items-center gap-1",
									children: [
										/* @__PURE__ */ jsx(Clock, { size: 11 }),
										" Duration: ",
										formatDuration(activeVideo.duration)
									]
								})
							]
						})] }) : /* @__PURE__ */ jsx("div", {
							className: "aspect-video flex items-center justify-center",
							children: /* @__PURE__ */ jsx("p", {
								className: "text-slate-soft",
								children: "No video selected"
							})
						})
					}), notes.length > 0 && /* @__PURE__ */ jsxs("div", {
						className: "rounded-2xl p-5",
						style: {
							background: "#1C202E",
							border: "1px solid rgba(42,47,58,0.5)"
						},
						children: [/* @__PURE__ */ jsxs("h3", {
							className: "font-semibold text-white text-sm mb-4 flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(FileText, {
								size: 16,
								color: "#C9A84C"
							}), " Notes & Materials"]
						}), /* @__PURE__ */ jsx("div", {
							className: "space-y-2",
							children: notes.map((note) => /* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between p-3 rounded-xl hover:bg-white/3 transition-colors",
								style: { border: "1px solid rgba(42,47,58,0.4)" },
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm text-white truncate",
										children: note.title
									}), note.file_size && /* @__PURE__ */ jsxs("p", {
										className: "text-xs text-slate-dim mt-0.5",
										children: [(note.file_size / 1024).toFixed(1), " KB"]
									})]
								}), note.file_path && /* @__PURE__ */ jsx("a", {
									href: note.file_path,
									download: true,
									className: "ml-3 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gold/10 transition-colors",
									children: /* @__PURE__ */ jsx(Download, {
										size: 14,
										color: "#C9A84C"
									})
								})]
							}, note.note_id))
						})]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "fade-up fade-up-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "rounded-2xl p-4",
						style: {
							background: "#1C202E",
							border: "1px solid rgba(42,47,58,0.5)"
						},
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-semibold text-white text-sm mb-4",
							children: "Video Playlist"
						}), videos.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "text-slate-dim text-sm",
							children: "No videos available"
						}) : /* @__PURE__ */ jsx("div", {
							className: "space-y-2 max-h-[600px] overflow-y-auto pr-1",
							children: videos.map((video, i) => {
								const isActive = activeVideo?.video_id === video.video_id;
								return /* @__PURE__ */ jsx("button", {
									onClick: () => setActiveVideo(video),
									className: "w-full text-left rounded-xl overflow-hidden transition-all",
									style: {
										background: isActive ? "rgba(201,168,76,0.1)" : "rgba(36,40,64,0.3)",
										border: `1px solid ${isActive ? "rgba(201,168,76,0.3)" : "transparent"}`
									},
									children: /* @__PURE__ */ jsxs("div", {
										className: "flex items-start gap-3 p-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-black/30",
											children: [video.thumbnail_url ? /* @__PURE__ */ jsx("img", {
												src: video.thumbnail_url,
												alt: "",
												className: "w-full h-full object-cover"
											}) : /* @__PURE__ */ jsx("div", {
												className: "w-full h-full flex items-center justify-center",
												children: /* @__PURE__ */ jsx(Play, {
													size: 12,
													color: "rgba(201,168,76,0.5)",
													fill: "rgba(201,168,76,0.5)"
												})
											}), /* @__PURE__ */ jsx("div", {
												className: "absolute bottom-0.5 right-0.5 px-1 text-[9px] font-bold bg-black/80 text-white rounded",
												children: formatDuration(video.duration) || "—"
											})]
										}), /* @__PURE__ */ jsx("div", {
											className: "flex-1 min-w-0",
											children: /* @__PURE__ */ jsxs("div", {
												className: "flex items-start gap-2 mb-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "text-[10px] font-bold px-1.5 py-0.5 rounded",
													style: {
														background: "rgba(201,168,76,0.15)",
														color: "#C9A84C"
													},
													children: i + 1
												}), /* @__PURE__ */ jsx("p", {
													className: `text-xs flex-1 line-clamp-2 ${isActive ? "text-gold font-medium" : "text-white/80"}`,
													children: video.title
												})]
											})
										})]
									})
								}, video.video_id);
							})
						})]
					})
				})]
			})
		]
	}) });
}
var Search = createLucideIcon("search", [["path", {
	d: "m21 21-4.34-4.34",
	key: "14j7rj"
}], ["circle", {
	cx: "11",
	cy: "11",
	r: "8",
	key: "4ej97u"
}]]);
var CirclePlay = createLucideIcon("circle-play", [["path", {
	d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",
	key: "kmsa83"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}]]);
//#endregion
//#region app/courses/page.tsx
function fmt(n) {
	if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
	return String(n);
}
function SkeletonCard() {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-3 animate-pulse",
		children: [/* @__PURE__ */ jsx("div", { className: "w-full aspect-video rounded-xl bg-[#272c3a]" }), /* @__PURE__ */ jsxs("div", {
			className: "flex gap-3",
			children: [/* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-full bg-[#272c3a] shrink-0" }), /* @__PURE__ */ jsxs("div", {
				className: "flex-1 space-y-2 pt-1",
				children: [/* @__PURE__ */ jsx("div", { className: "h-3.5 bg-[#272c3a] rounded w-4/5" }), /* @__PURE__ */ jsx("div", { className: "h-3 bg-[#1e2230] rounded w-2/5" })]
			})]
		})]
	});
}
var PALETTES = [
	["#c9a84c", "#1a1500"],
	["#5b8dee", "#0d1528"],
	["#e8705a", "#1f0f0d"],
	["#56c9a0", "#091a14"],
	["#b97fe8", "#150d1f"],
	["#e8c45a", "#1a1600"]
];
function palette(id) {
	return PALETTES[String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length];
}
function CoursesPage() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("all");
	const router = useRouter();
	useEffect(() => {
		const cached = localStorage.getItem("cl_data");
		if (cached) try {
			setData(JSON.parse(cached));
			setLoading(false);
			return;
		} catch (_) {}
		const token = localStorage.getItem("cl_token");
		if (!token) {
			router.push("/login");
			return;
		}
		profileApi(token).then((d) => {
			localStorage.setItem("cl_data", JSON.stringify(d));
			setData(d);
		}).catch(() => router.push("/login")).finally(() => setLoading(false));
	}, [router]);
	const filtered = (data?.courses ?? []).filter((c) => {
		const q = search.toLowerCase();
		return c.title.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
	});
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		style: {
			minHeight: "100vh",
			background: "#0f1117",
			fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
			color: "#e8eaf0"
		},
		children: [/* @__PURE__ */ jsxs("header", {
			style: {
				position: "sticky",
				top: 0,
				zIndex: 50,
				background: "rgba(15,17,23,0.92)",
				backdropFilter: "blur(12px)",
				borderBottom: "1px solid rgba(255,255,255,0.06)",
				padding: "14px 24px",
				display: "flex",
				alignItems: "center",
				gap: 16,
				flexWrap: "wrap"
			},
			children: [
				/* @__PURE__ */ jsx("h1", {
					style: {
						fontSize: 20,
						fontWeight: 700,
						letterSpacing: "-0.4px",
						color: "#fff",
						whiteSpace: "nowrap",
						marginRight: 8
					},
					children: "My Courses"
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						position: "relative",
						flex: "1 1 260px",
						maxWidth: 480
					},
					children: [/* @__PURE__ */ jsx(Search, {
						size: 15,
						style: {
							position: "absolute",
							left: 14,
							top: "50%",
							transform: "translateY(-50%)",
							color: "#6b7280"
						}
					}), /* @__PURE__ */ jsx("input", {
						type: "text",
						placeholder: "Search courses…",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						style: {
							width: "100%",
							background: "#1a1d27",
							border: "1px solid rgba(255,255,255,0.08)",
							borderRadius: 999,
							padding: "8px 16px 8px 38px",
							fontSize: 13.5,
							color: "#e8eaf0",
							outline: "none",
							transition: "border-color 0.2s"
						},
						onFocus: (e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)",
						onBlur: (e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						gap: 8,
						flexWrap: "wrap"
					},
					children: [
						"all",
						"recent",
						"videos",
						"notes"
					].map((f) => /* @__PURE__ */ jsx("button", {
						onClick: () => setFilter(f),
						style: {
							padding: "5px 14px",
							borderRadius: 999,
							fontSize: 12.5,
							fontWeight: 500,
							cursor: "pointer",
							border: filter === f ? "1px solid rgba(201,168,76,0.6)" : "1px solid rgba(255,255,255,0.1)",
							background: filter === f ? "rgba(201,168,76,0.12)" : "transparent",
							color: filter === f ? "#c9a84c" : "#9ca3af",
							transition: "all 0.15s"
						},
						children: f.charAt(0).toUpperCase() + f.slice(1)
					}, f))
				})
			]
		}), /* @__PURE__ */ jsx("main", {
			style: {
				padding: "28px 24px 60px",
				maxWidth: 1440,
				margin: "0 auto"
			},
			children: loading ? /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
					gap: 24
				},
				children: [...Array(8)].map((_, i) => /* @__PURE__ */ jsx(SkeletonCard, {}, i))
			}) : filtered.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { search }) : /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
					gap: "28px 20px"
				},
				children: filtered.map((course, i) => {
					const subjects = data?.subjects.filter((s) => s.course_id === course.course_id) ?? [];
					const units = data?.units.filter((u) => subjects.some((s) => s.subject_id === u.subject_id)) ?? [];
					const videos = data?.videos.filter((v) => units.some((u) => u.unit_id === v.unit_id)) ?? [];
					const notes = data?.notes.filter((n) => units.some((u) => u.unit_id === n.unit_id)) ?? [];
					const [accent, bg] = palette(course.course_id);
					return /* @__PURE__ */ jsx(CourseCard, {
						course,
						subjectCount: subjects.length,
						unitCount: units.length,
						videoCount: videos.length,
						noteCount: notes.length,
						accent,
						bg,
						delay: Math.min(i * 40, 240)
					}, course.course_id);
				})
			})
		})]
	}) });
}
function CourseCard({ course, subjectCount, unitCount, videoCount, noteCount, accent, bg, delay }) {
	const [hovered, setHovered] = useState(false);
	return /* @__PURE__ */ jsxs(Link, {
		href: `/courses/${course.course_id}`,
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 12,
			textDecoration: "none",
			color: "inherit",
			opacity: 0,
			animation: `fadeSlideUp 0.4s ease forwards`,
			animationDelay: `${delay}ms`
		},
		onMouseEnter: () => setHovered(true),
		onMouseLeave: () => setHovered(false),
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					position: "relative",
					width: "100%",
					aspectRatio: "16/9",
					borderRadius: 12,
					overflow: "hidden",
					background: `linear-gradient(135deg, ${bg} 0%, #1a1d27 100%)`,
					boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${accent}40` : "0 2px 12px rgba(0,0,0,0.3)",
					transition: "box-shadow 0.25s, transform 0.25s",
					transform: hovered ? "scale(1.02)" : "scale(1)"
				},
				children: [
					course.course_image ? /* @__PURE__ */ jsx("img", {
						src: course.course_image,
						alt: course.title,
						style: {
							width: "100%",
							height: "100%",
							objectFit: "cover",
							opacity: hovered ? .85 : .7,
							transition: "opacity 0.25s"
						}
					}) : /* @__PURE__ */ jsxs("div", {
						style: {
							width: "100%",
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							position: "relative",
							overflow: "hidden"
						},
						children: [
							/* @__PURE__ */ jsxs("svg", {
								style: {
									position: "absolute",
									inset: 0,
									width: "100%",
									height: "100%",
									opacity: .07
								},
								xmlns: "http://www.w3.org/2000/svg",
								children: [/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("pattern", {
									id: `grid-${course.course_id}`,
									width: "32",
									height: "32",
									patternUnits: "userSpaceOnUse",
									children: /* @__PURE__ */ jsx("path", {
										d: "M 32 0 L 0 0 0 32",
										fill: "none",
										stroke: accent,
										strokeWidth: "0.5"
									})
								}) }), /* @__PURE__ */ jsx("rect", {
									width: "100%",
									height: "100%",
									fill: `url(#grid-${course.course_id})`
								})]
							}),
							/* @__PURE__ */ jsx("div", { style: {
								position: "absolute",
								width: 120,
								height: 120,
								borderRadius: "50%",
								background: accent,
								opacity: .12,
								filter: "blur(40px)"
							} }),
							/* @__PURE__ */ jsx(BookOpen, {
								size: 36,
								color: accent,
								style: {
									opacity: .4,
									position: "relative"
								}
							})
						]
					}),
					/* @__PURE__ */ jsx("div", { style: {
						position: "absolute",
						inset: 0,
						background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)"
					} }),
					/* @__PURE__ */ jsxs("span", {
						style: {
							position: "absolute",
							top: 8,
							right: 8,
							background: "rgba(0,0,0,0.75)",
							border: `1px solid ${accent}50`,
							color: accent,
							fontSize: 10.5,
							fontWeight: 600,
							padding: "2px 8px",
							borderRadius: 6,
							backdropFilter: "blur(6px)",
							letterSpacing: "0.02em"
						},
						children: [subjectCount, " subjects"]
					}),
					/* @__PURE__ */ jsxs("span", {
						style: {
							position: "absolute",
							bottom: 8,
							left: 8,
							background: "rgba(0,0,0,0.8)",
							color: "#e8eaf0",
							fontSize: 11,
							fontWeight: 600,
							padding: "2px 7px",
							borderRadius: 5
						},
						children: [unitCount, " units"]
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							position: "absolute",
							inset: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							opacity: hovered ? 1 : 0,
							transition: "opacity 0.2s"
						},
						children: /* @__PURE__ */ jsx("div", {
							style: {
								width: 48,
								height: 48,
								borderRadius: "50%",
								background: accent,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								boxShadow: `0 0 24px ${accent}80`
							},
							children: /* @__PURE__ */ jsx(CirclePlay, {
								size: 26,
								color: "#000",
								strokeWidth: 1.5
							})
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 10,
					alignItems: "flex-start"
				},
				children: [/* @__PURE__ */ jsx("div", {
					style: {
						width: 36,
						height: 36,
						borderRadius: "50%",
						background: `linear-gradient(135deg, ${accent}60, ${bg})`,
						border: `1px solid ${accent}40`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0
					},
					children: /* @__PURE__ */ jsx(BookOpen, {
						size: 15,
						color: accent
					})
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [
						/* @__PURE__ */ jsx("p", {
							style: {
								fontSize: 13.5,
								fontWeight: 600,
								color: hovered ? "#fff" : "#e2e4ed",
								lineHeight: 1.4,
								marginBottom: 4,
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
								transition: "color 0.15s"
							},
							children: course.title
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 10,
								flexWrap: "wrap"
							},
							children: [
								/* @__PURE__ */ jsx(MetaBadge, {
									icon: /* @__PURE__ */ jsx(Video, { size: 11 }),
									label: `${fmt(videoCount)} videos`
								}),
								/* @__PURE__ */ jsx("span", { style: {
									width: 2,
									height: 2,
									borderRadius: "50%",
									background: "#4b5563"
								} }),
								/* @__PURE__ */ jsx(MetaBadge, {
									icon: /* @__PURE__ */ jsx(FileText, { size: 11 }),
									label: `${fmt(noteCount)} notes`
								})
							]
						}),
						course.description && /* @__PURE__ */ jsx("p", {
							style: {
								fontSize: 11.5,
								color: "#6b7280",
								marginTop: 5,
								lineHeight: 1.45,
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
								overflow: "hidden"
							},
							children: course.description
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					height: 2,
					borderRadius: 2,
					background: "#1e2230",
					overflow: "hidden",
					marginTop: -4
				},
				children: /* @__PURE__ */ jsx("div", { style: {
					height: "100%",
					width: `${Math.min(30 + videoCount % 70, 90)}%`,
					background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
					borderRadius: 2
				} })
			})
		]
	});
}
function MetaBadge({ icon, label }) {
	return /* @__PURE__ */ jsxs("span", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 4,
			fontSize: 11,
			color: "#9ca3af"
		},
		children: [icon, label]
	});
}
function EmptyState({ search }) {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			textAlign: "center",
			padding: "80px 24px",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 16
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				width: 72,
				height: 72,
				borderRadius: "50%",
				background: "#1a1d27",
				border: "1px solid rgba(255,255,255,0.07)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			},
			children: /* @__PURE__ */ jsx(BookOpen, {
				size: 28,
				color: "rgba(138,149,168,0.4)"
			})
		}), /* @__PURE__ */ jsx("p", {
			style: {
				fontSize: 15,
				color: "#6b7280",
				maxWidth: 280,
				lineHeight: 1.5
			},
			children: search ? `No courses match "${search}"` : "No courses available"
		})]
	});
}
var GraduationCap = createLucideIcon("graduation-cap", [
	["path", {
		d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
		key: "j76jl0"
	}],
	["path", {
		d: "M22 10v6",
		key: "1lu8f3"
	}],
	["path", {
		d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
		key: "1r8lef"
	}]
]);
var TrendingUp = createLucideIcon("trending-up", [["path", {
	d: "M16 7h6v6",
	key: "box55l"
}], ["path", {
	d: "m22 7-8.5 8.5-5-5L2 17",
	key: "1t1m79"
}]]);
var RefreshCw = createLucideIcon("refresh-cw", [
	["path", {
		d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
		key: "v9h5vc"
	}],
	["path", {
		d: "M21 3v5h-5",
		key: "1q7to0"
	}],
	["path", {
		d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
		key: "3uifl3"
	}],
	["path", {
		d: "M8 16H3v5",
		key: "1cv678"
	}]
]);
//#endregion
//#region app/dashboard/page.tsx
function DashboardPage() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const router = useRouter();
	useEffect(() => {
		const cached = localStorage.getItem("cl_data");
		if (cached) try {
			setData(JSON.parse(cached));
			setLoading(false);
			return;
		} catch (_) {}
		fetchData();
	}, []);
	const fetchData = async () => {
		setLoading(true);
		setError("");
		const token = localStorage.getItem("cl_token");
		if (!token) {
			router.push("/login");
			return;
		}
		try {
			const d = await profileApi(token);
			localStorage.setItem("cl_data", JSON.stringify(d));
			setData(d);
		} catch (e) {
			if (e instanceof Error && e.message.includes("Unauthorized")) {
				localStorage.clear();
				router.push("/login");
			} else setError(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};
	const stats = data ? [
		{
			label: "Batches",
			value: data.batches.length,
			icon: GraduationCap,
			color: "#C9A84C"
		},
		{
			label: "Courses",
			value: data.courses.length,
			icon: BookOpen,
			color: "#63B3ED"
		},
		{
			label: "Subjects",
			value: data.subjects.length,
			icon: TrendingUp,
			color: "#68D391"
		},
		{
			label: "Videos",
			value: data.videos.length,
			icon: Video,
			color: "#F6AD55"
		},
		{
			label: "Notes",
			value: data.notes.length,
			icon: FileText,
			color: "#FC8181"
		},
		{
			label: "Units",
			value: data.units.length,
			icon: Clock,
			color: "#B794F4"
		}
	] : [];
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-6 lg:p-10 max-w-7xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "mb-10 fade-up fade-up-1",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
						className: "font-display text-3xl lg:text-4xl font-bold text-white",
						children: data?.user?.username ? `Hello, ${data.user.username}` : "Dashboard"
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-slate-soft mt-2 text-sm",
						children: [
							"You have ",
							data?.batches.length ?? 0,
							" active ",
							data?.batches.length === 1 ? "batch" : "batches",
							" enrolled"
						]
					})] }), /* @__PURE__ */ jsxs("button", {
						onClick: fetchData,
						className: "flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-soft hover:text-gold transition-colors",
						style: { border: "1px solid rgba(42,47,58,0.6)" },
						children: [/* @__PURE__ */ jsx(RefreshCw, {
							size: 15,
							className: loading ? "animate-spin" : ""
						}), "Refresh"]
					})]
				})
			}),
			error && /* @__PURE__ */ jsx("div", {
				className: "mb-6 px-4 py-3 rounded-xl text-sm",
				style: {
					background: "rgba(220,53,69,0.1)",
					border: "1px solid rgba(220,53,69,0.2)",
					color: "#FC8181"
				},
				children: error
			}),
			loading && /* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-10",
				children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsx("div", {
					className: "rounded-2xl p-5 shimmer",
					style: {
						background: "#1C202E",
						height: 100
					}
				}, i))
			}),
			!loading && data && /* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-10",
				children: stats.map(({ label, value, icon: Icon, color }, i) => /* @__PURE__ */ jsxs("div", {
					className: `rounded-2xl p-5 card-hover fade-up fade-up-${Math.min(i + 2, 5)}`,
					style: {
						background: "#1C202E",
						border: "1px solid rgba(42,47,58,0.5)"
					},
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between mb-4",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-9 h-9 rounded-xl flex items-center justify-center",
							style: { background: `${color}15` },
							children: /* @__PURE__ */ jsx(Icon, {
								size: 18,
								color
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs badge badge-gold",
							children: label
						})]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-3xl font-bold text-white font-display",
						children: value
					})]
				}, label))
			}),
			!loading && data && data.batches.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "fade-up fade-up-4",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-between mb-5",
					children: /* @__PURE__ */ jsx("h2", {
						className: "font-display text-xl font-bold text-white",
						children: "Your Batches"
					})
				}), /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
					children: data.courses.map((course) => /* @__PURE__ */ jsxs(Link, {
						href: `/courses/${course.course_id}`,
						className: "rounded-2xl overflow-hidden card-hover block",
						style: {
							background: "#1C202E",
							border: "1px solid rgba(42,47,58,0.5)"
						},
						children: [/* @__PURE__ */ jsxs("div", {
							className: "h-36 relative overflow-hidden",
							style: { background: "linear-gradient(135deg, #1a1500, #242840)" },
							children: [course.course_image ? /* @__PURE__ */ jsx("img", {
								src: course.course_image,
								alt: course.title,
								className: " h-[360] object-cover opacity-80"
							}) : /* @__PURE__ */ jsx("div", {
								className: "w-full h-full flex items-center justify-center",
								children: /* @__PURE__ */ jsx(GraduationCap, {
									size: 36,
									color: "rgba(201,168,76,0.3)"
								})
							}), /* @__PURE__ */ jsx("div", {
								className: "absolute inset-0",
								style: { background: "linear-gradient(to top, rgba(28,32,46,1) 0%, transparent 60%)" }
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "p-4",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "font-semibold text-white text-sm mb-1 truncate",
								children: course.title
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: ["Explore ", /* @__PURE__ */ jsx(ChevronRight, { size: 11 })]
							})]
						})]
					}, course.course_id))
				})]
			}),
			!loading && data && data.batches.length === 0 && /* @__PURE__ */ jsxs("div", {
				className: "text-center py-20",
				children: [/* @__PURE__ */ jsx(GraduationCap, {
					size: 48,
					color: "rgba(138,149,168,0.3)",
					className: "mx-auto mb-4"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-slate-soft",
					children: "No batches enrolled yet"
				})]
			})
		]
	}) });
}
var Eye = createLucideIcon("eye", [["path", {
	d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
	key: "1nclc0"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]);
var EyeOff = createLucideIcon("eye-off", [
	["path", {
		d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
		key: "ct8e1f"
	}],
	["path", {
		d: "M14.084 14.158a3 3 0 0 1-4.242-4.242",
		key: "151rxh"
	}],
	["path", {
		d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
		key: "13bj9a"
	}],
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}]
]);
var Star = createLucideIcon("star", [["path", {
	d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
	key: "r04s7s"
}]]);
//#endregion
//#region app/login/page.tsx
function LoginPage() {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { setAuth } = useAuth();
	const router = useRouter();
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const { token, user } = await loginApi(identifier, password);
			setAuth(token, user);
			try {
				const data = await profileApi(token);
				localStorage.setItem("cl_data", JSON.stringify(data));
			} catch (_) {}
			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen flex items-center justify-center relative overflow-hidden",
		children: [
			/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-radial-gold" }),
			/* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid-bg opacity-60" }),
			/* @__PURE__ */ jsx("div", {
				className: "absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-10",
				style: {
					background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)",
					filter: "blur(60px)"
				}
			}),
			/* @__PURE__ */ jsx("div", {
				className: "absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full opacity-8",
				style: {
					background: "radial-gradient(circle, #4A6B8A 0%, transparent 70%)",
					filter: "blur(80px)"
				}
			}),
			[...Array(6)].map((_, i) => /* @__PURE__ */ jsx("div", {
				className: "absolute opacity-20",
				style: {
					top: `${15 + i * 13}%`,
					left: `${8 + i * 15}%`,
					animation: `fadeIn ${1 + i * .3}s ease forwards`
				},
				children: /* @__PURE__ */ jsx(Star, {
					size: i % 2 === 0 ? 8 : 5,
					color: "#C9A84C",
					fill: "#C9A84C"
				})
			}, i)),
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-10 w-full max-w-md mx-4 fade-up",
				style: {
					background: "linear-gradient(145deg, rgba(26,29,35,0.95) 0%, rgba(19,22,32,0.98) 100%)",
					border: "1px solid rgba(201,168,76,0.15)",
					borderRadius: "20px",
					padding: "48px 40px",
					backdropFilter: "blur(20px)"
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "text-center mb-10",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "inline-flex items-center justify-center w-16 h-16 mb-5 crescent-ring",
								style: { background: "rgba(201,168,76,0.08)" },
								children: /* @__PURE__ */ jsx(Moon, {
									size: 26,
									color: "#C9A84C"
								})
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "font-display text-3xl font-bold text-white mb-1 tracking-tight",
								children: "Crescent Learning"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-slate-soft text-sm",
								children: "Sign in to continue your journey"
							})
						]
					}),
					/* @__PURE__ */ jsxs("form", {
						onSubmit: handleSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-xs font-medium text-slate-soft mb-2 uppercase tracking-wider",
								children: "Email or Username"
							}), /* @__PURE__ */ jsx("input", {
								type: "text",
								className: "input-field",
								placeholder: "you@example.com",
								value: identifier,
								onChange: (e) => setIdentifier(e.target.value),
								required: true,
								autoComplete: "username"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-xs font-medium text-slate-soft mb-2 uppercase tracking-wider",
								children: "Password"
							}), /* @__PURE__ */ jsxs("div", {
								className: "relative",
								children: [/* @__PURE__ */ jsx("input", {
									type: showPass ? "text" : "password",
									className: "input-field pr-12",
									placeholder: "••••••••",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									required: true,
									autoComplete: "current-password"
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setShowPass(!showPass),
									className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-soft hover:text-gold transition-colors",
									children: showPass ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
								})]
							})] }),
							error && /* @__PURE__ */ jsx("div", {
								className: "text-sm px-4 py-3 rounded-lg",
								style: {
									background: "rgba(220,53,69,0.1)",
									border: "1px solid rgba(220,53,69,0.2)",
									color: "#FC8181"
								},
								children: error
							}),
							/* @__PURE__ */ jsx("div", {
								className: "pt-2",
								children: /* @__PURE__ */ jsx("button", {
									type: "submit",
									className: "btn-gold w-full flex items-center justify-center gap-2 h-12",
									disabled: loading,
									children: loading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-ink/50 border-t-ink rounded-full animate-spin" }), "Signing in…"] }) : "Sign In"
								})
							})
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-center text-xs text-slate-dim mt-8",
						children: "© 2025 Crescent Learning. All rights reserved."
					})
				]
			})
		]
	});
}
//#endregion
//#region app/page.tsx
function Home() {
	const router = useRouter();
	useEffect(() => {
		if (localStorage.getItem("cl_token")) router.replace("/dashboard");
		else router.replace("/login");
	}, [router]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex items-center justify-center min-h-screen",
		children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" })
	});
}
var Mail = createLucideIcon("mail", [["path", {
	d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",
	key: "132q7q"
}], ["rect", {
	x: "2",
	y: "4",
	width: "20",
	height: "16",
	rx: "2",
	key: "izxlao"
}]]);
var Phone = createLucideIcon("phone", [["path", {
	d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
	key: "9njp5v"
}]]);
var Calendar = createLucideIcon("calendar", [
	["path", {
		d: "M8 2v4",
		key: "1cmpym"
	}],
	["path", {
		d: "M16 2v4",
		key: "4m81vk"
	}],
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "4",
		rx: "2",
		key: "1hopcy"
	}],
	["path", {
		d: "M3 10h18",
		key: "8toen8"
	}]
]);
var Shield = createLucideIcon("shield", [["path", {
	d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
	key: "oel41y"
}]]);
//#endregion
//#region app/profile/page.tsx
function ProfilePage() {
	const { user } = useAuth();
	const [data, setData] = useState(null);
	const router = useRouter();
	useEffect(() => {
		if (!user) {
			router.push("/login");
			return;
		}
		const cached = localStorage.getItem("cl_data");
		if (cached) try {
			setData(JSON.parse(cached));
		} catch (_) {}
	}, [user, router]);
	if (!user) return null;
	const stats = data ? [
		{
			label: "Batches Enrolled",
			value: data.batches.length,
			icon: BookOpen,
			color: "#C9A84C"
		},
		{
			label: "Total Videos",
			value: data.videos.length,
			icon: Video,
			color: "#63B3ED"
		},
		{
			label: "Study Materials",
			value: data.notes.length,
			icon: FileText,
			color: "#68D391"
		}
	] : [];
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "p-6 lg:p-10 max-w-4xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-10 fade-up fade-up-1",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl font-bold text-white mb-1",
					children: "My Profile"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-slate-soft text-sm",
					children: "View and manage your account details"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "rounded-2xl p-8 mb-8 fade-up fade-up-2",
				style: {
					background: "#1C202E",
					border: "1px solid rgba(42,47,58,0.5)"
				},
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-start gap-6",
					children: [/* @__PURE__ */ jsx("div", {
						className: "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0",
						style: {
							background: "linear-gradient(135deg, #C9A84C, #7A6230)",
							color: "#0D0F12"
						},
						children: (user.username || user.email || "U").charAt(0).toUpperCase()
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "font-display text-2xl font-bold text-white mb-1",
							children: user.username || "Student"
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-2 mt-4",
							children: [
								user.email && /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3 text-sm text-slate-soft",
									children: [/* @__PURE__ */ jsx(Mail, {
										size: 16,
										color: "#C9A84C"
									}), /* @__PURE__ */ jsx("span", { children: user.email })]
								}),
								user.phone && /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3 text-sm text-slate-soft",
									children: [/* @__PURE__ */ jsx(Phone, {
										size: 16,
										color: "#C9A84C"
									}), /* @__PURE__ */ jsx("span", { children: user.phone })]
								}),
								user.role && /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3 text-sm text-slate-soft",
									children: [/* @__PURE__ */ jsx(Shield, {
										size: 16,
										color: "#C9A84C"
									}), /* @__PURE__ */ jsx("span", {
										className: "capitalize",
										children: user.role
									})]
								}),
								user.created_at && /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3 text-sm text-slate-soft",
									children: [/* @__PURE__ */ jsx(Calendar, {
										size: 16,
										color: "#C9A84C"
									}), /* @__PURE__ */ jsxs("span", { children: ["Joined ", new Date(user.created_at).toLocaleDateString()] })]
								})
							]
						})]
					})]
				})
			}),
			data && /* @__PURE__ */ jsx("div", {
				className: "grid md:grid-cols-3 gap-5 fade-up fade-up-3",
				children: stats.map(({ label, value, icon: Icon, color }) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-2xl p-5",
					style: {
						background: "#1C202E",
						border: "1px solid rgba(42,47,58,0.5)"
					},
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "flex items-center justify-between mb-4",
							children: /* @__PURE__ */ jsx("div", {
								className: "w-10 h-10 rounded-xl flex items-center justify-center",
								style: { background: `${color}15` },
								children: /* @__PURE__ */ jsx(Icon, {
									size: 20,
									color
								})
							})
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-3xl font-bold text-white font-display mb-1",
							children: value
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-slate-dim",
							children: label
						})
					]
				}, label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "rounded-2xl p-6 mt-8 fade-up fade-up-4",
				style: {
					background: "#1C202E",
					border: "1px solid rgba(42,47,58,0.5)"
				},
				children: [/* @__PURE__ */ jsx("h3", {
					className: "font-semibold text-white text-sm mb-4",
					children: "Account Details"
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between py-2 border-b border-surface-3/30",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-slate-dim",
								children: "User ID"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-white font-mono text-xs",
								children: user.id
							})]
						}),
						user.email && /* @__PURE__ */ jsxs("div", {
							className: "flex justify-between py-2 border-b border-surface-3/30",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-slate-dim",
								children: "Email"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-white",
								children: user.email
							})]
						}),
						user.username && /* @__PURE__ */ jsxs("div", {
							className: "flex justify-between py-2 border-b border-surface-3/30",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-slate-dim",
								children: "Username"
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-white",
								children: ["@", user.username]
							})]
						}),
						user.role && /* @__PURE__ */ jsxs("div", {
							className: "flex justify-between py-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-slate-dim",
								children: "Role"
							}), /* @__PURE__ */ jsx("span", {
								className: "badge badge-gold",
								children: user.role
							})]
						})
					]
				})]
			})
		]
	}) });
}
//#endregion
//#region node_modules/vinext/dist/shims/error-boundary.js
/**
* Generic ErrorBoundary used to wrap route segments with error.tsx.
* This must be a client component since error boundaries use
* componentDidCatch / getDerivedStateFromError.
*/
var ErrorBoundaryInner = class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			previousPathname: props.pathname
		};
	}
	static getDerivedStateFromProps(props, state) {
		if (props.pathname !== state.previousPathname && state.error) return {
			error: null,
			previousPathname: props.pathname
		};
		return {
			error: state.error,
			previousPathname: props.pathname
		};
	}
	static getDerivedStateFromError(error) {
		if (error && typeof error === "object" && "digest" in error) {
			const digest = String(error.digest);
			if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;") || digest.startsWith("NEXT_REDIRECT;")) throw error;
		}
		return { error };
	}
	reset = () => {
		this.setState({ error: null });
	};
	render() {
		if (this.state.error) {
			const FallbackComponent = this.props.fallback;
			return /* @__PURE__ */ jsx(FallbackComponent, {
				error: this.state.error,
				reset: this.reset
			});
		}
		return this.props.children;
	}
};
function ErrorBoundary({ fallback, children }) {
	return /* @__PURE__ */ jsx(ErrorBoundaryInner, {
		pathname: usePathname$1(),
		fallback,
		children
	});
}
/**
* Inner class component that catches notFound() errors and renders the
* not-found.tsx fallback. Resets when the pathname changes (client navigation)
* so a previous notFound() doesn't permanently stick.
*
* The ErrorBoundary above re-throws notFound errors so they propagate up to this
* boundary. This must be placed above the ErrorBoundary in the component tree.
*/
var NotFoundBoundaryInner = class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			notFound: false,
			previousPathname: props.pathname
		};
	}
	static getDerivedStateFromProps(props, state) {
		if (props.pathname !== state.previousPathname && state.notFound) return {
			notFound: false,
			previousPathname: props.pathname
		};
		return {
			notFound: state.notFound,
			previousPathname: props.pathname
		};
	}
	static getDerivedStateFromError(error) {
		if (error && typeof error === "object" && "digest" in error) {
			const digest = String(error.digest);
			if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404")) return { notFound: true };
		}
		throw error;
	}
	render() {
		if (this.state.notFound) return this.props.fallback;
		return this.props.children;
	}
};
/**
* Wrapper that reads the current pathname and passes it to the inner class
* component. This enables automatic reset on client-side navigation.
*/
function NotFoundBoundary({ fallback, children }) {
	return /* @__PURE__ */ jsx(NotFoundBoundaryInner, {
		pathname: usePathname$1(),
		fallback,
		children
	});
}
//#endregion
//#region node_modules/vinext/dist/shims/layout-segment-context.js
/**
* Layout segment context provider.
*
* Must be "use client" so that Vite's RSC bundler renders this component in
* the SSR/browser environment where React.createContext is available. The RSC
* entry imports and renders LayoutSegmentProvider directly, but because of the
* "use client" boundary the actual execution happens on the SSR/client side
* where the context can be created and consumed by useSelectedLayoutSegment(s).
*
* Without "use client", this runs in the RSC environment where
* React.createContext is undefined, getLayoutSegmentContext() returns null,
* the provider becomes a no-op, and useSelectedLayoutSegments always returns [].
*
* The context is shared with navigation.ts via getLayoutSegmentContext()
* to avoid creating separate contexts in different modules.
*/
/**
* Wraps children with the layout segment context.
*
* Each layout in the App Router tree wraps its children with this provider,
* passing a map of parallel route key to segment path. The "children" key is
* always present (the default parallel route). Named parallel slots at this
* layout level add their own keys.
*
* Components inside the provider call useSelectedLayoutSegments(parallelRoutesKey)
* to read the segments for a specific parallel route.
*/
function LayoutSegmentProvider({ segmentMap, children }) {
	const ctx = getLayoutSegmentContext();
	if (!ctx) return children;
	return createElement(ctx.Provider, { value: segmentMap }, children);
}
//#endregion
//#region \0virtual:vite-rsc/client-references/group/facade:\0virtual:vinext-rsc-entry
var export_fca983fe7b7c = { AuthProvider };
var export_061b9fa1e40a = { default: CoursePage };
var export_861a7b013abd = { default: UnitPage };
var export_c237b91ab318 = { default: CoursesPage };
var export_e16c1c1133d5 = { default: DashboardPage };
var export_b49ea5cf04c0 = { default: LoginPage };
var export_6efdf509a785 = { default: Home };
var export_b5f72a92d407 = { default: ProfilePage };
var export_593f344dc510 = {
	ErrorBoundary,
	NotFoundBoundary
};
var export_15c18cfaeeff = { LayoutSegmentProvider };
var export_8c0f216c4604 = {
	Children,
	ParallelSlot,
	Slot
};
//#endregion
export { export_061b9fa1e40a, export_15c18cfaeeff, export_593f344dc510, export_6efdf509a785, export_861a7b013abd, export_8c0f216c4604, export_b49ea5cf04c0, export_b5f72a92d407, export_c237b91ab318, export_e16c1c1133d5, export_fca983fe7b7c };
