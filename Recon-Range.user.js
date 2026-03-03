// ==UserScript==
// @author         morph
// @name           IITC plugin: Recon portal submission range
// @category       Layer
// @version        0.2.1
// @description    Add a 20m range around portals and drawn markers, to aid Recon portals submissions
// @id             wayfarer-range
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://iitc.app/build/release/plugins/wayfarer-range.meta.js
// @downloadURL    https://iitc.app/build/release/plugins/wayfarer-range.user.js
// @match          https://intel.ingress.com/*
// @match          https://intel-x.ingress.com/*
// @icon           https://iitc.app/extras/plugin-icons/wayfarer-range.svg
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'release';
plugin_info.dateTimeVersion = '2026-03-03-104055';
plugin_info.pluginId = 'wayfarer-range';
//END PLUGIN AUTHORS NOTE

/* exported setup, changelog --eslint */
/* global L -- eslint */

var changelog = [
  {
    version: '0.2.1',
    changes: ['Rename user-facing labels to Recon', 'Show 20m circles as solid outline only (no fill)'],
  },
  {
    version: '0.2.0',
    changes: ['Hook into draw-tools to show ranges for drawn markers'],
  },
  {
    version: '0.1.0',
    changes: ['Initial release (code heavily based on zaprange)'],
  },
];

// use own namespace for plugin
window.plugin.wayfarerrange = function () {};
window.plugin.wayfarerrange.portalLayers = {};
window.plugin.wayfarerrange.markerLayers = {};
window.plugin.wayfarerrange.drawToolsInited = false;
window.plugin.wayfarerrange.drawToolsInitTimer = null;
window.plugin.wayfarerrange.MIN_MAP_ZOOM = 16;
window.plugin.wayfarerrange.LAYER_NAME = 'Recon Range';

window.plugin.wayfarerrange.CIRCLE_OPTIONS = {
  color: 'orange',
  opacity: 0.7,
  fill: false,
  weight: 1,
  interactive: false,
};
window.plugin.wayfarerrange.RANGE_METERS = 20; // submitting a portal closer than 20m to another one, wont make it appear on the map

window.plugin.wayfarerrange.portalAdded = function (data) {
  data.portal.on('add', function () {
    window.plugin.wayfarerrange.draw(this.options.guid, this.options.team);
  });

  data.portal.on('remove', function () {
    window.plugin.wayfarerrange.removePortal(this.options.guid);
  });
};

window.plugin.wayfarerrange.removePortal = function (guid) {
  const previousLayer = window.plugin.wayfarerrange.portalLayers[guid];
  if (previousLayer) {
    window.plugin.wayfarerrange.wayfarerCircleHolderGroup.removeLayer(previousLayer);
    delete window.plugin.wayfarerrange.portalLayers[guid];
  }
};

window.plugin.wayfarerrange.removeMarker = function (layerId) {
  const previousLayer = window.plugin.wayfarerrange.markerLayers[layerId];
  if (previousLayer) {
    window.plugin.wayfarerrange.wayfarerCircleHolderGroup.removeLayer(previousLayer);
    delete window.plugin.wayfarerrange.markerLayers[layerId];
  }
};

window.plugin.wayfarerrange.draw = function (guid) {
  var d = window.portals[guid];
  var coo = d.getLatLng();
  var latlng = new L.LatLng(coo.lat, coo.lng); // L.LatLng is deprecated, but used by portal.getLatLng()

  var circle = new L.Circle(latlng, window.plugin.wayfarerrange.RANGE_METERS, window.plugin.wayfarerrange.CIRCLE_OPTIONS);

  circle.addTo(window.plugin.wayfarerrange.wayfarerCircleHolderGroup);
  window.plugin.wayfarerrange.portalLayers[guid] = circle;
};

window.plugin.wayfarerrange.drawMarker = function (layerId) {
  // Use the marker's internal Leaflet ID to retrieve it
  var marker = window.plugin.drawTools.drawnItems.getLayer(layerId);
  if (!marker) {
    return;
  }

  var latlng = marker.getLatLng();

  var circle = new L.Circle(latlng, window.plugin.wayfarerrange.RANGE_METERS, window.plugin.wayfarerrange.CIRCLE_OPTIONS);

  circle.addTo(window.plugin.wayfarerrange.wayfarerCircleHolderGroup);
  window.plugin.wayfarerrange.markerLayers[layerId] = circle;
};

window.plugin.wayfarerrange.setupWayfarerForMarker = function (marker) {
  var layerId = L.stamp(marker); // L.stamp gets the unique Leaflet ID for a layer
  window.plugin.wayfarerrange.drawMarker(layerId);

  // Prevent duplicate event handlers when circles are recreated.
  if (marker._wayfarerRangeBound) {
    return;
  }
  marker._wayfarerRangeBound = true;

  // Set up a listener to remove the circle when the marker is deleted
  marker.on('remove', function () {
    window.plugin.wayfarerrange.removeMarker(layerId);
  });

  // Set up listener for real-time circle updates during drag
  marker.on('drag', function () {
    var circle = window.plugin.wayfarerrange.markerLayers[layerId];
    if (circle) {
      circle.setLatLng(this.getLatLng());
    }
  });
};

