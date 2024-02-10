attribute vec2 position;
varying vec3 pointOnCubeSurface;
uniform lowp int face;

#define u position.x
#define v position.y

#define NORTH face == 0
#define SOUTH face == 1
#define WEST  face == 2
#define LEFT  face == 3
#define UP    face == 4
#define DOWN  face == 5

void main() {
    //switch case not available in OpenGL-ES 2.0
    if      (NORTH) pointOnCubeSurface = vec3(-v, 1.0, -u);
    else if (SOUTH) pointOnCubeSurface = vec3(-v, -1.0, u);
    else if (WEST)  pointOnCubeSurface = vec3(1.0, u, v);
    else if (LEFT)  pointOnCubeSurface = vec3(-1.0, u, -v);
    else if (UP)    pointOnCubeSurface = vec3(-v, u, 1.0);
    else if (DOWN)  pointOnCubeSurface = vec3(-v, -u, -1.0);
    
    gl_Position = vec4(position, 0, 1.0);
}