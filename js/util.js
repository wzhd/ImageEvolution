// a number of utility functions

var Util = Util || {};

// DOM manipulation
Util.hide = function(id) {
  var el = document.getElementById(id);
  if (el)
    el.style.display = 'none';
};

Util.show = function(id) {
  var el = document.getElementById(id);
  if (el)
    el.style.display = 'block';
};

Util.setElement = function(id, value) {
  var el = document.getElementById(id);
  if (el)
    el.innerHTML = value;
};

Util.setButtonHighlight = function(highlighted, others) {
  for (var i in others) {
    var el = document.getElementById(others[i]);
    if (el) {
      el.style.color = 'white';
      el.style.background = 'black';
    }
  }
  var elHighighted = document.getElementById(highlighted);
  if (elHighighted) {
    elHighighted.style.color = 'white';
    elHighighted.style.background = 'orange';
  }
};

// Numbers
Util.rand_int = function(maxval) {
  return Math.round(maxval * Math.random());
};

Util.rand_float = function(maxval) {
  return maxval * Math.random();
};

Util.clamp = function(val, minval, maxval) {
  if (val < minval) return minval;
  if (val > maxval) return maxval;
  return val;
};

// error handler
Util.errorHandler = function(e) {
  console.error(e);
};

// data
Util.dataUriToBlob = function(dataURI) {
  // adapted from:
  // http://stackoverflow.com/questions/6431281/save-png-canvas-image-to-html5-storage-javascript

  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], { 'type': mimeString });
  return blob;
};

//time
Util.get_timestamp = function() {
  return 0.001 * (new Date).getTime();
}
