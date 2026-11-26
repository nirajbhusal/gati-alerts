#!/bin/bash
# Build Gati.app for macOS (Apple silicon and Intel in one binary), then a .dmg and a .zip.
# Run on a Mac with Xcode installed:  bash mac/build.sh
# The app is signed ad hoc (no Apple Developer ID), so macOS asks for confirmation the first time it is opened.
set -euo pipefail
cd "$(dirname "$0")"

swift build -c release --arch arm64 --arch x86_64
BIN="$(swift build -c release --arch arm64 --arch x86_64 --show-bin-path)/Gati"

APP="build/Gati.app"
rm -rf build
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" build/AppIcon.iconset
cp "$BIN" "$APP/Contents/MacOS/Gati"
cp Info.plist "$APP/Contents/Info.plist"

# App icon from the Gati mark
SRC="../assets/img/brand/mark-512.png"
for s in 16 32 128 256 512; do
  sips -z "$s" "$s" "$SRC" --out "build/AppIcon.iconset/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2))
  sips -z "$d" "$d" "$SRC" --out "build/AppIcon.iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns build/AppIcon.iconset -o "$APP/Contents/Resources/AppIcon.icns"
rm -rf build/AppIcon.iconset

codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"

ditto -c -k --keepParent "$APP" build/Gati-mac.zip
hdiutil create -volname "Gati" -srcfolder "$APP" -ov -format UDZO build/Gati.dmg >/dev/null
echo "Built: mac/$APP, mac/build/Gati.dmg, mac/build/Gati-mac.zip"
