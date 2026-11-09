import type { MedusaContainer } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function seed({ container }: { container: MedusaContainer }) {
  const productModuleService = container.resolve(Modules.PRODUCT) as any
  const regionModuleService = container.resolve(Modules.REGION) as any
  const storeModuleService = container.resolve(Modules.STORE) as any
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL) as any
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT) as any
  const workflowsService = container.resolve('workflows') as any

  const categories = [
    { name: 'Precolombinas', handle: 'precolombinas', description: 'Figuras precolombinas' },
    { name: 'Virreinales', handle: 'virreinales', description: 'Epoca virreinal' },
    { name: 'Independencia', handle: 'independencia', description: 'Heroes de la independencia' },
    { name: 'Revolucionarias', handle: 'revolucionarias', description: 'Revolucion mexicana' },
    { name: 'Artistas Plasticos', handle: 'artistas-plasticos', description: 'Grandes artistas' },
    { name: 'Escritores', handle: 'escritores', description: 'Escritores y poetas' },
    { name: 'Mitologia y Leyendas', handle: 'mitologia-leyendas', description: 'Mitos y leyendas' },
    { name: 'Ciencia y Conocimiento', handle: 'ciencia-conocimiento', description: 'Cientificos' },
  ].map((category) => ({ ...category, is_active: true }))

  for (const cat of categories) {
    const existing = await productModuleService.listProductCategories({ handle: cat.handle })
    if (existing.length === 0) {
      await productModuleService.createProductCategories([cat])
      console.log(`[seed] Created category: ${cat.name}`)
    } else if (!existing[0].is_active) {
      // The Store API hides inactive categories; reactivate anything seeded before.
      await productModuleService.updateProductCategories(existing[0].id, {
        is_active: true,
      })
      console.log(`[seed] Activated category: ${cat.name}`)
    } else {
      console.log(`[seed] Category already exists: ${cat.name}`)
    }
  }

  // Region (Chile / CLP)
  let regions = await regionModuleService.listRegions({})
  let region = regions.find((r: any) => r.currency_code === 'clp')
  if (!region) {
    region = await regionModuleService.createRegions({
      name: 'Chile',
      currency_code: 'clp',
      countries: ['cl'],
      automatic_taxes: true,
    })
    console.log(`[seed] Created region: ${region.name}`)
  } else {
    console.log(`[seed] Region already exists: ${region.name}`)
  }

  const stores = await storeModuleService.listStores({})
  if (stores.length) {
    await storeModuleService.updateStores(stores[0].id, { default_region_id: region.id })
    console.log('[seed] Default store region updated')
  }

  const existingProducts = await productModuleService.listProducts({ handle: 'violeta-parra' })
  const artistCategories = await productModuleService.listProductCategories({ handle: 'artistas-plasticos' })
  const artistCategoryId = artistCategories[0]?.id

  if (existingProducts.length === 0) {
    const salesChannels = await salesChannelModuleService.listSalesChannels({})
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({})

    await workflowsService.run('create-products', {
      input: {
        products: [
          {
            title: 'Violeta Parra',
            handle: 'violeta-parra',
            subtitle: 'Figura artesanal homenaje',
            description:
              'Figura Artesanal: Homenaje a Violeta Parra. Lleva a tu hogar un pedazo de la historia y el alma de la cultura latinoamericana con esta maravillosa figura artesanal inspirada en Violeta Parra. Esculpida y pintada a mano con un profundo nivel de detalle.',
            thumbnail: '/figuras/violeta1.jpg',
            status: 'published',
            category_ids: artistCategoryId ? [artistCategoryId] : [],
            sales_channels: salesChannels.length ? [{ id: salesChannels[0].id }] : [],
            shipping_profile_id: shippingProfiles.length ? shippingProfiles[0].id : undefined,
            options: [{ title: 'Tipo', values: ['Unica'] }],
            variants: [
              {
                title: 'Violeta Parra',
                sku: 'VIOLETA-001',
                options: { Tipo: 'Unica' },
                prices: [{ amount: 150000, currency_code: 'clp' }],
                manage_inventory: false,
                allow_backorder: true,
              },
            ],
          },
        ],
      },
    })
    console.log('[seed] Created product: Violeta Parra')
  } else if (artistCategoryId) {
    // Idempotent correction for databases seeded with the old (wrong) category.
    const [product] = await productModuleService.listProducts(
      { id: existingProducts[0].id },
      { relations: ['categories'] },
    )
    const currentCategoryIds = (product?.categories ?? []).map(
      (category: { id: string }) => category.id,
    )

    if (!currentCategoryIds.includes(artistCategoryId)) {
      await productModuleService.updateProducts(existingProducts[0].id, {
        category_ids: [artistCategoryId],
      })
      console.log('[seed] Moved Violeta Parra to category: artistas-plasticos')
    } else {
      console.log('[seed] Product already exists: Violeta Parra')
    }
  } else {
    console.warn('[seed] Category artistas-plasticos not found; product not corrected')
  }

  console.log('[seed] Done')
}