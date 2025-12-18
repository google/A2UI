import { Command } from 'commander';
import { validateAction } from './commands/validate';

const program = new Command();

program
  .name('a2ui')
  .description('A2UI Developer Tools')
  .version('0.1.0');

program
  .command('validate')
  .description('Validate an A2UI JSON file against the specification')
  .argument('<file>', 'Path to the JSON file to validate')
  .action(validateAction);

program.parse();
