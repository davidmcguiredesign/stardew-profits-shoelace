var svgWidth = 1080;
var svgHeight = 480;

var width = svgWidth - 48;
var height = ( svgHeight - 56 ) / 2;
var barPadding = 4;
var barWidth = width / seasons[options.season].crops.length - barPadding;
var miniBar = 8;
var barOffsetX = 56;
var barOffsetY = 40;

// Prepare web elements.
var svg = d3.select( "div.graph" )
	.append( "svg" )
	.attr( "width", svgWidth )
	.attr( "height", svgHeight )
	// .style("background-color", "#333333")
	.style( "border-radius", "8px" );

svg.append( "g" )
	.append( "text" )
	.attr( "class", "axis" )
	.attr( "x", 48 )
	.attr( "y", 24 )
	.style( "text-anchor", "end" )
	.text( "Profit" );

var tooltip = d3.select( "body" )
	.append( "div" )
	.style( "position", "absolute" )
	.style( "z-index", 10 )
	.style( "visibility", "hidden" )
	.style( "background", "rgb(0, 0, 0)" )
	.style( "background", "rgba(0, 0, 0, 0.75)" )
	.style( "padding", "8px" )
	.style( "border-radius", "8px" )
	.style( "border", "2px solid black" );

var gAxis = svg.append( "g" );
var gProfit = svg.append( "g" );
var gSeedLoss = svg.append( "g" );
var gFertLoss = svg.append( "g" );
var gIcons = svg.append( "g" );
var gTooltips = svg.append( "g" );

var axisY;
var barsProfit;
var barsSeed;
var barsFert;
var imgIcons;
var barsTooltips;

/**
 * Formats a specified number, adding separators for thousands.
 * @param num The number to format.
 * @return Formatted string.
 */
function formatNumber( num ) {
	num = num.toFixed( 2 ) + '';
	x = num.split( '.' );
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while ( rgx.test( x1 ) ) {
		x1 = x1.replace( rgx, '$1' + ',' + '$2' );
	}
	return x1 + x2;
}

/**
 * Updates the X D3 scale.
 * @return The new scale.
 */
function updateScaleX() {
	return d3.scale.ordinal()
		.domain( d3.range( seasons[4].crops.length ) )
		.rangeRoundBands( [0, width] );
}

/**
 * Update the Y D3 scale.
 * @return The new scale.
 */
function updateScaleY() {
	return d3.scale.linear()
		.domain( [0, d3.max( cropList, function ( d ) {
			if ( d.drawProfit >= 0 ) {
				return ( ~~( ( d.drawProfit + 99 ) / 100 ) * 100 );
			} else {
				var profit = d.drawProfit;
				if ( options.buySeed && d.seedLoss < profit ) {
					profit = d.drawSeedLoss;
				}
				if ( options.buyFert && d.fertLoss < profit ) {
					profit = d.drawFertLoss;
				}
				return ( ~~( ( -profit + 99 ) / 100 ) * 100 );
			}
		} )] )
		.range( [height, 0] );
}

/**
 * Update the axis D3 scale.
 * @return The new scale.
 */
function updateScaleAxis() {
	return d3.scale.linear()
		.domain( [
			-d3.max( cropList, function ( d ) {
				if ( d.drawProfit >= 0 ) {
					return ( ~~( ( d.drawProfit + 99 ) / 100 ) * 100 );
				} else {
					let profit = d.drawProfit;
					if ( options.buySeed && d.seedLoss < profit ) {
						profit = d.drawSeedLoss;
					}
					if ( options.buyFert && d.fertLoss < profit ) {
						profit = d.drawFertLoss;
					}
					return ( ~~( ( -profit + 99 ) / 100 ) * 100 );
				}
			} ),
			d3.max( cropList, function ( d ) {
				if ( d.drawProfit >= 0 ) {
					return ( ~~( ( d.drawProfit + 99 ) / 100 ) * 100 );
				} else {
					let profit = d.drawProfit;
					if ( options.buySeed && d.seedLoss < profit ) {
						profit = d.drawSeedLoss;
					}
					if ( options.buyFert && d.fertLoss < profit ) {
						profit = d.drawFertLoss;
					}
					return ( ~~( ( -profit + 99 ) / 100 ) * 100 );
				}
			} )
		] )
		.range( [height * 2, 0] );
}

