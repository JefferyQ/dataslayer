/* global chrome, browser */

var browserInterface = chrome || browser || undefined;

browserInterface.devtools.panels.create(
  'dataslayer' +
    (browserInterface.runtime.id === 'ikbablmmjldhamhcldjjigniffkkjgpo'
      ? ''
      : ' beta'),
  'i128.png',
  'index.html',
  null // no callback needed
);
