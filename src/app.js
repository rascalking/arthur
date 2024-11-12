import { BskyAgent } from '@atproto/api'
import { creds } from './creds.js'


const timeline = document.getElementById('timeline');
const timelinePageSize = 30;

async function getAgent(creds) {
  let agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  await agent.login(creds);
  return agent;
}

async function showTimeline(agent) {
  const { data } = await agent.getTimeline({limit: timelinePageSize});
  const { feed: posts } = data;
  console.log(posts);
  for (const post of posts) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('post');

    const author = document.createElement('span');
    const avatar = document.createElement('img');
    avatar.setAttribute('src', post.post.author.avatar);
    avatar.setAttribute('width', 50);
    avatar.setAttribute('height', 50);
    author.append(avatar);
    author.append(document.createTextNode(
      `${post.post.author.displayName} (@${post.post.author.handle})`));

    const text = document.createElement('div');
    for (const piece of post.post.record.text.split('\n')) {
      const div = document.createElement('p');
      div.append(document.createTextNode(piece));
      text.append(div);
    }

    const timestamp = document.createElement('div');
    timestamp.append(document.createTextNode(post.post.record.createdAt));

    wrapper.append(author, text, timestamp);
    timeline.append(wrapper);
  }
}

getAgent(creds)
  .then((agent) => {
    showTimeline(agent);
  })
  .catch((error) => {
    console.error(error);
  })
