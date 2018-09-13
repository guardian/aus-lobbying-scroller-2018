export default function hashUrl(vars) {

	var linkURL
	var tempList = [];

	ministry.forEach(function(d,i){
		tempList.push(d['polID']+'-'+d['minID']);
	});

	urlString = "#" + tempList.join(",");

	// var linkURL,tweetLinkURL;

	if ( window.self !== window.top ) {
		iframeMessenger.navigate(urlString);
		iframeMessenger.getLocation(function(parLocation) {
		linkURL = parLocation['origin'] + parLocation['pathname'] + "%23" + tempList.join(",");
		tweetLinkURL = "https://twitter.com/intent/tweet?text=Here's+my+ideal+new+Australian+cricket+team&url=" + linkURL;	
		$("#tweet").attr("href", tweetLinkURL);
	});

	}

	else {
		window.location.hash = urlString;
		linkURL = window.location.origin + window.location.pathname + "%23" + tempList.join(",");
		tweetLinkURL = "https://twitter.com/intent/tweet?text=Here's+my+ideal+new+Australian+cricket+team&url=" + linkURL;	
		$("#tweet").attr("href", tweetLinkURL);
	}

	return linkURL
}