# Rothirsch Tech Website Generator

A static site generator for the [Rothirsch Tech](https://www.rothirsch.tech) website. This tool converts markdown files into a structured website with support for multiple languages, blog posts, articles, and documents.

## Features

- Converts Markdown to HTML using templates
- Multi-language support (en/de)
- Generates a sitemap.xml automatically
- Creates a JSON index for blog posts
- Minifies CSS and JavaScript files
- Menu generation based on content structure
- Support for articles, blog posts, documents, and other content types

## Project Structure

```
.
├── content/
│   ├── articles/       # Articles in markdown format
│   ├── documents/      # Documentation files in markdown
│   ├── files/          # Other files
│   ├── posts/          # Blog posts in markdown
│   ├── templates/      # HTML templates
│   ├── main.css        # Main CSS file
│   └── main.js         # Main JavaScript file
├── de/                 # Generated German content
├── en/                 # Generated English content
├── build.py            # Main build script
├── create-write-up.py  # Helper script to create new content
├── blog-index.json     # Generated blog index
└── sitemap.xml         # Generated sitemap
```

## Requirements

Create a virtual environment and install the required packages:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required packages
pip install markdown requests
```

## Usage

### Building the Website

To build the entire website from markdown content:

```bash
python build.py
```

This will:
1. Clean HTML templates
2. Delete old generated files
3. Create menu indexes
4. Generate HTML files from markdown
5. Create sitemap.xml
6. Create blog-index.json
7. Minify CSS and JavaScript files

### Creating New Content

To create a new article or blog post:

```bash
python create-write-up.py
```

Follow the interactive prompts to specify:
- Content type (article/post)
- Title
- Menu name
- Summary
- Language
- Keywords
- Author information
- Image path
- And more...

The script will create a new markdown file with the correct metadata and open it in vim for editing.

## Markdown Format

Your markdown files need specific metadata for the generator to work correctly:

```markdown
---
Title: Your Title
MenuName: Menu Label
Index: 0
Summary: A brief summary
Language: en
Keywords: keyword1, keyword2
Authors: Your Name
TwitterA: your_twitter
TimeStamp: 2023-01-01_12:00:00
Image: content/images/your-image.png
Alt: Image description
BaseUrl: en/blog/your-title.html
Template: articles.html
State: ready
---

# Your Content Here
```

## Classes

The project contains several key classes:

- **Content**: Handles creation of HTML from markdown, template replacement
- **Pages**: Manages article and document indexes
- **Files**: Provides utilities for file operations, including minification
- **Site**: Contains site configuration
- **Templates**: Cleans up templates for use

## License

[Include license information here]

## Author

René Zingerle, SSCP - Rothirsch Tech GmbH