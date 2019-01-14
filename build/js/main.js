import degradation from "../../../js-modules/degradation.js";

import occ_graphic from './occupations.js';
import map_graphic from './automation-map.js';

//main function
function main(){

  var occ_container = document.getElementById("occupations-graphic");
  var map_container = document.getElementById("geography-graphic");

  var compat = degradation(occ_container);

  //browser degradation
  if(compat.browser()){
    setTimeout(function(){
      occ_graphic(occ_container)();
      map_graphic(map_container);
    }, 0);
  }
  else{
    compat.alert(occ_container);
    compat.alert(map_container);
  }

} //close main()


document.addEventListener("DOMContentLoaded", main);
