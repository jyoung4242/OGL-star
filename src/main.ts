import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Assets } from "@peasy-lib/peasy-assets";
import { Input } from "@peasy-lib/peasy-input";
import { Renderer, Camera, Transform, Sphere, Program, Mesh, Orbit, Triangle, AttributeMap } from "ogl";

const model = {
  colorElem: undefined as undefined | HTMLInputElement,
  entity: undefined as undefined | HTMLElement,
  setColor: (e: any, m: any, a: any, o: any) => {
    let uColor: number[] = hexToVec3(e.target.value) as number[];
    program.uniforms.U_color.value = [...uColor];
  },
};

const template = `
<div class="app">
    <input type='color' \${==>colorElem} \${input@=>setColor} class="colorInput" />
    <div class="entity" \${==>entity}></div>
</div>
`;
await UI.create(document.body, model, template).attached;
if (!model.entity || !model.colorElem) throw new Error("peasy broken");
model.colorElem.value = "#ffffff";

const vertex = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`;

const fragment = `
precision mediump float;

varying vec2 vUv;

uniform vec2 U_resolution;
uniform float U_time;
uniform vec3 U_color;

float sdfCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 pixelCoords = (vUv - 0.5) * U_resolution;
  vec3 color = vec3(1.0,1.0,1.0);
  float d = sdfCircle(pixelCoords,50.0);
  color = vec3(mix(U_color, color,  step(0.0,d)));
  gl_FragColor = vec4(color, step(0.0,1.-d));
}
`;

const myRenderer = new Renderer();
const gl = myRenderer.gl;
//gl.clearColor(0.5, 0.5, 0.5, 0);
//gl.clearColor(1, 0, 0, 0);
myRenderer.setSize(100, 100);
model.entity.appendChild(gl.canvas);

const uniforms = {
  U_resolution: { value: [100.0, 100.0] },
  U_time: { value: 0.0 },
  U_color: { value: [1.0, 1.0, 1.0] },
};

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.blendEquation(gl.FUNC_ADD);

const geometry = new Triangle(gl, {});

const program = new Program(gl, { vertex, fragment, uniforms, transparent: true });
const mesh = new Mesh(gl, { geometry, program });
myRenderer.render({ scene: mesh });

const renderLoop = (dt: number) => {
  requestAnimationFrame(renderLoop);
  program.uniforms.U_time.value = dt * 0.001;
  myRenderer.render({ scene: mesh });
};

requestAnimationFrame(renderLoop);

function hexToVec3(hex: string): number[] | null {
  // Check if the input is a valid hex color code
  const hexRegex = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  if (!hexRegex.test(hex)) {
    console.error("Invalid hex color code");
    return null;
  }

  // Remove the hash character, if present
  hex = hex.replace(/^#/, "");

  // Parse the hex value into separate RGB components
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    // Expand short hex format (e.g., #abc to #aabbcc)
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  // Normalize RGB values to the range [0, 1]
  const vec3: number[] = [r / 255, g / 255, b / 255];
  return vec3;
}
