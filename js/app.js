function EvoAppCtrl($scope) {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.showParameters = false;
  $scope.uploaderStyle = { opacity: '0.4' };
  $scope.exporterStyle = { opacity: '0.4' };
  $scope.showControl = function(style) {
    style.opacity = '1.0';
  };
  $scope.hideControl = function(style) {
    if (CHOSEN_FILE_ENTRY)
      style.opacity = '0.0';
    else
      style.opacity = '0.4';
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.chooseFileText = chrome.i18n.getMessage("chooseFile");
  $scope.fitnessText = chrome.i18n.getMessage("fitness");
  $scope.improvementsText = chrome.i18n.getMessage("improvements");
  $scope.mutationsText = chrome.i18n.getMessage('mutations');
  $scope.startText = chrome.i18n.getMessage('start');
  $scope.stopText = chrome.i18n.getMessage('stop');
  $scope.elapsedTimeText = chrome.i18n.getMessage('elapsedTime');
  $scope.mutationsPerSecondText = chrome.i18n.getMessage('mutationsPerSecond');
  $scope.exportDnaText = chrome.i18n.getMessage('exportDna');
  $scope.exportSvgText = chrome.i18n.getMessage('exportSvg');
  $scope.savePngText = chrome.i18n.getMessage('savePng');
  $scope.importDnaText = chrome.i18n.getMessage('importDna');
  $scope.mutationText = chrome.i18n.getMessage('mutation');
  $scope.gaussianText = chrome.i18n.getMessage('gaussian');
  $scope.softText = chrome.i18n.getMessage('soft');
  $scope.mediumText = chrome.i18n.getMessage('medium');
  $scope.hardText = chrome.i18n.getMessage('hard');
  $scope.initializeDnaText = chrome.i18n.getMessage('initializeDna');
  $scope.colourText = chrome.i18n.getMessage('colour');
  $scope.whiteText = chrome.i18n.getMessage('white');
  $scope.blackText = chrome.i18n.getMessage('black');
  $scope.polygonsText = chrome.i18n.getMessage('polygons');
  $scope.verticesText = chrome.i18n.getMessage('vertices');

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.stop = function() {
    clearTimeout(EV_ID);

    ELAPSED_TIME += Util.get_timestamp() - LAST_START;

    Util.hide('stop');
    Util.show('start');
  };

  $scope.start = function () {
    EV_ID = setInterval(evolve, EV_TIMEOUT);

    LAST_START = Util.get_timestamp();
    LAST_COUNTER = COUNTER_TOTAL;

    Util.hide('start');
    Util.show('stop');
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.setPolygons = function() {
    if (isNaN($scope.polygons))
      return;
    poly = Util.clamp($scope.polygons, 1, 1000);
    setPolygons(poly);
  };

  $scope.setVertices = function() {
    if (isNaN($scope.vertices))
      return;
    vert = Util.clamp($scope.vertices, 3, 1000);
    setVertices(vert);
  };
  $scope.setMutation = setMutation;
  $scope.setDnaRandom = setDnaRandom;
  $scope.setDnaColor = setDnaColor;
  $scope.set_image = set_image;

  $scope.import_dna = function() {
    import_dna($scope.exportingText);
  };

  $scope.export_dna = function () {
    $scope.exportingText = serializeDNA(DNA_BEST);
  };

  $scope.save_dna_as_svg = function() {
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

  $scope.savePng = function() {
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
      $scope.dropText = chrome.i18n.getMessage('loadFileFailure');
    }
    else {
      CHOSEN_FILE_ENTRY.file(function(file) {
        $scope.set_image(window.URL.createObjectURL(file));
      });

      $scope.dropText = chrome.i18n.getMessage('loadFileSuccess');
    }
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  $scope.chooseFile = function() {
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
      loadFileEntry();
    });
  };

  $scope.dropText = chrome.i18n.getMessage('dragImagePrompt');

  var dragOver = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var valid = e.dataTransfer && e.dataTransfer.types
          && (e.dataTransfer.types.indexOf('Files') >= 0);
    $scope.$apply(function() {
      $scope.dropText = valid ?
        chrome.i18n.getMessage('dragImageValid')
        : chrome.i18n.getMessage('dragImageInvalid');
      $scope.dropClass = valid ? "dragging" : "invalid-dragging";
    });
  };

  var dragLeave = function(e) {
    $scope.$apply(function() {
      $scope.dropText = chrome.i18n.getMessage('dragImagePrompt');
      $scope.dropClass = '';
    });
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

    $scope.$apply(function() {
      $scope.dropText = chrome.i18n.getMessage('dragImagePrompt');
      $scope.dropClass =  '';
    });
  };

  document.body.addEventListener("dragover", dragOver, false);
  document.body.addEventListener("dragleave", dragLeave, false);
  document.body.addEventListener("drop", drop, false);

  $scope.close = function() {
    window.close();
  };

  init();
};
