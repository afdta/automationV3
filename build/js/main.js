import dir from "../../../js-modules/rackspace.js";
import degradation from "../../../js-modules/degradation.js";
import scroll_and_tell from '../../../js-modules/scroll-and-tell.js';

//main function
function main(){


  //local
  dir.local("./");
  //dir.add("dirAlias", "path/to/dir");
  //dir.add("dirAlias", "path/to/dir");


  //production data
  //dir.add("dirAlias", "rackspace-slug/path/to/dir");
  //dir.add("dirAlias", "rackspace-slug/path/to/dir");
  var compat = degradation(document.getElementById("metro-interactive"));

  var cback = function(ratio, forward){
    //console.log(this);
    console.log(ratio + " (" + this.target.id + " forward/down: " + forward + ")" )
  }


  //browser degradation
  if(compat.browser()){
    //scroll_and_tell(document.getElementById("yellow"), cback).threshold([0.5]).margin(-50, 0, 0, 0, "%");
    scroll_and_tell(document.getElementById("blue"), cback);
    //scroll_and_tell(document.getElementById("yellow"), cback);
  }


} //close main()


document.addEventListener("DOMContentLoaded", main);
