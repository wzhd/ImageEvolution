angular.module('EvoApp', []).controller('EvoAppCtrl', function() {

  this.showParameters = false;
  this.uploaderStyle = { opacity: '0.4' };
  this.exporterStyle = { opacity: '0.4' };
  this.showControl = function(style) {
    style.opacity = '1.0';
  };
  this.hideControl = function(style) {
    if (CHOSEN_FILE_ENTRY)
      style.opacity = '0.0';
    else
      style.opacity = '0.4';
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  this.chooseFileText = chrome.i18n.getMessage('chooseFile');
  this.dropText = chrome.i18n.getMessage('dragImagePrompt');
  this.fitnessText = chrome.i18n.getMessage('fitness');
  this.improvementsText = chrome.i18n.getMessage('improvements');
  this.mutationsText = chrome.i18n.getMessage('mutations');
  this.startText = chrome.i18n.getMessage('start');
  this.stopText = chrome.i18n.getMessage('stop');
  this.elapsedTimeText = chrome.i18n.getMessage('elapsedTime');
  this.mutationsPerSecondText = chrome.i18n.getMessage('mutationsPerSecond');
  this.exportDnaText = chrome.i18n.getMessage('exportDna');
  this.exportSvgText = chrome.i18n.getMessage('exportSvg');
  this.savePngText = chrome.i18n.getMessage('savePng');
  this.importDnaText = chrome.i18n.getMessage('importDna');
  this.mutationText = chrome.i18n.getMessage('mutation');
  this.gaussianText = chrome.i18n.getMessage('gaussian');
  this.softText = chrome.i18n.getMessage('soft');
  this.mediumText = chrome.i18n.getMessage('medium');
  this.hardText = chrome.i18n.getMessage('hard');
  this.initializeDnaText = chrome.i18n.getMessage('initializeDna');
  this.colourText = chrome.i18n.getMessage('colour');
  this.whiteText = chrome.i18n.getMessage('white');
  this.blackText = chrome.i18n.getMessage('black');
  this.polygonsText = chrome.i18n.getMessage('polygons');
  this.verticesText = chrome.i18n.getMessage('vertices');

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  this.stop = function() {
    clearTimeout(EV_ID);

    ELAPSED_TIME += Util.get_timestamp() - LAST_START;

    Util.hide('stop');
    Util.show('start');
  };

  this.start = function() {
    EV_ID = setInterval(evolve, EV_TIMEOUT);

    LAST_START = Util.get_timestamp();
    LAST_COUNTER = COUNTER_TOTAL;

    Util.hide('start');
    Util.show('stop');
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  this.setPolygons = function() {
    if (isNaN(this.polygons))
      return;
    poly = Util.clamp(this.polygons, 1, 1000);
    setPolygons(poly);
  };

  this.setVertices = function() {
    if (isNaN(this.vertices))
      return;
    vert = Util.clamp(this.vertices, 3, 1000);
    setVertices(vert);
  };
  this.setMutation = setMutation;
  this.setDnaRandom = setDnaRandom;
  this.setDnaColor = setDnaColor;

  this.import_dna = function() {
    import_dna(this.exportingText);
  };

  this.export_dna = function() {
    this.exportingText = serializeDNA(DNA_BEST);
  };

  this.save_dna_as_svg = function() {
    var blob = new Blob([serializeDNAasSVG(DNA_BEST)]);
    var name = 'image.svg';
    if (CHOSEN_FILE_ENTRY) {
      name = CHOSEN_FILE_ENTRY.name;
      name = name.substr(0, name.lastIndexOf('.'));
      name = name + '.svg';
    }
    var config = {type: 'saveFile', suggestedName: name};
    chrome.fileSystem.chooseEntry(config, function(writableEntry) {
      writeFileEntry(writableEntry, blob, function(e) {});
    });
  };

  this.savePng = function() {
    var blob = Util.dataUriToBlob(CANVAS_TEST.toDataURL());
    var name = 'image.png';
    if (CHOSEN_FILE_ENTRY) {
      name = CHOSEN_FILE_ENTRY.name;
      name = name.substr(0, name.lastIndexOf('.'));
      name = name + '.png';
    }
    var config = {type: 'saveFile', suggestedName: name};
    chrome.fileSystem.chooseEntry(config, function(writableEntry) {
      writeFileEntry(writableEntry, blob, function(e) {});
    });
  };

  function writeFileEntry(writableEntry, blob, callback) {
    if (!writableEntry) {
      console.log('Nothing selected.');
      return;
    }

    writableEntry.createWriter(function(writer) {

      writer.onerror = Util.errorHandler;
      writer.onwriteend = callback;

      if (blob) {
        writer.truncate(blob.size);
        waitForIO(writer, function() {
          writer.seek(0);
          writer.write(blob);
        });
      }

    }, Util.errorHandler);
  }

  function waitForIO(writer, callback) {
    // set a watchdog to avoid eventual locking:
    var start = Date.now();
    // wait for a few seconds
    var reentrant = function() {
      if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
        setTimeout(reentrant, 100);
        return;
      }
      if (writer.readyState === writer.WRITING) {
        console.error('Write operation taking too long, aborting!' +
                      ' (current writer readyState is ' +
                      writer.readyState + ')');
        writer.abort();
      } else {
        callback();
      }
    };
    setTimeout(reentrant, 100);
  }

  function loadFileEntry() {
    if (!CHOSEN_FILE_ENTRY) {
      console.log('Sorry, could not load file');
    }
    else {
      CHOSEN_FILE_ENTRY.file(function(file) {
        set_image(window.URL.createObjectURL(file));
      });

      console.log('Image file loaded');
    }
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  this.chooseFile = function() {
    var accepts = [{
      mimeTypes: ['image/*'],
      extensions: ['jpeg', 'png']
    }];
    chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(readOnlyEntry) {
      if (!readOnlyEntry) {
        return;
      }
      try { // TODO remove try once retain is in stable.
        chrome.storage.local.set(
          {'chosenFile': chrome.fileSystem.retainEntry(readOnlyEntry)});
      } catch (e) {}
      CHOSEN_FILE_ENTRY = readOnlyEntry;
      loadFileEntry(CHOSEN_FILE_ENTRY);
    });
  };

  var dragOver = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var valid = e.dataTransfer && e.dataTransfer.types
          && (e.dataTransfer.types.indexOf('Files') >= 0);
    if (valid) {
        console.log('valid image');
      }
      else {
        console.log('invalid image');
      }
  };

  var drop = function(e) {
    e.preventDefault();
    e.stopPropagation();

    var data = e.dataTransfer;

    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      if (item.kind == 'file' &&
          item.type.match('image/*') &&
          item.webkitGetAsEntry()) {
        CHOSEN_FILE_ENTRY = item.webkitGetAsEntry();
        break;
      }
    }

    loadFileEntry(CHOSEN_FILE_ENTRY);
  };

  document.body.addEventListener("dragover", dragOver, false);
  document.body.addEventListener("drop", drop, false);

  this.close = function() {
    window.close();
  };

  init();
});
