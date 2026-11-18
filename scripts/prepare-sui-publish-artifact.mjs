// Converts an already-compiled Sui Move bundle into a SAME-ORIGIN, reviewable,
// immutable-source artifact. Runs in GitHub Actions only. Never signs transactions.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {validatePublishManifest,PUBLISH_FORMAT} from '../js/sui-publish-core.js';

const [,,compiledPath,outPath,revision]=process.argv;
if(!compiledPath||!outPath||!/^[a-f0-9]{40}$/.test(revision||'')){
  console.error('Usage: node scripts/prepare-sui-publish-artifact.mjs compiled.json dist/file.json GITHUB_SHA');
  process.exit(1);
}
let compiled;
try{compiled=JSON.parse(readFileSync(compiledPath,'utf8'));}
catch(e){console.error('Sui CLI did not emit a valid compiled package JSON:',e.message);process.exit(1);}
const bundle={format:PUBLISH_FORMAT,network:'testnet',
  packageName:'flurrycraft',sourceRevision:revision,
  modules:compiled.modules,dependencies:compiled.dependencies,digest:compiled.digest};
const verified=validatePublishManifest(bundle);
mkdirSync(dirname(outPath),{recursive:true});
writeFileSync(outPath,JSON.stringify(bundle),'utf8');
console.log('Validated '+verified.modules.length+' FlurryCraft Move modules, '+verified.dependencies.length+' dependencies.');
console.log('Compiled bytecode size: '+verified.byteLength+' bytes; source revision: '+verified.sourceRevision);
console.log('No wallet key, signature, Package ID or Testnet transaction is included.');
