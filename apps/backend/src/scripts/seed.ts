import { MedusaAppLoader } from '@medusajs/framework'

async function seed() {
  console.log('Starting Sonom seed...')
  const loader = new MedusaAppLoader()
  await loader.load()

  const container = loader.container
  const productModuleService = container.resolve('productModuleService')

  const categories = [
    { name: 'Precolombinas', handle: 'precolombinas', description: 'Figuras precolombinas' },
    { name: 'Virreinales', handle: 'virreinales', description: 'Epoca virreinal' },
    { name: 'Independencia', handle: 'independencia', description: 'Heroes de la independencia' },
    { name: 'Revolucionarias', handle: 'revolucionarias', description: 'Revolucion mexicana' },
    { name: 'Artistas Plasticos', handle: 'artistas-plasticos', description: 'Grandes artistas' },
    { name: 'Escritores', handle: 'escritores', description: 'Escritores y poetas' },
    { name: 'Mitologia y Leyendas', handle: 'mitologia-leyendas', description: 'Mitos y leyendas' },
    { name: 'Ciencia y Conocimiento', handle: 'ciencia-conocimiento', description: 'Cientificos' },
  ]

  for (const cat of categories) {
    const existing = await productModuleService.listProductCategories({ handle: cat.handle })
    if (existing.length === 0) {
      await productModuleService.createProductCategories([cat])
      console.log(`Created category: ${cat.name}`)
    }
  }

  console.log('Seed completed!')
}

seed().catch(console.error)