window.plugin.wayfarerrange.showOrHide = function () {
  if (window.map.getZoom() >= window.plugin.wayfarerrange.MIN_MAP_ZOOM) {
    // show the layer
    if (!window.plugin.wayfarerrange.wayfarerLayerHolderGroup.hasLayer(window.plugin.wayfarerrange.wayfarerCircleHolderGroup)) {
      window.plugin.wayfarerrange.wayfarerLayerHolderGroup.addLayer(window.plugin.wayfarerrange.wayfarerCircleHolderGroup);
      $('.leaflet-control-layers-list span:contains("' + window.plugin.wayfarerrange.LAYER_NAME + '")').parent('label').removeClass('disabled').attr('title', '');
    }
  } else {
    // hide the layer
    if (window.plugin.wayfarerrange.wayfarerLayerHolderGroup.hasLayer(window.plugin.wayfarerrange.wayfarerCircleHolderGroup)) {
      window.plugin.wayfarerrange.wayfarerLayerHolderGroup.removeLayer(window.plugin.wayfarerrange.wayfarerCircleHolderGroup);
      $('.leaflet-control-layers-list span:contains("' + window.plugin.wayfarerrange.LAYER_NAME + '")').parent('label').addClass('disabled').attr('title', 'Zoom in to show those.');
    }
  }
};

window.plugin.wayfarerrange.initDrawToolsIntegration = function () {
  if (window.plugin.wayfarerrange.drawToolsInited) {
    return true;
  }
  if (!window.plugin.drawTools || !window.plugin.drawTools.drawnItems) {
    return false;
  }

  // Sync function that only updates changed markers.
  const syncDrawnMarkers = function (forceRecreate = false) {
    const currentMarkers = new Set();

    // Collect all current marker IDs.
    window.plugin.drawTools.drawnItems.eachLayer(function (layer) {
      if (layer instanceof L.Marker) {
        const layerId = L.stamp(layer);
        currentMarkers.add(layerId);

        // Add circle if not already present, or force recreate.
        if (!window.plugin.wayfarerrange.markerLayers[layerId] || forceRecreate) {
          if (forceRecreate) {
            window.plugin.wayfarerrange.removeMarker(layerId);
          }
          window.plugin.wayfarerrange.setupWayfarerForMarker(layer);
        }
      }
    });

    // Remove circles for markers that no longer exist.
    for (const layerId in window.plugin.wayfarerrange.markerLayers) {
      if (!currentMarkers.has(Number(layerId))) {
        window.plugin.wayfarerrange.removeMarker(layerId);
      }
    }
  };

  window.addHook('pluginDrawTools', function (e) {
    switch (e.event) {
      case 'layerCreated':
        // A new marker was drawn, add a circle just for it.
        if (e.layer instanceof L.Marker) {
          window.plugin.wayfarerrange.setupWayfarerForMarker(e.layer);
        }
        break;
      case 'layersEdited':
        // Marker drag updates are handled by per-marker drag listeners.
        break;
      case 'layersSnappedToPortals':
        // When markers are snapped to portals, force recreate all circles.
        syncDrawnMarkers(true);
        break;
      case 'import':
      case 'layersDeleted':
      case 'clear':
        // Sync only updates what's changed.
        syncDrawnMarkers();
        break;
    }
  });

  // Initial sync for any markers that were loaded before this plugin.
  syncDrawnMarkers();
  window.plugin.wayfarerrange.drawToolsInited = true;
  return true;
};

var setup = function () {
  // this layer is added to the layer chooser, to be toggled on/off
  window.plugin.wayfarerrange.wayfarerLayerHolderGroup = new L.LayerGroup();
  window.layerChooser.addOverlay(window.plugin.wayfarerrange.wayfarerLayerHolderGroup, window.plugin.wayfarerrange.LAYER_NAME);

  // this layer is added into the above layer, and removed from it when we zoom out too far
  window.plugin.wayfarerrange.wayfarerCircleHolderGroup = new L.LayerGroup();
  window.plugin.wayfarerrange.wayfarerLayerHolderGroup.addLayer(window.plugin.wayfarerrange.wayfarerCircleHolderGroup);

  // --- Event Hooks ---

  // Hook for when portals are added to the map
  window.addHook('portalAdded', window.plugin.wayfarerrange.portalAdded);

  // Hook for zoom level changes to show/hide the layer
  window.map.on('zoomend', window.plugin.wayfarerrange.showOrHide);

  // Hook for draw-tools plugin events (supports delayed draw-tools load).
  window.plugin.wayfarerrange.initDrawToolsIntegration();
  if (!window.plugin.wayfarerrange.drawToolsInited) {
    let attempts = 0;
    window.plugin.wayfarerrange.drawToolsInitTimer = setInterval(function () {
      attempts++;
      if (window.plugin.wayfarerrange.initDrawToolsIntegration() || attempts >= 120) {
        clearInterval(window.plugin.wayfarerrange.drawToolsInitTimer);
        window.plugin.wayfarerrange.drawToolsInitTimer = null;
      }
    }, 1000);
  }

  // --- Initial State ---
  // Set the initial visibility of the layer based on the current zoom.
  window.plugin.wayfarerrange.showOrHide();
};

setup.info = plugin_info; //add the script info data to the function as a property
if (typeof changelog !== 'undefined') setup.info.changelog = changelog;
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
