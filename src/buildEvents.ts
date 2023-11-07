import { decamelize } from './util.js';
import { Attributes } from './buildProps.js';

export function buildEvents(attributes: Attributes, from: string, rootName: string, insideNames: string[]) {
  let valueProps = Object.entries(attributes).filter(a => a[0].startsWith('@'));

  let connections: string[] = [];

  for (let prop of valueProps) {
    let [name, value] = prop as string[];
    // convert camelCase to underscores & remove `:` from prop name
    name = decamelize(name.slice(1));

    // Build NodePath from names e.g.
    // ['CanvasLayer', 'CenterContainer', 'Start'] -> CanvasLayer/CenterContainer/Start
    // Events from the root just use `.`
    let fromName = from === rootName ? '.' : insideNames.filter((_, idx) => idx > 0).join('/');

    // Convert CanvasLayer.UI.update_shield to to="CanvasLayer/UI" method="update_shield"
    let parts = value.split('.');
    let method = parts.pop();
    let toName = parts.join('/') || '.';

    connections.push(`[connection signal="${name}" from="${fromName}" to="${toName}" method="${method}"]`);
  }

  return connections;
}
