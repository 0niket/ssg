import { readFileSync } from 'fs';
import { join } from 'path';

// Read config file
const config = JSON.parse(
    readFileSync(join(process.cwd(), 'ssg_config.json'), 'utf-8')
);

console.log('Static Site Generator Starting...');
console.log('Config loaded:', config);

// TODO: Implement static site generation logic