/**
 * Renders the graph.
 * This is called only when opening for the first time or when changing seasons/seeds.
 */
function renderGraph() {

	var x = updateScaleX();
	var y = updateScaleY();
	var ax = updateScaleAxis();

	svg.attr( "width", barOffsetX + barPadding * 2 + ( barWidth + barPadding ) * cropList.length );
	d3.select( ".graph" ).attr( "width", barOffsetX + barPadding * 2 + ( barWidth + barPadding ) * cropList.length );

	var yAxis = d3.svg.axis()
		.scale( ax )
		.orient( "left" )
		.tickFormat( d3.format( ",s" ) )
		.ticks( 16 );

	axisY = gAxis.attr( "class", "axis" )
		.call( yAxis )
		.attr( "transform", "translate(48, " + barOffsetY + ")" );

	barsProfit = gProfit.selectAll( "rect" )
		.data( cropList )
		.enter()
		.append( "rect" )
		.attr( "x", function ( d, i ) {
			if ( d.drawProfit < 0 && options.buySeed && options.buyFert )
				return x( i ) + barOffsetX;
			else if ( d.drawProfit < 0 && !options.buySeed && options.buyFert )
				return x( i ) + barOffsetX;
			else if ( d.drawProfit < 0 && options.buySeed && !options.buyFert )
				return x( i ) + barOffsetX;
			else
				return x( i ) + barOffsetX;
		} )
		.attr( "y", function ( d ) {
			if ( d.drawProfit >= 0 )
				return y( d.drawProfit ) + barOffsetY;
			else
				return height + barOffsetY;
		} )
		.attr( "height", function ( d ) {
			if ( d.drawProfit >= 0 )
				return height - y( d.drawProfit );
			else
				return height - y( -d.drawProfit );
		} )
		.attr( "width", barWidth )
		.attr( "class", function ( d ) {
			if ( d.drawProfit >= 0 )
				return "profit";
			else
				return "loss";
		} );

	barsSeed = gSeedLoss.selectAll( "rect" )
		.data( cropList )
		.enter()
		.append( "rect" )
		.attr( "x", function ( d, i ) { return x( i ) + barOffsetX; } )
		.attr( "y", height + barOffsetY )
		.attr( "height", function ( d ) {
			if ( options.buySeed )
				return height - y( -d.drawSeedLoss );
			else
				return 0;
		} )
		.attr( "width", barWidth )
		.attr( "class", "cost" )

	barsFert = gFertLoss.selectAll( "rect" )
		.data( cropList )
		.enter()
		.append( "rect" )
		.attr( "x", function ( d, i ) {
			if ( options.buySeed )
				return x( i ) + barOffsetX;
			else
				return x( i ) + barOffsetX;
		} )
		.attr( "y", height + barOffsetY )
		.attr( "height", function ( d ) {
			if ( options.buyFert )
				return height - y( -d.drawFertLoss );
			else
				return 0;
		} )
		.attr( "width", barWidth )
		.attr( "class", "fert" );

	imgIcons = gIcons.selectAll( "image" )
		.data( cropList )
		.enter()
		.append( "svg:image" )
		.attr( "x", function ( d, i ) { return x( i ) + barOffsetX; } )
		.attr( "y", function ( d ) {
			if ( d.drawProfit >= 0 )
				return y( d.drawProfit ) + barOffsetY - barWidth - barPadding;
			else
				return height + barOffsetY - barWidth - barPadding;
		} )
		.attr( 'width', barWidth )
		.attr( 'height', barWidth )
		.attr( "xlink:href", function ( d ) { return "img/" + d.img; } );

	barsTooltips = gTooltips.selectAll( "rect" )
		.data( cropList )
		.enter()
		.append( "rect" )
		.attr( "x", function ( d, i ) { return x( i ) + barOffsetX - barPadding / 2; } )
		.attr( "y", function ( d ) {
			if ( d.drawProfit >= 0 )
				return y( d.drawProfit ) + barOffsetY - barWidth - barPadding;
			else
				return height + barOffsetY - barWidth - barPadding;
		} )
		.attr( "height", function ( d ) {
			var topHeight = 0;

			if ( d.drawProfit >= 0 )
				topHeight = height + barWidth + barPadding - y( d.drawProfit );
			else
				topHeight = barWidth + barPadding;

			let mostLoss = Math.min(mostLoss, d.drawProfit);
			if ( options.buySeed )
				mostLoss = Math.min(mostLoss, d.drawSeedLoss);
			if ( options.buyFert )
				mostLoss = Math.min(mostLoss, d.drawFertLoss);

			return topHeight + ( height - y( -mostLoss ) );
		} )
		.attr( "width", barWidth + barPadding )
		.attr( "opacity", "0" )
		.attr( "cursor", "pointer" )
		.on( "mouseover", function ( d ) {
			tooltip.selectAll( "*" ).remove();
			tooltip.style( "visibility", "visible" );

			tooltip.append( "h3" ).attr( "class", "tooltipTitle" ).text( d.name );

			var tooltipTable = tooltip.append( "table" )
				.attr( "class", "tooltipTable" )
				.attr( "cellspacing", 0 );
			var tooltipTr;


			tooltipTr = tooltipTable.append( "tr" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Total profit:" );
			if ( d.profit > 0 )
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightPos" ).text( "+" + formatNumber( d.profit ) )
					.append( "div" ).attr( "class", "gold" );
			else
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( formatNumber( d.profit ) )
					.append( "div" ).attr( "class", "gold" );

			tooltipTr = tooltipTable.append( "tr" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Profit per day:" );
			if ( d.averageProfit > 0 )
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightPos" ).text( "+" + formatNumber( d.averageProfit ) )
					.append( "div" ).attr( "class", "gold" );
			else
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( formatNumber( d.averageProfit ) )
					.append( "div" ).attr( "class", "gold" );

			if ( options.buySeed ) {
				tooltipTr = tooltipTable.append( "tr" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Total seed loss:" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( formatNumber( d.seedLoss ) )
					.append( "div" ).attr( "class", "gold" );

				tooltipTr = tooltipTable.append( "tr" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Seed loss per day:" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( formatNumber( d.averageSeedLoss ) )
					.append( "div" ).attr( "class", "gold" );
			}

			if ( options.buyFert ) {
				tooltipTr = tooltipTable.append( "tr" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Total fertilizer loss:" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( formatNumber( d.fertLoss ) )
					.append( "div" ).attr( "class", "gold" );

				tooltipTr = tooltipTable.append( "tr" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Fertilizer loss per day:" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( formatNumber( d.averageFertLoss ) )
					.append( "div" ).attr( "class", "gold" );
			}


			//Ineligible crops are sold raw.
			tooltipTr = tooltipTable.append( "tr" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Produce sold:" );
			switch ( options.produce ) {
				case 0: tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "Raw crops" ); break;
				case 1:
					if ( d.produce.jarType != null )
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.produce.jarType );
					else
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( "Raw crops" );
					break;
				case 2:
					if ( d.produce.kegType != null )
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.produce.kegType );
					else
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRightNeg" ).text( "Raw crops" );
					break;
			}
			tooltipTr = tooltipTable.append( "tr" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Duration:" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( options.days + " days" );
			tooltipTr = tooltipTable.append( "tr" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Planted:" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.planted );
			tooltipTr = tooltipTable.append( "tr" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Harvests:" );
			tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.harvests );

			if ( options.extra ) {
				var kegModifier = d.produce.kegType === "Wine" ? 3 : 2.25;
				var kegPrice = d.produce.keg != null ? d.produce.keg : d.produce.price * kegModifier;

				tooltip.append( "h3" ).attr( "class", "tooltipTitleExtra" ).text( "Crop info" );
				tooltipTable = tooltip.append( "table" )
					.attr( "class", "tooltipTable" )
					.attr( "cellspacing", 0 );

				if ( !( d.isWildseed && options.skills.botanist ) ) {
					tooltipTr = tooltipTable.append( "tr" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Value (Normal):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.produce.price )
						.append( "div" ).attr( "class", "gold" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "(" + ( d.profitData.ratioN * 100 ).toFixed( 0 ) + "%)" );
				}
				if ( d.name != "Tea Leaves" ) {
					if ( !( d.isWildseed && options.skills.botanist ) ) {
						tooltipTr = tooltipTable.append( "tr" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Value (Silver):" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( Math.trunc( d.produce.price * 1.25 ) )
							.append( "div" ).attr( "class", "gold" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "(" + ( d.profitData.ratioS * 100 ).toFixed( 0 ) + "%)" );
						tooltipTr = tooltipTable.append( "tr" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Value (Gold):" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( Math.trunc( d.produce.price * 1.5 ) )
							.append( "div" ).attr( "class", "gold" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "(" + ( d.profitData.ratioG * 100 ).toFixed( 0 ) + "%)" );
					}
					if ( ( !d.isWildseed && fertilizers[options.fertilizer].ratio >= 3 ) || ( d.isWildseed && options.skills.botanist ) ) {
						tooltipTr = tooltipTable.append( "tr" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Value (Iridium):" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.produce.price * 2 )
							.append( "div" ).attr( "class", "gold" );
						tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "(" + ( d.profitData.ratioI * 100 ).toFixed( 0 ) + "%)" );
					}
				}
				tooltipTr = tooltipTable.append( "tr" );
				if ( d.produce.jarType != null ) {
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Value (" + d.produce.jarType + "):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.produce.price * 2 + 50 )
						.append( "div" ).attr( "class", "gold" );
				}
				else {
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Value (Jar):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "None" );
				}
				tooltipTr = tooltipTable.append( "tr" );
				if ( d.produce.kegType ) {
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Value (" + d.produce.kegType + "):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( kegPrice )
						.append( "div" ).attr( "class", "gold" );
				}
				else {
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Value (Keg):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "None" );
				}


				var first = true;
				if ( d.seeds.pierre > 0 ) {
					tooltipTr = tooltipTable.append( "tr" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Seeds (Pierre):" );
					first = false;
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.seeds.pierre )
						.append( "div" ).attr( "class", "gold" );
				}
				if ( d.seeds.joja > 0 ) {
					tooltipTr = tooltipTable.append( "tr" );
					if ( first ) {
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Seeds (Joja):" );
						first = false;
					}
					else
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Seeds (Joja):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.seeds.joja )
						.append( "div" ).attr( "class", "gold" );
				}
				if ( d.seeds.special > 0 ) {
					tooltipTr = tooltipTable.append( "tr" );
					if ( first ) {
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Seeds (Special):" );
						first = false;
					}
					else
						tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Seeds (Special):" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.seeds.special )
						.append( "div" ).attr( "class", "gold" );
					tooltipTr = tooltipTable.append( "tr" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.seeds.specialLoc );
				}

				tooltipTr = tooltipTable.append( "tr" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdLeftSpace" ).text( "Time to grow:" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.growth.initial + " days" );
				tooltipTr = tooltipTable.append( "tr" );
				tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Time to regrow:" );
				if ( d.growth.regrow > 0 )
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.growth.regrow + " days" );
				else
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( "N/A" );
				if ( d.produce.extra > 0 ) {
					tooltipTr = tooltipTable.append( "tr" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Extra produce:" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( d.produce.extra );
					tooltipTr = tooltipTable.append( "tr" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdLeft" ).text( "Extra chance:" );
					tooltipTr.append( "td" ).attr( "class", "tooltipTdRight" ).text( ( d.produce.extraPerc * 100 ) + "%" );
				}



			}
		} )
		.on( "mousemove", function () {
			tooltip.style( "top", ( d3.event.pageY - 16 ) + "px" ).style( "left", ( d3.event.pageX + 20 ) + "px" );
		} )
		.on( "mouseout", function () { tooltip.style( "visibility", "hidden" ); } )
		.on( "click", function ( d ) { window.open( d.url, "_blank" ); } );


}

/**
 * Updates the already rendered graph, showing animations.
 */
function updateGraph() {
	var x = updateScaleX();
	var y = updateScaleY();
	var ax = updateScaleAxis();

	var yAxis = d3.svg.axis()
		.scale( ax )
		.orient( "left" )
		.tickFormat( d3.format( ",s" ) )
		.ticks( 16 );

	axisY.transition()
		.call( yAxis );

	barsProfit.data( cropList )
		.transition()
		.attr( "x", function ( d, i ) {
			if ( d.drawProfit < 0 && options.buySeed && options.buyFert )
				return x( i ) + barOffsetX;
			else if ( d.drawProfit < 0 && !options.buySeed && options.buyFert )
				return x( i ) + barOffsetX;
			else if ( d.drawProfit < 0 && options.buySeed && !options.buyFert )
				return x( i ) + barOffsetX;
			else
				return x( i ) + barOffsetX;
		} )
		.attr( "y", function ( d ) {
			if ( d.drawProfit >= 0 )
				return y( d.drawProfit ) + barOffsetY;
			else
				return height + barOffsetY;
		} )
		.attr( "height", function ( d ) {
			if ( d.drawProfit >= 0 )
				return height - y( d.drawProfit );
			else
				return height - y( -d.drawProfit );
		} )
		.attr( "width", barWidth )
		.attr( "class", function ( d ) {
			if ( d.drawProfit >= 0 )
				return "profit";
			else
				return "loss";
		} );

	barsSeed.data( cropList )
		.transition()
		.attr( "x", function ( d, i ) { return x( i ) + barOffsetX; } )
		.attr( "y", height + barOffsetY )
		.attr( "height", function ( d ) {
			if ( options.buySeed )
				return height - y( -d.drawSeedLoss );
			else
				return 0;
		} )
		.attr( "width", barWidth )
		.attr( "class", "cost" );

	barsFert.data( cropList )
		.transition()
		.attr( "x", function ( d, i ) {
			if ( options.buySeed )
				return x( i ) + barOffsetX + barWidth / miniBar;
			else
				return x( i ) + barOffsetX;
		} )
		.attr( "y", height + barOffsetY )
		.attr( "height", function ( d ) {
			if ( options.buyFert )
				return height - y( -d.drawFertLoss );
			else
				return 0;
		} )
		.attr( "width", barWidth )
		.attr( "class", "fert" );

	imgIcons.data( cropList )
		.transition()
		.attr( "x", function ( d, i ) { return x( i ) + barOffsetX; } )
		.attr( "y", function ( d ) {
			if ( d.drawProfit >= 0 )
				return y( d.drawProfit ) + barOffsetY - barWidth - barPadding;
			else
				return height + barOffsetY - barWidth - barPadding;
		} )
		.attr( 'width', barWidth )
		.attr( 'height', barWidth )
		.attr( "xlink:href", function ( d ) { return "img/" + d.img; } );

	barsTooltips.data( cropList )
		.transition()
		.attr( "x", function ( d, i ) { return x( i ) + barOffsetX - barPadding / 2; } )
		.attr( "y", function ( d ) {
			if ( d.drawProfit >= 0 )
				return y( d.drawProfit ) + barOffsetY - barWidth - barPadding;
			else
				return height + barOffsetY - barWidth - barPadding;
		} )
		.attr( "height", function ( d ) {
			var topHeight = 0;

			if ( d.drawProfit >= 0 )
				topHeight = height + barWidth + barPadding - y( d.drawProfit );
			else
				topHeight = barWidth + barPadding;

			var lossArray = [0];

			if ( options.buySeed )
				lossArray.push( d.drawSeedLoss );
			if ( options.buyFert )
				lossArray.push( d.drawFertLoss );
			if ( d.drawProfit < 0 )
				lossArray.push( d.drawProfit );

			var swapped;
			do {
				swapped = false;
				for ( var i = 0; i < lossArray.length - 1; i++ ) {
					if ( lossArray[i] > lossArray[i + 1] ) {
						var temp = lossArray[i];
						lossArray[i] = lossArray[i + 1];
						lossArray[i + 1] = temp;
						swapped = true;
					}
				}
			} while ( swapped );

			return topHeight + ( height - y( -lossArray[0] ) );
		} )
		.attr( "width", barWidth + barPadding );
}

function updateSeasonNames() {
	if ( options.crossSeason ) {
		element( 'season_0' ).textContent = "Spring & Summer";
		element( 'season_1' ).textContent = "Summer & Fall";
		element( 'season_2' ).textContent = "Fall & Winter";
		element( 'season_3' ).textContent = "Winter & Spring";
	}
	else {
		element( 'season_0' ).textContent = "Spring";
		element( 'season_1' ).textContent = "Summer";
		element( 'season_2' ).textContent = "Fall";
		element( 'season_3' ).textContent = "Winter";
	}
}

function updateSeedChance() {

}

/**
 * Updates all options and data, based on the options set in the HTML.
 * After that, filters, values and sorts all the crops again.
 */
function updateData() {

	options.season = element( 'select_season' ).get();
	const isGreenhouse = options.season == 4;

	options.produce = element( 'select_produce' ).get();

	if ( element( 'number_planted' ).get() <= 0 )
		element( 'number_planted' ).set( 1 );
	options.planted = element( 'number_planted' ).get();

	if ( element( 'max_seed_money' ).get() < 0 )
		element( 'max_seed_money' ).set( '0' );
	options.maxSeedMoney = element( 'max_seed_money' ).get();
	if ( isNaN( options.maxSeedMoney ) ) {
		options.maxSeedMoney = 0;
	}

	options.average = element( 'check_average' ).get();

	options.crossSeason = element( 'cross_season' ).get();

	if ( !isGreenhouse ) {
		element( 'current_day' ).removeAttribute( 'disabled' );
		element( 'number_days' ).setAttribute( 'disabled', true );
		element( 'cross_season' ).removeAttribute( 'disabled' );

		if ( element( 'current_day' ).get() <= 0 )
			element( 'current_day' ).set( 1 );
		if ( options.crossSeason ) {
			element( 'number_days' ).set( 56 );
			if ( element( 'current_day' ).get() > 56 )
				element( 'current_day' ).set( 56 );
			options.days = 57 - element( 'current_day' ).get();
		}
		else {
			element( 'number_days' ).set( 28 );
			if ( element( 'current_day' ).get() > 28 )
				element( 'current_day' ).set( 28 );
			options.days = 29 - element( 'current_day' ).get();
		}
	} else {
		element( 'current_day' ).setAttribute( 'disabled', true );
		element( 'number_days' ).removeAttribute( 'disabled' );
		element( 'cross_season' ).setAttribute( 'disabled', true );

		if ( element( 'number_days' ).get() > 100000 )
			element( 'number_days' ).set( 100000 );
		options.days = element( 'number_days' ).get();
	}

	options.seeds.pierre = element( 'check_seedsPierre' ).get();
	options.seeds.joja = element( 'check_seedsJoja' ).get();
	options.seeds.special = element( 'check_seedsSpecial' ).get();

	options.buySeed = element( 'check_buySeed' ).get();
	if ( options.buySeed == false ) element( 'max_seed_money' ).setAttribute( 'disabled', true )
	else element( 'max_seed_money' ).removeAttribute( 'disabled' );

	options.fertilizer = element( 'select_fertilizer' ).get();

	options.buyFert = element( 'check_buyFert' ).get();

	options.fertilizerSource = element( 'speed_gro_source' ).get();

	if ( element( 'farming_level' ).value <= 0 )
		element( 'farming_level' ).set( 1 );
	if ( element( 'farming_level' ).get() > 13 )
		element( 'farming_level' ).set( 13 );
	options.level = element( 'farming_level' ).get();

	if ( options.level >= 5 ) {
		element( 'check_skillsTill' ).disabled = false;
		element( 'check_skillsTill' ).style.cursor = "pointer";
		options.skills.till = element( 'check_skillsTill' ).get();
	}
	else {
		element( 'check_skillsTill' ).disabled = true;
		element( 'check_skillsTill' ).style.cursor = "default";
		element( 'check_skillsTill' ).set( false );
	}

	if ( options.level >= 10 && options.skills.till ) {
		element( 'select_skills' ).disabled = false;
		element( 'select_skills' ).style.cursor = "pointer";
	}
	else {
		element( 'select_skills' ).disabled = true;
		element( 'select_skills' ).style.cursor = "default";
		element( 'select_skills' ).set( 0 );
	}
	if ( element( 'select_skills' ).get() == 1 ) {
		options.skills.agri = true;
		options.skills.arti = false;
	}
	else if ( element( 'select_skills' ).get() == 2 ) {
		options.skills.agri = false;
		options.skills.arti = true;
	}
	else {
		options.skills.agri = false;
		options.skills.arti = false;
	}

	if ( element( 'foraging_level' ).get() <= 0 )
		element( 'foraging_level' ).set( 1 );
	if ( element( 'foraging_level' ).get() > 13 )
		element( 'foraging_level' ).set( 13 );
	options.foragingLevel = element( 'foraging_level' ).get();

	if ( options.foragingLevel >= 5 ) {
		element( 'check_skillsGatherer' ).disabled = false;
		element( 'check_skillsGatherer' ).style.cursor = "pointer";
		options.skills.gatherer = element( 'check_skillsGatherer' ).get();
	}
	else {
		element( 'check_skillsGatherer' ).disabled = true;
		element( 'check_skillsGatherer' ).style.cursor = "default";
		element( 'check_skillsGatherer' ).set( false );
	}

	if ( options.foragingLevel >= 10 && options.skills.gatherer ) {
		element( 'check_skillsBotanist' ).disabled = false;
		element( 'check_skillsBotanist' ).style.cursor = "pointer";
		options.skills.botanist = element( 'check_skillsBotanist' ).get();
	}
	else {
		element( 'check_skillsBotanist' ).disabled = true;
		element( 'check_skillsBotanist' ).style.cursor = "default";
		element( 'check_skillsBotanist' ).set( false );
	}

	options.food = element( 'select_food' ).get();
	if ( options.buyFert && options.fertilizer == 4 )
		element( 'speed_gro_source' ).disabled = false;
	else
		element( 'speed_gro_source' ).disabled = true;

	options.extra = element( 'check_extra' ).get();

	updateSeasonNames();

	// Persist the options object into the URL hash.
	window.location.hash = encodeURIComponent( serialize( options ) );

	fetchCrops();
	valueCrops();
	sortCrops();
}

const elements = {};

function getValue(element, valueType, is_select) {
	let value = element[valueType];
	if (is_select) {
		if (Array.isArray(value)) value = value[0];
		value = value - 1;
	}
	return value;
}

function setValue(element, valueType, is_select, newValue) {
	if (valueType=='checked') {
		if (newValue) element.setAttribute('checked', newValue);
		else element.removeAttribute('checked');
	}
	if (is_select) newValue = parseInt(newValue) + 1;
	return (element.setAttribute('value', newValue));
}

function element(id) {
	let element = elements[id];
	
	if (!elements[id]) {
		
		element = document.getElementById(id);
		const type = element.getAttribute('type');
		const tag = element.tagName.toLowerCase();
		const valueType = /(radio|checkbox)/gi.test(type) ? 'checked' : 'value';
		const is_select = /sl-select/i.test(tag);
	
		element.get =()=> getValue(element, valueType, is_select);
		element.set =(newValue)=> setValue(element, valueType, is_select, newValue);

		elements[id] = element;
	}
	return element;
}

/**
 * Called once on startup to draw the UI.
 */
async function initial() {
	const promises = [
		customElements.whenDefined('sl-select'),
		customElements.whenDefined('sl-checkbox'),
		customElements.whenDefined('sl-input'),
		customElements.whenDefined('sl-button'),
	];

	await Promise.allSettled(promises);

	for (const el of document.querySelectorAll('[sl-event]')) {
		let event = 'sl-' + el.getAttribute('sl-event');
		let action = el.getAttribute('sl-action');
		if (action=='refresh') el.addEventListener(event, refresh);
		if (action=='rebuild') el.addEventListener(event, rebuild);
	}

	for (const el of document.querySelectorAll('[stepper="wrapper"]')) {
		let target = el.querySelector('[stepper="target"]');
		let up = el.querySelector('[stepper="increment"]');
		let down = el.querySelector('[stepper="decrement"]');
		up.addEventListener('click', e=> {
			val = target.getAttribute('value');
			target.setAttribute('value', parseInt(val) + 1);
			refresh();
		});
		down.addEventListener('click', e=> {
			val = target.getAttribute('value');
			target.setAttribute('value', parseInt(val) - 1);
			refresh();
		});
	}

	optionsLoad();
	updateData();
	renderGraph();
}

/**
 * Called on every option change to animate the graph.
 */
function refresh() {
	updateData();
	updateGraph();
}

/**
 * Parse out and validate the options from the URL hash.
 */
function optionsLoad() {
	if (!window.location.hash) return;

	options = deserialize(window.location.hash.slice(1));

	function validBoolean(q) {

		return q == 1;
	}

	function validIntRange(min, max, num) {

		return num < min ? min : num > max ? max : parseInt(num, 10);
	}

	options.season = validIntRange(0, 4, options.season);
	element('select_season').set(options.season);

	options.produce = validIntRange(0, 2, options.produce);
	element('select_produce').set(options.produce);

	options.planted = validIntRange(1, MAX_INT, options.planted);
	element('number_planted').set(options.planted);

    options.maxSeedMoney = validIntRange(0, MAX_INT, options.maxSeedMoney);
    element('max_seed_money').set(options.maxSeedMoney);

	options.average = validBoolean(options.average);
	element('check_average').set(options.average);

    options.crossSeason = validBoolean(options.crossSeason);
    element('cross_season').set(options.crossSeason);

    var daysMax = 0;
    if (options.crossSeason)
        daysMax = options.season === 4 ? MAX_INT : 56;
    else
        daysMax = options.season === 4 ? MAX_INT : 28;

    options.days = validIntRange(1, daysMax, options.days);
    if (options.season === 4) {
        element('number_days').set(options.days);
    } 
    else {
        if (options.crossSeason) {
            element('number_days').set(56);
            element('current_day').set(57 - options.days);
        }
        else {
            element('number_days').set(28);
            element('current_day').set(29 - options.days);
        }
    }

	options.seeds.pierre = validBoolean(options.seeds.pierre);
	element('check_seedsPierre').set(options.seeds.pierre);

	options.seeds.joja = validBoolean(options.seeds.joja);
	element('check_seedsJoja').set(options.seeds.joja);

	options.seeds.special = validBoolean(options.seeds.special);
	element('check_seedsSpecial').set(options.seeds.special);

	options.buySeed = validBoolean(options.buySeed);
	element('check_buySeed').set(options.buySeed);

	options.fertilizer = validIntRange(0, 6, options.fertilizer);
	element('select_fertilizer').set(options.fertilizer);

    options.fertilizerSource = validIntRange(0, 1, options.fertilizerSource);
    element('speed_gro_source').set(options.fertilizerSource);

	options.buyFert = validBoolean(options.buyFert);
	element('check_buyFert').set(options.buyFert);

	options.level = validIntRange(0, 13, options.level);
	element('farming_level').set(options.level);

	options.skills.till = validBoolean(options.skills.till);
	element('check_skillsTill').set(options.skills.till);

	options.skills.agri = validBoolean(options.skills.agri);
	options.skills.arti = validBoolean(options.skills.arti);
	const binaryFlags = options.skills.agri + options.skills.arti * 2;
	element('select_skills').set(binaryFlags);

    options.foragingLevel = validIntRange(0, 13, options.foragingLevel);
    element('foraging_level').set(options.foragingLevel);

    options.skills.gatherer = validBoolean(options.skills.gatherer);
    element('check_skillsGatherer').set(options.skills.gatherer);

    options.skills.botanist = validBoolean(options.skills.botanist);
    element('check_skillsBotanist').set(options.skills.botanist);

	options.food = validIntRange(0, 6, options.food);
	element('select_food').set(options.food);

	options.extra = validBoolean(options.extra);
	element('check_extra').set(options.extra);

    updateSeasonNames();
}

function deserialize(str) {
	var json = `(${str})`
		.replaceAll('_', ':')
		.replaceAll('-', ',')
		.replaceAll('(', '{')
		.replaceAll(')', '}')
		.replaceAll(/([a-z]+)/gi, '"$1"')
		.replaceAll(/"(true|false)"/gi, '$1');

    //console.log(json);

	return JSON.parse(json);
}

function serialize(obj) {

	return Object.keys(obj)
		.reduce((acc, key) => {
			return /^(?:true|false|\d+)$/i.test('' + obj[key])
				? `${acc}-${key}_${obj[key]}`
				: `${acc}-${key}_(${serialize(obj[key])})`;
		}, '')
		.slice(1);
}

/**
 * Called when changing season/seeds, to redraw the graph.
 */
function rebuild() {
	gAxis.selectAll("*").remove();
	gProfit.selectAll("*").remove();
	gSeedLoss.selectAll("*").remove();
	gFertLoss.selectAll("*").remove();
	gIcons.selectAll("*").remove();
	gTooltips.selectAll("*").remove();

	updateData();
	renderGraph();
}

document.addEventListener('DOMContentLoaded', function() {
	initial();
});
document.addEventListener('click', function (event) {
	if (event.target.id === 'reset') window.location = 'index.html';
});