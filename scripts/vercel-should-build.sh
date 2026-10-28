#!/usr/bin/env bash
# Vercel "Ignored Build Step" helper. Runs per-deploy and decides whether
# this project should rebuild for the current push.
#
# Usage in Vercel project Settings → Git → Ignored Build Step:
#   bash scripts/vercel-should-build.sh lot71
#   bash scripts/vercel-should-build.sh givenest
#
# Exit 0 → Vercel SKIPS the build (treated as success).
# Exit 1 → Vercel PROCEEDS with the build.
#
# The LOT71 project builds whenever any LOT71-scoped file changed, or any
# of the "shared" files that affect both brands. The Givenest project
# builds whenever anything other than lot71-only files changed.
#
# This is a correctness-first script: when in doubt, build.

set -euo pipefail

PROJECT="${1:-}"
if [[ -z "$PROJECT" ]]; then
  echo "Usage: $0 <lot71|givenest>" >&2
  exit 1
fi

# Vercel sets VERCEL_GIT_PREVIOUS_SHA to the base commit for the diff.
# When it's missing (first deploy, force push, or local test), build.
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [[ -z "$PREV" ]]; then
  echo "No VERCEL_GIT_PREVIOUS_SHA; building to be safe."
  exit 1
fi

# Collect all files changed since the previous build.
if ! CHANGED=$(git diff --name-only "$PREV" HEAD 2>/dev/null); then
  echo "git diff failed; building to be safe."
  exit 1
fi
if [[ -z "$CHANGED" ]]; then
  echo "No file changes detected; skipping build."
  exit 0
fi

# Patterns.
#  - LOT71_PATTERN   : files that belong only to the LOT71 brand site.
#  - SHARED_PATTERN  : files that affect both brands (root config, root
#                      layout, middleware, deps, etc.). A change here
#                      forces both projects to rebuild.
LOT71_PATTERN='^(app/lot71|app/api/lot71|components/lot71|lib/lot71|public/lot71)/'
SHARED_PATTERN='^(middleware\.ts|next\.config\.mjs|package\.json|package-lock\.json|pnpm-lock\.yaml|tsconfig\.json|tailwind\.config\.ts|postcss\.config\.mjs|app/globals\.css|app/layout\.tsx|app/favicon\.png|app/icon\.png|vercel\.json|\.vercelignore)$'

lot71_only=0
other=0
shared=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if [[ $f =~ $LOT71_PATTERN ]]; then
    lot71_only=$((lot71_only+1))
  elif [[ $f =~ $SHARED_PATTERN ]]; then
    shared=$((shared+1))
  else
    other=$((other+1))
  fi
done <<< "$CHANGED"

echo "Changed: lot71=$lot71_only shared=$shared other=$other"

case "$PROJECT" in
  lot71)
    if (( lot71_only > 0 || shared > 0 )); then
      echo "Building lot71-designs (LOT71 or shared files changed)."
      exit 1
    fi
    echo "No LOT71-relevant changes; skipping lot71-designs build."
    exit 0
    ;;
  givenest)
    if (( other > 0 || shared > 0 )); then
      echo "Building givenest (non-LOT71 or shared files changed)."
      exit 1
    fi
    echo "Only LOT71-scoped changes; skipping givenest build."
    exit 0
    ;;
  *)
    echo "Unknown project: $PROJECT (expected 'lot71' or 'givenest')." >&2
    exit 1
    ;;
esac
