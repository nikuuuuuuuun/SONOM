import { Module } from '@medusajs/framework/utils'
import SiiInvoicingService from './service'
import { SII_INVOICING_MODULE } from './constants'

export { SII_INVOICING_MODULE }

export default Module(SII_INVOICING_MODULE, {
  service: SiiInvoicingService,
})
