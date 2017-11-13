import {Component, OnInit} from '@angular/core';
import {GithubService} from "./github.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  untriaged = {count: -1, age: -1, url: '???'};
  mergeQueue = {count: -1, age: -1, url: '???'};
  untriagedComponents: {name: string, count: number, age: number, url: string}[] = [];

  constructor(private ghService: GithubService) {}

  async ngOnInit() {
    this.untriaged = await this.ghService.getUntriagedStuff();
    this.untriagedComponents = await this.ghService.getUntriagedComponentStuffForAllComponents();
    this.mergeQueue = await this.ghService.getMergeQueue();
  }
}
