import { BskyAgent } from '@atproto/api'
import { BskyTimeline } from './timeline.js'
import { creds } from './creds.js'


document.agent = null; // TODO: something better than a global


async function getAgent(creds) {
  agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  await agent.login(creds);
  return agent;
}

async function populateColumns() {
  document.agent.app.bsky.graph.getLists({actor: document.agent.accountDid})
    .then((resp) => {
      if (!resp.success) {
        console.error("unable to fetch user's lists");
        console.debug(resp);
        return;
      }
      for (const list of resp.data.lists) {
        // TODO: do i need to worry about paging here?
        console.log(list.uri);
        showBskyTimeline(list.uri);
      }
    });
}

async function showBskyTimeline(uri, options) {
  const main = document.getElementsByTagName('main')[0];
  const timeline = document.createElement('bluesky-timeline');
  timeline.classList.add('column');
  timeline.setAttribute('page-size', 20);
  timeline.setAttribute('src', uri);
  if (options && options.replace) {
    main.replaceChildren(timeline);
  } else {
    main.append(timeline);
  }
}

getAgent(creds)
  .then((agent_) => {
    document.agent = agent_;
    showBskyTimeline('', {replace: true});
    populateColumns();
  })
  .catch((error) => {
    console.error(error);
  })
