import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { A2UIValidator } from '../lib/validator';
import { loadSchemas } from '../lib/schema-loader';

export async function validateAction(filePath: string) {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(chalk.red(`Error: File not found at ${absolutePath}`));
    process.exit(1);
  }

  console.log(chalk.blue(`Validating ${path.basename(absolutePath)}...`));

  try {
    const content = await fs.readJson(absolutePath);
    const messages = Array.isArray(content) ? content : [content];

    const schemas = await loadSchemas();
    const validator = new A2UIValidator(schemas);

    const errors = validator.validate(messages);

    if (errors.length > 0) {
      console.error(chalk.red('Validation Failed:'));
      errors.forEach(err => {
        console.error(chalk.yellow(`- ${err}`));
      });
      process.exit(1);
    } else {
      console.log(chalk.green('? Validation Passed'));
    }

  } catch (error) {
    console.error(chalk.red('An unexpected error occurred:'), error);
    process.exit(1);
  }
}
