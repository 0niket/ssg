#!/usr/bin/env node

/**
 * SSG - A simple Static Site Generator for Notion content
 * Copyright (c) 2025 Aniket Hendre
 * MIT License
 */

import fs from "fs";
import path from "path";
import axios from "axios";
import ejs from "ejs";
import marked from "marked";
import { program } from "commander";
import dotenv from "dotenv";
import { mkdirSync, copySync } from "fs-extra";

// Load environment variables
dotenv.config();

// Define types
interface Config {
  notionToken: string;
  databaseId: string;
  outputDir: string;
  templatesDir: string;
  staticDir: string;
}

interface PageMetadata {
  createdTime: string;
  lastEditedTime: string;
  url: string;
  [key: string]: any;
}

interface PageData {
  id: string;
  title: string;
  content: string;
  metadata: PageMetadata;
}

interface RichText {
  type: string;
  plain_text: string;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

interface Block {
  id: string;
  type: string;
  [key: string]: any;
}

class NotionSSG {
  private config: Config;

  constructor(configPath?: string) {
    // Default configuration
    this.config = {
      notionToken: process.env.NOTION_TOKEN || "",
      databaseId: process.env.NOTION_DATABASE_ID || "",
      outputDir: "dist",
      templatesDir: "templates",
      staticDir: "static",
    };

    // Load configuration from file if provided
    if (configPath && fs.existsSync(configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        this.config = { ...this.config, ...userConfig };
      } catch (error) {
        console.error(`Error reading config file: ${error.message}`);
      }
    }

    // Create necessary directories
    mkdirSync(this.config.outputDir, { recursive: true });
    mkdirSync(this.config.templatesDir, { recursive: true });
    mkdirSync(this.config.staticDir, { recursive: true });

    // Create default templates if they don't exist
    this.createDefaultTemplates();
  }

  /**
   * Fetch data from Notion using the API
   */
  async fetchNotionData(): Promise<PageData[]> {
    if (!this.config.notionToken || !this.config.databaseId) {
      throw new Error("Notion API token and database ID are required");
    }

    const headers = {
      Authorization: `Bearer ${this.config.notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    try {
      // Query the database to get all pages
      const databaseUrl = `https://api.notion.com/v1/databases/${this.config.databaseId}/query`;
      const databaseResponse = await axios.post(databaseUrl, {}, { headers });
      const pages = databaseResponse.data.results;

      // Fetch content for each page
      const contentData: PageData[] = [];
      for (const page of pages) {
        const pageId = page.id;
        const pageUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
        const blocksResponse = await axios.get(pageUrl, { headers });

        if (blocksResponse.status === 200) {
          const title = this.extractTitle(page);
          const content = this.processBlocks(blocksResponse.data.results);
          const metadata = this.extractMetadata(page);

          contentData.push({
            id: pageId,
            title,
            content,
            metadata,
          });
        }
      }

      return contentData;
    } catch (error) {
      throw new Error(`Failed to fetch data from Notion: ${error.message}`);
    }
  }

  /**
   * Extract the title from a Notion page
   */
  private extractTitle(page: any): string {
    // Title is typically in the Name property
    const properties = page.properties || {};
    const titleProp = properties.Name || properties.Title;

    if (titleProp && titleProp.title) {
      const titleParts = titleProp.title.map(
        (part: any) => part.plain_text || ""
      );
      return titleParts.join("");
    }

    return "Untitled";
  }

  /**
   * Extract metadata like dates, tags, etc. from Notion page
   */
  private extractMetadata(page: any): PageMetadata {
    const properties = page.properties || {};
    const metadata: PageMetadata = {
      createdTime: page.created_time || "",
      lastEditedTime: page.last_edited_time || "",
      url: page.url || "",
    };

    // Extract other properties if available
    for (const [key, prop] of Object.entries(properties)) {
      const propType = (prop as any).type;

      if (propType === "select" && (prop as any).select) {
        metadata[key.toLowerCase()] = (prop as any).select.name || "";
      } else if (propType === "multi_select" && (prop as any).multi_select) {
        metadata[key.toLowerCase()] = (prop as any).multi_select.map(
          (item: any) => item.name || ""
        );
      } else if (propType === "date" && (prop as any).date) {
        metadata[key.toLowerCase()] = (prop as any).date.start || "";
      }
    }

    return metadata;
  }

