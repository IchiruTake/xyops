# xyOps Changelog

## Version v0.9.5

> December 31, 2025

- [3388e85](https://github.com/pixlcore/xyops/commit/3388e85c453db3ffbeced5b1acc4ff203ca39c3f): Version 0.9.5
- [2ca5162](https://github.com/pixlcore/xyops/commit/2ca516247f8887d00045124a55ddb29e4b7bc54a): Fix issue where files could arrive without being uploaded.
- [c23a075](https://github.com/pixlcore/xyops/commit/c23a0758af1e63ed37fdc6d9c44d37173382cf58): Reconfigure local satellite to connect to hostID, not "localhost" (breaks xyRun)

## Version v0.9.4

> December 31, 2025

- [85a9875](https://github.com/pixlcore/xyops/commit/85a9875d6e3f0734495ecbd20bf0fee3a0ffb9bc): Version 0.9.4
- [19d0458](https://github.com/pixlcore/xyops/commit/19d0458af157feab250e207187dd65fba0542d0d): Fix: Toolset fields need to support new JSON type, and number variant
- [22e0b7e](https://github.com/pixlcore/xyops/commit/22e0b7ec07da59b5e5ca7abe37d6b873ef7dccb1): Run as root inside the container, so we can access /var/run/docker.sock
- [08060b7](https://github.com/pixlcore/xyops/commit/08060b786f8b2570fec286987ae8d2587d00e1e7): Fix issue where conductor self-upgrade sleeps for full stagger amount even if no other servers were upgraded.

## Version v0.9.3

> December 30, 2025

- [d341dee](https://github.com/pixlcore/xyops/commit/d341dee3c36f3f87453c88bbb47f64292bc1d641): Version 0.9.3
- [349d71e](https://github.com/pixlcore/xyops/commit/349d71ea1d9ba5901c2e1036fd4011818949bf8f): Added docs on new JSON parameter type, and clarification on number parameter variant parsing behavior.
- [715f3c7](https://github.com/pixlcore/xyops/commit/715f3c786a3a60d980bdf5a017460ea0ad5c0c2f): Added changelog, with auto generator script.

## Version v0.9.2

> December 30, 2025

- [029a96a](https://github.com/pixlcore/xyops/commit/029a96aebd721fe565b1b5c8f2b661564c9017f3): Version 0.9.2
- [0ed4aab](https://github.com/pixlcore/xyops/commit/0ed4aaba9159ba3ee8c0fb55172650f164defc6d): Cleanup internal job report, so markdown list doesn't break
- [aa9caa8](https://github.com/pixlcore/xyops/commit/aa9caa8cb6c001d20990f34388ab3c0a25a1cb3a): Tweak directory permissions, for self upgrades to work properly.

## Version v0.9.1

> December 30, 2025

- [d1c00fc](https://github.com/pixlcore/xyops/commit/d1c00fc5558b7f1e3cb2885f2a17cf9f21a5af14): Version 0.9.1
- [094f785](https://github.com/pixlcore/xyops/commit/094f785bca2b04b6916d7e269ee5bcb7abced2d2): Add JSON param type, and also parse number variants as numbers.
- [6cfd035](https://github.com/pixlcore/xyops/commit/6cfd035f16283f120b0ec0be725377d9afdef4b5): Fix typo in macro expansion example
- [381f8bb](https://github.com/pixlcore/xyops/commit/381f8bb4632bd2c109785bfb192a69078cf9d0fb): Add debug logging to api_get_master_releases
- [23af35b](https://github.com/pixlcore/xyops/commit/23af35b4cf9a91afeb0e505c6b9168333c8afcf4): Tweak column names
- [ed9e1b2](https://github.com/pixlcore/xyops/commit/ed9e1b20bee7a284247355b630ed8232b1a2c22a): Add icons to table
- [9db61dc](https://github.com/pixlcore/xyops/commit/9db61dc61a2b3a4d202000efbedc3d425d427733): Add default search presets to stock admin account
- [7864a84](https://github.com/pixlcore/xyops/commit/7864a844919b7f62891ce3786506d98524f9ba8e): Conductors page: Only call addPageDescription on onActivate, not every call to render_masters

## Version v0.9.0

> December 29, 2025

- Initial beta release!
