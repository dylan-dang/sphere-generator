import { Options } from '../dialog';
import { createContext, SIDES } from './common';
import { loadCube } from './cubemap';
import { loadEquirectangular } from './equirectangular';
import { renderOrthogonalHemispheres } from './orthographic';

export async function generateTextures(opts: Options) {
    const ctx = createContext(opts);
    await ({
        equirectangular: loadEquirectangular,
        cube: loadCube
    })[opts.mapping](ctx);
    return renderOrthogonalHemispheres(ctx).map((dataUrl, i) => {
        console.log(dataUrl); return new Texture({
            name: SIDES[i],
            id: SIDES[i]
        }).fromDataURL(dataUrl)
    });
}