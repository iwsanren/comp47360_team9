#!/bin/bash

# Update Project Configuration for HTTPS
# Run this script after HTTPS is set up to update all project files

DOMAIN="lunaroutes.duckdns.org"  # Replace with your DDNS domain
OLD_URL="http://137.43.49.26"
NEW_URL="https://$DOMAIN"

echo "🔄 Updating project configuration for HTTPS..."

# Function to update files
update_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo "📝 Updating $description: $file"
        sed -i "s|$OLD_URL|$NEW_URL|g" "$file"
        echo "   ✅ Updated"
    else
        echo "   ⚠️  File not found: $file"
    fi
}

# Update GitLab CI/CD configuration
update_file ".gitlab-ci.yml" "GitLab CI/CD configuration"

# Update environment files
update_file ".env" "Environment variables"
update_file "webapp/.env" "Webapp environment"
update_file "webapp/.env.example" "Webapp environment example"

# Update docker-compose files
update_file "docker-compose.yml" "Docker Compose configuration"
update_file "docker-compose.prod.yml" "Production Docker Compose"

# Update README files
update_file "README.md" "Main README"
update_file "webapp/README.md" "Webapp README"

# Update documentation
update_file "docs/DEPLOYMENT-COMPLETE-GUIDE.md" "Deployment guide"
update_file "docs/quick-setup-guide.md" "Quick setup guide"

# Update any configuration files that might contain URLs
find . -name "*.json" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    if grep -q "$OLD_URL" "$file" 2>/dev/null; then
        update_file "$file" "JSON configuration"
    fi
done

# Update TypeScript/JavaScript config files
find . -name "*.ts" -o -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    if grep -q "$OLD_URL" "$file" 2>/dev/null; then
        update_file "$file" "TypeScript/JavaScript configuration"
    fi
done

# Create a summary of changes
echo ""
echo "📋 Update Summary:"
echo "   Old URL: $OLD_URL"
echo "   New URL: $NEW_URL"
echo "   Domain: $DOMAIN"

# Check if any files still contain the old URL
echo ""
echo "🔍 Checking for remaining old URLs..."
remaining_files=$(grep -r "$OLD_URL" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" 2>/dev/null | wc -l)

if [ "$remaining_files" -gt 0 ]; then
    echo "⚠️  Found $remaining_files files that still contain old URLs:"
    grep -r "$OLD_URL" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" 2>/dev/null | head -10
    echo ""
    echo "   You may need to manually update these files."
else
    echo "✅ No remaining old URLs found"
fi

# Update GitLab CI/CD variables reminder
echo ""
echo "📝 Remember to update GitLab CI/CD Variables:"
echo "   1. Go to GitLab project > Settings > CI/CD > Variables"
echo "   2. Update or add these variables:"
echo "      - DEPLOY_DOMAIN: $DOMAIN"
echo "      - DEPLOY_PROTOCOL: https"
echo "      - PUBLIC_URL: $NEW_URL"

# Final instructions
echo ""
echo "🎉 Configuration update complete!"
echo ""
echo "Next steps:"
echo "   1. Commit and push changes: git add . && git commit -m 'Update URLs for HTTPS' && git push"
echo "   2. Update GitLab CI/CD variables (see above)"
echo "   3. Redeploy the application"
echo "   4. Test the new HTTPS URL: $NEW_URL"
