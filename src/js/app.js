import * as d3 from 'd3'
import networkData from './networkData.json'
import donorData from './donorData.json'
import detectIE from './detectIE'
import d3tip from 'd3-tip'

var entityID,features,svg,simulation,forceStrength,bubblesExist;
var pageWidth = document.documentElement.clientWidth;
var pageHeight = document.documentElement.clientHeight;
var width,height,headerHeight;
var mobile = false;
if (pageWidth < 640) {
	mobile = true;
}

var version = detectIE();

width = document.querySelector("#graphic").getBoundingClientRect().width;
height = width * 0.66

var margin = {top: 0, right: 0, bottom: 0, left:0};
var scaleFactor = width/1300;
var tempRadiusData = [];
var tempLinkData = [];
var nodeCounts = [];

d3.values(networkData).forEach(function(d) {
	nodeCounts.push(d.nodes.length);
	d.nodes.forEach(function (nodeData) {
		tempRadiusData.push(nodeData.totalDonationsMade);
		tempRadiusData.push(nodeData.totalReceivedDonations);
	})
	d.links.forEach(function (linkData) {
		tempLinkData.push(linkData.value);
	})
});

tempRadiusData.push(d3.max(donorData, function(d) {return d.sum}));

var selector = d3.select("#partySelector");
var allEntities = d3.keys(networkData);

allEntities.sort(function(x, y){
   return d3.ascending(x, y);
})

allEntities.forEach(function (key) {
	selector.append("option")
		.attr("value",key)
		.text(key)
})

selector.on("change", function() {
	makeChart(d3.select(this).property('value'));
	entityID = document.getElementById('partySelector').selectedIndex;
});

d3.select("#svg").remove();

svg = d3.select("#graphic").append("svg")
				.attr("width", width - margin.left - margin.right)
				.attr("height", height - margin.top - margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");

features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var outline = d3.scaleOrdinal()
				.domain(['Other Receipt','Donation','Mixed','Unknown'])
				.range(['#005689','#b82266','#767676','#767676'])	

var nodeColors = d3.scaleOrdinal()
					.domain(['alp','greens','liberal','nationals','minor','AssociatedEntity','Donor'])
					.range(['#b51800','#298422','#005689','#aad8f1','#767676','#fc8d62','#66c2a5'])				

var linkColors = d3.scaleOrdinal()
					.domain(['Other Receipt','Donation','Mixed','Subscription','Unknown'])
					.range(['#005689','#b82266','#767676','#767676'])							

var radiusVal = 3;				

var topRadius = 50 * scaleFactor;
var bottomRadius = 3 * scaleFactor;

var radius = d3.scaleSqrt()
				.range([bottomRadius,topRadius])    
				.domain(d3.extent(tempRadiusData))				

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
var numFormat = d3.format(",.0f");

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
	    return "<div class='tipText'><div><b>" + d.name + "</b></div><div>Received: $" + numFormat(d.totalReceivedDonations) + "</div><div>Given: $" + numFormat(d.totalDonationsMade) + "</div></div>";
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
	    return "<div class='tipText'><div><b>" + d.cleanName + "</b></div><div>Given: $" + numFormat(d.sum) + "</div></div>";
  	});	

svg.call(tip2);

function makeChart(partyName) {

	console.log("makeChart")

	if (typeof simulation !== 'undefined') {
		simulation.stop();	
	}
	
	features.selectAll(".links")
		.transition()
		.style("opacity",0)
		.remove();

	features.selectAll(".nodes circle")
		.transition()
		.attr("r",0)
		.remove();

	features.selectAll(".nodes")
		.transition()
		.remove();	

	features.selectAll(".nodes text")
		.transition()
		.style("opacity",0)
		.remove();
	
	var totalNodes = networkData[partyName].nodes.length;

	simulation = d3.forceSimulation()
		    .force("link", d3.forceLink().id(function(d) { return d.name; }).distance(distance))
		    .force("collide", d3.forceCollide().radius(function(d) { 
		    	if (d.totalDonationsMade > d.totalReceivedDonations ) {
	      		return radius(d.totalDonationsMade) + radiusVal; 
	      	}

	      	else {
	      		return radius(d.totalReceivedDonations) + radiusVal; 
	      	}
		    }).iterations(2))
		    .force("charge", d3.forceManyBody().strength(charge))
		    .force("center", d3.forceCenter(width / 2, height / 2));	

	forceStrength = 150;	

	function charge(d) {
		if (d.totalDonationsMade > d.totalReceivedDonations ) {
				return -4 * (radius(d.totalDonationsMade) + radiusVal);
			}	
      	else {
      		return -4 * (radius(d.totalReceivedDonations) + radiusVal); 
      	}

	}

	function distance(d) {
		var tempLinkLength = []
		tempLinkLength.push(d.source.totalDonationsMade);
		tempLinkLength.push(d.target.totalDonationsMade);
		tempLinkLength.push(d.source.totalReceivedDonations);
		tempLinkLength.push(d.target.totalReceivedDonations);
		return 3 * (radius(d3.max(tempLinkLength)) + radiusVal);
	}  

  	var link = features.append("g")
			    .attr("class", "links")
			    .selectAll("line")
				    .data(networkData[partyName].links)
				    .enter().append("line")
				    .attr("stroke-width", function(d) { return 2 })
				    .attr("stroke", function(d) { 
				    	return linkColors(d.type);
				    })
				    .each(function(d) {
				    	if (version === false) {
				    		d3.select(this).attr("marker-end", arrow(linkColors(d.type)));
						}
			        });


	var node = features.append("g")
	      .attr("class", "nodes")
	    .selectAll("circle")
	    .data(networkData[partyName].nodes)
	    .enter().append("circle")
	      .attr("r", function(d) { 
	      	if (d.totalDonationsMade > d.totalReceivedDonations ) {
	      		return radius(d.totalDonationsMade) + radiusVal; 
	      	}

	      	else {
	      		return radius(d.totalReceivedDonations) + radiusVal; 
	      	}
	      	
	      })
	      .attr("fill", function(d) { return nodeColors(d.type); })
	      .attr("stroke", function(d) {
	      		return outline(d.nodeType);
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
	  		var r = radius(d3.max([d.totalDonationsMade, d.totalReceivedDonations]))
	  			return d.x = Math.max(r + 4, Math.min(width - (r + 4), d.x)); 
	  		})
        	.attr("cy", function(d) {
        	var r = radius(d3.max([d.totalDonationsMade, d.totalReceivedDonations]))	
        		return d.y = Math.max(r + 4, Math.min(height - (r + 4), d.y)); 
        	});

	    link
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { 
	        	// var r = radius(d3.max([d.target.totalDonationsMade, d.target.totalReceivedDonations]))
	        	// console.log(d.target);
	        	// return d.target.x; 
	        	return getTargetNodeCircumferencePoint(d)[0];
	        })
	        .attr("y2", function(d) { 
	        	// var r = radius(d3.max([d.target.totalDonationsMade, d.target.totalReceivedDonations]))
	        	// return d.target.y; 
	        	return getTargetNodeCircumferencePoint(d)[1];
	        });

	    
	    function getTargetNodeCircumferencePoint(d){
	    	
	    	var nodeBuffer = 12;
	    	if (version != false) {
				    		nodeBuffer = 4
			}

	        var t_radius = radius(d3.max([d.target.totalDonationsMade, d.target.totalReceivedDonations])) + nodeBuffer; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
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

makeChart('Cormack Foundation Pty Ltd');