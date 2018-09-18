import * as graphScroll from 'graph-scroll'
import * as d3 from 'd3'
import d3tip from 'd3-tip'
import detectIE from './detectIE'

export function createScroller(networkData,lobbyistData,clientData) {

var entityID;
var version = detectIE();
var features,svg,simulation;
var activateFunctions = [];
var pageWidth = document.documentElement.clientWidth;
var pageHeight = document.documentElement.clientHeight;
var width,height,headerHeight;
var firstRun = true;
var forceStrength,bubblesExist;
var chartTitle = d3.select("#chartTitle");
var mobile = false;

if (pageWidth < 640) {
	mobile = true;
}

var headerOffset = 48;
var gndHeader = document.getElementById("bannerandheader");

if (gndHeader != null) {
	headerOffset = gndHeader.getBoundingClientRect().height
}

width = document.querySelector("#container1").getBoundingClientRect().width;
headerHeight = document.querySelector(".interactive-container .header").getBoundingClientRect().height;

if (functionCounter > 0) {
	height = pageHeight * 0.66;
	d3.select("#graphic svg")
		.transition()
		.attr("height",height);
}

else {
	height = pageHeight*0.66;
}

d3.select("#footer").style("margin-top", height);

if (width > 1260) {
	width = 1260;
}
var margin = {top: 0, right: 0, bottom: 0, left:0};
var scaleFactor = width/1300;

if (scaleFactor < 0.5) {
	scaleFactor = 0.5
}

console.log("scalreFactor",scaleFactor)

var tempRadiusData = [];

d3.values(networkData).forEach(function(d) {
	d.nodes.forEach(function (nodeData) {
		tempRadiusData.push(nodeData.clientCount);
	})
});

var topRadius = 50 * scaleFactor;
var bottomRadius = 5 * scaleFactor;
var radiusVal = 10 * scaleFactor;
var radiusPad = 3
var bubbleVal = 5 * scaleFactor;

console.log("topRadius", topRadius, "bottomRadius", bottomRadius, "radiusVal", radiusVal, "bubbleVal", bubbleVal)

var radius = d3.scaleSqrt()
				.range([bottomRadius,topRadius])    
				.domain(d3.extent(tempRadiusData))		

var divs = d3.selectAll('#sections > div')

// console.log(divs.length);
divs.each(function (d,i) {
	if (i > 0 && i < divs.size() -1) {
		d3.select(this).style("min-height", pageHeight*0.4 + "px")
	}
});

d3.select('#gv-footer').style("height", pageHeight*0.66 + "px");

var lobbyistSelector = d3.select("#lobbyistSelector");
var clientSelector = d3.select("#clientSelector");
var allEntities = d3.keys(networkData);
// console.log(allEntities)

function nameFormat(name) {
	if (name.length > 25) {
		return name.substring(0,25) + "..."
	}

	else {
		return name
	}
}

function updateSelector(selector,data,filterKey,filterBy) {
	// console.log("filterKey", filterKey, "filterBy", filterBy)

	if (filterKey != 'showall') {
		var filteredData = data.filter(function(d) { return d[filterKey] === filterBy})	
	}
	
	else {
		var filteredData = data
	} 

	// console.log(filteredData)

	var currentSelector;

	if (selector === "lobbyistSelector") {
		currentSelector = lobbyistSelector
	}

	else {
		currentSelector = clientSelector	
	}

	currentSelector.html("")

	filteredData.sort(function(x, y){
	   return d3.ascending(x.name, y.name);
	})

	filteredData.forEach(function (d) {
		if (d.name )
		currentSelector.append("option")
			.attr("value",d.name)
			.text(nameFormat(d.name))
	})
}

updateSelector("lobbyistSelector",lobbyistData,"interesting","y")
updateSelector("clientSelector",clientData,"interesting","y")

d3.selectAll(".lobbyist_buttons .btn").on("click", function(blah) {
	d3.selectAll(".lobbyist_buttons .btn").classed("btn_selected", false)
	d3.select(this).classed("btn_selected", true)
	var filterKey = d3.select(this).attr('data-filterkey')
	var filterBy = d3.select(this).attr('data-filterby')
	// console.log(filterKey,filterBy)
	updateSelector("lobbyistSelector",lobbyistData,filterKey,filterBy);	
	
})

d3.selectAll(".client_buttons .btn").on("click", function(blah) {
	d3.selectAll(".client_buttons .btn").classed("btn_selected", false)
	d3.select(this).classed("btn_selected", true)
	var filterKey = d3.select(this).attr('data-filterkey')
	var filterBy = d3.select(this).attr('data-filterby')
	// console.log(filterKey,filterBy)
	updateSelector("clientSelector",clientData,filterKey,filterBy);	
	
})


lobbyistSelector.on("change", function() {
	makeChart(d3.select(this).property('value'));
	entityID = document.getElementById('lobbyistSelector').selectedIndex;
});

clientSelector.on("change", function() {
	makeChart(d3.select(this).property('value'));
	entityID = document.getElementById('clientSelector').selectedIndex;
});


var numFormat = d3.format(",.0f");

d3.select("#svg").remove();

svg = d3.select("#graphic").append("svg")
				.attr("width", width - margin.left - margin.right)
				.attr("height", height - margin.top - margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");

features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var leftLabel = features
	.append("text")
	.style("opacity",0)
	.attr("class", "clusterLabel left")
	.attr("text-anchor", function() { 
		if (mobile) {
			return "left"
		}

		else {
			return "middle"
		}
	})
	.attr("x", function() {
		if (mobile) {
			return 5
		}
		else {
			return width*0.33
		}
	})
	.attr("y", 0.2*height)
	.text("Other lobbying firms");

var rightLabel = features
	.append("text")
	.style("opacity",0)
	.attr("class", "clusterLabel right")
	.attr("text-anchor", function() { 
		if (mobile) {
			return "left"
		}

		else {
			return "middle"
		}
	})
	.attr("x", function() {
			return width*0.66
		})
	.attr("y", 0.2*height)
	.text(function() { 
		if (mobile) {
			return "Former gov. rep."
		}

		else {
			return "Former government representative declared"
		}
		
		});	

var middleLabel = features
	.append("text")
	.style("opacity",0)
	.attr("class", "clusterLabel middle")
	.attr("text-anchor", "middle")
	.attr("x", width/2)
	.attr("y", 0.2*height)
	.text("Lobbying firms");	


var outline = d3.scaleOrdinal()
				.domain(['client','lobbyist','Mixed','Unknown'])
				.range(['#005689','#ad0303','#767676','#767676'])	

var nodeColors = d3.scaleOrdinal()
					.domain(['alp','greens','liberal','client','minor','govLink','noLink'])
					.range(['#b51800','#298422','#005689','#aad8f1','#767676','#fc8d62','#66c2a5'])				

var linkColors = d3.scaleOrdinal()
					.domain(['Other Receipt','Donation','Mixed','Subscription','Unknown'])
					.range(['#005689','#b82266','#767676','#767676'])										
		

var defs = svg.append("svg:defs");

function arrow(color) {				
	defs.append("svg:marker")    
	    .attr("id", color.replace("#", ""))
	    .attr("viewBox", "0 -5 10 10")
	    .attr("refX", 0)
	    .attr("refY", 0)
	    .attr("markerWidth", 4)
	    .attr("markerHeight", 4)
	    .attr("orient", "auto")
	    .style("fill", color)
	    .style("opacity",0.8)
	  .append("svg:path")
	    .attr("d", "M0,-5L10,0L0,5");

	return "url(" + color + ")";    				
}   

var tip1 = d3tip()
	  .attr('class', 'd3-tip')
		.direction(function(d) {
		  if (d.x  > (width - (width/3))) {
		   		return 'w'}

		  else if (d.x  < width/3)  {
		  	return 'e'
		  }

		  if (d.y < 100) {
		  	return 's'
		  }
		  else {
		  	return 'n'
		  }
		})
	  .html(function(d) {
	    return "<div class='tipText'><div><b>" + d.name + "</b></div>";
  	});	

svg.call(tip1);

var tip2 = d3tip()
	  .attr('class', 'd3-tip')
		.direction(function(d) {
		  if (d.x  > (width - (width/3))) {
		   		return 'w'}

		  else if (d.x  < width/3)  {
		  	return 'e'
		  }

		  if (d.y < 100) {
		  	return 's'
		  }
		  else {
		  	return 'n'
		  }
		})
	  .html(function(d) {
	    return "<div class='tipText'><div><b>" + d.name + "</b></div><div>Clients: " + d.clientCount + "</div></div>";
  	});	

svg.call(tip2);

function makeChart(partyName) {

	chartTitle.text(partyName);
	// console.log(networkData[partyName])
	if (typeof simulation !== 'undefined') {
		simulation.stop();	
	}
	
	features.selectAll(".links")
		.transition('removelinks')
		.style("opacity",0)
		.remove();

	features.selectAll(".nodes circle")
		.transition('removenodecircles')
		.attr("r",0)
		.remove();

	features.selectAll(".nodes")
		.transition('removenodes')
		.remove();	

	features.selectAll(".nodes text")
		.transition()
		.style("opacity",0)
		.remove();
	
	var totalNodes = networkData[partyName].nodes.length;

	simulation = d3.forceSimulation()
		    .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(radiusVal * 10))
		    .force("collide", d3.forceCollide().radius(function(d) { 
		    	if (d.type == "lobbyist") {
	      		return radius(d.clientCount) + 1; 
	      	}

	      	else {
	      		return radiusVal + 1; 
	      	}
		    }).iterations(2))
		    .force("charge", d3.forceManyBody().strength(charge))
		    .force("center", d3.forceCenter(width / 2, height / 2));	

	forceStrength = 150;	

	function charge(d) {
      	if (d.type == "lobbyist") {
				return -4 * (radius(d.totalDonationsMade) + 1);
			}	
      	else {
      		return -4 * (radiusVal + 1); 
      	}
	}

  	var link = features.append("g")
			    .attr("class", "links")
			    .selectAll("line")
				    .data(networkData[partyName].links)
				    .enter().append("line")
				    .attr("stroke-width", function(d) { return 1 })
				    .attr("stroke", function(d) { 
				    	return linkColors(d.type);
				    });


	var node = features.append("g")
	      .attr("class", "nodes")
	    .selectAll("circle")
	    .data(networkData[partyName].nodes)
	    .enter().append("circle")
	      .attr("r", function(d) { 
	      	if (d.type === "lobbyist" ) {
	      		return radius(d.clientCount); 
	      	}
	      	else {
	      		return radiusVal; 
	      	}
	      	
	      })
	      .attr("fill", function(d) { 
	      	if (d.type === "lobbyist" ) {
	      		return nodeColors(d.govLink); 
	      	}

	      	else {
	      		return nodeColors(d.type);	
	      	}
	      })
	      .attr("stroke", function(d) {
	      		return outline(d.type);
	      })
	      .on('mouseenter', tip1.show)
  			.on('mouseleave', tip1.hide)
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));

		  simulation
		      .nodes(networkData[partyName].nodes)
		      .on("tick", ticked);

		  simulation.force("link")
		      .links(networkData[partyName].links);

	  function ticked() {

	  	node.attr("cx", function(d) {
	  		var r = radiusVal + 0.5
	  		return d.x = Math.max(r + 4, Math.min(width - (r + 4), d.x)); 
	  		})
        	.attr("cy", function(d) {
        	var r = radiusVal + 0.5
        		return d.y = Math.max(r + 4, Math.min(height - (r + 4), d.y)); 
        	});

	    link
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { 
	        	// var r = radius(d3.max([d.target.totalDonationsMade, d.target.totalReceivedDonations]))
	        	// console.log(d.target);
	        	return d.target.x; 
	        	// return getTargetNodeCircumferencePoint(d)[0];
	        })
	        .attr("y2", function(d) { 
	        	// var r = radius(d3.max([d.target.totalDonationsMade, d.target.totalReceivedDonations]))
	        	return d.target.y; 
	        	// return getTargetNodeCircumferencePoint(d)[1];
	        });

	    
	    function getTargetNodeCircumferencePoint(d){
	    	
	    	var nodeBuffer = 12;
	    	if (version != false) {
				    		nodeBuffer = 4
			}

	        var t_radius = radius(d3.max([d.target.clientCount, radiusVal])) + nodeBuffer; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
	        var dx = d.target.x - d.source.x;
	        var dy = d.target.y - d.source.y;
	        var gamma = Math.atan2(dy,dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan
	        var tx = d.target.x - (Math.cos(gamma) * t_radius);
	        var ty = d.target.y - (Math.sin(gamma) * t_radius);
	        return [tx,ty]; 
		}   


	  	}

	function dragstarted(d) {
		d3.select(".d3-tip").style("display", "none");
	  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	  d.fx = d.x;
	  d.fy = d.y;
	}

	function dragged(d) {
	  d.fx = d3.event.x;
	  d.fy = d3.event.y;
	}

	function dragended(d) {
		d3.select(".d3-tip").style("display", "block");
	  if (!d3.event.active) simulation.alphaTarget(0);
	  d.fx = null;
	  d.fy = null;
	}    

}

