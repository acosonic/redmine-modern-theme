#!/usr/bin/env bash
# Modern Redmine Theme — installer
# Usage: bash install.sh /path/to/redmine

set -e

REDMINE="${1:-.}"

if [ ! -f "$REDMINE/Gemfile" ]; then
  echo "ERROR: '$REDMINE' does not look like a Redmine root directory."
  exit 1
fi

echo "Installing Modern Redmine Theme into: $REDMINE"

cp stylesheets/modern_theme.css  "$REDMINE/app/assets/stylesheets/modern_theme.css"
cp javascripts/modern_theme.js   "$REDMINE/public/javascripts/modern_theme.js"

LAYOUT="$REDMINE/app/views/layouts/base.html.erb"
BACKUP="$LAYOUT.bak"

if [ ! -f "$BACKUP" ]; then
  cp "$LAYOUT" "$BACKUP"
  echo "Original layout backed up to base.html.erb.bak"
fi

cp layouts/base.html.erb "$LAYOUT"

echo "Done. Restart your Redmine server to apply the theme."
