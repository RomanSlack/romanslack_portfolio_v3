#!/usr/bin/env python3
"""
Project management script for Roman Slack's portfolio.
Adds projects to projects.json with automatic ID management.
"""

import json
import sys
import re
from pathlib import Path

PROJECTS_FILE = Path(__file__).parent / "projects.json"


def validate_date(date_str):
    """Validate date is in MM-YYYY format."""
    if not re.match(r"^(0[1-9]|1[0-2])-\d{4}$", date_str):
        raise ValueError(f"Invalid date format: {date_str}. Use MM-YYYY (e.g., 12-2025)")
    return True


def validate_category(category):
    """Validate category is one of the allowed values."""
    valid = ["programming", "architecture", "other"]
    if category not in valid:
        raise ValueError(f"Invalid category: {category}. Must be one of: {', '.join(valid)}")
    return True


def inject_project(
    id: int,
    title: str,
    description: str,
    date: str,
    category: str,
    hours: float,
    image: str = None,
    images: list = None,
    link: str = None,
    inProgress: bool = False,
    research: bool = False,
    product: bool = False
):
    """
    Add a project to projects.json.

    Args:
        id: Project ID (lower = more prominent in Standout view)
        title: Project name
        description: Project description
        date: Date in MM-YYYY format
        category: One of 'programming', 'architecture', 'other'
        hours: Time spent on project
        image: Single image path (use OR images, not both)
        images: List of image paths for carousel
        link: External link (GitHub, YouTube, etc.)
        inProgress: Whether project is ongoing
        research: Show research badge
        product: Show product badge

    Returns:
        dict: The created project object
    """
    # Validate required fields
    if not all([title, description, date, category]):
        raise ValueError("Missing required fields: title, description, date, category")

    validate_date(date)
    validate_category(category)

    if not image and not images:
        raise ValueError("Must provide either 'image' or 'images'")

    if image and images:
        raise ValueError("Provide either 'image' or 'images', not both")

    # Load existing projects
    with open(PROJECTS_FILE, 'r') as f:
        projects = json.load(f)

    # Build new project object
    project = {
        "id": id,
        "title": title,
        "description": description,
        "date": date,
        "category": category,
        "hours": hours
    }

    if image:
        project["image"] = image
    if images:
        project["images"] = images
    if link:
        project["link"] = link
    if inProgress:
        project["inProgress"] = True
    if research:
        project["research"] = True
    if product:
        project["product"] = True

    # Check for ID conflict and shift if needed
    existing_ids = {p["id"] for p in projects}
    if id in existing_ids:
        # Shift all projects with id >= target id up by 1
        for p in projects:
            if p["id"] >= id:
                p["id"] += 1

    # Add new project and sort by ID
    projects.append(project)
    projects.sort(key=lambda x: x["id"])

    # Save
    with open(PROJECTS_FILE, 'w') as f:
        json.dump(projects, f, indent=2)

    print(f"Added '{title}' at ID {id}")
    print(f"Total projects: {len(projects)}")

    return project


def interactive_mode():
    """Run in interactive mode, prompting for each field."""
    print("=== Add New Project ===\n")

    try:
        id = int(input("ID (lower = more prominent): "))
        title = input("Title: ").strip()
        description = input("Description: ").strip()
        date = input("Date (MM-YYYY): ").strip()
        category = input("Category (programming/architecture/other): ").strip()
        hours = float(input("Hours: "))

        image_type = input("Single image or multiple? (s/m): ").strip().lower()
        if image_type == 'm':
            images_input = input("Image paths (comma-separated): ").strip()
            images = [img.strip() for img in images_input.split(",")]
            image = None
        else:
            image = input("Image path: ").strip()
            images = None

        link = input("Link (or leave empty): ").strip() or None
        in_progress = input("In progress? (y/n): ").strip().lower() == 'y'
        research = input("Research badge? (y/n): ").strip().lower() == 'y'
        product = input("Product badge? (y/n): ").strip().lower() == 'y'

        inject_project(
            id=id,
            title=title,
            description=description,
            date=date,
            category=category,
            hours=hours,
            image=image,
            images=images,
            link=link,
            inProgress=in_progress,
            research=research,
            product=product
        )

    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(0)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)


def cli_mode():
    """Parse command line arguments."""
    if len(sys.argv) < 9:
        print("Usage: python add_project.py <id> <title> <description> <date> <image> <link> <category> <hours> [inProgress]")
        print("Example: python add_project.py 5 'My Project' 'Description here' 12-2025 images/proj.png https://github.com/... programming 40 true")
        sys.exit(1)

    try:
        inject_project(
            id=int(sys.argv[1]),
            title=sys.argv[2],
            description=sys.argv[3],
            date=sys.argv[4],
            image=sys.argv[5],
            link=sys.argv[6] if sys.argv[6] != "none" else None,
            category=sys.argv[7],
            hours=float(sys.argv[8]),
            inProgress=len(sys.argv) > 9 and sys.argv[9].lower() == 'true'
        )
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) == 1:
        interactive_mode()
    else:
        cli_mode()
