import { SectionType, builtIns } from './godot.js';

export let subIdMap: StringObject = {};
export let extIdMap: StringObject = {};

// Props for entries e.g. [node prop="value" ...]
export function buildProps(attributes: Attributes, isRootNode: boolean, type: SectionType, insideTags: string[], sceneUid: string, uid: string) {
  if (type === 'ext_resource' && uid) {
    attributes.uid = uid;
  }

  let props = Object.entries(attributes).filter(a => builtIns[type].includes(a[0].replace(':', '')));

  // The first node in the file - do not include a parent attribute.
  if (!isRootNode && type === 'node') {
    if (insideTags.length > 1) {
      props.push(['parent', insideTags[insideTags.length - 1]]);
    }
    else {
      props.push(['parent', '.']);
    }
  }

  let nameIdx = props.findIndex(a => a[0] === 'id');
  if (nameIdx >= 0) {
    let n = props.splice(nameIdx, 1);
    props.push(n[0]);
  }

  return props.map(a => mapProps(a, type, sceneUid));
}

function mapProps(attribute: string[], type: string, sceneUid: string) {
  let [name, value] = attribute;
  let isColon = false;

  if (name.startsWith(':')) {
    isColon = true;
    name = name.slice(1);
  }

  if (isColon && extIdMap[value]) value = `ExtResource("${extIdMap[value]}")`;

  // Let users use paths without "res" scheme
  if (type === 'ext_resource' && name === 'path') value = "res://" + value;

  // Add unique suffixes to ids & add to a lookup table
  if (type === 'ext_resource' && name === 'id') {
    if (!extIdMap[value]) extIdMap[value] = `${value}_${sceneUid.substring(0, 5)}`;
    return `${name}="${extIdMap[value]}"`;
  }
  else if (type === 'sub_resource' && name === 'id') {
    if (!subIdMap[value]) subIdMap[value] = `${value}_${sceneUid.substring(0, 5)}`;
    return `${name}="${subIdMap[value]}"`;
  }

  if (isColon) {
    return `${name}=${value}`;
  }
  else {
    return `${name}="${value}"`;

  }
}

export type Attributes = {
  [name: string]: string
}

type StringObject = Record<string, string>;