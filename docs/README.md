# Seashore Documentation

This directory contains the bilingual documentation for Seashore, built with [mdBook](https://rust-lang.github.io/mdBook/).

## 🚀 Quick Start

### Prerequisites

Install mdBook:

```bash
cargo install mdbook
```

Or download from [GitHub releases](https://github.com/rust-lang/mdBook/releases).

### Build Documentation

```bash
# Using mdBook directly
cd docs/en-us
mdbook build              # Build
mdbook serve              # Serve with live reload
```

## 📁 Directory Structure

```
docs/
├── README.md              # This file
├── en-us/                 # English documentation
│   ├── book.toml         # mdBook config for English
│   ├── SUMMARY.md        # Table of contents
│   ├── README.md         # Landing page
│   ├── introduction.md
│   ├── quick-start.md
│   ├── core/             # Core concepts
│   ├── advanced/         # Advanced features
│   ├── production/       # Production features
│   ├── examples/         # Examples
│   ├── api/              # API reference
│   └── contributing/     # Contributing guide
└── zh-cn/                # Chinese documentation (same structure)
    └── ...
```

**Build output:**
```
book/
├── en/                    # Built English docs
│   └── index.html
└── zh/                    # Built Chinese docs
    └── index.html
```

## 🚢 Deployment

### Automatic Deployment

Documentation is automatically built and deployed to GitHub Pages when changes are pushed to the `main` branch via [.github/workflows/deploy-docs.yml](../.github/workflows/deploy-docs.yml).

**Trigger conditions:**
- Push to `main` branch with changes in `docs/**`
- Manual trigger via `workflow_dispatch`

**Build process:**
1. Check out repository
2. Install mdBook
3. Build English documentation (`docs/en-us`)
4. Build Chinese documentation (`docs/zh-cn`)
5. Copy built files to `public/en/` and `public/zh/`
6. Generate language selection landing page (`public/index.html`)
7. Upload artifact to GitHub Pages
8. Deploy to GitHub Pages

**Deployed URL structure:**
- Landing page: `https://user.github.io/seashore/`
- English docs: `https://user.github.io/seashore/en/`
- Chinese docs: `https://user.github.io/seashore/zh/`

### Landing Page Features

The auto-generated landing page includes:
- ✨ Language selection buttons
- 🌐 Auto-redirect based on browser language (first visit only)
- 📱 Responsive design
- 🔗 Links to GitHub repository


## 📝 Contributing to Documentation

### Adding New Pages

1. Create the Markdown file in the appropriate location (e.g., `docs/en-us/core/new-feature.md`)
2. Add an entry to `SUMMARY.md` in the correct position
3. Maintain parallel structure across both languages (`docs/zh-cn/core/new-feature.md`)
4. Test the build locally before committing

### Linking Between Pages

Use relative links for cross-references:

```markdown
# Relative links (recommended)
[Quick Start](./quick-start.md)
[Core Concepts](./core/agents.md)

# Links to sections
[Configuration](./core/agents.md#configuration)
```

### Images and Assets

Place images in the same directory as the markdown file or in a shared `images/` directory:

```markdown
![Architecture](./images/architecture.png)
```

### Keeping Languages in Sync

When updating documentation:
1. Update English version first
2. Update Chinese version with equivalent content
3. Ensure `SUMMARY.md` structure matches in both languages
4. Verify links work in both versions
