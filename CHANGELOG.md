# Changelog

## [1.1.0] - 2022-12-26

### Added

- A slick README.md file because apparently other peoples exists

### Fixed

- Actually block Next.js from refreshing (by unplugging new WebSockets)
- Fix "unplugged" state lost when refreshing the page
- Too many requested permissions in manifest

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

