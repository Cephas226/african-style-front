import { ProductService } from './product.service';
import { TablesService } from './tables.service';

export const services = [TablesService, ProductService];

export * from './tables.service';
export * from './product.service';
