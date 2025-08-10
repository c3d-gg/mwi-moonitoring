#!/bin/bash

# MWI-Moonitoring Build & Release Script
# This script automates the version bump, build, and release process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
LIBRARY_FILE="mwi-moonitoring-library.js"
MINIFIED_FILE="mwi-moonitoring-library.min.js"
README_FILE="README.md"
SRI_HASHES_FILE="SRI-HASHES.md"
REQUIRED_TOOLS=("git" "terser" "sha256sum" "md5sum")

# Helper functions
print_header() {
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_step "Checking requirements..."
    
    local missing_tools=()
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo -e "\nPlease install:"
        for tool in "${missing_tools[@]}"; do
            case "$tool" in
                terser)
                    echo "  npm install -g terser"
                    ;;
                *)
                    echo "  Install $tool using your package manager"
                    ;;
            esac
        done
        exit 1
    fi
    
    print_success "All requirements satisfied"
}

# Validate semantic version format
validate_version() {
    local version=$1
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format: $version"
        echo "Version must be in format: X.Y.Z (e.g., 1.2.3)"
        return 1
    fi
    return 0
}

# Get current version from library file
get_current_version() {
    grep -o "VERSION = '[^']*'" "$LIBRARY_FILE" | cut -d"'" -f2
}

# Compare versions (returns 0 if v1 > v2, 1 if v1 <= v2)
version_gt() {
    local v1=$1
    local v2=$2
    
    # Convert versions to comparable numbers
    local v1_parts=(${v1//./ })
    local v2_parts=(${v2//./ })
    
    for i in {0..2}; do
        local p1=${v1_parts[$i]:-0}
        local p2=${v2_parts[$i]:-0}
        
        if [ "$p1" -gt "$p2" ]; then
            return 0
        elif [ "$p1" -lt "$p2" ]; then
            return 1
        fi
    done
    
    return 1  # versions are equal
}

# Check for uncommitted changes
check_git_status() {
    print_step "Checking git status..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes (excluding untracked files)
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes"
        echo -e "\nModified files:"
        git diff --name-only
        echo ""
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborting..."
            exit 1
        fi
    else
        print_success "Working directory clean"
    fi
    
    # Ensure we're on main branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        print_warning "Not on main/master branch (current: $current_branch)"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborting..."
            exit 1
        fi
    fi
}

# Update version in library file
update_library_version() {
    local new_version=$1
    print_step "Updating library version to $new_version..."
    
    # Update VERSION constant
    sed -i "s/const VERSION = '[^']*'/const VERSION = '$new_version'/" "$LIBRARY_FILE"
    
    print_success "Updated $LIBRARY_FILE"
}

# Generate minified version
generate_minified() {
    local new_version=$1
    print_step "Generating minified version..."
    
    # Run terser with specific options
    terser "$LIBRARY_FILE" \
        --compress \
        --mangle \
        --toplevel \
        --output "$MINIFIED_FILE" \
        --comments "/^!|@preserve|@license|@cc_on/i" \
        2>/dev/null
    
    # Update version in minified file header
    sed -i "s/@version [0-9]\+\.[0-9]\+\.[0-9]\+/@version $new_version/" "$MINIFIED_FILE"
    
    # Get file size
    local size=$(du -h "$MINIFIED_FILE" | cut -f1)
    print_success "Generated $MINIFIED_FILE ($size)"
}

# Generate hashes for SRI
generate_hashes() {
    print_step "Generating SRI hashes..."
    
    # Generate hashes for minified file
    local sha256_min=$(sha256sum "$MINIFIED_FILE" | cut -d' ' -f1)
    local sha256_min_b64=$(echo -n "$sha256_min" | xxd -r -p | base64)
    local md5_min=$(md5sum "$MINIFIED_FILE" | cut -d' ' -f1)
    
    # Generate hashes for full file
    local sha256_full=$(sha256sum "$LIBRARY_FILE" | cut -d' ' -f1)
    local sha256_full_b64=$(echo -n "$sha256_full" | xxd -r -p | base64)
    local md5_full=$(md5sum "$LIBRARY_FILE" | cut -d' ' -f1)
    
    echo -e "\n${BOLD}SRI Hashes for v$1:${NC}"
    echo -e "${CYAN}Minified:${NC}"
    echo "  SHA-256: $sha256_min_b64"
    echo "  MD5: $md5_min"
    echo -e "${CYAN}Full:${NC}"
    echo "  SHA-256: $sha256_full_b64"
    echo "  MD5: $md5_full"
    echo ""
}

# Update README version references
update_readme() {
    local new_version=$1
    print_step "Updating README.md..."
    
    # Update versioned URLs in README
    sed -i "s/mwi-moonitoring-library-v[0-9]\+\.[0-9]\+\.[0-9]\+/mwi-moonitoring-library-v$new_version/g" "$README_FILE"
    
    print_success "Updated version references in README"
}

# Stage files for commit
stage_files() {
    print_step "Staging files..."
    
    local files=(
        "$LIBRARY_FILE"
        "$MINIFIED_FILE"
        "$README_FILE"
        ".github/workflows/deploy-to-r2.yml"
    )
    
    # Stage only files that exist
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            git add "$file"
            echo "  Staged: $file"
        fi
    done
    
    # Stage SRI files if they exist
    if [ -f "sri.json" ]; then
        git add "sri.json"
        echo "  Staged: sri.json"
    fi
    
    if [ -f "$SRI_HASHES_FILE" ]; then
        git add "$SRI_HASHES_FILE"
        echo "  Staged: $SRI_HASHES_FILE"
    fi
    
    print_success "Files staged for commit"
}

# Create commit and tag
create_commit_and_tag() {
    local new_version=$1
    local commit_msg="chore(version): v$new_version"
    
    print_step "Creating commit: $commit_msg"
    
    git commit -m "$commit_msg" -m "- Updated library version to $new_version
- Regenerated minified file
- Updated documentation references

🤖 Generated with build.sh script"
    
    print_success "Commit created"
    
    print_step "Creating tag v$new_version..."
    
    git tag -a "v$new_version" -m "Release v$new_version

## Library Files
- mwi-moonitoring-library.min.js (minified)
- mwi-moonitoring-library.js (full source)
- mwi-moonitoring.d.ts (TypeScript definitions)

## CDN URLs
- Latest: https://dns.c3d.gg/mwi-moonitoring-library.min.js
- Versioned: https://dns.c3d.gg/mwi-moonitoring-library-v$new_version.min.js
- SRI Info: https://dns.c3d.gg/sri.json

## Installation
Check https://dns.c3d.gg/sri.json for ready-to-use @require lines with SRI hashes."
    
    print_success "Tag v$new_version created"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [VERSION]"
    echo ""
    echo "Build and release a new version of MWI-Moonitoring library"
    echo ""
    echo "Arguments:"
    echo "  VERSION         New version number (X.Y.Z format)"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -d, --dry-run   Run without making actual changes"
    echo "  -f, --force     Skip git status check"
    echo "  -p, --push      Automatically push to GitHub after build"
    echo ""
    echo "Examples:"
    echo "  $0 1.2.3        Build and release version 1.2.3"
    echo "  $0 --dry-run    Show what would be done without changes"
    echo "  $0 -p 1.2.3     Build v1.2.3 and auto-push to GitHub"
    exit 0
}

# Main script
main() {
    # Parse arguments
    local dry_run=false
    local force=false
    local auto_push=false
    local new_version=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -p|--push)
                auto_push=true
                shift
                ;;
            *)
                if [ -z "$new_version" ]; then
                    new_version=$1
                fi
                shift
                ;;
        esac
    done
    
    print_header "MWI-Moonitoring Build Script"
    
    if [ "$dry_run" = true ]; then
        echo -e "${YELLOW}${BOLD}DRY RUN MODE - No changes will be made${NC}\n"
    fi
    
    # Check requirements
    check_requirements
    
    # Get current version
    local current_version=$(get_current_version)
    echo -e "${BOLD}Current version:${NC} $current_version"
    
    # Get new version if not provided
    if [ -z "$new_version" ]; then
        echo ""
        read -p "Enter new version (X.Y.Z): " new_version
    fi
    
    # Validate version
    if ! validate_version "$new_version"; then
        exit 1
    fi
    
    # Check if new version is greater than current
    if ! version_gt "$new_version" "$current_version"; then
        print_error "New version ($new_version) must be greater than current version ($current_version)"
        exit 1
    fi
    
    # Confirm action (skip in dry-run mode)
    if [ "$dry_run" = false ]; then
        echo -e "\n${BOLD}This will:${NC}"
        echo "  1. Update version from $current_version to $new_version"
        echo "  2. Generate minified file"
        echo "  3. Create commit and tag"
        echo "  4. Prepare for push to main"
        echo ""
        read -p "Continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborting..."
            exit 0
        fi
    else
        echo -e "\n${BOLD}Dry run will simulate:${NC}"
        echo "  1. Update version from $current_version to $new_version"
        echo "  2. Generate minified file"
        echo "  3. Create commit and tag"
        echo "  4. Prepare for push to main"
    fi
    
    print_header "Building v$new_version"
    
    # Check git status (skip if force flag is set)
    if [ "$force" = false ] && [ "$dry_run" = false ]; then
        check_git_status
    fi
    
    # Update versions
    if [ "$dry_run" = false ]; then
        update_library_version "$new_version"
    else
        print_step "[DRY RUN] Would update library version to $new_version"
    fi
    
    # Generate minified version
    if [ "$dry_run" = false ]; then
        generate_minified "$new_version"
    else
        print_step "[DRY RUN] Would generate minified version"
    fi
    
    # Update README
    if [ "$dry_run" = false ]; then
        update_readme "$new_version"
    else
        print_step "[DRY RUN] Would update README version references"
    fi
    
    # Generate and display hashes
    if [ "$dry_run" = false ]; then
        generate_hashes "$new_version"
    else
        print_step "[DRY RUN] Would generate SRI hashes"
    fi
    
    # Stage files
    if [ "$dry_run" = false ]; then
        stage_files
    else
        print_step "[DRY RUN] Would stage files for commit"
    fi
    
    # Create commit and tag
    if [ "$dry_run" = false ]; then
        create_commit_and_tag "$new_version"
    else
        print_step "[DRY RUN] Would create commit: chore(version): v$new_version"
        print_step "[DRY RUN] Would create tag: v$new_version"
    fi
    
    print_header "Build Complete! 🎉"
    
    if [ "$dry_run" = true ]; then
        echo -e "${YELLOW}${BOLD}DRY RUN COMPLETE${NC}"
        echo "No actual changes were made."
        echo ""
        echo "To perform the actual build, run:"
        echo "  $0 $new_version"
    else
        echo -e "${BOLD}Next steps:${NC}"
        echo "  1. Review the changes:"
        echo "     git show HEAD"
        echo "  2. Push to GitHub:"
        echo "     git push origin main --tags"
        echo ""
        echo "The GitHub Action will automatically deploy to CDN."
        echo ""
        
        # Handle auto-push or ask user
        if [ "$auto_push" = true ]; then
            print_step "Auto-pushing to GitHub..."
            git push origin main --tags
            print_success "Pushed successfully!"
            echo ""
            echo "Check deployment status at:"
            echo "https://github.com/mathewcst/mwi-moonitoring/actions"
        else
            # Ask if user wants to push now
            read -p "Push to GitHub now? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_step "Pushing to GitHub..."
                git push origin main --tags
                print_success "Pushed successfully!"
                echo ""
                echo "Check deployment status at:"
                echo "https://github.com/mathewcst/mwi-moonitoring/actions"
            else
                echo "Remember to push when ready:"
                echo "  git push origin main --tags"
            fi
        fi
    fi
}

# Run main function
main "$@"