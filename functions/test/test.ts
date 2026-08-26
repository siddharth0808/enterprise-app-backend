import {handler} from '../invoices/handler'
import { event } from './events/lambda'

handler(event as any).then((res)=>{
    console.log(res)
}).catch(error=> console.log(error))