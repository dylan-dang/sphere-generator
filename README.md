Sphere Generator lets you create spherical block models within BlockBench.

It works by creating a specified amount of cubes in the shape of sphere and then texturing each side to a an pre-rendered sphere.
As you increase geometry detail, the model becomes closer and closer to a sphere.

The generator can be accessed by `Tools` > `Sphere Generator`.

### Options

| Option          | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Texture Mapping | Specifies whether to use an cubemap or equirectangular mapping                |
| Texture Length  | Size of the outputted rendered sphere textures                                |
| Rotation        | Rotation of the rendered sphere within the texture                            |
| Position        | Origin point of the sphere model                                              |
| Size            | Size of sphere within X, Y, Z directions                                      |
| Geometry Detail | Approximate amount of elements to create the sphere                           |
| Smoothing       | Whether to use Linear or Nearest neighbor when resizing and sampling textures |
| Texture         | Images to use for the sphere texture dependent on mapping                     |

### Installation

You may load this plugin in one of two ways: URL or File.

Loading through URL is the recommended way, but the steps remain largely the same. 

#### URL

1. On the Blockbench menu bar, navigate to `File` > `Plugins` > `Load Plugin from URL` (located by hovering over the ellipses)
2. In the dialog box, paste the following:
   ```
   https://github.com/dylan-dang/sphere-generator/releases/latest/download/sphere_generator.js
   ```
5. Hit "Confirm"
6. Press "OK" when prompted to allow plugin changes

#### File

1. Head to the [latest release](https://github.com/dylan-dang/sphere-generator/releases/latest) and download [sphere_generator.js](https://github.com/dylan-dang/sphere-generator/releases/latest/download/sphere_generator.js)
2. On the Blockbench menu bar, navigate to `File` > `Plugins` > `Load Plugin from File` (located by hovering over the ellipses)
3. Select the "sphere_generator.js" you downloaded in step 1
4. Press "OK" when prompted to allow plugin changes
