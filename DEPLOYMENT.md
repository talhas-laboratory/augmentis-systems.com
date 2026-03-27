# Vercel Deployment

## Projektstruktur

- `/index.html` ist die öffentliche Desktop-Landingpage unter der Root-URL.
- `/mobile.html` ist die mobile Variante; mobile Geräte werden von `/` per kleinem Client-Side-Switch dorthin geleitet, während Desktop-Aufrufe von `/mobile.html` wieder auf `/` zurückgehen.
- `/impressum.html` und `/datenschutz.html` sind die gemeinsamen Rechtsseiten.
- `/api/contact.js` verarbeitet Formularanfragen serverseitig und übergibt sie an Resend.
- `/vercel.json` enthält Redirects, Sicherheitsheader und die Frankfurt-Region für den Kontakt-Endpunkt.

## Erforderliche Umgebungsvariablen

Siehe `.env.example`:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `SITE_URL`

## Vercel-Setup

1. Neues Projekt in Vercel mit diesem Ordner als Root anlegen.
2. Als Build Command `npm run build` verwenden; damit wird `assets/css/tailwind-built.css` bei jedem Deploy neu erzeugt.
3. Die vier Umgebungsvariablen in `Production`, `Preview` und bei Bedarf `Development` setzen.
4. Die Domain `augmentis-systems.com` hinzufügen.
5. `www.augmentis-systems.com` ebenfalls hinzufügen; der Redirect auf die Apex-Domain erfolgt über `vercel.json`.
6. Nach dem ersten Deploy die Absenderdomain für Resend verifizieren, damit `CONTACT_FROM_EMAIL` zugestellt werden kann.

## Hinweise

- Die Website benötigt keinen Framework-Build; Vercel serviert die statischen Dateien direkt, erzeugt aber vorab die lokale Tailwind-Datei über `npm run build`.
- Die alten Desktop-/Mobile-Prototyp-Routen werden serverseitig auf `/` umgeleitet.
- Wenn sich Hosting, Formularverarbeitung oder weitere Drittanbieter ändern, muss `datenschutz.html` mitgezogen werden.
