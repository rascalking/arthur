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

async function showBskyTimeline(uri) {
  const main = document.getElementsByTagName('main')[0];
  const timeline = document.createElement('bluesky-timeline');
  timeline.setAttribute('page-size', 10);
  if (uri) {
    timeline.setAttribute('src', uri);
  }
  main.append(timeline);
}

getAgent(creds)
  .then((agent_) => {
    document.agent = agent_;
    showBskyTimeline('at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/bsky-team');
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
