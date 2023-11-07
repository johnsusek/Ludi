#!/usr/bin/env node
import { buildComponent } from './parse';

(async () => {
  try {
    if (!process.argv[2]) throw Error('ludi <component.gue>');
    let arg = process.argv[2];
    if (arg.match(/^\w+/)) arg = './' + arg;
    await buildComponent(arg);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
