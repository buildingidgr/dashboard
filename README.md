# MechLabs Application

This is a Next.js application with authentication, AI features, and various integrations.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mechlabs
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Update the `.env.local` file with your credentials:
- Set up Clerk authentication keys
- Configure API URLs
- Add OpenAI API key
- Add Google Maps API key
- Other required environment variables

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Railway Deployment

This project is configured for Railway deployment with the following features:

1. Automatic builds using Nixpacks
2. Health checks configured
3. Production environment variables

To deploy on Railway:

1. Create a new project on Railway
2. Connect your repository
3. Add the required environment variables in Railway's dashboard
4. Deploy the main branch

The `railway.toml` file already includes the necessary configuration for:
- Build command: `npm run build`
- Start command: `npm run start`
- Health check path: `/`
- Automatic restarts on failure

## Environment Variables

Make sure to set up the following environment variables:

```env
# App
NEXT_PUBLIC_APP_URL=

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# API URLs
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_API_URL=
AUTH_API_URL=
CONTACTS_API_URL=
NEXT_PUBLIC_DOCUMENTS_API_URL=
NEXT_PUBLIC_OPPORTUNITY_API_URL=

# Security
JWT_SECRET=

# Integrations
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=

# Environment
NODE_ENV=development # or production for Railway
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run linting

## Tech Stack

- Next.js 14
- TypeScript
- Clerk Authentication
- OpenAI Integration
- Google Maps Integration
- Tailwind CSS
- Various UI components (Radix UI, etc.)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!