class BskyTimeline extends HTMLElement {
  // TODO: add column headers
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
          this.cursor = '';
          this.getNextPage({replace: true});
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
    switch (this.src) {
      case undefined:
        return;

      case '':
        console.debug('fetching following');
        response = await document.agent.getTimeline({
          cursor: this.cursor,
          limit: this.pageSize,
        });
        break

      default:
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

    if (options && options.replace) {
      this.replaceChildren();
    }

    for (const post of response.data.feed) {
      this.append(await this.renderPost(post));
    }
  }

  async renderEmbed(data) {
    const embed = document.createElement('div');
    switch (data.$type) {
      case 'app.bsky.embed.external#view':
        // TODO: this should be better than a link?
        embed.classList.add('post-contents-external');
        const anchor = document.createElement('a');
        anchor.setAttribute('href', data.external.uri);
        anchor.setAttribute('target', '_blank');
        anchor.append(document.createTextNode(
          `${data.external.title} // ${data.external.description}`));
        embed.append(anchor);
        break;

      case 'app.bsky.embed.images#view':
        // TODO: lightbox popout for the images
        embed.classList.add('post-contents-images');
        for (const image of data.images) {
          const img = document.createElement('img');
          img.setAttribute('alt', image.alt);
          img.setAttribute('src', image.thumb);
          img.classList.add('thumbnail');
          if (image.aspectRatio) {
            img.style.aspectRatio = image.aspectRatio.width / image.aspectRatio.height;
          }
          embed.append(img);
        }
        break;

      case 'app.bsky.embed.record#view':
        // it's a quote-skeet
        // TODO: there has to be some fucking way to reuse renderPost here
        embed.classList.add('post');

        const container = document.createElement('div');
        container.classList.add('post-contents-container');

        const avatar = document.createElement('img');
        avatar.setAttribute('src', data.record.author.avatar);
        avatar.classList.add('avatar');
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('post-avatar');
        avatarDiv.append(avatar);

        const contents = document.createElement('div');
        contents.classList.add('post-contents');
        const name = document.createElement('div');
        name.classList.add('post-contents-name');
        name.append(document.createTextNode(
          `${data.record.author.displayName} (@${data.record.author.handle}) @${data.record.indexedAt}`));
        contents.append(name);

        const text = document.createElement('div');
        text.classList.add('post-contents-text');
        text.append(document.createTextNode(data.record.value.text));
        contents.append(text);

        const stats = document.createElement('div');
        stats.append(document.createTextNode(
          `🗨 ${data.record.replyCount} // ⇌ ${data.record.repostCount} // ♡ ${data.record.likeCount}`
        ));
        contents.append(stats);
        container.append(avatarDiv, contents);
        embed.append(container);
        break;

      default:
        console.error(`unsupported embed: ${data.$type}`);
        console.debug(data);
    }
    return embed;
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
    name.classList.add('post-contents-name');
    name.append(document.createTextNode(
      `${data.post.author.displayName} (@${data.post.author.handle}) @${data.post.indexedAt}`));
    contents.append(name);

    const text = document.createElement('div');
    text.classList.add('post-contents-text');
    text.append(document.createTextNode(data.post.record.text));
    contents.append(text);

    if (data.post.embed) {
      console.debug('embed found');
      console.debug(data);
      contents.append(await this.renderEmbed(data.post.embed));
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
