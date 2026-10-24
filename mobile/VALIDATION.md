# Connected mobile verification - updated 24 October 2026

Version 1.1.0 adds website accounts and shared shop records. The older v1.0.0 APK is offline-only and does not contain this update.

## Completed checks

| Check | Result |
| --- | --- |
| Mobile unit/API/report tests | 27 passed |
| Website regression tests | 22 passed, including sign-in challenge isolation, prorated returns, validation before stock writes, concurrent receipt rejection and complete account deletion filters |
| Mobile TypeScript/lint | Passed |
| Expo Doctor | 20/20 passed |
| Web production export | Passed |
| iOS JavaScript export | Passed with --no-bytecode for diagnostics; not an IPA/native compile |
| Offline browser regressions | 16 workflow checks passed |
| Connected browser regressions | 20 shop/account workflow checks plus 4 service-screen checks passed against a separate synthetic QA database |
| Responsive browser layout | Rendered connected screens checked at 320, 390 and 800 px |
| EAS upload archive | 42 files verified against workspace hashes, all source and icons present; no credentials, test records or local dependencies |
| Docker website | Updated server deployed preserving existing Mongo volume |
| Public testing connection | Website and API returned HTTP 200; unauthenticated protected API returned 401 |

Connected browser checks exercise website registration, product/photo/variant save, customers, holding/resuming bags (including custom items), server totals, checkout, receipt export, discounted refunds and stock restoration, expenses, inventory, reports/CSV, business details, notifications, cross-client refresh, password/2FA, deletion and expired-session redirection. A test allowed the server to save a checkout and then dropped its response: the app blocked a repeat save and offered explicit history-first recovery. There were no browser runtime exceptions. Service-screen checks consumed the real QA forecast response and subscription status, then tested assistant rendering and network failure with an explicitly mocked reply. No external AI provider was called by these UI tests.

The QA server selects `threadly_mobile_qa_20261023` explicitly on local Mongo port 27018 and blanks email and AI credentials. Tests never create or delete actual shop records. Two-factor UI testing uses the clearly labelled non-production demo code, not a real email delivery. Native photo picking uses Expo's document picker and file reading; browser tests exercise its web adapter.

Evidence: `artifacts/connected-ui-results.json`, `artifacts/ui-results.json`, connected screenshots, receipt/CSV test downloads, and `artifacts/archive-connected-12`. These are browser development captures, not native store screenshots.

## Android build

The new EAS build is `f8615dfd-bf49-4f23-ba5e-2107b13f8374`, app version 1.1.0, remote versionCode 2, reusing the existing Android keystore. It finished successfully and produced the signed APK: https://expo.dev/artifacts/eas/BW5D4qsLJHqI2f7jG5KK4D0TrqynP0r8iyjVk04YQwg.apk .

Downloaded artifact: `artifacts/Threadly-Pocket-1.1.0-preview.apk` (also copied to `Threadly-Pocket-preview.apk`), 91,459,601 bytes. SHA-256: `53cb07b8f756757e22305fc43d6d3346699cf4a29935618df49346d23f98af4a`. Android SDK apksigner verifies its v2 signature, one RSA signer. Package ID is `com.zohaibhassan.threadlypocket`, versionName 1.1.0, versionCode 2, min SDK24/target36, four CPU architectures. Signer digest matches the earlier app key, allowing an update without a new package identity.

The temporary tunnel expired after the overnight connection interruption. It was replaced on 24 October with https://phantom-linking-favorite-computed.trycloudflare.com and verified with HTTP 200. The APK retains yesterday's prefilled address: replace it with the current address on the sign-in screen. A configurable address is intentional because Quick Tunnel names change.

## Android emulator check - 24 October

The signed v1.1.0 APK installed and launched on the Android API 37 x86_64 emulator after a cold boot cleared a stuck package installation/launcher state. Native HTTPS sign-in against the isolated QA server reached the shared dashboard; a full force-stop/relaunch restored the SecureStore session. Sign-out was confirmed through the native dialog. The automated logout tap needed a manual retry after scroll settling. The synthetic account was deleted through the QA API. Evidence: `artifacts/android-smoke-results.json`, `native-home.png`, `native-connect.xml` and `native-signed-out.xml`. This is an emulator smoke check, not full device QA.

## Remaining release checks

Physical Android/iPhone/iPad QA, iOS signing/native compilation, Play AAB generation and store submissions remain pending. Browser checks and JavaScript exports do not establish native-device behavior. Verify native SecureStore persistence, app lifecycle, photo/file picker, PDF sharing, keyboard and connection-loss behavior on actual devices.

The public address is a temporary Cloudflare tunnel. Keep this PC, Docker and cloudflared running. Replace it with stable HTTPS hosting before production, and finalize support contact, privacy/deletion URLs, native screenshots, store data disclosures and review credentials. Live AI-provider responses, email delivery and trained forecast accuracy have not been validated by synthetic browser tests. Native subscription purchases are not enabled.

Server returns now prevalidate all lines, allocate paid cents including tax/discount, and compare the receipt version before restoring stock. Sale, inventory, customer and return audit updates still span separate Mongo writes; database-failure recovery is not transactionally guaranteed and requires reconciliation testing before production. No gateway payment or customer refund is executed by this app.

Existing local shop storage is retained separately. It is not migrated or merged with the website, and exported backups/files remain the user's responsibility. The GitHub repository layout places the mobile source under `mobile/` beside the server at the root. The original standalone mobile working folder is retained locally. Dependencies, credentials, app records and generated artifacts are excluded.

The initial emulator install failure (INSTALL_FAILED_DUPLICATE_PACKAGE) was resolved by cold boot. The final APK install and basic native account flow passed. Native photo/PDF workflows and physical phone testing remain pending.
