import {HairDressService} from '@modules/productsmode/services/hairDress.service';
import { ProductService } from './product.service';

export const services = [ ProductService,HairDressService];

export * from './product.service';
export * from './hairDress.service';
