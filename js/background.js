chrome.app.runtime.onLaunched.addListener(function(){
  runApp();
});

chrome.app.runtime.onRestarted.addListener(function(){
  runApp();
});

var runApp = function() {
  chrome.app.window.create(
    'evolve.html',
    {
      id: 'mainwindow',
      'bounds': {
        'width': 822,
        'height': 477
      },
      frame: 'none'
    }
  );
};