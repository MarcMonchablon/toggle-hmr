/**
 * Content script, mostly here to inject inside the page JS runtime
 * the code to monkey-patch the WebSockets, and interface with the
 * background script.
 *
 * NOTE: To minimize the risk of race condition, we need to monkey-patch
 * the WebSocket implementation as soon as possible, to make sure that
 * the WebSocket responsible for the HMR is 'managed'. Unfortunately,
 * that means that we need to preemptively inject the JS code in
 * every pages that the extension should be available on, because from
 * what I've seen, the only way to know if the tab is an 'activeTab'
 * is through an async round-trip with the background task, which
 * might take too long if we want to 'manage' the HMR-related WebSocket.
 *
 * In order to mitigate the monkey-patching of WebSocket & JS injection
 * by default, the extension should only be enabled on localhost.
 */

// Inject script to monkey-patch WebSocket
var scriptEl = document.createElement('script');
scriptEl.src = chrome.runtime.getURL('managed-websocket.js');
(document.head || document.documentElement).appendChild(scriptEl);

// TODO: return page's WebSocket updates to the extension


// Send a message to the service worker on each page load,
// if we want to use the webRequest API early enough 
// to manage the websockets.
chrome.runtime.sendMessage({ message: 'page-load' });
