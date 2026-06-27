<div align="center">

[<img src="https://raw.githubusercontent.com/hydralauncher/hydra/refs/heads/main/resources/icon.png" width="144"/>](https://help.hydralauncher.gg)

  <h1 align="center">Hydra Launcher</h1>

  <p align="center">
    <strong>Fork of <a href="https://github.com/hydralauncher/hydra">hydralauncher/hydra</a> with self-hosted API support, dual accounts, and cloud save improvements.</strong>
  </p>

![Hydra Launcher Home Page](./docs/screenshot.png)

</div>

## Fork additions

- **Self-hosted API** — run your own backend for cloud saves, achievements, accounts and profiles: [entitybtw/hydra-selfhosted](https://github.com/entitybtw/hydra-selfhosted)
- **Dual accounts** — use both an official Hydra account and a self-hosted account simultaneously; sidebar shows both profiles
- **Web dashboard in-app** — Settings → Self-Hosted API → "Manage account" opens the self-hosted web dashboard inside the launcher window, auto-logging you in
- **Profile editing via self-hosted** — Edit Profile, Update Password, and Manage Subscription all route to your self-hosted instance when connected
- **Instant playtime updates** — changing playtime via Danger Zone updates the library immediately without a restart
- **Game title sync** — correct game titles are synced to the self-hosted server as soon as they're resolved from Steam
- **Cloud save restore improvements** — diff-based restore deletes stale save files not present in the backup

## Self-hosted setup

1. Deploy [entitybtw/hydra-selfhosted](https://github.com/entitybtw/hydra-selfhosted) on your server
2. In Hydra: **Settings → Self-Hosted API**
3. Enter your server URL and `API_TOKEN`
4. Click **Save** — a login/register window opens from your server's web UI
5. Log in — the launcher connects and syncs your library automatically

## Features

- Add games to your library
- Profile with friends, achievements, and playtime
- Cloud saves via Hydra Cloud or self-hosted
- Achievements tracking
- Rich game catalogue with suggestion algorithm

## Build from source

Requirements: Node.js, Python 3.9+, Rust toolchain

```bash
npm install
npm run build:linux   # or build:win / build:mac
```

Packaging runs `build:python-rpc` and `build:native` automatically.

## Contributors

<a href="https://github.com/hydralauncher/hydra/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hydralauncher/hydra" />
</a>

## License

[MIT License](LICENSE)
