# Switching on the new client form

The form lives at happybirth-doula.co.uk/intake (and /ru/intake). When a client presses
"Send", their answers are saved as a new row in a Google Sheet in **your own Google
account** and you get a short email saying a new form has arrived. The email does not
contain the answers themselves, only the client's name and a link to the Sheet, so
health details never sit in your inbox.

You do this once. It takes about ten minutes.

## 1. Make the Sheet

1. Sign in to Google as **happybirthwithanna@gmail.com**.
2. Go to sheets.new. A blank spreadsheet opens.
3. Name it **Client intake forms** (top left).

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete everything in the editor and paste the whole script below.
3. Press the save icon.

Copy the whole of **intake-sheet-script.gs** (it's in the same folder as this guide) and paste it in.

## 3. Publish it

1. Top right: **Deploy → New deployment**.
2. Click the cog next to "Select type" and choose **Web app**.
3. Fill in:
   - Description: `Client form`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy**. Google asks you to authorise: choose your account, then
   **Advanced → Go to (unsafe)** → **Allow**. This warning appears for every
   home-made script; it is your own code running in your own account.
5. Copy the **Web app URL** (it starts `https://script.google.com/macros/s/`).

## 4. Connect it to the website ✓ done

Nothing to do here: Claude has already put your Web app URL into the website
(12 October 2026). You only need this step again if you ever make a brand-new
deployment and get a different URL. In that case, send the new URL to Claude.

## 5. Test

Fill in the form on the website with made-up details. Within a few seconds a row should
appear in the Sheet and the email should arrive. Delete the test row afterwards.

## Keeping it safe

- Do not share the Sheet with anyone. It holds health information.
- Turn on 2-Step Verification for happybirthwithanna@gmail.com if it is not on already.
- Delete rows for enquiries that do not become clients within 12 months, as your privacy
  notice promises.
- If you ever change the script, use **Deploy → Manage deployments → Edit → New version**
  so the web address stays the same.

## Making the Sheet easier to read (added 12 Oct)

The script now keeps two tabs:

- **Client card**: choose a name from the dropdown at the top and that client's answers
  appear as a tidy list under headings (About you, Partner, Emergency contact, Midwife or
  doctor, Previous pregnancies, Consent). It opens on the newest client automatically.
- **Answers**: one row per client, newest at the top, name and received date kept in view
  while you scroll sideways, dates shown as dd/mm/yyyy.

To switch it on (once):

1. Open the Sheet → **Extensions → Apps Script**.
2. Select everything in the editor, delete it, paste the whole of **intake-sheet-script.gs**, and save.
3. In the toolbar, choose **setupSheet** from the function dropdown and press **Run**.
   If Google asks for permission again, allow it. Your existing answers are kept and reordered.
4. **Deploy → Manage deployments → pencil (Edit) → Version: New version → Deploy.**
   The web address stays the same.
