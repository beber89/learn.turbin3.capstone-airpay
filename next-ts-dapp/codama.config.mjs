import { createFromRoot } from 'codama';

import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';

import { renderJavaScriptVisitor } from '@codama/renderers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';

import { fileURLToPath } from 'url';

// Get current directory (for ES modules)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the Anchor IDL
const idlPath = join(__dirname, 'idl', 'capstone_airpay_q3.json');
const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));

// Create Codama tree from Anchor IDL
const codama = createFromRoot(rootNodeFromAnchor(idl));


// Generate JavaScript/TypeScript client using Gill
codama.accept(
  renderJavaScriptVisitor(join(__dirname, 'lib', 'generated'), {
    dependencyMap: {
      'solanaAccounts': 'gill',
      'solanaAddresses': 'gill',
      'solanaCodecsCore': 'gill',
      'solanaCodecsDataStructures': 'gill',
      'solanaCodecsNumbers': 'gill',
      'solanaCodecsStrings': 'gill',
      'solanaErrors': 'gill',
      'solanaInstructions': 'gill',
      'solanaOptions': 'gill',
      'solanaPrograms': 'gill',
      'solanaRpcTypes': 'gill',
      'solanaSigners': 'gill',
    },
  })
);

console.log('✅ Program client generated successfully!');

