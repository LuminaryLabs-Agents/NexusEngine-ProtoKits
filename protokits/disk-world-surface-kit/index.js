import { defineDomainServiceKit } from "nexusengine";
import {
  DISK_WORLD_SURFACE_KIND,
  DISK_WORLD_SURFACE_VERSION,
  createDiskWorldSurface
} from "./surface.js";

export * from "./surface.js";

export const DISK_WORLD_SURFACE_KIT_ID = "disk-world-surface-kit";

export function createDiskWorldSurfaceKit(config = {}) {
  return defineDomainServiceKit({
    id: config.id ?? DISK_WORLD_SURFACE_KIT_ID,
    domain: "disk-world-surface",
    domainPath: "n:world:disk-surface",
    parentDomainPath: "n:world",
    apiName: "diskWorldSurface",
    stability: "experimental",
    version: DISK_WORLD_SURFACE_VERSION,
    services: [
      "bounded-disk-descriptor",
      "boundary-query",
      "edge-falloff",
      "world-disk-transform",
      "portable-snapshot"
    ],
    provides: [
      "world:surface:disk",
      "world:boundary:circle",
      "world:coordinate-transform:disk"
    ],
    createApi() {
      return createDiskWorldSurface(config);
    },
    install({ engine }) {
      engine.diskWorldSurface = engine.n.diskWorldSurface;
    },
    metadata: {
      status: "experimental",
      scope: "world-surface-feature-domain",
      kind: DISK_WORLD_SURFACE_KIND,
      rendererAgnostic: true,
      ownsLoop: false,
      boundary: "Owns bounded planar disk geometry and portable coordinate/boundary queries. Terrain, biomes, content, renderers, input, and host pause behavior remain separate domains."
    }
  });
}

export default createDiskWorldSurfaceKit;
