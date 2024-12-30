class BskyTimeline extends HTMLElement {
  static observedAttributes = ['page-size', 'src'];
  static #defaultTimelinePageSize = 30;
  static #urlRegex = /at:\/\/(?<authority>[^\/]+)\/(?<collection>[^\/]+)\/(?<rkey>[^\/]+)/;
  #pageSize = BskyTimeline.defaultTimelinePageSize;
  #feedUrl = '';

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}.`);
    switch(name) {
      case 'page-size':
        if (typeof(newValue) === 'string') {
          newValue = parseInt(newValue);
        }
        if (newValue !== NaN) {
          this.pageSize = newValue;
        }
        break;

      case 'src':
        this.src = newValue;
        this.cursor = '';
        this.getNextPage({replace: true}); // TODO: should we wait for this to finish?
        break;
    }
  }

  constructor() {
    super();
  }


  async getNextPage(options) {
    let response;
    if (this.src === '') {
      console.log('following');
      response = await document.agent.getTimeline({
        cursor: this.cursor,
        limit: this.pageSize,
      });
    } else {
      let match = this.src.match(BskyTimeline.#urlRegex);
      switch (match.groups.collection) {
        case 'app.bsky.graph.list':
          response = await document.agent.app.bsky.feed.getListFeed({
            cursor: this.cursor,
            limit: this.pageSize,
            list: this.src,
          });
          break;

        case 'app.bsky.feed.generator':
          response = await document.agent.app.bsky.feed.getFeed({
            cursor: this.cursor,
            feed: this.src,
            limit: this.pageSize,
          });
          break;

        default:
          console.log(`unsupported src "${this.src}"`);
          return;
      }
    }
    const { data } = response;
    console.log(data);
    const { feed: posts } = data;
    this.cursor = data.cursor;

    if (options.replace) {
      this.replaceChildren();
    }

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