function makeBubbles(bubbleData) {
	// console.log("makeBubbles")
	if (!firstRun) {
		simulation.stop();
	}
	
	features.selectAll(".links")
		.transition()
		.style("opacity",0)
		.remove();

	features.selectAll(".nodes")
		.remove();

	var center = {x: width / 2, y: height / 2};
	forceStrength = 0.03;

	simulation = d3.forceSimulation(bubbleData)
		.velocityDecay(0.2)
		.force('x', d3.forceX().strength(forceStrength).x(center.x))
		.force('y', d3.forceY().strength(forceStrength).y(center.y))
		.force("collide", d3.forceCollide().radius(function(d) { return radius(d.clientCount) + 1; }).iterations(16))
		.force('charge', d3.forceManyBody().strength(-3))
	    .alphaTarget(1)
	    .on("tick", ticked);

	function charge(d) {
		return -forceStrength * Math.pow(radius(d.clientCount), 2.0);
	}    

	function ticked() {
		features.selectAll(".nodes").attr("transform", function(d) { return "translate(" + Math.max(radius(d.clientCount), Math.min(width - radius(d.clientCount), d.x)) + "," + Math.max(radius(d.clientCount), Math.min(height - radius(d.clientCount), d.y)) + ")" });
	}

	var node = features.selectAll(".nodes").data(bubbleData);

	var nodeContainer = node.enter()
			.append("g")
			.attr("class", function(d) { return "nodes"})

	nodeContainer
			.append("circle")		
			.attr("fill", function(d) { return "#66c2a5"; })
			.attr("class", function(d) { return d.govLink + " " + d.govRegister; })
			.on('mouseenter', tip2.show)
  			.on('mouseleave', tip2.hide)	
			.attr("r", 0)

	features.selectAll(".nodes circle")
		.transition()
		.attr("r",function (d) {
			return radius(d.clientCount);
		});

	d3.selectAll(".nodes text")
		.transition()
		.attr("dy", function(d) { return -1 * radius(d.clientCount);});

	// Update and restart the simulation.
	simulation.nodes(bubbleData);   
	firstRun = false;
	bubblesExist = true;

}

