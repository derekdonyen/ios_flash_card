# Public URL Setup

App Store Connect requires public URLs for:

- Privacy Policy URL
- Support URL

This project already includes ready-to-publish pages:

- `public/privacy.html`
- `public/support.html`

## Option A: GitHub Pages

1. Create a GitHub repository.
2. Upload the `public` folder contents.
3. In GitHub repository settings, enable Pages.
4. Use the generated URLs:

```txt
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO/privacy.html
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO/support.html
```

## Option B: Netlify

1. Go to Netlify.
2. Create a new site by drag-and-dropping the `public` folder.
3. Use the generated URLs:

```txt
https://YOUR_SITE.netlify.app/privacy.html
https://YOUR_SITE.netlify.app/support.html
```

## Option C: Notion

1. Create two public Notion pages.
2. Copy the content from `PRIVACY_POLICY.md` into one page.
3. Copy support information into another page.
4. Turn on public sharing.
5. Paste the public Notion URLs into App Store Connect.

## App Store Connect Fields

- Privacy Policy URL: URL ending in `/privacy.html`
- Support URL: URL ending in `/support.html`
