import * as fs from 'fs/promises';
import { extname, join } from 'path';

async function parseFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  let lines = content.split('\n');

  let currentSection = '';
  let json = {};
  let multiLineValue;
  let multiLineKey;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      json[currentSection] = {};
    } else if (line.endsWith('{')) {
      let [key, value] = line.split('=')
      multiLineKey = [key.trim()];
      multiLineValue = [value.trim()];
    } else if (line.endsWith('}')) {
      multiLineValue.push(line);
      json[currentSection][multiLineKey] = JSON.parse(multiLineValue.join(''));
      multiLineValue = undefined;
    } else if (multiLineValue !== undefined) {
      multiLineValue.push(line);
    } else {
      let [key, value] = line.split('=');
      if (key.includes('/')) {
        let [parent, child] = key.split('/');
        if (!(parent in json[currentSection])) {
          json[currentSection][parent] = {};
        }
        json[currentSection][parent][child] = parseValue(value);
      } else {
        json[currentSection][key] = parseValue(value);
      }
    }
  }

  return json;
}

function parseValue(value = '') {
  if (value.startsWith('[') && value.endsWith(']')) {
    let elements = value.slice(1, -1).split(",");
    return elements.map(element => parseValue(element.trim()));
  }

  let f = parseFloat(value);
  let i = parseInt(value, 10);
  let b = value === 'true' ? true : value === 'false' ? false : undefined;
  let parsed = isNaN(f) ? isNaN(i) ? b === undefined ? value : b : i : f;

  if (typeof parsed === 'string') parsed = parsed.slice(1, -1);

  return parsed;
}

export async function buildImports(directory) {
  let files = await fs.readdir(directory, { recursive: true });
  let importFiles = files.filter(file => extname(file) === '.import')
  let res: any[] = await Promise.all(importFiles.map(file => parseFile(join(directory, file))));
  let map = {};
  for (const r of res) {
    map[r.deps.source_file.slice(6)] = r;
  }
  return map;
}
