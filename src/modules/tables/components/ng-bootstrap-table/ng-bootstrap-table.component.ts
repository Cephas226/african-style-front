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
import { SBSortableHeaderDirective, SortEvent } from '@modules/tables/directives';
import {Product} from '@modules/tables/models';
import { CountryService } from '@modules/tables/services';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'sb-ng-bootstrap-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ng-bootstrap-table.component.html',
    styleUrls: ['ng-bootstrap-table.component.scss'],
})
export class NgBootstrapTableComponent implements OnInit {
    @Input() pageSize = 4;

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

    constructor(private sanitizer: DomSanitizer,
        private modalService: NgbModal,
        private fb:FormBuilder,
        public modeleService: CountryService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        this.updateProductForm = this.fb.group({
            productId:new FormControl(''),
            categorie: new FormControl('',   Validators.required),
        });
    }

    ngOnInit() {
        this.modeleService.pageSize = this.pageSize;
        this.product$ = this.modeleService.product;
        this.total$ = this.modeleService.total$;

        this.dropdownList = [
            { categorie_id: 1, categorie: 'Homme' },
            { categorie_id: 2, categorie: 'Femme' },
            { categorie_id: 3, categorie: 'Couple' },
            { categorie_id: 4, categorie: 'Enfant' },
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
        this.modeleService.sortColumn = column;
        this.modeleService.sortDirection = direction;
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
    onSelect(event: { addedFiles: any; }) {
        this.files?.push(...event.addedFiles);
        if (this.files) {
            const file: File | null = this.files[0];
            if (file) {
                this.currentFile = file;
                this.modeleService.upload(this.currentFile).subscribe(
                    (event: any) => {
                        if (event instanceof HttpResponse) {
                            let product = {data:event.body.data,categorie: this.selectedItems[0]["categorie"],vues:10,note:3}
                            this.modeleService.createProduct(product).subscribe(e=>{
                                this.modeleService.getModeles()
                            })
                            this.message = event.body.message;
                            this.fileInfos = this.modeleService.getFiles();
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
        this.selectedItems=[]
        this.files=undefined
    }

    deleteProduct() {
        this.modalService.dismissAll();
        this.modeleService.deleteProduct(this.productId)
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
