import { camelCase, decamelize } from '../vendor/camelcase.js';
import * as crypto from 'crypto';

export { camelCase, decamelize };
let hasher = crypto.createHash('md5');

export function generateId(value) {
  return hasher.update(value.toString().trim()).digest("hex");
}
export function escapeBlocks(value: string) {
  let xml = value.replace(/<script(.*)>/g, '<script$1><![CDATA[');
  xml = xml.replace(/<\/script>/g, ']]></script>');
  return xml;
}
