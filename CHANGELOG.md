# Changelog

## [1.0.0] - 2022-12-22

### Added

- Monkey-patch default WebSocket implementation to allow for a finer
  degree of control over individual WebSockets.
- Add `_wsRegister` object in global scope, a register of all WebSocket
  created in the page.
- Communication between page runtime and background via the content-script.
- Default icon (A totally rad electric rat !).
- Indicator on icon when websockets has been unplugged.

### Fixed

- Limit extension scope to localhost pages.

