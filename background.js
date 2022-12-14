// === On Install
chrome.runtime.onInstalled.addListener(() => {
	chrome.action.setBadgeText({ text: 'OFF' });
});

// === On Click
chrome.action.onClicked.addListener(async (tab) => {
	const oldState = await chrome.action.getBadgeText({ tabId: tab.id });
	const newState = (oldState === 'ON') ? 'OFF' : 'ON';

	await chrome.action.setBadgeText({ tabId: tab.id, text: newState });

	if (newState === 'ON') {
		// TODO: check webSockets
		console.log('TODO: check websockets');
	} else {
		console.log('TODO: re-enable all websockets');
	}
});

