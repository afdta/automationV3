import map from "../../../js-modules/state-map.js";
import layout from "./layout.js";

import {geos_state} from '../../../js-modules/geos-state.js';
import geos_cbsa from '../../../js-modules/geos-cbsa';

import {occ_cbsa, occ_state} from './raw-data.js';

import palette from './palette.js';

function render_legend(container){
    var wrap = d3.select(container);

    wrap.append("p").text("Legend here");
}

export default function map_graphic(container){
        //DOM ROOTS
        var map_layout = layout(container);
        //draw map here
        var map_panel = map_layout.panels.map;
        //wide viewport legend here
        var side_panel = map_layout.panels.side;
        //mobile view port legend here
        var mobile_panel = map_layout.panels.mobile.style("text-align","center").append("div").style("text-align","left");

        render_legend(side_panel.node());
        render_legend(mobile_panel.node());

        console.log(occ_cbsa);
        console.log(occ_state);

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

        var statemap = map(map_panel.node());
        var state_layer = statemap.add_states(geos_state, function(d){return d.properties.geo_id}).attr({fill:"#ffffff", stroke:"#aaaaaa"});
        var cbsa_layer = statemap.add_points(geos_cbsa, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({fill:"none", "stroke-width":"3", stroke:fill_scale_gen(occ_cbsa), r:rad_scale_gen(occ_cbsa), "pointer-events":"all"});
        var map_panels = statemap.panels();

        map_layout.onresize(function(){
            var width = this.widths.map;
            statemap.print(width);
        });

        statemap.print();
}