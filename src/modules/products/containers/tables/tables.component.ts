import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
    selector: 'sb-tables',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './tables.component.html',
    styleUrls: ['tables.component.scss'],
})
export class TablesComponent implements OnInit {
    private isImage?: boolean;

    constructor(private route:Router) {

    }
    ngOnInit() {
        this.route.url.includes("image")? this.isImage=true: this.isImage=false;
    }
}
