import {handler} from '../functions/invoices'
import { event } from './events/lambda'

handler(event as any).then((res)=>{
    console.log(res)
}).catch(error=> console.log(error))