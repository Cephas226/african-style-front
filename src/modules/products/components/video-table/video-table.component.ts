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
import {Product, Video} from '@modules/products/models';
import { ProductService } from '@modules/products/services';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'video-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './video-table.component.html',
    styleUrls: ['video-table.component.scss'],
})
export class VideoTableComponent implements OnInit {
    @Input() pageSize =20;
    page: number = 1;
    //product$!: Observable<Product[]>;
    video$!: Observable<Video[]>;
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
    private videoId: any;
    private updateProductForm: any;

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
        this.productService.getVideo();

        this.productService.pageSize = this.pageSize;
        this.video$ = this.productService.video;
        this.total$ = this.productService.total$;

        this.dropdownList = [
            { categorie_id: 1, categorie: 'Homme' },
            { categorie_id: 2, categorie: 'Femme' },
            { categorie_id: 3, categorie: 'Couple' },
            { categorie_id: 4, categorie: 'Enfant' },
            { categorie_id: 5, categorie: 'Video' },
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
    onSelect(event: { addedFiles: any; }) {
        console.log(...event.addedFiles)
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
                               /* if (event.ok){
                                    let product = {data:event.body.data,categorie: this.selectedItems[0]["categorie"],vues:10,note:3}
                                    this.modeleService.createProduct(product).subscribe(e=>{
                                        this.modeleService.getModeles()
                                    })
                                }*/
                               if (event instanceof HttpResponse) {
                                    console.log(event.body)
                                    let video = {url:"http://localhost:8080/files/"+event.body.id}
                                    this.productService.createVideo(video).subscribe(e=>{
                                        this.productService.getVideo()
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

    editProduct(product: Product) {}

    deleteProductModal(targetModal: any, product: any) {
        this.videoId = product.videoId
        console.log(this.videoId)
        this.modalService.open(targetModal, {
            centered: true,
            backdrop: 'static'
        });
    }
}
