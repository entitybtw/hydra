<div align="center">

[<img src="https://raw.githubusercontent.com/hydralauncher/hydra/refs/heads/main/resources/icon.png" width="144"/>](https://help.hydralauncher.gg)

  <h1 align="center">Hydra Launcher</h1>

  <p align="center">
    <strong>Fork with self-hosted backend support — your own cloud saves, accounts and profiles.</strong>
  </p>

![Hydra Launcher Home Page](./docs/screenshot.png)

</div>

## What this fork adds

This is a fork of [hydralauncher/hydra](https://github.com/hydralauncher/hydra) with a self-hosted backend via [entitybtw/hydra-selfhosted](https://github.com/entitybtw/hydra-selfhosted).

### Self-hosted backend

- **Your own cloud saves** — save backups stored on your server, not Hydra Cloud
- **Your own account** — register with a username and password on your server
- **Public profile** — shareable profile page at `your-server/u/username` with playtime and game library
- **Web dashboard** — manage your profile, banner, avatar, accent color, and custom CSS from a browser
- **No subscription** — everything works without a Hydra Cloud subscription; all cloud save slots are unlimited
- **Session control** — configure session duration and auto sign-out behavior

### Profile

- **Pin & favorite games** — mark games as pinned or favorited; pinned games float to the top of the sidebar and your public profile
- **Pin/favorite badges** — pinned and favorited games show icons in the library card view
- **Recent activity** — public profile shows recently played games per tab (Hydra / Steam) with toggle and reorderable sections

### SteamGridDB integration

- **Custom game art** — browse and apply icons, logos, and hero banners directly from SteamGridDB in **Game Settings → Assets**
- Searches by game title automatically; Steam games are matched by App ID for accurate results
- Set your SteamGridDB API key once in **Settings → Integrations → SteamGridDB**

### Other

- Download sources always route through the official Hydra API (self-hosted instances do not interfere)
- Sidebar sorts pinned games to the top

## Self-hosted setup

1. Deploy [entitybtw/hydra-selfhosted](https://github.com/entitybtw/hydra-selfhosted) on your server
2. In Hydra: **Settings → Integrations → Self-Hosted API**
3. Enter your server URL and API token, click **Save**
4. A login window opens — register or sign in
5. Cloud saves and library sync to your server automatically

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
