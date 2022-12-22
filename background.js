/**
 * Background task, it has two main responsibilities:
 * - send command to page runtime, mainly to enable/disable websockets.
 * - display current websocket states in popup (TODO).
 */

// === On webExtension install
chrome.runtime.onInstalled.addListener(() => {
	chrome.action.setBadgeText({ text: '' });
});


// === On page event
chrome.runtime.onMessage.addListener(async (data, sender)=> {
	// TODO: display status for each websockets
	/*
	const tabId = sender.tab.id;
	const payload = data.message;
	console.group('[Background] on pageEvent');
	console.log('tabId: ', tabId);
	console.log('payload: ', payload);
	console.groupEnd();
	*/
});


// === On action click
chrome.action.onClicked.addListener(async (tab) => {
	const LABEL_UNPLUG_WEBSOCKETS = '!';

	// Update action label on click
	const oldLabel = await chrome.action.getBadgeText({ tabId: tab.id });
	const newLabel = (oldLabel === '') ? LABEL_UNPLUG_WEBSOCKETS : '';
	await chrome.action.setBadgeText({ tabId: tab.id, text: newLabel });

	// Toggle state for all websockets.
	chrome.tabs.sendMessage(tab.id, {
		scope: 'all-websockets',
		command: 'setPlugged',
		value: newLabel !== LABEL_UNPLUG_WEBSOCKETS,
	});
});
