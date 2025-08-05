const fs = require('fs');
const path = require('path');

console.log('📦 Preparando arquivos para deploy...');

// Criar estrutura
const deployDir = './deploy-ready';
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// Copiar arquivos essenciais
const filesToCopy = [
  'package.json',
  'dist/',
  'server/',
  'shared/',
  'public/'
];

filesToCopy.forEach(file => {
  const src = path.join('.', file);
  const dest = path.join(deployDir, file);
  
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      copyDirectory(src, dest);
    } else {
      copyFile(src, dest);
    }
    console.log(`✅ Copiado: ${file}`);
  } else {
    console.log(`⚠️  Não encontrado: ${file}`);
  }
});

// Criar package.json otimizado para produção
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  scripts: {
    start: "node dist/server/production.js"
  },
  dependencies: pkg.dependencies
};

fs.writeFileSync(
  path.join(deployDir, 'package.json'), 
  JSON.stringify(prodPkg, null, 2)
);

console.log('✅ Package.json otimizado criado');
console.log('📁 Arquivos prontos em: deploy-ready/');
console.log('📦 Agora zipe a pasta deploy-ready/ para upload');

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}
