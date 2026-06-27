<div align="center">

[<img src="https://raw.githubusercontent.com/hydralauncher/hydra/refs/heads/main/resources/icon.png" width="144"/>](https://help.hydralauncher.gg)

  <h1 align="center">Hydra Launcher</h1>

  <p align="center">
    <strong>Fork with self-hosted backend support — your own cloud saves, accounts and profiles.</strong>
  </p>

![Hydra Launcher Home Page](./docs/screenshot.png)

</div>

## What this fork adds

This is a fork of [hydralauncher/hydra](https://github.com/hydralauncher/hydra) that adds support for a self-hosted backend via [entitybtw/hydra-selfhosted](https://github.com/entitybtw/hydra-selfhosted).

With a self-hosted instance you get:

- **Your own cloud saves** — save backups stored on your server, not Hydra Cloud
- **Your own account** — register with a username and password on your server
- **Public profile** — shareable profile page at `your-server/u/username` with playtime and game library
- **Web dashboard** — manage your profile, accent color, and custom CSS from a browser or from inside the launcher
- **No subscription** — everything works without a Hydra Cloud subscription

You can use the self-hosted account alongside your official Hydra account at the same time — the sidebar shows both.

## Self-hosted setup

1. Deploy [entitybtw/hydra-selfhosted](https://github.com/entitybtw/hydra-selfhosted) on your server
2. In Hydra: **Settings → Self-Hosted API**
3. Enter your server URL and API token
4. A login window opens — register or sign in
5. Done — cloud saves and library sync to your server automatically

## Features

- Add games to your library
- Profile with friends, achievements, and playtime
- Cloud saves (Hydra Cloud or self-hosted)
- Achievements tracking
- Rich game catalogue with suggestions

## Build from source

Requirements: Node.js, Python 3.9+, Rust toolchain

```bash
npm install
npm run build:linux   # or build:win / build:mac
```

## Contributors

<a href="https://github.com/hydralauncher/hydra/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hydralauncher/hydra" />
</a>

## License

[MIT License](LICENSE)
