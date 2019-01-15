import {occs, occ_names, occ_medians} from './raw-data.js';
import palette from './palette.js';
import layout from "./layout.js";

export default function occ_graphic(container){
    
    var wrap = d3.select(container).append("div");

    var header = wrap.append("div").classed("as-table",true)
                        .style("margin","0px 0px 22px 0px")
                        .append("div");
        
    var title_cell = header.append("div").style("border-bottom","0px solid #dddddd").style("margin-bottom","25px");
    var title = title_cell.append("p").classed("mi-graphic-title",true)
    .style("text-align","center")
    .text("Automation potential by major occupation group, 2016");

    var subtitle = title_cell.append("p").classed("mi-graphic-subtitle",true)
    .style("text-align","center").style("font-style","italic")
    .text("");


    //DOM ROOTS
    var chart_layout = layout(container);
    //draw map here
    var chart_panel = chart_layout.panels.map;
    //wide viewport legend here
    var side_panel = chart_layout.panels.side.append("div").style("padding-left","20px");
    //mobile view port legend here
    var mobile_panel = chart_layout.panels.mobile.style("text-align","center").append("div").style("text-align","left");

    //dimensions of row height
    var bar_height = 20;
    var bar_pad = 7;
    var top_pad = 30;

    var axis_height = 45;

    //bars root                            
    var bar_wrap = chart_panel.append("div").style("margin","0px auto")
                            .style("position","relative");

    var svg = bar_wrap.append("svg").attr("width","100%");

    var tooltip = bar_wrap.append("div")
                        .style("width","200px")
                        .style("min-height","80px")
                        .style("left","0px")
                        .style("top","100px")
                        .style("position","absolute")
                        .style("border","1px solid #aaaaaa")
                        .style("background-color","#ffffff")
                        .style("display","none")
                        .style("padding","10px 15px")
                        .style("border-radius","15px")
                        .style("box-shadow","1px 1px 8px rgba(0,0,0,0.4)")
                        ;

    //widths
    var labels_width = 360;
    var bars_width = 150;
    var min_anno_width = 30;   
    
    var g_axis = svg.append("g").attr("transform","translate(0.5,0)");
    var g_dots = svg.append("g").attr("transform","translate(0.5,0)");
    var g_medians = svg.append("g").attr("transform","translate(0.5,0)");
    var g_anno = svg.append("g").attr("transform","translate(0.5,0)");
    
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
            return v < 0.3 ? cols.lo : (v >= 0.7 ? cols.hi : cols.md);
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

    var detail_shown = false;
    var dispatch = d3.dispatch("toggle");

    function draw_legend(container, id, float){
        var wrap = d3.select(container)

        wrap.append("p").html("<strong>Share of tasks that are susceptible to automation</strong>").style("margin","15px 0px 15px 0px");
        var legend = wrap.append("div").classed("legend-swatches",true);

        var entries = legend.selectAll("div").data(["hi","md","lo"]).enter().append("div");

        var labels = {
            lo:"Low (0%–30%)",
            md:"Medium (30%–70%)",
            hi:"High (70%–100%)"
        }

        entries.append("div").style("background-color", function(d){return palette.cols[d]});
        entries.append("p").text(function(d){return labels[d]});

        var toggle = wrap.append("div").classed("mi-button",true);
        var toggle_text = toggle.append("p").style("margin","0px").style("position","relative");

        dispatch.on("toggle."+id, function(){
            toggle_text.text(detail_shown ? "Hide detailed occupations" : "Show detailed occupations");
        });

        toggle.on("mousedown", function(){
            detail_shown = !detail_shown;
            dispatch.call("toggle");
            update();
        });

        if(arguments.length > 2){
            entries.style("float",float);
            toggle.style("float",float);
        }

    }

    draw_legend(side_panel.node(), "one", "none");
    draw_legend(mobile_panel.node(), "two");
    
    dispatch.call("toggle");

    //pointer events // tooltips
    var dot_timeout;
        
    function show(d,i){
        var x_ = x(d.auto) - 200;
        var y_ = y(d.occ2);

        var thiz = d3.select(this);
        var cx = thiz.attr("cx");
        var cy = parseFloat(thiz.attr("cy"));
        var r = parseFloat(thiz.attr("r"))*2;
        var col = thiz.attr("stroke");

        var circle = g_anno.selectAll("circle").data([1]);
        circle.enter().append("circle").merge(circle)
            .style("pointer-events","none")
            .attr("cx", cx).attr("cy", y_ + cy).attr("r", r)
            .attr("stroke","#333333").attr("fill","none").attr("stroke-width","2")
            ;

        clearTimeout(dot_timeout);

        tooltip.style("border-color", col);

        tooltip.interrupt()
                .html('<p style="margin:0px;">' + d.occ + '</p>' + 
                     '<p style="margin:10px 0px;"><strong>' + 
                    (Math.round(d.auto*1000)/10) + 
                    '%</strong></p>')

                .style("display","block")
                .style("top",(y_+5)+"px")
                .style("left",x_+"px")
                .transition().duration(50).style("opacity","1")
    };

    function hide(){
        dot_timeout = setTimeout(function(){
            tooltip.interrupt().transition().duration(0)
                    .style("opacity","0").on("end", function(){
                        tooltip.style("display","none");
                    });

            g_anno.selectAll("circle").remove();
        }, 100);
    }

    chart_panel.on("mouseleave", hide).on("mousedown", hide);

    function update(){

        resize();

        add_ticks(g_axis, x);

        g_dots.style("visibility", detail_shown ? "visible" : "hidden")
                .style("pointer-events", detail_shown ? "all" : "none");

        subtitle.text(detail_shown ? "Automation potential of all detailed occupations" : "Median automation potential of detailed occupations within each major occupation group")

        //stacked
        var igroupsU = g_dots.selectAll("g.igroup").data(nested2, function(d,i){return d.occ2});
            igroupsU.exit().remove();
        var igroupsE = igroupsU.enter().append("g").classed("igroup",true)
        var igroups = igroupsE.merge(igroupsU);

        igroups.attr("transform", function(d,i){
            return "translate(0," + y(d.occ2) + ")"
        })

        var dotsU = igroups.selectAll("circle").data(function(d){return d.values}, function(d){return d.occ});
        dotsU.exit().remove();
        var dots = dotsU.enter().append("circle").merge(dotsU)
                .interrupt()
                .attr("cy",function(d){return 2 - (4*Math.random())})
                .attr("cx",labels_width)
                .attr("r", 3)
                .attr("fill","none")
                .style("opacity","0")
                .attr("stroke-width",2.5)
                .attr("stroke-opacity","0.8")
                .attr("stroke", function(d){return auto_fill(d.auto)})
                .style("pointer-events", detail_shown ? "all" : "none")
                ;

        dots.transition()
            .duration(700)
            .delay(function(d,i){return y_(d.occ2)*10})
            .attr("cx", function(d){return x(d.auto)})
            .style("opacity","1")
            ;
                
        dots.on("mousedown", function(d,i){
                d3.event.stopPropagation();
                show.call(this, d, i);
            })
            .on("mouseenter", show)
            ;


        

        var mgroupsU = g_medians.selectAll("g.mgroup").data(occ_medians);
        mgroupsU.exit().remove();
        var mgroupsE = mgroupsU.enter().append("g").classed("mgroup",true)
            mgroupsE.append("line");

        var mgroups = mgroupsE.merge(mgroupsU)
        .attr("transform", function(d,i){
            return "translate(0," + y(d.occ2) + ")"
        });

        mgroups.select("line").attr("x1", x(x.domain()[0]))
                .attr("x2", x(x.domain()[1])).attr("stroke","#aaaaaa")
                .attr("stroke-dasharray","2,2")
                .attr("y1",0.5).attr("y2",0.5);

        var group_labels = mgroups.selectAll("text.industry-name").data(function(d){return [occ_names[d.occ2]]});
            group_labels.enter().append("text").classed("industry-name",true).merge(group_labels)
              .text(function(d){return d})
              .attr("dy",5)
              .attr("y", 0)
              .attr("x", labels_width)
              .attr("dx",-4)
              .attr("text-anchor","end")
              .style("font-size","15px")
              .style("font-weight", "bold");

        //median markers
        var markersU = mgroups.selectAll("g.marker_group").data(function(d){return [d]});
        markersU.exit().remove();
        var markersE = markersU.enter().append("g").classed("marker_group",true);
        var markers = markersE.merge(markersU)
                .attr("transform", function(d,i){
                    return "translate(" + x(d.auto) + "," + 0 + ")"
                });

        //median markers
        var markers2U = mgroups.selectAll("circle").data(function(d){return [d]});
        markers2U.exit().remove();
        var markers2E = markers2U.enter().append("circle");
        var markers2 = markers2E.merge(markers2U)
            .attr("cx", function(d,i){return x(d.auto);})
            .attr("cy", 0)
            .attr("fill", "#555555")
            .attr("r","1.5")
            .style("visibility","hidden")
            ;

        var tris = markers.selectAll("path").data(function(d){return [d]});
        tris.enter().append("path").merge(tris)
                .attr("d", "M0,-10.5 l6,0 l-6,11, l-6,-11 z")
                .transition().duration(detail_shown ? 700 : 0)
                .attr("fill",function(d){
                    return detail_shown ? "#555555" : auto_fill(d.auto)
                })
                .attr("stroke","#ffffff")
                ;
                //.attr("stroke",function(d){return d3.rgb(auto_fill(d.auto)).darker()});
        
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

        update();

        var throttle;

        chart_layout.onresize(function(){
            clearTimeout(throttle);
            throttle = setTimeout(update, 150);
        });

    }, 0)    



    function add_ticks(g, scale){
        var ticks = [0,0.3,0.7,1];

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
  
}

