# Pokémon-koordinator 🎴

A tiny, two-person web app for coordinating bids on Pokémon cards on
[Tradera](https://www.tradera.com/). One of you finds a card, adds it, and the
other gets an e-mail asking them to **approve** or **deny** the bid. Nobody
bids until you both agree.

- **Frontend:** React + Vite + Tailwind, hosted free on **GitHub Pages**
- **Backend:** **Supabase** (free) — a Postgres table + three small Edge Functions
- **E-mail:** sent through one of your own **Gmail** accounts (free, no domain needed)
- **Login:** one shared password (just to keep strangers out)

The whole interface is in Swedish. Everything below — the setup — is in English.

---

## What it does

1. You open the site and type the **shared password** (once per device).
2. You pick who you are — **"Jag är Anna"** or **"Jag är Erik"** (once per device).
3. You see all pending cards, and a big **"Lägg till kort"** button.
4. Adding a card auto-fetches the card image from the Tradera link, then saves it
   and **e-mails the other person**.
5. The other person clicks **Godkänn** or **Neka** (with a reason). The original
   submitter gets an e-mail with the decision.
6. Decided cards stay on the board with a status badge for 24 hours, then delete
   themselves automatically.

---

## Before you start — what you'll need

| Thing | Where | What it's for |
|---|---|---|
| **GitHub** account | https://github.com/join | Hosts the code and the website |
| **Supabase** account | https://supabase.com | Stores the cards, runs the e-mail sender |
| **A Gmail account** | you already have one | Sends the notification e-mails |
| **Node.js** | https://nodejs.org (pick "LTS") | Needed for a couple of setup commands |

You'll use **one** of your two Gmail accounts to send the notifications. The
e-mails will simply arrive *from* that address. It doesn't matter which of you
provides it.

> ⏱️ **Time:** about 30–40 minutes the first time. You only do it once.

---

## The setup, step by step

There are 8 steps. Do them in order.

### Step 1 — Put the code on GitHub

1. Create a **new, empty repository** on GitHub (the green **"New"** button on your
   repositories page). Name it whatever you like, e.g. `pokemon-approval`.
   Keep it **Public** (GitHub Pages is simplest on public repos) and **don't** add
   a README (you already have one).
2. Upload this project's files to that repository. The easiest no-terminal way:
   on the repo page, click **"uploading an existing file"** and drag in all the
   files and folders from this project.
   *(If you're comfortable with git, just `git init`, commit, and push instead.)*

> 📌 The website's address will be
> `https://YOUR-USERNAME.github.io/pokemon-approval/`
> (using your GitHub username and the repo name). Note it down — you'll need it in
> Step 6 and Step 8.

---

### Step 2 — Create your Supabase project

1. Log in to [Supabase](https://supabase.com) and click **"New project"**.
2. Give it a name, choose a **database password** (save it somewhere — you won't
   need it often), and pick the region closest to you (e.g. *Europe (Stockholm)* or
   *Frankfurt*).
3. Wait ~2 minutes for it to finish setting up.

---

### Step 3 — Create the database table

1. In your Supabase project, open **SQL Editor** (left sidebar) → **"New query"**.
2. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this project,
   copy **everything** in it, and paste it into the editor.
3. Click **"Run"**. You should see *"Success. No rows returned."*

That created the `cards` table, its security rules, and turned on live updates.

---

### Step 4 — Copy your Supabase keys

1. In Supabase, go to **Project Settings** (the gear icon) → **API**.
2. Copy these two values and keep them handy:
   - **Project URL** — looks like `https://abcd1234.supabase.co`
   - **anon public** key — a long string under *Project API keys*

> ⚠️ Only copy the key labelled **anon public**. Never use the `service_role`
> key in the website — it's a master key.

---

### Step 5 — Get a Gmail "App Password"

An App Password lets the app send e-mail through your Gmail without using your
real Gmail password. It's a Google feature, free, and takes a few minutes.

1. Pick **one** of your Gmail accounts to be the sender.
2. That account must have **2-Step Verification** turned on. Turn it on here if it
   isn't: https://myaccount.google.com/signinoptions/two-step-verification
3. Now create the App Password: go to
   **https://myaccount.google.com/apppasswords**
   *(if the page says it's unavailable, 2-Step Verification isn't on yet — do step 2 first).*
4. Type a name like `Pokemon-koordinator` and click **Create**.
5. Google shows a **16-character password** (four blocks of four, e.g.
   `abcd efgh ijkl mnop`). **Copy it now** — you won't see it again. The spaces
   don't matter; the app removes them automatically.

You'll paste this into Supabase in the next step. If you ever want to revoke the
app's access, just delete this App Password in your Google account — your real
password is never involved.

---

### Step 6 — Deploy the three Edge Functions

The Edge Functions run on Supabase and do the two jobs the browser can't:
scraping the Tradera image and sending e-mail. You deploy them with the
**Supabase CLI** (a small command-line tool). **You do not need Docker** for this.

**6a. Install the Supabase CLI.**
On Windows, the simplest way is with [Scoop](https://scoop.sh):

```bash
scoop install supabase
```

Or, on any system, use it through Node without installing anything global — just
prefix every `supabase` command below with `npx`, e.g. `npx supabase login`.

**6b. Log in and link to your project.** In a terminal, from this project's folder:

```bash
supabase login
```

That opens your browser to authorize. Then link this folder to your project
(the **project ref** is the `abcd1234` part of your Supabase URL):

```bash
supabase link --project-ref YOUR-PROJECT-REF
```

**6c. Set the secrets** the functions need. Replace the values with yours:
- `GMAIL_USER` — the Gmail address you chose in Step 5
- `GMAIL_APP_PASSWORD` — the 16-character App Password from Step 5
- `USER_EMAIL_1` / `USER_EMAIL_2` — the two Gmail addresses that should get notified
- `SITE_URL` — the website address from Step 1

```bash
supabase secrets set GMAIL_USER=sender@gmail.com "GMAIL_APP_PASSWORD=abcd efgh ijkl mnop" USER_NAME_1=Anna USER_EMAIL_1=anna@gmail.com USER_NAME_2=Erik USER_EMAIL_2=erik@gmail.com SITE_URL=https://YOUR-USERNAME.github.io/pokemon-approval/
```

> On PowerShell, keep the quotes exactly as shown around any value that contains
> spaces (`GMAIL_APP_PASSWORD` and `MAIL_FROM_NAME`).
>
> The names `USER_NAME_1/2` **must match** `VITE_USER_NAME_1/2` from Step 7 so the
> right person gets each e-mail.

**6d. Deploy the functions** (one command each):

```bash
supabase functions deploy scrape-image
```
```bash
supabase functions deploy send-review-email
```
```bash
supabase functions deploy send-decision-email
```

That's the backend done.

---

### Step 7 — Give the website its settings on GitHub

The website is built by GitHub automatically. It needs a few of the same values.
In your GitHub repo: **Settings** → **Secrets and variables** → **Actions**.

Add these as **Secrets** (tab "Secrets" → "New repository secret"):

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Project URL from Step 4 |
| `VITE_SUPABASE_ANON_KEY` | your anon public key from Step 4 |
| `VITE_SHARED_PASSWORD` | the password you and your friend will type |

Add these as **Variables** (tab "Variables" → "New repository variable"):

| Variable name | Value |
|---|---|
| `VITE_USER_NAME_1` | `Anna` (or whatever the first person is called) |
| `VITE_USER_NAME_2` | `Erik` (or the second person) |

> The names here must match `USER_NAME_1` / `USER_NAME_2` from Step 6c.
>
> You do **not** need to set `VITE_BASE_PATH` — it's set automatically to your
> repo name. Only add it (as a variable, value `/`) if you later use a custom
> domain.

---

### Step 8 — Turn on GitHub Pages and publish

1. In your GitHub repo: **Settings** → **Pages**.
2. Under **"Build and deployment" → "Source"**, choose **"GitHub Actions"**.
3. Trigger the build: either push any small change, or go to the **Actions** tab,
   open **"Bygg och distribuera till GitHub Pages"**, and click **"Run workflow"**.
4. Wait for the green checkmark (~1–2 minutes). Your site is now live at
   `https://YOUR-USERNAME.github.io/pokemon-approval/`.

🎉 **Open it, type your shared password, and you're in.**

> Whenever you change repo secrets/variables later, re-run the workflow (Actions
> tab → Run workflow) so the change takes effect.

---

## Using the app

- **Add a card:** click **"Lägg till kort"**, paste the Tradera link (the image
  loads by itself), fill in the prices and the auction end time, and save. The
  other person gets an e-mail.
- **If the image doesn't load:** click **"Klistra in bild-URL manuellt"** and
  paste an image address (right-click any image → *Copy image address*).
- **Approve / deny:** the buttons only show on cards **someone else** submitted.
  **Godkänn** asks for one confirmation. **Neka** asks for a reason.
- **Switch person:** the **"byt användare"** link, top right.

> 📬 The first notification may land in **Spam** (it's the first time that Gmail
> sends to the other person through the app). Mark it "Not spam" once and future
> ones arrive normally.

---

## Customizing

- **Change the two names:** update `VITE_USER_NAME_1/2` (GitHub Variables) **and**
  `USER_NAME_1/2` (Supabase secrets), keeping them matched. Re-run the workflow
  after changing the GitHub variables.
- **Change who receives e-mails:** update `USER_EMAIL_1/2` with
  `supabase secrets set …` again.
- **Change the password:** update the `VITE_SHARED_PASSWORD` secret and re-run the
  workflow.
- **Change the colors:** edit the palette in
  [`tailwind.config.js`](tailwind.config.js) (the `gold`, `ink`, etc. values).

---

## Running it on your own computer (optional)

Only needed if you want to tinker before publishing.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example env file and fill it in:
   ```bash
   cp .env.example .env
   ```
   (The Edge Functions still run in the cloud, so image-scraping and e-mail work
   against your real Supabase project.)
3. Start it:
   ```bash
   npm run dev
   ```
   Open the address it prints (usually `http://localhost:5173`).

---

## Troubleshooting

- **"Kunde inte hämta korten"** on the board → the `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` secrets are wrong or missing, or you didn't re-run the
  workflow after adding them. Double-check Step 4 and Step 7.
- **No e-mails arrive** →
  1. Check the **Spam** folder first.
  2. Make sure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly (the App
     Password, **not** your normal Gmail password), and that 2-Step Verification
     is on for that account.
  3. See the function logs: Supabase → **Edge Functions** → open the function →
     **Logs**. A `535` error there means the App Password is wrong.
- **The image won't scrape** → some Tradera pages block automated fetching. Use
  the manual image-URL paste. This never blocks saving the card.
- **Cards don't update live for the other person** → make sure you ran the full
  `schema.sql` (its last block enables Realtime). The app also refreshes every
  20 seconds and when you switch back to the tab, so it self-heals either way.
- **Changed a secret but nothing changed** → GitHub bakes its secrets in at build
  time. Re-run the workflow (Actions → Run workflow). Supabase secrets take effect
  immediately, no redeploy needed.

---

## How it's built (for the curious)

```
src/                      React app (components, hooks, lib)
supabase/schema.sql       The single `cards` table + security + realtime
supabase/functions/
  scrape-image/           Fetches the Tradera page, returns the image URL
  send-review-email/      "Nytt kort att granska" → the other person
  send-decision-email/    "Beslut fattat" → the submitter
  _shared/                Shared CORS, formatting, and the Gmail e-mail sender
.github/workflows/        Auto-build + deploy to GitHub Pages
```

**A note on security:** the shared password is baked into the public website, so
anyone determined could read it — it's a "keep randoms out" gate, not real
security, exactly as intended. The database is open to the anon key behind that
gate. Don't store anything sensitive here. Your Gmail App Password lives only in
Supabase (never in the website) and can be revoked from your Google account any
time.

**Auto-delete:** there's no separate cron job. Each time the app loads it deletes
any approved/denied card whose decision is more than 24 hours old.
