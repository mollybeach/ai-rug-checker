// path: src/data/model.ts

import fs from 'fs';
import path from 'path';

const modelDir = path.join(__dirname, 'data', 'model');

if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
}

// Now you can save the model
// model.save(`file://${modelDir}/my-model`)
