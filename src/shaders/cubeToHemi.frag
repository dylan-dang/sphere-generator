precision mediump float;
uniform samplerCube cubemap;
varying vec2 texCoord;

uniform vec2 angle;
uniform vec4 rotation;

#define initialPhi angle.x
#define initialTheta angle.y

#define u texCoord.x
#define v texCoord.y

void main() {
    //formula is from https://en.wikipedia.org/wiki/Orthographic_map_projection
    float rho = length(texCoord);
    if (rho>1.0) return;
    float c = asin(rho);

    float phi = asin(cos(c)*sin(initialPhi) + v*sin(c)*cos(initialPhi)/rho);
    float theta = initialTheta + atan(u*sin(c), rho*cos(c)*cos(initialPhi) - v*sin(c)*sin(initialPhi));

    vec3 direction = vec3(cos(phi)*cos(theta), cos(phi)*sin(theta), sin(phi));
    direction = direction + 2.0*cross(cross(direction, rotation.xyz) + rotation.w * direction, rotation.xyz);
    //direction = direction + 2.0*cross(rotation.xyz, cross(rotation.xyz, direction) + rotation.w * direction);
    gl_FragColor = textureCube(cubemap, direction);
}