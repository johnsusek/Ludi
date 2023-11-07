import { Attributes } from './buildProps.js';


export function buildTracks(attributes: Attributes, idx: number) {
  let valueProps = Object.entries(attributes).filter(a => !a[0].startsWith('@'));
  let values = valueProps.map(mapTracks(idx));

  let entry = values.join('\n');
  if (entry) entry += '\n';

  return entry;
}
function mapTracks(idx: number) {
  return (attribute: string[]) => {
    let [name, value] = attribute;
    let isColon = false;

    if (name.startsWith(':')) {
      isColon = true;
      name = name.slice(1);
    }
    else {
      value = `"${value}"`;
    }

    name = `tracks/${idx}/${name}`;

    return `${name} = ${value}`;
  };
}