  /**
   * Process Notion blocks into Markdown content
   */
  private processBlocks(blocks: Block[]): string {
    const content: string[] = [];

    for (const block of blocks) {
      const blockType = block.type;
      const blockData = block[blockType] || {};

      // Process different block types
      switch (blockType) {
        case "paragraph":
          const paragraphText = this.extractRichText(blockData.rich_text || []);
          content.push(`${paragraphText}\n\n`);
          break;

        case "heading_1":
          const h1Text = this.extractRichText(blockData.rich_text || []);
          content.push(`# ${h1Text}\n\n`);
          break;

        case "heading_2":
          const h2Text = this.extractRichText(blockData.rich_text || []);
          content.push(`## ${h2Text}\n\n`);
          break;

        case "heading_3":
          const h3Text = this.extractRichText(blockData.rich_text || []);
          content.push(`### ${h3Text}\n\n`);
          break;

        case "bulleted_list_item":
          const bulletText = this.extractRichText(blockData.rich_text || []);
          content.push(`* ${bulletText}\n`);
          break;

        case "numbered_list_item":
          const numberedText = this.extractRichText(blockData.rich_text || []);
          content.push(`1. ${numberedText}\n`);
          break;

        case "to_do":
          const todoText = this.extractRichText(blockData.rich_text || []);
          const checked = blockData.checked ? "x" : " ";
          content.push(`- [${checked}] ${todoText}\n`);
          break;

        case "code":
          const codeText = this.extractRichText(blockData.rich_text || []);
          const language = blockData.language || "";
          content.push(`\`\`\`${language}\n${codeText}\n\`\`\`\n\n`);
          break;

        case "image":
          const caption = this.extractRichText(blockData.caption || []);
          const url = blockData.file?.url || blockData.external?.url || "";
          if (url) {
            content.push(`![${caption}](${url})\n\n`);
          }
          break;

        case "quote":
          const quoteText = this.extractRichText(blockData.rich_text || []);
          content.push(`> ${quoteText}\n\n`);
          break;

        case "divider":
          content.push(`---\n\n`);
          break;

        case "callout":
          const calloutText = this.extractRichText(blockData.rich_text || []);
          const emoji = blockData.icon?.emoji || "";
          content.push(`> ${emoji} ${calloutText}\n\n`);
          break;

        // Add more block types as needed
      }
    }

    return content.join("");
  }

  /**
   * Extract text content from Notion's rich text objects
   */
  private extractRichText(richText: RichText[]): string {
    const parts: string[] = [];

    for (const text of richText) {
      let content = text.plain_text || "";
      const annotations = text.annotations || {};

      // Apply styling based on annotations
      if (annotations.bold) {
        content = `**${content}**`;
      }
      if (annotations.italic) {
        content = `*${content}*`;
      }
      if (annotations.strikethrough) {
        content = `~~${content}~~`;
      }
      if (annotations.code) {
        content = `\`${content}\``;
      }

      parts.push(content);
    }

    return parts.join("");
  }

