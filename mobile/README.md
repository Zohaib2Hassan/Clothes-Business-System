# Threadly Pocket 1.1

A native Android/iPhone companion for the Threadly clothing-business website. Forest green, cream and lime design, built with Expo SDK 58 and Expo Router.

## Connect to your shop

Open the app, enter your public HTTPS website address, and sign in with your existing website account. Creating an account in the app creates a website account. The current testing address is https://phantom-linking-favorite-computed.trycloudflare.com . It works while this computer, Docker and the Cloudflare tunnel are running. Replace any older prefilled address on the sign-in screen with this current address. If it changes again, enter the new one there. Use a stable HTTPS deployment before store release.

The connected app shares products and photos, variants, inventory adjustments, customers, sales, held bags, discounts/tax, receipts, returns, expenses, reports/CSV, notifications, business details and account settings with the website. AI chat and forecasts use the website services; availability depends on the server configuration. Subscription status is read-only; native subscription purchases are not implemented. Recorded payments and refunds do not transfer money.

Refresh or reopen a screen to retrieve other devices' changes. This version does not use a continuous push connection. Shared features require internet. After an interrupted sale save, check sales history before retrying. Product costs are not captured in website sales, so reports show sales less expenses before product costs rather than claiming net profit.

The earlier on-device shop is available from the sign-in screen or Privacy & connection. Its records, fictional sample, JSON backups and offline features remain separate and are not automatically uploaded or merged.

## Run in VS Code

```powershell
npm.cmd ci
npm.cmd start
```

Use the signed APK for native testing. Adding SecureStore requires a new native build. For a browser preview:

```powershell
npm.cmd run export:web
node scripts/preview.mjs
```

Open http://localhost:8082 . Browser preview sessions use sessionStorage. Android/iPhone sessions use platform SecureStore; the app does not save your password. Server records remain in the website database. Browser preview and installed-app storage are separate.

## Build and verify

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npx.cmd expo-doctor
npx.cmd eas-cli@latest build:inspect --platform android --stage archive --profile preview --output artifacts/archive-connected
node scripts/verify-archive.mjs artifacts/archive-connected
npm.cmd run build:android:preview
```

Use a fresh archive output directory each time. EAS is linked to @zohaib2hassan/threadly-pocket and reuses its cloud Android keystore. Keep signing keys and server secrets out of source. The preview profile creates an APK; the production Android profile creates the Play upload AAB. iOS distribution needs your Apple Developer account. See STORE_RELEASE.md and VALIDATION.md.

`scripts/test-ui.mjs` checks the retained offline workflows. `scripts/test-connected-ui.mjs` checks shared workflows against the isolated QA server provided in the repository-root `scripts/mobileQaServer.mjs`. That server explicitly selects a separate synthetic-data database on local Mongo port 27018 and disables email/AI credentials. Both tests require Playwright with Edge; PLAYWRIGHT_MODULE can select an existing module. Never run test setup against real shop records.

See store/privacy-policy.html for the revised policy draft. Add a real support contact and host it at a stable HTTPS URL before submitting either store.

## Install the connected Android preview

[Download version 1.1.0, build 2](https://expo.dev/artifacts/eas/BW5D4qsLJHqI2f7jG5KK4D0TrqynP0r8iyjVk04YQwg.apk). On sign-in, replace the older prefilled testing address with the current address above, then use your website account. This APK is a testing build and has not been submitted to Google Play.

The signed Android build also passed emulator launch, HTTPS sign-in, SecureStore session restoration and sign-out smoke checks. Full physical-device testing remains pending. The native smoke script requires the isolated QA server and a temporary HTTPS QA address in ignored `artifacts/qa-public-url.txt`; never point it at the actual shop.

## GitHub repository layout

This app is in `mobile/` of the Clothes-Business-System repository. The Express server and Docker Compose setup are at the repository root. After cloning, run `cd mobile` before the npm commands above. The earlier standalone local working folder was retained; the GitHub copy contains source and setup files only. Build artifacts, signing keys, app records, local assistant settings and dependencies are excluded.
