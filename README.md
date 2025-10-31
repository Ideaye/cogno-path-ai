# Yukti AI - Personalized Test Prep Platform

> **Brand**: Formerly "Abhyas AI" - now rebranded as "Yukti AI"

Yukti AI is a next-generation test preparation platform powered by Cognitive DNA (CDNA) profiling, delivering personalized adaptive practice experiences for competitive exams.

## Project info

**URL**: https://lovable.dev/projects/92b06e4f-80b7-49b1-ac6d-7d97f32ae2d7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/92b06e4f-80b7-49b1-ac6d-7d97f32ae2d7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Lovable Cloud (Supabase backend)
- Edge Functions (Deno)

## Key Features

- **Adaptive Practice**: Uses LinUCB bandit algorithm via `adaptive-select-next` edge function
- **Calibration Lab**: Multi-block training with 13 strategy tags and detailed metadata
- **Real-time Analytics**: Dashboard with parallel data fetching and React Query caching
- **Admin Panel**: User management, exam enrollment, content ops (requires `is_admin` role)
- **Reports**: Weekly cognitive profile PDFs with email delivery

## Environment Variables

Set `VITE_APP_BRAND` to customize branding (default: "Yukti AI")

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/92b06e4f-80b7-49b1-ac6d-7d97f32ae2d7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