  /**
   * Generate static site files from the data
   */
  async generateSite(data?: PageData[]): Promise<void> {
    // Fetch data if not provided
    if (!data) {
      data = await this.fetchNotionData();
    }

    // Read templates
    const indexTemplatePath = path.join(this.config.templatesDir, "index.ejs");
    const pageTemplatePath = path.join(this.config.templatesDir, "page.ejs");

    const indexTemplate = fs.readFileSync(indexTemplatePath, "utf-8");
    const pageTemplate = fs.readFileSync(pageTemplatePath, "utf-8");

    // Generate index page
    const indexContent = ejs.render(indexTemplate, {
      pages: data,
      title: "My Notion Site",
      generator: "SSG",
      now: new Date(),
    });

    fs.writeFileSync(
      path.join(this.config.outputDir, "index.html"),
      indexContent
    );

    // Generate individual pages
    for (const page of data) {
      const pageFilename = `${this.slugify(page.title)}.html`;
      const pageContent = ejs.render(pageTemplate, {
        title: page.title,
        content: marked(page.content),
        metadata: page.metadata,
        generator: "SSG",
        now: new Date(),
      });

      fs.writeFileSync(
        path.join(this.config.outputDir, pageFilename),
        pageContent
      );
    }

    // Copy static files
    if (fs.existsSync(this.config.staticDir)) {
      const staticDest = path.join(this.config.outputDir, "static");
      mkdirSync(staticDest, { recursive: true });

      try {
        copySync(this.config.staticDir, staticDest);
      } catch (error) {
        console.error(`Error copying static files: ${error.message}`);
      }
    }

    console.log(`Site generated successfully in ${this.config.outputDir}`);
  }

  /**
   * Create default templates if they don't exist
   */
  private createDefaultTemplates(): void {
    const indexTemplatePath = path.join(this.config.templatesDir, "index.ejs");
    if (!fs.existsSync(indexTemplatePath)) {
      fs.writeFileSync(
        indexTemplatePath,
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
</head>
<body>
    <header>
        <h1><%= title %></h1>
    </header>
    <main>
        <ul>
            <% pages.forEach(function(page) { %>
            <li>
                <a href="<%= slugify(page.title) %>.html"><%= page.title %></a>
                <% if (page.metadata.description) { %>
                <p><%= page.metadata.description %></p>
                <% } %>
            </li>
            <% }); %>
        </ul>
    </main>
    <footer>
        <p>Generated by <%= generator %> on <%= now.toISOString().split('T')[0] %></p>
    </footer>
</body>
</html>`
      );
    }

    const pageTemplatePath = path.join(this.config.templatesDir, "page.ejs");
    if (!fs.existsSync(pageTemplatePath)) {
      fs.writeFileSync(
        pageTemplatePath,
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
</head>
<body>
    <header>
        <a href="index.html">Home</a>
        <h1><%= title %></h1>
        <% if (metadata.tags) { %>
        <div class="tags">
            <% metadata.tags.forEach(function(tag) { %>
            <span class="tag"><%= tag %></span>
            <% }); %>
        </div>
        <% } %>
    </header>
    <main>
        <article>
            <%- content %>
        </article>
    </main>
    <footer>
        <p>Last updated: <%= metadata.lastEditedTime %></p>
        <p>Generated by <%= generator %></p>
    </footer>
</body>
</html>`
      );
    }
  }

  /**
   * Convert text to URL-friendly slug
   */
  private slugify(text: string): string {
    const slug = text.toLowerCase().trim();
    // Replace spaces with hyphens and remove non-alphanumeric characters
    return slug
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// CLI implementation
program.version("1.0.0").description("SSG - Static Site Generator for Notion");

program
  .option("-c, --config <path>", "Path to config file")
  .option("-o, --output <directory>", "Output directory")
  .option("--init", "Initialize configuration file");

program.parse(process.argv);

const options = program.opts();

async function main() {
  if (options.init) {
    const config = {
      notionToken: "",
      databaseId: "",
      outputDir: "dist",
      templatesDir: "templates",
      staticDir: "static",
    };

    fs.writeFileSync("ssg_config.json", JSON.stringify(config, null, 2));

    console.log("Configuration file created: ssg_config.json");
    console.log(
      "Please edit the file to add your Notion API token and database ID"
    );
    return;
  }

  const configPath = options.config || "ssg_config.json";

  try {
    const generator = new NotionSSG(configPath);

    if (options.output) {
      generator.config.outputDir = options.output;
    }

    await generator.generateSite();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the program
main();

export default NotionSSG;
