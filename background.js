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
	const tabId = sender.tab.id;
	const payload = data.message || {};
	/*
	console.group('[Background] on pageEvent');
	console.log('tabId: ', tabId);
	console.log('payload: ', payload);
	console.groupEnd();
	*/
	switch (payload.type) {
	case 'page-load':
		onPageLoad(tabId);
		break;
	case 'register':
		// No-op
		break;
	default:
		console.warn('[Background::onPageEvent] unhandled payload: ', payload);
	}
});


// === On action click
chrome.action.onClicked.addListener(async (tab) => {
	// Variable set for clarification: since we need to invert the value
	// of 'setPlugged', and 'unplugAllWebsockets' is already it's opposite,
	// We actually need to pass the same boolean value as retrieve from storage
	// to toggle the value.
	const unplugAllWebsockets = await getTabVariable(
		tab.id,
		'unplugAllWebsockets',
		false
	);
	const setPlugged = unplugAllWebsockets;
	toggleAllWebsockets(tab.id, setPlugged, true);
});

async function toggleAllWebsockets(tabId, setPlugged, saveInStorage = false) {
	// Update action label on click
	const LABEL_UNPLUG_WEBSOCKETS = '!';
	const label = setPlugged ? '' : LABEL_UNPLUG_WEBSOCKETS;
	await chrome.action.setBadgeText({ tabId: tabId, text: label });

	// Toggle state for all websockets
	chrome.tabs.sendMessage(tabId, {
		scope: 'all-websockets',
		command: 'setPlugged',
		value: setPlugged,
	});

	// Save state in storage
	if (saveInStorage) {
		setTabVariable(tabId, 'unplugAllWebsockets', !setPlugged);
	}
}



// === On page load
async function onPageLoad(tabId) {
	const unplugAllWebsockets = await getTabVariable(
		tabId,
		'unplugAllWebsockets',
		false
	);
	if (unplugAllWebsockets) {
		toggleAllWebsockets(tabId, false, false);
	}
}

// === Per-tab storage
async function getTabVariable(tabId, key, defaultValue = null) {
	const tabKey = `tab:${tabId}`;
	try {
		let storage = await chrome.storage.session.get({ [tabKey]: {} });
		const value = storage[tabKey][key] ?? defaultValue;
		return value;
	} catch(e) {
		return null;
	}
}

async function setTabVariable(tabId, key, value) {
	const tabKey = `tab:${tabId}`;
	try {
		let storage = await chrome.storage.session.get({ [tabKey]: {} });
		storage[tabKey][key] = value;
		await chrome.storage.session.set(storage);
		return true;
	} catch(e) {
		return false;
	}
}
