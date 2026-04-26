# A guide for trustees: editing the website

This guide is for trustees and staff who want to add or update content on
the Mountain Heritage Trust website. **You don't need any technical
knowledge to use it.**

If anything is unclear or doesn't work, please contact the technical lead
(see `AGENTS.md` for current arrangements).

## What you can edit

You can edit:

- **Blog posts** (the news & blog section).
- **Team and trustees** profiles.
- **Archive collections** (entries listed under /collections).
- **Exhibitions**.
- **About pages**.

A handful of pages — the contact page, donate page, privacy notice and
terms — are technical pages that need a developer to change. Everything
else is yours to edit.

## Logging in

1. Go to **<https://www.mountain-heritage.org/admin>**.
2. You will be asked to sign in with your `@mountain-heritage.org` Google
   account. This is the same account you use for Trust email.
3. On your first time editing, you may also be asked to sign in to
   **GitHub** (the system that stores the website's content). You will need
   a GitHub account with edit access to the website's repository — ask the
   technical lead to set this up for you if you don't have one yet.

You will not need to do these sign-ins every time — the website remembers
you for several hours.

## Making your first edit

The CMS layout is split into two columns:

- **Left**: a list of content collections (Blog posts, Team, Exhibitions,
  Archive collections, About pages).
- **Right**: the editor for the entry you have open.

To edit an existing page:

1. Click the collection name on the left (e.g. **Blog posts**).
2. Click the entry you want to edit.
3. Make your changes in the form on the right.
4. Click **Save**.

Within about a minute, your change will be live on the website.

## Creating a new blog post

1. Click **Blog posts** in the left sidebar.
2. Click **+ New blog post** at the top.
3. Fill in:
   - **Title** — the headline of the post.
   - **Date** — the publish date (today's date is fine for new posts).
   - **Summary** — a one-sentence standfirst. This shows on the news
     listing page and in search results. Aim for one short sentence.
   - **Cover image** — optional. Click to upload.
   - **Author** — optional.
   - **Tags** — optional.
   - **Draft** — leave unchecked when you're ready to publish. Tick it
     while you're still working on the post and don't want it visible.
   - **Body** — the post content. Use the formatting toolbar for headings,
     bold, italic, lists, links and images.
4. Click **Save**.

The post will appear at `https://www.mountain-heritage.org/blog/<title>`
(the URL is generated from the title automatically).

## Adding images

In the body editor, click the image icon in the toolbar. You can either:

- **Upload from your computer** — drag-and-drop or click to choose a file.
- **Pick an existing image** — uploads from previous posts are available
  for re-use.

For best results, use images that are:

- At least 1200 pixels wide.
- Saved as JPEG (for photographs) or PNG (for graphics).
- Smaller than 5 MB.

Always add **alt text** describing the image, for visitors using screen
readers and to improve SEO.

## Adding a team member

1. Click **Team & trustees** in the left sidebar.
2. Click **+ New team member**.
3. Fill in:
   - **Name** — the person's name.
   - **Role** — e.g. Trustee, Patron, Archivist.
   - **Category** — pick the closest match.
   - **Order** — leave blank unless you want to control where they appear
     on listing pages. Lower numbers appear first.
   - **Photo** — optional but encouraged.
   - **Bio** — a short biography in the body editor.
4. Save.

## Editing exhibitions

Exhibitions have additional fields:

- **Start date** and **End date** — when the exhibition runs.
- **Venue** — where it's being held (e.g. "Keswick Museum").
- **Status** — whether it's upcoming, currently on, or past.

Update **Status** when an exhibition changes from upcoming to current to
past so it appears in the right section of the listing page.

## Saving and publishing

Sveltia saves directly to the live website. There is no separate "publish"
step — clicking **Save** is publishing.

If you want to work on something without it being public yet:

- For **blog posts**, tick the **Draft** checkbox. Drafts don't appear on
  the public site but are saved.
- For other content types, save your work and tell readers it's a
  work-in-progress in the body, or coordinate with the technical lead about
  hiding it.

## Undoing a change

Every change is saved as a separate version. To roll back:

1. Ask the technical lead — they can revert via the GitHub repository.

In future we may add a "history" view directly in Sveltia.

## Things to watch out for

- **Don't edit the URL slug** of an existing page unless you know what
  you're doing. Search engines and other websites have links pointing at
  the old URL.
- **Don't delete pages without checking** if anything links to them
  (especially blog posts that may have been shared on social media). When
  in doubt, mark a blog post as a Draft instead of deleting it.
- **Images use storage** — please don't upload very large files (over 10 MB).

## Getting help

- For content questions (what to write, what counts as the trust's voice):
  the editorial group.
- For "the website is broken" or "I can't log in": the technical lead.
- For feature requests: open an issue on GitHub or email the technical
  lead.
