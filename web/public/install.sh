#!/usr/bin/env sh
# Slate installer — downloads the release for your platform, verifies its
# SHA-256 against the published manifest, and installs it.
#
#   curl -fsSL https://slate.tools/install.sh | sh
#
# It makes exactly one network call to slate.tools and nothing else.
set -eu

BASE="https://slate.tools/releases"
VERSION="${SLATE_VERSION:-0.1.0}"

os="$(uname -s)"
arch="$(uname -m)"

case "$os:$arch" in
  Darwin:arm64)  asset="Slate-$VERSION-arm64.dmg" ;;
  Darwin:x86_64) asset="Slate-$VERSION-x64.dmg" ;;
  Linux:x86_64)  asset="Slate-$VERSION-x86_64.AppImage" ;;
  *) echo "No Slate build for $os $arch yet. See https://slate.tools/download/" >&2; exit 1 ;;
esac

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "→ downloading $asset"
curl -fsSL "$BASE/$asset" -o "$tmp/$asset"
curl -fsSL "$BASE/SHA256SUMS" -o "$tmp/SHA256SUMS"

echo "→ verifying checksum"
( cd "$tmp" && grep " $asset\$" SHA256SUMS | shasum -a 256 -c - ) || {
  echo "checksum mismatch — refusing to install" >&2; exit 1; }

case "$os" in
  Darwin)
    hdiutil attach -quiet -nobrowse "$tmp/$asset"
    cp -R "/Volumes/Slate/Slate.app" /Applications/
    hdiutil detach -quiet "/Volumes/Slate"
    echo "✓ installed to /Applications/Slate.app"
    ;;
  Linux)
    mkdir -p "$HOME/.local/bin"
    install -m 755 "$tmp/$asset" "$HOME/.local/bin/slate"
    echo "✓ installed to ~/.local/bin/slate"
    ;;
esac
