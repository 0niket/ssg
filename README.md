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

1. Create a Notion integration in the [Notion Developers](https://developers.notion.com/) portal
2. Copy your integration token
3. Share your Notion database with the integration
4. Note your database ID (from the URL of your database)

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
