globalThis.__VINEXT_LAZY_CHUNKS__ = ["assets/query-BbOc3VB2.js","assets/router-C5uqvVNo.js","assets/worker-entry-DZ0zgh8U.js"];
import { a as renderToReadableStream$2, c as require_react_react_server, d as __toESM, l as __commonJSMin, n as decodeReply, o as loadServerAction, r as registerClientReference, s as setRequireModule, t as createTemporaryReferenceSet, u as __exportAll } from "./assets/encryption-runtime-DNIzdte6.js";
import { AsyncLocalStorage } from "node:async_hooks";
import assetsManifest from "./__vite_rsc_assets_manifest.js";
import "node:fs";
import "node:path";
//#region node_modules/vinext/dist/server/image-optimization.js
/**
* Next.js default device sizes and image sizes.
* These are the allowed widths for image optimization when no custom
* config is provided. Matches Next.js defaults exactly.
*/
var DEFAULT_DEVICE_SIZES = [
	640,
	750,
	828,
	1080,
	1200,
	1920,
	2048,
	3840
];
var DEFAULT_IMAGE_SIZES = [
	16,
	32,
	48,
	64,
	96,
	128,
	256,
	384
];
/**
* Absolute maximum image width. Even if custom deviceSizes/imageSizes are
* configured, widths above this are always rejected. This prevents resource
* exhaustion from absurdly large resize requests.
*/
var ABSOLUTE_MAX_WIDTH = 3840;
/**
* Parse and validate image optimization query parameters.
* Returns null if the request is malformed.
*
* When `allowedWidths` is provided, the width must be 0 (no resize) or
* exactly match one of the allowed values. This matches Next.js behavior
* where only configured deviceSizes and imageSizes are accepted.
*
* When `allowedWidths` is not provided, any width from 0 to ABSOLUTE_MAX_WIDTH
* is accepted (backwards-compatible fallback).
*/
function parseImageParams(url, allowedWidths) {
	const imageUrl = url.searchParams.get("url");
	if (!imageUrl) return null;
	const w = parseInt(url.searchParams.get("w") || "0", 10);
	const q = parseInt(url.searchParams.get("q") || "75", 10);
	if (Number.isNaN(w) || w < 0) return null;
	if (w > ABSOLUTE_MAX_WIDTH) return null;
	if (allowedWidths && w !== 0 && !allowedWidths.includes(w)) return null;
	if (Number.isNaN(q) || q < 1 || q > 100) return null;
	const normalizedUrl = imageUrl.replaceAll("\\", "/");
	if (!normalizedUrl.startsWith("/") || normalizedUrl.startsWith("//")) return null;
	try {
		const base = "https://localhost";
		if (new URL(normalizedUrl, base).origin !== base) return null;
	} catch {
		return null;
	}
	return {
		imageUrl: normalizedUrl,
		width: w,
		quality: q
	};
}
/**
* Negotiate the best output format based on the Accept header.
* Returns an IANA media type.
*/
function negotiateImageFormat(acceptHeader) {
	if (!acceptHeader) return "image/jpeg";
	if (acceptHeader.includes("image/avif")) return "image/avif";
	if (acceptHeader.includes("image/webp")) return "image/webp";
	return "image/jpeg";
}
/**
* Standard Cache-Control header for optimized images.
* Optimized images are immutable because the URL encodes the transform params.
*/
var IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";
/**
* Allowlist of Content-Types that are safe to serve from the image endpoint.
* SVG is intentionally excluded — it can contain embedded JavaScript and is
* essentially an XML document, not a safe raster image format.
*/
var SAFE_IMAGE_CONTENT_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/x-icon",
	"image/vnd.microsoft.icon",
	"image/bmp",
	"image/tiff"
]);
/**
* Check if a Content-Type header value is a safe image type.
* Returns false for SVG (unless dangerouslyAllowSVG is true), HTML, or any non-image type.
*/
function isSafeImageContentType(contentType, dangerouslyAllowSVG = false) {
	if (!contentType) return false;
	const mediaType = contentType.split(";")[0].trim().toLowerCase();
	if (SAFE_IMAGE_CONTENT_TYPES.has(mediaType)) return true;
	if (dangerouslyAllowSVG && mediaType === "image/svg+xml") return true;
	return false;
}
/**
* Apply security headers to an image optimization response.
* These headers are set on every response from the image endpoint,
* regardless of whether the image was transformed or served as-is.
* When an ImageConfig is provided, uses its values for CSP and Content-Disposition.
*/
function setImageSecurityHeaders(headers, config) {
	headers.set("Content-Security-Policy", config?.contentSecurityPolicy ?? "script-src 'none'; frame-src 'none'; sandbox;");
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Content-Disposition", config?.contentDispositionType === "attachment" ? "attachment" : "inline");
}
function createPassthroughImageResponse(source, config) {
	const headers = new Headers(source.headers);
	headers.set("Cache-Control", IMAGE_CACHE_CONTROL);
	headers.set("Vary", "Accept");
	setImageSecurityHeaders(headers, config);
	return new Response(source.body, {
		status: 200,
		headers
	});
}
/**
* Handle image optimization requests.
*
* Parses and validates the request, fetches the source image via the provided
* handlers, optionally transforms it, and returns the response with appropriate
* cache headers.
*/
async function handleImageOptimization(request, handlers, allowedWidths, imageConfig) {
	const params = parseImageParams(new URL(request.url), allowedWidths);
	if (!params) return new Response("Bad Request", { status: 400 });
	const { imageUrl, width, quality } = params;
	const source = await handlers.fetchAsset(imageUrl, request);
	if (!source.ok || !source.body) return new Response("Image not found", { status: 404 });
	const format = negotiateImageFormat(request.headers.get("Accept"));
	const sourceContentType = source.headers.get("Content-Type");
	if (!isSafeImageContentType(sourceContentType, imageConfig?.dangerouslyAllowSVG)) return new Response("The requested resource is not an allowed image type", { status: 400 });
	if (sourceContentType?.split(";")[0].trim().toLowerCase() === "image/svg+xml") return createPassthroughImageResponse(source, imageConfig);
	if (handlers.transformImage) try {
		const transformed = await handlers.transformImage(source.body, {
			width,
			format,
			quality
		});
		const headers = new Headers(transformed.headers);
		headers.set("Cache-Control", IMAGE_CACHE_CONTROL);
		headers.set("Vary", "Accept");
		setImageSecurityHeaders(headers, imageConfig);
		if (!isSafeImageContentType(headers.get("Content-Type"), imageConfig?.dangerouslyAllowSVG)) headers.set("Content-Type", format);
		return new Response(transformed.body, {
			status: 200,
			headers
		});
	} catch (e) {
		console.error("[vinext] Image optimization error:", e);
	}
	try {
		return createPassthroughImageResponse(source, imageConfig);
	} catch (e) {
		console.error("[vinext] Image fallback error, refetching source image:", e);
		const refetchedSource = await handlers.fetchAsset(imageUrl, request);
		if (!refetchedSource.ok || !refetchedSource.body) return new Response("Image not found", { status: 404 });
		if (!isSafeImageContentType(refetchedSource.headers.get("Content-Type"), imageConfig?.dangerouslyAllowSVG)) return new Response("The requested resource is not an allowed image type", { status: 400 });
		return createPassthroughImageResponse(refetchedSource, imageConfig);
	}
}
//#endregion
//#region node_modules/vinext/dist/shims/unified-request-context.js
/**
* Unified per-request context backed by a single AsyncLocalStorage.
*
* Consolidates the 5–6 nested ALS scopes that previously wrapped every
* App Router request (headers, navigation, cache-state, private-cache,
* fetch-cache, execution-context) into one flat store.
*
* Each shim module checks `isInsideUnifiedScope()` and reads its sub-fields
* from the unified store, falling back to its own standalone ALS when
* outside (SSR environment, Pages Router, tests).
*/
var _ALS_KEY$5 = Symbol.for("vinext.unifiedRequestContext.als");
var _REQUEST_CONTEXT_ALS_KEY = Symbol.for("vinext.requestContext.als");
var _g$7 = globalThis;
var _als$4 = _g$7[_ALS_KEY$5] ??= new AsyncLocalStorage();
function _getInheritedExecutionContext() {
	const unifiedStore = _als$4.getStore();
	if (unifiedStore) return unifiedStore.executionContext;
	return _g$7[_REQUEST_CONTEXT_ALS_KEY]?.getStore() ?? null;
}
/**
* Create a fresh `UnifiedRequestContext` with defaults for all fields.
* Pass partial overrides for the fields you need to pre-populate.
*/
function createRequestContext(opts) {
	return {
		headersContext: null,
		dynamicUsageDetected: false,
		pendingSetCookies: [],
		draftModeCookieHeader: null,
		phase: "render",
		i18nContext: null,
		serverContext: null,
		serverInsertedHTMLCallbacks: [],
		requestScopedCacheLife: null,
		_privateCache: null,
		currentRequestTags: [],
		executionContext: _getInheritedExecutionContext(),
		requestCache: /* @__PURE__ */ new WeakMap(),
		ssrContext: null,
		ssrHeadChildren: [],
		...opts
	};
}
function runWithRequestContext(ctx, fn) {
	return _als$4.run(ctx, fn);
}
function runWithUnifiedStateMutation(mutate, fn) {
	const parentCtx = _als$4.getStore();
	if (!parentCtx) return fn();
	const childCtx = { ...parentCtx };
	mutate(childCtx);
	return _als$4.run(childCtx, fn);
}
/**
* Get the current unified request context.
* Returns the ALS store when inside a `runWithRequestContext()` scope,
* or a fresh detached context otherwise. Unlike the legacy per-shim fallback
* singletons, this detached value is ephemeral — mutations do not persist
* across calls. This is intentional to prevent state leakage outside request
* scopes.
*
* Only direct callers observe this detached fallback. Shim `_getState()`
* helpers should continue to gate on `isInsideUnifiedScope()` and fall back
* to their standalone ALS/fallback singletons outside the unified scope.
* If called inside a standalone `runWithExecutionContext()` scope, the
* detached context still reflects that inherited `executionContext`.
*/
function getRequestContext() {
	return _als$4.getStore() ?? createRequestContext();
}
/**
* Check whether the current execution is inside a `runWithRequestContext()` scope.
* Shim modules use this to decide whether to read from the unified store
* or fall back to their own standalone ALS.
*/
function isInsideUnifiedScope() {
	return _als$4.getStore() != null;
}
//#endregion
//#region node_modules/vinext/dist/shims/request-context.js
/**
* Request ExecutionContext — AsyncLocalStorage-backed accessor.
*
* Makes the Cloudflare Workers `ExecutionContext` (which provides
* `waitUntil`) available to any code on the call stack during a request
* without requiring it to be threaded through every function signature.
*
* Usage:
*
*   // In the worker entry, wrap the handler:
*   import { runWithExecutionContext } from "vinext/shims/request-context";
*   export default {
*     fetch(request, env, ctx) {
*       return runWithExecutionContext(ctx, () => handler.fetch(request, env, ctx));
*     }
*   };
*
*   // Anywhere downstream:
*   import { getRequestExecutionContext } from "vinext/shims/request-context";
*   const ctx = getRequestExecutionContext(); // null on Node.js dev
*   ctx?.waitUntil(somePromise);
*/
var _ALS_KEY$4 = Symbol.for("vinext.requestContext.als");
var _g$6 = globalThis;
var _als$3 = _g$6[_ALS_KEY$4] ??= new AsyncLocalStorage();
function runWithExecutionContext(ctx, fn) {
	if (isInsideUnifiedScope()) return runWithUnifiedStateMutation((uCtx) => {
		uCtx.executionContext = ctx;
	}, fn);
	return _als$3.run(ctx, fn);
}
/**
* Get the `ExecutionContext` for the current request, or `null` when called
* outside a `runWithExecutionContext()` scope (e.g. on Node.js dev server).
*
* Use `ctx?.waitUntil(promise)` to schedule background work that must
* complete before the Worker isolate is torn down.
*/
function getRequestExecutionContext() {
	if (isInsideUnifiedScope()) return getRequestContext().executionContext;
	return _als$3.getStore() ?? null;
}
//#endregion
//#region node_modules/vinext/dist/server/worker-utils.js
/**
* Shared utilities for Cloudflare Worker entries.
*
* Used by hand-written example worker entries and can be imported as
* "vinext/server/worker-utils". The generated worker entry (deploy.ts)
* inlines these functions in its template string.
*/
/**
* Merge middleware/config headers into a response.
* Response headers take precedence over middleware headers for all headers
* except Set-Cookie, which is additive (both middleware and response cookies
* are preserved). Uses getSetCookie() to preserve multiple Set-Cookie values.
* Keep this in sync with prod-server.ts and the generated copy in deploy.ts.
*/
var NO_BODY_RESPONSE_STATUSES = new Set([
	204,
	205,
	304
]);
function isVinextStreamedHtmlResponse(response) {
	return response.__vinextStreamedHtmlResponse === true;
}
function isContentLengthHeader(name) {
	return name.toLowerCase() === "content-length";
}
function cancelResponseBody(response) {
	const body = response.body;
	if (!body || body.locked) return;
	body.cancel().catch(() => {});
}
function buildHeaderRecord(response, omitNames = []) {
	const omitted = new Set(omitNames.map((name) => name.toLowerCase()));
	const headers = {};
	response.headers.forEach((value, key) => {
		if (omitted.has(key.toLowerCase()) || key === "set-cookie") return;
		headers[key] = value;
	});
	const cookies = response.headers.getSetCookie?.() ?? [];
	if (cookies.length > 0) headers["set-cookie"] = cookies;
	return headers;
}
function mergeHeaders(response, extraHeaders, statusOverride) {
	const status = statusOverride ?? response.status;
	const merged = new Headers();
	for (const [k, v] of Object.entries(extraHeaders)) {
		if (isContentLengthHeader(k)) continue;
		if (Array.isArray(v)) for (const item of v) merged.append(k, item);
		else merged.set(k, v);
	}
	response.headers.forEach((v, k) => {
		if (k === "set-cookie") return;
		merged.set(k, v);
	});
	const responseCookies = response.headers.getSetCookie?.() ?? [];
	for (const cookie of responseCookies) merged.append("set-cookie", cookie);
	const shouldDropBody = NO_BODY_RESPONSE_STATUSES.has(status);
	const shouldStripStreamLength = isVinextStreamedHtmlResponse(response) && merged.has("content-length");
	if (!Object.keys(extraHeaders).some((key) => !isContentLengthHeader(key)) && statusOverride === void 0 && !shouldDropBody && !shouldStripStreamLength) return response;
	if (shouldDropBody) {
		cancelResponseBody(response);
		merged.delete("content-encoding");
		merged.delete("content-length");
		merged.delete("content-type");
		merged.delete("transfer-encoding");
		return new Response(null, {
			status,
			statusText: status === response.status ? response.statusText : void 0,
			headers: merged
		});
	}
	if (shouldStripStreamLength) merged.delete("content-length");
	return new Response(response.body, {
		status,
		statusText: status === response.status ? response.statusText : void 0,
		headers: merged
	});
}
async function resolveStaticAssetSignal(signalResponse, options) {
	const signal = signalResponse.headers.get("x-vinext-static-file");
	if (!signal) return null;
	let assetPath = "/";
	try {
		assetPath = decodeURIComponent(signal);
	} catch {
		assetPath = signal;
	}
	const extraHeaders = buildHeaderRecord(signalResponse, [
		"x-vinext-static-file",
		"content-encoding",
		"content-length",
		"content-type"
	]);
	cancelResponseBody(signalResponse);
	const assetResponse = await options.fetchAsset(assetPath);
	return mergeHeaders(assetResponse, extraHeaders, assetResponse.ok && signalResponse.status !== 200 ? signalResponse.status : void 0);
}
//#endregion
//#region \0virtual:vite-rsc/server-references
var server_references_default = { "c55148d2fa51": async () => {
	const { loginApi, profileApi } = await import("./assets/api-CApOOq60.js");
	return {
		loginApi,
		profileApi
	};
} };
//#endregion
//#region node_modules/@vitejs/plugin-rsc/dist/rsc.js
initialize();
function initialize() {
	setRequireModule({ load: async (id) => {
		{
			const import_ = server_references_default[id];
			if (!import_) throw new Error(`server reference not found '${id}'`);
			return import_();
		}
	} });
}
function renderToReadableStream$1(data, options, extraOptions) {
	return renderToReadableStream$2(data, options, { onClientReference(metadata) {
		const deps = assetsManifest.clientReferenceDeps[metadata.id] ?? {
			js: [],
			css: []
		};
		extraOptions?.onClientReference?.({
			id: metadata.id,
			name: metadata.name,
			deps
		});
	} });
}
//#endregion
//#region node_modules/vinext/dist/shims/readonly-url-search-params.js
var import_react_react_server = /* @__PURE__ */ __toESM(require_react_react_server(), 1);
var ReadonlyURLSearchParamsError = class extends Error {
	constructor() {
		super("Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams");
	}
};
/**
* Read-only URLSearchParams wrapper matching Next.js runtime behavior.
* Mutation methods remain present for instanceof/API compatibility but throw.
*/
var ReadonlyURLSearchParams = class extends URLSearchParams {
	append(_name, _value) {
		throw new ReadonlyURLSearchParamsError();
	}
	delete(_name, _value) {
		throw new ReadonlyURLSearchParamsError();
	}
	set(_name, _value) {
		throw new ReadonlyURLSearchParamsError();
	}
	sort() {
		throw new ReadonlyURLSearchParamsError();
	}
};
//#endregion
//#region node_modules/vinext/dist/utils/base-path.js
/**
* Shared basePath helpers.
*
* Next.js only treats a pathname as being under basePath when it is an exact
* match ("/app") or starts with the basePath followed by a path separator
* ("/app/..."). Prefix-only matches like "/application" must be left intact.
*/
/**
* Check whether a pathname is inside the configured basePath.
*/
function hasBasePath(pathname, basePath) {
	if (!basePath) return false;
	return pathname === basePath || pathname.startsWith(basePath + "/");
}
/**
* Strip the basePath prefix from a pathname when it matches on a segment
* boundary. Returns the original pathname when it is outside the basePath.
*/
function stripBasePath(pathname, basePath) {
	if (!hasBasePath(pathname, basePath)) return pathname;
	return pathname.slice(basePath.length) || "/";
}
//#endregion
//#region node_modules/vinext/dist/server/app-elements.js
var APP_INTERCEPTION_SEPARATOR = "\0";
var APP_INTERCEPTION_CONTEXT_KEY = "__interceptionContext";
var APP_LAYOUT_FLAGS_KEY = "__layoutFlags";
var APP_ROUTE_KEY = "__route";
var APP_ROOT_LAYOUT_KEY = "__rootLayout";
var APP_UNMATCHED_SLOT_WIRE_VALUE = "__VINEXT_UNMATCHED_SLOT__";
function appendInterceptionContext(identity, interceptionContext) {
	return interceptionContext === null ? identity : `${identity}${APP_INTERCEPTION_SEPARATOR}${interceptionContext}`;
}
function createAppPayloadRouteId(routePath, interceptionContext) {
	return appendInterceptionContext(`route:${routePath}`, interceptionContext);
}
function createAppPayloadPageId(routePath, interceptionContext) {
	return appendInterceptionContext(`page:${routePath}`, interceptionContext);
}
/**
* Type predicate for a plain (non-null, non-array) record of app payload values.
* Used to distinguish the App Router payload object from bare React elements at
* the render boundary. Narrows to `Readonly<Record<string, unknown>>` because
* the outgoing payload carries heterogeneous values (ReactNodes for the rendered
* tree, plus metadata like `__layoutFlags` which is a plain object). Delegates
* to React's canonical `isValidElement` so we don't depend on React's internal
* `$$typeof` marker scheme.
*/
function isAppElementsRecord(value) {
	if (typeof value !== "object" || value === null) return false;
	if (Array.isArray(value)) return false;
	if ((0, import_react_react_server.isValidElement)(value)) return false;
	return true;
}
/**
* Pure: returns a new record with `__layoutFlags` attached. Owns the write
* boundary for the layout flags key so the write side sits next to
* `readAppElementsMetadata`.
*
* See `LayoutFlags` type docblock in this file for lifecycle.
*/
function withLayoutFlags(elements, layoutFlags) {
	return {
		...elements,
		[APP_LAYOUT_FLAGS_KEY]: layoutFlags
	};
}
/**
* Pure: builds the outgoing payload for the wire. Non-record inputs (e.g. a
* bare React element) are returned unchanged. Record inputs get a fresh copy
* with `__layoutFlags` attached. Never mutates `input.element`.
*/
function buildOutgoingAppPayload(input) {
	if (!isAppElementsRecord(input.element)) return input.element;
	return withLayoutFlags(input.element, input.layoutFlags);
}
//#endregion
//#region node_modules/vinext/dist/shims/navigation.js
var _SERVER_INSERTED_HTML_CTX_KEY = Symbol.for("vinext.serverInsertedHTMLContext");
function getServerInsertedHTMLContext() {
	if (typeof import_react_react_server.createContext !== "function") return null;
	const globalState = globalThis;
	if (!globalState[_SERVER_INSERTED_HTML_CTX_KEY]) globalState[_SERVER_INSERTED_HTML_CTX_KEY] = import_react_react_server.createContext(null);
	return globalState[_SERVER_INSERTED_HTML_CTX_KEY] ?? null;
}
getServerInsertedHTMLContext();
var GLOBAL_ACCESSORS_KEY = Symbol.for("vinext.navigation.globalAccessors");
var _GLOBAL_ACCESSORS_KEY = GLOBAL_ACCESSORS_KEY;
function _getGlobalAccessors() {
	return globalThis[_GLOBAL_ACCESSORS_KEY];
}
var _serverContext = null;
var _getServerContext = () => {
	const g = _getGlobalAccessors();
	return g ? g.getServerContext() : _serverContext;
};
var _setServerContext = (ctx) => {
	const g = _getGlobalAccessors();
	if (g) g.setServerContext(ctx);
	else _serverContext = ctx;
};
/**
* Register ALS-backed state accessors. Called by navigation-state.ts on import.
* @internal
*/
function _registerStateAccessors(accessors) {
	_getServerContext = accessors.getServerContext;
	_setServerContext = accessors.setServerContext;
	accessors.getInsertedHTMLCallbacks;
	accessors.clearInsertedHTMLCallbacks;
}
/**
* Get the navigation context for the current SSR/RSC render.
* Reads from AsyncLocalStorage when available (concurrent-safe),
* otherwise falls back to module-level state.
*/
function getNavigationContext() {
	return _getServerContext();
}
/**
* Set the navigation context for the current SSR/RSC render.
* Called by the framework entry before rendering each request.
*/
function setNavigationContext$1(ctx) {
	_setServerContext(ctx);
}
var isServer = typeof window === "undefined";
var _CLIENT_NAV_STATE_KEY = Symbol.for("vinext.clientNavigationState");
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
//#region node_modules/vinext/dist/shims/client-hook-error.js
/**
* Shared error helper for client-only hooks called in Server Components.
*
* Used by `.react-server.ts` shim variants to provide a clear, actionable
* error message when a developer forgets the "use client" directive.
*
* @see https://github.com/cloudflare/vinext/issues/834
*/
function buildClientHookErrorMessage(hookName) {
	return `${hookName} only works in Client Components. Add the "use client" directive at the top of the file to use it. Read more: https://nextjs.org/docs/messages/react-client-hook-in-server-component`;
}
//#endregion
//#region node_modules/vinext/dist/server/middleware-request-headers.js
var MIDDLEWARE_REQUEST_HEADER_PREFIX = "x-middleware-request-";
var MIDDLEWARE_OVERRIDE_HEADERS = "x-middleware-override-headers";
function getMiddlewareHeaderValue(source, key) {
	if (source instanceof Headers) return source.get(key);
	const value = source[key];
	if (value === void 0) return null;
	return Array.isArray(value) ? value[0] ?? null : value;
}
function getOverrideHeaderNames(source) {
	const rawValue = getMiddlewareHeaderValue(source, MIDDLEWARE_OVERRIDE_HEADERS);
	if (rawValue === null) return null;
	return rawValue.split(",").map((key) => key.trim()).filter(Boolean);
}
function getForwardedRequestHeaders(source) {
	const forwardedHeaders = /* @__PURE__ */ new Map();
	if (source instanceof Headers) {
		for (const [key, value] of source.entries()) if (key.startsWith("x-middleware-request-")) forwardedHeaders.set(key.slice(21), value);
		return forwardedHeaders;
	}
	for (const [key, value] of Object.entries(source)) {
		if (!key.startsWith("x-middleware-request-")) continue;
		const normalizedValue = Array.isArray(value) ? value[0] ?? "" : value;
		forwardedHeaders.set(key.slice(21), normalizedValue);
	}
	return forwardedHeaders;
}
function cloneHeaders(source) {
	const cloned = new Headers();
	for (const [key, value] of source.entries()) cloned.append(key, value);
	return cloned;
}
function encodeMiddlewareRequestHeaders(targetHeaders, requestHeaders) {
	const overrideHeaderNames = [...requestHeaders.keys()];
	targetHeaders.set(MIDDLEWARE_OVERRIDE_HEADERS, overrideHeaderNames.join(","));
	for (const [key, value] of requestHeaders.entries()) targetHeaders.set(`${MIDDLEWARE_REQUEST_HEADER_PREFIX}${key}`, value);
}
function buildRequestHeadersFromMiddlewareResponse(baseHeaders, middlewareHeaders) {
	const overrideHeaderNames = getOverrideHeaderNames(middlewareHeaders);
	const forwardedHeaders = getForwardedRequestHeaders(middlewareHeaders);
	if (overrideHeaderNames === null && forwardedHeaders.size === 0) return null;
	const nextHeaders = overrideHeaderNames === null ? cloneHeaders(baseHeaders) : new Headers();
	if (overrideHeaderNames === null) {
		for (const [key, value] of forwardedHeaders) nextHeaders.set(key, value);
		return nextHeaders;
	}
	for (const key of overrideHeaderNames) {
		const value = forwardedHeaders.get(key);
		if (value !== void 0) nextHeaders.set(key, value);
	}
	return nextHeaders;
}
//#endregion
//#region node_modules/vinext/dist/shims/internal/parse-cookie-header.js
/**
* Port of the current Next.js/@edge-runtime request cookie parser semantics.
*
* Important details:
* - split on a semicolon-plus-optional-spaces pattern
* - preserve whitespace around names/values otherwise
* - bare tokens become "true"
* - malformed percent-encoded values are skipped
* - duplicate names collapse to the last value via Map.set()
*/
function parseCookieHeader(cookieHeader) {
	const cookies = /* @__PURE__ */ new Map();
	for (const pair of cookieHeader.split(/; */)) {
		if (!pair) continue;
		const splitAt = pair.indexOf("=");
		if (splitAt === -1) {
			cookies.set(pair, "true");
			continue;
		}
		const key = pair.slice(0, splitAt);
		const value = pair.slice(splitAt + 1);
		try {
			cookies.set(key, decodeURIComponent(value));
		} catch {}
	}
	return cookies;
}
//#endregion
//#region node_modules/vinext/dist/shims/headers.js
/**
* next/headers shim
*
* Provides cookies() and headers() functions for App Router Server Components.
* These read from a request context set by the RSC handler before rendering.
*
* In Next.js 15+, cookies() and headers() return Promises (async).
* We support both the sync (legacy) and async patterns.
*/
var _ALS_KEY$3 = Symbol.for("vinext.nextHeadersShim.als");
var _FALLBACK_KEY$3 = Symbol.for("vinext.nextHeadersShim.fallback");
var _g$5 = globalThis;
var _als$2 = _g$5[_ALS_KEY$3] ??= new AsyncLocalStorage();
var _fallbackState$2 = _g$5[_FALLBACK_KEY$3] ??= {
	headersContext: null,
	dynamicUsageDetected: false,
	pendingSetCookies: [],
	draftModeCookieHeader: null,
	phase: "render"
};
(/* @__PURE__ */ new Date(0)).toUTCString();
function _getState$2() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _als$2.getStore() ?? _fallbackState$2;
}
/**
* Dynamic usage flag — set when a component calls connection(), cookies(),
* headers(), or noStore() during rendering. When true, ISR caching is
* bypassed and the response gets Cache-Control: no-store.
*/
/**
* Mark the current render as requiring dynamic (uncached) rendering.
* Called by connection(), cookies(), headers(), and noStore().
*/
function markDynamicUsage() {
	_getState$2().dynamicUsageDetected = true;
}
/**
* Check and reset the dynamic usage flag.
* Called by the server after rendering to decide on caching.
*/
function consumeDynamicUsage() {
	const state = _getState$2();
	const used = state.dynamicUsageDetected;
	state.dynamicUsageDetected = false;
	return used;
}
function _setStatePhase(state, phase) {
	const previous = state.phase;
	state.phase = phase;
	return previous;
}
function setHeadersAccessPhase(phase) {
	return _setStatePhase(_getState$2(), phase);
}
/**
* Set the headers/cookies context for the current RSC render.
* Called by the framework's RSC entry before rendering each request.
*
* @deprecated Prefer runWithHeadersContext() which uses als.run() for
* proper per-request isolation. This function mutates the ALS store
* in-place and is only safe for cleanup (ctx=null) within an existing
* als.run() scope.
*/
/**
* Returns the current live HeadersContext from ALS (or the fallback).
* Used after applyMiddlewareRequestHeaders() to build a post-middleware
* request context for afterFiles/fallback rewrite has/missing evaluation.
*/
function getHeadersContext() {
	return _getState$2().headersContext;
}
function setHeadersContext(ctx) {
	const state = _getState$2();
	if (ctx !== null) {
		state.headersContext = ctx;
		state.dynamicUsageDetected = false;
		state.pendingSetCookies = [];
		state.draftModeCookieHeader = null;
		state.phase = "render";
	} else {
		state.headersContext = null;
		state.phase = "render";
	}
}
/** Methods on `Headers` that mutate state. Hoisted to module scope — static. */
var _HEADERS_MUTATING_METHODS = new Set([
	"set",
	"delete",
	"append"
]);
/**
* Create a HeadersContext from a standard Request object.
*
* Performance note: In Workerd (Cloudflare Workers), `new Headers(request.headers)`
* copies the entire header map across the V8/C++ boundary, which shows up as
* ~815 ms self-time in production profiles when requests carry many headers.
* We defer this copy with a lazy proxy:
*
* - Reads (`get`, `has`, `entries`, …) are forwarded directly to the original
*   immutable `request.headers` — zero copy cost on the hot path.
* - The first mutating call (`set`, `delete`, `append`) materialises
*   `new Headers(request.headers)` once, then applies the mutation to the copy.
*   All subsequent operations go to the copy.
*
* This means the ~815 ms copy only occurs when middleware actually rewrites
* request headers via `NextResponse.next({ request: { headers } })`, which is
* uncommon.  Pure read requests (the vast majority) pay zero copy cost.
*
* Cookie parsing is also deferred: the `cookie` header string is not split
* until the first call to `cookies()` or `draftMode()`.
*/
function headersContextFromRequest(request) {
	let _mutable = null;
	const headersProxy = new Proxy(request.headers, { get(target, prop) {
		const src = _mutable ?? target;
		if (typeof prop === "string" && _HEADERS_MUTATING_METHODS.has(prop)) return (...args) => {
			if (!_mutable) _mutable = new Headers(target);
			return _mutable[prop](...args);
		};
		const value = Reflect.get(src, prop, src);
		return typeof value === "function" ? value.bind(src) : value;
	} });
	let _cookies = null;
	function getCookies() {
		if (_cookies) return _cookies;
		_cookies = parseCookieHeader(headersProxy.get("cookie") || "");
		return _cookies;
	}
	return {
		headers: headersProxy,
		get cookies() {
			return getCookies();
		}
	};
}
/** Accumulated Set-Cookie headers from cookies().set() / .delete() calls */
/**
* Get and clear all pending Set-Cookie headers generated by cookies().set()/delete().
* Called by the framework after rendering to attach headers to the response.
*/
function getAndClearPendingCookies() {
	const state = _getState$2();
	const cookies = state.pendingSetCookies;
	state.pendingSetCookies = [];
	return cookies;
}
/**
* Get any Set-Cookie header generated by draftMode().enable()/disable().
* Called by the framework after rendering to attach the header to the response.
*/
function getDraftModeCookieHeader() {
	const state = _getState$2();
	const header = state.draftModeCookieHeader;
	state.draftModeCookieHeader = null;
	return header;
}
//#endregion
//#region node_modules/vinext/dist/shims/server.js
var NextRequest = class extends Request {
	_nextUrl;
	_cookies;
	constructor(input, init) {
		const { nextConfig: _nextConfig, ...requestInit } = init ?? {};
		if (input instanceof Request) {
			const req = input;
			super(req.url, {
				method: req.method,
				headers: req.headers,
				body: req.body,
				duplex: req.body ? "half" : void 0,
				...requestInit
			});
		} else super(input, requestInit);
		this._nextUrl = new NextURL(typeof input === "string" ? new URL(input, "http://localhost") : input instanceof URL ? input : new URL(input.url, "http://localhost"), void 0, _nextConfig ? {
			basePath: _nextConfig.basePath,
			nextConfig: { i18n: _nextConfig.i18n }
		} : void 0);
		this._cookies = new RequestCookies(this.headers);
	}
	get nextUrl() {
		return this._nextUrl;
	}
	get cookies() {
		return this._cookies;
	}
	/**
	* Client IP address. Prefers Cloudflare's trusted CF-Connecting-IP header
	* over the spoofable X-Forwarded-For. Returns undefined if unavailable.
	*/
	get ip() {
		return this.headers.get("cf-connecting-ip") ?? this.headers.get("x-real-ip") ?? this.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? void 0;
	}
	/**
	* Geolocation data. Platform-dependent (e.g., Cloudflare, Vercel).
	* Returns undefined if not available.
	*/
	get geo() {
		const country = this.headers.get("cf-ipcountry") ?? this.headers.get("x-vercel-ip-country") ?? void 0;
		if (!country) return void 0;
		return {
			country,
			city: this.headers.get("cf-ipcity") ?? this.headers.get("x-vercel-ip-city") ?? void 0,
			region: this.headers.get("cf-region") ?? this.headers.get("x-vercel-ip-country-region") ?? void 0,
			latitude: this.headers.get("cf-iplatitude") ?? this.headers.get("x-vercel-ip-latitude") ?? void 0,
			longitude: this.headers.get("cf-iplongitude") ?? this.headers.get("x-vercel-ip-longitude") ?? void 0
		};
	}
	/**
	* The build ID of the Next.js application.
	* Delegates to `nextUrl.buildId` to match Next.js API surface.
	* Can be used in middleware to detect deployment skew between client and server.
	*/
	get buildId() {
		return this._nextUrl.buildId;
	}
};
/** Valid HTTP redirect status codes, matching Next.js's REDIRECTS set. */
var REDIRECT_STATUSES = new Set([
	301,
	302,
	303,
	307,
	308
]);
var NextResponse = class NextResponse extends Response {
	_cookies;
	constructor(body, init) {
		super(body, init);
		this._cookies = new ResponseCookies(this.headers);
	}
	get cookies() {
		return this._cookies;
	}
	/**
	* Create a JSON response.
	*/
	static json(body, init) {
		const headers = new Headers(init?.headers);
		if (!headers.has("content-type")) headers.set("content-type", "application/json");
		return new NextResponse(JSON.stringify(body), {
			...init,
			headers
		});
	}
	/**
	* Create a redirect response.
	*/
	static redirect(url, init) {
		const status = typeof init === "number" ? init : init?.status ?? 307;
		if (!REDIRECT_STATUSES.has(status)) throw new RangeError(`Failed to execute "redirect" on "response": Invalid status code`);
		const destination = typeof url === "string" ? url : url.toString();
		const headers = new Headers(typeof init === "object" ? init?.headers : void 0);
		headers.set("Location", destination);
		return new NextResponse(null, {
			status,
			headers
		});
	}
	/**
	* Create a rewrite response (middleware pattern).
	* Sets the x-middleware-rewrite header.
	*/
	static rewrite(destination, init) {
		const url = typeof destination === "string" ? destination : destination.toString();
		const headers = new Headers(init?.headers);
		headers.set("x-middleware-rewrite", url);
		if (init?.request?.headers) encodeMiddlewareRequestHeaders(headers, init.request.headers);
		return new NextResponse(null, {
			...init,
			headers
		});
	}
	/**
	* Continue to the next handler (middleware pattern).
	* Sets the x-middleware-next header.
	*/
	static next(init) {
		const headers = new Headers(init?.headers);
		headers.set("x-middleware-next", "1");
		if (init?.request?.headers) encodeMiddlewareRequestHeaders(headers, init.request.headers);
		return new NextResponse(null, {
			...init,
			headers
		});
	}
};
var NextURL = class NextURL {
	/** Internal URL stores the pathname WITHOUT basePath or locale prefix. */
	_url;
	_basePath;
	_locale;
	_defaultLocale;
	_locales;
	constructor(input, base, config) {
		this._url = new URL(input.toString(), base);
		this._basePath = config?.basePath ?? "";
		this._stripBasePath();
		const i18n = config?.nextConfig?.i18n;
		if (i18n) {
			this._locales = [...i18n.locales];
			this._defaultLocale = i18n.defaultLocale;
			this._analyzeLocale(this._locales);
		}
	}
	/** Strip basePath prefix from the internal pathname. */
	_stripBasePath() {
		if (!this._basePath) return;
		const { pathname } = this._url;
		if (pathname === this._basePath || pathname.startsWith(this._basePath + "/")) this._url.pathname = pathname.slice(this._basePath.length) || "/";
	}
	/** Extract locale from pathname, stripping it from the internal URL. */
	_analyzeLocale(locales) {
		const segments = this._url.pathname.split("/");
		const candidate = segments[1]?.toLowerCase();
		const match = locales.find((l) => l.toLowerCase() === candidate);
		if (match) {
			this._locale = match;
			this._url.pathname = "/" + segments.slice(2).join("/");
		} else this._locale = this._defaultLocale;
	}
	/**
	* Reconstruct the full pathname with basePath + locale prefix.
	* Mirrors Next.js's internal formatPathname().
	*/
	_formatPathname() {
		let prefix = this._basePath;
		if (this._locale && this._locale !== this._defaultLocale) prefix += "/" + this._locale;
		if (!prefix) return this._url.pathname;
		const inner = this._url.pathname;
		return inner === "/" ? prefix : prefix + inner;
	}
	get href() {
		const formatted = this._formatPathname();
		if (formatted === this._url.pathname) return this._url.href;
		const { href, pathname, search, hash } = this._url;
		const baseEnd = href.length - pathname.length - search.length - hash.length;
		return href.slice(0, baseEnd) + formatted + search + hash;
	}
	set href(value) {
		this._url.href = value;
		this._stripBasePath();
		if (this._locales) this._analyzeLocale(this._locales);
	}
	get origin() {
		return this._url.origin;
	}
	get protocol() {
		return this._url.protocol;
	}
	set protocol(value) {
		this._url.protocol = value;
	}
	get username() {
		return this._url.username;
	}
	set username(value) {
		this._url.username = value;
	}
	get password() {
		return this._url.password;
	}
	set password(value) {
		this._url.password = value;
	}
	get host() {
		return this._url.host;
	}
	set host(value) {
		this._url.host = value;
	}
	get hostname() {
		return this._url.hostname;
	}
	set hostname(value) {
		this._url.hostname = value;
	}
	get port() {
		return this._url.port;
	}
	set port(value) {
		this._url.port = value;
	}
	/** Returns the pathname WITHOUT basePath or locale prefix. */
	get pathname() {
		return this._url.pathname;
	}
	set pathname(value) {
		this._url.pathname = value;
	}
	get search() {
		return this._url.search;
	}
	set search(value) {
		this._url.search = value;
	}
	get searchParams() {
		return this._url.searchParams;
	}
	get hash() {
		return this._url.hash;
	}
	set hash(value) {
		this._url.hash = value;
	}
	get basePath() {
		return this._basePath;
	}
	set basePath(value) {
		this._basePath = value === "" ? "" : value.startsWith("/") ? value : "/" + value;
	}
	get locale() {
		return this._locale ?? "";
	}
	set locale(value) {
		if (this._locales) {
			if (!value) {
				this._locale = this._defaultLocale;
				return;
			}
			if (!this._locales.includes(value)) throw new TypeError(`The locale "${value}" is not in the configured locales: ${this._locales.join(", ")}`);
		}
		this._locale = this._locales ? value : this._locale;
	}
	get defaultLocale() {
		return this._defaultLocale;
	}
	get locales() {
		return this._locales ? [...this._locales] : void 0;
	}
	clone() {
		const config = {
			basePath: this._basePath,
			nextConfig: this._locales ? { i18n: {
				locales: [...this._locales],
				defaultLocale: this._defaultLocale
			} } : void 0
		};
		return new NextURL(this.href, void 0, config);
	}
	toString() {
		return this.href;
	}
	/**
	* The build ID of the Next.js application.
	* Set from `generateBuildId` in next.config.js, or a random UUID if not configured.
	* Can be used in middleware to detect deployment skew between client and server.
	* Matches the Next.js API: `request.nextUrl.buildId`.
	*/
	get buildId() {
		return "d1fb96d3-890d-45e4-924c-909014a764fb";
	}
};
var RequestCookies = class {
	_headers;
	_parsed;
	constructor(headers) {
		this._headers = headers;
		this._parsed = parseCookieHeader(headers.get("cookie") ?? "");
	}
	get(name) {
		const value = this._parsed.get(name);
		return value !== void 0 ? {
			name,
			value
		} : void 0;
	}
	getAll(nameOrOptions) {
		const name = typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions?.name;
		return [...this._parsed.entries()].filter(([cookieName]) => name === void 0 || cookieName === name).map(([cookieName, value]) => ({
			name: cookieName,
			value
		}));
	}
	has(name) {
		return this._parsed.has(name);
	}
	set(nameOrOptions, value) {
		let cookieName;
		let cookieValue;
		if (typeof nameOrOptions === "string") {
			cookieName = nameOrOptions;
			cookieValue = value ?? "";
		} else {
			cookieName = nameOrOptions.name;
			cookieValue = nameOrOptions.value;
		}
		validateCookieName(cookieName);
		this._parsed.set(cookieName, cookieValue);
		this._syncHeader();
		return this;
	}
	delete(names) {
		if (Array.isArray(names)) {
			const results = names.map((name) => {
				validateCookieName(name);
				return this._parsed.delete(name);
			});
			this._syncHeader();
			return results;
		}
		validateCookieName(names);
		const result = this._parsed.delete(names);
		this._syncHeader();
		return result;
	}
	clear() {
		this._parsed.clear();
		this._syncHeader();
		return this;
	}
	get size() {
		return this._parsed.size;
	}
	toString() {
		return this._serialize();
	}
	_serialize() {
		return [...this._parsed.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ");
	}
	_syncHeader() {
		if (this._parsed.size === 0) this._headers.delete("cookie");
		else this._headers.set("cookie", this._serialize());
	}
	[Symbol.iterator]() {
		return this.getAll().map((c) => [c.name, c])[Symbol.iterator]();
	}
};
/**
* RFC 6265 §4.1.1: cookie-name is a token (RFC 2616 §2.2).
* Allowed: any visible ASCII (0x21-0x7E) except separators: ()<>@,;:\"/[]?={}
*/
var VALID_COOKIE_NAME_RE = /^[\x21\x23-\x27\x2A\x2B\x2D\x2E\x30-\x39\x41-\x5A\x5E-\x7A\x7C\x7E]+$/;
function validateCookieName(name) {
	if (!name || !VALID_COOKIE_NAME_RE.test(name)) throw new Error(`Invalid cookie name: ${JSON.stringify(name)}`);
}
function validateCookieAttributeValue(value, attributeName) {
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code <= 31 || code === 127 || value[i] === ";") throw new Error(`Invalid cookie ${attributeName} value: ${JSON.stringify(value)}`);
	}
}
var ResponseCookies = class {
	_headers;
	/** Internal map keyed by cookie name — single source of truth. */
	_parsed = /* @__PURE__ */ new Map();
	constructor(headers) {
		this._headers = headers;
		for (const header of headers.getSetCookie()) {
			const eq = header.indexOf("=");
			if (eq === -1) continue;
			const cookieName = header.slice(0, eq);
			const semi = header.indexOf(";", eq);
			const raw = header.slice(eq + 1, semi === -1 ? void 0 : semi);
			let value;
			try {
				value = decodeURIComponent(raw);
			} catch {
				value = raw;
			}
			this._parsed.set(cookieName, {
				serialized: header,
				entry: {
					name: cookieName,
					value
				}
			});
		}
	}
	set(...args) {
		const [name, value, opts] = parseCookieSetArgs(args);
		validateCookieName(name);
		const parts = [`${name}=${encodeURIComponent(value)}`];
		const path = opts?.path ?? "/";
		validateCookieAttributeValue(path, "Path");
		parts.push(`Path=${path}`);
		if (opts?.domain) {
			validateCookieAttributeValue(opts.domain, "Domain");
			parts.push(`Domain=${opts.domain}`);
		}
		if (opts?.maxAge !== void 0) parts.push(`Max-Age=${opts.maxAge}`);
		if (opts?.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
		if (opts?.httpOnly) parts.push("HttpOnly");
		if (opts?.secure) parts.push("Secure");
		if (opts?.sameSite) parts.push(`SameSite=${opts.sameSite}`);
		this._parsed.set(name, {
			serialized: parts.join("; "),
			entry: {
				name,
				value
			}
		});
		this._syncHeaders();
		return this;
	}
	get(...args) {
		const key = typeof args[0] === "string" ? args[0] : args[0].name;
		return this._parsed.get(key)?.entry;
	}
	has(name) {
		return this._parsed.has(name);
	}
	getAll(...args) {
		const all = [...this._parsed.values()].map((v) => v.entry);
		if (args.length === 0) return all;
		const key = typeof args[0] === "string" ? args[0] : args[0].name;
		return all.filter((c) => c.name === key);
	}
	delete(...args) {
		const [name, opts] = typeof args[0] === "string" ? [args[0], void 0] : [args[0].name, args[0]];
		return this.set({
			name,
			value: "",
			expires: /* @__PURE__ */ new Date(0),
			path: opts?.path,
			domain: opts?.domain,
			httpOnly: opts?.httpOnly,
			secure: opts?.secure,
			sameSite: opts?.sameSite
		});
	}
	[Symbol.iterator]() {
		return [...this._parsed.values()].map((v) => [v.entry.name, v.entry])[Symbol.iterator]();
	}
	/** Delete all Set-Cookie headers and re-append from the internal map. */
	_syncHeaders() {
		this._headers.delete("Set-Cookie");
		for (const { serialized } of this._parsed.values()) this._headers.append("Set-Cookie", serialized);
	}
};
/**
* Parse the overloaded arguments for ResponseCookies.set():
*   - (name, value, options?) — positional form
*   - ({ name, value, ...options }) — object form
*/
function parseCookieSetArgs(args) {
	if (typeof args[0] === "string") return [
		args[0],
		args[1],
		args[2]
	];
	const { name, value, ...opts } = args[0];
	return [
		name,
		value,
		opts
	];
}
globalThis.URLPattern;
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.react-server.production.js
/**
* @license React
* react-jsx-runtime.react-server.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_react_server_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React = require_react_react_server(), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	if (!React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) throw Error("The \"react\" package in this environment is not configured correctly. The \"react-server\" condition must be enabled in any environment that runs React Server Components.");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
//#endregion
//#region node_modules/vinext/dist/shims/metadata.js
var import_jsx_runtime_react_server = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_react_server_production();
})))();
/**
* Normalize null-prototype objects from matchPattern() into thenable objects.
* See entries/app-rsc-entry.ts makeThenableParams() for full explanation.
*/
function makeThenableParams$1(obj) {
	const plain = { ...obj };
	return Object.assign(Promise.resolve(plain), plain);
}
/**
* Resolve viewport config from a module. Handles both static `viewport` export
* and async `generateViewport()` function.
*/
async function resolveModuleViewport(mod, params) {
	if (typeof mod.generateViewport === "function") {
		const asyncParams = makeThenableParams$1(params);
		return await mod.generateViewport({ params: asyncParams });
	}
	if (mod.viewport && typeof mod.viewport === "object") return mod.viewport;
	return null;
}
/**
* Merge viewport configs from multiple sources (layouts + page).
* Later entries override earlier ones.
*/
var DEFAULT_VIEWPORT = {
	width: "device-width",
	initialScale: 1
};
function mergeViewport(viewportList) {
	const merged = { ...DEFAULT_VIEWPORT };
	for (const vp of viewportList) Object.assign(merged, vp);
	return merged;
}
/**
* React component that renders viewport meta tags into <head>.
*/
function ViewportHead({ viewport }) {
	const elements = [];
	let key = 0;
	const parts = [];
	if (viewport.width !== void 0) parts.push(`width=${viewport.width}`);
	if (viewport.height !== void 0) parts.push(`height=${viewport.height}`);
	if (viewport.initialScale !== void 0) parts.push(`initial-scale=${viewport.initialScale}`);
	if (viewport.minimumScale !== void 0) parts.push(`minimum-scale=${viewport.minimumScale}`);
	if (viewport.maximumScale !== void 0) parts.push(`maximum-scale=${viewport.maximumScale}`);
	if (viewport.userScalable !== void 0) parts.push(`user-scalable=${viewport.userScalable ? "yes" : "no"}`);
	if (parts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "viewport",
		content: parts.join(", ")
	}, key++));
	if (viewport.themeColor) {
		if (typeof viewport.themeColor === "string") elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "theme-color",
			content: viewport.themeColor
		}, key++));
		else if (Array.isArray(viewport.themeColor)) for (const entry of viewport.themeColor) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "theme-color",
			content: entry.color,
			...entry.media ? { media: entry.media } : {}
		}, key++));
	}
	if (viewport.colorScheme) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "color-scheme",
		content: viewport.colorScheme
	}, key++));
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(import_jsx_runtime_react_server.Fragment, { children: elements });
}
/**
* Merge metadata from multiple sources (layouts + page).
*
* The list is ordered [rootLayout, nestedLayout, ..., page].
* Title template from layouts applies to the page title but NOT to
* the segment that defines the template itself. `title.absolute`
* skips all templates. `title.default` is the fallback when no
* child provides a title.
*
* Shallow merge: later entries override earlier ones (per Next.js docs).
*/
function mergeMetadata(metadataList) {
	if (metadataList.length === 0) return {};
	const merged = {};
	let parentTemplate;
	for (let i = 0; i < metadataList.length; i++) {
		const meta = metadataList[i];
		if (!(i === metadataList.length - 1) && meta.title && typeof meta.title === "object" && meta.title.template) parentTemplate = meta.title.template;
		for (const key of Object.keys(meta)) {
			if (key === "title") continue;
			merged[key] = meta[key];
		}
		if (meta.title !== void 0) merged.title = meta.title;
	}
	const finalTitle = merged.title;
	if (finalTitle) {
		if (typeof finalTitle === "string") {
			if (parentTemplate) merged.title = parentTemplate.replace("%s", finalTitle);
		} else if (typeof finalTitle === "object") {
			if (finalTitle.absolute) merged.title = finalTitle.absolute;
			else if (finalTitle.default) merged.title = finalTitle.default;
			else if (finalTitle.template && !finalTitle.default && !finalTitle.absolute) merged.title = void 0;
		}
	}
	return merged;
}
/**
* Resolve metadata from a module. Handles both static `metadata` export
* and async `generateMetadata()` function.
*
* @param parent - A Promise that resolves to the accumulated (merged) metadata
*   from all ancestor segments. Passed as the second argument to
*   `generateMetadata()`, matching Next.js's eager-execution-with-serial-
*   resolution approach. If not provided, defaults to a promise that resolves
*   to an empty object (so `await parent` never throws).
*/
async function resolveModuleMetadata(mod, params = {}, searchParams, parent = Promise.resolve({})) {
	if (typeof mod.generateMetadata === "function") {
		const asyncParams = makeThenableParams$1(params);
		const asyncSp = makeThenableParams$1(searchParams ?? {});
		return await mod.generateMetadata({
			params: asyncParams,
			searchParams: asyncSp
		}, parent);
	}
	if (mod.metadata && typeof mod.metadata === "object") return mod.metadata;
	return null;
}
/**
* React component that renders metadata as HTML head elements.
* Used by the RSC entry to inject into the <head>.
*/
function MetadataHead({ metadata }) {
	const elements = [];
	let key = 0;
	const base = metadata.metadataBase;
	function resolveUrl(url) {
		if (!url) return void 0;
		const s = typeof url === "string" ? url : url instanceof URL ? url.toString() : String(url);
		if (!base) return s;
		if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) return s;
		try {
			return new URL(s, base).toString();
		} catch {
			return s;
		}
	}
	const title = typeof metadata.title === "string" ? metadata.title : typeof metadata.title === "object" ? metadata.title.absolute || metadata.title.default : void 0;
	if (title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("title", { children: title }, key++));
	if (metadata.description) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "description",
		content: metadata.description
	}, key++));
	if (metadata.generator) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "generator",
		content: metadata.generator
	}, key++));
	if (metadata.applicationName) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "application-name",
		content: metadata.applicationName
	}, key++));
	if (metadata.referrer) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "referrer",
		content: metadata.referrer
	}, key++));
	if (metadata.keywords) {
		const kw = Array.isArray(metadata.keywords) ? metadata.keywords.join(",") : metadata.keywords;
		elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "keywords",
			content: kw
		}, key++));
	}
	if (metadata.authors) {
		const authorList = Array.isArray(metadata.authors) ? metadata.authors : [metadata.authors];
		for (const author of authorList) {
			if (author.name) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				name: "author",
				content: author.name
			}, key++));
			if (author.url) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "author",
				href: author.url
			}, key++));
		}
	}
	if (metadata.creator) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "creator",
		content: metadata.creator
	}, key++));
	if (metadata.publisher) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "publisher",
		content: metadata.publisher
	}, key++));
	if (metadata.formatDetection) {
		const parts = [];
		if (metadata.formatDetection.telephone === false) parts.push("telephone=no");
		if (metadata.formatDetection.address === false) parts.push("address=no");
		if (metadata.formatDetection.email === false) parts.push("email=no");
		if (parts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "format-detection",
			content: parts.join(", ")
		}, key++));
	}
	if (metadata.category) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "category",
		content: metadata.category
	}, key++));
	if (metadata.robots) if (typeof metadata.robots === "string") elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
		name: "robots",
		content: metadata.robots
	}, key++));
	else {
		const { googleBot, ...robotsRest } = metadata.robots;
		const robotParts = [];
		for (const [k, v] of Object.entries(robotsRest)) if (v === true) robotParts.push(k);
		else if (v === false) robotParts.push(`no${k}`);
		else if (typeof v === "string" || typeof v === "number") robotParts.push(`${k}:${v}`);
		if (robotParts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "robots",
			content: robotParts.join(", ")
		}, key++));
		if (googleBot) if (typeof googleBot === "string") elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "googlebot",
			content: googleBot
		}, key++));
		else {
			const gbParts = [];
			for (const [k, v] of Object.entries(googleBot)) if (v === true) gbParts.push(k);
			else if (v === false) gbParts.push(`no${k}`);
			else if (typeof v === "string" || typeof v === "number") gbParts.push(`${k}:${v}`);
			if (gbParts.length > 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				name: "googlebot",
				content: gbParts.join(", ")
			}, key++));
		}
	}
	if (metadata.openGraph) {
		const og = metadata.openGraph;
		if (og.title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:title",
			content: og.title
		}, key++));
		if (og.description) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:description",
			content: og.description
		}, key++));
		if (og.url) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:url",
			content: resolveUrl(og.url)
		}, key++));
		if (og.siteName) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:site_name",
			content: og.siteName
		}, key++));
		if (og.type) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:type",
			content: og.type
		}, key++));
		if (og.locale) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:locale",
			content: og.locale
		}, key++));
		if (og.publishedTime) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "article:published_time",
			content: og.publishedTime
		}, key++));
		if (og.modifiedTime) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "article:modified_time",
			content: og.modifiedTime
		}, key++));
		if (og.authors) for (const author of og.authors) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "article:author",
			content: author
		}, key++));
		if (og.images) {
			const imgList = typeof og.images === "string" || og.images instanceof URL ? [{ url: og.images }] : Array.isArray(og.images) ? og.images : [og.images];
			for (const img of imgList) {
				const imgUrl = typeof img === "string" || img instanceof URL ? img : img.url;
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					property: "og:image",
					content: resolveUrl(imgUrl)
				}, key++));
				if (typeof img !== "string" && !(img instanceof URL)) {
					if (img.width) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						property: "og:image:width",
						content: String(img.width)
					}, key++));
					if (img.height) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						property: "og:image:height",
						content: String(img.height)
					}, key++));
					if (img.alt) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						property: "og:image:alt",
						content: img.alt
					}, key++));
				}
			}
		}
		if (og.videos) for (const video of og.videos) {
			elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				property: "og:video",
				content: resolveUrl(video.url)
			}, key++));
			if (video.width) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				property: "og:video:width",
				content: String(video.width)
			}, key++));
			if (video.height) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				property: "og:video:height",
				content: String(video.height)
			}, key++));
		}
		if (og.audio) for (const audio of og.audio) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			property: "og:audio",
			content: resolveUrl(audio.url)
		}, key++));
	}
	if (metadata.twitter) {
		const tw = metadata.twitter;
		if (tw.card) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:card",
			content: tw.card
		}, key++));
		if (tw.site) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:site",
			content: tw.site
		}, key++));
		if (tw.siteId) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:site:id",
			content: tw.siteId
		}, key++));
		if (tw.title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:title",
			content: tw.title
		}, key++));
		if (tw.description) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:description",
			content: tw.description
		}, key++));
		if (tw.creator) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:creator",
			content: tw.creator
		}, key++));
		if (tw.creatorId) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "twitter:creator:id",
			content: tw.creatorId
		}, key++));
		if (tw.images) {
			const imgList = typeof tw.images === "string" || tw.images instanceof URL ? [tw.images] : Array.isArray(tw.images) ? tw.images : [tw.images];
			for (const img of imgList) {
				const imgUrl = typeof img === "string" || img instanceof URL ? img : img.url;
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:image",
					content: resolveUrl(imgUrl)
				}, key++));
				if (typeof img !== "string" && !(img instanceof URL) && img.alt) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:image:alt",
					content: img.alt
				}, key++));
			}
		}
		if (tw.players) {
			const players = Array.isArray(tw.players) ? tw.players : [tw.players];
			for (const player of players) {
				const playerUrl = player.playerUrl.toString();
				const streamUrl = player.streamUrl.toString();
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player",
					content: resolveUrl(playerUrl)
				}, key++));
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player:stream",
					content: resolveUrl(streamUrl)
				}, key++));
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player:width",
					content: String(player.width)
				}, key++));
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: "twitter:player:height",
					content: String(player.height)
				}, key++));
			}
		}
		if (tw.app) {
			const { app } = tw;
			for (const platform of [
				"iphone",
				"ipad",
				"googleplay"
			]) {
				if (app.name) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: `twitter:app:name:${platform}`,
					content: app.name
				}, key++));
				if (app.id[platform] !== void 0) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					name: `twitter:app:id:${platform}`,
					content: String(app.id[platform])
				}, key++));
				if (app.url?.[platform] !== void 0) {
					const appUrl = app.url[platform].toString();
					elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
						name: `twitter:app:url:${platform}`,
						content: resolveUrl(appUrl)
					}, key++));
				}
			}
		}
	}
	if (metadata.icons) {
		const { icon, shortcut, apple, other } = metadata.icons;
		if (shortcut) {
			const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];
			for (const s of shortcuts) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "shortcut icon",
				href: resolveUrl(s)
			}, key++));
		}
		if (icon) {
			const icons = typeof icon === "string" || icon instanceof URL ? [{ url: icon }] : icon;
			for (const i of icons) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "icon",
				href: resolveUrl(i.url),
				...i.sizes ? { sizes: i.sizes } : {},
				...i.type ? { type: i.type } : {},
				...i.media ? { media: i.media } : {}
			}, key++));
		}
		if (apple) {
			const apples = typeof apple === "string" || apple instanceof URL ? [{ url: apple }] : apple;
			for (const a of apples) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "apple-touch-icon",
				href: resolveUrl(a.url),
				...a.sizes ? { sizes: a.sizes } : {},
				...a.type ? { type: a.type } : {}
			}, key++));
		}
		if (other) for (const o of other) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: o.rel,
			href: resolveUrl(o.url),
			...o.sizes ? { sizes: o.sizes } : {}
		}, key++));
	}
	if (metadata.manifest) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
		rel: "manifest",
		href: resolveUrl(metadata.manifest)
	}, key++));
	if (metadata.alternates) {
		const alt = metadata.alternates;
		if (alt.canonical) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "canonical",
			href: resolveUrl(alt.canonical)
		}, key++));
		if (alt.languages) for (const [lang, href] of Object.entries(alt.languages)) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "alternate",
			hrefLang: lang,
			href: resolveUrl(href)
		}, key++));
		if (alt.media) for (const [media, href] of Object.entries(alt.media)) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "alternate",
			media,
			href: resolveUrl(href)
		}, key++));
		if (alt.types) for (const [type, href] of Object.entries(alt.types)) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
			rel: "alternate",
			type,
			href: resolveUrl(href)
		}, key++));
	}
	if (metadata.verification) {
		const v = metadata.verification;
		if (v.google) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "google-site-verification",
			content: v.google
		}, key++));
		if (v.yahoo) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "y_key",
			content: v.yahoo
		}, key++));
		if (v.yandex) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "yandex-verification",
			content: v.yandex
		}, key++));
		if (v.other) for (const [name, content] of Object.entries(v.other)) {
			const values = Array.isArray(content) ? content : [content];
			for (const val of values) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
				name,
				content: val
			}, key++));
		}
	}
	if (metadata.appleWebApp) {
		const awa = metadata.appleWebApp;
		if (awa.capable !== false) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "mobile-web-app-capable",
			content: "yes"
		}, key++));
		if (awa.title) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "apple-mobile-web-app-title",
			content: awa.title
		}, key++));
		if (awa.statusBarStyle) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "apple-mobile-web-app-status-bar-style",
			content: awa.statusBarStyle
		}, key++));
		if (awa.startupImage) {
			const imgs = typeof awa.startupImage === "string" ? [{ url: awa.startupImage }] : awa.startupImage;
			for (const img of imgs) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("link", {
				rel: "apple-touch-startup-image",
				href: resolveUrl(img.url),
				...img.media ? { media: img.media } : {}
			}, key++));
		}
	}
	if (metadata.itunes) {
		const { appId, appArgument } = metadata.itunes;
		let content = `app-id=${appId}`;
		if (appArgument) content += `, app-argument=${appArgument}`;
		elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name: "apple-itunes-app",
			content
		}, key++));
	}
	if (metadata.appLinks) {
		const al = metadata.appLinks;
		for (const platform of [
			"ios",
			"iphone",
			"ipad",
			"android",
			"windows_phone",
			"windows",
			"windows_universal",
			"web"
		]) {
			const entries = al[platform];
			if (!entries) continue;
			const list = Array.isArray(entries) ? entries : [entries];
			for (const entry of list) for (const [k, v] of Object.entries(entry)) {
				if (v === void 0 || v === null) continue;
				const str = String(v);
				const content = k === "url" ? resolveUrl(str) : str;
				elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
					property: `al:${platform}:${k}`,
					content
				}, key++));
			}
		}
	}
	if (metadata.other) for (const [name, content] of Object.entries(metadata.other)) {
		const values = Array.isArray(content) ? content : [content];
		for (const val of values) elements.push(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", {
			name,
			content: val
		}, key++));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(import_jsx_runtime_react_server.Fragment, { children: elements });
}
//#endregion
//#region node_modules/vinext/dist/config/config-matchers.js
/**
* Cache for compiled regex patterns in matchConfigPattern.
*
* Redirect/rewrite patterns are static — they come from next.config.js and
* never change at runtime. Without caching, every request that hits the regex
* branch re-runs the full tokeniser walk + isSafeRegex + new RegExp() for
* every rule in the array. On apps with many locale-prefixed rules (which all
* contain `(` and therefore enter the regex branch) this dominated profiling
* at ~2.4 seconds of CPU self-time.
*
* Value is `null` when safeRegExp rejected the pattern (ReDoS risk), so we
* skip it on subsequent requests too without re-running the scanner.
*/
var _compiledPatternCache = /* @__PURE__ */ new Map();
/**
* Cache for compiled header source regexes in matchHeaders.
*
* Each NextHeader rule has a `source` that is run through escapeHeaderSource()
* then safeRegExp() to produce a RegExp. Both are pure functions of the source
* string and the result never changes. Without caching, every request
* re-runs the full escapeHeaderSource tokeniser + isSafeRegex scan + new RegExp()
* for every header rule.
*
* Value is `null` when safeRegExp rejected the pattern (ReDoS risk).
*/
var _compiledHeaderSourceCache = /* @__PURE__ */ new Map();
/**
* Cache for compiled has/missing condition value regexes in checkSingleCondition.
*
* Each has/missing condition may carry a `value` string that is passed directly
* to safeRegExp() for matching against header/cookie/query/host values. The
* condition objects are static (from next.config.js) so the compiled RegExp
* never changes. Without caching, safeRegExp() is called on every request for
* every condition on every rule.
*
* Value is `null` when safeRegExp rejected the pattern, or `false` when the
* value string was undefined (no regex needed — use exact string comparison).
*/
var _compiledConditionCache = /* @__PURE__ */ new Map();
/**
* Cache for destination substitution regexes in substituteDestinationParams.
*
* The regex depends only on the set of param keys captured from the matched
* source pattern. Caching by sorted key list avoids recompiling a new RegExp
* for repeated redirect/rewrite calls that use the same param shape.
*/
var _compiledDestinationParamCache = /* @__PURE__ */ new Map();
/**
* Redirect index for O(1) locale-static rule lookup.
*
* Many Next.js apps generate 50-100 redirect rules of the form:
*   /:locale(en|es|fr|...)?/some-static-path  →  /some-destination
*
* The compiled regex for each is like:
*   ^/(en|es|fr|...)?/some-static-path$
*
* When no redirect matches (the common case for ordinary page loads),
* matchRedirect previously ran exec() on every one of those regexes —
* ~2ms per call, ~2992ms total self-time in profiles.
*
* The index splits rules into two buckets:
*
*   localeStatic — rules whose source is exactly /:paramName(alt1|alt2|...)?/suffix
*     where `suffix` is a static path with no further params or regex groups.
*     These are indexed in a Map<suffix, entry[]> for O(1) lookup after a
*     single fast strip of the optional locale prefix.
*
*   linear — all other rules. Matched with the original O(n) loop.
*
* The index is stored in a WeakMap keyed by the redirects array so it is
* computed once per config load and GC'd when the array is no longer live.
*
* ## Ordering invariant
*
* Redirect rules must be evaluated in their original order (first match wins).
* Each locale-static entry stores its `originalIndex` so that, when a
* locale-static fast-path match is found, any linear rules that appear earlier
* in the array are still checked first.
*/
/** Matches `/:param(alternation)?/static/suffix` — the locale-static pattern. */
var _LOCALE_STATIC_RE = /^\/:[\w-]+\(([^)]+)\)\?\/([a-zA-Z0-9_~.%@!$&'*+,;=:/-]+)$/;
var _redirectIndexCache = /* @__PURE__ */ new WeakMap();
/**
* Build (or retrieve from cache) the redirect index for a given redirects array.
*
* Called once per config load from matchRedirect. The WeakMap ensures the index
* is recomputed if the config is reloaded (new array reference) and GC'd when
* the array is collected.
*/
function _getRedirectIndex(redirects) {
	let index = _redirectIndexCache.get(redirects);
	if (index !== void 0) return index;
	const localeStatic = /* @__PURE__ */ new Map();
	const linear = [];
	for (let i = 0; i < redirects.length; i++) {
		const redirect = redirects[i];
		const m = _LOCALE_STATIC_RE.exec(redirect.source);
		if (m) {
			const paramName = redirect.source.slice(2, redirect.source.indexOf("("));
			const alternation = m[1];
			const suffix = "/" + m[2];
			const altRe = safeRegExp("^(?:" + alternation + ")$");
			if (!altRe) {
				linear.push([i, redirect]);
				continue;
			}
			const entry = {
				paramName,
				altRe,
				redirect,
				originalIndex: i
			};
			const bucket = localeStatic.get(suffix);
			if (bucket) bucket.push(entry);
			else localeStatic.set(suffix, [entry]);
		} else linear.push([i, redirect]);
	}
	index = {
		localeStatic,
		linear
	};
	_redirectIndexCache.set(redirects, index);
	return index;
}
/** Hop-by-hop headers that should not be forwarded through a proxy. */
var HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailers",
	"transfer-encoding",
	"upgrade"
]);
/**
* Request hop-by-hop headers to strip before proxying with fetch().
* Intentionally narrower than HOP_BY_HOP_HEADERS: external rewrite proxying
* still forwards proxy auth credentials, while response sanitization strips
* them before returning data to the client.
*/
var REQUEST_HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"keep-alive",
	"te",
	"trailers",
	"transfer-encoding",
	"upgrade"
]);
function stripHopByHopRequestHeaders(headers) {
	const connectionTokens = (headers.get("connection") || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
	for (const header of REQUEST_HOP_BY_HOP_HEADERS) headers.delete(header);
	for (const token of connectionTokens) headers.delete(token);
}
/**
* Detect regex patterns vulnerable to catastrophic backtracking (ReDoS).
*
* Uses a lightweight heuristic: scans the pattern string for nested quantifiers
* (a quantifier applied to a group that itself contains a quantifier). This
* catches the most common pathological patterns like `(a+)+`, `(.*)*`,
* `([^/]+)+`, `(a|a+)+` without needing a full regex parser.
*
* Returns true if the pattern appears safe, false if it's potentially dangerous.
*/
function isSafeRegex(pattern) {
	const quantifierAtDepth = [];
	let depth = 0;
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern[i];
		if (ch === "\\") {
			i += 2;
			continue;
		}
		if (ch === "[") {
			i++;
			while (i < pattern.length && pattern[i] !== "]") {
				if (pattern[i] === "\\") i++;
				i++;
			}
			i++;
			continue;
		}
		if (ch === "(") {
			depth++;
			if (quantifierAtDepth.length <= depth) quantifierAtDepth.push(false);
			else quantifierAtDepth[depth] = false;
			i++;
			continue;
		}
		if (ch === ")") {
			const hadQuantifier = depth > 0 && quantifierAtDepth[depth];
			if (depth > 0) depth--;
			const next = pattern[i + 1];
			if (next === "+" || next === "*" || next === "{") {
				if (hadQuantifier) return false;
				if (depth >= 0 && depth < quantifierAtDepth.length) quantifierAtDepth[depth] = true;
			}
			i++;
			continue;
		}
		if (ch === "+" || ch === "*") {
			if (depth > 0) quantifierAtDepth[depth] = true;
			i++;
			continue;
		}
		if (ch === "?") {
			const prev = i > 0 ? pattern[i - 1] : "";
			if (prev !== "+" && prev !== "*" && prev !== "?" && prev !== "}") {
				if (depth > 0) quantifierAtDepth[depth] = true;
			}
			i++;
			continue;
		}
		if (ch === "{") {
			let j = i + 1;
			while (j < pattern.length && /[\d,]/.test(pattern[j])) j++;
			if (j < pattern.length && pattern[j] === "}" && j > i + 1) {
				if (depth > 0) quantifierAtDepth[depth] = true;
				i = j + 1;
				continue;
			}
		}
		i++;
	}
	return true;
}
/**
* Compile a regex pattern safely. Returns the compiled RegExp or null if the
* pattern is invalid or vulnerable to ReDoS.
*
* Logs a warning when a pattern is rejected so developers can fix their config.
*/
function safeRegExp(pattern, flags) {
	if (!isSafeRegex(pattern)) {
		console.warn(`[vinext] Ignoring potentially unsafe regex pattern (ReDoS risk): ${pattern}\n  Patterns with nested quantifiers (e.g. (a+)+) can cause catastrophic backtracking.\n  Simplify the pattern to avoid nested repetition.`);
		return null;
	}
	try {
		return new RegExp(pattern, flags);
	} catch {
		return null;
	}
}
/**
* Convert a Next.js header/rewrite/redirect source pattern into a regex string.
*
* Regex groups in the source (e.g. `(\d+)`) are extracted first, the remaining
* text is escaped/converted in a **single pass** (avoiding chained `.replace()`
* which CodeQL flags as incomplete sanitization), then groups are restored.
*/
function escapeHeaderSource(source) {
	const S = "";
	const groups = [];
	const withPlaceholders = source.replace(/\(([^)]+)\)/g, (_m, inner) => {
		groups.push(inner);
		return `${S}G${groups.length - 1}${S}`;
	});
	let result = "";
	const re = new RegExp(`${S}G(\\d+)${S}|:[\\w-]+|[.+?*]|[^.+?*:\\uE000]+`, "g");
	let m;
	while ((m = re.exec(withPlaceholders)) !== null) if (m[1] !== void 0) result += `(${groups[Number(m[1])]})`;
	else if (m[0].startsWith(":")) {
		const constraintMatch = withPlaceholders.slice(re.lastIndex).match(new RegExp(`^${S}G(\\d+)${S}`));
		if (constraintMatch) {
			re.lastIndex += constraintMatch[0].length;
			result += `(${groups[Number(constraintMatch[1])]})`;
		} else result += "[^/]+";
	} else switch (m[0]) {
		case ".":
			result += "\\.";
			break;
		case "+":
			result += "\\+";
			break;
		case "?":
			result += "\\?";
			break;
		case "*":
			result += ".*";
			break;
		default:
			result += m[0];
			break;
	}
	return result;
}
/**
* Parse a Cookie header string into a key-value record.
*/
function parseCookies(cookieHeader) {
	if (!cookieHeader) return {};
	const cookies = {};
	for (const part of cookieHeader.split(";")) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (key) cookies[key] = value;
	}
	return cookies;
}
/**
* Build a RequestContext from a Web Request object.
*/
function requestContextFromRequest(request) {
	const url = new URL(request.url);
	return {
		headers: request.headers,
		cookies: parseCookies(request.headers.get("cookie")),
		query: url.searchParams,
		host: normalizeHost(request.headers.get("host"), url.hostname)
	};
}
function normalizeHost(hostHeader, fallbackHostname) {
	return (hostHeader ?? fallbackHostname).split(":", 1)[0].toLowerCase();
}
function _emptyParams() {
	return Object.create(null);
}
function _matchConditionValue(actualValue, expectedValue) {
	if (expectedValue === void 0) return _emptyParams();
	const re = _cachedConditionRegex(expectedValue);
	if (re) {
		const match = re.exec(actualValue);
		if (!match) return null;
		const params = _emptyParams();
		if (match.groups) {
			for (const [key, value] of Object.entries(match.groups)) if (value !== void 0) params[key] = value;
		}
		return params;
	}
	return actualValue === expectedValue ? _emptyParams() : null;
}
/**
* Check a single has/missing condition against request context.
* Returns captured params when the condition is satisfied, or null otherwise.
*/
function matchSingleCondition(condition, ctx) {
	switch (condition.type) {
		case "header": {
			const headerValue = ctx.headers.get(condition.key);
			if (headerValue === null) return null;
			return _matchConditionValue(headerValue, condition.value);
		}
		case "cookie": {
			const cookieValue = ctx.cookies[condition.key];
			if (cookieValue === void 0) return null;
			return _matchConditionValue(cookieValue, condition.value);
		}
		case "query": {
			const queryValue = ctx.query.get(condition.key);
			if (queryValue === null) return null;
			return _matchConditionValue(queryValue, condition.value);
		}
		case "host":
			if (condition.value !== void 0) return _matchConditionValue(ctx.host, condition.value);
			return ctx.host === condition.key ? _emptyParams() : null;
		default: return null;
	}
}
/**
* Return a cached RegExp for a has/missing condition value string, compiling
* on first use. Returns null if safeRegExp rejected the pattern or if the
* value is not a valid regex (fall back to exact string comparison).
*/
function _cachedConditionRegex(value) {
	let re = _compiledConditionCache.get(value);
	if (re === void 0) {
		re = safeRegExp(`^${value}$`);
		_compiledConditionCache.set(value, re);
	}
	return re;
}
/**
* Check all has/missing conditions for a config rule.
* Returns true if the rule should be applied (all has conditions pass, all missing conditions pass).
*
* - has: every condition must match (the request must have it)
* - missing: every condition must NOT match (the request must not have it)
*/
function collectConditionParams(has, missing, ctx) {
	const params = _emptyParams();
	if (has) for (const condition of has) {
		const conditionParams = matchSingleCondition(condition, ctx);
		if (!conditionParams) return null;
		Object.assign(params, conditionParams);
	}
	if (missing) {
		for (const condition of missing) if (matchSingleCondition(condition, ctx)) return null;
	}
	return params;
}
function checkHasConditions(has, missing, ctx) {
	return collectConditionParams(has, missing, ctx) !== null;
}
/**
* If the current position in `str` starts with a parenthesized group, consume
* it and advance `re.lastIndex` past the closing `)`. Returns the group
* contents or null if no group is present.
*/
function extractConstraint(str, re) {
	if (str[re.lastIndex] !== "(") return null;
	const start = re.lastIndex + 1;
	let depth = 1;
	let i = start;
	while (i < str.length && depth > 0) {
		if (str[i] === "(") depth++;
		else if (str[i] === ")") depth--;
		i++;
	}
	if (depth !== 0) return null;
	re.lastIndex = i;
	return str.slice(start, i - 1);
}
/**
* Match a Next.js config pattern (from redirects/rewrites sources) against a pathname.
* Returns matched params or null.
*
* Supports:
*   :param     - matches a single path segment
*   :param*    - matches zero or more segments (catch-all)
*   :param+    - matches one or more segments
*   (regex)    - inline regex patterns in the source
*   :param(constraint) - named param with inline regex constraint
*/
function matchConfigPattern(pathname, pattern) {
	if (pattern.includes("(") || pattern.includes("\\") || /:[\w-]+[*+][^/]/.test(pattern) || /:[\w-]+\./.test(pattern)) try {
		let compiled = _compiledPatternCache.get(pattern);
		if (compiled === void 0) {
			const paramNames = [];
			let regexStr = "";
			const tokenRe = /:([\w-]+)|[.]|[^:.]+/g;
			let tok;
			while ((tok = tokenRe.exec(pattern)) !== null) if (tok[1] !== void 0) {
				const name = tok[1];
				const rest = pattern.slice(tokenRe.lastIndex);
				if (rest.startsWith("*") || rest.startsWith("+")) {
					const quantifier = rest[0];
					tokenRe.lastIndex += 1;
					const constraint = extractConstraint(pattern, tokenRe);
					paramNames.push(name);
					if (constraint !== null) regexStr += `(${constraint})`;
					else regexStr += quantifier === "*" ? "(.*)" : "(.+)";
				} else {
					const constraint = extractConstraint(pattern, tokenRe);
					paramNames.push(name);
					regexStr += constraint !== null ? `(${constraint})` : "([^/]+)";
				}
			} else if (tok[0] === ".") regexStr += "\\.";
			else regexStr += tok[0];
			const re = safeRegExp("^" + regexStr + "$");
			compiled = re ? {
				re,
				paramNames
			} : null;
			_compiledPatternCache.set(pattern, compiled);
		}
		if (!compiled) return null;
		const match = compiled.re.exec(pathname);
		if (!match) return null;
		const params = Object.create(null);
		for (let i = 0; i < compiled.paramNames.length; i++) params[compiled.paramNames[i]] = match[i + 1] ?? "";
		return params;
	} catch {}
	const catchAllMatch = pattern.match(/:([\w-]+)(\*|\+)$/);
	if (catchAllMatch) {
		const prefix = pattern.slice(0, pattern.lastIndexOf(":"));
		const paramName = catchAllMatch[1];
		const isPlus = catchAllMatch[2] === "+";
		const prefixNoSlash = prefix.replace(/\/$/, "");
		if (!pathname.startsWith(prefixNoSlash)) return null;
		const charAfter = pathname[prefixNoSlash.length];
		if (charAfter !== void 0 && charAfter !== "/") return null;
		const rest = pathname.slice(prefixNoSlash.length);
		if (isPlus && (!rest || rest === "/")) return null;
		let restValue = rest.startsWith("/") ? rest.slice(1) : rest;
		return { [paramName]: restValue };
	}
	const parts = pattern.split("/");
	const pathParts = pathname.split("/");
	if (parts.length !== pathParts.length) return null;
	const params = Object.create(null);
	for (let i = 0; i < parts.length; i++) if (parts[i].startsWith(":")) params[parts[i].slice(1)] = pathParts[i];
	else if (parts[i] !== pathParts[i]) return null;
	return params;
}
/**
* Apply redirect rules from next.config.js.
* Returns the redirect info if a redirect was matched, or null.
*
* `ctx` provides the request context (cookies, headers, query, host) used
* to evaluate has/missing conditions. Next.js always has request context
* when evaluating redirects, so this parameter is required.
*
* ## Performance
*
* Rules with a locale-capture-group prefix (the dominant pattern in large
* Next.js apps — e.g. `/:locale(en|es|fr|...)?/some-path`) are handled via
* a pre-built index. Instead of running exec() on each locale regex
* individually, we:
*
*   1. Strip the optional locale prefix from the pathname with one cheap
*      string-slice check (no regex exec on the hot path).
*   2. Look up the stripped suffix in a Map<suffix, entry[]>.
*   3. For each matching entry, validate the captured locale string against
*      a small, anchored alternation regex.
*
* This reduces the per-request cost from O(n × regex) to O(1) map lookup +
* O(matches × tiny-regex), eliminating the ~2992ms self-time reported in
* profiles for apps with 63+ locale-prefixed rules.
*
* Rules that don't fit the locale-static pattern fall back to the original
* linear matchConfigPattern scan.
*
* ## Ordering invariant
*
* First match wins, preserving the original redirect array order. When a
* locale-static fast-path match is found at position N, all linear rules with
* an original index < N are checked via matchConfigPattern first — they are
* few in practice (typically zero) so this is not a hot-path concern.
*/
function matchRedirect(pathname, redirects, ctx) {
	if (redirects.length === 0) return null;
	const index = _getRedirectIndex(redirects);
	let localeMatch = null;
	let localeMatchIndex = Infinity;
	if (index.localeStatic.size > 0) {
		const noLocaleBucket = index.localeStatic.get(pathname);
		if (noLocaleBucket) for (const entry of noLocaleBucket) {
			if (entry.originalIndex >= localeMatchIndex) continue;
			const redirect = entry.redirect;
			const conditionParams = redirect.has || redirect.missing ? collectConditionParams(redirect.has, redirect.missing, ctx) : _emptyParams();
			if (!conditionParams) continue;
			let dest = substituteDestinationParams(redirect.destination, {
				[entry.paramName]: "",
				...conditionParams
			});
			dest = sanitizeDestination(dest);
			localeMatch = {
				destination: dest,
				permanent: redirect.permanent
			};
			localeMatchIndex = entry.originalIndex;
			break;
		}
		const slashTwo = pathname.indexOf("/", 1);
		if (slashTwo !== -1) {
			const suffix = pathname.slice(slashTwo);
			const localePart = pathname.slice(1, slashTwo);
			const localeBucket = index.localeStatic.get(suffix);
			if (localeBucket) for (const entry of localeBucket) {
				if (entry.originalIndex >= localeMatchIndex) continue;
				if (!entry.altRe.test(localePart)) continue;
				const redirect = entry.redirect;
				const conditionParams = redirect.has || redirect.missing ? collectConditionParams(redirect.has, redirect.missing, ctx) : _emptyParams();
				if (!conditionParams) continue;
				let dest = substituteDestinationParams(redirect.destination, {
					[entry.paramName]: localePart,
					...conditionParams
				});
				dest = sanitizeDestination(dest);
				localeMatch = {
					destination: dest,
					permanent: redirect.permanent
				};
				localeMatchIndex = entry.originalIndex;
				break;
			}
		}
	}
	for (const [origIdx, redirect] of index.linear) {
		if (origIdx >= localeMatchIndex) break;
		const params = matchConfigPattern(pathname, redirect.source);
		if (params) {
			const conditionParams = redirect.has || redirect.missing ? collectConditionParams(redirect.has, redirect.missing, ctx) : _emptyParams();
			if (!conditionParams) continue;
			let dest = substituteDestinationParams(redirect.destination, {
				...params,
				...conditionParams
			});
			dest = sanitizeDestination(dest);
			return {
				destination: dest,
				permanent: redirect.permanent
			};
		}
	}
	return localeMatch;
}
/**
* Apply rewrite rules from next.config.js.
* Returns the rewritten URL or null if no rewrite matched.
*
* `ctx` provides the request context (cookies, headers, query, host) used
* to evaluate has/missing conditions. Next.js always has request context
* when evaluating rewrites, so this parameter is required.
*/
function matchRewrite(pathname, rewrites, ctx) {
	for (const rewrite of rewrites) {
		const params = matchConfigPattern(pathname, rewrite.source);
		if (params) {
			const conditionParams = rewrite.has || rewrite.missing ? collectConditionParams(rewrite.has, rewrite.missing, ctx) : _emptyParams();
			if (!conditionParams) continue;
			let dest = substituteDestinationParams(rewrite.destination, {
				...params,
				...conditionParams
			});
			dest = sanitizeDestination(dest);
			return dest;
		}
	}
	return null;
}
/**
* Substitute all matched route params into a redirect/rewrite destination.
*
* Handles repeated params (e.g. `/api/:id/:id`) and catch-all suffix forms
* (`:path*`, `:path+`) in a single pass. Unknown params are left intact.
*/
function substituteDestinationParams(destination, params) {
	const keys = Object.keys(params);
	if (keys.length === 0) return destination;
	const sortedKeys = [...keys].sort((a, b) => b.length - a.length);
	const cacheKey = sortedKeys.join("\0");
	let paramRe = _compiledDestinationParamCache.get(cacheKey);
	if (!paramRe) {
		const paramAlternation = sortedKeys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
		paramRe = new RegExp(`:(${paramAlternation})([+*])?(?![A-Za-z0-9_])`, "g");
		_compiledDestinationParamCache.set(cacheKey, paramRe);
	}
	return destination.replace(paramRe, (_token, key) => params[key]);
}
/**
* Sanitize a redirect/rewrite destination to collapse protocol-relative URLs.
*
* After parameter substitution, a destination like `/:path*` can become
* `//evil.com` if the catch-all captured a decoded `%2F` (`/evil.com`).
* Browsers interpret `//evil.com` as a protocol-relative URL, redirecting
* users off-site.
*
* This function collapses any leading double (or more) slashes to a single
* slash for non-external (relative) destinations.
*/
function sanitizeDestination(dest) {
	if (dest.startsWith("http://") || dest.startsWith("https://")) return dest;
	dest = dest.replace(/^[\\/]+/, "/");
	return dest;
}
/**
* Check if a URL is external (absolute URL or protocol-relative).
* Detects any URL scheme (http:, https:, data:, javascript:, blob:, etc.)
* per RFC 3986, plus protocol-relative URLs (//).
*/
function isExternalUrl(url) {
	return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//");
}
/**
* Proxy an incoming request to an external URL and return the upstream response.
*
* Used for external rewrites (e.g. `/ph/:path*` → `https://us.i.posthog.com/:path*`).
* Next.js handles these as server-side reverse proxies, forwarding the request
* method, headers, and body to the external destination.
*
* Works in all runtimes (Node.js, Cloudflare Workers) via the standard fetch() API.
*/
async function proxyExternalRequest(request, externalUrl) {
	const originalUrl = new URL(request.url);
	const targetUrl = new URL(externalUrl);
	const destinationKeys = new Set(targetUrl.searchParams.keys());
	for (const [key, value] of originalUrl.searchParams) if (!destinationKeys.has(key)) targetUrl.searchParams.append(key, value);
	const headers = new Headers(request.headers);
	headers.set("host", targetUrl.host);
	stripHopByHopRequestHeaders(headers);
	const keysToDelete = [];
	for (const key of headers.keys()) if (key.startsWith("x-middleware-")) keysToDelete.push(key);
	for (const key of keysToDelete) headers.delete(key);
	headers.delete("x-vinext-prerender-secret");
	const method = request.method;
	const hasBody = method !== "GET" && method !== "HEAD";
	const init = {
		method,
		headers,
		redirect: "manual"
	};
	if (hasBody && request.body) {
		init.body = request.body;
		init.duplex = "half";
	}
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 3e4);
	let upstreamResponse;
	try {
		upstreamResponse = await fetch(targetUrl.href, {
			...init,
			signal: controller.signal
		});
	} catch (e) {
		if (e instanceof Error && e.name === "AbortError") {
			console.error("[vinext] External rewrite proxy timeout:", targetUrl.href);
			return new Response("Gateway Timeout", { status: 504 });
		}
		console.error("[vinext] External rewrite proxy error:", e);
		return new Response("Bad Gateway", { status: 502 });
	} finally {
		clearTimeout(timeout);
	}
	const isNodeRuntime = typeof process !== "undefined" && !!process.versions?.node;
	const responseHeaders = new Headers();
	upstreamResponse.headers.forEach((value, key) => {
		const lower = key.toLowerCase();
		if (HOP_BY_HOP_HEADERS.has(lower)) return;
		if (isNodeRuntime && (lower === "content-encoding" || lower === "content-length")) return;
		responseHeaders.append(key, value);
	});
	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders
	});
}
/**
* Apply custom header rules from next.config.js.
* Returns an array of { key, value } pairs to set on the response.
*
* `ctx` provides the request context (cookies, headers, query, host) used
* to evaluate has/missing conditions. Next.js always has request context
* when evaluating headers, so this parameter is required.
*/
function matchHeaders(pathname, headers, ctx) {
	const result = [];
	for (const rule of headers) {
		let sourceRegex = _compiledHeaderSourceCache.get(rule.source);
		if (sourceRegex === void 0) {
			sourceRegex = safeRegExp("^" + escapeHeaderSource(rule.source) + "$");
			_compiledHeaderSourceCache.set(rule.source, sourceRegex);
		}
		if (sourceRegex && sourceRegex.test(pathname)) {
			if (rule.has || rule.missing) {
				if (!checkHasConditions(rule.has, rule.missing, ctx)) continue;
			}
			result.push(...rule.headers);
		}
	}
	return result;
}
//#endregion
//#region node_modules/vinext/dist/server/request-pipeline.js
/**
* Shared request pipeline utilities.
*
* Extracted from the App Router RSC entry (entries/app-rsc-entry.ts) to enable
* reuse across entry points. Currently consumed by app-rsc-entry.ts;
* dev-server.ts, prod-server.ts, and index.ts still have inline versions
* that should be migrated in follow-up work.
*
* These utilities handle the common request lifecycle steps: protocol-
* relative URL guards, basePath stripping, trailing slash normalization,
* and CSRF origin validation.
*/
/**
* Guard against protocol-relative URL open redirects.
*
* Paths like `//example.com/` would be redirected to `//example.com` by the
* trailing-slash normalizer, which browsers interpret as `http://example.com`.
* Backslashes are equivalent to forward slashes in the URL spec
* (e.g. `/\evil.com` is treated as `//evil.com` by browsers).
*
* Next.js returns 404 for these paths. We check the RAW pathname before
* normalization so the guard fires before normalizePath collapses `//`.
*
* @param rawPathname - The raw pathname from the URL, before any normalization
* @returns A 404 Response if the path is protocol-relative, or null to continue
*/
function guardProtocolRelativeUrl(rawPathname) {
	if (rawPathname.replaceAll("\\", "/").startsWith("//")) return new Response("404 Not Found", { status: 404 });
	return null;
}
/**
* Check if the pathname needs a trailing slash redirect, and return the
* redirect Response if so.
*
* Follows Next.js behavior:
* - `/api` routes are never redirected
* - The root path `/` is never redirected
* - If `trailingSlash` is true, redirect `/about` → `/about/`
* - If `trailingSlash` is false (default), redirect `/about/` → `/about`
*
* @param pathname - The basePath-stripped pathname
* @param basePath - The basePath to prepend to the redirect Location
* @param trailingSlash - Whether trailing slashes should be enforced
* @param search - The query string (including `?`) to preserve in the redirect
* @returns A 308 redirect Response, or null if no redirect is needed
*/
function normalizeTrailingSlash(pathname, basePath, trailingSlash, search) {
	if (pathname === "/" || pathname === "/api" || pathname.startsWith("/api/")) return null;
	const hasTrailing = pathname.endsWith("/");
	if (trailingSlash && !hasTrailing && !pathname.endsWith(".rsc")) return new Response(null, {
		status: 308,
		headers: { Location: basePath + pathname + "/" + search }
	});
	if (!trailingSlash && hasTrailing) return new Response(null, {
		status: 308,
		headers: { Location: basePath + pathname.replace(/\/+$/, "") + search }
	});
	return null;
}
/**
* Validate CSRF origin for server action requests.
*
* Matches Next.js behavior: compares the Origin header against the Host
* header. If they don't match, the request is rejected with 403 unless
* the origin is in the allowedOrigins list.
*
* @param request - The incoming Request
* @param allowedOrigins - Origins from experimental.serverActions.allowedOrigins
* @returns A 403 Response if origin validation fails, or null to continue
*/
function validateCsrfOrigin(request, allowedOrigins = []) {
	const originHeader = request.headers.get("origin");
	if (!originHeader) return null;
	if (originHeader === "null") {
		if (allowedOrigins.includes("null")) return null;
		console.warn(`[vinext] CSRF origin "null" blocked for server action. To allow requests from sandboxed contexts, add "null" to experimental.serverActions.allowedOrigins.`);
		return new Response("Forbidden", {
			status: 403,
			headers: { "Content-Type": "text/plain" }
		});
	}
	let originHost;
	try {
		originHost = new URL(originHeader).host.toLowerCase();
	} catch {
		return new Response("Forbidden", {
			status: 403,
			headers: { "Content-Type": "text/plain" }
		});
	}
	const hostHeader = (request.headers.get("host") || "").split(",")[0].trim().toLowerCase() || new URL(request.url).host.toLowerCase();
	if (originHost === hostHeader) return null;
	if (allowedOrigins.length > 0 && isOriginAllowed(originHost, allowedOrigins)) return null;
	console.warn(`[vinext] CSRF origin mismatch: origin "${originHost}" does not match host "${hostHeader}". Blocking server action request.`);
	return new Response("Forbidden", {
		status: 403,
		headers: { "Content-Type": "text/plain" }
	});
}
/**
* Reject malformed Flight container reference graphs in server action payloads.
*
* `@vitejs/plugin-rsc` vendors its own React Flight decoder. Malicious action
* payloads can abuse container references (`$Q`, `$W`, `$i`) to trigger very
* expensive deserialization before the action is even looked up.
*
* Legitimate React-encoded container payloads use separate numeric backing
* fields (e.g. field `1` plus root field `0` containing `"$Q1"`). We reject
* numeric backing-field graphs that contain missing backing fields or cycles.
* Regular user form fields are ignored entirely.
*/
async function validateServerActionPayload(body) {
	const containerRefRe = /"\$([QWi])(\d+)"/g;
	const fieldRefs = /* @__PURE__ */ new Map();
	const collectRefs = (fieldKey, text) => {
		const refs = /* @__PURE__ */ new Set();
		let match;
		containerRefRe.lastIndex = 0;
		while ((match = containerRefRe.exec(text)) !== null) refs.add(match[2]);
		fieldRefs.set(fieldKey, refs);
	};
	if (typeof body === "string") collectRefs("0", body);
	else for (const [key, value] of body.entries()) {
		if (!/^\d+$/.test(key)) continue;
		if (typeof value === "string") {
			collectRefs(key, value);
			continue;
		}
		if (typeof value?.text === "function") collectRefs(key, await value.text());
	}
	if (fieldRefs.size === 0) return null;
	const knownFields = new Set(fieldRefs.keys());
	for (const refs of fieldRefs.values()) for (const ref of refs) if (!knownFields.has(ref)) return new Response("Invalid server action payload", {
		status: 400,
		headers: { "Content-Type": "text/plain" }
	});
	const visited = /* @__PURE__ */ new Set();
	const stack = /* @__PURE__ */ new Set();
	const hasCycle = (node) => {
		if (stack.has(node)) return true;
		if (visited.has(node)) return false;
		visited.add(node);
		stack.add(node);
		for (const ref of fieldRefs.get(node) ?? []) if (hasCycle(ref)) return true;
		stack.delete(node);
		return false;
	};
	for (const node of fieldRefs.keys()) if (hasCycle(node)) return new Response("Invalid server action payload", {
		status: 400,
		headers: { "Content-Type": "text/plain" }
	});
	return null;
}
/**
* Check if an origin matches any pattern in the allowed origins list.
* Supports wildcard subdomains (e.g. `*.example.com`).
*/
/**
* Segment-by-segment domain matching for wildcard origin patterns.
* `*` matches exactly one DNS label; `**` matches one or more labels.
*
* Ported from Next.js: packages/next/src/server/app-render/csrf-protection.ts
* https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/csrf-protection.ts
*/
function matchWildcardDomain(domain, pattern) {
	const normalizedDomain = domain.replace(/[A-Z]/g, (c) => c.toLowerCase());
	const normalizedPattern = pattern.replace(/[A-Z]/g, (c) => c.toLowerCase());
	const domainParts = normalizedDomain.split(".");
	const patternParts = normalizedPattern.split(".");
	if (patternParts.length < 1) return false;
	if (domainParts.length < patternParts.length) return false;
	if (patternParts.length === 1 && (patternParts[0] === "*" || patternParts[0] === "**")) return false;
	while (patternParts.length) {
		const patternPart = patternParts.pop();
		const domainPart = domainParts.pop();
		switch (patternPart) {
			case "": return false;
			case "*": if (domainPart) continue;
			else return false;
			case "**":
				if (patternParts.length > 0) return false;
				return domainPart !== void 0;
			default: if (patternPart !== domainPart) return false;
		}
	}
	return domainParts.length === 0;
}
function isOriginAllowed(origin, allowed) {
	for (const pattern of allowed) if (pattern.includes("*")) {
		if (matchWildcardDomain(origin, pattern)) return true;
	} else if (origin.toLowerCase() === pattern.toLowerCase()) return true;
	return false;
}
/**
* Validate an image optimization URL parameter.
*
* Ensures the URL is a relative path that doesn't escape the origin:
* - Must start with "/" but not "//"
* - Backslashes are normalized (browsers treat `\` as `/`)
* - Origin validation as defense-in-depth
*
* @param rawUrl - The raw `url` query parameter value
* @param requestUrl - The full request URL for origin comparison
* @returns An error Response if validation fails, or the normalized image URL
*/
function validateImageUrl(rawUrl, requestUrl) {
	const imgUrl = rawUrl?.replaceAll("\\", "/") ?? null;
	if (!imgUrl || !imgUrl.startsWith("/") || imgUrl.startsWith("//")) return new Response(!rawUrl ? "Missing url parameter" : "Only relative URLs allowed", { status: 400 });
	const url = new URL(requestUrl);
	if (new URL(imgUrl, url.origin).origin !== url.origin) return new Response("Only relative URLs allowed", { status: 400 });
	return imgUrl;
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-runtime.js
var ROUTE_HANDLER_HTTP_METHODS = [
	"GET",
	"HEAD",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
	"OPTIONS"
];
function collectRouteHandlerMethods(handler) {
	const methods = ROUTE_HANDLER_HTTP_METHODS.filter((method) => typeof handler[method] === "function");
	if (methods.includes("GET") && !methods.includes("HEAD")) methods.push("HEAD");
	return methods;
}
function buildRouteHandlerAllowHeader(exportedMethods) {
	const allow = new Set(exportedMethods);
	allow.add("OPTIONS");
	return Array.from(allow).sort().join(", ");
}
var _KNOWN_DYNAMIC_APP_ROUTE_HANDLERS_KEY = Symbol.for("vinext.appRouteHandlerRuntime.knownDynamicHandlers");
var _g$4 = globalThis;
var knownDynamicAppRouteHandlers = _g$4[_KNOWN_DYNAMIC_APP_ROUTE_HANDLERS_KEY] ??= /* @__PURE__ */ new Set();
function isKnownDynamicAppRoute(pattern) {
	return knownDynamicAppRouteHandlers.has(pattern);
}
function markKnownDynamicAppRoute(pattern) {
	knownDynamicAppRouteHandlers.add(pattern);
}
function bindMethodIfNeeded(value, target) {
	return typeof value === "function" ? value.bind(target) : value;
}
function buildNextConfig(options) {
	if (!options.basePath && !options.i18n) return null;
	return {
		basePath: options.basePath,
		i18n: options.i18n ?? void 0
	};
}
function rebuildRequestWithHeaders(input, headers) {
	const method = input.method;
	const hasBody = method !== "GET" && method !== "HEAD";
	const init = {
		method,
		headers,
		cache: input.cache,
		credentials: input.credentials,
		integrity: input.integrity,
		keepalive: input.keepalive,
		mode: input.mode,
		redirect: input.redirect,
		referrer: input.referrer,
		referrerPolicy: input.referrerPolicy,
		signal: input.signal
	};
	if (hasBody && input.body) {
		init.body = input.body;
		init.duplex = "half";
	}
	return new Request(input.url, init);
}
function createTrackedAppRouteRequest(request, options = {}) {
	let didAccessDynamicRequest = false;
	const nextConfig = buildNextConfig(options);
	const markDynamicAccess = (access) => {
		didAccessDynamicRequest = true;
		options.onDynamicAccess?.(access);
	};
	const wrapNextUrl = (nextUrl) => {
		return new Proxy(nextUrl, { get(target, prop) {
			switch (prop) {
				case "search":
				case "searchParams":
				case "url":
				case "href":
				case "toJSON":
				case "toString":
				case "origin":
					markDynamicAccess(`nextUrl.${String(prop)}`);
					return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
				case "clone": return () => wrapNextUrl(target.clone());
				default: return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
			}
		} });
	};
	const wrapRequest = (input) => {
		const requestHeaders = options.middlewareHeaders ? buildRequestHeadersFromMiddlewareResponse(input.headers, options.middlewareHeaders) : null;
		const requestWithOverrides = requestHeaders ? rebuildRequestWithHeaders(input, requestHeaders) : input;
		const nextRequest = requestWithOverrides instanceof NextRequest ? requestWithOverrides : new NextRequest(requestWithOverrides, { nextConfig: nextConfig ?? void 0 });
		let proxiedNextUrl = null;
		return new Proxy(nextRequest, { get(target, prop) {
			switch (prop) {
				case "nextUrl":
					proxiedNextUrl ??= wrapNextUrl(target.nextUrl);
					return proxiedNextUrl;
				case "headers":
				case "cookies":
				case "url":
				case "body":
				case "blob":
				case "json":
				case "text":
				case "arrayBuffer":
				case "formData":
					markDynamicAccess(`request.${String(prop)}`);
					return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
				case "clone": return () => wrapRequest(target.clone());
				default: return bindMethodIfNeeded(Reflect.get(target, prop, target), target);
			}
		} });
	};
	return {
		request: wrapRequest(request),
		didAccessDynamicRequest() {
			return didAccessDynamicRequest;
		}
	};
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-policy.js
function getAppRouteHandlerRevalidateSeconds(handler) {
	const { revalidate } = handler;
	if (typeof revalidate !== "number" || !Number.isFinite(revalidate) || revalidate < 0) return null;
	return revalidate;
}
function hasAppRouteHandlerDefaultExport(handler) {
	return typeof handler.default === "function";
}
function resolveAppRouteHandlerMethod(handler, method) {
	const exportedMethods = collectRouteHandlerMethods(handler);
	const allowHeaderForOptions = buildRouteHandlerAllowHeader(exportedMethods);
	const shouldAutoRespondToOptions = method === "OPTIONS" && typeof handler.OPTIONS !== "function";
	let handlerFn = typeof handler[method] === "function" ? handler[method] : void 0;
	let isAutoHead = false;
	if (method === "HEAD" && typeof handler.HEAD !== "function" && typeof handler.GET === "function") {
		handlerFn = handler.GET;
		isAutoHead = true;
	}
	return {
		allowHeaderForOptions,
		exportedMethods,
		handlerFn,
		isAutoHead,
		shouldAutoRespondToOptions
	};
}
function shouldReadAppRouteHandlerCache(options) {
	return options.isProduction && options.revalidateSeconds !== null && options.revalidateSeconds > 0 && options.dynamicConfig !== "force-dynamic" && !options.isKnownDynamic && (options.method === "GET" || options.isAutoHead) && typeof options.handlerFn === "function";
}
function shouldApplyAppRouteHandlerRevalidateHeader(options) {
	return options.revalidateSeconds !== null && !options.dynamicUsedInHandler && (options.method === "GET" || options.isAutoHead) && !options.handlerSetCacheControl;
}
function shouldWriteAppRouteHandlerCache(options) {
	return options.isProduction && options.revalidateSeconds !== null && options.revalidateSeconds > 0 && options.dynamicConfig !== "force-dynamic" && shouldApplyAppRouteHandlerRevalidateHeader(options);
}
function resolveAppRouteHandlerSpecialError(error, requestUrl) {
	if (!(error && typeof error === "object" && "digest" in error)) return null;
	const digest = String(error.digest);
	if (digest.startsWith("NEXT_REDIRECT;")) {
		const parts = digest.split(";");
		const redirectUrl = decodeURIComponent(parts[2]);
		return {
			kind: "redirect",
			location: new URL(redirectUrl, requestUrl).toString(),
			statusCode: parts[3] ? parseInt(parts[3], 10) : 307
		};
	}
	if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) return {
		kind: "status",
		statusCode: digest === "NEXT_NOT_FOUND" ? 404 : parseInt(digest.split(";")[1], 10)
	};
	return null;
}
//#endregion
//#region node_modules/vinext/dist/server/middleware-response-headers.js
var ADDITIVE_RESPONSE_HEADER_NAMES = new Set(["set-cookie", "vary"]);
/**
* Merge middleware response headers into a target Headers object.
*
* Set-Cookie and Vary are accumulated (append) since multiple sources can
* contribute values. All other headers use set() so middleware owns singular
* response headers like Cache-Control.
*/
function mergeMiddlewareResponseHeaders(target, middlewareHeaders) {
	if (!middlewareHeaders) return;
	for (const [key, value] of middlewareHeaders) {
		if (ADDITIVE_RESPONSE_HEADER_NAMES.has(key.toLowerCase())) {
			target.append(key, value);
			continue;
		}
		target.set(key, value);
	}
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-response.js
var NEVER_CACHE_CONTROL = "private, no-cache, no-store, max-age=0, must-revalidate";
function buildRouteHandlerCacheControl(cacheState, revalidateSeconds) {
	if (revalidateSeconds === 0) return NEVER_CACHE_CONTROL;
	if (cacheState === "STALE") return "s-maxage=0, stale-while-revalidate";
	return `s-maxage=${revalidateSeconds}, stale-while-revalidate`;
}
function applyRouteHandlerMiddlewareContext(response, middlewareContext) {
	if (!middlewareContext.headers && middlewareContext.status == null) return response;
	const responseHeaders = new Headers(response.headers);
	mergeMiddlewareResponseHeaders(responseHeaders, middlewareContext.headers);
	return new Response(response.body, {
		status: middlewareContext.status ?? response.status,
		statusText: response.statusText,
		headers: responseHeaders
	});
}
function buildRouteHandlerCachedResponse(cachedValue, options) {
	const headers = new Headers();
	for (const [key, value] of Object.entries(cachedValue.headers)) if (Array.isArray(value)) for (const entry of value) headers.append(key, entry);
	else headers.set(key, value);
	headers.set("X-Vinext-Cache", options.cacheState);
	headers.set("Cache-Control", buildRouteHandlerCacheControl(options.cacheState, options.revalidateSeconds));
	return new Response(options.isHead ? null : cachedValue.body, {
		status: cachedValue.status,
		headers
	});
}
function applyRouteHandlerRevalidateHeader(response, revalidateSeconds) {
	response.headers.set("cache-control", buildRouteHandlerCacheControl("HIT", revalidateSeconds));
}
function markRouteHandlerCacheMiss(response) {
	response.headers.set("X-Vinext-Cache", "MISS");
}
async function buildAppRouteCacheValue(response) {
	const body = await response.arrayBuffer();
	const headers = {};
	response.headers.forEach((value, key) => {
		if (key === "set-cookie" || key === "x-vinext-cache" || key === "cache-control") return;
		headers[key] = value;
	});
	const setCookies = response.headers.getSetCookie?.() ?? [];
	if (setCookies.length > 0) headers["set-cookie"] = setCookies;
	return {
		kind: "APP_ROUTE",
		body,
		status: response.status,
		headers
	};
}
function finalizeRouteHandlerResponse(response, options) {
	const { pendingCookies, draftCookie, isHead } = options;
	if (pendingCookies.length === 0 && !draftCookie && !isHead) return response;
	const headers = new Headers(response.headers);
	for (const cookie of pendingCookies) headers.append("Set-Cookie", cookie);
	if (draftCookie) headers.append("Set-Cookie", draftCookie);
	return new Response(isHead ? null : response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-execution.js
async function runAppRouteHandler(options) {
	options.consumeDynamicUsage();
	const trackedRequest = createTrackedAppRouteRequest(options.request, {
		basePath: options.basePath,
		i18n: options.i18n,
		middlewareHeaders: options.middlewareRequestHeaders,
		onDynamicAccess() {
			options.markDynamicUsage();
		}
	});
	const response = await options.handlerFn(trackedRequest.request, { params: options.params });
	return {
		dynamicUsedInHandler: options.consumeDynamicUsage(),
		response
	};
}
async function executeAppRouteHandler(options) {
	const previousHeadersPhase = options.setHeadersAccessPhase("route-handler");
	try {
		const { dynamicUsedInHandler, response } = await runAppRouteHandler(options);
		const handlerSetCacheControl = response.headers.has("cache-control");
		if (dynamicUsedInHandler) markKnownDynamicAppRoute(options.routePattern);
		if (shouldApplyAppRouteHandlerRevalidateHeader({
			dynamicUsedInHandler,
			handlerSetCacheControl,
			isAutoHead: options.isAutoHead,
			method: options.method,
			revalidateSeconds: options.revalidateSeconds
		})) {
			const revalidateSeconds = options.revalidateSeconds;
			if (revalidateSeconds == null) throw new Error("Expected route handler revalidate seconds");
			applyRouteHandlerRevalidateHeader(response, revalidateSeconds);
		}
		if (shouldWriteAppRouteHandlerCache({
			dynamicConfig: options.handler.dynamic,
			dynamicUsedInHandler,
			handlerSetCacheControl,
			isAutoHead: options.isAutoHead,
			isProduction: options.isProduction,
			method: options.method,
			revalidateSeconds: options.revalidateSeconds
		})) {
			markRouteHandlerCacheMiss(response);
			const routeClone = response.clone();
			const routeKey = options.isrRouteKey(options.cleanPathname);
			const revalidateSeconds = options.revalidateSeconds;
			if (revalidateSeconds == null) throw new Error("Expected route handler cache revalidate seconds");
			const routeTags = options.buildPageCacheTags(options.cleanPathname, options.getCollectedFetchTags());
			const routeWritePromise = (async () => {
				try {
					const routeCacheValue = await buildAppRouteCacheValue(routeClone);
					await options.isrSet(routeKey, routeCacheValue, revalidateSeconds, routeTags);
					options.isrDebug?.("route cache written", routeKey);
				} catch (cacheErr) {
					console.error("[vinext] ISR route cache write error:", cacheErr);
				}
			})();
			options.executionContext?.waitUntil(routeWritePromise);
		}
		const pendingCookies = options.getAndClearPendingCookies();
		const draftCookie = options.getDraftModeCookieHeader();
		options.clearRequestContext();
		return applyRouteHandlerMiddlewareContext(finalizeRouteHandlerResponse(response, {
			pendingCookies,
			draftCookie,
			isHead: options.isAutoHead
		}), options.middlewareContext);
	} catch (error) {
		options.getAndClearPendingCookies();
		const specialError = resolveAppRouteHandlerSpecialError(error, options.request.url);
		options.clearRequestContext();
		if (specialError) {
			if (specialError.kind === "redirect") return applyRouteHandlerMiddlewareContext(new Response(null, {
				status: specialError.statusCode,
				headers: { Location: specialError.location }
			}), options.middlewareContext);
			return applyRouteHandlerMiddlewareContext(new Response(null, { status: specialError.statusCode }), options.middlewareContext);
		}
		console.error("[vinext] Route handler error:", error);
		options.reportRequestError(error instanceof Error ? error : new Error(String(error)), {
			path: options.cleanPathname,
			method: options.request.method,
			headers: Object.fromEntries(options.request.headers.entries())
		}, {
			routerKind: "App Router",
			routePath: options.routePattern,
			routeType: "route"
		});
		return applyRouteHandlerMiddlewareContext(new Response(null, { status: 500 }), options.middlewareContext);
	} finally {
		options.setHeadersAccessPhase(previousHeadersPhase);
	}
}
//#endregion
//#region node_modules/vinext/dist/server/app-route-handler-cache.js
function getCachedAppRouteValue(entry) {
	return entry?.value.value && entry.value.value.kind === "APP_ROUTE" ? entry.value.value : null;
}
async function readAppRouteHandlerCacheResponse(options) {
	const routeKey = options.isrRouteKey(options.cleanPathname);
	try {
		const cached = await options.isrGet(routeKey);
		const cachedValue = getCachedAppRouteValue(cached);
		if (cachedValue && !cached?.isStale) {
			options.isrDebug?.("HIT (route)", options.cleanPathname);
			options.clearRequestContext();
			return applyRouteHandlerMiddlewareContext(buildRouteHandlerCachedResponse(cachedValue, {
				cacheState: "HIT",
				isHead: options.isAutoHead,
				revalidateSeconds: options.revalidateSeconds
			}), options.middlewareContext);
		}
		if (cached?.isStale && cachedValue) {
			const staleValue = cachedValue;
			const revalidateSearchParams = new URLSearchParams(options.revalidateSearchParams);
			options.scheduleBackgroundRegeneration(routeKey, async () => {
				await options.runInRevalidationContext(async () => {
					options.setNavigationContext({
						pathname: options.cleanPathname,
						searchParams: revalidateSearchParams,
						params: options.params
					});
					const { dynamicUsedInHandler, response } = await runAppRouteHandler({
						basePath: options.basePath,
						consumeDynamicUsage: options.consumeDynamicUsage,
						handlerFn: options.handlerFn,
						i18n: options.i18n,
						markDynamicUsage: options.markDynamicUsage,
						params: options.params,
						request: new Request(options.requestUrl, { method: "GET" })
					});
					options.setNavigationContext(null);
					if (dynamicUsedInHandler) {
						markKnownDynamicAppRoute(options.routePattern);
						options.isrDebug?.("route regen skipped (dynamic usage)", options.cleanPathname);
						return;
					}
					const routeTags = options.buildPageCacheTags(options.cleanPathname, options.getCollectedFetchTags());
					const routeCacheValue = await buildAppRouteCacheValue(response);
					await options.isrSet(routeKey, routeCacheValue, options.revalidateSeconds, routeTags);
					options.isrDebug?.("route regen complete", routeKey);
				});
			});
			options.isrDebug?.("STALE (route)", options.cleanPathname);
			options.clearRequestContext();
			return applyRouteHandlerMiddlewareContext(buildRouteHandlerCachedResponse(staleValue, {
				cacheState: "STALE",
				isHead: options.isAutoHead,
				revalidateSeconds: options.revalidateSeconds
			}), options.middlewareContext);
		}
	} catch (routeCacheError) {
		console.error("[vinext] ISR route cache read error:", routeCacheError);
	}
	return null;
}
//#endregion
//#region node_modules/vinext/dist/shims/cache.js
var MemoryCacheHandler = class {
	store = /* @__PURE__ */ new Map();
	tagRevalidatedAt = /* @__PURE__ */ new Map();
	async get(key, _ctx) {
		const entry = this.store.get(key);
		if (!entry) return null;
		for (const tag of entry.tags) {
			const revalidatedAt = this.tagRevalidatedAt.get(tag);
			if (revalidatedAt && revalidatedAt >= entry.lastModified) {
				this.store.delete(key);
				return null;
			}
		}
		if (entry.revalidateAt !== null && Date.now() > entry.revalidateAt) return {
			lastModified: entry.lastModified,
			value: entry.value,
			cacheState: "stale"
		};
		return {
			lastModified: entry.lastModified,
			value: entry.value
		};
	}
	async set(key, data, ctx) {
		const typedCtx = ctx;
		const tagSet = /* @__PURE__ */ new Set();
		if (data && "tags" in data && Array.isArray(data.tags)) for (const t of data.tags) tagSet.add(t);
		if (typedCtx && Array.isArray(typedCtx.tags)) for (const t of typedCtx.tags) tagSet.add(t);
		const tags = [...tagSet];
		let effectiveRevalidate;
		if (typedCtx) {
			const revalidate = typedCtx.cacheControl?.revalidate ?? typedCtx.revalidate;
			if (typeof revalidate === "number") effectiveRevalidate = revalidate;
		}
		if (data && "revalidate" in data && typeof data.revalidate === "number") effectiveRevalidate = data.revalidate;
		if (effectiveRevalidate === 0) return;
		const revalidateAt = typeof effectiveRevalidate === "number" && effectiveRevalidate > 0 ? Date.now() + effectiveRevalidate * 1e3 : null;
		this.store.set(key, {
			value: data,
			tags,
			lastModified: Date.now(),
			revalidateAt
		});
	}
	async revalidateTag(tags, _durations) {
		const tagList = Array.isArray(tags) ? tags : [tags];
		const now = Date.now();
		for (const tag of tagList) this.tagRevalidatedAt.set(tag, now);
	}
	resetRequestCache() {}
};
var _HANDLER_KEY = Symbol.for("vinext.cacheHandler");
var _gHandler = globalThis;
function _getActiveHandler() {
	return _gHandler[_HANDLER_KEY] ?? (_gHandler[_HANDLER_KEY] = new MemoryCacheHandler());
}
/**
* Get the active CacheHandler (for internal use or testing).
*/
function getCacheHandler() {
	return _getActiveHandler();
}
var _ALS_KEY$2 = Symbol.for("vinext.cache.als");
var _FALLBACK_KEY$2 = Symbol.for("vinext.cache.fallback");
var _g$3 = globalThis;
var _cacheAls = _g$3[_ALS_KEY$2] ??= new AsyncLocalStorage();
var _cacheFallbackState = _g$3[_FALLBACK_KEY$2] ??= { requestScopedCacheLife: null };
function _getCacheState() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _cacheAls.getStore() ?? _cacheFallbackState;
}
/**
* Consume and reset the request-scoped cache life. Returns null if none was set.
* @internal
*/
function _consumeRequestScopedCacheLife() {
	const state = _getCacheState();
	const config = state.requestScopedCacheLife;
	state.requestScopedCacheLife = null;
	return config;
}
/**
* AsyncLocalStorage to track whether we're inside an unstable_cache() callback.
* Stored on globalThis via Symbol so headers.ts can detect the scope without
* a direct import (avoiding circular dependencies).
*/
var _UNSTABLE_CACHE_ALS_KEY = Symbol.for("vinext.unstableCache.als");
_g$3[_UNSTABLE_CACHE_ALS_KEY] ??= new AsyncLocalStorage();
//#endregion
//#region node_modules/vinext/dist/server/isr-cache.js
var _PENDING_REGEN_KEY = Symbol.for("vinext.isrCache.pendingRegenerations");
var _g$2 = globalThis;
_g$2[_PENDING_REGEN_KEY] ??= /* @__PURE__ */ new Map();
/**
* Build a CachedAppPageValue for the App Router ISR cache.
*/
function buildAppPageCacheValue(html, rscData, status) {
	return {
		kind: "APP_PAGE",
		html,
		rscData,
		headers: void 0,
		postponed: void 0,
		status
	};
}
var _REVALIDATE_KEY = Symbol.for("vinext.isrCache.revalidateDurations");
_g$2[_REVALIDATE_KEY] ??= /* @__PURE__ */ new Map();
//#endregion
//#region node_modules/vinext/dist/server/app-page-cache.js
function buildAppPageCacheControl(cacheState, revalidateSeconds) {
	if (cacheState === "STALE") return "s-maxage=0, stale-while-revalidate";
	return `s-maxage=${revalidateSeconds}, stale-while-revalidate`;
}
function getCachedAppPageValue(entry) {
	return entry?.value.value && entry.value.value.kind === "APP_PAGE" ? entry.value.value : null;
}
function buildAppPageCachedResponse(cachedValue, options) {
	const status = cachedValue.status || 200;
	const headers = {
		"Cache-Control": buildAppPageCacheControl(options.cacheState, options.revalidateSeconds),
		Vary: "RSC, Accept",
		"X-Vinext-Cache": options.cacheState
	};
	if (options.isRscRequest) {
		if (!cachedValue.rscData) return null;
		const rscHeaders = {
			"Content-Type": "text/x-component; charset=utf-8",
			...headers
		};
		if (options.mountedSlotsHeader) rscHeaders["X-Vinext-Mounted-Slots"] = options.mountedSlotsHeader;
		return new Response(cachedValue.rscData, {
			status,
			headers: rscHeaders
		});
	}
	if (typeof cachedValue.html !== "string" || cachedValue.html.length === 0) return null;
	return new Response(cachedValue.html, {
		status,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			...headers
		}
	});
}
async function readAppPageCacheResponse(options) {
	const isrKey = options.isRscRequest ? options.isrRscKey(options.cleanPathname, options.mountedSlotsHeader) : options.isrHtmlKey(options.cleanPathname);
	try {
		const cached = await options.isrGet(isrKey);
		const cachedValue = getCachedAppPageValue(cached);
		if (cachedValue && !cached?.isStale) {
			const hitResponse = buildAppPageCachedResponse(cachedValue, {
				cacheState: "HIT",
				isRscRequest: options.isRscRequest,
				mountedSlotsHeader: options.mountedSlotsHeader,
				revalidateSeconds: options.revalidateSeconds
			});
			if (hitResponse) {
				options.isrDebug?.(options.isRscRequest ? "HIT (RSC)" : "HIT (HTML)", options.cleanPathname);
				options.clearRequestContext();
				return hitResponse;
			}
			options.isrDebug?.("MISS (empty cached entry)", options.cleanPathname);
		}
		if (cached?.isStale && cachedValue) {
			options.scheduleBackgroundRegeneration(options.cleanPathname, async () => {
				const revalidatedPage = await options.renderFreshPageForCache();
				const writes = [options.isrSet(options.isrRscKey(options.cleanPathname, options.mountedSlotsHeader), buildAppPageCacheValue("", revalidatedPage.rscData, 200), options.revalidateSeconds, revalidatedPage.tags)];
				if (!options.isRscRequest) writes.push(options.isrSet(options.isrHtmlKey(options.cleanPathname), buildAppPageCacheValue(revalidatedPage.html, void 0, 200), options.revalidateSeconds, revalidatedPage.tags));
				await Promise.all(writes);
				options.isrDebug?.("regen complete", options.cleanPathname);
			});
			const staleResponse = buildAppPageCachedResponse(cachedValue, {
				cacheState: "STALE",
				isRscRequest: options.isRscRequest,
				mountedSlotsHeader: options.mountedSlotsHeader,
				revalidateSeconds: options.revalidateSeconds
			});
			if (staleResponse) {
				options.isrDebug?.(options.isRscRequest ? "STALE (RSC)" : "STALE (HTML)", options.cleanPathname);
				options.clearRequestContext();
				return staleResponse;
			}
			options.isrDebug?.("STALE MISS (empty stale entry)", options.cleanPathname);
		}
		if (!cached) options.isrDebug?.("MISS (no cache entry)", options.cleanPathname);
	} catch (isrReadError) {
		console.error("[vinext] ISR cache read error:", isrReadError);
	}
	return null;
}
function finalizeAppPageHtmlCacheResponse(response, options) {
	if (!response.body) return response;
	const [streamForClient, streamForCache] = response.body.tee();
	const htmlKey = options.isrHtmlKey(options.cleanPathname);
	const rscKey = options.isrRscKey(options.cleanPathname, null);
	const cachePromise = (async () => {
		try {
			const reader = streamForCache.getReader();
			const decoder = new TextDecoder();
			const chunks = [];
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(decoder.decode(value, { stream: true }));
			}
			chunks.push(decoder.decode());
			const pageTags = options.getPageTags();
			const writes = [options.isrSet(htmlKey, buildAppPageCacheValue(chunks.join(""), void 0, 200), options.revalidateSeconds, pageTags)];
			if (options.capturedRscDataPromise) writes.push(options.capturedRscDataPromise.then((rscData) => options.isrSet(rscKey, buildAppPageCacheValue("", rscData, 200), options.revalidateSeconds, pageTags)));
			await Promise.all(writes);
			options.isrDebug?.("HTML cache written", htmlKey);
		} catch (cacheError) {
			console.error("[vinext] ISR cache write error:", cacheError);
		}
	})();
	options.waitUntil?.(cachePromise);
	return new Response(streamForClient, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}
function scheduleAppPageRscCacheWrite(options) {
	const capturedRscDataPromise = options.capturedRscDataPromise;
	if (!capturedRscDataPromise || options.dynamicUsedDuringBuild) return false;
	const rscKey = options.isrRscKey(options.cleanPathname, options.mountedSlotsHeader);
	const cachePromise = (async () => {
		try {
			const rscData = await capturedRscDataPromise;
			if (options.consumeDynamicUsage()) {
				options.isrDebug?.("RSC cache write skipped (dynamic usage during render)", rscKey);
				return;
			}
			await options.isrSet(rscKey, buildAppPageCacheValue("", rscData, 200), options.revalidateSeconds, options.getPageTags());
			options.isrDebug?.("RSC cache written", rscKey);
		} catch (cacheError) {
			console.error("[vinext] ISR RSC cache write error:", cacheError);
		}
	})();
	options.waitUntil?.(cachePromise);
	return true;
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-execution.js
function isPromiseLike(value) {
	return Boolean(value && (typeof value === "object" || typeof value === "function") && "then" in value && typeof value.then === "function");
}
function getAppPageStatusText(statusCode) {
	return statusCode === 403 ? "Forbidden" : statusCode === 401 ? "Unauthorized" : "Not Found";
}
function resolveAppPageSpecialError(error) {
	if (!(error && typeof error === "object" && "digest" in error)) return null;
	const digest = String(error.digest);
	if (digest.startsWith("NEXT_REDIRECT;")) {
		const parts = digest.split(";");
		return {
			kind: "redirect",
			location: decodeURIComponent(parts[2]),
			statusCode: parts[3] ? parseInt(parts[3], 10) : 307
		};
	}
	if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) return {
		kind: "http-access-fallback",
		statusCode: digest === "NEXT_NOT_FOUND" ? 404 : parseInt(digest.split(";")[1], 10)
	};
	return null;
}
async function buildAppPageSpecialErrorResponse(options) {
	if (options.specialError.kind === "redirect") {
		options.clearRequestContext();
		return Response.redirect(new URL(options.specialError.location, options.requestUrl), options.specialError.statusCode);
	}
	if (options.renderFallbackPage) {
		const fallbackResponse = await options.renderFallbackPage(options.specialError.statusCode);
		if (fallbackResponse) return fallbackResponse;
	}
	options.clearRequestContext();
	return new Response(getAppPageStatusText(options.specialError.statusCode), { status: options.specialError.statusCode });
}
/** See `LayoutFlags` type docblock in app-elements.ts for lifecycle. */
async function probeAppPageLayouts(options) {
	const layoutFlags = {};
	const cls = options.classification ?? null;
	return {
		response: await options.runWithSuppressedHookWarning(async () => {
			for (let layoutIndex = options.layoutCount - 1; layoutIndex >= 0; layoutIndex--) {
				const buildTimeResult = cls?.buildTimeClassifications?.get(layoutIndex);
				if (cls && buildTimeResult) {
					layoutFlags[cls.getLayoutId(layoutIndex)] = buildTimeResult === "static" ? "s" : "d";
					if (cls.debugClassification) cls.debugClassification(cls.getLayoutId(layoutIndex), cls.buildTimeReasons?.get(layoutIndex) ?? { layer: "no-classifier" });
					const errorResponse = await probeLayoutForErrors(options, layoutIndex);
					if (errorResponse) return errorResponse;
					continue;
				}
				if (cls) {
					try {
						const { dynamicDetected } = await cls.runWithIsolatedDynamicScope(() => options.probeLayoutAt(layoutIndex));
						layoutFlags[cls.getLayoutId(layoutIndex)] = dynamicDetected ? "d" : "s";
						if (cls.debugClassification) cls.debugClassification(cls.getLayoutId(layoutIndex), {
							layer: "runtime-probe",
							outcome: dynamicDetected ? "dynamic" : "static"
						});
					} catch (error) {
						layoutFlags[cls.getLayoutId(layoutIndex)] = "d";
						if (cls.debugClassification) cls.debugClassification(cls.getLayoutId(layoutIndex), {
							layer: "runtime-probe",
							outcome: "dynamic",
							error: error instanceof Error ? error.message : String(error)
						});
						const errorResponse = await options.onLayoutError(error, layoutIndex);
						if (errorResponse) return errorResponse;
					}
					continue;
				}
				const errorResponse = await probeLayoutForErrors(options, layoutIndex);
				if (errorResponse) return errorResponse;
			}
			return null;
		}),
		layoutFlags
	};
}
async function probeLayoutForErrors(options, layoutIndex) {
	try {
		const layoutResult = options.probeLayoutAt(layoutIndex);
		if (isPromiseLike(layoutResult)) await layoutResult;
	} catch (error) {
		return options.onLayoutError(error, layoutIndex);
	}
	return null;
}
async function probeAppPageComponent(options) {
	return options.runWithSuppressedHookWarning(async () => {
		try {
			const pageResult = options.probePage();
			if (isPromiseLike(pageResult)) if (options.awaitAsyncResult) await pageResult;
			else Promise.resolve(pageResult).catch(() => {});
		} catch (error) {
			return options.onError(error);
		}
		return null;
	});
}
async function readAppPageTextStream(stream) {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	const chunks = [];
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(decoder.decode(value, { stream: true }));
	}
	chunks.push(decoder.decode());
	return chunks.join("");
}
async function readAppPageBinaryStream(stream) {
	const reader = stream.getReader();
	const chunks = [];
	let totalLength = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		totalLength += value.byteLength;
	}
	const buffer = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return buffer.buffer;
}
function teeAppPageRscStreamForCapture(stream, shouldCapture) {
	if (!shouldCapture) return {
		capturedRscDataPromise: null,
		responseStream: stream
	};
	const [responseStream, captureStream] = stream.tee();
	return {
		capturedRscDataPromise: readAppPageBinaryStream(captureStream),
		responseStream
	};
}
function buildAppPageFontLinkHeader(preloads) {
	if (!preloads || preloads.length === 0) return "";
	return preloads.map((preload) => `<${preload.href}>; rel=preload; as=font; type=${preload.type}; crossorigin`).join(", ");
}
//#endregion
//#region node_modules/vinext/dist/shims/error-boundary.js
/**
* Generic ErrorBoundary used to wrap route segments with error.tsx.
* This must be a client component since error boundaries use
* componentDidCatch / getDerivedStateFromError.
*/
/**
* Inner class component that catches notFound() errors and renders the
* not-found.tsx fallback. Resets when the pathname changes (client navigation)
* so a previous notFound() doesn't permanently stick.
*
* The ErrorBoundary above re-throws notFound errors so they propagate up to this
* boundary. This must be placed above the ErrorBoundary in the component tree.
*/
/**
* Wrapper that reads the current pathname and passes it to the inner class
* component. This enables automatic reset on client-side navigation.
*/
var ErrorBoundary = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'ErrorBoundary' is called on server");
}, "593f344dc510", "ErrorBoundary");
var NotFoundBoundary = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'NotFoundBoundary' is called on server");
}, "593f344dc510", "NotFoundBoundary");
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
var LayoutSegmentProvider = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'LayoutSegmentProvider' is called on server");
}, "15c18cfaeeff", "LayoutSegmentProvider");
//#endregion
//#region node_modules/vinext/dist/shims/slot.js
/**
* Holds resolved AppElements (not a Promise). React 19's use(Promise) during
* hydration triggers "async Client Component" for native Promises that lack
* React's internal .status property. Storing resolved values sidesteps this.
*/
var Children = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'Children' is called on server");
}, "8c0f216c4604", "Children");
var ParallelSlot = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'ParallelSlot' is called on server");
}, "8c0f216c4604", "ParallelSlot");
var Slot = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'Slot' is called on server");
}, "8c0f216c4604", "Slot");
//#endregion
//#region node_modules/vinext/dist/server/app-render-dependency.js
function createAppRenderDependency() {
	let released = false;
	let resolve;
	return {
		promise: new Promise((promiseResolve) => {
			resolve = promiseResolve;
		}),
		release() {
			if (released) return;
			released = true;
			resolve();
		}
	};
}
function renderAfterAppDependencies(children, dependencies) {
	if (dependencies.length === 0) return children;
	async function AwaitAppRenderDependencies() {
		await Promise.all(dependencies.map((dependency) => dependency.promise));
		return children;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(AwaitAppRenderDependencies, {});
}
function renderWithAppDependencyBarrier(children, dependency) {
	function ReleaseAppRenderDependency() {
		dependency.release();
		return null;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)(import_jsx_runtime_react_server.Fragment, { children: [children, /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ReleaseAppRenderDependency, {})] });
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-route-wiring.js
function getDefaultExport$1(module) {
	return module?.default ?? null;
}
function getErrorBoundaryExport(module) {
	return module?.default ?? null;
}
function createAppPageTreePath(routeSegments, treePosition) {
	const treePathSegments = routeSegments?.slice(0, treePosition) ?? [];
	if (treePathSegments.length === 0) return "/";
	return `/${treePathSegments.join("/")}`;
}
function createAppPageLayoutEntries(route) {
	return route.layouts.map((layoutModule, index) => {
		const treePosition = route.layoutTreePositions?.[index] ?? 0;
		const treePath = createAppPageTreePath(route.routeSegments, treePosition);
		return {
			errorModule: route.errors?.[index] ?? null,
			id: `layout:${treePath}`,
			layoutModule,
			notFoundModule: route.notFounds?.[index] ?? null,
			treePath,
			treePosition
		};
	});
}
function createAppPageTemplateEntries(route) {
	return (route.templates ?? []).map((templateModule, index) => {
		const treePosition = route.templateTreePositions?.[index] ?? 0;
		const treePath = createAppPageTreePath(route.routeSegments, treePosition);
		return {
			id: `template:${treePath}`,
			templateModule,
			treePath,
			treePosition
		};
	});
}
function resolveAppPageChildSegments(routeSegments, treePosition, params) {
	const rawSegments = routeSegments.slice(treePosition);
	const resolvedSegments = [];
	for (const segment of rawSegments) {
		if (segment.startsWith("[[...") && segment.endsWith("]]") && segment.length > 7) {
			const paramValue = params[segment.slice(5, -2)];
			if (Array.isArray(paramValue) && paramValue.length === 0) continue;
			if (paramValue === void 0) continue;
			resolvedSegments.push(Array.isArray(paramValue) ? paramValue.join("/") : paramValue);
			continue;
		}
		if (segment.startsWith("[...") && segment.endsWith("]")) {
			const paramValue = params[segment.slice(4, -1)];
			if (Array.isArray(paramValue)) {
				resolvedSegments.push(paramValue.join("/"));
				continue;
			}
			resolvedSegments.push(paramValue ?? segment);
			continue;
		}
		if (segment.startsWith("[") && segment.endsWith("]") && !segment.includes(".")) {
			const paramValue = params[segment.slice(1, -1)];
			resolvedSegments.push(Array.isArray(paramValue) ? paramValue.join("/") : paramValue ?? segment);
			continue;
		}
		resolvedSegments.push(segment);
	}
	return resolvedSegments;
}
function resolveAppPageVisibleSegments(routeSegments, params) {
	return resolveAppPageChildSegments(routeSegments, 0, params).filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
}
function resolveAppPageTemplateKey(routeSegments, treePosition, params) {
	return resolveAppPageVisibleSegments(routeSegments.slice(treePosition), params)[0] ?? "";
}
function createAppPageParallelSlotEntries(layoutIndex, layoutEntries, route, getEffectiveSlotParams) {
	const parallelSlots = {};
	for (const [slotKey, slot] of Object.entries(route.slots ?? {})) {
		const slotName = slot.name;
		const targetIndex = slot.layoutIndex >= 0 ? slot.layoutIndex : layoutEntries.length - 1;
		if (targetIndex !== layoutIndex) continue;
		const treePath = layoutEntries[targetIndex]?.treePath ?? "/";
		const slotParams = getEffectiveSlotParams(slotKey, slotName);
		parallelSlots[slotName] = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(LayoutSegmentProvider, {
			segmentMap: { children: slot.routeSegments ? resolveAppPageChildSegments(slot.routeSegments, 0, slotParams) : [] },
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Slot, { id: `slot:${slotName}:${treePath}` })
		});
	}
	return Object.keys(parallelSlots).length > 0 ? parallelSlots : void 0;
}
function createAppPageRouteHead(metadata, viewport) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)(import_jsx_runtime_react_server.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("meta", { charSet: "utf-8" }),
		metadata ? /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(MetadataHead, { metadata }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ViewportHead, { viewport })
	] });
}
function buildAppPageElements(options) {
	const elements = {};
	const interceptionContext = options.interceptionContext ?? null;
	const routeId = createAppPayloadRouteId(options.routePath, interceptionContext);
	const pageId = createAppPayloadPageId(options.routePath, interceptionContext);
	const layoutEntries = createAppPageLayoutEntries(options.route);
	const templateEntries = createAppPageTemplateEntries(options.route);
	const layoutEntriesByTreePosition = /* @__PURE__ */ new Map();
	const templateEntriesByTreePosition = /* @__PURE__ */ new Map();
	for (const layoutEntry of layoutEntries) layoutEntriesByTreePosition.set(layoutEntry.treePosition, layoutEntry);
	for (const templateEntry of templateEntries) templateEntriesByTreePosition.set(templateEntry.treePosition, templateEntry);
	const layoutIndicesByTreePosition = /* @__PURE__ */ new Map();
	for (let index = 0; index < layoutEntries.length; index++) layoutIndicesByTreePosition.set(layoutEntries[index].treePosition, index);
	const layoutDependenciesByIndex = /* @__PURE__ */ new Map();
	const layoutDependenciesBefore = [];
	const slotDependenciesByLayoutIndex = [];
	const templateDependenciesById = /* @__PURE__ */ new Map();
	const templateDependenciesBeforeById = /* @__PURE__ */ new Map();
	const pageDependencies = [];
	const routeThenableParams = options.makeThenableParams(options.matchedParams);
	const rootLayoutTreePath = layoutEntries[0]?.treePath ?? null;
	const slotNameCounts = /* @__PURE__ */ new Map();
	for (const slot of Object.values(options.route.slots ?? {})) {
		const slotName = slot.name;
		slotNameCounts.set(slotName, (slotNameCounts.get(slotName) ?? 0) + 1);
	}
	const orderedTreePositions = Array.from(new Set([...layoutEntries.map((entry) => entry.treePosition), ...templateEntries.map((entry) => entry.treePosition)])).sort((left, right) => left - right);
	const resolveSlotOverride = (slotKey, slotName) => {
		const overrideByKey = options.slotOverrides?.[slotKey];
		if (overrideByKey) return overrideByKey;
		if (slotKey === slotName || (slotNameCounts.get(slotName) ?? 0) === 1) return options.slotOverrides?.[slotName];
	};
	const getEffectiveSlotParams = (slotKey, slotName) => resolveSlotOverride(slotKey, slotName)?.params ?? options.matchedParams;
	for (const treePosition of orderedTreePositions) {
		const layoutIndex = layoutIndicesByTreePosition.get(treePosition);
		if (layoutIndex !== void 0) {
			const layoutEntry = layoutEntries[layoutIndex];
			layoutDependenciesBefore[layoutIndex] = [...pageDependencies];
			if (getDefaultExport$1(layoutEntry.layoutModule)) {
				const layoutDependency = createAppRenderDependency();
				layoutDependenciesByIndex.set(layoutIndex, layoutDependency);
				pageDependencies.push(layoutDependency);
			}
			slotDependenciesByLayoutIndex[layoutIndex] = [...pageDependencies];
		}
		const templateEntry = templateEntriesByTreePosition.get(treePosition);
		if (!templateEntry || !getDefaultExport$1(templateEntry.templateModule)) continue;
		const templateDependency = createAppRenderDependency();
		templateDependenciesById.set(templateEntry.id, templateDependency);
		templateDependenciesBeforeById.set(templateEntry.id, [...pageDependencies]);
		pageDependencies.push(templateDependency);
	}
	elements[APP_ROUTE_KEY] = routeId;
	elements[APP_INTERCEPTION_CONTEXT_KEY] = interceptionContext;
	elements[APP_ROOT_LAYOUT_KEY] = rootLayoutTreePath;
	elements[pageId] = renderAfterAppDependencies(options.element, pageDependencies);
	for (const templateEntry of templateEntries) {
		const templateComponent = getDefaultExport$1(templateEntry.templateModule);
		if (!templateComponent) continue;
		const TemplateComponent = templateComponent;
		const templateDependency = templateDependenciesById.get(templateEntry.id);
		const templateElement = templateDependency ? renderWithAppDependencyBarrier(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(TemplateComponent, {
			params: options.matchedParams,
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Children, {})
		}), templateDependency) : /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(TemplateComponent, {
			params: options.matchedParams,
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Children, {})
		});
		elements[templateEntry.id] = renderAfterAppDependencies(templateElement, templateDependenciesBeforeById.get(templateEntry.id) ?? []);
	}
	for (let index = 0; index < layoutEntries.length; index++) {
		const layoutEntry = layoutEntries[index];
		const layoutComponent = getDefaultExport$1(layoutEntry.layoutModule);
		if (!layoutComponent) continue;
		const layoutProps = { params: routeThenableParams };
		for (const slot of Object.values(options.route.slots ?? {})) {
			const slotName = slot.name;
			if ((slot.layoutIndex >= 0 ? slot.layoutIndex : layoutEntries.length - 1) !== index) continue;
			layoutProps[slotName] = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ParallelSlot, { name: slotName });
		}
		const LayoutComponent = layoutComponent;
		const layoutDependency = layoutDependenciesByIndex.get(index);
		const layoutElement = layoutDependency ? renderWithAppDependencyBarrier(/* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(LayoutComponent, {
			...layoutProps,
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Children, {})
		}), layoutDependency) : /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(LayoutComponent, {
			...layoutProps,
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Children, {})
		});
		elements[layoutEntry.id] = renderAfterAppDependencies(layoutElement, layoutDependenciesBefore[index] ?? []);
	}
	for (const [slotKey, slot] of Object.entries(options.route.slots ?? {})) {
		const slotName = slot.name;
		const targetIndex = slot.layoutIndex >= 0 ? slot.layoutIndex : layoutEntries.length - 1;
		const slotId = `slot:${slotName}:${layoutEntries[targetIndex]?.treePath ?? "/"}`;
		const slotOverride = resolveSlotOverride(slotKey, slotName);
		const slotParams = getEffectiveSlotParams(slotKey, slotName);
		const overrideOrPageComponent = getDefaultExport$1(slotOverride?.pageModule) ?? getDefaultExport$1(slot.page);
		const defaultComponent = getDefaultExport$1(slot.default);
		if (!overrideOrPageComponent && defaultComponent && options.isRscRequest && options.mountedSlotIds?.has(slotId)) continue;
		const slotComponent = overrideOrPageComponent ?? defaultComponent;
		if (!slotComponent) {
			elements[slotId] = APP_UNMATCHED_SLOT_WIRE_VALUE;
			continue;
		}
		const slotProps = { params: options.makeThenableParams(slotParams) };
		if (slotOverride?.props) Object.assign(slotProps, slotOverride.props);
		let slotElement = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(slotComponent, { ...slotProps });
		const slotLayoutComponent = getDefaultExport$1(slot.layout);
		if (slotLayoutComponent) slotElement = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(slotLayoutComponent, {
			params: options.makeThenableParams(slotParams),
			children: slotElement
		});
		const slotLoadingComponent = getDefaultExport$1(slot.loading);
		if (slotLoadingComponent) slotElement = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(import_react_react_server.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(slotLoadingComponent, {}),
			children: slotElement
		});
		const slotErrorComponent = getErrorBoundaryExport(slot.error);
		if (slotErrorComponent) slotElement = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ErrorBoundary, {
			fallback: slotErrorComponent,
			children: slotElement
		});
		elements[slotId] = renderAfterAppDependencies(slotElement, targetIndex >= 0 ? slotDependenciesByLayoutIndex[targetIndex] ?? [] : []);
	}
	let routeChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(LayoutSegmentProvider, {
		segmentMap: { children: [] },
		children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Slot, { id: pageId })
	});
	const routeLoadingComponent = getDefaultExport$1(options.route.loading);
	if (routeLoadingComponent) routeChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(import_react_react_server.Suspense, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(routeLoadingComponent, {}),
		children: routeChildren
	});
	const lastLayoutErrorModule = options.route.errors && options.route.errors.length > 0 ? options.route.errors[options.route.errors.length - 1] : null;
	const pageErrorComponent = getErrorBoundaryExport(options.route.error);
	if (pageErrorComponent && options.route.error !== lastLayoutErrorModule) routeChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ErrorBoundary, {
		fallback: pageErrorComponent,
		children: routeChildren
	});
	const notFoundComponent = getDefaultExport$1(options.route.notFound) ?? getDefaultExport$1(options.rootNotFoundModule);
	if (notFoundComponent) routeChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(NotFoundBoundary, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(notFoundComponent, {}),
		children: routeChildren
	});
	for (let index = orderedTreePositions.length - 1; index >= 0; index--) {
		const treePosition = orderedTreePositions[index];
		let segmentChildren = routeChildren;
		const layoutEntry = layoutEntriesByTreePosition.get(treePosition);
		const templateEntry = templateEntriesByTreePosition.get(treePosition);
		if (layoutEntry) {
			const layoutNotFoundComponent = getDefaultExport$1(layoutEntry.notFoundModule);
			if (layoutNotFoundComponent) segmentChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(NotFoundBoundary, {
				fallback: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(layoutNotFoundComponent, {}),
				children: segmentChildren
			});
			const layoutErrorComponent = getErrorBoundaryExport(layoutEntry.errorModule);
			if (layoutErrorComponent) segmentChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ErrorBoundary, {
				fallback: layoutErrorComponent,
				children: segmentChildren
			});
		}
		if (templateEntry && getDefaultExport$1(templateEntry.templateModule)) segmentChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Slot, {
			id: templateEntry.id,
			children: segmentChildren
		}, resolveAppPageTemplateKey(options.route.routeSegments ?? [], templateEntry.treePosition, options.matchedParams));
		if (!layoutEntry) {
			routeChildren = segmentChildren;
			continue;
		}
		const layoutHasElement = getDefaultExport$1(layoutEntry.layoutModule) !== null;
		const layoutIndex = layoutIndicesByTreePosition.get(treePosition) ?? -1;
		const segmentMap = { children: resolveAppPageChildSegments(options.route.routeSegments ?? [], layoutEntry.treePosition, options.matchedParams) };
		for (const [slotKey, slot] of Object.entries(options.route.slots ?? {})) {
			const slotName = slot.name;
			if ((slot.layoutIndex >= 0 ? slot.layoutIndex : layoutEntries.length - 1) !== layoutIndex) continue;
			const slotParams = getEffectiveSlotParams(slotKey, slotName);
			segmentMap[slotName] = slot.routeSegments ? resolveAppPageChildSegments(slot.routeSegments, 0, slotParams) : [];
		}
		routeChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(LayoutSegmentProvider, {
			segmentMap,
			children: layoutHasElement ? /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(Slot, {
				id: layoutEntry.id,
				parallelSlots: createAppPageParallelSlotEntries(layoutIndex, layoutEntries, options.route, getEffectiveSlotParams),
				children: segmentChildren
			}) : segmentChildren
		});
	}
	const globalErrorComponent = getErrorBoundaryExport(options.globalErrorModule);
	if (globalErrorComponent) routeChildren = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(ErrorBoundary, {
		fallback: globalErrorComponent,
		children: routeChildren
	});
	elements[routeId] = /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsxs)(import_jsx_runtime_react_server.Fragment, { children: [createAppPageRouteHead(options.resolvedMetadata, options.resolvedViewport), routeChildren] });
	return elements;
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-boundary.js
function resolveAppPageHttpAccessBoundaryComponent(options) {
	let boundaryModule;
	if (options.statusCode === 403) boundaryModule = options.routeForbiddenModule ?? options.rootForbiddenModule;
	else if (options.statusCode === 401) boundaryModule = options.routeUnauthorizedModule ?? options.rootUnauthorizedModule;
	else boundaryModule = options.routeNotFoundModule ?? options.rootNotFoundModule;
	return options.getDefaultExport(boundaryModule) ?? null;
}
function resolveAppPageErrorBoundary(options) {
	const pageErrorComponent = options.getDefaultExport(options.pageErrorModule);
	if (pageErrorComponent) return {
		component: pageErrorComponent,
		isGlobalError: false
	};
	if (options.layoutErrorModules) for (let index = options.layoutErrorModules.length - 1; index >= 0; index--) {
		const layoutErrorComponent = options.getDefaultExport(options.layoutErrorModules[index]);
		if (layoutErrorComponent) return {
			component: layoutErrorComponent,
			isGlobalError: false
		};
	}
	const globalErrorComponent = options.getDefaultExport(options.globalErrorModule);
	return {
		component: globalErrorComponent ?? null,
		isGlobalError: Boolean(globalErrorComponent)
	};
}
function wrapAppPageBoundaryElement(options) {
	let element = options.element;
	if (!options.skipLayoutWrapping) {
		const asyncParams = options.makeThenableParams(options.matchedParams);
		for (let index = options.layoutModules.length - 1; index >= 0; index--) {
			const layoutComponent = options.getDefaultExport(options.layoutModules[index]);
			if (!layoutComponent) continue;
			element = options.renderLayout(layoutComponent, element, asyncParams);
			if (options.isRscRequest && options.renderLayoutSegmentProvider && options.resolveChildSegments) {
				const treePosition = options.layoutTreePositions ? options.layoutTreePositions[index] : 0;
				const childSegments = options.resolveChildSegments(options.routeSegments ?? [], treePosition, options.matchedParams);
				element = options.renderLayoutSegmentProvider({ children: childSegments }, element);
			}
		}
	}
	if (options.isRscRequest && options.includeGlobalErrorBoundary && options.globalErrorComponent) element = options.renderErrorBoundary(options.globalErrorComponent, element);
	return element;
}
async function renderAppPageBoundaryResponse(options) {
	const rscStream = options.renderToReadableStream(options.element, { onError: options.createRscOnErrorHandler() });
	if (options.isRscRequest) return new Response(rscStream, {
		status: options.status,
		headers: {
			"Content-Type": "text/x-component; charset=utf-8",
			Vary: "RSC, Accept"
		}
	});
	return options.createHtmlResponse(rscStream, options.status);
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-stream.js
function createAppPageFontData(options) {
	return {
		links: options.getLinks(),
		preloads: options.getPreloads(),
		styles: options.getStyles()
	};
}
async function renderAppPageHtmlStream(options) {
	const ssrOptions = options.scriptNonce === void 0 ? void 0 : { scriptNonce: options.scriptNonce };
	return options.ssrHandler.handleSsr(options.rscStream, options.navigationContext, options.fontData, ssrOptions);
}
/**
* Wraps a stream so that `onFlush` is called when the last byte has been read
* by the downstream consumer (i.e. when the HTTP layer finishes draining the
* response body). This is the correct place to clear per-request context,
* because the RSC/SSR pipeline is lazy — components execute while the stream
* is being consumed, not when the stream handle is first obtained.
*/
function deferUntilStreamConsumed(stream, onFlush) {
	let called = false;
	const once = () => {
		if (!called) {
			called = true;
			onFlush();
		}
	};
	const cleanup = new TransformStream({ flush() {
		once();
	} });
	const reader = stream.pipeThrough(cleanup).getReader();
	return new ReadableStream({
		pull(controller) {
			return reader.read().then(({ done, value }) => {
				if (done) controller.close();
				else controller.enqueue(value);
			}, (error) => {
				once();
				controller.error(error);
			});
		},
		cancel(reason) {
			once();
			return reader.cancel(reason);
		}
	});
}
async function renderAppPageHtmlResponse(options) {
	const safeStream = deferUntilStreamConsumed(await renderAppPageHtmlStream(options), () => {
		options.clearRequestContext();
	});
	const headers = {
		"Content-Type": "text/html; charset=utf-8",
		Vary: "RSC, Accept"
	};
	if (options.fontLinkHeader) headers.Link = options.fontLinkHeader;
	return new Response(safeStream, {
		status: options.status,
		headers
	});
}
async function renderAppPageHtmlStreamWithRecovery(options) {
	try {
		const htmlStream = await options.renderHtmlStream();
		options.onShellRendered?.();
		return {
			htmlStream,
			response: null
		};
	} catch (error) {
		const specialError = options.resolveSpecialError(error);
		if (specialError) return {
			htmlStream: null,
			response: await options.renderSpecialErrorResponse(specialError)
		};
		const boundaryResponse = await options.renderErrorBoundaryResponse(error);
		if (boundaryResponse) return {
			htmlStream: null,
			response: boundaryResponse
		};
		throw error;
	}
}
function createAppPageRscErrorTracker(baseOnError) {
	let capturedError = null;
	return {
		getCapturedError() {
			return capturedError;
		},
		onRenderError(error, requestInfo, errorContext) {
			if (!(error && typeof error === "object" && "digest" in error)) capturedError = error;
			return baseOnError(error, requestInfo, errorContext);
		}
	};
}
function shouldRerenderAppPageWithGlobalError(options) {
	return Boolean(options.capturedError) && !options.hasLocalBoundary;
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-boundary-render.js
function getDefaultExport(module) {
	return module?.default ?? null;
}
async function resolveAppPageLayoutHead(layoutModules, params) {
	const filteredLayouts = layoutModules.filter(Boolean);
	const layoutMetadataPromises = [];
	let accumulatedMetadata = Promise.resolve({});
	for (let index = 0; index < filteredLayouts.length; index++) {
		const parentForLayout = accumulatedMetadata;
		const metadataPromise = resolveModuleMetadata(filteredLayouts[index], params, void 0, parentForLayout).catch((error) => {
			console.error("[vinext] Layout generateMetadata() failed:", error);
			return null;
		});
		layoutMetadataPromises.push(metadataPromise);
		accumulatedMetadata = metadataPromise.then(async (metadataResult) => {
			if (metadataResult) return mergeMetadata([await parentForLayout, metadataResult]);
			return parentForLayout;
		});
	}
	const [metadataResults, viewportResults] = await Promise.all([Promise.all(layoutMetadataPromises), Promise.all(filteredLayouts.map((layoutModule) => resolveModuleViewport(layoutModule, params).catch((error) => {
		console.error("[vinext] Layout generateViewport() failed:", error);
		return null;
	})))]);
	const metadataList = metadataResults.filter(Boolean);
	const viewportList = viewportResults.filter(Boolean);
	return {
		metadata: metadataList.length > 0 ? mergeMetadata(metadataList) : null,
		viewport: mergeViewport(viewportList)
	};
}
function wrapRenderedBoundaryElement(options) {
	return wrapAppPageBoundaryElement({
		element: options.element,
		getDefaultExport,
		globalErrorComponent: getDefaultExport(options.globalErrorModule),
		includeGlobalErrorBoundary: options.includeGlobalErrorBoundary,
		isRscRequest: options.isRscRequest,
		layoutModules: options.layoutModules,
		layoutTreePositions: options.layoutTreePositions,
		makeThenableParams: options.makeThenableParams,
		matchedParams: options.matchedParams,
		renderErrorBoundary(GlobalErrorComponent, children) {
			return (0, import_react_react_server.createElement)(ErrorBoundary, {
				fallback: GlobalErrorComponent,
				children
			});
		},
		renderLayout(LayoutComponent, children, asyncParams) {
			return (0, import_react_react_server.createElement)(LayoutComponent, {
				children,
				params: asyncParams
			});
		},
		renderLayoutSegmentProvider(segmentMap, children) {
			return (0, import_react_react_server.createElement)(LayoutSegmentProvider, { segmentMap }, children);
		},
		resolveChildSegments: options.resolveChildSegments,
		routeSegments: options.routeSegments ?? [],
		skipLayoutWrapping: options.skipLayoutWrapping
	});
}
function resolveAppPageBoundaryRootLayoutTreePath(route) {
	if (route?.layouts) {
		const rootLayoutEntry = createAppPageLayoutEntries({
			errors: route.errors,
			layoutTreePositions: route.layoutTreePositions,
			layouts: route.layouts,
			notFounds: null,
			routeSegments: route.routeSegments
		})[0];
		if (rootLayoutEntry) return rootLayoutEntry.treePath;
	}
	return null;
}
function createAppPageBoundaryRscPayload(options) {
	const routeId = createAppPayloadRouteId(options.pathname, null);
	return {
		[APP_INTERCEPTION_CONTEXT_KEY]: null,
		[APP_ROUTE_KEY]: routeId,
		[APP_ROOT_LAYOUT_KEY]: resolveAppPageBoundaryRootLayoutTreePath(options.route),
		[routeId]: options.element
	};
}
async function renderAppPageBoundaryElementResponse(options) {
	const pathname = new URL(options.requestUrl).pathname;
	return renderAppPageBoundaryResponse({
		async createHtmlResponse(rscStream, responseStatus) {
			const fontData = createAppPageFontData({
				getLinks: options.getFontLinks,
				getPreloads: options.getFontPreloads,
				getStyles: options.getFontStyles
			});
			const ssrHandler = await options.loadSsrHandler();
			return renderAppPageHtmlResponse({
				clearRequestContext: options.clearRequestContext,
				fontData,
				fontLinkHeader: options.buildFontLinkHeader(fontData.preloads),
				navigationContext: options.getNavigationContext(),
				rscStream,
				scriptNonce: options.scriptNonce,
				ssrHandler,
				status: responseStatus
			});
		},
		createRscOnErrorHandler() {
			return options.createRscOnErrorHandler(pathname, options.routePattern ?? pathname);
		},
		element: createAppPageBoundaryRscPayload({
			element: options.element,
			pathname,
			route: options.route
		}),
		isRscRequest: options.isRscRequest,
		renderToReadableStream: options.renderToReadableStream,
		status: options.status
	});
}
async function renderAppPageHttpAccessFallback(options) {
	const boundaryComponent = options.boundaryComponent ?? resolveAppPageHttpAccessBoundaryComponent({
		getDefaultExport,
		rootForbiddenModule: options.rootForbiddenModule,
		rootNotFoundModule: options.rootNotFoundModule,
		rootUnauthorizedModule: options.rootUnauthorizedModule,
		routeForbiddenModule: options.route?.forbidden,
		routeNotFoundModule: options.route?.notFound,
		routeUnauthorizedModule: options.route?.unauthorized,
		statusCode: options.statusCode
	});
	if (!boundaryComponent) return null;
	const layoutModules = options.layoutModules ?? options.route?.layouts ?? options.rootLayouts;
	const { metadata, viewport } = await resolveAppPageLayoutHead(layoutModules, options.matchedParams);
	const headElements = [(0, import_react_react_server.createElement)("meta", {
		charSet: "utf-8",
		key: "charset"
	}), (0, import_react_react_server.createElement)("meta", {
		content: "noindex",
		key: "robots",
		name: "robots"
	})];
	if (metadata) headElements.push((0, import_react_react_server.createElement)(MetadataHead, {
		key: "metadata",
		metadata
	}));
	headElements.push((0, import_react_react_server.createElement)(ViewportHead, {
		key: "viewport",
		viewport
	}));
	const element = wrapRenderedBoundaryElement({
		element: (0, import_react_react_server.createElement)(import_react_react_server.Fragment, null, ...headElements, (0, import_react_react_server.createElement)(boundaryComponent)),
		globalErrorModule: options.globalErrorModule,
		includeGlobalErrorBoundary: true,
		isRscRequest: options.isRscRequest,
		layoutModules,
		layoutTreePositions: options.route?.layoutTreePositions,
		makeThenableParams: options.makeThenableParams,
		matchedParams: options.matchedParams,
		resolveChildSegments: options.resolveChildSegments,
		routeSegments: options.route?.routeSegments
	});
	return renderAppPageBoundaryElementResponse({
		...options,
		element,
		layoutModules,
		route: options.route,
		routePattern: options.route?.pattern,
		status: options.statusCode
	});
}
async function renderAppPageErrorBoundary(options) {
	const errorBoundary = resolveAppPageErrorBoundary({
		getDefaultExport,
		globalErrorModule: options.globalErrorModule,
		layoutErrorModules: options.route?.errors,
		pageErrorModule: options.route?.error
	});
	if (!errorBoundary.component) return null;
	const rawError = options.error instanceof Error ? options.error : new Error(String(options.error));
	rewriteClientHookError(rawError);
	const errorObject = options.sanitizeErrorForClient(rawError);
	const matchedParams = options.matchedParams ?? options.route?.params ?? {};
	const layoutModules = options.route?.layouts ?? options.rootLayouts;
	const element = wrapRenderedBoundaryElement({
		element: (0, import_react_react_server.createElement)(errorBoundary.component, { error: errorObject }),
		globalErrorModule: options.globalErrorModule,
		includeGlobalErrorBoundary: !errorBoundary.isGlobalError,
		isRscRequest: options.isRscRequest,
		layoutModules,
		layoutTreePositions: options.route?.layoutTreePositions,
		makeThenableParams: options.makeThenableParams,
		matchedParams,
		resolveChildSegments: options.resolveChildSegments,
		routeSegments: options.route?.routeSegments,
		skipLayoutWrapping: errorBoundary.isGlobalError
	});
	return renderAppPageBoundaryElementResponse({
		...options,
		element,
		layoutModules,
		route: options.route,
		routePattern: options.route?.pattern,
		status: 200
	});
}
var _clientHookPattern = /\b(useState|useEffect|useReducer|useRef|useContext|useLayoutEffect|useInsertionEffect|useSyncExternalStore|useTransition|useImperativeHandle|useDeferredValue|useActionState|useOptimistic|useEffectEvent)\b.*is not a function/;
function rewriteClientHookError(error) {
	const match = error.message.match(_clientHookPattern);
	if (match) error.message = buildClientHookErrorMessage(`${match[1]}()`);
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-probe.js
async function probeAppPageBeforeRender(options) {
	let layoutFlags = {};
	if (options.layoutCount > 0) {
		const layoutProbeResult = await probeAppPageLayouts({
			layoutCount: options.layoutCount,
			async onLayoutError(layoutError, layoutIndex) {
				const specialError = options.resolveSpecialError(layoutError);
				if (!specialError) return null;
				return options.renderLayoutSpecialError(specialError, layoutIndex);
			},
			probeLayoutAt: options.probeLayoutAt,
			runWithSuppressedHookWarning(probe) {
				return options.runWithSuppressedHookWarning(probe);
			},
			classification: options.classification
		});
		layoutFlags = layoutProbeResult.layoutFlags;
		if (layoutProbeResult.response) return {
			response: layoutProbeResult.response,
			layoutFlags
		};
	}
	return {
		response: await probeAppPageComponent({
			awaitAsyncResult: !options.hasLoadingBoundary,
			async onError(pageError) {
				const specialError = options.resolveSpecialError(pageError);
				if (specialError) return options.renderPageSpecialError(specialError);
				return null;
			},
			probePage: options.probePage,
			runWithSuppressedHookWarning(probe) {
				return options.runWithSuppressedHookWarning(probe);
			}
		}),
		layoutFlags
	};
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-response.js
var STATIC_CACHE_CONTROL = "s-maxage=31536000, stale-while-revalidate";
var NO_STORE_CACHE_CONTROL = "no-store, must-revalidate";
function buildRevalidateCacheControl(revalidateSeconds) {
	return `s-maxage=${revalidateSeconds}, stale-while-revalidate`;
}
function applyTimingHeader(headers, timing) {
	if (!timing) return;
	const handlerStart = Math.round(timing.handlerStart);
	const compileMs = timing.compileEnd !== void 0 ? Math.round(timing.compileEnd - timing.handlerStart) : -1;
	const renderMs = timing.responseKind === "html" && timing.renderEnd !== void 0 && timing.compileEnd !== void 0 ? Math.round(timing.renderEnd - timing.compileEnd) : -1;
	headers.set("x-vinext-timing", `${handlerStart},${compileMs},${renderMs}`);
}
function resolveAppPageRscResponsePolicy(options) {
	if (options.isForceDynamic || options.dynamicUsedDuringBuild) return { cacheControl: NO_STORE_CACHE_CONTROL };
	if (options.revalidateSeconds === 0) return { cacheControl: NO_STORE_CACHE_CONTROL };
	if ((options.isForceStatic || options.isDynamicError) && !options.revalidateSeconds || options.revalidateSeconds === Infinity) return {
		cacheControl: STATIC_CACHE_CONTROL,
		cacheState: "STATIC"
	};
	if (options.revalidateSeconds) return {
		cacheControl: buildRevalidateCacheControl(options.revalidateSeconds),
		cacheState: options.isProduction ? "MISS" : void 0
	};
	return {};
}
function resolveAppPageHtmlResponsePolicy(options) {
	if (options.isForceDynamic) return {
		cacheControl: NO_STORE_CACHE_CONTROL,
		shouldWriteToCache: false
	};
	if (options.hasScriptNonce) return {
		cacheControl: NO_STORE_CACHE_CONTROL,
		shouldWriteToCache: false
	};
	if (options.revalidateSeconds === 0) return {
		cacheControl: NO_STORE_CACHE_CONTROL,
		shouldWriteToCache: false
	};
	if ((options.isForceStatic || options.isDynamicError) && options.revalidateSeconds === null) return {
		cacheControl: STATIC_CACHE_CONTROL,
		cacheState: "STATIC",
		shouldWriteToCache: false
	};
	if (options.dynamicUsedDuringRender) return {
		cacheControl: NO_STORE_CACHE_CONTROL,
		shouldWriteToCache: false
	};
	if (options.revalidateSeconds !== null && options.revalidateSeconds > 0 && options.revalidateSeconds !== Infinity) return {
		cacheControl: buildRevalidateCacheControl(options.revalidateSeconds),
		cacheState: options.isProduction ? "MISS" : void 0,
		shouldWriteToCache: options.isProduction
	};
	if (options.revalidateSeconds === Infinity) return {
		cacheControl: STATIC_CACHE_CONTROL,
		cacheState: "STATIC",
		shouldWriteToCache: false
	};
	return { shouldWriteToCache: false };
}
function buildAppPageRscResponse(body, options) {
	const headers = new Headers({
		"Content-Type": "text/x-component; charset=utf-8",
		Vary: "RSC, Accept"
	});
	if (options.params && Object.keys(options.params).length > 0) headers.set("X-Vinext-Params", encodeURIComponent(JSON.stringify(options.params)));
	if (options.mountedSlotsHeader) headers.set("X-Vinext-Mounted-Slots", options.mountedSlotsHeader);
	if (options.policy.cacheControl) headers.set("Cache-Control", options.policy.cacheControl);
	if (options.policy.cacheState) headers.set("X-Vinext-Cache", options.policy.cacheState);
	mergeMiddlewareResponseHeaders(headers, options.middlewareContext.headers);
	applyTimingHeader(headers, options.timing);
	return new Response(body, {
		status: options.middlewareContext.status ?? 200,
		headers
	});
}
function buildAppPageHtmlResponse(body, options) {
	const headers = new Headers({
		"Content-Type": "text/html; charset=utf-8",
		Vary: "RSC, Accept"
	});
	if (options.policy.cacheControl) headers.set("Cache-Control", options.policy.cacheControl);
	if (options.policy.cacheState) headers.set("X-Vinext-Cache", options.policy.cacheState);
	if (options.draftCookie) headers.append("Set-Cookie", options.draftCookie);
	if (options.fontLinkHeader) headers.set("Link", options.fontLinkHeader);
	mergeMiddlewareResponseHeaders(headers, options.middlewareContext.headers);
	applyTimingHeader(headers, options.timing);
	return new Response(body, {
		status: options.middlewareContext.status ?? 200,
		headers
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-render.js
function buildResponseTiming(options) {
	if (options.isProduction) return;
	return {
		compileEnd: options.compileEnd,
		handlerStart: options.handlerStart,
		renderEnd: options.renderEnd,
		responseKind: options.responseKind
	};
}
async function renderAppPageLifecycle(options) {
	const preRenderResult = await probeAppPageBeforeRender({
		hasLoadingBoundary: options.hasLoadingBoundary,
		layoutCount: options.layoutCount,
		probeLayoutAt(layoutIndex) {
			return options.probeLayoutAt(layoutIndex);
		},
		probePage() {
			return options.probePage();
		},
		renderLayoutSpecialError(specialError, layoutIndex) {
			return options.renderLayoutSpecialError(specialError, layoutIndex);
		},
		renderPageSpecialError(specialError) {
			return options.renderPageSpecialError(specialError);
		},
		resolveSpecialError: resolveAppPageSpecialError,
		runWithSuppressedHookWarning(probe) {
			return options.runWithSuppressedHookWarning(probe);
		},
		classification: options.classification
	});
	if (preRenderResult.response) return preRenderResult.response;
	const layoutFlags = preRenderResult.layoutFlags;
	const outgoingElement = buildOutgoingAppPayload({
		element: options.element,
		layoutFlags
	});
	const compileEnd = options.isProduction ? void 0 : performance.now();
	const rscErrorTracker = createAppPageRscErrorTracker(options.createRscOnErrorHandler(options.cleanPathname, options.routePattern));
	const rscStream = options.renderToReadableStream(outgoingElement, { onError: rscErrorTracker.onRenderError });
	let revalidateSeconds = options.revalidateSeconds;
	const rscCapture = teeAppPageRscStreamForCapture(rscStream, options.isProduction && revalidateSeconds !== null && revalidateSeconds > 0 && revalidateSeconds !== Infinity && !options.isForceDynamic);
	const rscForResponse = rscCapture.responseStream;
	const isrRscDataPromise = rscCapture.capturedRscDataPromise;
	if (options.isRscRequest) {
		const dynamicUsedDuringBuild = options.consumeDynamicUsage();
		const rscResponsePolicy = resolveAppPageRscResponsePolicy({
			dynamicUsedDuringBuild,
			isDynamicError: options.isDynamicError,
			isForceDynamic: options.isForceDynamic,
			isForceStatic: options.isForceStatic,
			isProduction: options.isProduction,
			revalidateSeconds
		});
		const rscResponse = buildAppPageRscResponse(rscForResponse, {
			middlewareContext: options.middlewareContext,
			mountedSlotsHeader: options.mountedSlotsHeader,
			params: options.params,
			policy: rscResponsePolicy,
			timing: buildResponseTiming({
				compileEnd,
				handlerStart: options.handlerStart,
				isProduction: options.isProduction,
				responseKind: "rsc"
			})
		});
		scheduleAppPageRscCacheWrite({
			capturedRscDataPromise: options.isProduction ? isrRscDataPromise : null,
			cleanPathname: options.cleanPathname,
			consumeDynamicUsage: options.consumeDynamicUsage,
			dynamicUsedDuringBuild,
			getPageTags() {
				return options.getPageTags();
			},
			isrDebug: options.isrDebug,
			isrRscKey: options.isrRscKey,
			isrSet: options.isrSet,
			mountedSlotsHeader: options.mountedSlotsHeader,
			revalidateSeconds: revalidateSeconds ?? 0,
			waitUntil(promise) {
				options.waitUntil?.(promise);
			}
		});
		return rscResponse;
	}
	const fontData = createAppPageFontData({
		getLinks: options.getFontLinks,
		getPreloads: options.getFontPreloads,
		getStyles: options.getFontStyles
	});
	const fontLinkHeader = buildAppPageFontLinkHeader(fontData.preloads);
	let renderEnd;
	const htmlRender = await renderAppPageHtmlStreamWithRecovery({
		onShellRendered() {
			if (!options.isProduction) renderEnd = performance.now();
		},
		renderErrorBoundaryResponse(error) {
			return options.renderErrorBoundaryResponse(error);
		},
		async renderHtmlStream() {
			const ssrHandler = await options.loadSsrHandler();
			return renderAppPageHtmlStream({
				fontData,
				navigationContext: options.getNavigationContext(),
				rscStream: rscForResponse,
				scriptNonce: options.scriptNonce,
				ssrHandler
			});
		},
		renderSpecialErrorResponse(specialError) {
			return options.renderPageSpecialError(specialError);
		},
		resolveSpecialError: resolveAppPageSpecialError
	});
	if (htmlRender.response) return htmlRender.response;
	const htmlStream = htmlRender.htmlStream;
	if (!htmlStream) throw new Error("[vinext] Expected an HTML stream when no fallback response was returned");
	if (shouldRerenderAppPageWithGlobalError({
		capturedError: rscErrorTracker.getCapturedError(),
		hasLocalBoundary: options.routeHasLocalBoundary
	})) {
		const cleanResponse = await options.renderErrorBoundaryResponse(rscErrorTracker.getCapturedError());
		if (cleanResponse) return cleanResponse;
	}
	const draftCookie = options.getDraftModeCookieHeader();
	const dynamicUsedDuringRender = options.consumeDynamicUsage();
	const requestCacheLife = options.getRequestCacheLife();
	if (requestCacheLife?.revalidate !== void 0 && revalidateSeconds === null) revalidateSeconds = requestCacheLife.revalidate;
	const safeHtmlStream = deferUntilStreamConsumed(htmlStream, () => {
		options.clearRequestContext();
	});
	const htmlResponsePolicy = resolveAppPageHtmlResponsePolicy({
		dynamicUsedDuringRender,
		hasScriptNonce: Boolean(options.scriptNonce),
		isDynamicError: options.isDynamicError,
		isForceDynamic: options.isForceDynamic,
		isForceStatic: options.isForceStatic,
		isProduction: options.isProduction,
		revalidateSeconds
	});
	const htmlResponseTiming = buildResponseTiming({
		compileEnd,
		handlerStart: options.handlerStart,
		isProduction: options.isProduction,
		renderEnd,
		responseKind: "html"
	});
	if (htmlResponsePolicy.shouldWriteToCache) return finalizeAppPageHtmlCacheResponse(buildAppPageHtmlResponse(safeHtmlStream, {
		draftCookie,
		fontLinkHeader,
		middlewareContext: options.middlewareContext,
		policy: htmlResponsePolicy,
		timing: htmlResponseTiming
	}), {
		capturedRscDataPromise: isrRscDataPromise,
		cleanPathname: options.cleanPathname,
		getPageTags() {
			return options.getPageTags();
		},
		isrDebug: options.isrDebug,
		isrHtmlKey: options.isrHtmlKey,
		isrRscKey: options.isrRscKey,
		isrSet: options.isrSet,
		revalidateSeconds: revalidateSeconds ?? 0,
		waitUntil(cachePromise) {
			options.waitUntil?.(cachePromise);
		}
	});
	return buildAppPageHtmlResponse(safeHtmlStream, {
		draftCookie,
		fontLinkHeader,
		middlewareContext: options.middlewareContext,
		policy: htmlResponsePolicy,
		timing: htmlResponseTiming
	});
}
//#endregion
//#region node_modules/vinext/dist/server/csp.js
var ESCAPE_REGEX = /[&><\u2028\u2029]/;
function matchesDirectiveName(directive, name) {
	return directive === name || directive.startsWith(`${name} `);
}
function getScriptNonceFromHeader(cspHeaderValue) {
	const directives = cspHeaderValue.split(";").map((directive) => directive.trim());
	const directive = directives.find((value) => matchesDirectiveName(value, "script-src")) ?? directives.find((value) => matchesDirectiveName(value, "default-src"));
	if (!directive) return;
	const nonce = directive.split(" ").slice(1).map((source) => source.trim()).find((source) => source.startsWith("'nonce-") && source.length > 8 && source.endsWith("'"))?.slice(7, -1);
	if (!nonce) return;
	if (ESCAPE_REGEX.test(nonce)) throw new Error("Nonce value from Content-Security-Policy contained HTML escape characters.\nLearn more: https://nextjs.org/docs/messages/nonce-contained-invalid-characters");
	return nonce;
}
function getScriptNonceFromHeaders(headers) {
	const csp = headers?.get("content-security-policy") ?? headers?.get("content-security-policy-report-only");
	if (!csp) return;
	return getScriptNonceFromHeader(csp);
}
function getScriptNonceFromHeaderSources(...headersList) {
	for (const headers of headersList) {
		const nonce = getScriptNonceFromHeaders(headers);
		if (nonce) return nonce;
	}
}
//#endregion
//#region node_modules/vinext/dist/server/app-page-request.js
function pickRouteParams(matchedParams, routeParamNames) {
	const params = {};
	for (const paramName of routeParamNames) {
		const value = matchedParams[paramName];
		if (value !== void 0) params[paramName] = value;
	}
	return params;
}
function areStaticParamsAllowed(params, staticParams) {
	const paramKeys = Object.keys(params);
	return staticParams.some((staticParamSet) => paramKeys.every((key) => {
		const value = params[key];
		const staticValue = staticParamSet[key];
		if (staticValue === void 0) return true;
		if (Array.isArray(value)) return JSON.stringify(value) === JSON.stringify(staticValue);
		if (typeof staticValue === "string" || typeof staticValue === "number" || typeof staticValue === "boolean") return String(value) === String(staticValue);
		return JSON.stringify(value) === JSON.stringify(staticValue);
	}));
}
async function validateAppPageDynamicParams(options) {
	if (!options.enforceStaticParamsOnly || !options.isDynamicRoute || typeof options.generateStaticParams !== "function") return null;
	try {
		const staticParams = await options.generateStaticParams({ params: options.params });
		if (Array.isArray(staticParams) && !areStaticParamsAllowed(options.params, staticParams)) {
			options.clearRequestContext();
			return new Response("Not Found", { status: 404 });
		}
	} catch (error) {
		options.logGenerateStaticParamsError?.(error);
	}
	return null;
}
function resolveAppPageInterceptState(options) {
	if (!options.isRscRequest) return { kind: "none" };
	const intercept = options.findIntercept(options.cleanPathname);
	if (!intercept) return { kind: "none" };
	const sourceRoute = options.getSourceRoute(intercept.sourceRouteIndex);
	if (!sourceRoute) return { kind: "none" };
	if (sourceRoute === options.currentRoute) return {
		kind: "current-route",
		intercept
	};
	return {
		kind: "source-route",
		intercept,
		sourceRoute
	};
}
function resolveAppPageActionRerenderTarget(options) {
	const interceptState = resolveAppPageInterceptState({
		cleanPathname: options.cleanPathname,
		currentRoute: options.currentRoute,
		findIntercept: options.findIntercept,
		getRouteParamNames: options.getRouteParamNames,
		getSourceRoute: options.getSourceRoute,
		isRscRequest: options.isRscRequest,
		toInterceptOpts: options.toInterceptOpts
	});
	if (interceptState.kind === "source-route") return {
		interceptOpts: options.toInterceptOpts(interceptState.intercept),
		navigationParams: interceptState.intercept.matchedParams,
		params: pickRouteParams(interceptState.intercept.matchedParams, options.getRouteParamNames(interceptState.sourceRoute)),
		route: interceptState.sourceRoute
	};
	return {
		interceptOpts: interceptState.kind === "current-route" ? options.toInterceptOpts(interceptState.intercept) : void 0,
		navigationParams: options.currentParams,
		params: options.currentParams,
		route: options.currentRoute
	};
}
async function resolveAppPageIntercept(options) {
	const interceptState = resolveAppPageInterceptState({
		cleanPathname: options.cleanPathname,
		currentRoute: options.currentRoute,
		findIntercept: options.findIntercept,
		getRouteParamNames: options.getRouteParamNames,
		getSourceRoute: options.getSourceRoute,
		isRscRequest: options.isRscRequest,
		toInterceptOpts: options.toInterceptOpts
	});
	if (interceptState.kind === "source-route") {
		options.setNavigationContext({
			params: interceptState.intercept.matchedParams,
			pathname: options.cleanPathname,
			searchParams: options.searchParams
		});
		const interceptElement = await options.buildPageElement(interceptState.sourceRoute, pickRouteParams(interceptState.intercept.matchedParams, options.getRouteParamNames(interceptState.sourceRoute)), options.toInterceptOpts(interceptState.intercept), options.searchParams);
		return {
			interceptOpts: void 0,
			response: await options.renderInterceptResponse(interceptState.sourceRoute, interceptElement)
		};
	}
	return {
		interceptOpts: interceptState.kind === "current-route" ? options.toInterceptOpts(interceptState.intercept) : void 0,
		response: null
	};
}
async function buildAppPageElement(options) {
	try {
		return {
			element: await options.buildPageElement(),
			response: null
		};
	} catch (error) {
		const specialError = options.resolveSpecialError(error);
		if (specialError) return {
			element: null,
			response: await options.renderSpecialError(specialError)
		};
		const errorBoundaryResponse = await options.renderErrorBoundaryPage(error);
		if (errorBoundaryResponse) return {
			element: null,
			response: errorBoundaryResponse
		};
		throw error;
	}
}
//#endregion
//#region node_modules/vinext/dist/shims/fetch-cache.js
/**
* Extended fetch() with Next.js caching semantics.
*
* Patches `globalThis.fetch` during server rendering to support:
*
*   fetch(url, { next: { revalidate: 60, tags: ['posts'] } })
*   fetch(url, { cache: 'force-cache' })
*   fetch(url, { cache: 'no-store' })
*
* Cached responses are stored via the pluggable CacheHandler, so
* revalidateTag() and revalidatePath() invalidate fetch-level caches.
*
* Usage (in server entry):
*   import { withFetchCache, cleanupFetchCache } from './fetch-cache';
*   const cleanup = withFetchCache();
*   try { ... render ... } finally { cleanup(); }
*
* Or use the async helper:
*   await runWithFetchCache(async () => { ... render ... });
*/
/**
* Headers excluded from the cache key. These are W3C trace context headers
* that can break request caching and deduplication.
* All other headers ARE included in the cache key, matching Next.js behavior.
*/
var HEADER_BLOCKLIST = ["traceparent", "tracestate"];
var CACHE_KEY_PREFIX = "v3";
var MAX_CACHE_KEY_BODY_BYTES = 1024 * 1024;
var BodyTooLargeForCacheKeyError = class extends Error {
	constructor() {
		super("Fetch body too large for cache key generation");
	}
};
var SkipCacheKeyGenerationError = class extends Error {
	constructor() {
		super("Fetch body could not be serialized for cache key generation");
	}
};
/**
* Collect all headers from the request, excluding the blocklist.
* Merges headers from both the Request object and the init object,
* with init taking precedence (matching fetch() spec behavior).
*/
function collectHeaders(input, init) {
	const merged = {};
	if (input instanceof Request && input.headers) input.headers.forEach((v, k) => {
		merged[k] = v;
	});
	if (init?.headers) (init.headers instanceof Headers ? init.headers : new Headers(init.headers)).forEach((v, k) => {
		merged[k] = v;
	});
	for (const blocked of HEADER_BLOCKLIST) delete merged[blocked];
	return merged;
}
/**
* Check whether a fetch request carries any per-user auth headers.
* Used for the safety bypass (skip caching when auth headers are present
* without an explicit cache opt-in).
*/
var AUTH_HEADERS = [
	"authorization",
	"cookie",
	"x-api-key"
];
function hasAuthHeaders(input, init) {
	const headers = collectHeaders(input, init);
	return AUTH_HEADERS.some((name) => name in headers);
}
async function serializeFormData(formData, pushBodyChunk, getTotalBodyBytes) {
	for (const [key, val] of formData.entries()) {
		if (typeof val === "string") {
			pushBodyChunk(JSON.stringify([key, {
				kind: "string",
				value: val
			}]));
			continue;
		}
		if (val.size > MAX_CACHE_KEY_BODY_BYTES || getTotalBodyBytes() + val.size > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(JSON.stringify([key, {
			kind: "file",
			name: val.name,
			type: val.type,
			value: await val.text()
		}]));
	}
}
function getParsedFormContentType(contentType) {
	const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();
	if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return mediaType;
}
function stripMultipartBoundary(contentType) {
	const [type, ...params] = contentType.split(";");
	const keptParams = params.map((param) => param.trim()).filter(Boolean).filter((param) => !/^boundary\s*=/i.test(param));
	const normalizedType = type.trim().toLowerCase();
	return keptParams.length > 0 ? `${normalizedType}; ${keptParams.join("; ")}` : normalizedType;
}
async function readRequestBodyChunksWithinLimit(request) {
	const contentLengthHeader = request.headers.get("content-length");
	if (contentLengthHeader) {
		const contentLength = Number(contentLengthHeader);
		if (Number.isFinite(contentLength) && contentLength > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
	}
	const requestClone = request.clone();
	const contentType = requestClone.headers.get("content-type") ?? void 0;
	const reader = requestClone.body?.getReader();
	if (!reader) return {
		chunks: [],
		contentType
	};
	const chunks = [];
	let totalBodyBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBodyBytes += value.byteLength;
			if (totalBodyBytes > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
			chunks.push(value);
		}
	} catch (err) {
		reader.cancel().catch(() => {});
		throw err;
	}
	return {
		chunks,
		contentType
	};
}
/**
* Serialize request body into string chunks for cache key inclusion.
* Handles all body types: string, Uint8Array, ReadableStream, FormData, Blob,
* and Request object bodies.
* Returns the serialized body chunks and optionally stashes the original body
* on init as `_ogBody` so it can still be used after stream consumption.
*/
async function serializeBody(input, init) {
	if (!init?.body && !(input instanceof Request && input.body)) return { bodyChunks: [] };
	const bodyChunks = [];
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	let totalBodyBytes = 0;
	let canonicalizedContentType;
	const pushBodyChunk = (chunk) => {
		totalBodyBytes += encoder.encode(chunk).byteLength;
		if (totalBodyBytes > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		bodyChunks.push(chunk);
	};
	const getTotalBodyBytes = () => totalBodyBytes;
	if (init?.body instanceof Uint8Array) {
		if (init.body.byteLength > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(decoder.decode(init.body));
		init._ogBody = init.body;
	} else if (init?.body && typeof init.body.getReader === "function") {
		const [bodyForHashing, bodyForFetch] = init.body.tee();
		init._ogBody = bodyForFetch;
		const reader = bodyForHashing.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (typeof value === "string") pushBodyChunk(value);
				else {
					totalBodyBytes += value.byteLength;
					if (totalBodyBytes > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
					bodyChunks.push(decoder.decode(value, { stream: true }));
				}
			}
			const finalChunk = decoder.decode();
			if (finalChunk) pushBodyChunk(finalChunk);
		} catch (err) {
			await reader.cancel();
			if (err instanceof BodyTooLargeForCacheKeyError) throw err;
			throw new SkipCacheKeyGenerationError();
		}
	} else if (init?.body instanceof URLSearchParams) {
		init._ogBody = init.body;
		pushBodyChunk(init.body.toString());
	} else if (init?.body && typeof init.body.keys === "function") {
		const formData = init.body;
		init._ogBody = init.body;
		await serializeFormData(formData, pushBodyChunk, getTotalBodyBytes);
	} else if (init?.body && typeof init.body.arrayBuffer === "function") {
		const blob = init.body;
		if (blob.size > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(await blob.text());
		const arrayBuffer = await blob.arrayBuffer();
		init._ogBody = new Blob([arrayBuffer], { type: blob.type });
	} else if (typeof init?.body === "string") {
		if (init.body.length > MAX_CACHE_KEY_BODY_BYTES) throw new BodyTooLargeForCacheKeyError();
		pushBodyChunk(init.body);
		init._ogBody = init.body;
	} else if (input instanceof Request && input.body) {
		let chunks;
		let contentType;
		try {
			({chunks, contentType} = await readRequestBodyChunksWithinLimit(input));
		} catch (err) {
			if (err instanceof BodyTooLargeForCacheKeyError) throw err;
			throw new SkipCacheKeyGenerationError();
		}
		const formContentType = getParsedFormContentType(contentType);
		if (formContentType) try {
			await serializeFormData(await new Request(input.url, {
				method: input.method,
				headers: contentType ? { "content-type": contentType } : void 0,
				body: new Blob(chunks)
			}).formData(), pushBodyChunk, getTotalBodyBytes);
			canonicalizedContentType = formContentType === "multipart/form-data" && contentType ? stripMultipartBoundary(contentType) : void 0;
			return {
				bodyChunks,
				canonicalizedContentType
			};
		} catch (err) {
			if (err instanceof BodyTooLargeForCacheKeyError) throw err;
			throw new SkipCacheKeyGenerationError();
		}
		for (const chunk of chunks) pushBodyChunk(decoder.decode(chunk, { stream: true }));
		const finalChunk = decoder.decode();
		if (finalChunk) pushBodyChunk(finalChunk);
	}
	return {
		bodyChunks,
		canonicalizedContentType
	};
}
/**
* Generate a deterministic cache key from a fetch request.
*
* Matches Next.js behavior: the key is a SHA-256 hash of a JSON array
* containing URL, method, all headers (minus blocklist), all RequestInit
* options, and the serialized body.
*/
async function buildFetchCacheKey(input, init) {
	let url;
	let method = "GET";
	if (typeof input === "string") url = input;
	else if (input instanceof URL) url = input.toString();
	else {
		url = input.url;
		method = input.method || "GET";
	}
	if (init?.method) method = init.method;
	const headers = collectHeaders(input, init);
	const { bodyChunks, canonicalizedContentType } = await serializeBody(input, init);
	if (canonicalizedContentType) headers["content-type"] = canonicalizedContentType;
	const cacheString = JSON.stringify([
		CACHE_KEY_PREFIX,
		url,
		method,
		headers,
		init?.mode,
		init?.redirect,
		init?.credentials,
		init?.referrer,
		init?.referrerPolicy,
		init?.integrity,
		init?.cache,
		bodyChunks
	]);
	const buffer = new TextEncoder().encode(cacheString);
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	return Array.prototype.map.call(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}
var _PENDING_KEY = Symbol.for("vinext.fetchCache.pendingRefetches");
var _gPending = globalThis;
var pendingRefetches = _gPending[_PENDING_KEY] ??= /* @__PURE__ */ new Map();
var DEDUP_TIMEOUT_MS = 6e4;
var _ORIG_FETCH_KEY = Symbol.for("vinext.fetchCache.originalFetch");
var _gFetch = globalThis;
var originalFetch = _gFetch[_ORIG_FETCH_KEY] ??= globalThis.fetch;
var _ALS_KEY$1 = Symbol.for("vinext.fetchCache.als");
var _FALLBACK_KEY$1 = Symbol.for("vinext.fetchCache.fallback");
var _g$1 = globalThis;
var _als$1 = _g$1[_ALS_KEY$1] ??= new AsyncLocalStorage();
var _fallbackState$1 = _g$1[_FALLBACK_KEY$1] ??= { currentRequestTags: [] };
function _getState$1() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _als$1.getStore() ?? _fallbackState$1;
}
/**
* Get tags collected during the current render pass.
* Useful for associating page-level cache entries with all the
* fetch tags used during rendering.
*/
function getCollectedFetchTags() {
	return [..._getState$1().currentRequestTags];
}
/**
* Create a patched fetch function with Next.js caching semantics.
*
* The patched fetch:
* 1. Checks `cache` and `next` options to determine caching behavior
* 2. On cache hit, returns the cached response without hitting the network
* 3. On cache miss, fetches from network, stores in cache, returns response
* 4. Respects `next.revalidate` for TTL-based revalidation
* 5. Respects `next.tags` for tag-based invalidation via revalidateTag()
*/
function createPatchedFetch() {
	return async function patchedFetch(input, init) {
		const nextOpts = init?.next;
		const cacheDirective = init?.cache;
		if (!nextOpts && !cacheDirective) return originalFetch(input, init);
		if (cacheDirective === "no-store" || cacheDirective === "no-cache" || nextOpts?.revalidate === false || nextOpts?.revalidate === 0) return originalFetch(input, stripNextFromInit(init));
		if (!(cacheDirective === "force-cache" || typeof nextOpts?.revalidate === "number" && nextOpts.revalidate > 0) && hasAuthHeaders(input, init)) return originalFetch(input, stripNextFromInit(init));
		let revalidateSeconds;
		if (cacheDirective === "force-cache") revalidateSeconds = nextOpts?.revalidate && typeof nextOpts.revalidate === "number" ? nextOpts.revalidate : 31536e3;
		else if (typeof nextOpts?.revalidate === "number" && nextOpts.revalidate > 0) revalidateSeconds = nextOpts.revalidate;
		else if (nextOpts?.tags && nextOpts.tags.length > 0) revalidateSeconds = 31536e3;
		else return originalFetch(input, stripNextFromInit(init));
		const tags = nextOpts?.tags ?? [];
		let cacheKey;
		try {
			cacheKey = await buildFetchCacheKey(input, init);
		} catch (err) {
			if (err instanceof BodyTooLargeForCacheKeyError || err instanceof SkipCacheKeyGenerationError) return originalFetch(input, stripNextFromInit(init));
			throw err;
		}
		const handler = getCacheHandler();
		const reqTags = _getState$1().currentRequestTags;
		if (tags.length > 0) {
			for (const tag of tags) if (!reqTags.includes(tag)) reqTags.push(tag);
		}
		try {
			const cached = await handler.get(cacheKey, {
				kind: "FETCH",
				tags
			});
			if (cached?.value && cached.value.kind === "FETCH" && cached.cacheState !== "stale") {
				const cachedData = cached.value.data;
				return new Response(cachedData.body, {
					status: cachedData.status ?? 200,
					headers: cachedData.headers
				});
			}
			if (cached?.value && cached.value.kind === "FETCH" && cached.cacheState === "stale") {
				const staleData = cached.value.data;
				if (!pendingRefetches.has(cacheKey)) {
					const refetchPromise = originalFetch(input, stripNextFromInit(init)).then(async (freshResp) => {
						if (freshResp.status !== 200) return;
						const freshBody = await freshResp.text();
						const freshHeaders = {};
						freshResp.headers.forEach((v, k) => {
							if (k.toLowerCase() === "set-cookie") return;
							freshHeaders[k] = v;
						});
						const freshValue = {
							kind: "FETCH",
							data: {
								headers: freshHeaders,
								body: freshBody,
								url: typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
								status: freshResp.status
							},
							tags,
							revalidate: revalidateSeconds
						};
						await handler.set(cacheKey, freshValue, {
							fetchCache: true,
							tags,
							revalidate: revalidateSeconds
						});
					}).catch((err) => {
						const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
						console.error(`[vinext] fetch cache background revalidation failed for ${url} (key=${cacheKey.slice(0, 12)}...):`, err);
					}).finally(() => {
						if (pendingRefetches.get(cacheKey) === refetchPromise) pendingRefetches.delete(cacheKey);
						clearTimeout(timeoutId);
					});
					pendingRefetches.set(cacheKey, refetchPromise);
					const timeoutId = setTimeout(() => {
						if (pendingRefetches.get(cacheKey) === refetchPromise) pendingRefetches.delete(cacheKey);
					}, DEDUP_TIMEOUT_MS);
					getRequestExecutionContext()?.waitUntil(refetchPromise);
				}
				return new Response(staleData.body, {
					status: staleData.status ?? 200,
					headers: staleData.headers
				});
			}
		} catch (cacheErr) {
			console.error("[vinext] fetch cache read error:", cacheErr);
		}
		const response = await originalFetch(input, stripNextFromInit(init));
		if (response.status === 200) {
			const cloned = response.clone();
			const body = await cloned.text();
			const headers = {};
			cloned.headers.forEach((v, k) => {
				if (k.toLowerCase() === "set-cookie") return;
				headers[k] = v;
			});
			const cacheValue = {
				kind: "FETCH",
				data: {
					headers,
					body,
					url: typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
					status: cloned.status
				},
				tags,
				revalidate: revalidateSeconds
			};
			handler.set(cacheKey, cacheValue, {
				fetchCache: true,
				tags,
				revalidate: revalidateSeconds
			}).catch((err) => {
				console.error("[vinext] fetch cache write error:", err);
			});
		}
		return response;
	};
}
/**
* Strip the `next` property from RequestInit before passing to real fetch.
* The `next` property is not a standard fetch option and would cause warnings
* in some environments.
*/
function stripNextFromInit(init) {
	if (!init) return init;
	const { next: _next, _ogBody, ...rest } = init;
	if (_ogBody !== void 0) rest.body = _ogBody;
	return Object.keys(rest).length > 0 ? rest : void 0;
}
var _PATCH_KEY = Symbol.for("vinext.fetchCache.patchInstalled");
function _ensurePatchInstalled() {
	if (_g$1[_PATCH_KEY]) return;
	_g$1[_PATCH_KEY] = true;
	globalThis.fetch = createPatchedFetch();
}
/**
* Install the patched fetch without creating a standalone ALS scope.
*
* `runWithFetchCache()` is the standalone helper: it installs the patch and
* creates an isolated per-request tag store. The unified request context owns
* that isolation itself via `currentRequestTags`, so callers inside
* `runWithRequestContext()` only need the process-global fetch monkey-patch.
*/
function ensureFetchPatch() {
	_ensurePatchInstalled();
}
//#endregion
//#region node_modules/vinext/dist/routing/route-trie.js
function createNode() {
	return {
		staticChildren: /* @__PURE__ */ new Map(),
		dynamicChild: null,
		catchAllChild: null,
		optionalCatchAllChild: null,
		route: null
	};
}
/**
* Build a trie from pre-sorted routes.
*
* Routes must have a `patternParts` property (string[] of URL segments).
* Pattern segment conventions:
*   - `:name`  — dynamic segment
*   - `:name+` — catch-all (1+ segments)
*   - `:name*` — optional catch-all (0+ segments)
*   - anything else — static segment
*
* First route to claim a terminal position wins (routes are pre-sorted
* by precedence, so insertion order preserves correct priority).
*/
function buildRouteTrie(routes) {
	const root = createNode();
	for (const route of routes) {
		const parts = route.patternParts;
		if (parts.length === 0) {
			if (root.route === null) root.route = route;
			continue;
		}
		let node = root;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (part.endsWith("+") && part.startsWith(":")) {
				if (i !== parts.length - 1) break;
				const paramName = part.slice(1, -1);
				if (node.catchAllChild === null) node.catchAllChild = {
					paramName,
					route
				};
				break;
			}
			if (part.endsWith("*") && part.startsWith(":")) {
				if (i !== parts.length - 1) break;
				const paramName = part.slice(1, -1);
				if (node.optionalCatchAllChild === null) node.optionalCatchAllChild = {
					paramName,
					route
				};
				break;
			}
			if (part.startsWith(":")) {
				const paramName = part.slice(1);
				if (node.dynamicChild === null) node.dynamicChild = {
					paramName,
					node: createNode()
				};
				node = node.dynamicChild.node;
				if (i === parts.length - 1) {
					if (node.route === null) node.route = route;
				}
				continue;
			}
			let child = node.staticChildren.get(part);
			if (!child) {
				child = createNode();
				node.staticChildren.set(part, child);
			}
			node = child;
			if (i === parts.length - 1) {
				if (node.route === null) node.route = route;
			}
		}
	}
	return root;
}
/**
* Match a URL against the trie.
*
* @param root - Trie root built by `buildRouteTrie`
* @param urlParts - Pre-split URL segments (no empty strings)
* @returns Match result with route and extracted params, or null
*/
function trieMatch(root, urlParts) {
	return match(root, urlParts, 0);
}
function match(node, urlParts, index) {
	if (index === urlParts.length) {
		if (node.route !== null) return {
			route: node.route,
			params: Object.create(null)
		};
		if (node.optionalCatchAllChild !== null) {
			const params = Object.create(null);
			params[node.optionalCatchAllChild.paramName] = [];
			return {
				route: node.optionalCatchAllChild.route,
				params
			};
		}
		return null;
	}
	const segment = urlParts[index];
	const staticChild = node.staticChildren.get(segment);
	if (staticChild) {
		const result = match(staticChild, urlParts, index + 1);
		if (result !== null) return result;
	}
	if (node.dynamicChild !== null) {
		const result = match(node.dynamicChild.node, urlParts, index + 1);
		if (result !== null) {
			result.params[node.dynamicChild.paramName] = segment;
			return result;
		}
	}
	if (node.catchAllChild !== null) {
		const remaining = urlParts.slice(index);
		const params = Object.create(null);
		params[node.catchAllChild.paramName] = remaining;
		return {
			route: node.catchAllChild.route,
			params
		};
	}
	if (node.optionalCatchAllChild !== null) {
		const remaining = urlParts.slice(index);
		const params = Object.create(null);
		params[node.optionalCatchAllChild.paramName] = remaining;
		return {
			route: node.optionalCatchAllChild.route,
			params
		};
	}
	return null;
}
//#endregion
//#region node_modules/vinext/dist/shims/navigation-state.js
/**
* Server-only navigation state backed by AsyncLocalStorage.
*
* This module provides request-scoped isolation for navigation context
* and useServerInsertedHTML callbacks. Without ALS, concurrent requests
* on Cloudflare Workers would share module-level state and leak data
* (pathnames, params, CSS-in-JS styles) between requests.
*
* This module is server-only — it imports node:async_hooks and must NOT
* be bundled for the browser. The dual-environment navigation.ts shim
* uses a registration pattern so it works in both environments.
*/
var _ALS_KEY = Symbol.for("vinext.navigation.als");
var _FALLBACK_KEY = Symbol.for("vinext.navigation.fallback");
var _g = globalThis;
var _als = _g[_ALS_KEY] ??= new AsyncLocalStorage();
var _fallbackState = _g[_FALLBACK_KEY] ??= {
	serverContext: null,
	serverInsertedHTMLCallbacks: []
};
function _getState() {
	if (isInsideUnifiedScope()) return getRequestContext();
	return _als.getStore() ?? _fallbackState;
}
var _accessors = {
	getServerContext() {
		return _getState().serverContext;
	},
	setServerContext(ctx) {
		_getState().serverContext = ctx;
	},
	getInsertedHTMLCallbacks() {
		return _getState().serverInsertedHTMLCallbacks;
	},
	clearInsertedHTMLCallbacks() {
		_getState().serverInsertedHTMLCallbacks = [];
	}
};
_registerStateAccessors(_accessors);
globalThis[GLOBAL_ACCESSORS_KEY] = _accessors;
//#endregion
//#region node_modules/vinext/dist/server/instrumentation.js
/**
* Get the registered onRequestError handler (if any).
*
* Reads from globalThis so it works across Vite environment boundaries.
*/
function getOnRequestErrorHandler() {
	return globalThis.__VINEXT_onRequestErrorHandler__ ?? null;
}
/**
* Report a request error via the instrumentation handler.
*
* No-op if no onRequestError handler is registered.
*
* Reads the handler from globalThis so this function works correctly regardless
* of which environment it is called from.
*/
function reportRequestError(error, request, context) {
	const handler = getOnRequestErrorHandler();
	if (!handler) return Promise.resolve();
	const promise = (async () => {
		try {
			await handler(error, request, context);
		} catch (reportErr) {
			console.error("[vinext] onRequestError handler threw:", reportErr instanceof Error ? reportErr.message : String(reportErr));
		}
	})();
	getRequestExecutionContext()?.waitUntil(promise);
	return promise;
}
//#endregion
//#region node_modules/vinext/dist/shims/font-google-base.js
/**
* next/font/google shim
*
* Provides a compatible shim for Next.js Google Fonts.
*
* Two modes:
* 1. **Dev / CDN mode** (default): Loads fonts from Google Fonts CDN via <link> tags.
* 2. **Self-hosted mode** (production build): The vinext:google-fonts Vite plugin
*    fetches font CSS + .woff2 files at build time, caches them locally, and injects
*    @font-face CSS pointing at local assets. No requests to Google at runtime.
*
* Usage:
*   import { Inter } from 'next/font/google';
*   const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
*   // inter.className -> unique CSS class
*   // inter.style -> { fontFamily: "'Inter', sans-serif" }
*   // inter.variable -> CSS variable name like '--font-inter'
*/
/**
* Escape a string for safe interpolation inside a CSS single-quoted string.
*
* Prevents CSS injection by escaping characters that could break out of
* a `'...'` CSS string context: backslashes, single quotes, and newlines.
*/
function escapeCSSString(value) {
	return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ");
}
/**
* Validate a CSS custom property name (e.g. `--font-inter`).
*
* Custom properties must start with `--` and only contain alphanumeric
* characters, hyphens, and underscores. Anything else could be used to
* break out of the CSS declaration and inject arbitrary rules.
*
* Returns the name if valid, undefined otherwise.
*/
function sanitizeCSSVarName(name) {
	if (/^--[a-zA-Z0-9_-]+$/.test(name)) return name;
}
/**
* Sanitize a CSS font-family fallback name.
*
* Generic family names (sans-serif, serif, monospace, etc.) are used as-is.
* Named families are wrapped in escaped quotes. This prevents injection via
* crafted fallback values like `); } body { color: red; } .x {`.
*/
function sanitizeFallback(name) {
	const generics = new Set([
		"serif",
		"sans-serif",
		"monospace",
		"cursive",
		"fantasy",
		"system-ui",
		"ui-serif",
		"ui-sans-serif",
		"ui-monospace",
		"ui-rounded",
		"emoji",
		"math",
		"fangsong"
	]);
	const trimmed = name.trim();
	if (generics.has(trimmed)) return trimmed;
	return `'${escapeCSSString(trimmed)}'`;
}
var classCounter = 0;
var injectedFonts = /* @__PURE__ */ new Set();
/**
* Convert a font family name to a CSS variable name.
* e.g., "Inter" -> "--font-inter", "Roboto Mono" -> "--font-roboto-mono"
*/
function toVarName(family) {
	return "--font-" + family.toLowerCase().replace(/\s+/g, "-");
}
/**
* Build a Google Fonts CSS URL.
*/
function buildGoogleFontsUrl(family, options) {
	const params = new URLSearchParams();
	let spec = family;
	const weights = options.weight ? Array.isArray(options.weight) ? options.weight : [options.weight] : [];
	const styles = options.style ? Array.isArray(options.style) ? options.style : [options.style] : [];
	if (weights.length > 0 || styles.length > 0) {
		const hasItalic = styles.includes("italic");
		if (weights.length > 0) if (hasItalic) {
			const pairs = [];
			for (const w of weights) {
				pairs.push(`0,${w}`);
				pairs.push(`1,${w}`);
			}
			spec += `:ital,wght@${pairs.join(";")}`;
		} else spec += `:wght@${weights.join(";")}`;
	} else spec += `:wght@100..900`;
	params.set("family", spec);
	params.set("display", options.display ?? "swap");
	return `https://fonts.googleapis.com/css2?${params.toString()}`;
}
/**
* Inject a <link> tag for the font (client-side only).
* On the server, we track font URLs for SSR head injection.
*/
function injectFontStylesheet(url) {
	if (injectedFonts.has(url)) return;
	injectedFonts.add(url);
	if (typeof document !== "undefined") {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = url;
		document.head.appendChild(link);
	}
}
/** Track which className CSS rules have been injected. */
var injectedClassRules = /* @__PURE__ */ new Set();
/**
* Inject a CSS rule that maps a className to a font-family.
*
* This is what makes `<div className={inter.className}>` apply the font.
* Next.js generates equivalent rules at build time.
*
* In Next.js, the .className class ONLY sets font-family — it does NOT
* set CSS variables. CSS variables are handled separately by the .variable class.
*/
function injectClassNameRule(className, fontFamily) {
	if (injectedClassRules.has(className)) return;
	injectedClassRules.add(className);
	const css = `.${className} { font-family: ${fontFamily}; }\n`;
	if (typeof document === "undefined") {
		ssrFontStyles$1.push(css);
		return;
	}
	const style = document.createElement("style");
	style.textContent = css;
	style.setAttribute("data-vinext-font-class", className);
	document.head.appendChild(style);
}
/** Track which variable class CSS rules have been injected. */
var injectedVariableRules = /* @__PURE__ */ new Set();
/** Track which :root CSS variable rules have been injected. */
var injectedRootVariables = /* @__PURE__ */ new Set();
/**
* Inject a CSS rule that sets a CSS variable on an element.
* This is what makes `<html className={inter.variable}>` set the CSS variable
* that can be referenced by other styles (e.g., Tailwind's font-sans).
*
* In Next.js, the .variable class ONLY sets the CSS variable — it does NOT
* set font-family. This is critical because apps commonly apply multiple
* .variable classes to <body> (e.g., geistSans.variable + geistMono.variable).
* If we also set font-family here, the last class wins due to CSS cascade,
* causing all text to use that font (e.g., everything becomes monospace).
*/
function injectVariableClassRule(variableClassName, cssVarName, fontFamily) {
	if (injectedVariableRules.has(variableClassName)) return;
	injectedVariableRules.add(variableClassName);
	let css = `.${variableClassName} { ${cssVarName}: ${fontFamily}; }\n`;
	if (!injectedRootVariables.has(cssVarName)) {
		injectedRootVariables.add(cssVarName);
		css += `:root { ${cssVarName}: ${fontFamily}; }\n`;
	}
	if (typeof document === "undefined") {
		ssrFontStyles$1.push(css);
		return;
	}
	const style = document.createElement("style");
	style.textContent = css;
	style.setAttribute("data-vinext-font-variable", variableClassName);
	document.head.appendChild(style);
}
var ssrFontStyles$1 = [];
/**
* Get collected SSR font class styles (used by the renderer).
* Note: We don't clear the arrays because fonts are loaded at module import
* time and need to persist across all requests in the Workers environment.
*/
function getSSRFontStyles$1() {
	return [...ssrFontStyles$1];
}
var ssrFontUrls = [];
/**
* Get collected SSR font URLs (used by the renderer).
* Note: We don't clear the arrays because fonts are loaded at module import
* time and need to persist across all requests in the Workers environment.
*/
function getSSRFontLinks() {
	return [...ssrFontUrls];
}
var ssrFontPreloads$1 = [];
var ssrFontPreloadHrefs = /* @__PURE__ */ new Set();
/**
* Get collected SSR font preload data (used by the renderer).
* Returns an array of { href, type } objects for emitting
* <link rel="preload" as="font" ...> tags.
*/
function getSSRFontPreloads$1() {
	return [...ssrFontPreloads$1];
}
/**
* Determine the MIME type for a font file based on its extension.
*/
function getFontMimeType(pathOrUrl) {
	if (pathOrUrl.endsWith(".woff2")) return "font/woff2";
	if (pathOrUrl.endsWith(".woff")) return "font/woff";
	if (pathOrUrl.endsWith(".ttf")) return "font/ttf";
	if (pathOrUrl.endsWith(".otf")) return "font/opentype";
	return "font/woff2";
}
/**
* Extract font file URLs from @font-face CSS rules.
* Parses url('...') references from the CSS text.
*/
function extractFontUrlsFromCSS(css) {
	const urls = [];
	const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
	let match;
	while ((match = urlRegex.exec(css)) !== null) {
		const url = match[1];
		if (url && url.startsWith("/")) urls.push(url);
	}
	return urls;
}
/**
* Collect font file URLs from self-hosted CSS for preload link generation.
* Only collects on the server (SSR). Deduplicates by href using a Set for O(1) lookups.
*/
function collectFontPreloadsFromCSS(css) {
	if (typeof document !== "undefined") return;
	const urls = extractFontUrlsFromCSS(css);
	for (const href of urls) if (!ssrFontPreloadHrefs.has(href)) {
		ssrFontPreloadHrefs.add(href);
		ssrFontPreloads$1.push({
			href,
			type: getFontMimeType(href)
		});
	}
}
/** Track injected self-hosted @font-face blocks (deduplicate) */
var injectedSelfHosted = /* @__PURE__ */ new Set();
/**
* Inject self-hosted @font-face CSS (from the build plugin).
* This replaces the CDN <link> tag with inline CSS.
*/
function injectSelfHostedCSS(css) {
	if (injectedSelfHosted.has(css)) return;
	injectedSelfHosted.add(css);
	collectFontPreloadsFromCSS(css);
	if (typeof document === "undefined") {
		ssrFontStyles$1.push(css);
		return;
	}
	const style = document.createElement("style");
	style.textContent = css;
	style.setAttribute("data-vinext-font-selfhosted", "true");
	document.head.appendChild(style);
}
function createFontLoader(family) {
	return function fontLoader(options = {}) {
		const id = classCounter++;
		const className = `__font_${family.toLowerCase().replace(/\s+/g, "_")}_${id}`;
		const fallback = options.fallback ?? ["sans-serif"];
		const fontFamily = `'${escapeCSSString(family)}', ${fallback.map(sanitizeFallback).join(", ")}`;
		const defaultVarName = toVarName(family);
		const cssVarName = options.variable ? sanitizeCSSVarName(options.variable) ?? defaultVarName : defaultVarName;
		const variableClassName = `__variable_${family.toLowerCase().replace(/\s+/g, "_")}_${id}`;
		if (options._selfHostedCSS) injectSelfHostedCSS(options._selfHostedCSS);
		else {
			const url = buildGoogleFontsUrl(family, options);
			injectFontStylesheet(url);
			if (typeof document === "undefined") {
				if (!ssrFontUrls.includes(url)) ssrFontUrls.push(url);
			}
		}
		injectClassNameRule(className, fontFamily);
		injectVariableClassRule(variableClassName, cssVarName, fontFamily);
		return {
			className,
			style: { fontFamily },
			variable: variableClassName
		};
	};
}
var googleFonts = new Proxy({}, { get(_target, prop) {
	if (prop === "__esModule") return true;
	if (prop === "default") return googleFonts;
	return createFontLoader(prop.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2"));
} });
//#endregion
//#region node_modules/vinext/dist/shims/font-local.js
var ssrFontStyles = [];
var ssrFontPreloads = [];
/**
* Get collected SSR font styles (used by the renderer).
* Note: We don't clear the arrays because fonts are loaded at module import
* time and need to persist across all requests in the Workers environment.
*/
function getSSRFontStyles() {
	return [...ssrFontStyles];
}
/**
* Get collected SSR font preload data (used by the renderer).
* Returns an array of { href, type } objects for emitting
* <link rel="preload" as="font" ...> tags.
*/
function getSSRFontPreloads() {
	return [...ssrFontPreloads];
}
//#endregion
//#region app/page.tsx
var page_exports$7 = /* @__PURE__ */ __exportAll({ default: () => page_default$7 });
var page_default$7 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "6efdf509a785", "default");
var Resources = ((React, deps, RemoveDuplicateServerCss, precedence) => {
	return function Resources() {
		return React.createElement(React.Fragment, null, [...deps.css.map((href) => React.createElement("link", {
			key: "css:" + href,
			rel: "stylesheet",
			...precedence ? { precedence } : {},
			href,
			"data-rsc-css-href": href
		})), RemoveDuplicateServerCss && React.createElement(RemoveDuplicateServerCss, { key: "remove-duplicate-css" })]);
	};
})(import_react_react_server.default, assetsManifest.serverResources["app/layout.tsx"], void 0, "vite-rsc/importer-resources");
//#endregion
//#region \0virtual:vinext-google-fonts?fonts=Playfair_Display%2CDM_Sans
var Playfair_Display = /* @__PURE__ */ createFontLoader("Playfair Display");
var DM_Sans = /* @__PURE__ */ createFontLoader("DM Sans");
//#endregion
//#region api/auth-context.tsx
var AuthProvider = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'AuthProvider' is called on server");
}, "fca983fe7b7c", "AuthProvider");
//#endregion
//#region app/layout.tsx
var layout_exports = /* @__PURE__ */ __exportAll({
	default: () => $$wrap_RootLayout,
	metadata: () => metadata
});
var playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-display",
	display: "swap"
});
var dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-body",
	display: "swap"
});
var metadata = {
	title: "Crescent Learning",
	description: "Your gateway to knowledge"
};
function RootLayout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("html", {
		lang: "en",
		"data-scroll-behavior": "smooth",
		className: `${playfair.variable} ${dmSans.variable}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)("body", {
			className: "bg-ink text-white font-body antialiased",
			children: /* @__PURE__ */ (0, import_jsx_runtime_react_server.jsx)(AuthProvider, { children })
		})
	});
}
var $$wrap_RootLayout = /* @__PURE__ */ __vite_rsc_wrap_css__(RootLayout, "default");
function __vite_rsc_wrap_css__(value, name) {
	if (typeof value !== "function") return value;
	function __wrapper(props) {
		return import_react_react_server.createElement(import_react_react_server.Fragment, null, import_react_react_server.createElement(Resources), import_react_react_server.createElement(value, props));
	}
	Object.defineProperty(__wrapper, "name", { value: name });
	return __wrapper;
}
//#endregion
//#region app/api/login/route.ts
var route_exports$1 = /* @__PURE__ */ __exportAll({ POST: () => POST });
async function POST(req) {
	const body = await req.json();
	console.log("request for login" + body);
	const res = await fetch("https://api.crescentlearning.org/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify(body)
	});
	const data = await res.json();
	console.log(data);
	return NextResponse.json(data, { status: res.status });
}
//#endregion
//#region app/api/profile/route.ts
var route_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
async function GET(req) {
	console.log("request for profile");
	const token = req.headers.get("authorization") || "";
	const res = await fetch("https://api.crescentlearning.org/profile", { headers: {
		Accept: "application/json",
		Authorization: token
	} });
	const data = await res.json();
	console.log(data);
	return NextResponse.json(data, { status: res.status });
}
//#endregion
//#region app/courses/page.tsx
var page_exports$6 = /* @__PURE__ */ __exportAll({ default: () => page_default$6 });
var page_default$6 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "c237b91ab318", "default");
//#endregion
//#region app/dashboard/page.tsx
var page_exports$5 = /* @__PURE__ */ __exportAll({ default: () => page_default$5 });
var page_default$5 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "e16c1c1133d5", "default");
//#endregion
//#region app/login/page.tsx
var page_exports$4 = /* @__PURE__ */ __exportAll({ default: () => page_default$4 });
var page_default$4 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "b49ea5cf04c0", "default");
//#endregion
//#region app/profile/page.tsx
var page_exports$3 = /* @__PURE__ */ __exportAll({ default: () => page_default$3 });
var page_default$3 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "b5f72a92d407", "default");
//#endregion
//#region app/courses/[courseId]/page.tsx
var page_exports$2 = /* @__PURE__ */ __exportAll({ default: () => page_default$2 });
var page_default$2 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "061b9fa1e40a", "default");
//#endregion
//#region app/subjects/[subjectId]/page.tsx
var page_exports$1 = /* @__PURE__ */ __exportAll({ default: () => page_default$1 });
var page_default$1 = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "fd66447d98ef", "default");
//#endregion
//#region app/units/[unitId]/page.tsx
var page_exports = /* @__PURE__ */ __exportAll({ default: () => page_default });
var page_default = /* @__PURE__ */ registerClientReference(() => {
	throw new Error("Unexpectedly client reference export 'default' is called on server");
}, "a92b8f6cff96", "default");
//#endregion
//#region \0virtual:vinext-rsc-entry
function renderToReadableStream(model, options) {
	const _hlFixRe = /(\d*:HL\[.*?),"stylesheet"(\]|,)/g;
	const stream = renderToReadableStream$1(model, options);
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let carry = "";
	return stream.pipeThrough(new TransformStream({
		transform(chunk, controller) {
			const text = carry + decoder.decode(chunk, { stream: true });
			const lastNl = text.lastIndexOf("\n");
			if (lastNl === -1) {
				carry = text;
				return;
			}
			carry = text.slice(lastNl + 1);
			controller.enqueue(encoder.encode(text.slice(0, lastNl + 1).replace(_hlFixRe, "$1,\"style\"$2")));
		},
		flush(controller) {
			const text = carry + decoder.decode();
			if (text) controller.enqueue(encoder.encode(text.replace(_hlFixRe, "$1,\"style\"$2")));
		}
	}));
}
function _getSSRFontStyles() {
	return [...getSSRFontStyles$1(), ...getSSRFontStyles()];
}
function _getSSRFontPreloads() {
	return [...getSSRFontPreloads$1(), ...getSSRFontPreloads()];
}
var _suppressHookWarningAls = new AsyncLocalStorage();
var _origConsoleError = console.error;
console.error = (...args) => {
	if (_suppressHookWarningAls.getStore() === true && typeof args[0] === "string" && args[0].includes("Invalid hook call")) return;
	_origConsoleError.apply(console, args);
};
function setNavigationContext(ctx) {
	setNavigationContext$1(ctx);
}
async function __isrGet(key) {
	const result = await getCacheHandler().get(key);
	if (!result || !result.value) return null;
	return {
		value: result,
		isStale: result.cacheState === "stale"
	};
}
async function __isrSet(key, data, revalidateSeconds, tags) {
	await getCacheHandler().set(key, data, {
		revalidate: revalidateSeconds,
		tags: Array.isArray(tags) ? tags : []
	});
}
function __pageCacheTags(pathname, extraTags) {
	const tags = [pathname, "_N_T_" + pathname];
	tags.push("_N_T_/layout");
	const segments = pathname.split("/");
	let built = "";
	for (let i = 1; i < segments.length; i++) if (segments[i]) {
		built += "/" + segments[i];
		tags.push("_N_T_" + built + "/layout");
	}
	tags.push("_N_T_" + built + "/page");
	if (Array.isArray(extraTags)) {
		for (const tag of extraTags) if (!tags.includes(tag)) tags.push(tag);
	}
	return tags;
}
var __pendingRegenerations = /* @__PURE__ */ new Map();
function __triggerBackgroundRegeneration(key, renderFn) {
	if (__pendingRegenerations.has(key)) return;
	const promise = renderFn().catch((err) => console.error("[vinext] ISR regen failed for " + key + ":", err)).finally(() => __pendingRegenerations.delete(key));
	__pendingRegenerations.set(key, promise);
	const ctx = getRequestExecutionContext();
	if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(promise);
}
function __isrFnv1a64(s) {
	let h1 = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h1 ^= s.charCodeAt(i);
		h1 = h1 * 16777619 >>> 0;
	}
	let h2 = 84696351;
	for (let i = 0; i < s.length; i++) {
		h2 ^= s.charCodeAt(i);
		h2 = h2 * 16777619 >>> 0;
	}
	return h1.toString(36) + h2.toString(36);
}
function __isrCacheKey(pathname, suffix) {
	const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
	const prefix = "app:d1fb96d3-890d-45e4-924c-909014a764fb";
	const key = prefix + ":" + normalized + ":" + suffix;
	if (key.length <= 200) return key;
	return prefix + ":__hash:" + __isrFnv1a64(normalized) + ":" + suffix;
}
function __isrHtmlKey(pathname) {
	return __isrCacheKey(pathname, "html");
}
function __isrRscKey(pathname, mountedSlotsHeader) {
	if (!mountedSlotsHeader) return __isrCacheKey(pathname, "rsc");
	return __isrCacheKey(pathname, "rsc:" + __isrFnv1a64(mountedSlotsHeader));
}
function __normalizeMountedSlotsHeader(raw) {
	if (!raw) return null;
	return Array.from(new Set(raw.split(/\s+/).filter(Boolean))).sort().join(" ") || null;
}
function __isrRouteKey(pathname) {
	return __isrCacheKey(pathname, "route");
}
var __isrDebug = process.env.NEXT_PRIVATE_DEBUG_CACHE ? console.debug.bind(console, "[vinext] ISR:") : void 0;
var __classDebug = process.env.VINEXT_DEBUG_CLASSIFICATION ? function(layoutId, reason) {
	console.debug("[vinext] CLS:", layoutId, reason);
} : void 0;
function makeThenableParams(obj) {
	const plain = { ...obj };
	return Object.assign(Promise.resolve(plain), plain);
}
function __errorDigest(str) {
	let hash = 5381;
	for (let i = str.length - 1; i >= 0; i--) hash = hash * 33 ^ str.charCodeAt(i);
	return (hash >>> 0).toString();
}
function __sanitizeErrorForClient(error) {
	if (resolveAppPageSpecialError(error)) return error;
	const msg = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack || "" : "";
	const sanitized = /* @__PURE__ */ new Error("An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.");
	sanitized.digest = __errorDigest(msg + stack);
	return sanitized;
}
function rscOnError(error, requestInfo, errorContext) {
	if (error && typeof error === "object" && "digest" in error) return String(error.digest);
	if (requestInfo && errorContext && error) reportRequestError(error instanceof Error ? error : new Error(String(error)), requestInfo, errorContext);
	if (error) return __errorDigest((error instanceof Error ? error.message : String(error)) + (error instanceof Error ? error.stack || "" : ""));
}
function createRscOnErrorHandler(request, pathname, routePath) {
	const requestInfo = {
		path: pathname,
		method: request.method,
		headers: Object.fromEntries(request.headers.entries())
	};
	const errorContext = {
		routerKind: "App Router",
		routePath: routePath || pathname,
		routeType: "render"
	};
	return function(error) {
		return rscOnError(error, requestInfo, errorContext);
	};
}
function __VINEXT_CLASS(routeIdx) { return ((routeIdx) => {
    switch (routeIdx) {
      default: return null;
    }
  })(routeIdx); }
function __VINEXT_CLASS_REASONS(routeIdx) {
	return null;
}
var routes = [
	{
		__buildTimeClassifications: __VINEXT_CLASS(0),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(0) : null,
		pattern: "/",
		patternParts: [],
		isDynamic: false,
		params: [],
		page: page_exports$7,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: [],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(1),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(1) : null,
		pattern: "/api/login",
		patternParts: ["api", "login"],
		isDynamic: false,
		params: [],
		page: null,
		routeHandler: route_exports$1,
		layouts: [layout_exports],
		routeSegments: ["api", "login"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(2),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(2) : null,
		pattern: "/api/profile",
		patternParts: ["api", "profile"],
		isDynamic: false,
		params: [],
		page: null,
		routeHandler: route_exports,
		layouts: [layout_exports],
		routeSegments: ["api", "profile"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(3),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(3) : null,
		pattern: "/courses",
		patternParts: ["courses"],
		isDynamic: false,
		params: [],
		page: page_exports$6,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["courses"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(4),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(4) : null,
		pattern: "/dashboard",
		patternParts: ["dashboard"],
		isDynamic: false,
		params: [],
		page: page_exports$5,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["dashboard"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(5),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(5) : null,
		pattern: "/login",
		patternParts: ["login"],
		isDynamic: false,
		params: [],
		page: page_exports$4,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["login"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(6),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(6) : null,
		pattern: "/profile",
		patternParts: ["profile"],
		isDynamic: false,
		params: [],
		page: page_exports$3,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["profile"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(7),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(7) : null,
		pattern: "/courses/:courseId",
		patternParts: ["courses", ":courseId"],
		isDynamic: true,
		params: ["courseId"],
		page: page_exports$2,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["courses", "[courseId]"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(8),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(8) : null,
		pattern: "/subjects/:subjectId",
		patternParts: ["subjects", ":subjectId"],
		isDynamic: true,
		params: ["subjectId"],
		page: page_exports$1,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["subjects", "[subjectId]"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	},
	{
		__buildTimeClassifications: __VINEXT_CLASS(9),
		__buildTimeReasons: __classDebug ? __VINEXT_CLASS_REASONS(9) : null,
		pattern: "/units/:unitId",
		patternParts: ["units", ":unitId"],
		isDynamic: true,
		params: ["unitId"],
		page: page_exports,
		routeHandler: null,
		layouts: [layout_exports],
		routeSegments: ["units", "[unitId]"],
		templateTreePositions: [],
		layoutTreePositions: [0],
		templates: [],
		errors: [null],
		slots: {},
		loading: null,
		error: null,
		notFound: null,
		notFounds: [null],
		forbidden: null,
		unauthorized: null
	}
];
var _routeTrie = buildRouteTrie(routes);
var metadataRoutes = [];
var rootNotFoundModule = null;
var rootForbiddenModule = null;
var rootUnauthorizedModule = null;
var rootLayouts = [layout_exports];
/**
* Render an HTTP access fallback page (not-found/forbidden/unauthorized) with layouts and noindex meta.
* Returns null if no matching component is available.
*
* @param opts.boundaryComponent - Override the boundary component (for layout-level notFound)
* @param opts.layouts - Override the layouts to wrap with (for layout-level notFound, excludes the throwing layout)
*/
async function renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, opts, scriptNonce) {
	return renderAppPageHttpAccessFallback({
		boundaryComponent: opts?.boundaryComponent ?? null,
		buildFontLinkHeader: buildAppPageFontLinkHeader,
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		createRscOnErrorHandler(pathname, routePath) {
			return createRscOnErrorHandler(request, pathname, routePath);
		},
		getFontLinks: getSSRFontLinks,
		getFontPreloads: _getSSRFontPreloads,
		getFontStyles: _getSSRFontStyles,
		getNavigationContext,
		globalErrorModule: null,
		isRscRequest,
		layoutModules: opts?.layouts ?? null,
		loadSsrHandler() {
			return import("./ssr/index.js");
		},
		makeThenableParams,
		matchedParams: opts?.matchedParams ?? route?.params ?? {},
		requestUrl: request.url,
		resolveChildSegments: resolveAppPageChildSegments,
		rootForbiddenModule,
		rootLayouts,
		rootNotFoundModule,
		rootUnauthorizedModule,
		route,
		renderToReadableStream,
		scriptNonce,
		statusCode
	});
}
/** Convenience: render a not-found page (404) */
async function renderNotFoundPage(route, isRscRequest, request, matchedParams, scriptNonce) {
	return renderHTTPAccessFallbackPage(route, 404, isRscRequest, request, { matchedParams }, scriptNonce);
}
/**
* Render an error.tsx boundary page when a server component or generateMetadata() throws.
* Returns null if no error boundary component is available for this route.
*
* Next.js returns HTTP 200 when error.tsx catches an error (the error is "handled"
* by the boundary). This matches that behavior intentionally.
*/
async function renderErrorBoundaryPage(route, error, isRscRequest, request, matchedParams, scriptNonce) {
	return renderAppPageErrorBoundary({
		buildFontLinkHeader: buildAppPageFontLinkHeader,
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		createRscOnErrorHandler(pathname, routePath) {
			return createRscOnErrorHandler(request, pathname, routePath);
		},
		error,
		getFontLinks: getSSRFontLinks,
		getFontPreloads: _getSSRFontPreloads,
		getFontStyles: _getSSRFontStyles,
		getNavigationContext,
		globalErrorModule: null,
		isRscRequest,
		loadSsrHandler() {
			return import("./ssr/index.js");
		},
		makeThenableParams,
		matchedParams: matchedParams ?? route?.params ?? {},
		requestUrl: request.url,
		resolveChildSegments: resolveAppPageChildSegments,
		rootLayouts,
		route,
		renderToReadableStream,
		sanitizeErrorForClient: __sanitizeErrorForClient,
		scriptNonce
	});
}
function matchRoute(url) {
	const pathname = url.split("?")[0];
	return trieMatch(_routeTrie, (pathname === "/" ? "/" : pathname.replace(/\/$/, "")).split("/").filter(Boolean));
}
function __createStaticFileSignal(pathname, _mwCtx) {
	const headers = new Headers({ "x-vinext-static-file": encodeURIComponent(pathname) });
	if (_mwCtx.headers) for (const [key, value] of _mwCtx.headers) headers.append(key, value);
	return new Response(null, {
		status: _mwCtx.status ?? 200,
		headers
	});
}
function matchPattern(urlParts, patternParts) {
	const params = Object.create(null);
	for (let i = 0; i < patternParts.length; i++) {
		const pp = patternParts[i];
		if (pp.endsWith("+")) {
			if (i !== patternParts.length - 1) return null;
			const paramName = pp.slice(1, -1);
			const remaining = urlParts.slice(i);
			if (remaining.length === 0) return null;
			params[paramName] = remaining;
			return params;
		}
		if (pp.endsWith("*")) {
			if (i !== patternParts.length - 1) return null;
			const paramName = pp.slice(1, -1);
			params[paramName] = urlParts.slice(i);
			return params;
		}
		if (pp.startsWith(":")) {
			if (i >= urlParts.length) return null;
			params[pp.slice(1)] = urlParts[i];
			continue;
		}
		if (i >= urlParts.length || urlParts[i] !== pp) return null;
	}
	if (urlParts.length !== patternParts.length) return null;
	return params;
}
function mergeMatchedParams(sourceParams, targetParams) {
	return Object.assign(Object.create(null), sourceParams, targetParams);
}
var interceptLookup = [];
for (let ri = 0; ri < routes.length; ri++) {
	const r = routes[ri];
	if (!r.slots) continue;
	for (const [slotKey, slotMod] of Object.entries(r.slots)) {
		if (!slotMod.intercepts) continue;
		for (const intercept of slotMod.intercepts) interceptLookup.push({
			sourceRouteIndex: ri,
			slotKey,
			targetPattern: intercept.targetPattern,
			targetPatternParts: intercept.targetPattern.split("/").filter(Boolean),
			page: intercept.page,
			params: intercept.params
		});
	}
}
/**
* Check if a pathname matches any intercepting route.
* Returns the match info or null.
*/
function findIntercept(pathname, sourcePathname = null) {
	const urlParts = pathname.split("/").filter(Boolean);
	for (const entry of interceptLookup) {
		const params = matchPattern(urlParts, entry.targetPatternParts);
		if (params !== null) {
			let sourceParams = Object.create(null);
			if (sourcePathname !== null) {
				const sourceRoute = routes[entry.sourceRouteIndex];
				const sourceParts = sourcePathname.split("/").filter(Boolean);
				const matchedSourceParams = sourceRoute ? matchPattern(sourceParts, sourceRoute.patternParts) : null;
				if (matchedSourceParams !== null) sourceParams = matchedSourceParams;
			}
			return {
				...entry,
				matchedParams: mergeMatchedParams(sourceParams, params)
			};
		}
	}
	return null;
}
async function buildPageElements(route, params, routePath, pageRequest) {
	const { opts, searchParams, isRscRequest, request, mountedSlotsHeader } = pageRequest;
	const hasPageModule = !!route.page;
	const PageComponent = route.page?.default;
	if (hasPageModule && !PageComponent) {
		const _interceptionContext = opts?.interceptionContext ?? null;
		const _noExportRouteId = createAppPayloadRouteId(routePath, _interceptionContext);
		let _noExportRootLayout = null;
		if (route.layouts?.length > 0) {
			const _tp = route.layoutTreePositions?.[0] ?? 0;
			_noExportRootLayout = createAppPageTreePath(route.routeSegments, _tp);
		}
		return {
			[APP_INTERCEPTION_CONTEXT_KEY]: _interceptionContext,
			__route: _noExportRouteId,
			__rootLayout: _noExportRootLayout,
			[_noExportRouteId]: (0, import_react_react_server.createElement)("div", null, "Page has no default export")
		};
	}
	const layoutMods = route.layouts.filter(Boolean);
	const spObj = Object.create(null);
	let hasSearchParams = false;
	if (searchParams && searchParams.forEach) searchParams.forEach(function(v, k) {
		hasSearchParams = true;
		if (k in spObj) spObj[k] = Array.isArray(spObj[k]) ? spObj[k].concat(v) : [spObj[k], v];
		else spObj[k] = v;
	});
	const layoutMetaPromises = [];
	let accumulatedMetaPromise = Promise.resolve({});
	for (let i = 0; i < layoutMods.length; i++) {
		const parentForThisLayout = accumulatedMetaPromise;
		const metaPromise = resolveModuleMetadata(layoutMods[i], params, void 0, parentForThisLayout).catch((err) => {
			console.error("[vinext] Layout generateMetadata() failed:", err);
			return null;
		});
		layoutMetaPromises.push(metaPromise);
		accumulatedMetaPromise = metaPromise.then(async (result) => result ? mergeMetadata([await parentForThisLayout, result]) : await parentForThisLayout);
	}
	const pageParentPromise = accumulatedMetaPromise;
	const [layoutMetaResults, layoutVpResults, pageMeta, pageVp] = await Promise.all([
		Promise.all(layoutMetaPromises),
		Promise.all(layoutMods.map((mod) => resolveModuleViewport(mod, params).catch((err) => {
			console.error("[vinext] Layout generateViewport() failed:", err);
			return null;
		}))),
		route.page ? resolveModuleMetadata(route.page, params, spObj, pageParentPromise) : Promise.resolve(null),
		route.page ? resolveModuleViewport(route.page, params) : Promise.resolve(null)
	]);
	const metadataList = [...layoutMetaResults.filter(Boolean), ...pageMeta ? [pageMeta] : []];
	const viewportList = [...layoutVpResults.filter(Boolean), ...pageVp ? [pageVp] : []];
	const resolvedMetadata = metadataList.length > 0 ? mergeMetadata(metadataList) : null;
	const resolvedViewport = mergeViewport(viewportList);
	const pageProps = { params: makeThenableParams(params) };
	if (searchParams) {
		pageProps.searchParams = makeThenableParams(spObj);
		if (hasSearchParams) markDynamicUsage();
	}
	const mountedSlotIds = mountedSlotsHeader ? new Set(mountedSlotsHeader.split(" ")) : null;
	return buildAppPageElements({
		element: PageComponent ? (0, import_react_react_server.createElement)(PageComponent, pageProps) : null,
		globalErrorModule: null,
		isRscRequest,
		mountedSlotIds,
		makeThenableParams,
		matchedParams: params,
		resolvedMetadata,
		resolvedViewport,
		interceptionContext: opts?.interceptionContext ?? null,
		routePath,
		rootNotFoundModule: null,
		route,
		slotOverrides: opts && opts.interceptSlotKey && opts.interceptPage ? { [opts.interceptSlotKey]: {
			pageModule: opts.interceptPage,
			params: opts.interceptParams || params
		} } : null
	});
}
var __basePath = "";
var __trailingSlash = false;
var __i18nConfig = null;
var __configRedirects = [];
var __configRewrites = {
	"beforeFiles": [],
	"afterFiles": [{
		"source": "/docs/:slug*",
		"destination": "/docs/md/:slug*",
		"has": [{
			"type": "header",
			"key": "accept",
			"value": "(.*)text/markdown(.*)"
		}]
	}],
	"fallback": []
};
var __configHeaders = [];
var __publicFiles = new Set([
	"/_headers",
	"/file.svg",
	"/globe.svg",
	"/next.svg",
	"/vercel.svg",
	"/window.svg"
]);
var __allowedOrigins = [];
function __normalizePath(pathname) {
	if (pathname === "/" || pathname.length > 1 && pathname[0] === "/" && !pathname.includes("//") && !pathname.includes("/./") && !pathname.includes("/../") && !pathname.endsWith("/.") && !pathname.endsWith("/..")) return pathname;
	const segments = pathname.split("/");
	const resolved = [];
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		if (seg === "" || seg === ".") continue;
		if (seg === "..") resolved.pop();
		else resolved.push(seg);
	}
	return "/" + resolved.join("/");
}
var __pathDelimiterRegex = /([/#?\\]|%(2f|23|3f|5c))/gi;
function __decodeRouteSegment(segment) {
	return decodeURIComponent(segment).replace(__pathDelimiterRegex, function(char) {
		return encodeURIComponent(char);
	});
}
function __decodeRouteSegmentSafe(segment) {
	try {
		return __decodeRouteSegment(segment);
	} catch (e) {
		return segment;
	}
}
function __normalizePathnameForRouteMatch(pathname) {
	const segments = pathname.split("/");
	const normalized = [];
	for (let i = 0; i < segments.length; i++) normalized.push(__decodeRouteSegmentSafe(segments[i]));
	return normalized.join("/");
}
function __normalizePathnameForRouteMatchStrict(pathname) {
	const segments = pathname.split("/");
	const normalized = [];
	for (let i = 0; i < segments.length; i++) normalized.push(__decodeRouteSegment(segments[i]));
	return normalized.join("/");
}
/**
* Build a request context from the live ALS HeadersContext, which reflects
* any x-middleware-request-* header mutations applied by middleware.
* Used for afterFiles and fallback rewrite has/missing evaluation — these
* run after middleware in the App Router execution order.
*/
function __buildPostMwRequestContext(request) {
	const url = new URL(request.url);
	const ctx = getHeadersContext();
	if (!ctx) return requestContextFromRequest(request);
	const cookiesRecord = Object.fromEntries(ctx.cookies);
	return {
		headers: ctx.headers,
		cookies: cookiesRecord,
		query: url.searchParams,
		host: normalizeHost(ctx.headers.get("host"), url.hostname)
	};
}
/**
* Maximum server-action request body size.
* Configurable via experimental.serverActions.bodySizeLimit in next.config.
* Defaults to 1MB, matching the Next.js default.
* @see https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit
* Prevents unbounded request body buffering.
*/
var __MAX_ACTION_BODY_SIZE = 1048576;
/**
* Read a request body as text with a size limit.
* Enforces the limit on the actual byte stream to prevent bypasses
* via chunked transfer-encoding where Content-Length is absent or spoofed.
*/
async function __readBodyWithLimit(request, maxBytes) {
	if (!request.body) return "";
	var reader = request.body.getReader();
	var decoder = new TextDecoder();
	var chunks = [];
	var totalSize = 0;
	for (;;) {
		var result = await reader.read();
		if (result.done) break;
		totalSize += result.value.byteLength;
		if (totalSize > maxBytes) {
			reader.cancel();
			throw new Error("Request body too large");
		}
		chunks.push(decoder.decode(result.value, { stream: true }));
	}
	chunks.push(decoder.decode());
	return chunks.join("");
}
/**
* Read a request body as FormData with a size limit.
* Consumes the body stream with a byte counter and then parses the
* collected bytes as multipart form data via the Response constructor.
*/
async function __readFormDataWithLimit(request, maxBytes) {
	if (!request.body) return new FormData();
	var reader = request.body.getReader();
	var chunks = [];
	var totalSize = 0;
	for (;;) {
		var result = await reader.read();
		if (result.done) break;
		totalSize += result.value.byteLength;
		if (totalSize > maxBytes) {
			reader.cancel();
			throw new Error("Request body too large");
		}
		chunks.push(result.value);
	}
	var combined = new Uint8Array(totalSize);
	var offset = 0;
	for (var chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.byteLength;
	}
	var contentType = request.headers.get("content-type") || "";
	return new Response(combined, { headers: { "Content-Type": contentType } }).formData();
}
var generateStaticParamsMap = {
	"/courses/:courseId": null,
	"/subjects/:subjectId": null,
	"/units/:unitId": null
};
async function handler(request, ctx) {
	return runWithRequestContext(createRequestContext({
		headersContext: headersContextFromRequest(request),
		executionContext: ctx ?? getRequestExecutionContext() ?? null
	}), async () => {
		ensureFetchPatch();
		const __reqCtx = requestContextFromRequest(request);
		const response = await _handleRequest(request, __reqCtx, {
			headers: null,
			requestHeaders: null,
			status: null
		});
		if (response && response.headers && !(response.status >= 300 && response.status < 400)) {
			if (__configHeaders.length) {
				const url = new URL(request.url);
				let pathname;
				try {
					pathname = __normalizePath(__normalizePathnameForRouteMatch(url.pathname));
				} catch {
					pathname = url.pathname;
				}
				const extraHeaders = matchHeaders(pathname, __configHeaders, __reqCtx);
				for (const h of extraHeaders) {
					const lk = h.key.toLowerCase();
					if (lk === "vary" || lk === "set-cookie") response.headers.append(h.key, h.value);
					else if (!response.headers.has(lk)) response.headers.set(h.key, h.value);
				}
			}
		}
		return response;
	});
}
async function _handleRequest(request, __reqCtx, _mwCtx) {
	const __reqStart = 0;
	const url = new URL(request.url);
	const __protoGuard = guardProtocolRelativeUrl(url.pathname);
	if (__protoGuard) return __protoGuard;
	let decodedUrlPathname;
	try {
		decodedUrlPathname = __normalizePathnameForRouteMatchStrict(url.pathname);
	} catch (e) {
		return new Response("Bad Request", { status: 400 });
	}
	let pathname = __normalizePath(decodedUrlPathname);
	if (pathname === "/__vinext/prerender/static-params") {
		if (process.env.VINEXT_PRERENDER !== "1") return new Response("Not Found", { status: 404 });
		const pattern = url.searchParams.get("pattern");
		if (!pattern) return new Response("missing pattern", { status: 400 });
		const fn = generateStaticParamsMap[pattern];
		if (typeof fn !== "function") return new Response("null", {
			status: 200,
			headers: { "content-type": "application/json" }
		});
		try {
			const parentParams = url.searchParams.get("parentParams");
			const raw = parentParams ? JSON.parse(parentParams) : {};
			const result = await fn({ params: typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {} });
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "content-type": "application/json" }
			});
		} catch (e) {
			return new Response(JSON.stringify({ error: String(e) }), {
				status: 500,
				headers: { "content-type": "application/json" }
			});
		}
	}
	const __tsRedirect = normalizeTrailingSlash(pathname, __basePath, __trailingSlash, url.search);
	if (__tsRedirect) return __tsRedirect;
	if (__configRedirects.length) {
		const __redir = matchRedirect(pathname.endsWith(".rsc") ? pathname.slice(0, -4) : pathname, __configRedirects, __reqCtx);
		if (__redir) {
			const __redirDest = sanitizeDestination(__redir.destination);
			return new Response(null, {
				status: __redir.permanent ? 308 : 307,
				headers: { Location: __redirDest }
			});
		}
	}
	const isRscRequest = pathname.endsWith(".rsc") || request.headers.get("accept")?.includes("text/x-component");
	const __mountedSlotsHeader = __normalizeMountedSlotsHeader(request.headers.get("x-vinext-mounted-slots"));
	const interceptionContextHeader = request.headers.get("X-Vinext-Interception-Context")?.replaceAll("\0", "") || null;
	let cleanPathname = pathname.replace(/\.rsc$/, "");
	const _scriptNonce = getScriptNonceFromHeaderSources(request.headers, _mwCtx.headers);
	const __postMwReqCtx = __buildPostMwRequestContext(request);
	if (__configRewrites.beforeFiles && __configRewrites.beforeFiles.length) {
		const __rewritten = matchRewrite(cleanPathname, __configRewrites.beforeFiles, __postMwReqCtx);
		if (__rewritten) {
			if (isExternalUrl(__rewritten)) {
				setHeadersContext(null);
				setNavigationContext(null);
				return proxyExternalRequest(request, __rewritten);
			}
			cleanPathname = __rewritten;
		}
	}
	if (cleanPathname === "/_vinext/image") {
		const __imgResult = validateImageUrl(url.searchParams.get("url"), request.url);
		if (__imgResult instanceof Response) return __imgResult;
		return Response.redirect(new URL(__imgResult, url.origin).href, 302);
	}
	for (const metaRoute of metadataRoutes) {
		if (metaRoute.type === "sitemap" && metaRoute.isDynamic && typeof metaRoute.module.generateSitemaps === "function") {
			const sitemapPrefix = metaRoute.servedUrl.slice(0, -4);
			if (cleanPathname.startsWith(sitemapPrefix + "/") && cleanPathname.endsWith(".xml")) {
				const rawId = cleanPathname.slice(sitemapPrefix.length + 1, -4);
				if (rawId.includes("/")) continue;
				const matched = (await metaRoute.module.generateSitemaps()).find(function(s) {
					return String(s.id) === rawId;
				});
				if (!matched) return new Response("Not Found", { status: 404 });
				const result = await metaRoute.module.default({ id: matched.id });
				if (result instanceof Response) return result;
				return new Response(sitemapToXml(result), { headers: { "Content-Type": metaRoute.contentType } });
			}
			continue;
		}
		var _metaParams = null;
		if (metaRoute.patternParts) {
			_metaParams = matchPattern(cleanPathname.split("/").filter(Boolean), metaRoute.patternParts);
			if (!_metaParams) continue;
		} else if (cleanPathname !== metaRoute.servedUrl) continue;
		if (metaRoute.isDynamic) {
			const metaFn = metaRoute.module.default;
			if (typeof metaFn === "function") {
				const result = await metaFn({ params: makeThenableParams(_metaParams || {}) });
				let body;
				if (result instanceof Response) return result;
				if (metaRoute.type === "sitemap") body = sitemapToXml(result);
				else if (metaRoute.type === "robots") body = robotsToText(result);
				else if (metaRoute.type === "manifest") body = manifestToJson(result);
				else body = JSON.stringify(result);
				return new Response(body, { headers: { "Content-Type": metaRoute.contentType } });
			}
		} else try {
			const binary = atob(metaRoute.fileDataBase64);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return new Response(bytes, { headers: {
				"Content-Type": metaRoute.contentType,
				"Cache-Control": "public, max-age=0, must-revalidate"
			} });
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	}
	if ((request.method === "GET" || request.method === "HEAD") && !pathname.endsWith(".rsc") && __publicFiles.has(cleanPathname)) {
		setHeadersContext(null);
		setNavigationContext(null);
		return __createStaticFileSignal(cleanPathname, _mwCtx);
	}
	setNavigationContext({
		pathname: cleanPathname,
		searchParams: url.searchParams,
		params: {}
	});
	const actionId = request.headers.get("x-rsc-action");
	if (request.method === "POST" && actionId) {
		const csrfResponse = validateCsrfOrigin(request, __allowedOrigins);
		if (csrfResponse) return csrfResponse;
		if (parseInt(request.headers.get("content-length") || "0", 10) > __MAX_ACTION_BODY_SIZE) {
			setHeadersContext(null);
			setNavigationContext(null);
			return new Response("Payload Too Large", { status: 413 });
		}
		try {
			const contentType = request.headers.get("content-type") || "";
			let body;
			try {
				body = contentType.startsWith("multipart/form-data") ? await __readFormDataWithLimit(request, __MAX_ACTION_BODY_SIZE) : await __readBodyWithLimit(request, __MAX_ACTION_BODY_SIZE);
			} catch (sizeErr) {
				if (sizeErr && sizeErr.message === "Request body too large") {
					setHeadersContext(null);
					setNavigationContext(null);
					return new Response("Payload Too Large", { status: 413 });
				}
				throw sizeErr;
			}
			const payloadResponse = await validateServerActionPayload(body);
			if (payloadResponse) {
				setHeadersContext(null);
				setNavigationContext(null);
				return payloadResponse;
			}
			const temporaryReferences = createTemporaryReferenceSet();
			const args = await decodeReply(body, { temporaryReferences });
			const action = await loadServerAction(actionId);
			let returnValue;
			let actionRedirect = null;
			const previousHeadersPhase = setHeadersAccessPhase("action");
			try {
				try {
					returnValue = {
						ok: true,
						data: await action.apply(null, args)
					};
				} catch (e) {
					if (e && typeof e === "object" && "digest" in e) {
						const digest = String(e.digest);
						if (digest.startsWith("NEXT_REDIRECT;")) {
							const parts = digest.split(";");
							actionRedirect = {
								url: decodeURIComponent(parts[2]),
								type: parts[1] || "push",
								status: parts[3] ? parseInt(parts[3], 10) : 307
							};
							returnValue = {
								ok: true,
								data: void 0
							};
						} else if (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) returnValue = {
							ok: false,
							data: e
						};
						else {
							console.error("[vinext] Server action error:", e);
							returnValue = {
								ok: false,
								data: __sanitizeErrorForClient(e)
							};
						}
					} else {
						console.error("[vinext] Server action error:", e);
						returnValue = {
							ok: false,
							data: __sanitizeErrorForClient(e)
						};
					}
				}
			} finally {
				setHeadersAccessPhase(previousHeadersPhase);
			}
			if (actionRedirect) {
				const actionPendingCookies = getAndClearPendingCookies();
				const actionDraftCookie = getDraftModeCookieHeader();
				setHeadersContext(null);
				setNavigationContext(null);
				const redirectHeaders = new Headers({
					"Content-Type": "text/x-component; charset=utf-8",
					"Vary": "RSC, Accept"
				});
				mergeMiddlewareResponseHeaders(redirectHeaders, _mwCtx.headers);
				redirectHeaders.set("x-action-redirect", actionRedirect.url);
				redirectHeaders.set("x-action-redirect-type", actionRedirect.type);
				redirectHeaders.set("x-action-redirect-status", String(actionRedirect.status));
				for (const cookie of actionPendingCookies) redirectHeaders.append("Set-Cookie", cookie);
				if (actionDraftCookie) redirectHeaders.append("Set-Cookie", actionDraftCookie);
				return new Response("", {
					status: 200,
					headers: redirectHeaders
				});
			}
			const match = matchRoute(cleanPathname);
			let element;
			let errorPattern = match ? match.route.pattern : cleanPathname;
			if (match) {
				const { route: actionRoute, params: actionParams } = match;
				const __actionRerenderTarget = resolveAppPageActionRerenderTarget({
					cleanPathname,
					currentParams: actionParams,
					currentRoute: actionRoute,
					findIntercept(pathname) {
						return findIntercept(pathname, interceptionContextHeader);
					},
					getRouteParamNames(sourceRoute) {
						return sourceRoute.params;
					},
					getSourceRoute(sourceRouteIndex) {
						return routes[sourceRouteIndex];
					},
					isRscRequest,
					toInterceptOpts(intercept) {
						return {
							interceptionContext: interceptionContextHeader,
							interceptSlotKey: intercept.slotKey,
							interceptPage: intercept.page,
							interceptParams: intercept.matchedParams
						};
					}
				});
				setNavigationContext({
					pathname: cleanPathname,
					searchParams: url.searchParams,
					params: __actionRerenderTarget.navigationParams
				});
				element = buildPageElements(__actionRerenderTarget.route, __actionRerenderTarget.params, cleanPathname, {
					opts: __actionRerenderTarget.interceptOpts,
					searchParams: url.searchParams,
					isRscRequest,
					request,
					mountedSlotsHeader: __mountedSlotsHeader
				});
				errorPattern = __actionRerenderTarget.route.pattern;
			} else {
				const _actionRouteId = createAppPayloadRouteId(cleanPathname, null);
				element = {
					[APP_INTERCEPTION_CONTEXT_KEY]: null,
					__route: _actionRouteId,
					__rootLayout: null,
					[_actionRouteId]: (0, import_react_react_server.createElement)("div", null, "Page not found")
				};
			}
			const onRenderError = createRscOnErrorHandler(request, cleanPathname, errorPattern);
			const rscStream = renderToReadableStream({
				root: element,
				returnValue
			}, {
				temporaryReferences,
				onError: onRenderError
			});
			const actionPendingCookies = getAndClearPendingCookies();
			const actionDraftCookie = getDraftModeCookieHeader();
			const actionHeaders = new Headers({
				"Content-Type": "text/x-component; charset=utf-8",
				"Vary": "RSC, Accept"
			});
			mergeMiddlewareResponseHeaders(actionHeaders, _mwCtx.headers);
			const actionResponse = new Response(rscStream, {
				status: _mwCtx.status ?? 200,
				headers: actionHeaders
			});
			if (actionPendingCookies.length > 0 || actionDraftCookie) {
				for (const cookie of actionPendingCookies) actionResponse.headers.append("Set-Cookie", cookie);
				if (actionDraftCookie) actionResponse.headers.append("Set-Cookie", actionDraftCookie);
			}
			return actionResponse;
		} catch (err) {
			getAndClearPendingCookies();
			console.error("[vinext] Server action error:", err);
			reportRequestError(err instanceof Error ? err : new Error(String(err)), {
				path: cleanPathname,
				method: request.method,
				headers: Object.fromEntries(request.headers.entries())
			}, {
				routerKind: "App Router",
				routePath: cleanPathname,
				routeType: "action"
			});
			setHeadersContext(null);
			setNavigationContext(null);
			return new Response("Internal Server Error", { status: 500 });
		}
	}
	if (__configRewrites.afterFiles && __configRewrites.afterFiles.length) {
		const __afterRewritten = matchRewrite(cleanPathname, __configRewrites.afterFiles, __postMwReqCtx);
		if (__afterRewritten) {
			if (isExternalUrl(__afterRewritten)) {
				setHeadersContext(null);
				setNavigationContext(null);
				return proxyExternalRequest(request, __afterRewritten);
			}
			cleanPathname = __afterRewritten;
		}
	}
	let match = matchRoute(cleanPathname);
	if (!match && __configRewrites.fallback && __configRewrites.fallback.length) {
		const __fallbackRewritten = matchRewrite(cleanPathname, __configRewrites.fallback, __postMwReqCtx);
		if (__fallbackRewritten) {
			if (isExternalUrl(__fallbackRewritten)) {
				setHeadersContext(null);
				setNavigationContext(null);
				return proxyExternalRequest(request, __fallbackRewritten);
			}
			cleanPathname = __fallbackRewritten;
			match = matchRoute(cleanPathname);
		}
	}
	if (!match) {
		const notFoundResponse = await renderNotFoundPage(null, isRscRequest, request, void 0, _scriptNonce);
		if (notFoundResponse) return notFoundResponse;
		setHeadersContext(null);
		setNavigationContext(null);
		return new Response("Not Found", { status: 404 });
	}
	const { route, params } = match;
	setNavigationContext({
		pathname: cleanPathname,
		searchParams: url.searchParams,
		params
	});
	if (route.routeHandler) {
		const handler = route.routeHandler;
		const method = request.method.toUpperCase();
		const revalidateSeconds = getAppRouteHandlerRevalidateSeconds(handler);
		if (hasAppRouteHandlerDefaultExport(handler) && false);
		const { allowHeaderForOptions, handlerFn, isAutoHead, shouldAutoRespondToOptions } = resolveAppRouteHandlerMethod(handler, method);
		if (shouldAutoRespondToOptions) {
			setHeadersContext(null);
			setNavigationContext(null);
			return applyRouteHandlerMiddlewareContext(new Response(null, {
				status: 204,
				headers: { "Allow": allowHeaderForOptions }
			}), _mwCtx);
		}
		if (shouldReadAppRouteHandlerCache({
			dynamicConfig: handler.dynamic,
			handlerFn,
			isAutoHead,
			isKnownDynamic: isKnownDynamicAppRoute(route.pattern),
			isProduction: true,
			method,
			revalidateSeconds
		})) {
			const __cachedRouteResponse = await readAppRouteHandlerCacheResponse({
				basePath: __basePath,
				buildPageCacheTags: __pageCacheTags,
				cleanPathname,
				clearRequestContext: function() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				consumeDynamicUsage,
				getCollectedFetchTags,
				handlerFn,
				i18n: __i18nConfig,
				isAutoHead,
				isrDebug: __isrDebug,
				isrGet: __isrGet,
				isrRouteKey: __isrRouteKey,
				isrSet: __isrSet,
				markDynamicUsage,
				middlewareContext: _mwCtx,
				params,
				requestUrl: request.url,
				revalidateSearchParams: url.searchParams,
				revalidateSeconds,
				routePattern: route.pattern,
				runInRevalidationContext: async function(renderFn) {
					await runWithRequestContext(createRequestContext({
						headersContext: {
							headers: new Headers(),
							cookies: /* @__PURE__ */ new Map()
						},
						executionContext: getRequestExecutionContext()
					}), async () => {
						ensureFetchPatch();
						await renderFn();
					});
				},
				scheduleBackgroundRegeneration: __triggerBackgroundRegeneration,
				setNavigationContext
			});
			if (__cachedRouteResponse) return __cachedRouteResponse;
		}
		if (typeof handlerFn === "function") return executeAppRouteHandler({
			basePath: __basePath,
			buildPageCacheTags: __pageCacheTags,
			cleanPathname,
			clearRequestContext: function() {
				setHeadersContext(null);
				setNavigationContext(null);
			},
			consumeDynamicUsage,
			executionContext: getRequestExecutionContext(),
			getAndClearPendingCookies,
			getCollectedFetchTags,
			getDraftModeCookieHeader,
			handler,
			handlerFn,
			i18n: __i18nConfig,
			isAutoHead,
			isProduction: true,
			isrDebug: __isrDebug,
			isrRouteKey: __isrRouteKey,
			isrSet: __isrSet,
			markDynamicUsage,
			method,
			middlewareContext: _mwCtx,
			middlewareRequestHeaders: _mwCtx.requestHeaders,
			params: makeThenableParams(params),
			reportRequestError,
			request,
			revalidateSeconds,
			routePattern: route.pattern,
			setHeadersAccessPhase
		});
		setHeadersContext(null);
		setNavigationContext(null);
		return applyRouteHandlerMiddlewareContext(new Response(null, { status: 405 }), _mwCtx);
	}
	const hasPageModule = !!route.page;
	const PageComponent = route.page?.default;
	if (hasPageModule && !PageComponent) {
		setHeadersContext(null);
		setNavigationContext(null);
		return new Response("Page has no default export", { status: 500 });
	}
	let revalidateSeconds = typeof route.page?.revalidate === "number" ? route.page.revalidate : null;
	const dynamicConfig = route.page?.dynamic;
	const dynamicParamsConfig = route.page?.dynamicParams;
	const isForceStatic = dynamicConfig === "force-static";
	const isDynamicError = dynamicConfig === "error";
	if (isForceStatic) {
		setHeadersContext({
			headers: new Headers(),
			cookies: /* @__PURE__ */ new Map()
		});
		setNavigationContext({
			pathname: cleanPathname,
			searchParams: new URLSearchParams(),
			params
		});
	}
	if (isDynamicError) {
		setHeadersContext({
			headers: new Headers(),
			cookies: /* @__PURE__ */ new Map(),
			accessError: /* @__PURE__ */ new Error("Page with `dynamic = \"error\"` used a dynamic API. This page was expected to be fully static, but headers(), cookies(), or searchParams was accessed. Remove the dynamic API usage or change the dynamic config to \"auto\" or \"force-dynamic\".")
		});
		setNavigationContext({
			pathname: cleanPathname,
			searchParams: new URLSearchParams(),
			params
		});
	}
	const isForceDynamic = dynamicConfig === "force-dynamic";
	if (!isForceDynamic && (isRscRequest || !_scriptNonce) && revalidateSeconds !== null && revalidateSeconds > 0 && revalidateSeconds !== Infinity) {
		const __cachedPageResponse = await readAppPageCacheResponse({
			cleanPathname,
			clearRequestContext: function() {
				setHeadersContext(null);
				setNavigationContext(null);
			},
			isRscRequest,
			isrDebug: __isrDebug,
			isrGet: __isrGet,
			isrHtmlKey: __isrHtmlKey,
			isrRscKey: __isrRscKey,
			isrSet: __isrSet,
			mountedSlotsHeader: __mountedSlotsHeader,
			revalidateSeconds,
			renderFreshPageForCache: async function() {
				return runWithRequestContext(createRequestContext({
					headersContext: {
						headers: new Headers(),
						cookies: /* @__PURE__ */ new Map()
					},
					executionContext: getRequestExecutionContext()
				}), async () => {
					ensureFetchPatch();
					setNavigationContext({
						pathname: cleanPathname,
						searchParams: new URLSearchParams(),
						params
					});
					const __revalRscCapture = teeAppPageRscStreamForCapture(renderToReadableStream(await buildPageElements(route, params, cleanPathname, {
						opts: void 0,
						searchParams: new URLSearchParams(),
						isRscRequest,
						request,
						mountedSlotsHeader: __mountedSlotsHeader
					}), { onError: createRscOnErrorHandler(request, cleanPathname, route.pattern) }), true);
					const __revalFontData = {
						links: getSSRFontLinks(),
						styles: _getSSRFontStyles(),
						preloads: _getSSRFontPreloads()
					};
					const __revalHtmlStream = await (await import("./ssr/index.js")).handleSsr(__revalRscCapture.responseStream, getNavigationContext(), __revalFontData);
					setHeadersContext(null);
					setNavigationContext(null);
					return {
						html: await readAppPageTextStream(__revalHtmlStream),
						rscData: await __revalRscCapture.capturedRscDataPromise,
						tags: __pageCacheTags(cleanPathname, getCollectedFetchTags())
					};
				});
			},
			scheduleBackgroundRegeneration: __triggerBackgroundRegeneration
		});
		if (__cachedPageResponse) return __cachedPageResponse;
	}
	const __dynamicParamsResponse = await validateAppPageDynamicParams({
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		enforceStaticParamsOnly: dynamicParamsConfig === false,
		generateStaticParams: route.page?.generateStaticParams,
		isDynamicRoute: route.isDynamic,
		logGenerateStaticParamsError(err) {
			console.error("[vinext] generateStaticParams error:", err);
		},
		params
	});
	if (__dynamicParamsResponse) return __dynamicParamsResponse;
	const __interceptResult = await resolveAppPageIntercept({
		buildPageElement(interceptRoute, interceptParams, interceptOpts, interceptSearchParams) {
			return buildPageElements(interceptRoute, interceptParams, cleanPathname, {
				opts: interceptOpts,
				searchParams: interceptSearchParams,
				isRscRequest,
				request,
				mountedSlotsHeader: __mountedSlotsHeader
			});
		},
		cleanPathname,
		currentRoute: route,
		findIntercept(pathname) {
			return findIntercept(pathname, interceptionContextHeader);
		},
		getRouteParamNames(sourceRoute) {
			return sourceRoute.params;
		},
		getSourceRoute(sourceRouteIndex) {
			return routes[sourceRouteIndex];
		},
		isRscRequest,
		renderInterceptResponse(sourceRoute, interceptElement) {
			const interceptStream = renderToReadableStream(interceptElement, { onError: createRscOnErrorHandler(request, cleanPathname, sourceRoute.pattern) });
			const interceptHeaders = new Headers({
				"Content-Type": "text/x-component; charset=utf-8",
				"Vary": "RSC, Accept"
			});
			mergeMiddlewareResponseHeaders(interceptHeaders, _mwCtx.headers);
			return new Response(interceptStream, {
				status: _mwCtx.status ?? 200,
				headers: interceptHeaders
			});
		},
		searchParams: url.searchParams,
		setNavigationContext,
		toInterceptOpts(intercept) {
			return {
				interceptionContext: interceptionContextHeader,
				interceptSlotKey: intercept.slotKey,
				interceptPage: intercept.page,
				interceptParams: intercept.matchedParams
			};
		}
	});
	if (__interceptResult.response) return __interceptResult.response;
	const interceptOpts = __interceptResult.interceptOpts;
	const __pageBuildResult = await buildAppPageElement({
		buildPageElement() {
			return buildPageElements(route, params, cleanPathname, {
				opts: interceptOpts,
				searchParams: url.searchParams,
				isRscRequest,
				request,
				mountedSlotsHeader: __mountedSlotsHeader
			});
		},
		renderErrorBoundaryPage(buildErr) {
			return renderErrorBoundaryPage(route, buildErr, isRscRequest, request, params, _scriptNonce);
		},
		renderSpecialError(__buildSpecialError) {
			return buildAppPageSpecialErrorResponse({
				clearRequestContext() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				renderFallbackPage(statusCode) {
					return renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, { matchedParams: params }, _scriptNonce);
				},
				requestUrl: request.url,
				specialError: __buildSpecialError
			});
		},
		resolveSpecialError: resolveAppPageSpecialError
	});
	if (__pageBuildResult.response) return __pageBuildResult.response;
	const element = __pageBuildResult.element;
	const _hasLoadingBoundary = !!(route.loading && route.loading.default);
	const _asyncLayoutParams = makeThenableParams(params);
	return renderAppPageLifecycle({
		cleanPathname,
		clearRequestContext() {
			setHeadersContext(null);
			setNavigationContext(null);
		},
		consumeDynamicUsage,
		createRscOnErrorHandler(pathname, routePath) {
			return createRscOnErrorHandler(request, pathname, routePath);
		},
		element,
		getDraftModeCookieHeader,
		getFontLinks: getSSRFontLinks,
		getFontPreloads: _getSSRFontPreloads,
		getFontStyles: _getSSRFontStyles,
		getNavigationContext,
		getPageTags() {
			return __pageCacheTags(cleanPathname, getCollectedFetchTags());
		},
		getRequestCacheLife() {
			return _consumeRequestScopedCacheLife();
		},
		handlerStart: __reqStart,
		hasLoadingBoundary: _hasLoadingBoundary,
		isDynamicError,
		isForceDynamic,
		isForceStatic,
		isProduction: true,
		isRscRequest,
		isrDebug: __isrDebug,
		isrHtmlKey: __isrHtmlKey,
		isrRscKey: __isrRscKey,
		isrSet: __isrSet,
		layoutCount: route.layouts?.length ?? 0,
		loadSsrHandler() {
			return import("./ssr/index.js");
		},
		middlewareContext: _mwCtx,
		params,
		probeLayoutAt(li) {
			const LayoutComp = route.layouts[li]?.default;
			if (!LayoutComp) return null;
			return LayoutComp({
				params: _asyncLayoutParams,
				children: null
			});
		},
		probePage() {
			if (!PageComponent) return null;
			const _probeSearchObj = {};
			url.searchParams.forEach(function(v, k) {
				if (k in _probeSearchObj) _probeSearchObj[k] = Array.isArray(_probeSearchObj[k]) ? _probeSearchObj[k].concat(v) : [_probeSearchObj[k], v];
				else _probeSearchObj[k] = v;
			});
			return PageComponent({
				params: _asyncLayoutParams,
				searchParams: makeThenableParams(_probeSearchObj)
			});
		},
		classification: {
			getLayoutId(index) {
				const tp = route.layoutTreePositions?.[index] ?? 0;
				return "layout:" + createAppPageTreePath(route.routeSegments, tp);
			},
			buildTimeClassifications: route.__buildTimeClassifications,
			buildTimeReasons: route.__buildTimeReasons,
			debugClassification: __classDebug,
			async runWithIsolatedDynamicScope(fn) {
				const priorDynamic = consumeDynamicUsage();
				try {
					return {
						result: await fn(),
						dynamicDetected: consumeDynamicUsage()
					};
				} finally {
					consumeDynamicUsage();
					if (priorDynamic) markDynamicUsage();
				}
			}
		},
		revalidateSeconds,
		mountedSlotsHeader: __mountedSlotsHeader,
		renderErrorBoundaryResponse(renderErr) {
			return renderErrorBoundaryPage(route, renderErr, isRscRequest, request, params, _scriptNonce);
		},
		async renderLayoutSpecialError(__layoutSpecialError, li) {
			return buildAppPageSpecialErrorResponse({
				clearRequestContext() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				renderFallbackPage(statusCode) {
					let parentNotFound = null;
					if (route.notFounds) {
						for (let pi = li - 1; pi >= 0; pi--) if (route.notFounds[pi]?.default) {
							parentNotFound = route.notFounds[pi].default;
							break;
						}
					}
					if (!parentNotFound) parentNotFound = null;
					const parentLayouts = route.layouts.slice(0, li);
					return renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, {
						boundaryComponent: parentNotFound,
						layouts: parentLayouts,
						matchedParams: params
					}, _scriptNonce);
				},
				requestUrl: request.url,
				specialError: __layoutSpecialError
			});
		},
		async renderPageSpecialError(specialError) {
			return buildAppPageSpecialErrorResponse({
				clearRequestContext() {
					setHeadersContext(null);
					setNavigationContext(null);
				},
				renderFallbackPage(statusCode) {
					return renderHTTPAccessFallbackPage(route, statusCode, isRscRequest, request, { matchedParams: params }, _scriptNonce);
				},
				requestUrl: request.url,
				specialError
			});
		},
		renderToReadableStream,
		routeHasLocalBoundary: !!route?.error?.default || !!(route?.errors && route.errors.some(function(e) {
			return e?.default;
		})),
		routePattern: route.pattern,
		runWithSuppressedHookWarning(probe) {
			return _suppressHookWarningAls.run(true, probe);
		},
		scriptNonce: _scriptNonce,
		waitUntil(__cachePromise) {
			getRequestExecutionContext()?.waitUntil(__cachePromise);
		}
	});
}
//#endregion
//#region node_modules/vinext/dist/server/app-router-entry.js
/**
* Default Cloudflare Worker entry point for vinext App Router.
*
* Use this directly in wrangler.jsonc:
*   "main": "vinext/server/app-router-entry"
*
* Or import and delegate to it from a custom worker:
*   import handler from "vinext/server/app-router-entry";
*   return handler.fetch(request, env, ctx);
*
* This file runs in the RSC environment. Configure the Cloudflare plugin with:
*   cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })
*/
var app_router_entry_default = { async fetch(request, env, ctx) {
	if (new URL(request.url).pathname.replaceAll("\\", "/").startsWith("//")) return new Response("404 Not Found", { status: 404 });
	const handleFn = () => handler(request, ctx);
	const result = await (ctx ? runWithExecutionContext(ctx, handleFn) : handleFn());
	if (result instanceof Response) {
		if (env?.ASSETS) {
			const assetResponse = await resolveStaticAssetSignal(result, { fetchAsset: (path) => Promise.resolve(env.ASSETS.fetch(new Request(new URL(path, request.url)))) });
			if (assetResponse) return assetResponse;
		}
		return result;
	}
	if (result === null || result === void 0) return new Response("Not Found", { status: 404 });
	return new Response(String(result), { status: 200 });
} };
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = { async fetch(request, env, ctx) {
	if (new URL(request.url).pathname === "/_vinext/image") return handleImageOptimization(request, {
		fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
		transformImage: async (body, { width, format, quality }) => {
			return (await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({
				format,
				quality
			})).response();
		}
	}, [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES]);
	return app_router_entry_default.fetch(request, env, ctx);
} };
//#endregion
export { worker_entry_default as default };
