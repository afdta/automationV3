import {occs, occ_names, occ_medians} from './raw-data.js';
import palette from './palette.js';

export default function occ_graphic(container){
    
    var wrap = d3.select(container).append("div");

    var header = wrap.append("div").classed("as-table",true)
                        .style("margin","0px 0px 22px 0px")
                        .append("div");
        
    var title_cell = header.append("div")
    var title = title_cell.append("p").classed("mi-title2",true).style("margin","0px");

    var legend = header.append("div").style("border-right","0px solid #aaaaaa").style("padding-right","10px");
    legend.append("p").html('<strong>Legend title</strong>');
    
    legend.append("p").html('<span class="key-swatch promising-jobs">Promising jobs</span><br /><em>Held by workers without a bachelor\'s degree</em>').style("color","#555555") 
    legend.append("p").html('<span class="key-swatch good-jobs">Good jobs</span><br /><em>Held by workers without a bachelor\'s degree</em>').style("color","#555555");    
    legend.append("p").html('<span class="key-swatch hi-jobs">High-skill jobs</span><br /><em>Good and promising jobs held by workers with a bachelor\'s degree</em>').style("color","#555555")
    legend.append("p").html('<span class="key-swatch other-jobs">Other jobs</span><br /><em>All other jobs</em>').style("color","#555555")

    //dimensions of row height
    var bar_height = 20;
    var bar_pad = 10;
    var top_pad = 10;

    var axis_height = 45;

    //bars root                            
    var bar_wrap = wrap.append("div").style("border-top","0px solid #aaaaaa").style("margin","0px auto");
    var svg = bar_wrap.append("svg").attr("width","100%");

    //widths
    var labels_width = 360;
    var bars_width = 150;
    var min_anno_width = 30;   
    
    var g_axis = svg.append("g").attr("trasnform","translate(0.5,0)");
    var g_bars = svg.append("g").attr("transform","translate(0.5,0)");
    
    occ_medians.sort(function(a,b){
        return d3.descending(a.auto, b.auto);
    });

    //scales
    var x = d3.scaleLinear().domain([0,1]).range([labels_width, bars_width+labels_width]);
    var y_ = d3.scaleOrdinal().domain(occ_medians.map(function(d){return d.occ2}))
                             .range(d3.range(0, occ_medians.length));

    var i2y = function(i){
        return (top_pad + (i * (bar_height + bar_pad)));
    } 

    var y = function(v){
        var i = y_(v);
        return i2y(i);
    };

    var width = function(v){
        if(v==null){
            return 0;
        }
        else{
            return x(v) - x(0);
        }
    }

    //automation labels and colors
    var auto_labels = {hi:"High", md:"Medium", lo:"Low"};
    var auto_fill = function(v){
        var cols = palette.cols;
        if(v == null){
            return "#dddddd";
        }
        else{
            return v <= 0.3 ? cols.lo : (v > 0.7 ? cols.hi : cols.md);
        }
    }

    //nest the data
    var nested = {};
    occs.forEach(function(d){
        var occ2 = d.occ2;
        if(nested.hasOwnProperty(occ2)){
            nested[occ2].values.push(d);
        }
        else{
            nested[occ2] = {occ2:occ2, name:occ_names[occ2], values:[d]}
        }
    });

    var nested2 = [];
    for(var o2 in nested){
        if(nested.hasOwnProperty(o2)){
            nested2.push(nested[o2]);
        }
    }

    function update(){

        resize();

        //stacked
        var igroupsU = g_bars.selectAll("g").data(nested2, function(d,i){return d.occ2});
            igroupsU.exit().remove();
        var igroupsE = igroupsU.enter().append("g")
            igroupsE.append("line");

        var igroups = igroupsE.merge(igroupsU);

        igroups.attr("transform", function(d,i){
            return "translate(0," + y(d.occ2) + ")"
        })

        igroups.select("line").attr("x1", x(x.domain()[0]))
                              .attr("x2", x(x.domain()[1])).attr("stroke","#aaaaaa").attr("stroke-dasharray","2,2")
                              .attr("y1",0.5).attr("y2",0.5);

        var group_labels = igroups.selectAll("text.industry-name")
                                  .data(function(d){
                                      return [occ_names[d.occ2]];
                                    });
        group_labels.enter().append("text").classed("industry-name",true).merge(group_labels)
                                .text(function(d){return d})
                                .attr("dy",5)
                                .attr("y",0)
                                .attr("x", labels_width)
                                .attr("dx",-4)
                                .attr("text-anchor","end")
                                .style("font-weight", "normal");

        var dots = igroups.selectAll("circle").data(function(d){return d.values}, function(d){return d.occ});

        dots.exit().remove();
        dots.enter().append("circle").merge(dots)
                .attr("cy",function(d){return 2 - (4*Math.random())})
                .attr("cx", function(d){return x(d.auto)})
                .attr("r", 3)
                .attr("fill","none")
                .attr("stroke-width",2.5)
                .attr("stroke-opacity","0.8")
                .attr("stroke", function(d){return auto_fill(d.auto)})
                //.attr("stroke", function(d){return d3.color(d.fill).darker()})
                
                ;
        
        var svg_height = i2y(occ_medians.length-1) + top_pad;

        g_axis.attr("transform","translate(0.5," + svg_height + ")");
        svg.attr("height", (svg_height+axis_height) + "px" );
    }

    function resize(){
        try{
            var box = bar_wrap.node().getBoundingClientRect();
            var w = box.right - box.left;
            bars_width = w - labels_width;

            if(bars_width < 100){
                throw new Error("Too narrow");
            }
        }
        catch(e){
            bars_width = 100;
        }

        x.range([labels_width+12, w-12]).nice();
    }

    //initialize
    setTimeout(function(){

        window.addEventListener("resize", function(){
            update();
        });

    }, 0)    



    function add_ticks(g, scale){
        var ticks = [0,0.25,0.5,0.75,1];

        var ax = g.selectAll("line.axis-line").data([{x1:scale(0), x2:scale(1)}]);
        ax.exit().remove();
        ax.enter().append("line").classed("axis-line",true).style("opacity","0").merge(ax)
            .attr("y1", 0.5).attr("y2", 0.5)
            .attr("stroke","#aaaaaa")
            .transition().duration(1000)
            .attr("x1", function(d){return d.x1})
            .attr("x2", function(d){return d.x2})
            .style("opacity",1)
            ;


        var lines = g.selectAll("line.tick-mark").data(ticks);
        lines.exit().remove();
        lines.enter().append("line").classed("tick-mark",true).style("opacity","0").merge(lines)
            .attr("y1", 0).attr("y2", 7)
            .attr("stroke","#aaaaaa")
            .transition().duration(1000)
            .attr("x1", function(d){return scale(d)})
            .attr("x2", function(d){return scale(d)})
            .style("opacity",1)
            ;

        var text = g.selectAll("text.tick-mark").data(ticks);
        text.exit().remove();
        text.enter().append("text").classed("tick-mark",true).style("opacity","0").merge(text)
            .attr("y", 7).attr("dy",14)
            .text(function(d){return (d*100) + "%"})
            .style("font-size","14px")
            .attr("dx","0")
            .attr("text-anchor", function(d){return d==0 ? "start" : (d==1 ? "end" : "middle")})
            .transition().duration(1000)
            .attr("x", function(d){return scale(d)})
            .style("opacity",1)
            ;
    }


    return update;    
}

