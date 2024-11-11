import { BskyAgent } from '@atproto/api'
import { creds } from './creds.js'


const timeline = document.getElementById('timeline');

async function getAgent(creds) {
  let agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  await agent.login(creds);
  return agent;
}

async function showTimeline(agent) {
  const { data } = await agent.getTimeline({limit: 30});
  const { feed: posts } = data;
  console.log(posts);
  for (const post of posts) {
    const wrapper = document.createElement("div");

    const author = document.createElement("span");
    const avatar = document.createElement("img");
    avatar.setAttribute("src", post.post.author.avatar);
    avatar.setAttribute("width", 50);
    avatar.setAttribute("height", 50);
    author.appendChild(avatar);
    author.appendChild(document.createTextNode(post.post.author.displayName));

    const text = document.createElement("p");
    text.appendChild(document.createTextNode(post.post.record.text));

    wrapper.append(author, text);
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
