
export let builtIns = {
  node: ['name', 'type', 'parent', 'group', 'instance'],
  connection: ['signal', 'from', 'to', 'method'],
  sub_resource: ['type', 'id'],
  ext_resource: ['type', 'id', 'path', 'uid'],
};

export const ResourceTypes = ['ext_resource', 'sub_resource'];

export type SectionType = 'node' | 'ext_resource' | 'sub_resource';

