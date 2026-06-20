"""
Deterministic fallback generator. Used when the AI call fails or no API key
is configured — guarantees the user always gets *something* relevant rather
than a generic empty scaffold.
"""
import re
from typing import Any


def build_fallback(name: str, intent: str, stack: list[str]) -> dict[str, Any]:
    from app.services.ai_generation import is_website_intent

    if is_website_intent(intent, stack):
        return _build_website_fallback(name, intent)
    return _build_api_fallback(name, intent, stack)


def _build_api_fallback(name: str, intent: str, stack: list[str]) -> dict[str, Any]:
    stk = stack or ["FastAPI", "PostgreSQL", "Docker"]
    db_name = re.sub(r"[^a-z0-9_]", "_", name.lower())

    return {
        "description": f"{name} — a {stk[0]} backend scaffold for: {intent[:100]}",
        "architecture": [
            {"layer": "API Layer", "tech": "FastAPI", "desc": "Async REST API with JWT auth"},
            {"layer": "Data Layer", "tech": "PostgreSQL + SQLAlchemy", "desc": "Relational schema with migrations"},
            {"layer": "Infrastructure", "tech": "Docker Compose", "desc": "Containerised for local + production"},
        ],
        "files": {
            "README.md": f"# {name}\n\n{intent}\n\n## Quick Start\n\n```bash\ndocker compose up --build\n```\n",
            "main.py": (
                "from fastapi import FastAPI\n\n"
                f'app = FastAPI(title="{name}")\n\n'
                '@app.get("/health")\n'
                "def health():\n"
                '    return {"status": "ok"}\n'
            ),
            "requirements.txt": "fastapi==0.110.0\nuvicorn[standard]==0.27.1\nsqlalchemy==2.0.27\npsycopg2-binary==2.9.9\n",
            "Dockerfile": (
                "FROM python:3.11-slim\nWORKDIR /app\n"
                "COPY requirements.txt .\nRUN pip install -r requirements.txt\n"
                "COPY . .\nCMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n"
            ),
            "docker-compose.yml": (
                f'services:\n  api:\n    build: .\n    ports: ["8000:8000"]\n'
                f"  db:\n    image: postgres:16-alpine\n"
                f"    environment:\n      POSTGRES_DB: {db_name}\n"
            ),
            ".gitignore": "__pycache__/\n*.pyc\n.env\nvenv/\n",
        },
    }


def _build_website_fallback(name: str, intent: str) -> dict[str, Any]:
    company_match = re.search(r"\[([^\]]+)\]", intent)
    company = company_match.group(1) if company_match else "Your Business"

    intent_l = intent.lower()
    if re.search(r"construct|contractor|remodel", intent_l):
        pages, icon = ["services", "gallery", "about", "contact"], "construction"
    elif re.search(r"health|patient|medical|clinic", intent_l):
        pages, icon = ["providers", "services", "book-appointment", "contact"], "healthcare"
    elif re.search(r"restaurant|menu|catering", intent_l):
        pages, icon = ["menu", "reservations", "catering", "contact"], "restaurant"
    elif re.search(r"shop|store|product|cart", intent_l):
        pages, icon = ["shop", "cart", "checkout", "about"], "ecommerce"
    else:
        pages, icon = ["about", "services", "contact"], "business"

    nav_links = ",\n  ".join(
        f"{{ href: '/{p}', label: '{p.replace('-', ' ').title()}' }}" for p in pages
    )

    files = {
        "README.md": (
            f"# {company}\n\n## Pages\n- Home\n"
            + "\n".join(f"- {p.replace('-', ' ').title()}" for p in pages)
            + "\n\n## Quick Start\n\n```bash\nnpm install\nnpm run dev\n```\n"
        ),
        "package.json": (
            '{\n  "name": "%s",\n  "private": true,\n'
            '  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },\n'
            '  "dependencies": { "next": "14.2.0", "react": "18.3.0", "react-dom": "18.3.0" }\n}\n'
        ) % re.sub(r"[^a-z0-9-]", "-", name.lower()),
        "app/layout.tsx": (
            "import './globals.css';\n\n"
            "export default function RootLayout({ children }: { children: React.ReactNode }) {\n"
            "  return (\n    <html lang=\"en\">\n      <body>{children}</body>\n    </html>\n  );\n}\n"
        ),
        "app/globals.css": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
        "app/page.tsx": (
            "export default function Home() {\n  return (\n"
            f'    <main className="px-6 py-24 text-center">\n      <h1 className="text-4xl font-bold">{company}</h1>\n'
            "    </main>\n  );\n}\n"
        ),
        "components/Header.tsx": (
            "import Link from 'next/link';\n\nconst navLinks = [\n  "
            + nav_links
            + "\n];\n\nexport default function Header() {\n"
            "  return (\n    <header className=\"border-b\">\n      <nav className=\"flex gap-6 p-4\">\n"
            "        {navLinks.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}\n"
            "      </nav>\n    </header>\n  );\n}\n"
        ),
        ".gitignore": "node_modules/\n.next/\n.env\n",
    }
    for p in pages:
        title = p.replace("-", " ").title()
        files[f"app/{p}/page.tsx"] = (
            f"export default function {p.replace('-', '').title()}Page() {{\n  return (\n"
            f'    <div className="max-w-4xl mx-auto px-6 py-16">\n      <h1 className="text-3xl font-bold">{title}</h1>\n'
            "    </div>\n  );\n}\n"
        )

    return {
        "description": f"{company} — a {icon} business website with {len(pages) + 1} pages, built with Next.js.",
        "architecture": [
            {"layer": "Framework", "tech": "Next.js 14", "desc": "App Router, React, SSR"},
            {"layer": "Styling", "tech": "Tailwind CSS", "desc": "Utility-first, fully responsive"},
            {"layer": "Deployment", "tech": "Vercel", "desc": "Zero-config deploy from GitHub"},
        ],
        "files": files,
    }
