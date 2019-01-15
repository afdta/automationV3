import map from "../../../js-modules/state-map.js";
import format from "../../../js-modules/formats.js";
import layout from "./layout.js";

import {geos_state} from '../../../js-modules/geos-state.js';
import geos_cbsa from '../../../js-modules/geos-cbsa';

import {occ_cbsa, occ_state} from './raw-data.js';

import palette from './palette.js';

function draw_legend(container, scale, float){
    var wrap = d3.select(container)

    var rscale = scale.value_in;

    wrap.append("p").html("<strong>Share of metro area jobs susceptible to automation</strong>").style("margin","15px 0px 15px 0px");
    var legend = wrap.append("div").classed("legend-swatches",true);

    var entries = legend.selectAll("div").data(["hi","md","lo"]).enter().append("div");

    var labels = {
        lo:"Low",
        md:"Medium",
        hi:"High"
    }

    entries.append("div").style("background-color", function(d){return palette.cols[d]});
    entries.append("p").text(function(d){return labels[d]});

    wrap.append("p").html("<em>Note: Each group contains one-third of the 100 largest metro areas</em>").style("clear","both");


    /////
    var side_panel = wrap.append("div").classed("c-fix",true).style("padding","15px 0px 0px 0px")
    side_panel.append("p").html("<strong>Number of jobs susceptible to automation</strong>").style("margin-bottom","20px")

    var devalued_svg = side_panel.append("svg").attr("width","170px").attr("height","70px").style("float","left");
    devalued_svg.append("path").attr("d","M0,44 l165,0 l-7,-7").attr("stroke", "#555555").attr("stroke-width","2").attr("fill","none").attr("stroke-linejoin","round")
    devalued_svg.append("text").text("More jobs susceptible").style("font-size","13px").style("font-weight","bold").attr("y","59").attr("x",165).attr("text-anchor","end");

    var circlesD = devalued_svg.selectAll("circle").data([250000, 750000, 1500000, 3500000]);
    circlesD.enter().append("circle").merge(circlesD).attr("cx", function(d,i){
        return (10 + (i*35) - i*(15-rscale(d)));
    }).attr("cy",function(d){return 37-rscale(d)})
    .attr("r", function(d,i){return rscale(d)})
    .attr("fill","none")
    .attr("stroke","#333333")
    .attr("stroke-width","2");
    
    wrap.append("p").html("<em>Hover over a metro area to see detail</em>").style("clear","both");


    if(arguments.length > 2){
        entries.style("float",float);
    }

}

export default function map_graphic(container){

        var header = d3.select(container).append("div").classed("as-table",true)
                            .style("margin","0px 0px 22px 0px")
                            .append("div");
            
        var title_cell = header.append("div").style("border-bottom","0px solid #dddddd").style("margin-bottom","25px");
        var title = title_cell.append("p").classed("mi-graphic-title",true)
        .style("text-align","center")
        .text("Average automation potential by metropolitan area, 2016");

        var subtitle = title_cell.append("p").classed("mi-graphic-subtitle",true)
        .style("text-align","center").style("font-style","italic")
        .text("100 largest metropolitan areas");

        //DOM ROOTS
        var map_layout = layout(container);
        //draw map here
        var map_panel = map_layout.panels.map;
        //wide viewport legend here
        var side_panel = map_layout.panels.side;
        //mobile view port legend here
        var mobile_panel = map_layout.panels.mobile.style("text-align","center").append("div").style("text-align","left");

        var max_radius = 20;

        function rad_scale_gen(dat){
            var lookup = {};
            var max = 0;

            dat.forEach(function(d,i){
                var val = d.e16;
                if(val > max){
                    max = val;
                }
                lookup[d.geo] = val;
            });

            var rad = d3.scaleSqrt().domain([0,max]).range([0,max_radius]);

            var scale = function(geo){
                var r = 0;
                if(lookup.hasOwnProperty(geo) && lookup[geo] != null){
                    r = rad(lookup[geo]);
                }
                return r;
            }

            scale.value_in = rad;

            return scale;
        }

        function fill_scale_gen(dat){
            var lookup = {};
            dat.forEach(function(d,i){
                lookup[d.geo] = d.sh16;
            });

            var fill = d3.scaleQuantile()
                         .domain(dat.map(function(d){
                            return d.sh16;
                         }))
                         .range(["lo","md","hi"])
                         ;

            var scale = function(geo){
                var r = "#dddddd";
                if(lookup.hasOwnProperty(geo) && lookup[geo] != null){
                    r = palette.cols[fill(lookup[geo])];
                }
                return r;
            }

            return scale;
        }

        function html_gen(dat){
            var lookup = {};
            dat.forEach(function(d,i){
                var name = '<p style="margin:0px 0px 10px 0px;"><strong>' + d.name + '</strong></p>';
                var emp = '<p style="margin:5px 0px;text-align:right;">Number of susceptible jobs, 2016: <strong>' + format.num0(d.e16) + '</strong></p>';
                var share = '<p style="margin:5px 0px;text-align:right;">Share of jobs that are susceptible: <strong>' + format.sh1(d.sh16) + '</strong></p>';
                lookup[d.geo] = name + emp + share;
            });

            var look = function(geo){
                if(lookup.hasOwnProperty(geo) && lookup[geo] != null){
                    return lookup[geo];
                }
                else{
                    return "N/A";
                }
            }

            return look;
        }

        var show_tooltip = html_gen(occ_cbsa);
        var rscale = rad_scale_gen(occ_cbsa);

        draw_legend(side_panel.node(), rscale);
        draw_legend(mobile_panel.node(), rscale);

        var filtered_cbsas = geos_cbsa.filter(function(d){
            return show_tooltip(d.cbsa) != "N/A";
        })

        var statemap = map(map_panel.node());
        var state_layer = statemap.add_states(geos_state, function(d){return d.properties.geo_id}).attr({fill:"#ffffff", stroke:"#aaaaaa"});
        var cbsa_layer = statemap.add_points(filtered_cbsas, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({fill:"none", "stroke-width":"3", stroke:fill_scale_gen(occ_cbsa), r:rscale, "pointer-events":"all"});
        var map_panels = statemap.panels();

        cbsa_layer.tooltips(show_tooltip);

        map_layout.onresize(function(){
            var width = this.widths.map;
            statemap.print(width);
        });

        statemap.print();
}