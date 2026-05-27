import type { MedusaContainer } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { IProductModuleService } from '@medusajs/framework/types'

export default async function seed({ container }: { container: MedusaContainer }) {
  const productModuleService = container.resolve(Modules.PRODUCT) as IProductModuleService

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
      console.log(`[seed] Created category: ${cat.name}`)
    } else {
      console.log(`[seed] Category already exists: ${cat.name}`)
    }
  }

  console.log('[seed] Done')
}
