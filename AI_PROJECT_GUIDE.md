# AI Assistant Guide: Adding Projects to Portfolio

This guide is for AI assistants helping Roman add new projects to his portfolio website.

## Quick Reference

**When the user wants to add a project, use the `add_project.py` script programmatically.**

## How to Use the Script

The script is located at: `/home/roman/romanslack_portfolio_v3/add_project.py`

### Method 1: Programmatic (Recommended for AI)

Import and use the `inject_project()` function:

```python
from add_project import inject_project

# Example: Adding a programming project
inject_project(
    id=5,
    title="AI Code Assistant",
    description="An intelligent coding assistant powered by GPT-4 that helps developers write better code faster.",
    date="12-2025",
    category="programming",
    hours=30,
    image="images/resized_1_portfolio/ai_assistant.png",
    link="https://github.com/RomanSlack/AICodeAssistant",
    inProgress=True
)
```

### Method 2: Run Script Directly

```bash
# Interactive mode (asks questions)
python add_project.py

# Command line mode
python add_project.py <id> <title> <description> <date> <image> <link> <category> <hours> [inProgress]
```

## Function Parameters

### `inject_project()` Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | int | ✅ | Project ID (lower = more prominent in Standout view) | `5` |
| `title` | str | ✅ | Project name | `"My Project"` |
| `description` | str | ✅ | Project description | `"An AI-powered tool..."` |
| `date` | str | ✅ | Date in MM-YYYY format | `"11-2025"` |
| `category` | str | ✅ | One of: `programming`, `architecture`, `other` | `"programming"` |
| `hours` | float | ✅ | Time spent on project | `25.5` |
| `image` | str | ❌ | Single image path (use OR images) | `"images/resized_1_portfolio/project.png"` |
| `images` | list | ❌ | Multiple image paths for carousel | `["img1.jpg", "img2.jpg"]` |
| `link` | str | ❌ | External link (GitHub, YouTube, etc.) | `"https://github.com/..."` |
| `inProgress` | bool | ❌ | Whether project is ongoing (shows "date - Present") | `True` |

## Important Rules

### 1. ID Management
- **Lower IDs appear first** in "Standout" mode
- IDs 1-10: Featured/most important projects
- IDs 10-30: Regular projects
- IDs 30+: Older/less prominent projects
- **The script automatically reorders existing IDs** if there's a conflict

### 2. Image Guidelines
- **Single image projects**: Use `image` parameter
  - Path: `images/resized_1_portfolio/filename.png`
  - Example: Most programming projects

- **Multi-image projects**: Use `images` parameter (list)
  - Path: `images/architecture_projects/project_name/filename.jpg`
  - Example: Architecture projects with carousel
  - Images rotate every 5 seconds

### 3. Categories
- `programming`: Software/AI/tech projects
- `architecture`: 3D modeling/building design projects
- `other`: Everything else (teaching, biking, etc.)

### 4. Date Format
- Always use **MM-YYYY** format
- Examples: `"11-2025"`, `"03-2024"`
- Invalid: `"2025-11"`, `"November 2025"`

## Example Usage Scenarios

### Scenario 1: User provides all details

**User says:** "Add my new project called 'QuantumAI' - it's a quantum computing simulator I built in 40 hours. Use the image at images/resized_1_portfolio/quantumai.png, link to github.com/RomanSlack/QuantumAI, and put it at ID 3 since it's really important. Date is November 2025 and it's still in progress."

**AI Response:**
```python
from add_project import inject_project

inject_project(
    id=3,
    title="QuantumAI",
    description="A quantum computing simulator built with Python and Qiskit.",
    date="11-2025",
    category="programming",
    hours=40,
    image="images/resized_1_portfolio/quantumai.png",
    link="https://github.com/RomanSlack/QuantumAI",
    inProgress=True
)
```

### Scenario 2: Architecture project with multiple images

**User says:** "Add my new architecture project - Modern Cabin. 4 images in the folder images/architecture_projects/modern_cabin/, it took 60 hours, finished in March 2024, video at youtube.com/watch?v=xyz123, put it at ID 36"

