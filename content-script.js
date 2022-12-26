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
 *
 * NOTE: we need to JSON.stringify the payload in event.detail because
 * of a bug in Chrome: if the event is sent into a closure (such as
 * setTimeout, or inside another event's listener), and the delay is
 * too long (> 20ms) then the content-script receive an event with
 * `event.detail === null`, probably because of an overbearing garbage
 * collector. Luckily, the behavior doesn't seem to apply for primitives,
 * which is why we JSON.stringify the payload as a workaround.
 */

// Set-up communication between background task and page runtime
window.addEventListener('togglehmr-event', (e) => {
	const payload = e.detail ? JSON.parse(e.detail) : null;
	chrome.runtime.sendMessage({ message: payload });
});

chrome.runtime.onMessage.addListener((data, sender) => {
	window.dispatchEvent(new CustomEvent('togglehmr-command', {
		detail: JSON.stringify(data),
	}));
});

// Inject script to monkey-patch WebSocket
var scriptEl = document.createElement('script');
scriptEl.src = chrome.runtime.getURL('managed-websocket.js');
(document.head || document.documentElement).appendChild(scriptEl);

// Notify background task for each page-load, because we want
// to keep websocket disabled even after a reload.
chrome.runtime.sendMessage({ message: { type: 'page-load' }});
