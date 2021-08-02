import { DecimalPipe } from '@angular/common';
import {HttpClient, HttpEvent, HttpRequest} from '@angular/common/http';
import { Injectable, PipeTransform } from '@angular/core';
import { SortDirection } from '@modules/productsmode/directives';
import {HairDress, Product, Video, VideoHairDress} from '@modules/productsmode/models';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, switchMap, tap } from 'rxjs/operators';

interface SearchResult {
    hairDress: HairDress[];
    total: number;
}


interface State {
    page: number;
    pageSize: number;
    searchTerm: string;
    sortColumn: string;
    sortDirection: SortDirection;
}

function compare(v1: number | string, v2: number | string) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(hairDress: any[], column: string, direction: string): HairDress[] {
    if (direction === '') {
        return hairDress;
    } else {
        return [...hairDress].sort((a, b) => {
            const res = compare(a[column], b[column]);
            return direction === 'asc' ? res : -res;
        });
    }
}

function matches(hairDress: HairDress, term: string, pipe: PipeTransform) {
    return (
        hairDress?.categorie?.toLowerCase().includes(term?.toLowerCase()) ||
        pipe.transform(hairDress.vues).includes(term) ||
        pipe.transform(hairDress.note).includes(term)
    );
}

@Injectable({ providedIn: 'root' })
export class HairDressService {
    private _loading$ = new BehaviorSubject<boolean>(true);
    private _search$ = new Subject<void>();
    private _hairDress$ = new BehaviorSubject<HairDress[]>([]);
    private _videoDress$ = new BehaviorSubject<VideoHairDress[]>([]);

    private _totalHairDress$ = new BehaviorSubject<number>(0);
    private baseUrl = 'https://myafricanstyle.herokuapp.com';
    private _state: State = {
        page: 1,
        pageSize: 4,
        searchTerm: '',
        sortColumn: '',
        sortDirection: '',
    };

    constructor(private pipe: DecimalPipe,private http: HttpClient) {
       this.getHairDress()
    }

    get hairDress() {
        return this._hairDress$.asObservable();
    }
    get video() {
        return this._videoDress$.asObservable();
    }
    get totalHairDress$() {
        return this._totalHairDress$.asObservable();
    }
    get loading$() {
        return this._loading$.asObservable();
    }
    get page() {
        return this._state.page;
    }
    set page(page: number) {
        this._set({ page });
    }
    get pageSize() {
        return this._state.pageSize;
    }
    set pageSize(pageSize: number) {
        this._set({ pageSize });
    }
    get searchTerm() {
        return this._state.searchTerm;
    }
    set searchTerm(searchTerm: string) {
        this._set({ searchTerm });
    }
    set sortColumn(sortColumn: string) {
        this._set({ sortColumn });
    }
    set sortDirection(sortDirection: SortDirection) {
        this._set({ sortDirection });
    }
    private _set(patch: Partial<State>) {
        Object.assign(this._state, patch);
        this._search$.next();
    }
    private _search(data: any[]): Observable<{ total: number; hairDresses: HairDress[] }> {
        const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

        // 1. sort
        let hairDresses = sort(data, sortColumn, sortDirection);

        // 2. filter
        hairDresses = hairDresses.filter(mod => matches(mod, searchTerm, this.pipe));
        const total = hairDresses.length;

        // 3. paginate
        hairDresses = hairDresses.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        return of({ hairDresses, total });
    }

    upload(file: File):Observable<HttpEvent<any>>{
        const formData: FormData = new FormData();
        formData.append('file', file);
        const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
            reportProgress: true,
            responseType: 'json'
        });
        return this.http.request(req);
    }

    getFiles(): Observable<any> {
        return this.http.get(`${this.baseUrl}/files`);
    }

    createHairDress(hairDress: any) {
        return this.http.post(`${this.baseUrl}/hair`, hairDress, {responseType: 'json'})
    }
    getHairDress(){
        return this.http.get(`${this.baseUrl}/hair`, { responseType: 'json' }).subscribe(
            (hair:any)=>{
                this._hairDress$.next(hair);
                this._totalHairDress$.next(hair.length)
                this._search$
                    .pipe(
                        tap(() => this._loading$.next(true)),
                        debounceTime(120),
                        switchMap(() => this._search(hair)),
                        delay(120),
                        tap(() => this._loading$.next(false))
                    )
                    .subscribe(result => {
                        this._hairDress$.next(result.hairDresses);
                        this._totalHairDress$.next(result.total);
                    });

                this._search$.next();
            }
        );
    }

    deleteHair(id: string | undefined){
        return this.http.delete(`${this.baseUrl}/hair/`+id, { responseType: 'json' }).subscribe(
            ()=> this.getHairDress()
        );
    }
    /*getVideo()      {
        return this.http.get(`${this.baseUrl}/video`, { responseType: 'json' }).subscribe(
            (video:any)=>{
                this._video$.next(video);
                this._total$.next(video.length)
                this._search$
                    .pipe(
                        tap(() => this._loading$.next(true)),
                        debounceTime(120),
                        switchMap(() => this._search(video)),
                        delay(120),
                        tap(() => this._loading$.next(false))
                    )
                    .subscribe(result => {
                        // this._product$.next(result.video);
                        this._total$.next(result.total);
                    });

                this._search$.next();
            }
        );
    }*/
    createVideo(product: any) {
        return this.http.post(`${this.baseUrl}/video`, product, {responseType: 'json'})
    }
    /*deleteVideo(id: string | undefined){
        return this.http.delete(`${this.baseUrl}/video/`+id, { responseType: 'json' }).subscribe(
            ()=> this.getVideo()
        );
    }*/
}
