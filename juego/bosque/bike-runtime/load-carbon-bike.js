import { GLTFLoader } from './loaders/GLTFLoader.js';
import { DRACOLoader } from './loaders/DRACOLoader.js';
import { KTX2Loader } from './loaders/KTX2Loader.js';

export async function loadCarbonBike(renderer) {
  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL('./libs/draco/', import.meta.url).href);
  draco.setWorkerLimit(1);

  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath(new URL('./libs/basis/', import.meta.url).href);
  ktx2.setWorkerLimit(1);
  if (renderer) ktx2.detectSupport(renderer);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setKTX2Loader(ktx2);
  try {
    return await loader.loadAsync(new URL('./models/CarbonFrameBike.glb', import.meta.url).href);
  } finally {
    draco.dispose();
    ktx2.dispose();
  }
}
