import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as sax from "../vendor/sax.js";
import { generateId } from './util.js';
import { buildProps } from './buildProps.js';
import { buildValues } from './buildValues.js';
import { buildEvents } from './buildEvents.js';
import { buildTracks } from './buildTracks';
import { SectionType } from './godot';
import { buildImports } from './processImports';
import { escapeBlocks } from './util';
import * as SpriteFrames from './buildSpriteFrames';

let isInScript = false;
let isInScene = false;
let isRootNode = true;
let isInsideSpriteFrames = false;
let resOutput = [];
let sresOutput = [];
let nodeOutput = [];
let loadSteps = 1;
let trackIdx = 0;
let insideNames = [];
let rootName = '';
let connections = [];
let sceneUid = '';
let importsData = {};

function onText(file: string) {
  let parts = path.parse(file);

  return async (text: string) => {
    if (!isInScript) return;
    let outPath = path.join(parts.dir, parts.base.replace('.gue', '.gd'));
    let outText = text.trim() + "\n";
    await fs.writeFile(outPath, outText);
  };
}

function onOpenTag(file: string) {
  let parts = path.parse(file);
  let filename = parts.base;

  return ({ name: tag, attributes }: { name: any; attributes: any; }) => {
    if (tag === 'script') {
      isInScript = true;
    }
    if (tag === 'root') return;
    if (tag === 'template') return;

    let line = '';

    // Only runs on the first outer scene
    if (tag === 'Scene' && !isInScene) {
      isInScene = true;
      return;
    }

    if (isInScene && isRootNode) {
      rootName = attributes.name;

      if (!attributes[':script']) {
        attributes[':script'] = `${parts.name}Script`;
      }
    }

    let sectionType: SectionType = isInScene ? 'node' : attributes.path ? 'ext_resource' : 'sub_resource';
    let props = buildProps(attributes, isInScene && isRootNode, sectionType, insideNames, sceneUid, importsData[attributes.path]?.remap.uid);

    insideNames.push(attributes.name);

    // For parent logic (no parent prop on the root node under Scene)
    if (isInScene && sectionType === 'node') {
      isRootNode = false;
    }

    if (sectionType === 'sub_resource' && tag === 'Animation') trackIdx = 0;

    if (sectionType === 'sub_resource' && tag === 'SpriteFrames') {
      isInsideSpriteFrames = true;
      SpriteFrames.enterTag();
    }

    if (isInsideSpriteFrames && tag === 'Animation') {
      SpriteFrames.buildAnimation(attributes);
      return;
    }

    if (sectionType === 'sub_resource' && tag === 'Track') {
      line += buildTracks(attributes, trackIdx++);
    }
    else if (tag === 'script' && !attributes.path) {
      delete attributes.lang;
      let scriptname = filename.replace('.gue', '.gd');
      line += `[ext_resource type="Script" path="res://${scriptname}" id="${filename.replace('.gue', '') + 'Script'}_${sceneUid.substring(0, 5)}"]\n`;
    }
    else {
      let typeName = tag === 'Scene' ? '' : `type="${tag}"`;
      if (typeName) props.splice(attributes.name ? 1 : 0, 0, typeName);
      line += `[${sectionType} ${props.join(' ').trim()}]\n`;

      let entry = buildValues(attributes, sectionType, sceneUid).trim();
      let isAnimation = tag === 'Animation';
      if (entry && !isAnimation) entry += '\n';

      line += entry;
    }

    if (tag === 'script') {
      loadSteps++;
      resOutput.unshift(line);
    }
    else if (sectionType === 'node') {
      connections = [...connections, ...buildEvents(attributes, attributes.name, rootName, insideNames)];
      nodeOutput.push(line);
    }
    else if (sectionType === 'sub_resource') {
      loadSteps++;
      sresOutput.push(line);
    }
    else {
      loadSteps++;
      resOutput.push(line);
    }
  };
}

export async function buildComponent(file: string) {
  let parts = path.parse(file);
  importsData = await buildImports(parts.dir);
  sceneUid = generateId(parts.base);

  let saxParser = sax.parser(true, {
    trim: true,
    normalize: false,
    xmlns: false
  });

  saxParser.onerror = (err) => {
    console.error(err);
    throw err;
  };

  saxParser.oncdata = onText(file);
  saxParser.onopentag = onOpenTag(parts.base);

  saxParser.onclosetag = (name) => {
    insideNames.pop();
    if (isInsideSpriteFrames && name === 'SpriteFrames') {
      isInsideSpriteFrames = false;
      let anims = SpriteFrames.exitTag();
      sresOutput.push(anims);
    }
  }

  saxParser.onend = async () => {
    // Use filename for scene identity
    let out = assembleScene(sceneUid);
    await fs.writeFile(path.join(parts.dir, parts.base.replace('.gue', '.tscn')), out);
  };

  let xml = await fs.readFile(file, { encoding: 'utf-8' });
  saxParser.write(`<root>${escapeBlocks(xml)}</root>`).close();
}

function assembleScene(key: string) {
  let out = `[gd_scene load_steps=${loadSteps} format=3 uid="uid://${key}"]\n\n`;

  out += resOutput.join('') + '\n';
  out += sresOutput.join('\n') + '\n';
  out += nodeOutput.join('\n') + '\n';
  out += connections.join('\n') + '\n';

  return out;
}


