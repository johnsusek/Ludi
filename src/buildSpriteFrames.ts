import { subIdMap } from './buildProps.js';

export let spriteFrameAnimations = [];

export function buildAnimation(attributes: any) {
  let frames = [];
  let framesParts = attributes.frames.split(',');

  for (let frame of framesParts) {
    let [duration, texture] = frame.trim().split(/\s+/);
    let frameEntry = `{ "duration": ${duration}, "texture": SubResource("${subIdMap[texture]}") }`;
    frames.push(frameEntry);
  }

  let animation = `{
  "frames": [ ${frames.join(', ')} ],
  "loop": ${attributes[':loop']},
  "name": &"${attributes.name}",
  "speed": ${attributes[':speed']}
}`;

  attributes.frames = frames;
  spriteFrameAnimations.push(animation);
}

export function enterTag() {
  spriteFrameAnimations = [];
}

export function exitTag() {
  let anims = `animations = [ ${spriteFrameAnimations.join(',')} ]\n`;
  spriteFrameAnimations = [];
  return anims;
}