function bubbles() {
	functionCounter = 0;
	// console.log("bubbles");
	makeBubbles(lobbyistData);
	simulation.force('x', d3.forceX().strength(forceStrength).x(width/2));
	simulation.alpha(1).restart();
}

function adjustHeight() {
	functionCounter = 1;
	// console.log("adjustHeight");
	pageHeight = document.documentElement.clientHeight;
	height = pageHeight*0.66;

	d3.select("#graphic svg")
		.transition()
		.attr("height",height);

	simulation.force('x', d3.forceX().strength(forceStrength).x(width/2));
	simulation.force('y', d3.forceY().strength(forceStrength).y(height/2));

	simulation.alpha(1).restart();
	d3.selectAll(".nodes circle").transition().attr("fill", "#66c2a5")	
	middleLabel.text("Lobbying firms registered in Canberra");
	middleLabel.attr("y", 0.1*height)

	leftLabel.transition().style("opacity", 0);
	middleLabel.transition().style("opacity", 1);	
	rightLabel.transition().style("opacity", 0);
	
}

function splitBubbles1() {

	// d3.select("#graphic svg")
	// 	.transition()
	// 	.attr("height",height);

	pageHeight = document.documentElement.clientHeight;
	height = pageHeight*0.66;

	functionCounter = 2;
	// console.log("bubblesExist",bubblesExist)
	
	if (!bubblesExist) {
		console.log("yeah")
		makeBubbles(lobbyistData);
	}

	forceStrength = 0.03;
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodePos));
    simulation.alpha(1).restart();
    leftLabel.transition().style("opacity", 1);
	middleLabel.transition().style("opacity", 0);
	rightLabel.transition().style("opacity", 1);
	
	d3.selectAll(".nodes .govRegister").transition('colours').attr("fill", "#fc8d62")
	d3.selectAll(".nodes .noRegister").transition('colours').attr("fill", "#66c2a5")

	leftLabel.text("Other Lobbying firms")
	rightLabel.text(function() { 
		if (mobile) {
			return "Former gov. rep. declared"
		}

		else {
			return "Former government representative declared"
		}
		
		})

 	function nodePos(d) {
 		if (d.govRegister === "noRegister") {
 			return (width * 0.33)
 		}

 		else {
 			return (width * 0.66)
 		}
 	}

}

