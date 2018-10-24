
var first = true

renderMap();

function setHeight() {
  var height = $(window).height(); 
  $("#map-container").css("height", height);
}


function getData() {
    var inputs = $('#gridConfig :input');

    var values = {}

    for (var i = 0; i < inputs.length; i++) {
      values[inputs[i].id] = inputs[i].value;
    }

    return values;

}


function generateGrid(data, bbox) {
  

  data["options"] = {units: data["uom"]}
  
  // generate grid
  if (data.gridType == 'square') {
     return grid = turf.squareGrid(bbox, data.cellSize, data.options);
  } else if (data.gridType == 'hex') {
    return grid = turf.hexGrid(bbox, data.cellSize, data.options);
  } else if (data.gridType == 'triangle') {
    return grid = turf.triangleGrid(bbox, data.cellSize, data.options);
  }

}


function renderMap() {

  setHeight();

  mapboxgl.accessToken = 'pk.eyJ1Ijoiam9obmNsYXJ5IiwiYSI6ImNqbjhkZ25vcjF2eTMzbG52dGRlbnVqOHAifQ.y1xhnHxbB6KlpQgTp1g1Ow';

  var mapOptions = {
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      center : [-97.74, 30.275],
      zoom : 13,
      minZoom : 1,
      maxZoom : 19
  };

  // init map
  var map = new mapboxgl.Map(mapOptions);

  // add nav
  var nav = new mapboxgl.NavigationControl();

  map.addControl(nav, 'top-left');

  map.on('load', function() {
      
    // add drawing
    var drawOptions = {
        displayControlsDefault: false,
        controls : {
          polygon: true
        }
    }

    var Draw = new MapboxDraw(drawOptions);

    map.addControl(Draw, 'top-left');


    map.on('draw.create', function (e) {

      $("#create-button").attr("class", "btn btn-primary").click(function() {

        var inputs = getData();
        
        if (!inputs.cellSize) {        
          return;
        }

        showLoader();

        var layer = e.features[0].geometry;

        var grid = createGrid(inputs, layer);          

        if (inputs.renderMap == 'true') {
          if (first) {
            addLayer(map, grid);
          } else {
            updateMap(map, grid);
            showLayer(map, "grid", true)
          }
          
          map.fitBounds(turf.bbox(layer));

        }

        downloadable(grid);

        $("#form-row").hide();

        $("#download-row").show();

        $("#create-button").attr("class", "btn btn-secondary disabled");

        Draw.deleteAll();

        hideLoader();

        first = false;

        $("#reset-button").click(function (){
          $("#create-button").attr("class", "btn btn-secondary disabled");

          showLayer(map, "grid", false)

          $("#form-row").show();

          $("#download-row").hide();

        })

      });

    });

    setTooltip("button.mapbox-gl-draw_polygon", function(){
      $('[data-toggle="tooltip"]').tooltip()
    });

    $( "#clickme" ).click(function() {
      // show tooltip when "draw tool" href is clicked
      showTooltip();
    });

    $("button.mapbox-gl-draw_polygon" ).click(function() {
      // hide tooltipe when draw polygon button is clicked
      $(this).tooltip('hide');
    });

  });
  
}

function createGrid(inputs, layer) {
      
   var grid = generateGrid(inputs, turf.bbox(layer));

  return grid;
}

function addLayer(map, geojson) {
  map.addLayer({
    'id' : 'grid',
    'type': 'fill',
    'source': {
        'type' : 'geojson',
        'data' : geojson
    },
    'paint': {
        'fill-color' : 'blue',
        'fill-outline-color' : '#fff',
        'fill-opacity' : .4
    }
  });

}

function updateMap(map, geojson) {
  map.getSource('grid').setData(geojson);
}

function downloadable(grid) {

  var url = URL.createObjectURL( new Blob( [JSON.stringify(grid)], {type:'text/plain'} ) )
  var fname = "grid.json";
  
  $("#downloadAnchor").attr("href", url).attr("download", fname);

}


function setTooltip(selector, callback) {
  $(selector)
    .attr("data-toggle", "tooltip")
    .attr("data-placement", "right")
    .attr("title", "Click here to start drawing a bounding box");

  callback();
}

function showTooltip(selector="button.mapbox-gl-draw_polygon") {
  $(selector).tooltip('show');

}

function showLoader(divId="dataPane") {
    var html = '<p class="loader">Loading...</p>';
    $("#" + divId).append(html);
}

function hideLoader(divId="dataPane") {
    $(".loader").remove();
}


function showLayer(map, layer_name, show_layer) {

    if (!show_layer) {
        map.setLayoutProperty(layer_name, 'visibility', 'none');
        this.className = '';
    } else {
        this.className = 'active';
        map.setLayoutProperty(layer_name, 'visibility', 'visible');
    }
}
