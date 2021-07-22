import {HttpEventType, HttpResponse} from '@angular/common/http';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    QueryList,
    ViewChildren,
} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import { SBSortableHeaderDirective, SortEvent } from '@modules/products/directives';
import {Product} from '@modules/products/models';
import { ProductService } from '@modules/products/services';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'image-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './image-table.component.html',
    styleUrls: ['image-table.component.scss'],
})
export class ImageTableComponent implements OnInit {
    @Input() pageSize =20;
    page: number = 1;
    product$!: Observable<Product[]>;
    total$!: Observable<number>;
    sortedColumn!: string;
    sortedDirection!: string;

    @ViewChildren(SBSortableHeaderDirective) headers!: QueryList<SBSortableHeaderDirective>;
    closeResult: string | undefined;
    files?: File[] = [];

    selectedItems = [];
    dropdownSettings = {};
    private dropdownList: ({ categorie: string; categorie_id: number; } | { categorie: string; categorie_id: number; } | { categorie: string; categorie_id: number; } | { categorie: string; categorie_id: number; })[] | undefined;
    selectedFiles?: FileList;
    currentFile?: File;
    message = '';
    fileInfos?: Observable<any>;
    private productId: any;
    private updateProductForm: any;
    private progress=0;

    constructor(private sanitizer: DomSanitizer,
        private modalService: NgbModal,
        private fb:FormBuilder,
        public productService: ProductService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        this.updateProductForm = this.fb.group({
            productId:new FormControl(''),
            categorie: new FormControl('',   Validators.required),
        });
    }

    ngOnInit() {
        this.productService.getProduct();
        this.productService.pageSize = this.pageSize;
        this.product$ = this.productService.product;
        this.total$ = this.productService.total$;

        this.dropdownList = [
            { categorie_id: 1, categorie: 'Homme' },
            { categorie_id: 2, categorie: 'Femme' },
            { categorie_id: 3, categorie: 'Couple' },
            { categorie_id: 4, categorie: 'Enfant' }
        ];
        this.dropdownSettings = {
            singleSelection: true,
            idField: 'categorie_id',
            textField: 'categorie',
            selectAllText: 'Tout selectionnez',
            unSelectAllText: 'Deselectionnez tout',
            itemsShowLimit: 3,
            allowSearchFilter: true
        };
    }

    onSort({ column, direction }: SortEvent) {
        this.sortedColumn = column;
        this.sortedDirection = direction;
        this.productService.sortColumn = column;
        this.productService.sortDirection = direction;
        this.changeDetectorRef.detectChanges();
    }
    import(content: any) {
        this.modalService.open(content, { centered: true }).result.then(
            result => {
                this.closeResult = `Close with: ${result}`;
            },
            reason => {
                this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
            }
        );
    }
    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by Pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        } else {
            return `with: ${reason}`;
        }
    }
    onSelectImage(event: { addedFiles: any; }) {
        console.log(...event.addedFiles)
        this.progress = 0;
        this.files?.push(...event.addedFiles);
        if (this.files) {
            this.files.map(
                f=>{
                    const file: File | null = f;
                    if (file) {
                        this.currentFile = file;
                        this.productService.upload(this.currentFile).subscribe(
                            (event: any) => {
                                console.log(event)
                                if (event.type === HttpEventType.UploadProgress) {
                                    this.progress = Math.round(100 * event.loaded / event.total);
                                } else if (event instanceof HttpResponse) {
                                    console.log(event.body)
                                    let product = {url:"https://myafricanstyle.herokuapp.com/files/"+event.body.id,data:event.body.data,categorie: this.selectedItems[0]["categorie"],vues:10,note:3}
                                    this.productService.createProduct(product).subscribe(e=>{
                                        this.productService.getProduct()
                                    })
                                    this.message = event.body.message;
                                    this.fileInfos = this.productService.getFiles();
                                }
                            },
                            (err: any) => {
                                if (err.error && err.error.message) {
                                    this.message = err.error.message;
                                } else {
                                    this.message = 'Could not upload the file!';
                                }
                                this.currentFile = undefined;
                            });
                    }
                    this.selectedFiles = undefined;
                }
            )

        }
    }

    onRemove(event: File) {
        this.files?.splice(this.files.indexOf(event), 1);
    }
    onItemSelect(item: any) {
    }
    onSelectAll(items: any) {
    }
    sanitize(url: string) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
    }

    closeMe() {
        this.modalService.dismissAll('Cross Click')
        this.files = [];
    }

    deleteProduct() {
        this.modalService.dismissAll();
        this.productService.deleteProduct(this.productId)
    }

    editProduct(product: Product) {

    }

    deleteProductModal(targetModal: any, product: any) {
        this.productId = product.productId
        console.log(this.productId)
        this.modalService.open(targetModal, {
            centered: true,
            backdrop: 'static'
        });
    }
}
