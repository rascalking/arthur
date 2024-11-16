import { BskyAgent } from '@atproto/api'
import { creds } from './creds.js'


var agent; // TODO: something better than a global


async function getAgent(creds) {
  agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  await agent.login(creds);
  return agent;
}

class BskyTimeline extends HTMLElement {
  static observedAttributes = ['src', 'pageSize'];
  static #defaultTimelinePageSize = 30;

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}.`);
    // TODO: handle changes to src
    if (name === 'pageSize') {
      if (typeof(newValue) === 'string') {
        newValue = parseInt(newValue);
      }
      if (newValue !== NaN) {
        this._internals.pageSize = newValue;
      }
    }
  }

  connectedCallback() {
    this._internals.src = this.getAttribute('src');
    // TODO: actually handle src being defined (should be a feed url)
    this._internals.pageSize = this.getAttribute('pageSize') || BskyTimeline.defaultTimelinePageSize;
    this._internals.cursor = '';
    this.getNextPage()
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  async getNextPage() {
    const { data } = await agent.getTimeline({
      cursor: this._internals.cursor,
      limit: this._internals.pageSize,
    });
    console.log(data);
    const { feed: posts } = data;
    this._internals.cursor = ''; // TODO
    for (const post of posts) {
      const postWrapper = document.createElement('div');
      postWrapper.classList.add('post');

      const avatar = document.createElement('img');
      avatar.setAttribute('src', post.post.author.avatar);
      avatar.setAttribute('width', 50);
      avatar.setAttribute('height', 50);
      avatar.classList.add('avatar');

      const name = document.createElement('div');
      name.append(document.createTextNode(
        `${post.post.author.displayName} (@${post.post.author.handle})`));

      const text = document.createElement('div');
      for (const piece of post.post.record.text.split('\n')) {
        const div = document.createElement('p');
        div.append(document.createTextNode(piece));
        text.append(div);
      }

      const timestamp = document.createElement('div');
      timestamp.append(document.createTextNode(post.post.record.createdAt));

      postWrapper.append(avatar, name, text, timestamp);
      this.append(postWrapper);
    }
  }
}
customElements.define('bluesky-timeline', BskyTimeline);

async function showBskyTimeline() {
  const main = document.getElementsByTagName('main')[0];
  main.append(document.createElement('bluesky-timeline'));
}

getAgent(creds)
  .then((agent) => {
    showBskyTimeline();
  })
  .catch((error) => {
    console.error(error);
  })
