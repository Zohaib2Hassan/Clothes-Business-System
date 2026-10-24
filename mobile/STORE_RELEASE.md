# Build and publish Threadly Pocket 1.1

The app is linked to @zohaib2hassan/threadly-pocket, package/bundle ID com.zohaibhassan.threadlypocket. Existing Android credentials are managed on EAS. The user has Google Play Console; Apple Developer enrollment is still needed. No store submission has been made.

## Android testing and Play upload

```powershell
npm.cmd run build:android:preview
npm.cmd run build:android:store
```

Preview produces an installable signed APK. Production produces the AAB for Google Play. Use the existing upload/signing key and remote auto-incremented versionCode. Upload the first AAB through Play Console's internal testing flow, then inspect the pre-launch report and your Console's current production-access requirements. Do not create another signing key for this package.

## iPhone

Enroll in the Apple Developer Program, create the matching bundle ID and App Store Connect app, then run:

```powershell
npm.cmd run build:ios:store
npx.cmd eas-cli@latest submit --platform ios --profile production
```

EAS can compile from a Windows-initiated cloud build. Apple authentication/provisioning and real-device TestFlight QA remain required. An upload is not an approved public release.

## Before submission

- Replace the temporary testing tunnel with a stable public HTTPS website. Keep a reliable backend/database and working email delivery for two-factor sign-in. Production no longer displays verification codes in API responses; without SMTP delivery an enabled 2FA account receives a clear sign-in error.
- Publish a reviewed privacy policy and account-deletion/support page with your real contact information. The policy in store/ is a draft. Complete Play Data safety and Apple privacy declarations for account/contact, shop/customer, uploaded photo, AI and export data handling and the shipped SDKs.
- Provide a review account and instructions so reviewers can use the online shop without relying on the developer's PC. Keep sample records clearly labelled and separate.
- Capture required screenshots from the final native binary. Browser captures are development evidence.
- Test sign-in/2FA, keyboards, photos, stock, held bags, checkout, returns, reports, PDF sharing, app resume/restart, offline failures, account switching and deletion on real Android/iPhone devices. A failed network save requires checking history before retrying.
- Existing website subscription status is visible, but this build offers no native digital-plan purchases. Implement appropriate store billing and entitlement verification before adding purchases.
- Review current dependency audit results and SDK-compatible updates before production. Do not force incompatible Expo/React Native downgrades.

The old v1.0 APK is offline-only and does not include shared website features. Refer to VALIDATION.md for the current version's actual artifact and test status.
