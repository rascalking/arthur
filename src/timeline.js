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
      console.debug('fetching following');
      response = await document.agent.getTimeline({
        cursor: this.cursor,
        limit: this.pageSize,
      });
    } else {
      let match = this.src.match(BskyTimeline.#urlRegex);
      switch (match.groups.collection) {
        case 'app.bsky.graph.list':
          console.debug('fetching list');
          response = await document.agent.app.bsky.feed.getListFeed({
            cursor: this.cursor,
            limit: this.pageSize,
            list: this.src,
          });
          break;

        case 'app.bsky.feed.generator':
          console.debug('fetching feed');
          response = await document.agent.app.bsky.feed.getFeed({
            cursor: this.cursor,
            feed: this.src,
            limit: this.pageSize,
          });
          break;

        default:
          console.error(`unsupported timeline src: ${this.src}`);
          return;
      }
    }
    console.debug(response);
    this.cursor = response.data.cursor;

    if (options.replace) {
      this.replaceChildren();
    }

    for (const post of response.data.feed) {
      this.append(await this.renderPost(post));
    }
  }

  async renderPost(data) {
    const rendered = document.createElement('div');
    rendered.classList.add('post');

    // data.reason means it's a (direct?) reskeet, and this.reason has the details
    if (data.reason) {
      if (data.reason.$type === 'app.bsky.feed.defs#reasonRepost') {
        const reskeet = document.createElement('div');
        reskeet.append(
          document.createTextNode(
            `⇌ Reskeeted by ${data.reason.by.displayName}`));
        rendered.append(reskeet);
      } else {
        // TODO: are there other valid reasons?
        console.error(`unknown reason: ${data.reason.$type}`);
        console.debug(data);
      }
    }

    const container = document.createElement('div');
    container.classList.add('post-contents-container');

    const avatar = document.createElement('img');
    avatar.setAttribute('src', data.post.author.avatar);
    avatar.classList.add('avatar');
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('post-avatar');
    avatarDiv.append(avatar);

    const contents = document.createElement('div');
    contents.classList.add('post-contents');
    const name = document.createElement('div');
    name.append(document.createTextNode(
      `${data.post.author.displayName} (@${data.post.author.handle}) @${data.post.indexedAt}`));
    contents.append(name);

    const text = document.createElement('div');
    text.classList.add('post-contents-text');
    text.append(document.createTextNode(data.post.record.text));
    contents.append(text);

    if (data.post.embed) {
      if (data.post.embed.$type === 'app.bsky.embed.images#view') {
        // TODO: lightbox popout for the images
        const images = document.createElement('div');
        images.classList.add('post-contents-images');
        for (const image of data.post.embed.images) {
          const img = document.createElement('img');
          img.setAttribute('alt', image.alt);
          img.setAttribute('src', image.thumb);
          img.classList.add('thumbnail');
          img.style.aspectRatio = image.aspectRatio.width / image.aspectRatio.height;
          images.append(img);
        }
        contents.append(images);
      } else {
        // TODO: handle more embed types
        console.error(`unsupported embed: ${data.post.embed.$type}`);
        console.debug(data.post);
      }
    }

    const stats = document.createElement('div');
    stats.append(document.createTextNode(
      `🗨 ${data.post.replyCount} // ⇌ ${data.post.repostCount} // ♡ ${data.post.likeCount}`
    ));
    contents.append(stats);

    container.append(avatarDiv, contents);
    rendered.append(container);
    return rendered;
  }
}

customElements.define('bluesky-timeline', BskyTimeline);
