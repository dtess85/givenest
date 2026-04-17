import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

/**
 * Remotion entry point. `remotion studio remotion/index.ts` and
 * `remotion render remotion/index.ts …` both look here for `registerRoot`.
 *
 * The Root component registers every composition (one per Reel template)
 * so the CLI can list them with `remotion compositions`.
 */
registerRoot(RemotionRoot);
