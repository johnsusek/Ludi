import { builtIns } from './godot.js';
import { Attributes, extIdMap, subIdMap } from './buildProps.js';
import { decamelize } from './util.js';

// These are the lines underneath the [node]
export function buildValues(attributes: Attributes, type, sceneUid) {
  let valueProps = Object.entries(attributes)
    .filter(a => !builtIns[type].includes(a[0].replace(':', '')))
    .filter(a => !a[0].startsWith('@'));

  let values = valueProps.map(a => {
    let [name, value] = a as string[];
    let isColon = false;
    if (name.startsWith(':')) {
      isColon = true;
      name = name.slice(1);
    }

    name = decamelize(name);

    if (isColon && extIdMap[value]) value = `ExtResource("${extIdMap[value]}")`;
    else if (isColon && subIdMap[value]) value = `SubResource("${subIdMap[value]}")`;
    else if (isColon && name === 'script') value = `ExtResource("${value}_${sceneUid.substr(0, 5)}")`;
    else if (!isColon && !value.startsWith('&')) value = `"${value}"`;

    return `${name} = ${value}`;
  });

  let entry = values.join('\n');

  return entry;
}
