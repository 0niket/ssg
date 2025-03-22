# SSG - Static Site Generator for Notion

A command-line tool to generate static websites from Notion databases. This tool fetches content from your Notion database and transforms it into a fully static HTML website.

## Features

- Convert Notion pages to static HTML
- Support for most Notion block types (paragraphs, headings, lists, code blocks, images, etc.)
- Custom templating using EJS
- Markdown rendering
- Automatic slugification of page titles for clean URLs
- Static file management

## Requirements

- Node.js 16.x or higher
- Notion API token (obtained from [Notion Developers](https://developers.notion.com/))
- A Notion database with content

## Installation

### Global Installation

```bash
npm install -g ssg
```

### Local Installation

```bash
npm install ssg
```

## Setup

Here's a comprehensive checklist to set up the Notion APIs correctly for this Static Site Generator:

### Create a Notion Integration

[] Go to https://www.notion.so/my-integrations
[] Click "New integration"
[] Name your integration (e.g., "SSG Generator")
[] Select the workspace where you'll use the integration
[] Set appropriate capabilities (Read content is required)
[] Submit to create the integration
[] Copy the "Internal Integration Token" (this is your NOTION_TOKEN)

### Prepare Your Notion Database

[] Create a new database in Notion (or use an existing one)
[] Ensure the database has at least a "Name" or "Title" property
[] Consider adding other properties that the SSG can use (tags, published date, etc.)

### Share Database with Integration

[] Go to the database page in Notion
[] Click "..." in the top-right corner
[] Select "Add connections"
[] Find and select your integration from the list
[] Confirm to grant access

### Get the Database ID

[] Open your database in a browser
[] Look at the URL: https://www.notion.so/workspace/[database-id]?v=...
[] Extract the database ID (it's a 32-character string in the URL)
[] Copy this ID (this is your NOTION_DATABASE_ID)

### Configure the SSG Tool

[] Create a .env file in your project root directory
[] Add the following lines:

```
NOTION_TOKEN=your_integration_token
NOTION_DATABASE_ID=your_database_id
```

Alternatively, run ssg --init and edit the generated ssg_config.json file

## Basic Usage

### Initialize Configuration

Create a configuration file:

```bash
ssg --init
```

This will create a `ssg_config.json` file that you need to edit with your Notion API token and database ID.

### Generate Your Site

```bash
ssg --config ssg_config.json
```

The generated site will be available in the `dist` directory by default, or in a custom directory if specified:

```bash
ssg --config ssg_config.json --output ./my-site
```

## Environment Variables

As an alternative to using the config file, you can set environment variables:

- `NOTION_TOKEN`: Your Notion API token
- `NOTION_DATABASE_ID`: The ID of your Notion database

## Project Structure

```
ssg/
├── dist/              # Output directory for generated static site
├── src/               # Source code
│   └── index.ts       # Main application code
├── templates/         # EJS templates for site generation
│   ├── index.ejs      # Template for the index page
│   └── page.ejs       # Template for individual content pages
├── static/            # Static assets (CSS, images, etc.)
├── node_modules/      # Dependencies
├── package.json       # Project metadata and dependencies
├── tsconfig.json      # TypeScript configuration
└── ssg_config.json    # Configuration file
```

## Development

### Setting Up the Development Environment

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Available Scripts

- `npm run build` - Compiles TypeScript to JavaScript
- `npm run start` - Runs the compiled JavaScript
- `npm run dev` - Runs the TypeScript source directly using ts-node
- `npm run lint` - Lints the code using ESLint
- `npm run test` - Runs tests using Jest

### Testing

Tests are written using Jest. Run the tests with:

```bash
npm test
```

## License

MIT
