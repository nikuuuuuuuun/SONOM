function readPackage(pkg, context) {
  if (pkg.dependencies?.['@types/react']) {
    pkg.dependencies['@types/react'] = '19.0.5'
  }
  if (pkg.dependencies?.['@types/react-dom']) {
    pkg.dependencies['@types/react-dom'] = '19.0.5'
  }
  if (pkg.devDependencies?.['@types/react']) {
    pkg.devDependencies['@types/react'] = '19.0.5'
  }
  if (pkg.devDependencies?.['@types/react-dom']) {
    pkg.devDependencies['@types/react-dom'] = '19.0.5'
  }
  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
