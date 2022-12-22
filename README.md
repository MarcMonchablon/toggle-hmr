# Toggle-HMR

Allow better control of WebPack or Vite's HMR (Hot Module Reload) by toggling WebSocket during runtime.

You can tell that WebSocket are 'unplugged' when there is a '!' visible on
the icon.

For now, this is a Chrome-only web extension.


## Project status

Since v1.0.1, the main feature (and raison d'être) of this plugin is working,
which was to give a way to disable both [Vite](https://vitejs.dev/) and [Next.js](https://nextjs.org/) auto-reload feature.
This is done with a kinda heavy-handed approach,
which is to disable **all WebSockets** on page when the plugin is activated.

Future plan includes:
 - Finer toggling of individual WebSocket through a popup interface.
 - Finer filtering of message, e.g. to pass heartbeat requests while
   filtering the rest.


## How it works

The `managed-websocket.js` file contains code which wrap the native
implementation of WebSockets into one that gives better control over it's
behavior, even when created by a third party.

New WebSockets are also registered into an globally accessible variable at `_wsRegister`,
with handy methods such as `plugAll()`, `unplugAll()` or `getState()`.

This new implementation is then injected into the page (hopefully) early
enough to capture all WebSockets created by third-party scripts. Clicking
on the plugin icon in the toolbar will then toggle WebSocket on or off.


## FAQ

### Will this plugin be ported to Firefox/Opera/Safari?

While this extension use standard Web Extension API to do its bidding,
it was made using the [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/),
which is for the moment a Chrome-only thing.
There is talk into supporting that Manifest V3 at least in Firefox
(haven't checked the other browsers), so instead of back-porting it to
the more generally supported V2, I prefer to wait till V3 has wider
support. After all this extension is mostly to scratch my own itch.


### I want to disable auto-refresh without disabling other WebSockets.

If I go around to it, this will be the next improvement of this plugin,
but in the meantime, you can manually toggle the WebSockets on an off
by using `_wsRegister.getItems()` and then `ws.setPlugged(bool)`.


### Is it possible to enable this extension on a page other than localhost?

Since I need to monkey-patch the WebSocket early enough to capture third-party code,
I do it *by default on every page in which this extension is available*.
Since this is intrusive, and might potentially result in hard-to-debug
issues on some pages, I limited it to localhost as a mitigating measure.

But fret not! If you want to customize this extension you're invited to copy the code
and load your own version of that extension!

Simply:
- Make a local copy of this code on a folder that can be accessed by the 
  browser you want to customize.
- [Load the unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
  in your "Chrome > More Tools > Extension" page.
- Open `manifest.json` in an editor, and change the `matches` values in both
  `content_scripts` and `web_accessible_resources` fields with a valid
  [match pattern](https://developer.chrome.com/docs/extensions/mv3/match_patterns/).
 - Don't forget to refresh the extension in the "Chrome > More Tools > Extension" page!


### Electric rat? Mmmhhh no thanks!

⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠘⣿⣿⡟⠲⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠈⢿⡇⠀⠀⠈⠑⠦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠴⢲⣾⣿⣿⠃
⠀⠀⠈⢿⡀⠀⠀⠀⠀⠈⠓⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡤⠖⠚⠉⠀⠀⢸⣿⡿⠃⠀
⠀⠀⠀⠈⢧⡀⠀⠀⠀⠀⠀⠀⠙⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡤⠖⠋⠁⠀⠀⠀⠀⠀⠀⣸⡟⠁⠀⠀
⠀⠀⠀⠀⠀⠳⡄⠀⠀⠀⠀⠀⠀⠀⠈⠒⠒⠛⠉⠉⠉⠉⠉⠉⠉⠑⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠏⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠘⢦⡀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠃⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠙⣶⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⣀⣀⠴⠋⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣰⠁⠀⠀⠀⣠⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣀⠀⠀⠀⠀⠹⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⠀⠀⢸⣀⣽⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣧⣨⣿⠀⠀⠀⠀⠀⠸⣆⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⠀⠀⠘⠿⠛⠀⠀⠀⢀⣀⠀⠀⠀⠀⠀⠙⠛⠋⠀⠀⠀⠀⠀⠀⢹⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢰⢃⡤⠖⠒⢦⡀⠀⠀⠀⠀⠀⠙⠛⠁⠀⠀⠀⠀⠀⠀⠀⣠⠤⠤⢤⡀⠀⠀⢧⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⢸⡀⠀⠀⢀⡗⠀⠀⠀⠀⢀⣠⠤⠤⢤⡀⠀⠀⠀⠀⢸⡁⠀⠀⠀⣹⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⡀⠙⠒⠒⠋⠀⠀⠀⠀⠀⢺⡀⠀⠀⠀⢹⠀⠀⠀⠀⠀⠙⠲⠴⠚⠁⠀⠀⠸⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠦⠤⠴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢳⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢸⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠾⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠦⠤⠤⠤⠤⠤⠤⠤⠼⠇⠀⠀⠀⠀⠀


### Is this a real FAQ ?

Not really, it's just me talking to myself, pretending to have friends 🥲.
