# romanslack_portfolio_v3
The 3rd iteration of my personal website.

## Project Management Scripts

### add_project.py

A utility script for managing projects in `projects.json`. Lower IDs = more prominent in the "Standout" view.

#### Adding a New Project

**Interactive mode:**
```bash
python3 add_project.py
```
Follow the prompts to enter project details.

**Command line mode:**
```bash
python3 add_project.py <id> <title> <description> <date> <image> <link> <category> <hours> [inProgress]
```

**Programmatic (Python):**
```python
from add_project import inject_project

inject_project(
    id=5,
    title="My Project",
    description="Project description here",
    date="01-2025",
    category="programming",  # or 'architecture', 'other'
    hours=40,
    image="images/my_project.png",
    link="https://github.com/..."
)
```

The script automatically handles ID conflicts—if you insert at an existing ID, all projects at that ID and above get shifted up.

#### Moving/Reordering Projects

To move a project to a different position (with automatic ID cascade):

```python
python3 -c "
import json

with open('projects.json', 'r') as f:
    projects = json.load(f)

projects.sort(key=lambda x: x['id'])

# Find and remove the project you want to move
project = None
for i, p in enumerate(projects):
    if p['title'] == 'PROJECT_NAME':
        project = projects.pop(i)
        break

# Insert at new position (0-indexed, so position 4 = ID 5)
projects.insert(4, project)

# Reassign all IDs sequentially
for i, p in enumerate(projects):
    p['id'] = i + 1

with open('projects.json', 'w') as f:
    json.dump(projects, f, indent=2)

print('Done! New order:')
for p in projects[:10]:
    print(f'  {p[\"id\"]}: {p[\"title\"]}')
"
```

#### Project Schema

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Display order (lower = more prominent) |
| `title` | Yes | Project name |
| `description` | Yes | Brief description |
| `date` | Yes | Format: `MM-YYYY` |
| `category` | Yes | `programming`, `architecture`, or `other` |
| `hours` | Yes | Time invested |
| `image` | One of | Single image path |
| `images` | One of | Array of paths (for carousel) |
| `link` | No | GitHub, YouTube, or website URL |
| `inProgress` | No | `true` if ongoing |
| `research` | No | `true` to show research badge |
