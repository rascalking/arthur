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

async function navClick(evt) {
  if (evt.target.tagName.toLowerCase() === 'li') {
    const uri = evt.target.dataset.uri || '';
    document.querySelector('bluesky-timeline').setAttribute('src', uri);
  }
}

async function populateNav() {
  document.agent.app.bsky.graph.getLists({actor: document.agent.accountDid})
    .then((resp) => {
      if (!resp.success) {
        console.error("unable to fetch user's lists");
        console.debug(resp);
        return;
      }
      const ul = document.querySelector('nav > ul');
      for (const list of resp.data.lists) {
        // TODO: do i need to worry about paging here?
        const li = document.createElement('li')
        li.append(document.createTextNode(list.name));
        li.dataset.uri = list.uri;
        ul.append(li);
      }
      ul.addEventListener('click', navClick);
    });
}

async function showBskyTimeline(uri) {
  const main = document.getElementsByTagName('main')[0];
  const timeline = document.createElement('bluesky-timeline');
  timeline.setAttribute('page-size', 10);
  timeline.setAttribute('src', uri);
  main.replaceChildren(timeline);
}

getAgent(creds)
  .then((agent_) => {
    document.agent = agent_;
    populateNav();
    showBskyTimeline('');
    //showBskyTimeline('at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/bsky-team');
    /*
    agent_.app.bsky.graph.getLists({actor: agent_.accountDid})
      .then((resp) => {
        let list = resp.data.lists[0];
        console.log(list);
        //showBskyTimeline(list.uri);
        //
      });
      */
  })
  .catch((error) => {
    console.error(error);
  })
