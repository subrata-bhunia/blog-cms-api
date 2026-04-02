# Blog CMS API

Express 5 API server providing public endpoints for the multi-tenant blog management system.

## Tech Stack

- **Express** 5 - Web framework
- **Node Appwrite SDK** - Backend integration with Appwrite
- **Zod** - Request validation
- **Pino** - Logging
- **esbuild** - Bundler
- **Orval** - Code generation from OpenAPI spec

## Features

- **Public API** for fetching published blog posts
- **Health check** endpoint for monitoring
- **Zod validation** for request parameters
- **Structured logging** with Pino
- **TypeScript** with strict type checking

## API Endpoints

### `GET /api/healthz`

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

### `GET /api/posts`

Fetch public published blog posts for a specific client.

**Query Parameters:**

- `clientId` (string, required) - User ID to fetch posts for
- `limit` (number, optional) - Number of posts to return (default: 20)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**

```json
{
  "posts": [
    {
      "id": "...",
      "title": "Post title",
      "content": "Post content...",
      "clientId": "...",
      "status": "published",
      "metaTitle": "SEO title",
      "metaDescription": "SEO description",
      "imageUrl": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "clientId": "..."
}
```

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Generate validation schemas**:

   ```bash
   npm run codegen
   ```

   This generates Zod schemas from the OpenAPI specification in `api-spec/openapi.yaml`.

3. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in your Appwrite credentials:

   ```bash
   cp .env.example .env
   ```

4. **Build the server**:

   ```bash
   npm run build
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

## Scripts

- `npm run dev` - Build and start development server
- `npm run build` - Build with esbuild
- `npm start` - Run built server
- `npm run typecheck` - Type check without building
- `npm run codegen` - Generate Zod schemas from OpenAPI spec

## Code Generation

This project uses **Orval** to generate TypeScript types and Zod validation schemas from the OpenAPI specification.

**Source of truth**: `api-spec/openapi.yaml`

**Generated output**: `src/validation/generated/api.ts`

To regenerate after changing the OpenAPI spec:

```bash
npm run codegen
```

The generated validation schemas are used in route handlers to validate incoming requests.

## Environment Variables

See `.env.example` for required environment variables. You need:

1. **Appwrite project** with API key
2. **Database** with posts collection
3. **Posts collection** with the proper schema (see frontend README for schema details)

## Project Structure

```
├── api-spec/
│   ├── openapi.yaml         # OpenAPI specification (source of truth)
│   ├── orval.config.ts      # Orval configuration
│   └── package.json         # API spec dependencies
├── src/
│   ├── index.ts             # Entry point
│   ├── app.ts               # Express app setup
│   ├── lib/
│   │   ├── appwrite.ts      # Appwrite client setup
│   │   └── logger.ts        # Pino logger configuration
│   ├── routes/
│   │   ├── index.ts         # Routes aggregation
│   │   ├── health.ts        # Health check endpoint
│   │   └── posts.ts         # Posts API endpoint
│   └── validation/
│       └── generated/       # Generated Zod schemas (gitignored)
├── build.mjs                # esbuild configuration
├── tsconfig.json            # TypeScript configuration
└── package.json

```

## Building for Production

```bash
npm run build
```

The built file will be at `dist/index.mjs`, ready to be deployed.

To run in production:

```bash
NODE_ENV=production npm start
```

## License

MIT
