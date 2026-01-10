# DoneJar

A visual task management application with a playful, paper-inspired design.

## About

DoneJar is a unique kanban-style task manager that lets you organize your work across three columns: TODO, DOING, and the JAR (history). With its charming handwritten aesthetic and paper-like task cards, managing your tasks feels like organizing sticky notes on a corkboard.

## Features

- **Multiple Project Support** - Create and manage multiple projects with custom icons and names
- **Three-Column Layout** - Organize tasks across TODO, DOING, and completed items in the JAR
- **Visual Task Cards** - Beautiful sticky notes and crumpled paper designs with customizable colors
- **Drag & Drop** - Intuitive svelte-dnd-action integration for moving tasks between columns
- **Task Persistence** - All task history is preserved in the JAR with completion dates
- **Handwritten Aesthetic** - Patrick Hand font for a personal, friendly feel
- **Responsive Design** - Built with TailwindCSS for modern, mobile-friendly layouts

## Tech Stack

- **SvelteKit 2.49** - Full-stack framework
- **TypeScript 5.9** - Type safety
- **TailwindCSS 4.1** - Utility-first styling with typography plugin
- **svelte-dnd-action** - Drag and drop functionality
- **Sentry** - Error tracking and monitoring
- **Vite 7.2** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd DoneJar

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# Or start with auto-open in browser
npm run dev -- --open
```

Visit `http://localhost:5173` to see the application.

### Building for Production

```bash
# Create a production build
npm run build

# Preview the production build
npm run preview
```

## Scripts Reference

| Script                | Description                               |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Start development server                  |
| `npm run build`       | Create production build                   |
| `npm run preview`     | Preview production build                  |
| `npm run check`       | Run TypeScript and Svelte checks          |
| `npm run check:watch` | Run checks in watch mode                  |
| `npm run format`      | Format code with Prettier                 |
| `npm run lint`        | Check code style with ESLint and Prettier |

## Data Schema

DoneJar stores application state as a single JSON object supporting multiple projects and persistent task states. For complete schema details, see [docs/SCHEMA.md](docs/SCHEMA.md).

```json
{
  "activeProjectId": "string",
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "icon": "string",
      "columns": {
        "todo": [...],
        "doing": [...],
        "jar": [...]
      }
    }
  ]
}
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

a.azzouni
