import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable()
export class GithubService {

  private ghAuthToken = environment.ghAuthToken;
  private labels;

  private async ghFetch(path: string) {
    const response = await fetch(`https://api.github.com/${path}`, {headers: {
      'Authorization': `token ${this.ghAuthToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }});
    return response.json();
  }


  private async getLabels() {
    if (!this.labels) {
      const labels1 = await this.ghFetch(`repos/angular/angular/labels`);
      const labels2 = await this.ghFetch(`repos/angular/angular/labels?page=2`);
      const labels3 = await this.ghFetch(`repos/angular/angular/labels?page=3`);
      this.labels = [].concat(labels1, labels2, labels3).map(({name}) => name);
    }
    return this.labels;
  }


  async getUntriagedStuff(): Promise<{ url:string, count: number, age: number }> {
    const labels = await this.getLabels();
    const componentLabels = labels.filter(label => label.startsWith("comp: "));
    const escapedComponentLabels = componentLabels.map(label => `-label:"${encodeURIComponent(label)}"`);

    const untriagedPath = `search/issues?q=repo:angular/angular+state:open+${escapedComponentLabels.join('+')}&sort=created&order=asc`;
    const untriagedStuff = await this.ghFetch(untriagedPath);
    return {
      url: `https://github.com/angular/angular/issues?q=is:open+${escapedComponentLabels.join('+')}+sort:created-asc`,
      count: untriagedStuff.total_count as number,
      age: untriagedStuff.total_count ? Math.round((Date.now() - Date.parse(untriagedStuff.items[0].created_at)) / (1000 * 60 * 60 * 24)) : 0
    };
  }


  async getUntriagedComponentStuffForAllComponents() {
    const labels = await this.getLabels();
    const componentLabels = labels.filter(label => label.startsWith("comp: "));
    //const componentLabels = [labels.filter(label => label.startsWith("comp: "))[0]];
    const componentsInfo: any[] = [];

    for (const componentLabel of componentLabels) {
      const componentName = componentLabel.split(': ')[1];
      const info = await this.getUntriagedComponentStuff(componentLabel);
      info['name'] = componentName;
      componentsInfo.push(info);
    }

    return componentsInfo;
  }


  async getUntriagedComponentStuff(componentLabel): Promise<{ url:string, count: number, age: number }> {
    const componentLabelUrlFragment = `label:${encodeURIComponent('"'+componentLabel+'"')}`;
    const labels = await this.getLabels();
    const secondaryLabels = labels.filter(label => label.startsWith('type')); //type|severity|frequency
    const escapedSecondaryLabels = secondaryLabels.map(label => `-label:"${encodeURIComponent(label)}"`).join('+');

    const untriagedPath = `search/issues?q=repo:angular/angular+state:open+${componentLabelUrlFragment}+${escapedSecondaryLabels}&sort=created&order=asc`;
    const untriagedStuff = await this.ghFetch(untriagedPath);
    return {
      url: `https://github.com/angular/angular/issues?q=is:open+${componentLabelUrlFragment}+${escapedSecondaryLabels}+sort:created-asc`,
      count: untriagedStuff.total_count as number,
      age: untriagedStuff.total_count ? Math.round((Date.now() - Date.parse(untriagedStuff.items[0].created_at)) / (1000 * 60 * 60 * 24)) : 0
    };
  }


  async getMergeQueue() {
    const mergeQueuePath = `search/issues?q=repo:angular/angular+state:open+label:${encodeURIComponent('"PR action: merge"')}&sort=created&order=asc`;
    const mergeQueue = await this.ghFetch(mergeQueuePath);
    return {
      url: `https://github.com/angular/angular/pulls?q=is%3Aopen+is%3Apr+label%3A%22PR+action%3A+merge%22`,
      count: mergeQueue.total_count as number,
      age: mergeQueue.total_count ? Math.round((Date.now() - Date.parse(mergeQueue.items[0].updated_at)) / (1000 * 60 * 60 * 24)) : 0
    };
  }
}
