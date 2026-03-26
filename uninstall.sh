#!/usr/bin/env bash
# Modern Redmine Theme — uninstaller

set -e

REDMINE="${1:-.}"

LAYOUT="$REDMINE/app/views/layouts/base.html.erb"
BACKUP="$LAYOUT.bak"

if [ -f "$BACKUP" ]; then
  cp "$BACKUP" "$LAYOUT"
  echo "Restored original layout from backup."
else
  echo "No backup found at $BACKUP — restore manually."
fi

rm -f "$REDMINE/app/assets/stylesheets/modern_theme.css"
rm -f "$REDMINE/public/javascripts/modern_theme.js"

echo "Theme removed. Restart your Redmine server."
