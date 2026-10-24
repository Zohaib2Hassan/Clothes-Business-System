# Website-connected mobile update

User selected website login and shared live data. Keep the website Express/MongoDB server authoritative. Preserve existing on-device records under their current storage key and make them accessible separately; never merge sample/local data into the server.

Implement native screens using existing API contracts: login/register/2FA; dashboard; products and stock; POS validation/checkout/held bags; sales receipts and returns; customers; expenses; analytics and CSV reports; forecasts and assistant; notifications; business/account settings; subscription status. Use encrypted native session storage, HTTPS website selection, request cancellation/session boundaries, visible loading/errors and no automatic mutation retries. Native subscription purchase processing is outside the existing physical-goods POS API and must not simulate a store purchase.

Backend inspected: `../clothing business assistant/server`; current Docker website is healthy on loopback port 8080. API addresses must be reachable from a phone; localhost is not a public website. The user chose a temporary testing link; Cloudflare is serving https://phantom-linking-favorite-computed.trycloudflare.com .

Release work: validate with domain/API tests and a separate synthetic QA database, browser workflows, lint/typecheck/Expo Doctor, real EAS upload archive, refreshed source ZIP and a newly signed Android preview APK. Old v1.0.0 APK does not contain these changes. Update privacy/listing documentation for online account/data/AI handling. Do not claim device QA or cloud/store publication from browser tests alone.

Implementation and synthetic browser regressions are complete. Signed Android EAS build f8615dfd-bf49-4f23-ba5e-2107b13f8374 finished; APK signature and package/version were verified. The overnight tunnel expired and a new current address is in README.md. See VALIDATION.md for evidence and remaining release requirements.
