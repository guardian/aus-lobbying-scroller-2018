import networkData from './networkData.json'
import lobbyistData from './lobbyistNodes.json'
import clientData from './clientNodes.json'
import { createScroller } from './createScroller'
import share from './share'

window.functionCounter = 0;
window.firstRun = true;

createScroller(networkData,lobbyistData,clientData);

var shareFn = share('Lobbying in Australia: how big business connects to government', 'https://www.theguardian.com/australia-news/ng-interactive/2018/sep/19/lobbying-in-australia-how-big-business-connects-to-government', 'https://media.guim.co.uk/df71c48d75b06bc44e620073e69415c9a80717db/0_0_814_488/814.png');

[].slice.apply(document.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
});


var to=null
var lastWidth = document.querySelector(".interactive-container").getBoundingClientRect()
window.addEventListener('resize', () => {
  var thisWidth = document.querySelector(".interactive-container").getBoundingClientRect()
  if (lastWidth != thisWidth) {
    window.clearTimeout(to);
    to = window.setTimeout(function() {
    	createScroller(networkData,lobbyistData,clientData);
    }, 500)
  }
})
