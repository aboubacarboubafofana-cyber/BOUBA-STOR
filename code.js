if (msg.type === 'vocal') {
  return `<audio controls src="${msg.audio}" style="width:220px;height:40px"></audio>`;
}