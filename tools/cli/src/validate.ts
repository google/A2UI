import fs from 'fs-extra';
import Ajv from 'ajv/dist/2020';
import chalk from 'chalk';
import path from 'path';


const SCHEMA_BASE_URL = "https://raw.githubusercontent.com/google/A2UI/main/specification/0.9/json";

async function loadSchema(name: string): Promise<any> {
   
    try {
        const response = await fetch(`${SCHEMA_BASE_URL}/${name}`);
        if (!response.ok) throw new Error(`Failed to fetch ${name}`);
        return await response.json();
    } catch (e) {
        console.error(chalk.red(`Could not load schema ${name}:`), e);
        process.exit(1);
    }
}

export async function validateFile(filePath: string, version: string): Promise<boolean> {
 
  let content;
  try {
    content = await fs.readJson(filePath);
  } catch (error) {
    console.error(chalk.red(`Error reading file: ${(error as Error).message}`));
    return false;
  }

  
  const serverSchema = await loadSchema('server_to_client.json');
  const commonTypes = await loadSchema('common_types.json');
  const standardCatalog = await loadSchema('standard_catalog_definition.json');


  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(commonTypes);
  ajv.addSchema(standardCatalog);
  
  ajv.addSchema(serverSchema, 'server_to_client');

  const validateFn = ajv.getSchema('server_to_client');

  if (!validateFn) {
      console.error(chalk.red("Failed to initialize validator function"));
      return false;
  }

  const messages = Array.isArray(content) ? content : [content];
  let hasErrors = false;

  messages.forEach((msg, index) => {
    const valid = validateFn(msg);
    
    if (valid) {
      console.log(chalk.green(`✓ Message ${index} is valid.`));
    } else {
      hasErrors = true;
      console.error(chalk.red(`✗ Message ${index} Invalid:`));
      validateFn.errors?.forEach(err => {
        console.error(chalk.yellow(`  - ${err.instancePath} ${err.message}`));
      });
    }
  });

  return !hasErrors;
}
