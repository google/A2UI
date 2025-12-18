import fs from 'fs-extra';
import path from 'path';

export async function loadSchemas() {
  const schemaDir = path.resolve(__dirname, '../../../../specification/0.9/json');
  
  if (!fs.existsSync(schemaDir)) {
    throw new Error(`Could not find schema directory at ${schemaDir}. Please run from within the A2UI repo.`);
  }

  const load = async (name: string) => fs.readJson(path.join(schemaDir, name));

  return {
    serverToClient: await load('server_to_client.json'),
    commonTypes: await load('common_types.json'),
    standardCatalog: await load('standard_catalog_definition.json'),
  };
}
