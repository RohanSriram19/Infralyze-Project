# Infralyze

**Infralyze** is a full-stack infrastructure visualization tool that allows developers to upload Infrastructure-as-Code (IaC) files (YAML or JSON) and instantly generate a live, browser-based architecture diagram. The project is built using Next.js, TypeScript, Tailwind CSS, and Mermaid.js.

---

## Live Site

[https://infralyzeapp.com](https://infralyzeapp.com)

---

## Features

- 🚀 **Universal File Support**: Upload `.yaml`, `.yml`, `.json`, `.toml`, `.xml`, `.config`, and more
- 🔍 **Smart Content Detection**: Automatic format detection regardless of file extension
- 🛡️ **Robust Parsing**: Fallback parsing between JSON and YAML with graceful error handling
- 📊 **Flexible Visualization**: Supports Docker Compose, Kubernetes, Terraform, and custom configurations
- 🎯 **Type-Safe**: Fully typed backend and frontend with TypeScript strict mode
- 🎨 **Modern UI**: Responsive, accessible interface built with Tailwind CSS
- ⚡ **Real-time Diagrams**: Generate live infrastructure diagrams using Mermaid.js
- 🔒 **Secure Processing**: Server-side parsing with comprehensive validation

---

## Supported Formats

- **Docker Compose** - Multi-container applications
- **Kubernetes** - Container orchestration manifests  
- **Terraform** - Infrastructure as code configurations
- **Microservices** - Custom service architectures
- **Generic JSON/YAML** - Any structured configuration data

---

## Tech Stack

Frontend: Next.js, React + TypeScript, Tailwind CSS
Backend: API Routes, YAML/JSON Parsing, Mermaid.js
Dev Tools: ESLint + Prettier, Vercel, Git + Github

---

## Getting Started

Clone the repository and run the development server locally:

```bash
git clone https://github.com/RohanSriram19/Infralyze-Project.git
cd infralyze-clean
npm install
npm run dev

src/
  ├── app/                 # App Router structure (Next.js 13+)
  │   └── api/parse/       # API endpoint for file parsing
  ├── components/          # FileUpload, InfraDiagram
  ├── types/infra.ts       # Shared infrastructure type definitions
  └── styles/              # Tailwind and global CSS

services:
  - name: Frontend
    runtime: node
    startCommand: npm run start

databases:
  - type: postgres
    name: Main DB
    port: 5432

environment:
  NODE_ENV: production

## Future Enhancements:
Download diagrams as PNG or SVG

Support .tf.json (Terraform JSON)

Visual security checks and misconfiguration warnings

Public link sharing and snapshotting

Multi-file .zip upload support

Author
Rohan Sriram
github.com/RohanSriram19
