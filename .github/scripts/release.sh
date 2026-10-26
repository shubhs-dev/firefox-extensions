#!/usr/bin/env bash
# Signs (AMO unlisted) and releases every extension whose manifest version is not yet in
# updates.json, then records it there. updates.json is what each manifest's update_url points at,
# so installed copies pick up the new version automatically.
#
# Idempotent: a version already in updates.json is skipped; a version whose GitHub release exists
# but never made it into updates.json (earlier run failed late) reuses the released .xpi.
#
# Needs: AMO_JWT_ISSUER, AMO_JWT_SECRET, GH_TOKEN, GITHUB_REPOSITORY.
set -euo pipefail

if [ -z "${AMO_JWT_ISSUER:-}" ] || [ -z "${AMO_JWT_SECRET:-}" ]; then
  echo "::error::Add AMO_JWT_ISSUER and AMO_JWT_SECRET under Settings → Secrets and variables → Actions, then re-run."
  exit 1
fi

repo="${GITHUB_REPOSITORY:?}"
changed=0
mkdir -p dist

for manifest in */manifest.json; do
  ext="${manifest%/manifest.json}"
  id=$(jq -r '.browser_specific_settings.gecko.id' "$manifest")
  version=$(jq -r '.version' "$manifest")
  tag="$ext-v$version"
  asset="$ext-$version.xpi"

  if jq -e --arg id "$id" --arg v "$version" \
      '(.addons[$id].updates // []) | any(.version == $v)' updates.json >/dev/null; then
    echo "$tag: already published"
    continue
  fi

  echo "::group::$tag"
  if gh release view "$tag" >/dev/null 2>&1; then
    echo "Release exists; reusing its .xpi"
    gh release download "$tag" --pattern "$asset" --dir dist --clobber
  else
    npx --yes web-ext@10 lint --source-dir "$ext" --self-hosted
    rm -rf "dist/$ext"
    npx --yes web-ext@10 sign --source-dir "$ext" --artifacts-dir "dist/$ext" \
      --channel unlisted --api-key "${AMO_JWT_ISSUER:?}" --api-secret "${AMO_JWT_SECRET:?}"
    mv dist/"$ext"/*.xpi "dist/$asset"
    gh release create "$tag" "dist/$asset" --title "$ext $version" \
      --notes "Signed build of \`$ext\` $version. Drag the .xpi onto a Firefox window to install; it updates itself afterwards."
  fi

  url="https://github.com/$repo/releases/download/$tag/$asset"
  hash="sha256:$(sha256sum "dist/$asset" | cut -d' ' -f1)"
  jq --arg id "$id" --arg v "$version" --arg url "$url" --arg hash "$hash" \
    '.addons[$id].updates = ((.addons[$id].updates // []) + [{version: $v, update_link: $url, update_hash: $hash}])' \
    updates.json > updates.json.tmp
  mv updates.json.tmp updates.json
  changed=1
  echo "::endgroup::"
done

if [ "$changed" = 1 ]; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add updates.json
  git commit -m "Publish signed versions in updates.json"
  git pull --rebase origin main
  git push origin HEAD:main
fi