function splitBubbles2() {

	pageHeight = document.documentElement.clientHeight;
	height = pageHeight*0.66;

	functionCounter = 2;
	
	console.log("bubblesExist",bubblesExist)

	if (!bubblesExist) {
		console.log("yeah")
		makeBubbles(lobbyistData);
	}

	forceStrength = 0.03;
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodePos));
    simulation.alpha(1).restart();
    leftLabel.transition().style("opacity", 1);
	middleLabel.transition().style("opacity", 0);
	rightLabel.transition().style("opacity", 1);
	chartTitle.transition().style("opacity",0);

	d3.selectAll(".govLink").transition('colours').attr("fill", "#fc8d62")
	d3.selectAll(".noLink").transition('colours').attr("fill", "#66c2a5")

	leftLabel.text("Other Lobbying firms")
	rightLabel.text(function() { 
		if (mobile) {
			return "Any gov. link"
		}

		else {
			return "Any government link"
		}
		
		});	

 	function nodePos(d) {
 		if (d.govLink === "noLink") {
 			return (width * 0.33)
 		}

 		else {
 			return (width * 0.66)
 		}
 	}

}



function makeBiglobbyists() {

	// d3.select("#graphic svg")
	// 	.transition()
	// 	.attr("height",height);

	leftLabel.transition().style("opacity", 0);
	middleLabel.transition().style("opacity", 0);
	rightLabel.transition().style("opacity", 0);
	chartTitle.transition().style("opacity",1);
	
	functionCounter = 5;
	middleLabel.transition().style("opacity", 0);
	bubblesExist = false;

	makeChart('Barton Deakin and Hawker Britton');
	chartTitle.text('Barton Deakin and Hawker Britton');
	chartTitle.transition().style("opacity",1);
}

