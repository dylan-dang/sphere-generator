Sphere Generator lets you create spherical block models within BlockBench.

It works by creating a specified amount of cubes in the shape of sphere and then texturing each side to a an pre-rendered sphere.
As you increase geometry detail, the model becomes closer and closer to a sphere.

The generator can be accessed by `Tools > Sphere Generator`.

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
