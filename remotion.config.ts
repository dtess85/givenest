import { Config } from "@remotion/cli/config";

/**
 * Remotion project config. The entry point (`remotion/index.ts`) registers
 * all compositions via `registerRoot(Root)`.
 *
 * Overrides set here apply to both `remotion studio` and `remotion render`.
 */

// H.264 in an MP4 container — maximum compatibility with Instagram's Reel
// uploader, which re-encodes anything non-standard anyway.
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");

// Quality knob — 90 preserves detail on architectural photography without
// blowing up the file size.
Config.setJpegQuality(90);

// ANGLE OpenGL renderer gives us consistent Chromium output across macOS
// (Metal) and Linux (swiftshader). Without this, Lambda renders can diverge
// from local.
Config.setChromiumOpenGlRenderer("angle");