**AI Response:**
```python
from add_project import inject_project

inject_project(
    id=36,
    title="Modern Cabin",
    description="A modern cabin design created in Blender and UE5.",
    date="03-2024",
    category="architecture",
    hours=60,
    images=[
        "images/architecture_projects/modern_cabin/cabin_1.jpg",
        "images/architecture_projects/modern_cabin/cabin_2.jpg",
        "images/architecture_projects/modern_cabin/cabin_3.jpg",
        "images/architecture_projects/modern_cabin/cabin_4.jpg"
    ],
    link="https://youtube.com/watch?v=xyz123",
    inProgress=False
)
```

### Scenario 3: Minimal information provided

**User says:** "Add BlockchainExplorer, programming project, 15 hours, image is blockchain_exp.png"

**AI should ask:**
- "What ID would you like for this project? (Lower numbers = more prominent)"
- "What date should I use (MM-YYYY format)?"
- "Is this project still in progress?"
- "Do you have a link to add (GitHub, website, etc.)?"
- "Can you provide a description for the project?"

## What the Script Does Automatically

1. ✅ **Validates all fields** (checks required fields, date format, category)
2. ✅ **Handles ID conflicts** (if ID exists, shifts all higher IDs up by 1)
3. ✅ **Maintains sort order** (projects always sorted by ID)
4. ✅ **Updates statistics** (total projects and hours)
5. ✅ **Preserves JSON formatting** (pretty-printed with 2-space indentation)

## Common Patterns

### Making a project featured
```python
inject_project(id=2, ...)  # Low ID = featured in Standout view
```

### Architecture project with carousel
```python
inject_project(
    images=["path1.jpg", "path2.jpg", "path3.jpg"],  # Use 'images' not 'image'
    category="architecture",
    ...
)
```

### In-progress project
```python
inject_project(
    inProgress=True,  # Shows "MM-YYYY - Present"
    ...
)
```

### No external link
```python
inject_project(
    # Simply omit the 'link' parameter
    ...
)
```

## Error Handling

The script will raise clear errors for:
- Missing required fields
- Invalid category
- Invalid date format
- Missing both `image` and `images`
- Invalid JSON in projects.json

**Always wrap in try/except when using programmatically:**

```python
try:
    inject_project(...)
    print("✅ Project added successfully!")
except ValueError as e:
    print(f"❌ Validation error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
```

## Workflow for AI Assistants

1. **Gather all required information from user**
   - If anything is missing, ask specific questions
   - Suggest appropriate ID based on project importance

2. **Prepare the image path**
   - Programming: `images/resized_1_portfolio/projectname.png`
   - Architecture: `images/architecture_projects/projectname/image_1.jpg`

3. **Construct and execute the function call**
   ```python
   from add_project import inject_project

   inject_project(
       id=...,
       title=...,
       # ... all other fields
   )
   ```

4. **Confirm success with user**
   - Tell them which ID was used
   - Mention if any other IDs were shifted
   - Confirm the project is now live on the site

## Tips for AI Assistants

- **ID Selection**: If user doesn't specify, ask if it's a "featured" project (ID 1-10) or regular (10+)
- **In-Progress Detection**: Look for keywords like "working on", "currently", "ongoing"
- **Link Inference**: If user mentions "GitHub", "YouTube", or gives a URL, use it
- **Description Writing**: If user gives minimal info, offer to write a professional description
- **Image Path**: Always confirm the exact image path - don't assume

## File Locations Reference

```
/home/roman/romanslack_portfolio_v3/
├── add_project.py              # The script (this is gitignored)
├── projects.json               # Main data file (DO NOT edit manually)
├── projects.js                 # Rendering engine (don't modify)
├── projects.html               # Page template (don't modify)
└── images/
    ├── resized_1_portfolio/    # Single images for programming projects
    └── architecture_projects/  # Multi-image architecture projects
```

## Testing

After adding a project, you can verify by:

```bash
# Check the JSON is valid
python -m json.tool projects.json > /dev/null && echo "✅ Valid JSON"

# Count projects
python -c "import json; print(f\"Total projects: {len(json.load(open('projects.json')))}\")"

# View last project added
python -c "import json; projects = json.load(open('projects.json')); print(projects[-1])"
```

---

**Remember:** Always use the `inject_project()` function programmatically. Never manually edit `projects.json` - that's error-prone and defeats the purpose of this tool!