function makeHealthlobbyists() {

	// d3.select("#graphic svg")
	// 	.transition()
	// 	.attr("height",height);

	leftLabel.transition().style("opacity", 0);
	middleLabel.transition().style("opacity", 0);
	rightLabel.transition().style("opacity", 0);
	chartTitle.transition().style("opacity",1);
	
	functionCounter = 5;
	middleLabel.transition().style("opacity", 0);
	bubblesExist = false;

	makeChart('Parker and opr Health');
	chartTitle.text('Parker and opr Health');
	chartTitle.transition().style("opacity",1);
}


function showall() {
	leftLabel.transition().style("opacity", 0);
	middleLabel.transition().style("opacity", 0);
	rightLabel.transition().style("opacity", 0);
	chartTitle.transition().style("opacity",1);
	functionCounter = 9;
	makeChart('GRACosway Pty Ltd');

}		

function doNothing() {
	console.log("yieewwww")
}

var keyVisible = false;
var keyPanel = d3.select("#keyPanel");

d3.select("#infoButton").on("click", function(d) {
	console.log("click");
	if (keyVisible) {
		keyPanel.transition().style("opacity",0)
		keyVisible = false;
	}
	else {
		keyPanel.transition().style("opacity",0.8)
		keyVisible = true;
	}
});


activateFunctions[0] = bubbles;
activateFunctions[1] = adjustHeight;
activateFunctions[2] = splitBubbles1;
activateFunctions[3] = splitBubbles2;
activateFunctions[4] = makeBiglobbyists;
activateFunctions[5] = makeHealthlobbyists;
activateFunctions[6] = showall;



var gs = graphScroll.graphScroll()
	.container(d3.select('#container1'))
	.graph(d3.selectAll('.graphicContainer'))
	.sections(d3.selectAll('#sections > div'))
	.offset(height * 0.33 + 50)
	.on('active', function(i){
		activateFunctions[i]();
	});


var graphicDiv = document.getElementById("graphicCol");
var lastSection = document.getElementById("lastSection")
var footer = document.getElementById("gv-footer")
var adLabel = document.querySelector("div.ad-slot__label");

var initDivBottom = graphicDiv.getBoundingClientRect().bottom;

if (initDivBottom < 0) {
	initDivBottom = 1335;
}

var lastSectionHeight = lastSection.getBoundingClientRect().height
var lastSectionBottom = lastSection.getBoundingClientRect().bottom
var lastSectionTop = lastSection.getBoundingClientRect().top;
var footerTop = footer.getBoundingClientRect().top;

var lastOffset = 60


console.log(lastSectionHeight)

if (height * 0.33 < 470) {
	lastOffset = 30 + ((422 - height * 0.33))
}

if (lastSectionHeight > 470) {
	lastOffset = 50 + ((lastSectionHeight - 422)*2)
}

d3.select("#loading").remove();

window.addEventListener('scroll', function(e) {
	// lastSectionHeight = document.getElementById("lastSection").getBoundingClientRect().height
	// lastSection = document.getElementById("lastSection").getBoundingClientRect().top
	// console.log(lastSection)

	if (graphicDiv.style.position == 'static') {
		initDivBottom = scrollY + document.getElementById("graphicCol").getBoundingClientRect().bottom;
	}

	var windowBottom = scrollY + window.innerHeight;
	
	lastSectionTop = lastSection.getBoundingClientRect().top + lastOffset;
	// console.log(lastSectionTop,lastOffset)
	// lastSectionHeight = lastSection.getBoundingClientRect().clientHeight
	// console.log(windowBottom, lastSectionTop, lastSectionBottom, lastSectionHeight, height * 0.66)

	// lastSection = document.getElementById("lastSection").getBoundingClientRect().top - lastOffset;

	// console.log("windowBottom", windowBottom)
	// console.log("lastSection", lastSection)

  	if (windowBottom > initDivBottom) {
  		// console.log("fixed")
  		document.getElementById("graphicCol").setAttribute('style', "position: fixed;");
  	}

  	if (windowBottom <= initDivBottom) {
  		// console.log("static")
  		document.getElementById("graphicCol").setAttribute('style', "position: static;");
  		// console.log("initDivBottom2: ", initDivBottom)
  	}

  	if (lastSectionTop < 0) {
  		document.getElementById("graphicCol").style.bottom = (-1 * lastSectionTop + "px")
  	}

  	if (lastSectionTop > 0) {
  		document.getElementById("graphicCol").style.bottom = ("0px")
  	}


});	

}